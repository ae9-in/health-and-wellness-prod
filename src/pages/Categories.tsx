import { Link } from 'react-router-dom';
import { CATEGORIES, CATEGORY_INFO } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Brain, Dumbbell, Apple, Sun, HeartPulse, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap: Record<string, React.ElementType> = {
  Brain,
  Dumbbell,
  Apple,
  Sun,
  HeartPulse
};

export default function Categories() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton />
        
        <div className="text-center mb-16 pt-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Wellness Communities</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Discover specialized spaces where you can connect, share, and grow with others on similar health and wellness paths.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {CATEGORIES.map((cat, i) => {
            const info = CATEGORY_INFO[cat];
            const Icon = iconMap[info.icon] || Brain;
            
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-8 flex flex-col h-full hover:shadow-lg transition-all border border-primary/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Icon className="w-8 h-8" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-4">{cat}</h2>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                  {info.description}
                </p>
                <Button asChild className="w-full group">
                  <Link to={`/discussions?category=${encodeURIComponent(cat)}`}>
                    Join Community <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Community Values */}
        <section className="wellness-gradient rounded-3xl p-12 text-primary-foreground text-center mb-16">
          <h2 className="font-display text-3xl font-bold mb-6">Our Community Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-2">Safe & Supportive</h3>
              <p className="text-primary-foreground/80 text-sm">A moderated environment ensuring everyone feels safe to share their journey.</p>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Expert-Led</h3>
              <p className="text-primary-foreground/80 text-sm">Access to verified information and wellness sessions led by professionals.</p>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Privacy First</h3>
              <p className="text-primary-foreground/80 text-sm">Your data and discussions are handled with the utmost care and confidentiality.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
