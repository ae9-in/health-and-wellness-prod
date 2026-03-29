import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Post } from '@/lib/types';
import { getPosts, API_BASE as API_URL } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import { socket } from '@/lib/socket';
import { 
  Plus, 
  Loader2, 
  Filter, 
  X, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText,
  Sparkles, 
  Zap, 
  Trophy, 
  Heart, 
  MessageSquare, 
  Bookmark,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import FeedPost from '@/components/FeedPost';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreatePostModal from '@/components/CreatePostModal';
import CompactCreatePost from '@/components/CompactCreatePost';

export default function CommunityFeed() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPosts(category === 'all' ? undefined : category, search);
      setPosts(data || []);
    } catch (err) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  // Load posts when filters change
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Socket listeners - registered once, independent of filter state
  useEffect(() => {
    const handlePostCreated = (_newPost: Post) => {
      // Always do a full reload so we get fresh server data
      loadPosts();
    };

    const handlePostLiked = ({ postId, userId, liked }: { postId: string, userId: string, liked: boolean }) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const newLikes = liked ? [...p.likes, userId] : p.likes.filter(id => id !== userId);
        return { ...p, likes: newLikes };
      }));
    };

    const handlePostCommented = (comment: any) => {
      setPosts(prev => prev.map(p => p.id === comment.postId ? { ...p, comments: [...p.comments, comment] } : p));
    };

    socket.on('post:created', handlePostCreated);
    socket.on('post:liked', handlePostLiked);
    socket.on('post:commented', handlePostCommented);

    return () => {
      socket.off('post:created', handlePostCreated);
      socket.off('post:liked', handlePostLiked);
      socket.off('post:commented', handlePostCommented);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPost(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);


  return (
    <div className="min-h-screen bg-[#F9F5EE] flex flex-col font-sans selection:bg-primary/20">
      <Navbar />
      <div className="bg-[#F9F5EE]">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-[520px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles, tips, or experts..."
                className="h-12 w-full rounded-full border border-slate-200 bg-white px-10 text-sm focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 bg-[#F9F5EE]">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse gap-8 lg:flex-row lg:items-start lg:justify-center">
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-[700px] space-y-8">
                {/* Create Post Action Card - Compact Redesign */}
                {user && user.role !== 'USER' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    <CompactCreatePost onSuccess={loadPosts} />
                  </motion.div>
                )}

                <div className="lg:hidden">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setCategory('all')}
                      className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-2 rounded-full border-2 transition-all ${category === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500'}`}
                    >
                      Discover All
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-2 rounded-full border-2 transition-all ${category === cat ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posts Grid - Premium Columns */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/20" />
                    <div className="text-center">
                      <p className="text-[#1A2E05] font-black text-xl uppercase tracking-widest animate-pulse">Synchronizing Wellness Feed</p>
                      <p className="text-slate-400 text-sm font-medium mt-2 italic">Curating your customized timeline...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[700px] mx-auto space-y-6">
                    <AnimatePresence mode="popLayout">
                      {posts.map((post, i) => (
                        <motion.div 
                          key={post.id} 
                          layout
                          initial={{ opacity: 0, y: 30 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: (i % 6) * 0.1, duration: 0.8, type: 'spring', bounce: 0.4 }}
                        >
                          <FeedPost post={post} onSelect={setSelectedPost} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {posts.length === 0 && (
                      <div className="py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-4">
                        <Search className="h-12 w-12 mx-auto text-primary/40" />
                        <h3 className="text-2xl font-black text-[#1A2E05] tracking-tight">No active stories found</h3>
                        <p className="text-slate-400 text-sm font-medium leading-[1.6]">Adjust your filters or be the first to start a conversation in this wellness domain.</p>
                        <Button variant="outline" className="mt-2 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs" onClick={() => { setCategory('all'); setSearch(''); }}>
                          Reset Alignment
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <aside className="hidden lg:flex flex-col gap-6 w-[220px] flex-shrink-0 sticky top-28 self-start">
              <div className="bg-white/90 border border-slate-200 shadow-lg shadow-slate-900/10 rounded-[2rem] p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-primary" />
                  <h3 className="font-black text-base text-[#1A2E05] tracking-tight">Refine Feed</h3>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant={category === 'all' ? 'default' : 'ghost'} 
                    onClick={() => setCategory('all')}
                    className={`w-full justify-start rounded-[1.5rem] h-12 font-black transition-all ${category === 'all' ? 'shadow-xl shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Zap className="mr-3 h-4 w-4" /> Discover All
                  </Button>
                  {CATEGORIES.map(cat => (
                    <Button 
                      key={cat} 
                      variant={category === cat ? 'default' : 'ghost'} 
                      onClick={() => setCategory(cat)}
                      className={`w-full justify-start rounded-[1.5rem] h-12 font-black transition-all ${category === cat ? 'shadow-xl shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            key="post-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl h-full max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close post"
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:text-primary shadow-lg"
                onClick={() => setSelectedPost(null)}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-6 pt-14">
                <FeedPost post={selectedPost} initialShowComments />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
