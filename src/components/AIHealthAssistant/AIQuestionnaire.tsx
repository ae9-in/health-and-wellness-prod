import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface AIQuestionnaireProps {
  onClose: () => void;
  onSubmit: (answers: any) => void;
}

const QUESTIONS: { id: string; text: string; options?: string[]; placeholder?: string; type?: 'text' | 'number' }[] = [
  {
    id: 'intro',
    text: 'Before I create your personalized plan, I just need a few quick details from you!',
    options: ['Let\'s Go!'],
  },
  {
    id: 'age',
    text: 'How old are you?',
    type: 'number',
    placeholder: 'Enter your age',
  },
  {
    id: 'weight',
    text: 'What is your weight (in kg)?',
    type: 'number',
    placeholder: 'e.g., 70',
  },
  {
    id: 'height',
    text: 'What is your height (in cm)?',
    type: 'number',
    placeholder: 'e.g., 175',
  },
  {
    id: 'goal',
    text: 'What is your goal?',
    options: ['Weight Loss', 'Weight Gain', 'Muscle Gain', 'Maintain Fitness'],
  },
  {
    id: 'gender',
    text: 'Gender?',
    options: ['Male', 'Female', 'Other'],
  },
  {
    id: 'dietPreference',
    text: 'Diet preference?',
    options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
  },
  {
    id: 'activityLevel',
    text: 'Activity level?',
    options: ['Low', 'Moderate', 'High'],
  },
  {
    id: 'focusArea',
    text: 'Focus area?',
    options: ['Nutrition', 'Fitness', 'Mental Wellness', 'Yoga', 'Ayurveda', 'Herbal Products', 'Supplements'],
  },
];

const AIQuestionnaire: React.FC<AIQuestionnaireProps> = ({ onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');

  const handleNext = (val?: string) => {
    const value = val || inputValue;
    if (!value && !QUESTIONS[currentStep].options) return;

    const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(newAnswers);
    setInputValue('');

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setInputValue(answers[QUESTIONS[currentStep - 1].id] || '');
    }
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const currentQuestion = QUESTIONS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Personal Health Assessment</h3>
            <p className="text-sm text-slate-500">Step {currentStep + 1} of {QUESTIONS.length}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          />
        </div>

        {/* Question Area */}
        <div className="p-8 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-grow space-y-8"
            >
              <div className="space-y-4 text-center">
                <h4 className="text-2xl font-display font-semibold text-slate-900 leading-tight">
                  {currentQuestion.text}
                </h4>
                {currentQuestion.id === 'intro' && (
                  <p className="text-emerald-600 font-medium">Could you share your age, weight (in kg), and height (in cm)? This helps me make your plan as accurate as possible!</p>
                )}
              </div>

              {currentQuestion.options ? (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.01, backgroundColor: '#f8fafc' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleNext(option)}
                      className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                        answers[currentQuestion.id] === option
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-100 hover:border-emerald-200'
                      }`}
                    >
                      <span className="font-medium text-slate-700">{option}</span>
                      <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                        answers[currentQuestion.id] === option ? 'text-emerald-500' : 'text-slate-300'
                      }`} />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 max-w-sm mx-auto w-full">
                  <input
                    type={currentQuestion.type || 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder={currentQuestion.placeholder}
                    autoFocus
                    className="w-full text-center text-3xl font-display font-bold p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  />
                  <Button 
                    onClick={() => handleNext()}
                    disabled={!inputValue}
                    className="w-full h-14 rounded-xl text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  >
                    Continue
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="rounded-full px-6 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <p className="text-xs text-slate-400 font-medium tracking-wider">SECURE & PRIVATE</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIQuestionnaire;
