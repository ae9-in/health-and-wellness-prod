import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Utensils, 
  Dumbbell, 
  Brain, 
  Leaf, 
  Stethoscope, 
  ShoppingBag, 
  Lightbulb, 
  RefreshCw,
  Send,
  Loader2,
  Wind,
  Sprout,
  Pill
} from 'lucide-react';
import { followUpQuestion } from '@/lib/api';
import MarkdownRenderer from './MarkdownRenderer';

interface AIResultDisplayProps {
  plan: string;
  onStartOver: () => void;
}

interface CategoryPlan {
  category: string;
  content: string;
}

const CATEGORY_MAP: Record<string, { icon: any; color: string }> = {
  '🥗 Nutrition & Diet': { icon: Utensils, color: 'bg-emerald-100 text-emerald-600' },
  '💪 Fitness & Workout': { icon: Dumbbell, color: 'bg-blue-100 text-blue-600' },
  '🧘 Mental Wellness': { icon: Brain, color: 'bg-purple-100 text-purple-600' },
  '🧘‍♀️ Yoga & Breathing': { icon: Wind, color: 'bg-indigo-100 text-indigo-600' },
  '🌿 Ayurveda': { icon: Leaf, color: 'bg-green-100 text-green-600' },
  '🌱 Herbal Products': { icon: Sprout, color: 'bg-teal-100 text-teal-600' },
  '💊 Supplements': { icon: Pill, color: 'bg-orange-100 text-orange-600' },
};

const SectionCard = ({ category, content, delay }: { category: string; content: string; delay: number }) => {
  const config = CATEGORY_MAP[category] || { icon: Lightbulb, color: 'bg-slate-100 text-slate-600' };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100/60 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl ${config.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-display text-2xl font-bold text-[#1A2E05]">{category}</h3>
      </div>
      <MarkdownRenderer content={content} />
    </motion.div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-1 py-2 px-3 bg-white rounded-2xl rounded-tl-none shadow-sm w-fit border border-slate-100">
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
      className="w-1.5 h-1.5 bg-emerald-600 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
      className="w-1.5 h-1.5 bg-emerald-600 rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
      className="w-1.5 h-1.5 bg-emerald-600 rounded-full"
    />
  </div>
);

const AIResultDisplay: React.FC<AIResultDisplayProps> = ({ plan, onStartOver }) => {
  const [parsedPlan, setParsedPlan] = useState<CategoryPlan[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(plan);
      setParsedPlan(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Failed to parse AI plan:", e);
      // Fallback for non-JSON response if any
      setParsedPlan([{ category: 'Your Plan', content: plan }]);
    }
  }, [plan]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAsking]);

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp.trim() || isAsking) return;

    const currentQuestion = followUp;
    setFollowUp('');
    setIsAsking(true);
    
    const newHistory = [...chatHistory, { role: 'user' as const, content: currentQuestion }];
    setChatHistory(newHistory);

    try {
      const response = await followUpQuestion({
        question: currentQuestion,
        previousContext: [{ role: 'assistant', content: plan }, ...chatHistory]
      });
      setChatHistory([...newHistory, { role: 'assistant', content: response.result }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#F9F5EE] p-8 rounded-[2.5rem] border border-[#C8DBC9]/30">
        <div>
          <h2 className="text-4xl font-display font-bold text-[#1A2E05] mb-2">Your Personalized Health Journey</h2>
          <p className="text-[#8A8478] text-lg">Curated by Wellspring AI Assistant based on your unique profile</p>
        </div>
        <Button 
          variant="outline" 
          onClick={onStartOver}
          className="rounded-full gap-2 text-[#4F7153] border-[#4F7153]/20 hover:bg-emerald-50 px-6 h-12"
        >
          <RefreshCw className="w-4 h-4" />
          Start New Analysis
        </Button>
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {parsedPlan.map((item, i) => (
          <SectionCard 
            key={i} 
            category={item.category} 
            content={item.content} 
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Chat Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#F2EBD9]/50 rounded-[3rem] p-10 border border-[#D4C4A8]/40 space-y-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Brain className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-[#1A2E05]">Refine your results</h3>
        </div>

        <div 
          ref={scrollRef}
          className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 scroll-smooth"
        >
          {chatHistory.length === 0 && (
            <p className="text-slate-500 text-center py-8 italic bg-white/40 rounded-2xl border border-dashed border-slate-200">
              Have questions about your nutrition or workout plan? Ask below.
            </p>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-3xl ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/10' 
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="flex flex-col gap-2">
                <TypingIndicator />
                <span className="text-xs text-slate-400 ml-1">Wellspring AI is typing...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleFollowUp} className="relative mt-4">
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder="Ask a follow-up question about your results..."
            className="w-full bg-white border border-slate-200 rounded-[2rem] px-8 py-5 pr-20 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 shadow-sm"
          />
          <button
            type="submit"
            disabled={!followUp.trim() || isAsking}
            className="absolute right-3 top-3 bottom-3 w-14 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95 group"
          >
            <Send className="w-6 h-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AIResultDisplay;
