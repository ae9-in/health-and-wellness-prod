import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import NotificationPanel from '@/components/NotificationPanel';
import AffiliateProductCard from '@/components/AffiliateProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart3,
  Link as LinkIcon,
  DollarSign,
  ArrowRight,
  ShoppingBag,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  FilterX,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getProducts } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import type { Product } from '@/lib/types';

export default function AffiliateDashboard() {
  const { user, token } = useAuth();
  const [commission, setCommission] = useState('15');
  const [sales, setSales] = useState('50');
  const [avgPrice, setAvgPrice] = useState('1000');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Debounced search/filter
    const timer = setTimeout(() => {
      getProducts({
        search: filters.search,
        category: filters.category !== 'all' ? filters.category : '',
        limit: 12
      })
        .then(data => {
          if (isMounted) {
            setProducts(data);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          if (isMounted) setLoading(false);
        });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filters]);

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'AFFILIATE' && user.role !== 'ADMIN') return null;

  const isPending = user.status === 'PENDING';

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-12 shadow-2xl border border-primary/10 text-center max-w-2xl"
          >
            <div className="h-20 w-20 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Clock className="h-10 w-10 animate-pulse" />
            </div>
            <h2 className="font-display text-4xl font-bold text-[#1A2E05] mb-4">Application Under Review</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Welcome to the health&wellness family, <span className="font-bold text-foreground">{user.fullName}</span>! Our admin team is currently reviewing your profile and social links. You'll receive a notification once your account is activated.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-bold text-orange-600">Under Review</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Est. Time</p>
                <p className="text-sm font-bold">24-48 Hours</p>
              </div>
            </div>
            <Button variant="ghost" className="mt-8 font-bold" asChild>
              <Link to="/dashboard">Go back to Member Home</Link>
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const referralLink = `https://wellnest.community/join?ref=${user.id}`;
  const monthlyProjected = (parseFloat(commission) / 100) * parseFloat(sales) * parseFloat(avgPrice);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Left Column: Sidebar */}
          <aside className="space-y-6">
            <NotificationPanel />
            
            {/* Quick Actions or Additional Info (Added for balance) */}
            <div className="bg-white rounded-[2rem] p-6 border border-primary/5 shadow-sm">
              <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-xs font-bold" asChild>
                  <Link to="/products"><ShoppingBag className="h-4 w-4" /> Browse Shop</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-xs font-bold" asChild>
                  <Link to="/community"><TrendingUp className="h-4 w-4" /> View Feed</Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Right Column: Main Content */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-primary/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative z-10">
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 tracking-tight text-[#1A2E05]">Affiliate Hub</h1>
                <p className="text-muted-foreground text-lg">
                  Welcome back, <span className="text-foreground font-bold">{user.fullName}</span>. Here's your impact today.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-3 self-start md:self-center px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Verified Partner</span>
              </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: 'Total Earnings', value: '₹48,250', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Pending Payout', value: '₹12,450', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Total Sales', value: '142', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Conversion', value: '4.8%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-5 border border-primary/5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-[#1A2E05]">{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Mid Section: Tool & Estimator */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Campaign Link Generator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#1A2E05] text-white rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col justify-between border border-white/5 min-h-[460px]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                      <LinkIcon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Campaign Magic</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-3xl font-bold mb-6 leading-tight">Share your journey and earn 20% commission on every sale.</h3>
                    <p className="text-white/60 mb-8 text-lg">Use your unique link across social platforms to track your impact and rewards.</p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Your Unique Referral Link</label>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner group hover:bg-white/10 transition-colors">
                      <span className="flex-1 px-3 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap text-white/90">
                        {referralLink}
                      </span>
                      <Button onClick={copyLink} variant="secondary" size="lg" className="rounded-xl font-bold px-6 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Earnings Estimator */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-primary/5 shadow-sm space-y-8 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-3 font-display">
                    <TrendingUp className="h-6 w-6 text-primary" /> Estimator
                  </h3>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-1 bg-muted rounded-full">Interactive Tool</div>
                </div>

                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Commission (%)</label>
                      <input
                        type="number"
                        className="w-full bg-[#FDFDFB] border border-primary/5 rounded-2xl px-5 py-4 font-bold text-lg shadow-inner focus:ring-2 focus:ring-primary outline-none transition-all"
                        value={commission}
                        onChange={e => setCommission(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monthly Sales</label>
                      <input
                        type="number"
                        className="w-full bg-[#FDFDFB] border border-primary/5 rounded-2xl px-5 py-4 font-bold text-lg shadow-inner focus:ring-2 focus:ring-primary outline-none transition-all"
                        value={sales}
                        onChange={e => setSales(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-[#1A2E05]/5 rounded-[2rem] p-6 border border-primary/5 space-y-5 flex flex-col justify-center shadow-inner">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Monthly Goal</p>
                      <p className="text-3xl font-black text-primary">₹{Math.floor(monthlyProjected).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Daily Target</p>
                      <p className="text-xl font-bold text-[#1A2E05]">₹{Math.floor(monthlyProjected / 30).toLocaleString()}</p>
                    </div>
                    <div className="pt-4 border-t border-primary/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Annual Projected</p>
                      <p className="text-2xl font-black text-[#1A2E05]">₹{Math.floor(monthlyProjected * 12).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block text-center">Average Product Price (₹)</label>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    value={avgPrice}
                    onChange={e => setAvgPrice(e.target.value)}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1">
                    <span>₹100</span>
                    <span className="text-primary font-black">₹{parseInt(avgPrice).toLocaleString()}</span>
                    <span>₹10,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Discovery Marketplace */}
            <div className="space-y-8 bg-white rounded-[3rem] p-8 md:p-12 border border-primary/5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/5 pb-8">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1A2E05] tracking-tight">Discovery Marketplace</h2>
                  <p className="text-muted-foreground text-lg mt-1 font-medium">Curate the best wellness products for your community.</p>
                </div>
                <Button variant="ghost" className="font-bold gap-2 self-start md:self-center bg-primary/5 hover:bg-primary/10 rounded-xl px-6" asChild>
                  <Link to="/products">
                    Switch to Full Gallery <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Discovery Filters */}
              <div className="grid md:grid-cols-[1fr_240px_100px] gap-4">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search premium products..."
                    className="pl-14 h-14 rounded-2xl border-primary/10 bg-[#FDFDFB] shadow-inner focus-visible:ring-primary text-base"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <select
                  className="h-14 px-6 rounded-2xl border border-primary/10 bg-[#FDFDFB] shadow-inner font-bold text-sm outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="h-14 w-full rounded-2xl border-primary/10 bg-[#FDFDFB] shadow-inner hover:bg-muted font-bold text-xs uppercase tracking-widest text-muted-foreground"
                  onClick={clearFilters}
                >
                  Reset
                </Button>
              </div>

              <div className="min-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-black uppercase text-[12px] tracking-[0.3em] mb-2">Syncing Inventory</p>
                      <p className="text-sm opacity-60">Refreshing your discovery feed...</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {products.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                      >
                        {products.map((product, i) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <AffiliateProductCard product={product} referralCode={user.id} />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-32 text-center bg-[#FDFDFB] rounded-[3rem] border-2 border-dashed border-primary/10 shadow-inner"
                      >
                        <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
                          <ShoppingBag className="h-12 w-12 text-primary opacity-30" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Inventory not found</h3>
                        <p className="text-muted-foreground mb-10 max-w-sm mx-auto">We couldn't find any products matching your filters. Try exploring other categories.</p>
                        <Button onClick={clearFilters} variant="secondary" className="rounded-2xl font-bold px-10 h-14 text-lg shadow-lg">
                          Reset All Filters
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
