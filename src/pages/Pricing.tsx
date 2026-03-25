import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    features: ['View homepage', 'Limited post previews', 'View subscription plans', 'Browse communities'],
    cta: 'Current Plan',
    disabled: true,
    popular: false,
  },
  {
    name: 'Basic',
    price: '₹299',
    period: '/month',
    features: ['Join community discussions', 'Create & comment on posts', 'Join wellness sessions', 'Register for all sessions', 'Like and interact'],
    cta: 'Subscribe Now',
    disabled: false,
    popular: true,
    plan: 'basic',
    amount: 299,
  },
  {
    name: 'Premium',
    price: '₹699',
    period: '/month',
    features: ['Everything in Basic', 'Priority session access', 'Exclusive content', 'Direct expert messaging', 'Annual option: ₹6,999/year'],
    cta: 'Go Premium',
    disabled: false,
    popular: false,
    plan: 'premium',
    amount: 699,
  },
];

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16">
        <BackButton />
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Start with a 7-day free trial on any paid plan. Cancel anytime.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-xl p-8 flex flex-col relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">Most Popular</span>
              )}
              <h3 className="font-display text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.disabled ? (
                <Button variant="outline" disabled>{plan.cta}</Button>
              ) : (
                <Button asChild variant={plan.popular ? 'default' : 'outline'}>
                  <Link to={user ? `/payment?plan=${plan.plan}&amount=${plan.amount}` : '/signup'}>{plan.cta}</Link>
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
