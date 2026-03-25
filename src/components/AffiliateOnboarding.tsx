import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateAffiliateProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const FOCUS_AREAS = ['Nutrition', 'Fitness', 'Mental Wellness', 'Yoga', 'Herbal Products', 'Supplements', 'Ayurveda', 'Weight Loss'];

export default function AffiliateOnboarding() {
  const [step, setStep] = useState(1);
  const [socialLinks, setSocialLinks] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const canAdvance = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return interests.length >= 2;
    return true;
  }, [step, interests]);

  const handleToggleInterest = (topic: string) => {
    setInterests(prev => prev.includes(topic) ? prev.filter(item => item !== topic) : [...prev, topic]);
  };

  const { token } = useAuth();
  
  const handleSubmit = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await updateAffiliateProfile(token, { socialLinks, interests });
      setMessage('Profile saved. Admin will review your application shortly.');
      setStep(3);
    } catch (err) {
      console.error('Onboarding save error', err);
      setMessage('Unable to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4 border border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Affiliate Onboarding</p>
          <h3 className="font-display text-xl font-semibold">Multi-step profile</h3>
        </div>
        <div className="text-xs text-muted-foreground">Step {step} / 3</div>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <Label>Social media & website</Label>
            <Input value={socialLinks} onChange={e => setSocialLinks(e.target.value)} placeholder="Instagram, YouTube, LinkedIn..." />
          </div>
          <div>
            <Label>City</Label>
            <Input placeholder="Mumbai, Delhi..." />
          </div>
          <p className="text-xs text-muted-foreground">We will keep this information private until you go live.</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Choose up to 3 interest areas</p>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_AREAS.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => handleToggleInterest(area)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${interests.includes(area) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'}`}
              >
                {area}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{interests.length}/3 selected</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Thank you.</p>
          <p className="text-sm text-muted-foreground">As soon as the admin approves your profile you’ll unlock the affiliate dashboard.</p>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>
      )}

      <div className="flex justify-between">
        {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 3 && (
          <Button disabled={!canAdvance} onClick={() => setStep(step + 1)}>
            {step === 2 ? 'Save & Request Approval' : 'Next'}
          </Button>
        )}
        {step === 2 && (
          <Button className="ml-auto" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        )}
      </div>
    </div>
  );
}
