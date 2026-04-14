import { useAuth } from '@/lib/auth';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import NotificationPanel from '@/components/NotificationPanel';
import { getPosts, getSessions, getUserComments, deleteComment, getAIPlanHistory, updateAvatar } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Check, ArrowRight, ShoppingCart, Trash2, Camera, User, FileText, Download, X, Utensils, Dumbbell, Brain, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Post, UserCommentActivity } from '@/lib/types';
import MarkdownRenderer from '@/components/AIHealthAssistant/MarkdownRenderer';

type DiscussionEntry = {
  id: string;
  title: string;
  snippet: string;
  date: string;
  type: 'comment' | 'post';
};

export default function UserDashboard() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  // Queries
  const { data: posts = [] } = useQuery<Post[]>({ 
    queryKey: ['posts'], 
    queryFn: () => getPosts() 
  });
  const { data: sessions = [] } = useQuery({ 
    queryKey: ['sessions'], 
    queryFn: () => getSessions() 
  });
  const { data: recentComments = [] } = useQuery<UserCommentActivity[]>({
    queryKey: ['user-comments'],
    queryFn: () => getUserComments(token!),
    enabled: !!token,
  });
  const { data: planHistory = [] } = useQuery({
    queryKey: ['ai-plan-history'],
    queryFn: () => getAIPlanHistory(token!),
    enabled: !!token,
  });
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!token) return;
    try {
      await deleteComment(token, postId, commentId);
      toast.success('Comment removed');
      queryClient.invalidateQueries({ queryKey: ['user-comments'] });
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append('avatar', file);

    const promise = updateAvatar(token, formData);
    toast.promise(promise, {
      loading: 'Updating profile picture...',
      success: () => {
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        return 'Profile picture updated!';
      },
      error: 'Failed to upload avatar'
    });
  };

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'USER' && user.role !== 'ADMIN') return null;

  const userPosts = posts.filter(p => p.authorId === user.id);
  const registeredSessions = sessions.filter(s => s.registeredUsers?.includes(user.id));
  const commentEntries: DiscussionEntry[] = recentComments.map(comment => ({
    id: comment.id,
    title: comment.postTitle,
    snippet: comment.commentText,
    date: comment.createdAt,
    type: 'comment',
  }));
  const postEntries: DiscussionEntry[] = userPosts.map(post => ({
    id: post.id,
    title: post.title,
    snippet: post.description,
    date: post.createdAt,
    type: 'post',
  }));
  const discussionEntries = [...commentEntries, ...postEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentDiscussions = discussionEntries.slice(0, 3);

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('nutrition') || c.includes('diet')) return <Utensils className="h-5 w-5" />;
    if (c.includes('fitness') || c.includes('workout')) return <Dumbbell className="h-5 w-5" />;
    if (c.includes('mental') || c.includes('mind')) return <Brain className="h-5 w-5" />;
    if (c.includes('heart')) return <Heart className="h-5 w-5" />;
    return <Sparkles className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
          <div className="space-y-10">
            <div className="mb-4">
              <h1 className="font-display text-4xl font-bold mb-3 tracking-tight text-[#1A2E05]">Wellness Hub</h1>
              <p className="text-muted-foreground text-lg font-medium">Welcome back, <span className="text-foreground font-bold">{user.fullName}</span>.</p>
              {user.city && <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-2">📍 {user.city} {user.age && <span>• {user.age} years old</span>}</p>}
            </div>

            {/* Discover Products */}
            <div className="bg-[#1A2E05] text-white rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Curated Wellness Marketplace
                  </h3>
                  <p className="text-white/60 text-sm font-medium">Discover products verified by our clinical experts.</p>
                </div>
                <Button variant="secondary" className="rounded-xl font-bold h-12" asChild>
                  <Link to="/products">Browse Shop</Link>
                </Button>
              </div>
            </div>

            {/* Personal Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: MessageSquare, label: 'Discussion Posts', value: userPosts.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Calendar, label: 'Upcoming Sessions', value: registeredSessions.length, color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: Check, label: 'Active Member', value: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <motion.div 
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2rem] p-7 text-center border border-primary/5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-14 w-14 ${s.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 ${s.color}`}>
                    <s.icon className="h-8 w-8" />
                  </div>
                  <p className="text-3xl font-black mb-1">{s.value}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Activity Sections */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Recent Discussions
                </h3>
                <div className="space-y-4">
                  {recentDiscussions.map(entry => (
                    <div key={`${entry.type}-${entry.id}`} className="relative group">
                      <Link 
                        to={`/discussions`}
                        className="block p-4 rounded-xl bg-muted/20 border border-border/40 hover:bg-white hover:shadow-md transition-all group/link"
                      >
                        <p className="font-bold text-sm mb-1 line-clamp-1 group-hover/link:text-primary transition-colors">{entry.title}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-2">
                          {entry.type === 'comment' ? 'Commented' : 'Posted'} {new Date(entry.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {entry.snippet}
                        </p>
                      </Link>
                      {entry.type === 'comment' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const comment = recentComments.find(c => c.id === entry.id);
                            if (comment) handleDeleteComment(comment.postId, comment.id);
                          }}
                          className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all shadow-md border border-border/40 z-10"
                          title="Delete comment"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {recentDiscussions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-4">
                      No recent discussions yet. Start a conversation or reply to a post to see it here.
                    </p>
                  )}
                </div>
                <Button variant="link" className="mt-2 p-0 h-auto font-bold text-primary group" asChild>
                  <Link to="/discussions">Browse All Discussions <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" /> Booked Sessions
                </h3>
                <div className="space-y-4">
                  {registeredSessions.slice(0, 3).map(session => (
                    <div key={session.id} className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                      <p className="font-bold text-sm mb-1 line-clamp-1">{session.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {registeredSessions.length === 0 && <p className="text-sm text-muted-foreground italic py-4">No sessions booked yet.</p>}
                </div>
                <Button variant="link" className="mt-2 p-0 h-auto font-bold text-purple-600 group" asChild>
                  <Link to="/sessions">Find New Workshops <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <NotificationPanel />

            <div className="bg-[#1A2E05] text-white rounded-[2.5rem] p-8 border border-white/20 shadow-lg space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Member Snapshot</p>
              
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative group">
                  <div className="h-28 w-28 rounded-[2rem] bg-white/20 overflow-hidden border-2 border-white/10 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 opacity-40" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-[#1A2E05] rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-white transition-colors">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                  </label>
                </div>
                
                <div className="text-center">
                  <p className="font-bold text-xl">{user.fullName}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Verified Member</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {user.city && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Location</span>
                    <span className="font-bold">{user.city}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Total Posts</span>
                  <span className="font-bold">{userPosts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Plans Saved</span>
                  <span className="font-bold">{planHistory.length}</span>
                </div>
              </div>
            </div>

            {/* Plan History Quick View */}
            {planHistory.length > 0 && (
              <div className="bg-white rounded-[2.5rem] p-7 border border-primary/5 shadow-sm space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" /> My Wellness Plans
                </h4>
                <div className="space-y-3">
                  {planHistory.slice(0, 3).map((plan: any) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-800 opacity-60">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-bold line-clamp-1">Personalized Strategy</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-700" onClick={() => toast.info('View full plan detail coming soon!')}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-700" onClick={() => setSelectedPlan(plan)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* View Plan Modal */}
        <AnimatePresence>
          {selectedPlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPlan(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-[#FDFDFB] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-border/40 flex items-center justify-between bg-emerald-50/50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#1A2E05]">Your Wellness Strategy</h3>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                        Generated on {new Date(selectedPlan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="h-12 w-12 rounded-2xl bg-white text-slate-400 hover:text-destructive transition-colors flex items-center justify-center border border-border/40 shadow-sm"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  {/* Stats Recap */}
                  {selectedPlan.metrics && (
                    <div className="grid grid-cols-3 gap-4 p-6 bg-[#1A2E05] rounded-[2rem] text-white">
                      <div className="text-center border-r border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Age</p>
                        <p className="text-xl font-bold">{selectedPlan.metrics.age} years</p>
                      </div>
                      <div className="text-center border-r border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Weight</p>
                        <p className="text-xl font-bold">{selectedPlan.metrics.weight}kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Height</p>
                        <p className="text-xl font-bold">{selectedPlan.metrics.height}ft</p>
                      </div>
                    </div>
                  )}

                  {/* Plan Content */}
                  <div className="space-y-8">
                    {Array.isArray(selectedPlan.planData) && selectedPlan.planData.map((section: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            {getCategoryIcon(section.category)}
                          </div>
                          <h4 className="text-xl font-bold text-[#1A2E05]">{section.category}</h4>
                        </div>
                        <div className="pl-12">
                          <MarkdownRenderer content={section.content} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 border-t border-border/40 bg-muted/20 flex justify-end gap-4">
                  <Button variant="ghost" className="font-bold rounded-xl" onClick={() => setSelectedPlan(null)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
