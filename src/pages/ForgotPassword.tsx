import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Leaf } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB] px-4 py-12">
      <div className="w-full max-w-[460px] rounded-[1.5rem] border border-border/50 bg-white p-8 shadow-xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mt-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0B0B0B]">Forgot Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your account email and we will help you recover access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Send Recovery Request
          </Button>
        </form>

        {submitted && (
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            If this email exists, a recovery request is now recorded. You can also contact support at
            {' '}
            <a className="font-semibold underline" href="mailto:support@healthwellness.com">support@healthwellness.com</a>.
          </p>
        )}
      </div>
    </div>
  );
}
