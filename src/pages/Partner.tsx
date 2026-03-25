import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { submitPartnership } from '@/lib/api';
import { Partnership } from '@/lib/types';
import { toast } from 'sonner';
import { Handshake } from 'lucide-react';

export default function Partner() {
  const [form, setForm] = useState({ organizationName: '', contactPerson: '', email: '', phone: '', website: '', proposal: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p: any = {
      ...form, status: 'PENDING'
    };
    submitPartnership(p)
      .then(() => {
        toast.success('Partnership request submitted! We\'ll review it shortly.');
        setForm({ organizationName: '', contactPerson: '', email: '', phone: '', website: '', proposal: '' });
      })
      .catch(err => {
        toast.error(err.message || 'Failed to submit partnership request');
      });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16">
        <BackButton />
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Handshake className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="font-display text-4xl font-bold mb-4">Partner With Us</h1>
            <p className="text-muted-foreground">We welcome organizations passionate about health and wellness to join our community.</p>
          </div>
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Organization Name *</Label><Input value={form.organizationName} onChange={e => setForm(f => ({...f, organizationName: e.target.value}))} /></div>
              <div><Label>Contact Person *</Label><Input value={form.contactPerson} onChange={e => setForm(f => ({...f, contactPerson: e.target.value}))} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
            </div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} /></div>
            <div><Label>Partnership Proposal *</Label><Textarea value={form.proposal} onChange={e => setForm(f => ({...f, proposal: e.target.value}))} rows={5} /></div>
            <Button type="submit" className="w-full">Submit Partnership Request</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
