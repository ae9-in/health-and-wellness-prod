import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1E1E1E] text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo & About */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6 group">
              <div className="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">Health and Wellness</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Your safe space for health discussions, wellness sessions, and community support.
            </p>
          </div>

          {/* Company */}
          <div className="flex flex-col">
            <h4 className="font-display font-bold text-lg mb-6">Company</h4>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/discussions" className="hover:text-white transition-colors">Discussions</Link>
              <Link to="/sessions" className="hover:text-white transition-colors">Sessions</Link>
              <Link to="/partner" className="hover:text-white transition-colors">Partner With Us</Link>
            </div>
          </div>

          {/* Platform */}
          <div className="flex flex-col">
            <h4 className="font-display font-bold text-lg mb-6">Platform</h4>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <Link to="/community" className="hover:text-white transition-colors">Communities</Link>
              <Link to="/discussions" className="hover:text-white transition-colors">Categories</Link>
            </div>
          </div>

          {/* Terms & Policies */}
          <div className="flex flex-col">
            <h4 className="font-display font-bold text-lg mb-6">Terms & Policies</h4>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/partner-terms" className="hover:text-white transition-colors">Terms of Community Partners</Link>
            </div>
          </div>

          {/* Support */}
          <div className="flex flex-col">
            <h4 className="font-display font-bold text-lg mb-6">Support</h4>
            <div className="flex flex-col gap-3 text-sm">
              <a 
                href="mailto:support@healthandwellness.com" 
                className="text-[#98FB98] hover:text-white transition-colors break-all font-bold"
              >
                support@healthandwellness.com
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40 text-center md:text-left">
          <p>© 2026 Health and Wellness. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
