import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Pill,
  Download,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { followUpQuestion } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MarkdownRenderer from './MarkdownRenderer';
import { toast } from 'sonner';

interface AIResultDisplayProps {
  plan: string;
  onStartOver: () => void;
  userProfile?: any;
}

interface CategoryPlan {
  category: string;
  content: string;
}

const AIResultDisplay: React.FC<AIResultDisplayProps> = ({ plan, onStartOver, userProfile }) => {
  const { token, user } = useAuth();
  const [parsedPlan, setParsedPlan] = useState<CategoryPlan[]>([]);
  const [excitementMessage, setExcitementMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(plan);
      if (parsed.plan && Array.isArray(parsed.plan)) {
        setParsedPlan(parsed.plan);
        setExcitementMessage(parsed.excitementMessage || "🎉 Your personalized plan is ready!");
      } else {
        setParsedPlan(Array.isArray(parsed) ? parsed : []);
        setExcitementMessage("🎉 Your personalized plan is ready!");
      }
    } catch (e) {
      console.error("Failed to parse AI plan:", e);
      setParsedPlan([{ category: 'Your Plan', content: plan }]);
      setExcitementMessage("🎉 Your personalized plan is ready!");
    }
  }, [plan]);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    document.body.classList.add('exporting-pdf');
    try {
      const doc = new jsPDF();
      const userName = user?.fullName || "Valued Member";
      
      // Header
      doc.setFillColor(79, 113, 83); // Wellspring Green
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("WELLSPRING", 105, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Your Personalized Wellness Journey", 105, 30, { align: 'center' });

      // Title
      doc.setTextColor(26, 46, 5); // Dark Green
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`${userName}'s Health & Wellness Plan`, 20, 55);

      // User Profile Table
      if (userProfile) {
        autoTable(doc, {
          startY: 65,
          head: [['Metric', 'Your Detail']],
          body: [
            ['Goal', userProfile.goal || 'General Wellness'],
            ['Age Group', userProfile.ageGroup || 'N/A'],
            ['Gender', userProfile.gender || 'N/A'],
            ['Diet Preference', userProfile.dietPreference || 'N/A'],
            ['Activity Level', userProfile.activityLevel || 'N/A'],
            ['Focus Area', userProfile.focusArea || 'General'],
          ],
          theme: 'striped',
          headStyles: { fillColor: [79, 113, 83] },
          margin: { left: 20, right: 20 },
        });
      }

      // Plan Content
      let lastY = (doc as any).lastAutoTable.finalY + 15;
      
      parsedPlan.forEach((section) => {
        if (lastY > 250) {
          doc.addPage();
          lastY = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(79, 113, 83);
        doc.text(section.category, 20, lastY);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        
        // Basic Markdown Strip and Split
        const cleanContent = section.content
          .replace(/\*\*/g, '')
          .replace(/###/g, '')
          .replace(/- /g, '\u2022 ');
          
        const lines = doc.splitTextToSize(cleanContent, 170);
        doc.text(lines, 20, lastY + 7);
        
        lastY += (lines.length * 5) + 15;
      });

      // Professional Disclaimer Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 280, 190, 280);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Disclaimer: This AI-generated plan is for informational purposes only. Consult a professional before making major changes.", 105, 287, { align: 'center' });
      }

      doc.save(`${userName.replace(/\s+/g, '_')}_Wellness_Plan.pdf`);
      toast.success("Health plan downloaded successfully!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
      document.body.classList.remove('exporting-pdf');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-32 space-y-12">
      {/* Friendly Excitement Message */}
      <AnimatePresence>
        {excitementMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-600 rounded-[3rem] p-12 text-white shadow-2xl shadow-emerald-200 text-center relative overflow-hidden group"
          >
            <Sparkles className="absolute top-6 right-6 h-10 w-10 text-emerald-300 opacity-40 group-hover:rotate-12 transition-transform" />
            <Sparkles className="absolute bottom-6 left-6 h-10 w-10 text-emerald-300 opacity-40 group-hover:-rotate-12 transition-transform" />
            <h2 className="text-4xl md:text-5xl font-display font-black leading-tight mb-4">
              {excitementMessage}
            </h2>
            <p className="text-emerald-100 text-xl font-medium opacity-90">
              Your comprehensive wellness journey is ready for download.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simplified Header with Centered Actions */}
      <div className="flex flex-col items-center justify-center gap-8 bg-[#F9F5EE] p-12 rounded-[3rem] border border-[#C8DBC9]/50 shadow-sm text-center">
        <div className="space-y-3">
          <h2 className="text-3xl font-display font-bold text-[#1A2E05]">Deliver Your Plan</h2>
          <p className="text-[#8A8478] text-lg max-w-lg mx-auto">
            We've compiled your nutrition, fitness, and wellness strategies into a detailed PDF.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Button 
            size="lg"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="rounded-full gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-16 text-lg font-black shadow-xl shadow-emerald-600/20 w-full sm:w-auto"
          >
            {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
            Download Your Plan (PDF)
          </Button>
          <Button 
            variant="ghost" 
            size="lg"
            onClick={onStartOver}
            className="rounded-full gap-2 text-[#4F7153] hover:bg-emerald-50 px-8 h-16 font-bold"
          >
            <RefreshCw className="w-5 h-5" />
            New Assessment
          </Button>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Plan generated by Wellspring AI Assistant</span>
        </div>
      </div>
    </div>
  );
};

export default AIResultDisplay;
