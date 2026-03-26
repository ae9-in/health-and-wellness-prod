import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Leaf, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.success) {
      toast.success('Welcome back to health&wellness!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB] px-4 py-12">
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-10 text-[#0B0B0B]">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="bg-white p-3 rounded-2xl shadow-2xl transition-transform group-hover:scale-105">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-[#0B0B0B]">health&wellness</span>
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 font-medium text-muted-foreground">Continue your wellness journey</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F0F0F] rounded-[1.5rem] p-10 shadow-[0_35px_70px_rgba(5,5,5,0.55)] border border-white/10 relative overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/10"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="space-y-5">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    className="credential-input"
                    placeholder="name@example.com"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A9E7E]/90" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Password</Label>
                  <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-[0.35em] text-primary hover:text-primary/80">Forgot?</Link>
                </div>
                <div className="relative">
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    className="credential-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A9E7E]/90" />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="max-w-[260px] w-full rounded-[1.5rem] px-10 py-3.5 text-lg font-semibold shadow-[0_15px_45px_rgba(79,113,83,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-primary text-white border border-transparent"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
                {!isLoading && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>

            <p className="text-center pt-2 text-sm font-medium text-muted-foreground tracking-wide">
              First time here? <Link to="/signup" className="text-primary font-bold hover:underline">Create an account</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
