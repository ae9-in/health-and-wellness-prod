import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <div className="w-full max-w-[460px] rounded-[1.5rem] border border-border/50 bg-white p-8 shadow-xl">
        <Link to="/admin/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to admin login
        </Link>

        <div className="mt-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A2E05]">Admin Password Recovery</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit your admin email to start secure account recovery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
              Admin Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@healthwellness.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#1A2E05] hover:bg-[#2A4010]">
            Send Admin Recovery Request
          </Button>
        </form>

        {submitted && (
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            Recovery request submitted. For urgent access issues, email
            {' '}
            <a className="font-semibold underline" href="mailto:support@healthwellness.com">support@healthwellness.com</a>.
          </p>
        )}
      </div>
    </div>
  );
}
