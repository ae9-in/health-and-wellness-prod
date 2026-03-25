import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  amount: number;
  onSuccess: () => void;
}

export default function CheckoutModal({ open, onOpenChange, productName, amount, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment gateway delay
    await new Promise(r => setTimeout(r, 2000));
    
    setLoading(false);
    setSuccess(true);
    
    // Auto-invoke success callback after brief celebration
    setTimeout(() => {
      onSuccess();
      setSuccess(false);
      setForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!loading && !success) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in" />
            <h2 className="text-2xl font-bold font-display">Payment Successful!</h2>
            <p className="text-muted-foreground">Thank you for your purchase.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Checkout Demo</DialogTitle>
              <DialogDescription>
                Complete your simulated purchase for <strong>{productName}</strong>. Total: <strong>₹{amount}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCheckout} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input 
                  required 
                  placeholder="John Doe" 
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    required 
                    className="pl-9" 
                    placeholder="0000 0000 0000 0000" 
                    value={form.cardNumber}
                    onChange={e => setForm(f => ({...f, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16)}))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input 
                    required 
                    placeholder="MM/YY" 
                    value={form.expiry}
                    onChange={e => setForm(f => ({...f, expiry: e.target.value.slice(0, 5)}))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input 
                    required 
                    type="password" 
                    placeholder="123" 
                    maxLength={4}
                    value={form.cvv}
                    onChange={e => setForm(f => ({...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)}))}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6 h-12 text-lg" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  `Pay ₹${amount}`
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
