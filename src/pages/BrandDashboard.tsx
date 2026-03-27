import { useAuth } from '@/lib/auth';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import NotificationPanel from '@/components/NotificationPanel';
import BrandProductManager from '@/components/BrandProductManager';
import { getBrandProducts } from '@/lib/api';
import { ShoppingBag, Package, TrendingUp, DollarSign, Plus, ArrowRight, Users, BarChart3, Settings, ShieldCheck, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreatePostModal from '@/components/CreatePostModal';
import { getAuthorPosts } from '@/lib/api';
import FeedPost from '@/components/FeedPost';


export default function BrandDashboard() {
  const { user, token } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { data: authorPosts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['authorPosts', user?.id],
    queryFn: () => getAuthorPosts(user!.id),
    enabled: !!token && !!user?.id
  });

  const [activeTab, setActiveTab] = useState('inventory');
  
  const { data: products = [], isLoading: loadingProducts } = useQuery({ 
    queryKey: ['brandProducts'], 
    queryFn: () => getBrandProducts(token!),
    enabled: !!token 
  });

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'BRAND' && user.role !== 'ADMIN') return null;

  // Handle Pending Approval State
  const isPending = user.status === 'PENDING';

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-12 shadow-2xl border border-primary/10 text-center max-w-2xl relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
             <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-3">
               <ShieldCheck className="h-12 w-12" />
             </div>
             <h2 className="font-display text-4xl font-bold text-[#1A2E05] mb-4">Partner Brand Review</h2>
             <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
               Welcome, <span className="font-bold text-foreground">{user.fullName}</span>! We are currently verifying your brand details and GST information. This usually takes 24 hours. You'll be notified immediately upon approval.
             </p>
             <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 text-left space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Application Status</span>
                 <span className="font-bold text-blue-600 uppercase tracking-widest text-[10px] bg-blue-50 px-2 py-1 rounded">Under Review</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Brand Profile</span>
                 <span className="font-bold">Pending Activation</span>
               </div>
             </div>
             <Button variant="ghost" className="mt-8 font-bold" asChild><Link to="/">Return Home</Link></Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
          <div className="space-y-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-display text-4xl font-bold mb-2 tracking-tight text-[#1A2E05]">Brand Console</h1>
                <p className="text-muted-foreground text-lg font-medium">Empowering your wellness commerce. Welcome back.</p>
              </div>
            </div>

            {/* Performance Snapshot */}
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: 'Total Revenue', value: '₹4.8L', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Units Sold', value: '382', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Active Affiliates', value: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Conv. Rate', value: '5.2%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map((s, i) => (
                <motion.div 
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-6 border border-primary/5 shadow-sm"
                >
                  <div className={`h-10 w-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-xl font-black">{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Main Tabs UI */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="bg-transparent border-b border-border/40 w-full justify-start rounded-none h-auto p-0 gap-8">
                <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-muted-foreground data-[state=active]:text-primary">
                  <Package className="h-4 w-4 mr-2" /> Product Inventory
                </TabsTrigger>
                <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-muted-foreground data-[state=active]:text-primary">
                  <Users className="h-4 w-4 mr-2" /> Affiliate Analytics
                </TabsTrigger>
                <TabsTrigger value="sponsorship" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-muted-foreground data-[state=active]:text-primary">
                  <TrendingUp className="h-4 w-4 mr-2" /> Sponsorships
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="m-0 focus-visible:ring-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2.5rem] border border-primary/5 shadow-xl overflow-hidden p-8">
                    <BrandProductManager />
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="performance" className="m-0 focus-visible:ring-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-primary/5 shadow-xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                          Top Promoting Affiliates
                          <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest gap-2">View Leaderboard <ArrowRight className="h-3 w-3" /></Button>
                        </h3>
                        <div className="space-y-4">
                          {[
                            { name: 'Sarah Wellness', sales: 42, rev: '₹12,400', commission: '₹1,860' },
                            { name: 'Yoga with Amit', sales: 28, rev: '₹8,900', commission: '₹1,335' },
                            { name: 'Herbal Life Blog', sales: 15, rev: '₹4,500', commission: '₹675' },
                          ].map((aff, i) => (
                            <div key={aff.name} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/10 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                  {aff.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{aff.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{aff.sales} Referrals</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-sm text-primary">{aff.rev}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Comm: {aff.commission}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#1A2E05] text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="relative z-10">
                          <h4 className="text-xl font-bold mb-4">Payout Summary</h4>
                          <div className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Commission Paid</p>
                              <p className="text-3xl font-black">₹32,450</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Pending Invoices</p>
                              <p className="text-2xl font-black text-primary">₹4,200</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="secondary" className="w-full rounded-xl font-bold mt-8">Generate Invoice</Button>
                      </div>
                    </div>
                  </motion.div>
              </TabsContent>

              <TabsContent value="sponsorship" className="m-0 focus-visible:ring-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[2.5rem] border border-primary/5 shadow-xl p-10 text-center space-y-8"
                >
                  <div className="h-20 w-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-4 rotate-6">
                    <TrendingUp className="h-10 w-10" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-3xl font-bold text-[#1A2E05] mb-4">Boost Your Brand Exposure</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Get your products listed in our "Popular" section or sponsor featured wellness articles to reach 10x more community members.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className="p-6 rounded-[2rem] border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group text-left">
                      <Package className="h-6 w-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold mb-2">Featured Product</h4>
                      <p className="text-xs text-muted-foreground">List in the high-traffic ecosystem gallery.</p>
                    </div>
                    <div className="p-6 rounded-[2rem] border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group text-left">
                      <Users className="h-6 w-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold mb-2">Sponsored Content</h4>
                      <p className="text-xs text-muted-foreground">Partner with top wellness experts for reviews.</p>
                    </div>
                  </div>
                  <Button className="rounded-2xl h-14 px-10 font-black shadow-xl shadow-primary/20">Contact Partnership Exec</Button>
                </motion.div>
              </TabsContent>
              <TabsContent value="community" className="m-0 focus-visible:ring-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold font-display">Your Community Presence</h3>
                      <p className="text-sm text-muted-foreground">Manage your articles, success stories, and wellness tips.</p>
                    </div>
                    <Button 
                      onClick={() => setIsPostModalOpen(true)}
                      className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 bg-[#1A2E05] hover:bg-[#25300c]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create New Post
                    </Button>
                  </div>
                  
                  {authorPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {authorPosts.map((post: any) => (
                        <div key={post.id} className="bg-white rounded-[2.5rem] border border-primary/5 shadow-sm p-4">
                           <FeedPost post={post} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-primary/10">
                      <Globe className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                      <h4 className="text-xl font-bold mb-2">No posts yet</h4>
                      <p className="text-muted-foreground mb-8">Start building your brand authority in the community.</p>
                      <Button onClick={() => setIsPostModalOpen(true)} variant="secondary" className="rounded-2xl font-bold">
                        Create Your First Post
                      </Button>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
            <CreatePostModal 
              isOpen={isPostModalOpen}
              onOpenChange={setIsPostModalOpen}
              onSuccess={refetchPosts}
            />
          </div>

          <aside className="space-y-8 lg:sticky lg:top-8">
            <NotificationPanel />

            <div className="bg-white rounded-[3rem] p-6 border border-primary/5 shadow-sm space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setActiveTab('community');
                    setIsPostModalOpen(true);
                  }}
                  className="w-full justify-start gap-2 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Globe className="h-4 w-4" /> Create New Post
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-sm font-bold" asChild>
                  <Link to="/reports"><BarChart3 className="h-4 w-4" /> View Reports</Link>
                </Button>
                <Button className="w-full justify-start gap-2 rounded-xl text-sm font-bold bg-[#1A2E05] text-white hover:bg-[#25300c]" onClick={() => setActiveTab('inventory')}>
                  <Plus className="h-4 w-4" /> Add New Product
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-6 border border-primary/5 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Topics to Follow</h4>
              <div className="flex flex-wrap gap-2">
                {['Nutrition', 'Fitness', 'Lifestyle', 'Self-care'].map(topic => (
                  <span key={topic} className="px-3 py-1 rounded-full border border-primary/10 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A2E05] text-white rounded-[2.5rem] p-6 shadow-xl border border-white/20 space-y-4"
            >
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Brand Profile</h5>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg">{user.fullName}</p>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Partner Brand</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between text-white/80"><span>Products</span><span>{products.length}</span></p>
                <p className="flex justify-between text-white/80"><span>Avg. Rating</span><span>4.9 ★</span></p>
              </div>
              <Button variant="secondary" className="w-full rounded-xl font-bold bg-white text-[#1A2E05]">Edit Profile</Button>
            </motion.div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
