import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socket } from '@/lib/socket';
import { getPosts, createPost } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import FeedPost from '@/components/FeedPost';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, MessageCircle, Search, Plus, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Discussions() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlePostLiked = ({ postId, userId, liked }: { postId: string, userId: string, liked: boolean }) => {
      queryClient.setQueryData(['posts'], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => {
          if (p.id !== postId) return p;
          const newLikes = liked ? [...p.likes, userId] : p.likes.filter((id: string) => id !== userId);
          return { ...p, likes: newLikes };
        });
      });
    };

    const handlePostCommented = (comment: any) => {
      queryClient.setQueryData(['posts'], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => p.id === comment.postId ? { ...p, comments: [...p.comments, comment] } : p);
      });
    };

    socket.on('post:liked', handlePostLiked);
    socket.on('post:commented', handlePostCommented);

    return () => {
      socket.off('post:liked', handlePostLiked);
      socket.off('post:commented', handlePostCommented);
    };
  }, [queryClient]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', description: '', category: '' });
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const { data: posts = [], isLoading } = useQuery({ 
    queryKey: ['posts', category, search], 
    queryFn: () => getPosts(category, search) 
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  };

  const createMutation = useMutation({ 
    mutationFn: (payload: any) => createPost(token!, payload),
    ...mutationOptions 
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => togglePostLike(token!, postId),
    ...mutationOptions
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) => toggleSavePost(token!, postId),
    ...mutationOptions
  });

  const commentMutation = useMutation({
    mutationFn: ({postId, text}: {postId: string, text: string}) => addComment(token!, postId, text),
    ...mutationOptions
  });

  const handleCreatePost = () => {
    if (!user || !token) { toast.error('Logged in user required'); return; }
    if (!newPostData.title || !newPostData.description || !newPostData.category) { toast.error('Fill all fields'); return; }
    
    createMutation.mutate(newPostData, {
      onSuccess: () => {
        setNewPostData({ title: '', description: '', category: '' });
        setDialogOpen(false);
        toast.success('Post created!');
      }
    });
  };

  const normalizedSearch = search.trim().toLowerCase();
  const normalizedAuthor = authorFilter.trim().toLowerCase();
  const normalizedBrand = brandFilter.trim().toLowerCase();

  const filtered = posts
    .filter(p => category === 'all' || p.category === category)
    .filter(p => {
      if (!normalizedSearch) return true;
      const haystack = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .filter(p => {
      if (!normalizedAuthor) return true;
      return p.authorName.toLowerCase().includes(normalizedAuthor);
    })
    .filter(p => {
      if (!normalizedBrand) return true;
      const brandHaystack = `${p.authorName} ${p.authorRole} ${p.category} ${(p as any).brandName ?? ''} ${(p as any).brand?.name ?? ''}`.toLowerCase();
      return brandHaystack.includes(normalizedBrand);
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F5EE]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="page-shell space-y-10 relative">
          <div className="sparkline one" aria-hidden="true" />
          <div className="sparkline two" aria-hidden="true" />
          <BackButton />
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2 text-[#4F7153]">Community Exchange</h1>
              <p className="text-[#7A9E7E]/80">Share insights and connect with experts.</p>
            </div>
          {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="rounded-full px-6 font-bold shadow-lg shadow-[#4F7153]/30 bg-[#F2EBD9] text-[#4F7153] border border-[#4F7153]/40"
                  >
                    <Plus className="mr-2 h-5 w-5 text-[#4F7153]" />
                    Share Insight
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle className="font-display text-2xl">Create a New Post</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label className="font-bold">Title</Label><Input value={newPostData.title} onChange={e => setNewPostData(f => ({...f, title: e.target.value}))} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="font-bold">Topic</Label>
                    <Select value={newPostData.category} onValueChange={v => setNewPostData(f => ({...f, category: v}))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select topic" /></SelectTrigger>
                      <SelectContent className="rounded-xl">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="font-bold">Content</Label><Textarea value={newPostData.description} onChange={e => setNewPostData(f => ({...f, description: e.target.value}))} rows={4} className="rounded-xl" /></div>
                  <Button onClick={handleCreatePost} className="w-full h-12 rounded-xl font-bold text-lg mt-4" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Publishing...' : 'Publish Insight'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

          {/* Search & Filter */}
          <div className="panel-card space-y-6">
            <div className="grid md:grid-cols-[2fr_1fr] gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-12 h-14 rounded-2xl border-primary/10 bg-white shadow-sm focus:ring-4 focus:ring-primary/5 transition-all" 
                  placeholder="Search topics, tips, or keywords..."
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Health Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-14 rounded-2xl border-primary/10 bg-white shadow-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Category</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Author</Label>
                <Input 
                  placeholder="Search by author" 
                  value={authorFilter} 
                  onChange={e => setAuthorFilter(e.target.value)} 
                  className="h-14 rounded-2xl border-primary/10 bg-white shadow-sm" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Brand</Label>
                <Input 
                  placeholder="Search by brand or partner" 
                  value={brandFilter} 
                  onChange={e => setBrandFilter(e.target.value)} 
                  className="h-14 rounded-2xl border-primary/10 bg-white shadow-sm" 
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-primary/40 text-xs font-bold uppercase tracking-[0.3em]" 
                  onClick={() => { setAuthorFilter(''); setBrandFilter(''); }}
                >
                  Clear author/brand
                </Button>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-8">
            {isLoading ? (
              <div className="text-center py-20"><p className="text-muted-foreground animate-pulse">Loading discussions...</p></div>
            ) : filtered.map((post, i) => (
              <motion.div 
                key={post.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
              >
                <FeedPost post={post} />
              </motion.div>
            ))}
            {!isLoading && filtered.length === 0 && (
              <div className="panel-card sand text-center">
                <div className="h-20 w-20 bg-[#F2EBD9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-[#4F715E]" />
                </div>
                <h3 className="text-xl font-bold">No discussions found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or be the first to start a conversation.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
