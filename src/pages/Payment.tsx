import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { createPayment } from '@/lib/api';
import { Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage() {
  const { user, syncUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = params.get('plan') || 'basic';
  const amount = parseFloat(params.get('amount') || '299');
  const [form, setForm] = useState({ name: '', card: '', expiry: '', cvv: '', email: '' });
  const [processing, setProcessing] = useState(false);

  if (!user) return <Navigate to="/login" />;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.card || !form.expiry || !form.cvv || !form.email) {
      toast.error('Please fill all fields');
      return;
    }

    setProcessing(true);
    const mockSuccess = form.card.replace(/\s/g, '') === '4242424242424242' || form.card.replace(/\s/g, '').length === 16;
    
    if (!mockSuccess) {
      toast.error('Invalid card details for simulation.');
      setProcessing(false);
      return;
    }

    const token = localStorage.getItem('wellnest_token');
    if (!token) return;
    createPayment(token, {
      amount,
      plan,
      paymentStatus: 'success',
      transactionId: `TXN_${Date.now()}`
    })
      .then(() => {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        syncUser({
          ...user,
          subscriptionStatus: 'active',
          subscriptionPlan: plan as 'basic' | 'premium',
          subscriptionExpiry: expiry.toISOString(),
        });
        toast.success('Payment Successful! Your subscription is now active.');
        navigate('/profile');
      })
      .catch(err => {
        toast.error(err.message || 'Payment Failed. Please try again.');
      })
      .finally(() => setProcessing(false));
  };

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Leaf className="h-8 w-8 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold">Complete Payment</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{plan} Plan — ₹{amount}/month</p>
        </div>

        <form onSubmit={handlePayment} className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Lock className="h-3 w-3" />
            <span>Demo payment — use card 4242 4242 4242 4242</span>
          </div>

          <div><Label>Cardholder Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="John Doe" /></div>
          <div>
            <Label>Card Number</Label>
            <div className="relative">
              <Input value={form.card} onChange={e => setForm(f => ({...f, card: formatCard(e.target.value)}))} placeholder="4242 4242 4242 4242" />
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Expiry</Label><Input value={form.expiry} onChange={e => setForm(f => ({...f, expiry: e.target.value}))} placeholder="12/30" maxLength={5} /></div>
            <div><Label>CVV</Label><Input value={form.cvv} onChange={e => setForm(f => ({...f, cvv: e.target.value}))} placeholder="123" maxLength={3} type="password" /></div>
          </div>
          <div><Label>Billing Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="john@example.com" /></div>

          <Button type="submit" className="w-full" disabled={processing}>
            {processing ? 'Processing...' : `Pay ₹${amount}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
