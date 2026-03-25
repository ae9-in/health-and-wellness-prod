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
      <div className="w-full max-w-md">
        <div className="text-center mb-10 text-white">
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="bg-white/10 p-2.5 rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <span className="font-display text-3xl font-bold tracking-tight">health&wellness</span>
            </Link>
          <h1 className="font-display text-4xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 font-medium text-white/80">Continue your wellness journey</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E1E1E] rounded-[2.5rem] p-10 shadow-2xl border border-[#333] relative overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/10"
              >
                {error}
              </motion.div>
            )}

            <div className="credential-panel">
              <div className="credential-grid">
                <div className="credential-card">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative mt-2">
                    <Input 
                      id="email" 
                      type="email" 
                      className="credential-input"
                      placeholder="name@example.com"
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                  </div>
                </div>

                <div className="credential-card">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                    <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot?</Link>
                  </div>
                  <div className="relative mt-2">
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      className="credential-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </Button>

            <div className="pt-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                First time here? <Link to="/signup" className="text-primary font-bold hover:underline">Create an account</Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
