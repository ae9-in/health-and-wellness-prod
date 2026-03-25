import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { motion } from 'framer-motion';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <BackButton />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-16"
        >
          <h1 className="font-display text-4xl font-bold mb-8 text-primary">Terms of Use</h1>
          
          <div className="glass-card rounded-2xl p-8 space-y-8 border border-primary/10 leading-relaxed text-muted-foreground">
            <section>
              <p className="mb-6 italic">Welcome to our Health & Wellness Platform. By accessing or using our website, you agree to the following terms:</p>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">1. Use of the Platform</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You must be at least 18 years old or have parental consent.</li>
                    <li>You agree to use the platform only for lawful purposes.</li>
                    <li>You must not misuse, hack, or disrupt the platform.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">2. Health Disclaimer</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Content provided is for informational purposes only.</li>
                    <li>It is not a substitute for professional medical advice.</li>
                    <li>Always consult a qualified healthcare provider before making health decisions.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">3. User Accounts</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You are responsible for maintaining the confidentiality of your account.</li>
                    <li>Any activity under your account is your responsibility.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">4. Content Ownership</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All website content (text, images, branding) is owned by us.</li>
                    <li>You may not copy, reproduce, or distribute without permission.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">5. Termination</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We reserve the right to suspend or terminate accounts for violations.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
