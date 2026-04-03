import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface AIHeroProps {
  onStart: () => void;
}

const FloatingBubble = ({ text, delay, x, y }: { text: string; delay: number; x: string; y: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: [0.4, 0.8, 0.4],
      scale: [1, 1.05, 1],
      y: ['0%', '-10%', '0%']
    }}
    transition={{ 
      duration: 5, 
      repeat: Infinity, 
      delay, 
      ease: "easeInOut" 
    }}
    className="absolute hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-emerald-100/50 cursor-default"
    style={{ left: x, top: y }}
  >
    <div className="w-2 h-2 rounded-full bg-emerald-400" />
    <span className="text-xs font-medium text-emerald-800">{text}</span>
  </motion.div>
);

import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

const AIHero: React.FC<AIHeroProps> = ({ onStart }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (user) {
      onStart();
    } else {
      navigate('/login');
    }
  };

  const suggestions = [
    { text: "How to improve my sleep?", delay: 0, x: "15%", y: "20%" },
    { text: "High protein breakfast ideas", delay: 1, x: "75%", y: "15%" },
    { text: "Workout suggestions", delay: 2, x: "10%", y: "70%" },
    { text: "How was my day today?", delay: 3, x: "80%", y: "65%" },
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-transparent">
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-3xl -z-10" />
      
      {suggestions.map((s, i) => (
        <FloatingBubble key={i} {...s} />
      ))}

      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100/50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border border-emerald-200/50">
            <Sparkles className="w-4 h-4" />
            <span>AI POWERED WELLNESS</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
            Try AI – Your Personal <span className="text-emerald-600 italic">AI Health Assistant</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            {user 
              ? "Get personalized nutrition, fitness, and lifestyle advice tailored to your goals and preferences in seconds."
              : "Login to get personalized nutrition, fitness, and lifestyle advice tailored to your goals and preferences."}
          </p>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Button
              onClick={handleButtonClick}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-emerald-200 transition-all group"
            >
              {user ? "Get Personalized Advice" : "Login to Access AI Assistant"}
              <motion.span
                className="inline-block ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Button>
          </motion.div>

          <div className="pt-8 flex items-center justify-center gap-8 grayscale opacity-50">
            <span className="text-xs font-bold tracking-widest text-slate-400">POWERED BY GROQ</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIHero;
