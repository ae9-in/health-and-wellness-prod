import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, User, ShieldCheck, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

import { motion } from 'framer-motion';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('USER');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirm: '',
    mobile: '',
    city: '',
    age: '',
    socialLinks: '',
    businessCategory: '',
    brandName: '',
    address: '',
    gstNumber: '',
    interests: [] as string[]
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const affiliateInterests = [
    'Nutrition', 'Fitness', 'Mental Wellness', 'Yoga', 
    'Herbal Products', 'Supplements', 'Ayurveda', 'Weight Loss'
  ];

  const handleInterestToggle = (interest: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest].slice(0, 3) // Max 3 as per req
    }));
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!form.fullName || !form.email || !form.password) {
        setError('Please fill in all basic details');
        return;
      }
      if (form.password !== form.confirm) {
        setError('Passwords do not match');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (form.interests.length < 2) {
        setError('Please select at least 2 interests');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    
    const payload = {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role,
      mobile: form.mobile || undefined,
      city: form.city || undefined,
      age: form.age ? parseInt(form.age) : undefined,
      socialLinks: (role === 'AFFILIATE' || role === 'BRAND') ? form.socialLinks : undefined,
      businessCategory: role === 'BRAND' ? form.businessCategory : undefined,
      brandName: role === 'BRAND' ? form.brandName : undefined,
      contactPerson: role === 'BRAND' ? form.fullName : undefined,
      address: role === 'BRAND' ? form.address : undefined,
      gstNumber: role === 'BRAND' ? form.gstNumber : undefined,
      interests: role === 'AFFILIATE' ? form.interests : undefined,
    };

    const result = await signup(payload);
    if (result.success) {
      if (role === 'AFFILIATE') {
        setStep(3);
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Signup failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB] px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="bg-primary/10 p-2.5 rounded-2xl group-hover:scale-110 transition-transform">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-foreground">health&wellness</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-[#1A2E05]">
            {role === 'AFFILIATE' ? `Affiliate Onboarding (Step ${step}/3)` : 'Create Your Account'}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {role === 'AFFILIATE' && step === 2 ? 'Select your niche areas' : 'Choose your path in our wellness ecosystem'}
          </p>
        </div>

        {step < 3 && (
          <Tabs defaultValue="USER" onValueChange={(v) => { setRole(v as Role); setStep(1); }} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-3 h-14 p-1.5 bg-muted/50 rounded-2xl">
              <TabsTrigger value="USER" className="rounded-xl font-bold flex items-center gap-2">
                <User className="h-4 w-4" /> Member
              </TabsTrigger>
              <TabsTrigger value="AFFILIATE" className="rounded-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Affiliate
              </TabsTrigger>
              <TabsTrigger value="BRAND" className="rounded-xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Brand
              </TabsTrigger>
            </TabsList>
            
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-primary/5 space-y-6 mt-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/10 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span>{error}</span>
                    {(error.toLowerCase().includes('already registered') || error.toLowerCase().includes('conflict')) && (
                      <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] uppercase border-destructive/30 hover:bg-destructive/10 text-destructive shrink-0" asChild>
                        <Link to="/login">Login Instead</Link>
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {role === 'AFFILIATE' && step === 2 ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4">
                    {affiliateInterests.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`p-4 rounded-2xl border text-sm font-bold transition-all text-left flex items-center justify-between group ${
                          form.interests.includes(interest) 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-muted/10 border-transparent hover:border-primary/30 text-muted-foreground'
                        }`}
                      >
                        {interest}
                        {form.interests.includes(interest) && <ShieldCheck className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-center font-black uppercase tracking-widest text-muted-foreground">Select 2-3 categories to receive tailored recommendations</p>
                  <Button 
                    type="button"
                    onClick={handleNext} 
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    {isLoading ? 'Processing...' : 'Submit Application'}
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(1)} className="w-full font-bold">Back to Details</Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                      <Input className="rounded-xl h-12 bg-muted/30 border-none" value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                      <Input type="email" className="rounded-xl h-12 bg-muted/30 border-none" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                      <PasswordInput
                        className="rounded-xl h-12 bg-muted/30 border-none"
                        value={form.password}
                        onChange={e => setForm(f => ({...f, password: e.target.value}))}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm</Label>
                      <PasswordInput
                        className="rounded-xl h-12 bg-muted/30 border-none"
                        value={form.confirm}
                        onChange={e => setForm(f => ({...f, confirm: e.target.value}))}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {(role === 'USER' || role === 'AFFILIATE') && (
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Number</Label>
                        <Input className="rounded-xl h-12 bg-muted/30 border-none" value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                        <Input className="rounded-xl h-12 bg-muted/30 border-none" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                      </div>
                    </div>
                  )}

                  {role === 'USER' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Age</Label>
                      <Input type="number" className="rounded-xl h-12 bg-muted/30 border-none" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))} />
                    </div>
                  )}

                  {role === 'AFFILIATE' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Social Media Links (Optional)</Label>
                      <Input className="rounded-xl h-12 bg-primary/5 border-primary/20" placeholder="e.g. Instagram, Website" value={form.socialLinks} onChange={e => setForm(f => ({...f, socialLinks: e.target.value}))} />
                    </div>
                  )}

                  {role === 'BRAND' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">Brand Name</Label>
                        <Input className="rounded-xl h-12 bg-blue-50/50 border-blue-200" placeholder="e.g. health&wellness Pro" value={form.brandName} onChange={e => setForm(f => ({...f, brandName: e.target.value}))} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">Business Category</Label>
                          <Input className="rounded-xl h-12 bg-blue-50/50 border-blue-200" placeholder="e.g. Wellness Products" value={form.businessCategory} onChange={e => setForm(f => ({...f, businessCategory: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">GST Number (Optional)</Label>
                          <Input className="rounded-xl h-12 bg-blue-50/50 border-blue-200" placeholder="12AAAAA0000A1Z5" value={form.gstNumber} onChange={e => setForm(f => ({...f, gstNumber: e.target.value}))} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">Phone Number</Label>
                          <Input className="rounded-xl h-12 bg-blue-50/50 border-blue-200" value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">Website / Social</Label>
                          <Input className="rounded-xl h-12 bg-blue-50/50 border-blue-200" placeholder="https://..." value={form.socialLinks} onChange={e => setForm(f => ({...f, socialLinks: e.target.value}))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">Business Address</Label>
                        <Input className="rounded-xl h-12 bg-blue-50/50 border-blue-200" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="button"
                    onClick={role === 'AFFILIATE' ? handleNext : () => handleSubmit()} 
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    {isLoading ? 'Creating Account...' : (role === 'AFFILIATE' ? 'Continue to Interests' : 'Complete Registration')}
                  </Button>
                </div>
              )}
              
              <p className="text-center text-sm font-medium text-muted-foreground pt-2">
                Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
              </p>
            </div>
          </Tabs>
        )}

        {role === 'AFFILIATE' && step === 3 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-primary/10 text-center space-y-8"
          >
            <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ShieldCheck className="h-12 w-12" />
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold text-[#1A2E05] mb-4">Application Submitted!</h2>
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="p-4 rounded-2xl bg-muted/20 border border-muted-foreground/10 text-sm font-bold flex items-center justify-between">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Current Status</span>
                  <span className="text-orange-600 uppercase tracking-widest text-[10px] bg-orange-50 px-3 py-1 rounded-full">Under Review</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Our admin team is reviewing your profile. Once approved, you'll get full access to your affiliate dashboard and link generator.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-2xl font-bold">Return to Dashboard</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
