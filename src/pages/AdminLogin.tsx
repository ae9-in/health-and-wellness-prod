import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Leaf, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await adminLogin(email, password);
      if (success) {
        toast.success('Access Granted. Welcome back, Admin.');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid administrative credentials');
        toast.error('Authentication Failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 selection:bg-primary/20">
      {/* Abstract Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-500">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <span className="font-display text-4xl font-black tracking-tight text-[#1A2E05]">health&wellness</span>
          </Link>
          
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administrative Portal</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-2xl shadow-primary/5 p-10 relative overflow-hidden">
          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#1A2E05] mb-2 text-center">Identity Verification</h2>
            <p className="text-sm text-muted-foreground font-medium text-center">Secure access to the health&wellness Command Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-destructive/5 border border-destructive/10 p-4 text-xs font-bold text-destructive flex items-center gap-3"
              >
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Admin Identity</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="admin@healthwellness.com"
                  className="rounded-2xl h-14 pl-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-medium placeholder:text-muted-foreground/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Secure Key</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary pointer-events-none" />
                <PasswordInput
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-2xl h-14 pl-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-medium placeholder:text-muted-foreground/40"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-[#1A2E05] hover:bg-[#2A4010] text-white font-black tracking-widest text-xs uppercase shadow-xl shadow-[#1A2E05]/20 group transition-all duration-300"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Initialize Access <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-border/40 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 italic">
              Authorized Personnel Only • Hardware Encryption Enabled
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="text-xs font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            Return to Main Entry
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
