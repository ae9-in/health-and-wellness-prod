import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AnimatePresence, motion } from 'framer-motion';
import AIHero from './AIHero';
import AIQuestionnaire from './AIQuestionnaire';
import AIResultDisplay from './AIResultDisplay';
import { generateAIPlan } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AIHealthAssistant: React.FC = () => {
  const [view, setView] = useState<'hero' | 'questionnaire' | 'loading' | 'result'>('hero');
  const [plan, setPlan] = useState<string | null>(null);

  const { token } = useAuth();

  const handleStart = () => setView('questionnaire');
  
  const handleClose = () => setView('hero');

  const handleSubmit = async (answers: any) => {
    setView('loading');
    try {
      const response = await generateAIPlan(answers, token || undefined);
      setPlan(response.result);
      setView('result');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Something went wrong. Please try again.');
      setView('hero');
    }
  };

  const handleStartOver = () => {
    setPlan(null);
    setView('hero');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {view === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AIHero onStart={handleStart} />
          </motion.div>
        )}

        {view === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-emerald-100 rounded-full animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-display font-bold text-slate-900">Crafting your plan...</h3>
              <p className="text-slate-500">Analyzing your goals and preferences with Wellspring AI</p>
            </div>
          </motion.div>
        )}

        {view === 'result' && plan && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AIResultDisplay plan={plan} onStartOver={handleStartOver} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'questionnaire' && (
          <AIQuestionnaire onClose={handleClose} onSubmit={handleSubmit} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIHealthAssistant;
