import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { API_BASE as API_URL } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import { 
  Plus, 
  Video, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CreatePostModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreatePostModal({ isOpen, onOpenChange, onSuccess }: CreatePostModalProps) {
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({ 
    title: '', 
    description: '', 
    category: CATEGORIES[0], 
    postType: 'ARTICLE' 
  });
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postFiles, setPostFiles] = useState<{video: File|null, audio: File|null, file: File|null}>({ 
    video: null, 
    audio: null, 
    file: null 
  });

  const handleCreatePost = async () => {
    if (!user) { toast.error('Please log in to create posts'); return; }
    if (!newPost.title || !newPost.description || !newPost.category) { 
      toast.error('Fill all fields'); 
      return; 
    }
    
    setIsSubmitting(true);
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
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-10 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
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
                <label htmlFor="img-upload" className="flex flex-col items-center gap-3 justify-center h-32 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
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
                <label htmlFor="vid-upload" className="flex flex-col items-center gap-3 justify-center h-32 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:text-primary transition-colors">
                    <Video className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{postFiles.video ? 'Video Ready' : 'Add Insight Video'}</span>
                </label>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCreatePost} 
            disabled={isSubmitting}
            className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...</> : 'Publish to Global Feed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
