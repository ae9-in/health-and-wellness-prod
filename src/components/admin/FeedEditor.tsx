import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Image as ImageIcon, 
  Video, 
  X, 
  Upload, 
  Loader2, 
  Check,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { createPost, updatePostAdmin } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES } from '@/lib/constants';

interface FeedEditorProps {

export default function FeedEditor({ post, onCancel, onSave }: FeedEditorProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    body: post?.description || '', // Using description to match project schema
    category: post?.category || 'Nutrition',
    tags: post?.tags ? (Array.isArray(post.tags) ? post.tags.join(', ') : post.tags) : '',
    published: post?.published !== undefined ? post.published : true,
    images: post?.images || [],
    video: post?.video || '',
  });

  const [dragActive, setDragActive] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
  const [pendingVideo, setPendingVideo] = useState<{ file: File; preview: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = (file: File, type: 'image' | 'video') => {
    const preview = URL.createObjectURL(file);
    if (type === 'image') {
      setPendingImages(prev => [...prev, { file, preview }]);
    } else {
      if (pendingVideo) URL.revokeObjectURL(pendingVideo.preview);
      setPendingVideo({ file, preview });
    }
  };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => handleFileAdd(file, type));
    // Clear input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      files.forEach(file => {
        if (file.type.startsWith('image/')) handleFileAdd(file, 'image');
        else if (file.type.startsWith('video/')) handleFileAdd(file, 'video');
      });
    }
  };

  const removeImage = (index: number, isPending: boolean) => {
    if (isPending) {
      const removed = pendingImages[index];
      URL.revokeObjectURL(removed.preview);
      setPendingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_: any, i: number) => i !== index)
      }));
    }
  };
  
  const removeVideo = (isPending: boolean) => {
    if (isPending) {
      if (pendingVideo) URL.revokeObjectURL(pendingVideo.preview);
      setPendingVideo(null);
    } else {
      setFormData(prev => ({ ...prev, video: '' }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) => 
      (post && post.id) ? updatePostAdmin(token!, post.id, payload) : createPost(token!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      toast.success(post?.id ? 'Post updated successfully' : 'Post published successfully');
      // Cleanup object URLs
      pendingImages.forEach(p => URL.revokeObjectURL(p.preview));
      if (pendingVideo) URL.revokeObjectURL(pendingVideo.preview);
      onSave();
    },
    onError: (err: any) => {
      setIsUploading(false);
      toast.error(err.message || 'Failed to save post');
    }
  });

  const savePost = async () => {
    if (!formData.title) return toast.error('Title is required');
    
    setIsUploading(true);
    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('description', formData.body.trim());
    data.append('category', formData.category);
    data.append('published', String(formData.published));
    
    const tagsArr = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    tagsArr.forEach((tag: string) => data.append('tags[]', tag));
    
    // Existing images (URLs)
    formData.images.forEach((url: string) => data.append('images', url));
    
    // New images (Files)
    pendingImages.forEach(p => data.append('images', p.file));
    
    // Video
    if (pendingVideo) {
      data.append('video', pendingVideo.file);
    } else if (formData.video) {
        data.append('videoUrl', formData.video);
    }
    
    saveMutation.mutate(data);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Post Title</Label>
            <Input 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 10 Tips for Better Sleep Quality"
              className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus-visible:ring-[#7BAE7F]/20 text-lg font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Post Content</Label>
            <Textarea 
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
              placeholder="Write your story here..."
              className="min-h-[400px] rounded-[1.5rem] border-slate-100 bg-slate-50/30 focus-visible:ring-[#7BAE7F]/20 text-base leading-relaxed p-6"
            />
          </div>
        </div>

        {/* Media Upload */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Media Assets</Label>
            <div className="text-[10px] font-bold text-slate-300">Images or Video (Max 50MB)</div>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => imageInputRef.current?.click()}
            className={`relative group h-48 rounded-[1.5rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer ${
              dragActive 
                ? 'border-[#7BAE7F] bg-[#7BAE7F]/5 scale-[0.99]' 
                : 'border-slate-100 bg-slate-50/30 hover:border-[#7BAE7F]'
            }`}
          >
            <div className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-[#7BAE7F]" /> : <Upload className="h-6 w-6 text-[#7BAE7F]" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-600">Drag & Drop media here</p>
              <p className="text-xs font-bold text-slate-400">or <span className="text-[#C9A84C] hover:underline">browse files</span></p>
            </div>
            <input 
              type="file" 
              ref={imageInputRef} 
              onChange={e => {
                const files = Array.from(e.target.files || []);
                files.forEach(file => {
                  if (file.type.startsWith('image/')) handleFileAdd(file, 'image');
                  else if (file.type.startsWith('video/')) handleFileAdd(file, 'video');
                });
                e.target.value = '';
              }} 
              style={{ display: 'none' }}
              accept="image/*,video/*" 
              multiple 
            />
          </div>

          {/* Previews */}
          {(formData.images.length > 0 || formData.video || pendingImages.length > 0 || pendingVideo) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {/* Existing Image Previews */}
              {formData.images.map((src: string, idx: number) => (
                <div key={`existing-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => removeImage(idx, false)}
                    className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* Pending Image Previews */}
              {pendingImages.map((p, idx) => (
                <div key={`pending-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-[#7BAE7F]/30">
                  <img src={p.preview} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                    <Check className="h-6 w-6 text-[#7BAE7F]" />
                  </div>
                  <button 
                    onClick={() => removeImage(idx, true)}
                    className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* Existing Video Preview */}
              {formData.video && !pendingVideo && (
                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-[#C9A84C] bg-slate-900">
                  <video src={formData.video} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <Video className="h-8 w-8 text-white/50" />
                  </div>
                  <button 
                    onClick={() => removeVideo(false)}
                    className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {/* Pending Video Preview */}
              {pendingVideo && (
                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-[#7BAE7F] bg-slate-900">
                  <video src={pendingVideo.preview} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#7BAE7F]/20 pointer-events-none">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <button 
                    onClick={() => removeVideo(true)}
                    className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Publishing Controls */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-[#7BAE7F]/5 border border-slate-100 space-y-8 sticky top-28">
           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Publish Status</Label>
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <span className="text-sm font-black text-slate-600">{formData.published ? 'Published' : 'Draft'}</span>
                <Switch 
                  checked={formData.published}
                  onCheckedChange={val => setFormData({ ...formData, published: val })}
                  className="data-[state=checked]:bg-[#7BAE7F]"
                />
              </div>
           </div>

           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={val => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/30 font-bold focus:ring-[#7BAE7F]/20">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="rounded-xl focus:bg-[#7BAE7F]/5 focus:text-[#7BAE7F] font-medium">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>

           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tags</Label>
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#C9A84C]" />
                <Input 
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Seperate tags with commas"
                  className="h-12 pl-10 rounded-2xl border-slate-100 bg-slate-50/30 font-medium text-sm"
                />
              </div>
           </div>

           <div className="flex flex-col gap-3 pt-4">
             <Button 
                onClick={savePost}
                disabled={isUploading}
                className="w-full h-14 rounded-2xl bg-[#2C2C2C] hover:bg-black text-white font-black uppercase tracking-widest text-lg transition-all shadow-xl shadow-black/10"
             >
                {saveMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  post?.id ? 'Update Guide' : 'Publish to Community'
                )}
             </Button>
             <Button 
                variant="ghost" 
                onClick={onCancel}
                className="w-full h-12 rounded-2xl text-slate-400 font-bold hover:bg-slate-50"
             >
               Discard Changes
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
