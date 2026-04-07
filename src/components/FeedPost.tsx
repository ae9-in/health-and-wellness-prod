import { useState, useEffect, useMemo } from 'react';
import { Post } from '@/lib/types';
import { togglePostLike, toggleSavePost, addComment, deleteComment, reportComment, API_BASE as API_URL } from '@/lib/api';
import { BLOCKLIST_WORDS } from '@/lib/blocklist';
import { resolveImageUrl } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Play, Check, Heart as HeartFilled, ShoppingCart, 
  ExternalLink, ArrowRight, ShieldCheck, Crown, Star, 
  Zap, Trophy, Sparkles, BookOpen, Quote, Video, FileText, Trash2, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedPostProps {
  post: Post;
  onSelect?: (post: Post) => void;
  initialShowComments?: boolean;
  pageSource?: 'feed' | 'discussion';
}

export default function FeedPost({ post, onSelect, initialShowComments, pageSource = 'feed' }: FeedPostProps) {
  const { user, token } = useAuth();

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    try {
      await deleteComment(token, post.id, commentId);
      toast.success('Comment removed');
      setLocalComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(user ? (post as any).savedUsers?.includes(user.id) : false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'warning', message: string } | null>(null);
  const [localComments, setLocalComments] = useState(post.comments);
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set());
  
  // Sync state when post prop changes (e.g. from a parent re-fetch)
  useEffect(() => {
    setIsLiked(user ? post.likes.includes(user.id) : false);
    setLikesCount(post.likes.length);
    setIsSaved(user ? (post as any).savedUsers?.includes(user.id) : false);
    setLocalComments(post.comments);
  }, [post, user]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Hide broken images instead of swapping in a dummy photo
    e.currentTarget.style.display = 'none';
  };

  const handleLike = async () => {
    if (!user || !token) { toast.error('Please log in to like'); return; }
    try {
      const { liked } = await togglePostLike(token, post.id);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } catch { toast.error('Failed to like post'); }
  };

  const handleSave = async () => {
    if (!user || !token) { toast.error('Please log in to save'); return; }
    try {
      const { saved } = await toggleSavePost(token, post.id);
      setIsSaved(saved);
      toast.success(saved ? 'Secured in your Wellness Vault!' : 'Removed from Saved');
    } catch { toast.error('Failed to save post'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
    toast.success('Share link ready! Copied to clipboard.');
  };

  // Build the blocklist regex on the fly (case insensitive, full array of ~2000 words)
  const BLOCKLIST_REGEX = useMemo(() => new RegExp(BLOCKLIST_WORDS.join('|'), 'i'), []);

  const handleComment = async () => {
    if (!user || !token) { toast.error('Please log in to comment'); return; }
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    // Client-side blocklist check — instant rejection before API call
    if (BLOCKLIST_REGEX.test(trimmedComment)) {
      setFeedback({ 
        type: 'error', 
        message: 'Please keep the conversation respectful.' 
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const comment = await addComment(token, post.id, trimmedComment, pageSource);
      setLocalComments(prev => {
        if (prev.some(c => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      setNewComment('');
      setFeedback({ type: 'success', message: 'Comment shared successfully!' });
      setTimeout(() => setFeedback(null), 2500);
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('respectful') || msg.includes('inappropriate')) {
        setFeedback({ 
          type: 'error', 
          message: 'Please keep the conversation respectful.' 
        });
      } else if (msg.includes('too fast') || msg.includes('slow down')) {
        setFeedback({ 
          type: 'warning', 
          message: "You're commenting too fast. Please slow down." 
        });
      } else {
        setFeedback({ 
          type: 'warning', 
          message: "We couldn't post your comment right now. Please try again shortly." 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!user || !token) { toast.error('Please log in to report'); return; }
    try {
      await reportComment(token, post.id, commentId);
      setReportedComments(prev => new Set(prev).add(commentId));
      toast.success('Comment reported. Thank you for keeping the community safe.');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('already reported')) {
        setReportedComments(prev => new Set(prev).add(commentId));
        toast.info('You have already reported this comment');
      } else if (msg.includes('own comment')) {
        toast.error('You cannot report your own comment');
      } else {
        toast.error('Failed to report comment');
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-100 shadow-sm"><Crown className="h-2.5 w-2.5" /> health&wellness Staff</div>;
      case 'EXPERT': return <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-emerald-100 shadow-sm"><ShieldCheck className="h-2.5 w-2.5" /> Certified Expert</div>;
      case 'BRAND': return <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-blue-100 shadow-sm"><Star className="h-2.5 w-2.5" /> Brand Partner</div>;
      case 'AFFILIATE': return <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-purple-100 shadow-sm"><Zap className="h-2.5 w-2.5" /> Wellness Guide</div>;
      default: return null;
    }
  };

  const getPostTypeStyle = () => {
    switch (post.postType) {
      case 'SUCCESS_STORY': return 'border-l-4 border-l-emerald-500 bg-emerald-50/10';
      case 'SHORT_TIP': return 'border-l-4 border-l-purple-500 bg-purple-50/10';
      case 'PRODUCT_REVIEW': return 'border-l-4 border-l-amber-500 bg-amber-50/10';
      case 'VIDEO': return 'border-l-4 border-l-blue-500 bg-blue-50/10';
      default: return 'border-l-4 border-l-primary/20';
    }
  };

  const getTypeIcon = () => {
    switch (post.postType) {
      case 'SUCCESS_STORY': return <Trophy className="h-4 w-4 text-emerald-500" />;
      case 'SHORT_TIP': return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'PRODUCT_REVIEW': return <ShoppingCart className="h-4 w-4 text-amber-500" />;
      case 'VIDEO': return <Video className="h-4 w-4 text-blue-500" />;
      case 'ARTICLE': return <BookOpen className="h-4 w-4 text-primary" />;
      default: return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100/80 overflow-hidden mb-8 w-full transition-all hover:shadow-xl hover:-translate-y-1 hover:shadow-slate-200/50 group ${getPostTypeStyle()}`}
      onClick={() => onSelect?.(post)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-3xl bg-slate-100 overflow-hidden border-2 border-white shadow-md relative">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=random&color=fff`} className="w-full h-full object-cover" alt={post.authorName} />
             {post.authorRole !== 'USER' && (
               <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
               </div>
             )}
          </div>
          <div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 leading-tight">{post.authorName}</h4>
                {getRoleBadge(post.authorRole)}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                {getTypeIcon()}
                {post.postType.replace('_', ' ')} • {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(user?.id === post.authorId || user?.role === 'ADMIN') && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toast('Are you sure you want to delete this post?', {
                  action: {
                    label: 'Delete',
                    onClick: async () => {
                      try {
                        if (!token) return;
                        await import('@/lib/api').then(m => m.deletePost(token, post.id));
                        toast.success('Post deleted successfully');
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to delete post');
                      }
                    }
                  },
                  cancel: { label: 'Cancel', onClick: () => {} }
                });
              }}
              className="h-10 w-10 flex items-center justify-center text-red-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
              title="Delete Post"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>


      {/* Main Content Title */}
      <div className="px-8 pb-4">
        <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h3>
      </div>

      {/* Media Content */}
      <div className="px-4">
        <div className="relative rounded-[2rem] overflow-hidden shadow-inner bg-slate-50">
          {post.images && post.images.length > 0 ? (
            <div className={`grid gap-1 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="relative overflow-hidden aspect-video group/img">
                  <img 
                    src={resolveImageUrl(img)} 
                    alt={`Post image ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={handleImageError}
                  />
                  {idx === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-2xl">
                      +{post.images.length - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}



          {post.videoUrl && !post.images?.length && (
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center group/vid cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <video 
                controls
                playsInline
                className="w-full h-full object-cover opacity-90 group-hover/vid:opacity-100 transition-opacity"
              >
                <source src={resolveImageUrl(post.videoUrl)} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Category Tag Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-sm border border-white/50 border-t-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A2E05]">{post.category}</span>
          </div>
        </div>
      </div>

      {/* Description Body */}
      <div className="px-8 py-6">
        <div className="relative">
          {post.postType === 'SUCCESS_STORY' && <Quote className="absolute -top-4 -left-4 h-12 w-12 text-emerald-500/10 rotate-180" />}
          <p className="text-slate-600 text-[16px] leading-[1.65] mb-6 font-medium">
            {post.description}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {['wellness', 'morningroutine', post.category.toLowerCase().replace(' ', '')].map(tag => (
            <span key={tag} className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-black tracking-tight hover:bg-primary hover:text-white transition-all cursor-pointer">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Interactions */}
      <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100/50">
        <div className="flex items-center justify-between mb-6">
           <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                  <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="h-8 w-14 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm">
                 <span className="text-[10px] font-black text-slate-400">+{likesCount > 3 ? likesCount - 3 : 0}</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{post.comments.length} Shared Insights</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Premium Content</span>
           </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={(event) => { event.stopPropagation(); handleLike(); }} 
            className={`h-12 px-6 rounded-2xl gap-3 transition-all ${isLiked ? 'bg-red-50 text-red-600' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-600' : ''}`} />
            <span className="font-black text-xs uppercase tracking-widest">{isLiked ? 'Loved' : 'Love'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={(event) => { event.stopPropagation(); setShowComments(prev => !prev); }} 
            className={`h-12 px-6 rounded-2xl gap-3 bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all ${showComments ? 'border-primary text-primary' : ''}`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-black text-xs uppercase tracking-widest">Discuss</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(event) => { event.stopPropagation(); handleSave(); }} 
            className={`h-12 w-12 rounded-2xl transition-all ${isSaved ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-amber-600' : ''}`} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(event) => { event.stopPropagation(); handleShare(); }} 
            className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      </div>

      {/* Comment Engine */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="px-8 pb-8 bg-slate-50/50 border-t border-slate-100/50 overflow-hidden"
          >
            <div className="pt-8 space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
              {localComments.map(comment => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  key={comment.id} 
                  className="flex gap-4 group/comment"
                >
                  <div className="h-10 w-10 rounded-2xl bg-white shadow-sm shrink-0 overflow-hidden border border-slate-100">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=random&color=fff`} className="w-full h-full object-cover" alt={comment.userName} />
                  </div>
                  <div className="flex-1">
                    <div className={`bg-white rounded-[1.5rem] px-5 py-4 border shadow-sm relative group-hover/comment:border-primary/20 transition-all ${
                      comment.status === 'hidden' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-[13px] text-[#1A2E05]">{comment.userName}</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                      {comment.status === 'hidden' ? (
                        <p className="text-sm text-amber-600 leading-relaxed font-medium italic">This comment is under review.</p>
                      ) : (
                        <p className="text-sm text-slate-600 leading-relaxed font-medium pr-16">{comment.commentText}</p>
                      )}
                      
                      {/* Action buttons: delete + report */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                        {/* Report button — visible for other users' comments */}
                        {user && user.id !== comment.userId && comment.status !== 'hidden' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReport(comment.id); }}
                            disabled={reportedComments.has(comment.id)}
                            className={`text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                              reportedComments.has(comment.id)
                                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-default'
                                : 'text-slate-400 hover:text-orange-600 bg-white hover:bg-orange-50 border-slate-100 shadow-sm'
                            }`}
                            title={reportedComments.has(comment.id) ? 'Already reported' : 'Report comment'}
                          >
                            <Flag className="h-3.5 w-3.5" />
                            {reportedComments.has(comment.id) ? 'Reported ✓' : 'Report'}
                          </button>
                        )}

                        {/* Delete button — visible for comment owner, post author, or admin */}
                        {(user?.id === comment.userId || user?.id === post.authorId || user?.role === 'ADMIN' || user?.fullName === comment.userName) && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-xl border border-slate-100 shadow-sm transition-all"
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {localComments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-slate-100 mx-auto mb-3" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No reflections yet. Share yours.</p>
                </div>
              )}
            </div>
            
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea 
                      placeholder="Write a comment..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      className="w-full rounded-2xl min-h-[100px] p-4 bg-white border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm resize-none text-sm transition-all"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button 
                      onClick={(event) => { event.stopPropagation(); handleComment(); }}
                      disabled={isSubmitting || !newComment.trim()}
                      className={`h-12 px-8 rounded-2xl font-bold bg-[#4F7153] hover:bg-[#3D5A41] text-white shadow-lg transition-all flex items-center justify-center min-w-[100px] ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="h-1.5 w-1.5 bg-white rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 bg-white rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 bg-white rounded-full" />
                        </div>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>

                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                      feedback.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {feedback.message}
                  </motion.div>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
