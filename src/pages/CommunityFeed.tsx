import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Post } from '@/lib/types';
import { getPosts, API_BASE as API_URL } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import { socket } from '@/lib/socket';
import { 
  Menu, Bell, User as UserIcon, Plus, Search, 
  Loader2, Filter, X, Image as ImageIcon, Video, Music, FileText,
  Sparkles, Zap, Trophy, Heart, MessageSquare, Bookmark
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

export default function CommunityFeed() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  
  // New Post State
  const [newPost, setNewPost] = useState({ title: '', description: '', category: CATEGORIES[0], postType: 'ARTICLE' });
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postFiles, setPostFiles] = useState<{video: File|null, audio: File|null, file: File|null}>({ video: null, audio: null, file: null });

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

  useEffect(() => {
    loadPosts();

    socket.on('post:created', (newPost: Post) => {
      setPosts(prev => [newPost, ...prev]);
    });

    socket.on('post:liked', ({ postId, userId, liked }: { postId: string, userId: string, liked: boolean }) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const newLikes = liked ? [...p.likes, userId] : p.likes.filter(id => id !== userId);
        return { ...p, likes: newLikes };
      }));
    });

    socket.on('post:commented', (comment: any) => {
      setPosts(prev => prev.map(p => p.id === comment.postId ? { ...p, comments: [...p.comments, comment] } : p));
    });

    return () => {
      socket.off('post:created');
      socket.off('post:liked');
      socket.off('post:commented');
    };
  }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!user) { toast.error('Please log in to create posts'); return; }
    if (!newPost.title || !newPost.description || !newPost.category) { toast.error('Fill all fields'); return; }
    
    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('description', newPost.description);
      formData.append('category', newPost.category);
      formData.append('postType', newPost.postType);
      postImages.forEach(img => formData.append('images', img));
      if (postFiles.video) formData.append('video', postFiles.video);
      if (postFiles.audio) formData.append('audio', postFiles.audio);
      if (postFiles.file) formData.append('file', postFiles.file);

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to create post');

      toast.success('Your story is now live in the community!');
      setNewPost({ title: '', description: '', category: CATEGORIES[0], postType: 'ARTICLE' });
      setPostFiles({ video: null, audio: null, file: null });
      setPostImages([]);
      setIsNewPostDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5EE] flex flex-col font-sans selection:bg-primary/20">
      <Navbar />
      
      {/* Premium Header */}
      <header className="sticky top-[64px] z-40 bg-gradient-to-br from-[#2C4A2E] to-[#4A3A2A] border-b border-[#4A3A2A]/80 shadow-2xl text-white">
        <div className="max-w-[1400px] mx-auto h-[72px] flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <button className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
              <Menu className="h-6 w-6" />
            </button>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-black text-white tracking-tight">Community Timeline</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 mt-0.5 ml-0.5">Global Wellness Network</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl px-12">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles, tips, or experts..." 
                className="h-12 pl-12 pr-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all relative group">
              <Bell className="h-6 w-6" />
              <div className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-125 transition-transform" />
            </button>
            <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-slate-50 ml-2 shadow-sm">
               {user?.fullName ? (
                  <div className="h-full w-full flex items-center justify-center bg-primary text-white font-black text-xl">
                    {user.fullName.charAt(0)}
                  </div>
               ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <UserIcon className="h-6 w-6" />
                  </div>
               )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-8 py-10">
        <div className="page-shell relative space-y-10">
          <div className="sparkline one" aria-hidden="true" />
          <div className="sparkline two" aria-hidden="true" />
          <div className="grid lg:grid-cols-4 gap-10">
          
          {/* Sidebar Filters */}
          <aside className="hidden lg:block space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-black text-lg text-[#1A2E05]">Refine Feed</h3>
              </div>
              <div className="space-y-3">
                <Button 
                  variant={category === 'all' ? 'default' : 'ghost'} 
                  onClick={() => setCategory('all')}
                  className={`w-full justify-start rounded-2xl h-12 font-black transition-all ${category === 'all' ? 'shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Zap className="mr-3 h-4 w-4" /> Discover All
                </Button>
                {CATEGORIES.map(cat => (
                  <Button 
                    key={cat} 
                    variant={category === cat ? 'default' : 'ghost'} 
                    onClick={() => setCategory(cat)}
                    className={`w-full justify-start rounded-2xl h-12 font-black transition-all ${category === cat ? 'shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
               <h4 className="font-black text-primary uppercase tracking-[0.2em] text-[10px] mb-4">Trending Experts</h4>
               <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 group cursor-pointer">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm overflow-hidden border border-slate-100">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-[#1A2E05] line-clamp-1 group-hover:text-primary transition-colors">Dr. Sarah Johnson</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wellness Expert</p>
                      </div>
                      <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
               </div>
            </div>
          </aside>

          {/* Main Content Feed */}
          <div className="lg:col-span-3">
            {/* Create Post Action Card */}
            {user && user.role !== 'USER' && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-10 flex items-center gap-6"
              >
                <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center font-black text-2xl text-primary border-4 border-white shadow-xl shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                <Dialog open={isNewPostDialogOpen} onOpenChange={setIsNewPostDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="flex-1 bg-slate-50 hover:bg-white hover:shadow-inner hover:ring-2 hover:ring-primary/5 rounded-[1.5rem] px-8 py-4 text-slate-400 font-bold cursor-pointer transition-all border border-slate-100/50">
                      Inspire the community with your wellness journey...
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-10 border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black text-[#1A2E05] tracking-tight">Draft New Post</DialogTitle>
                      <DialogDescription className="text-muted-foreground font-medium">Share insights, tips, or success stories with the global community.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-8 py-6">
                      <div className="space-y-3">
                        <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Headline</Label>
                        <Input 
                          placeholder="What's the core focus of your post?" 
                          value={newPost.title} 
                          onChange={e => setNewPost(f => ({...f, title: e.target.value}))}
                          className="rounded-2xl h-14 bg-slate-50 border-none font-bold text-lg px-6 focus-visible:ring-primary/20"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Wellness Pillar</Label>
                          <Select value={newPost.category} onValueChange={v => setNewPost(f => ({...f, category: v}))}>
                            <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none font-bold px-6">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="rounded-xl font-bold">{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Post Format</Label>
                          <Select value={newPost.postType} onValueChange={v => setNewPost(f => ({...f, postType: v}))}>
                            <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none font-bold px-6">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                              <SelectItem value="ARTICLE" className="rounded-xl font-bold">Comprehensive Article</SelectItem>
                              <SelectItem value="SHORT_TIP" className="rounded-xl font-bold">Daily Wellness Tip</SelectItem>
                              <SelectItem value="VIDEO" className="rounded-xl font-bold">Video Insight</SelectItem>
                              <SelectItem value="PRODUCT_REVIEW" className="rounded-xl font-bold">Product Review</SelectItem>
                              <SelectItem value="SUCCESS_STORY" className="rounded-xl font-bold">Success Story</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Narrative Content</Label>
                        <Textarea 
                          placeholder="Dive deep into your experience..." 
                          value={newPost.description} 
                          onChange={e => setNewPost(f => ({...f, description: e.target.value}))} 
                          rows={6}
                          className="rounded-3xl bg-slate-50 border-none p-6 font-medium leading-relaxed focus-visible:ring-primary/20 resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Visual Assets</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <input 
                              type="file" 
                              id="img-upload" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={e => setPostImages(Array.from(e.target.files || []).slice(0, 4))}
                            />
                            <label htmlFor="img-upload" className="flex flex-col items-center gap-3 justify-center h-32 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all animate-in zoom-in-50 duration-500">
                              <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:text-primary transition-colors">
                                <Plus className="h-6 w-6" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{postImages.length > 0 ? `${postImages.length} Images Selected` : 'Add Images'}</span>
                            </label>
                          </div>
                          <div className="relative">
                            <input 
                              type="file" 
                              id="vid-upload" 
                              accept="video/*" 
                              className="hidden" 
                              onChange={e => setPostFiles(f => ({...f, video: e.target.files?.[0] || null}))}
                            />
                            <label htmlFor="vid-upload" className="flex flex-col items-center gap-3 justify-center h-32 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all animate-in zoom-in-50 duration-500">
                              <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:text-primary transition-colors">
                                <Video className="h-6 w-6" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{postFiles.video ? 'Video Ready' : 'Add Insight Video'}</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleCreatePost} className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                        Publish to Global Feed
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <button onClick={() => setIsNewPostDialogOpen(true)} className="h-14 w-14 flex items-center justify-center bg-[#1A2E05] text-white rounded-[1.5rem] hover:bg-primary hover:scale-105 transition-all shrink-0 shadow-lg shadow-black/10">
                   <Zap className="h-6 w-6 fill-white" />
                </button>
              </motion.div>
            )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <FeedPost post={post} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {posts.length === 0 && (
                  <div className="col-span-full py-40 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center px-10">
                    <div className="h-24 w-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce transition-all duration-1000">
                      <Search className="h-12 w-12 text-primary/30" />
                    </div>
                    <h3 className="text-3xl font-black text-[#1A2E05] tracking-tight">No active stories found</h3>
                    <p className="text-slate-400 mt-4 max-w-sm font-medium leading-[1.6]">Adjust your filters or be the first to start a conversation in this wellness domain.</p>
                    <Button variant="outline" onClick={() => { setCategory('all'); setSearch(''); }} className="mt-10 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs">Reset Domain Alignment</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
  );
}
