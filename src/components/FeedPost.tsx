import { useState } from 'react';
import { Post } from '@/lib/types';
import { togglePostLike, toggleSavePost, addComment, API_BASE as API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Play, Check, Heart as HeartFilled, ShoppingCart, 
  ExternalLink, ArrowRight, ShieldCheck, Crown, Star, 
  Zap, Trophy, Sparkles, BookOpen, Quote, Video, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const getFallbackImage = (category: string) => {
  const fallbacks: Record<string, string> = {
    'Mental Health': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
    'Nutrition': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800',
    'Fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfe09ce14?auto=format&fit=crop&q=80&w=800',
    'Sleep': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=800',
    'Ayurveda': 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=800',
  };
  return fallbacks[category] || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800';
};

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const { user, token } = useAuth();
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(user ? (post as any).savedUsers?.includes(user.id) : false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const baseUrl = API_URL.replace('/api', '');

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const fallback = getFallbackImage(post.category);
    if (target.src !== fallback) {
      target.src = fallback;
    }
  };

  const handleLike = async () => {
    if (!user || !token) { toast.error('Please log in to like'); return; }
    try {
      const { liked } = await togglePostLike(token, post.id);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
      if (liked) {
          // Trigger a small haptic-like bounce or confetti if it were more complex
      }
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

  const handleComment = async () => {
    if (!user || !token) { toast.error('Please log in to comment'); return; }
    if (!commentText.trim()) return;
    try {
      await addComment(token, post.id, commentText);
      setCommentText('');
      toast.success('Your insight has been shared!');
    } catch { toast.error('Failed to add comment'); }
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
      className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100/80 overflow-hidden mb-8 w-full transition-all hover:shadow-xl hover:shadow-slate-200/50 group ${getPostTypeStyle()}`}
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
        <button className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
          <MoreHorizontal className="h-6 w-6" />
        </button>
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
                    src={img.startsWith('/uploads/') ? `${baseUrl}${img}` : img} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
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
          ) : (!post.videoUrl) && (
            <div className="relative overflow-hidden aspect-[21/9]">
              <img 
                src={getFallbackImage(post.category)} 
                alt={`${post.category} fallback`} 
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          {post.videoUrl && !post.images?.length && (
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center group/vid cursor-pointer">
              <video className="w-full h-full object-cover opacity-90 group-hover/vid:opacity-100 transition-opacity">
                <source src={post.videoUrl.startsWith('/uploads/') ? `${baseUrl}${post.videoUrl}` : post.videoUrl} />
              </video>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 group-hover/vid:scale-110 group-hover/vid:bg-primary transition-all duration-500 shadow-2xl">
                  <Play className="h-10 w-10 text-white fill-white ml-1.5" />
                </div>
              </div>
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
              onClick={handleLike} 
              className={`h-12 px-6 rounded-2xl gap-3 transition-all ${isLiked ? 'bg-red-50 text-red-600' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-600' : ''}`} />
              <span className="font-black text-xs uppercase tracking-widest">{isLiked ? 'Loved' : 'Love'}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowComments(!showComments)} 
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
              onClick={handleSave} 
              className={`h-12 w-12 rounded-2xl transition-all ${isSaved ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-amber-600' : ''}`} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleShare} 
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
              {post.comments.map(comment => (
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
                    <div className="bg-white rounded-[1.5rem] px-5 py-4 border border-slate-100 shadow-sm relative group-hover/comment:border-primary/20 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black text-[13px] text-[#1A2E05]">{comment.userName}</p>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{comment.commentText}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {post.comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-slate-100 mx-auto mb-3" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No reflections yet. Share yours.</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex gap-3">
              <div className="flex-1 relative">
                <Input 
                  placeholder="Share your perspective..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  className="rounded-2xl h-14 bg-white border-slate-100 focus-visible:ring-primary pl-6 pr-12 shadow-sm"
                />
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-primary"
                  onClick={handleComment}
                >
                  <Zap className="h-5 w-5 fill-primary" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
