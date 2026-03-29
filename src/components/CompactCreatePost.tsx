import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { API_BASE as API_URL } from '@/lib/api';
import { 
  Image as ImageIcon, 
  Video, 
  X, 
  Loader2, 
  Send,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CompactCreatePostProps {
  onSuccess?: () => void;
}

export default function CompactCreatePost({ onSuccess }: CompactCreatePostProps) {
  const { user, token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check constraints
    if (selectedImages.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    const newFiles = [...selectedImages, ...files];
    setSelectedImages(newFiles);

    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews([...previews, ...newPreviews]);
    setIsExpanded(true);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file too large (Max 50MB)');
      return;
    }

    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    setIsExpanded(true);
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo) {
      toast.error('Please add some content to your post');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', content);
      formData.append('userType', user.role.toLowerCase());
      formData.append('category', 'Community'); // Default category
      
      selectedImages.forEach(img => formData.append('images', img));
      if (selectedVideo) formData.append('video', selectedVideo);

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish post');
      }

      toast.success('Post published successfully!');
      resetForm();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setSelectedImages([]);
    setSelectedVideo(null);
    setPreviews([]);
    setVideoPreview(null);
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-primary/5 shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-primary/5">
            <AvatarImage src={user?.fullName?.charAt(0)} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user?.fullName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className={`min-h-[48px] border border-slate-100 bg-slate-50/50 rounded-2xl p-4 focus-visible:ring-primary/10 resize-none transition-all duration-300 placeholder:text-slate-400 ${
                isExpanded ? 'min-h-[120px]' : ''
              }`}
            />

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Media Previews */}
                  {(previews.length > 0 || videoPreview) && (
                    <div className="grid grid-cols-2 gap-2">
                      {previews.map((src, i) => (
                        <div key={src} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100">
                          <img src={src} className="w-full h-full object-cover" alt="Preview" />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {videoPreview && (
                        <div className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100">
                          <video src={videoPreview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <Video className="h-8 w-8 text-white opacity-70" />
                          </div>
                          <button
                            onClick={removeVideo}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl gap-2 font-bold"
                        disabled={selectedVideo !== null}
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Photo</span>
                      </Button>

                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoSelect}
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        className="text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl gap-2 font-bold"
                        disabled={selectedImages.length > 0}
                      >
                        <Video className="h-4 w-4" />
                        <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Video</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                       {content.length > 0 && (
                         <span className={`text-[10px] font-black tracking-widest ${content.length > 900 ? 'text-orange-500' : 'text-slate-400'}`}>
                           {content.length}/1000
                         </span>
                       )}
                       <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!content.trim() && previews.length === 0 && !videoPreview)}
                        className="rounded-xl px-6 font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Post</>}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
