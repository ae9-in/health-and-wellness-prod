import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
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
          <h1 className="font-display text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>
          
          <div className="glass-card rounded-2xl p-8 space-y-8 border border-primary/10 leading-relaxed text-muted-foreground">
            <section>
              <p className="mb-6 italic">Effective Date: {new Date().toLocaleDateString()}</p>
              <p className="mb-6">We value your privacy and are committed to protecting your personal data.</p>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">1. Information We Collect</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Name, email, phone number</li>
                    <li>Location (optional)</li>
                    <li>Usage data (pages visited, interactions)</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">2. How We Use Your Data</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To improve user experience</li>
                    <li>To personalize content</li>
                    <li>To communicate updates and offers</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">3. Data Protection</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We implement security measures to protect your data.</li>
                    <li>Your data is not sold to third parties.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">4. Cookies</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We use cookies to enhance browsing experience.</li>
                    <li>You can disable cookies in your browser settings.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">5. Third-Party Services</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We may use third-party tools (analytics, ads, payment gateways).</li>
                    <li>These services have their own privacy policies.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">6. Your Rights</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You can request to access, update, or delete your data.</li>
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
