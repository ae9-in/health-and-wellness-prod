import { useState } from 'react';
import { Search, Plus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedEditor from '@/components/admin/FeedEditor';
import FeedList from '@/components/admin/FeedList';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedManagementContent() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {isEditorOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditorOpen(false)}
              className="rounded-full hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-2xl font-black text-[#1A2E05]">
            {isEditorOpen ? (editingPost ? 'Edit Post' : 'Create New Post') : 'Community Feed Oversight'}
          </h2>
        </div>
        
        {!isEditorOpen && (
          <Button 
            onClick={handleCreate}
            className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 gap-2"
          >
            <Plus className="h-5 w-5" /> Create Post
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditorOpen ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FeedEditor 
              post={editingPost} 
              onCancel={() => setIsEditorOpen(false)} 
              onSave={() => setIsEditorOpen(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="relative max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search posts by title..." 
                className="w-full h-12 pl-12 pr-4 bg-white rounded-2xl border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              />
            </div>

            <FeedList onEdit={handleEdit} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
