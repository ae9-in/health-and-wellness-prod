import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, createPost, togglePostLike, addComment, toggleSavePost } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
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

  const handleLike = (postId: string) => {
    if (!token) { toast.error('Logged in user required'); return; }
    likeMutation.mutate(postId);
  };

  const handleSave = (postId: string) => {
    if (!token) { toast.error('Logged in user required'); return; }
    saveMutation.mutate(postId, {
      onSuccess: (data) => {
        toast.success(data.saved ? 'Post saved to bookmarks!' : 'Post removed from bookmarks');
      }
    });
  };

  const handleComment = (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!token) { toast.error('Log in to join the discussion'); return; }
    if (!text) return;
    
    commentMutation.mutate({ postId, text }, {
      onSuccess: () => {
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        toast.success('Comment added!');
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
                className="discussion-card rich-card group"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="tag-dark border-0">{post.category}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 group-hover:text-[#7A9E7E] transition-colors">{post.title}</h3>
                <p className="text-[#2C2C2C] leading-relaxed mb-8 text-[15px]">{post.description}</p>
              <div className="flex items-center justify-between border-t border-[#8C4A2A]/20 pt-6 flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#C8DBC9] flex items-center justify-center text-[#4F7153] font-black">{post.authorName.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{post.authorName}</p>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{post.authorRole || 'Member'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 font-bold text-sm transition-all hover:scale-110 ${user && post.likes.includes(user.id) ? 'text-[#4F7153]' : 'text-muted-foreground'}`}>
                        <Heart className={`h-5 w-5 ${user && post.likes.includes(user.id) ? 'fill-[#4F7153]' : ''}`} />
                        {post.likes.length}
                      </button>
                      <button onClick={() => handleSave(post.id)} className={`flex items-center gap-2 font-bold text-sm transition-all hover:scale-110 ${user && post.savedUsers?.includes(user.id) ? 'text-[#4F7153]' : 'text-muted-foreground'}`}>
                        <Bookmark className={`h-5 w-5 ${user && post.savedUsers?.includes(user.id) ? 'fill-[#4F7153]' : ''}`} />
                        {post.savedUsers?.length || 0}
                      </button>
                      <button 
                        onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
                        className="flex items-center gap-2 text-muted-foreground font-bold text-sm hover:text-[#4F7153] transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {post.comments.length}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 max-w-md ml-auto">
                    <div className="flex gap-2">
                      <Input
                        id={`comment-input-${post.id}`}
                        className="rounded-xl bg-[#F9F9F7] border-none focus:ring-4 focus:ring-[#7A9E7E]/30"
                        placeholder="Add your perspective..."
                        value={commentText[post.id] || ''}
                        onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                      />
                      <Button variant="ghost" className="font-bold text-[#4F7153] hover:bg-[#7A9E7E]/10" onClick={() => handleComment(post.id)}>Post</Button>
                    </div>
                  </div>
                </div>
                {post.comments.length > 0 && (
                  <div className="mt-8 space-y-4 pl-6 border-l-2 border-[#C8DBC9]">
                    {post.comments.slice(0, 3).map(c => (
                      <div key={c.id} className="text-sm">
                        <span className="font-bold text-foreground mr-2">{c.userName}</span>
                        <span className="text-muted-foreground">{c.commentText}</span>
                      </div>
                    ))}
                    {post.comments.length > 3 && <p className="text-xs font-bold text-[#4F7153] cursor-pointer hover:underline pt-2">View all {post.comments.length} comments</p>}
                  </div>
                )}
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
