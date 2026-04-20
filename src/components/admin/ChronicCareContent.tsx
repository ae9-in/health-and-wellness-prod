import { useState } from 'react';
import { Search, Plus, ChevronLeft, Activity, HeartPulse, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedEditor from '@/components/admin/FeedEditor';
import FeedList from '@/components/admin/FeedList';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChronicCareContent() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    // Pre-select Chronic Conditions category for new posts
    setEditingPost({ category: 'Chronic Conditions', published: true });
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          {isEditorOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditorOpen(false)}
              className="rounded-full hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-black text-[#1A2E05] flex items-center gap-3">
              <HeartPulse className="h-8 w-8 text-rose-500" />
              {isEditorOpen ? (editingPost?.id ? 'Edit Care Guide' : 'Draft New Care Guide') : 'Chronic Care Management'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Curate and publish specialized support content for long-term health journeys.
            </p>
          </div>
        </div>
        
        {!isEditorOpen && (
          <Button 
            onClick={handleCreate}
            className="rounded-2xl h-14 px-8 bg-black hover:bg-slate-800 text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 gap-3"
          >
            <Plus className="h-5 w-5" /> Publish Care Guide
          </Button>
        )}
      </div>

      {!isEditorOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Care Guides', value: '12', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Patient Reach', value: '1.2k', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Support Tokens', value: '450', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-[#1A2E05]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search chronic care posts..." 
                className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-50 transition-all font-bold text-sm"
              />
            </div>

            <FeedList onEdit={handleEdit} category="Chronic Conditions" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
