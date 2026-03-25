import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { motion } from 'framer-motion';

export default function PartnerTerms() {
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
          <h1 className="font-display text-4xl font-bold mb-8 text-primary">Terms of Community Partners</h1>
          
          <div className="glass-card rounded-2xl p-8 space-y-8 border border-primary/10 leading-relaxed text-muted-foreground">
            <section>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">1. Eligibility</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Must provide accurate and verified information during registration.</li>
                    <li>Must comply with platform guidelines.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">2. Content Guidelines</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Content must be:
                      <ul className="list-circle pl-6 mt-2 space-y-1">
                        <li>Genuine and not misleading</li>
                        <li>Health-safe and ethical</li>
                        <li>Free from harmful or false claims</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">3. Promotions & Affiliate Links</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All promotional content must be clearly disclosed.</li>
                    <li>No spam or deceptive marketing allowed.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">4. Payments & Commissions</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Affiliates may earn commissions based on platform rules.</li>
                    <li>Payments are processed as per agreed terms.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">5. Prohibited Activities</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Fake reviews or misleading claims</li>
                    <li>Posting harmful or unsafe health advice</li>
                    <li>Violating intellectual property rights</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">6. Termination</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Accounts may be removed for violations without prior notice.</li>
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
