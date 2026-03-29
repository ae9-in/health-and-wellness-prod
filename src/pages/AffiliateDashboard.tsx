import { useState, useEffect } from 'react';
import type { Post } from '@/lib/types';
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
  Loader2,
  HelpCircle,
  Calendar,
  Globe,
  PlusCircle
} from 'lucide-react';
import CompactCreatePost from '@/components/CompactCreatePost';
import FeedPost from '@/components/FeedPost';
import { getAuthorPosts } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import { getProducts, getAffiliateDashboard, createCommissionRequest } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import type { Product } from '@/lib/types';

export default function AffiliateDashboard() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [commission, setCommission] = useState('15');
  const [sales, setSales] = useState('50');
  const [avgPrice, setAvgPrice] = useState('1000');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
  });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedCommission, setRequestedCommission] = useState('20');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const calculateTieredCommission = (salesVal: number) => {
    if (salesVal <= 10) return 10;
    if (salesVal <= 30) return 15;
    if (salesVal <= 50) return 20;
    return 25;
  };
  const { data: affiliateData } = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => getAffiliateDashboard(token!),
    enabled: !!token,
  });

  const { data: authorPosts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['authorPosts', user?.id],
    queryFn: () => getAuthorPosts(user!.id),
    enabled: !!token && !!user?.id
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

    const handleProductChange = () => {
      getProducts({
        search: filters.search,
        category: filters.category !== 'all' ? filters.category : '',
        limit: 12
      }).then((data: any) => {
        if (isMounted) setProducts(data?.products || data || []);
      });
    };

    const handleCommissionChange = () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
    };

    socket.on('product:created', handleProductChange);
    socket.on('product:updated', handleProductChange);
    socket.on('product:deleted', handleProductChange);
    socket.on('commission:updated', handleCommissionChange);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      socket.off('product:created', handleProductChange);
      socket.off('product:updated', handleProductChange);
      socket.off('product:deleted', handleProductChange);
      socket.off('commission:updated', handleCommissionChange);
    };
  }, [filters, queryClient]);

  useEffect(() => {
    // Priority: Custom Commission > Tiered Commission
    if (affiliateData?.customCommission !== undefined && affiliateData?.customCommission !== null) {
      setCommission(String(affiliateData.customCommission));
    } else {
      setCommission(String(calculateTieredCommission(parseInt(sales) || 0)));
    }
  }, [sales, affiliateData?.customCommission]);

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

  const couponCode = affiliateData?.coupon?.code ?? '';
  const monthlyProjected = (parseFloat(commission) / 100) * parseFloat(sales) * parseFloat(avgPrice);

  const copyCouponCode = () => {
    const textToCopy = couponCode || `https://wellnest.community/join?ref=${user.id}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success(`${couponCode ? 'Coupon code' : 'Referral link'} copied!`);
  };

  const shareCouponCode = async () => {
    const textToShare = couponCode 
      ? `Use coupon ${couponCode} to save on wellness gear!` 
      : `Check out Health & Wellness: https://wellnest.community/join?ref=${user.id}`;
      
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Health & Wellness',
          text: textToShare,
        });
      } catch {
        // share cancelled
      }
    } else {
      toast('Sharing is not supported on this device. Copy the code manually.');
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '' });
  };

  const handleCreateRequest = async () => {
    if (!requestedCommission || !requestReason) {
      toast.error('Please fill in all fields');
      return;
    }
    const reqVal = parseFloat(requestedCommission);
    if (isNaN(reqVal) || reqVal < 1 || reqVal > 50) {
      toast.error('Commission must be between 1% and 50%');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await createCommissionRequest(token!, {
        requestedCommission: reqVal,
        reason: requestReason,
        currentCommission: parseFloat(commission)
      });
      toast.success('Commission request submitted successfully!');
      setIsRequestModalOpen(false);
      setRequestReason('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
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
                { label: 'Total Earnings', value: `₹${Math.floor(affiliateData?.earnings?.total || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Pending Payout', value: `₹${Math.floor(affiliateData?.earnings?.pending || 0).toLocaleString()}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Total Sales', value: affiliateData?.earnings?.totalSales || '0', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Conversion', value: `${affiliateData?.earnings?.conversionRate || 0}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                    <h3 className="text-3xl font-bold mb-6 leading-tight">The outcome varies based on the number of units sold.</h3>
                    <p className="text-white/60 mb-8 text-lg">Use your unique coupon code across social platforms to track your impact and rewards.</p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      {couponCode ? 'Your Unique Coupon Code' : 'Your Unique Referral Link'}
                    </label>
                    <div className="bg-white/5 border border-white/10 shadow-inner rounded-2xl p-5 space-y-3">
                      <p className={`text-white/80 ${couponCode ? 'text-2xl font-mono tracking-[0.4em]' : 'text-sm font-medium break-all'}`}>
                        {couponCode || `https://wellnest.community/join?ref=${user.id}`}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          onClick={copyCouponCode} 
                          variant="secondary" 
                          className="rounded-xl font-bold px-6 py-3 shadow-lg shadow-black/20"
                        >
                          {couponCode ? 'Copy Code' : 'Copy Link'}
                        </Button>
                        <Button variant="ghost" className="rounded-xl font-bold px-6 py-3 text-white border border-white/40" onClick={shareCouponCode}>
                          Share
                        </Button>
                      </div>
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Commission (%)</label>
                          {affiliateData?.customCommission && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Custom Applied</span>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative">
                                <input
                                  type="number"
                                  className="w-full bg-muted/20 border border-primary/5 rounded-2xl px-5 py-4 font-bold text-lg shadow-inner outline-none transition-all cursor-not-allowed opacity-80"
                                  value={commission}
                                  readOnly
                                  disabled
                                />
                                <HelpCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs font-medium">Commission is based on your sales performance</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-6 p-0 text-[10px] font-bold text-primary hover:text-primary/80"
                          onClick={() => {
                            setRequestedCommission(String(calculateTieredCommission(parseInt(sales) || 0) + 5));
                            setIsRequestModalOpen(true);
                          }}
                          disabled={!!affiliateData?.activeRequest}
                        >
                          {affiliateData?.activeRequest ? 'Request Pending...' : 'Request Custom Commission'}
                        </Button>
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
            
            <div id="community-posts" className="space-y-8 bg-white rounded-[3rem] p-8 md:p-12 border border-primary/5 shadow-sm">
              <div className="flex flex-col gap-6 border-b border-primary/5 pb-8">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#1A2E05] tracking-tight">My Community Posts</h2>
                  <p className="text-muted-foreground text-lg mt-1 font-medium">Sharing your wellness journey with the community.</p>
                </div>
                
                <CompactCreatePost onSuccess={refetchPosts} />
              </div>

              {authorPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {authorPosts.slice(0, 4).map((post: Post) => (
                    <div key={post.id} className="bg-[#FDFDFB] rounded-[2rem] border border-primary/5 p-4 shadow-inner">
                      <FeedPost post={post} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-[#FDFDFB] rounded-[3rem] border-2 border-dashed border-primary/10 shadow-inner">
                  <Globe className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Build your authority</h3>
                  <p className="text-muted-foreground mb-10 max-w-sm mx-auto">Create wellness articles or success stories to inspire others and boost your affiliate profile.</p>
                  <Button onClick={() => document.getElementById('community-posts')?.scrollIntoView({ behavior: 'smooth' })} variant="secondary" className="rounded-2xl font-bold px-10 h-14">
                    Create Your First Post
                  </Button>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <NotificationPanel />

            <div className="bg-white rounded-[2.5rem] p-6 border border-primary/5 shadow-sm space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => document.getElementById('community-posts')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full justify-start gap-2 rounded-xl text-sm font-bold bg-[#1A2E05] hover:bg-[#2A4E05]"
                >
                  <PlusCircle className="h-4 w-4" /> Create New Post
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-sm font-bold" asChild>
                  <Link to="/products"><ShoppingBag className="h-4 w-4" /> Browse Shop</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-sm font-bold" asChild>
                  <Link to="/community"><TrendingUp className="h-4 w-4" /> View Feed</Link>
                </Button>
              </div>
            </div>

            <div className="bg-[#1A2E05] text-white rounded-[2.5rem] p-6 border border-white/20 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Affiliate Snapshot</p>
                {affiliateData?.earnings?.totalSales !== undefined && (
                  <div className="px-2 py-1 bg-white/10 rounded-md text-[9px] font-bold">
                    {affiliateData.earnings.totalSales < 10 
                      ? "Getting started" 
                      : affiliateData.earnings.totalSales <= 50 
                      ? "Good progress" 
                      : "High performer"}
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-lg">{user.fullName}</p>
                <div className="space-y-1">
                  <p className="text-white/80 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Verified Partner
                  </p>
                  <p className="text-white/60 text-xs italic leading-relaxed">
                    {affiliateData?.earnings?.totalSales < 10
                      ? "Getting started – increase your reach to boost earnings."
                      : affiliateData?.earnings?.totalSales <= 50
                      ? "Good progress – your impact is growing."
                      : "High performer – strong conversion and earnings."}
                  </p>
                </div>
                <div className="pt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Units Sold</p>
                    <p className="font-bold">{affiliateData?.earnings?.totalSales || 0}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Earnings</p>
                    <p className="font-bold">₹{Math.floor(affiliateData?.earnings?.total || 0).toLocaleString()}</p>
                  </div>
                </div>
                {affiliateData?.earnings?.nextPayoutDate && (
                  <div className="pt-2 border-t border-white/10 mt-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
                      <Calendar className="h-2 w-2" /> Next Payout
                    </p>
                    <p className="font-bold text-xs text-[#C1FF72]">
                      {new Date(affiliateData.earnings.nextPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-50">
                  {couponCode ? "Your Coupon Code" : "Your Referral Link"}
                </label>
                <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-between text-xs font-mono">
                  <span className="truncate mr-2">
                    {couponCode || `https://wellnest.community/join?ref=${user.id}`}
                  </span>
                  <Button 
                    variant="ghost" 
                    className="text-white p-0 h-auto text-sm font-bold hover:bg-transparent hover:text-primary transition-colors" 
                    onClick={() => { 
                      navigator.clipboard.writeText(couponCode || `https://wellnest.community/join?ref=${user.id}`); 
                      toast.success(`${couponCode ? 'Coupon code' : 'Link'} copied!`); 
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />


      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] bg-[#0f2e1c] border-white/10 text-white z-[9999] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[2rem]" />
          <DialogHeader className="p-8 pb-4 relative z-10">
            <DialogTitle className="text-3xl font-bold font-display text-white">Request Custom Commission</DialogTitle>
            <DialogDescription className="text-white/60 text-base mt-2">
              Empower your performance. Submit a request for a custom rate and our team will review it shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 pt-0 space-y-6 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Requested Rate (%)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold group-focus-within:text-[#C1FF72] transition-colors">%</div>
                <Input
                  type="number"
                  value={requestedCommission}
                  onChange={(e) => setRequestedCommission(e.target.value)}
                  placeholder="e.g. 25"
                  className="h-14 pl-10 rounded-2xl bg-white/5 border-white/10 text-white text-lg font-bold placeholder:text-white/20 focus-visible:ring-[#C1FF72] focus-visible:bg-white/10 transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Reasoning & Justification</label>
              <Textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Share your marketing strategy or past performance highlights..."
                className="min-h-[160px] rounded-2xl bg-white/5 border-white/10 text-white text-base placeholder:text-white/20 focus-visible:ring-[#C1FF72] focus-visible:bg-white/10 transition-all resize-none p-5 outline-none"
              />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 relative z-10">
            <Button 
              variant="ghost" 
              onClick={() => setIsRequestModalOpen(false)}
              className="h-14 rounded-2xl font-bold text-white/60 hover:text-white hover:bg-white/5 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest}
              disabled={isSubmittingRequest}
              className="h-14 rounded-2xl font-bold px-10 bg-[#C1FF72] hover:bg-[#d4ff9a] text-[#0f2e1c] shadow-[0_0_20px_rgba(193,255,114,0.3)] order-1 sm:order-2 flex-1 transition-all active:scale-95"
            >
              {isSubmittingRequest ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Proposal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
