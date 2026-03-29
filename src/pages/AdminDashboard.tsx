import { useState, useEffect, useCallback } from 'react';
import type { Post, Session } from '@/lib/types';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  getAdminStats, 
  getAdminUsers, 
  getPosts, 
  getSessions, 
  getAdminPartnerships, 
  getAdminProducts,
  getAdminAffiliates,
  getAdminBrands,
  toggleBlockUser,
  deleteUser,
  reviewProduct,
  deleteAdminProduct,
  updateAdminPartnershipStatus,
  reviewAffiliateStatus,
  deleteAdminAffiliate,
  reviewBrandStatus,
  deleteAdminBrand,
  deletePostAdmin,
  updatePostAdmin,
  togglePostSponsored,
  createSession,
  updateSession,
  deleteSession,
  getAdminComments,
  deleteAdminComment,
  getAdminCommissionRequests,
  updateAdminCommissionRequest,
  getGlobalSettings,
  updateGlobalSetting
} from '@/lib/api';
import NotificationPanel from '@/components/NotificationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Leaf, ShieldCheck, Users, MessageSquare, Calendar, Handshake, Plus, Trash2, 
  Ban, Check, X, Edit, UserCheck, UserX, Package, TrendingUp, DollarSign, 
  Globe, LayoutDashboard, Search, Filter, ArrowUpRight, ShieldAlert, BadgeCheck, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '@/lib/socket';

type GrowthPoint = {
  label: string;
  users: number;
  posts: number;
  revenue: number;
};

const GROWTH_SLOTS = 6;

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: 'bg-orange-50 border-orange-200 text-orange-600',
  EXPERT: 'bg-blue-50 border-blue-200 text-blue-600',
  USER: 'bg-[#7A9E7E]/10 border-[#7A9E7E]/40 text-[#4F7153]',
  AFFILIATE: 'bg-[#C4714A]/10 border-[#C4714A]/40 text-[#8C4A2A]',
  BRAND: 'bg-[#4A3A2A]/10 border-[#4A3A2A]/40 text-[#4A3A2A]',
};

const formatGrowthLabel = (index: number) => {
  const secondsFromNow = (GROWTH_SLOTS - index - 1) * 5;
  return secondsFromNow <= 0 ? 'Now' : `${secondsFromNow}s`;
};

const createInitialGrowth = (stats?: { totalUsers?: number; totalPosts?: number; totalRevenue?: number }) => {
  const baseUsers = Math.max(5, stats?.totalUsers ?? 30);
  const basePosts = Math.max(2, stats?.totalPosts ?? 8);
  const baseRevenue = Math.max(100, stats?.totalRevenue ?? 600);
  return Array.from({ length: GROWTH_SLOTS }, (_, index) => {
    const progress = (index + 1) / GROWTH_SLOTS;
    return {
      label: formatGrowthLabel(index),
      users: Math.round(baseUsers * (0.6 + progress * 0.45)) + index * 2,
      posts: Math.round(basePosts * (0.7 + progress * 0.35)) + Math.floor(index * 0.4),
      revenue: Math.round(baseRevenue * (0.65 + progress * 0.45)) + index * 20,
    };
  });
};

const RealTimeGrowthChart = ({ data }: { data: GrowthPoint[] }) => {
  const width = 360;
  const height = 160;
  const normalized = data.length > 1 ? data : [...data, ...Array(GROWTH_SLOTS - data.length).fill(data[data.length - 1] || { label: 'Now', users: 0, posts: 0, revenue: 0 })];
  const maxValue = Math.max(...normalized.flatMap(point => [point.users, point.posts, point.revenue]), 1);
  const step = normalized.length > 1 ? width / (normalized.length - 1) : width;

  const buildPath = (key: keyof GrowthPoint) =>
    normalized
      .map((point, idx) => {
        const x = idx * step;
        const rawValue = point[key] ?? 0;
        const y = height - (rawValue / maxValue) * (height - 20) - 10;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  const colors: Record<keyof GrowthPoint, string> = {
    label: '#E5E7EB',
    users: '#1A2E05',
    posts: '#0f766e',
    revenue: '#c026d3',
  };

  return (
    <div className="w-full h-[200px] overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {[0, 1, 2, 3].map(line => (
          <line
            key={`grid-${line}`}
            x1={0}
            y1={(height / 3) * line}
            x2={width}
            y2={(height / 3) * line}
            stroke="#E5E7EB"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        <path d={buildPath('users')} stroke={colors.users} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <path d={buildPath('posts')} stroke={colors.posts} strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="6 4" />
        <path d={buildPath('revenue')} stroke={colors.revenue} strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="4 4" />
        {(['users', 'posts', 'revenue'] as (keyof GrowthPoint)[]).map(key => {
          const lastPoint = normalized[normalized.length - 1];
          const x = (normalized.length - 1) * step;
          const y = height - ((lastPoint[key] ?? 0) / maxValue) * (height - 20) - 10;
          return (
            <circle key={key} cx={x} cy={y} r={3.5} fill={colors[key]} stroke="white" strokeWidth={1.5} />
          );
        })}
      </svg>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, token, isAdmin, adminLogout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: () => getAdminStats(token!), enabled: !!token });
  const { data: users = [] } = useQuery({ queryKey: ['adminUsers'], queryFn: () => getAdminUsers(token!), enabled: !!token });
  const { data: posts = [] } = useQuery({ queryKey: ['adminPosts'], queryFn: () => getPosts() });
  const { data: sessions = [] } = useQuery({ queryKey: ['adminSessions'], queryFn: () => getSessions() });
  const { data: affiliates = [] } = useQuery({ queryKey: ['adminAffiliates'], queryFn: () => getAdminAffiliates(token!), enabled: !!token });
  const { data: brands = [] } = useQuery({ queryKey: ['adminBrands'], queryFn: () => getAdminBrands(token!), enabled: !!token });
  const { data: products = [] } = useQuery({ queryKey: ['adminProducts'], queryFn: () => getAdminProducts(token!), enabled: !!token });
  const { data: comments = [] } = useQuery({ queryKey: ['adminComments'], queryFn: () => getAdminComments(token!), enabled: !!token });
  const { data: commissionRequests = [] } = useQuery({ queryKey: ['commission-requests'], queryFn: () => getAdminCommissionRequests(token!), enabled: !!token });
  const { data: adminPartnerships = [] } = useQuery({ queryKey: ['adminPartnerships'], queryFn: () => getAdminPartnerships(token!), enabled: !!token });
  const { data: globalSettings = [] } = useQuery({ queryKey: ['globalSettings'], queryFn: () => getGlobalSettings(token!), enabled: !!token });
  const [growthData, setGrowthData] = useState<GrowthPoint[]>(() => createInitialGrowth());
  const [mindfulMinutes, setMindfulMinutes] = useState(24);
  const [mindfulNote, setMindfulNote] = useState('Morning session ✓');
  const [vitalityScore, setVitalityScore] = useState(92);
  const [vitalityComment, setVitalityComment] = useState('Feeling great!');
  const addGrowthPoint = useCallback(
    (delta: Partial<GrowthPoint> = {}) => {
      setGrowthData(prev => {
        const baseline = {
          label: 'Now',
          users: stats?.totalUsers ?? 0,
          posts: stats?.totalPosts ?? 0,
          revenue: stats?.totalRevenue ?? 0,
        };
        const last = prev[prev.length - 1] ?? baseline;
        const next = {
          label: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          users: last.users + (delta.users ?? 0),
          posts: last.posts + (delta.posts ?? 0),
          revenue: last.revenue + (delta.revenue ?? 0),
        };
        const window = prev.length >= 8 ? prev.slice(prev.length - 7) : prev;
        return [...window, next];
      });
    },
    [stats]
  );

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    } else if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (stats) {
      setGrowthData(createInitialGrowth(stats));
    }
  }, [stats]);

  useEffect(() => {
    if (stats) {
      setMindfulMinutes(stats?.mindfulMinutes ?? 0);
      setMindfulNote(stats?.mindfulNote ?? 'System ready');
      setVitalityScore(stats?.vitalityScore ?? 0);
      setVitalityComment(stats?.vitalityComment ?? 'Awaiting data');
    }
  }, [stats]);

  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries();
    };

    socket.on('product:created', handleRefresh);
    socket.on('product:updated', handleRefresh);
    socket.on('product:deleted', handleRefresh);
    socket.on('user:created', handleRefresh);
    socket.on('post:created', handleRefresh);

    return () => {
      socket.off('product:created', handleRefresh);
      socket.off('product:updated', handleRefresh);
      socket.off('product:deleted', handleRefresh);
      socket.off('user:created', handleRefresh);
      socket.off('post:created', handleRefresh);
    };
  }, [queryClient]);

  // Mutations
  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries()
  };

  const blockMutation = useMutation({ mutationFn: (id: string) => toggleBlockUser(token!, id), ...mutationOptions });
  const deleteUserMutation = useMutation({ mutationFn: (id: string) => deleteUser(token!, id), ...mutationOptions });
  
  const affiliateStatusMutation = useMutation({ mutationFn: ({id, status}: {id: string, status: string}) => reviewAffiliateStatus(token!, id, status), ...mutationOptions });
  const affiliateDeleteMutation = useMutation({ mutationFn: (id: string) => deleteAdminAffiliate(token!, id), ...mutationOptions });

  const brandStatusMutation = useMutation({ mutationFn: ({id, status}: {id: string, status: string}) => reviewBrandStatus(token!, id, status), ...mutationOptions });
  const brandDeleteMutation = useMutation({ mutationFn: (id: string) => deleteAdminBrand(token!, id), ...mutationOptions });

  const partnershipStatusMutation = useMutation({ 
    mutationFn: ({id, status}: {id: string, status: string}) => updateAdminPartnershipStatus(token!, id, status), 
    ...mutationOptions 
  });

  const productStatusMutation = useMutation({ mutationFn: ({id, status}: {id: string, status: string}) => reviewProduct(token!, id, status), ...mutationOptions });
  const productDeleteMutation = useMutation({ mutationFn: (id: string) => deleteAdminProduct(token!, id), ...mutationOptions });
  
  const deletePostMutation = useMutation({ mutationFn: (id: string) => deletePostAdmin(token!, id), ...mutationOptions });
  const toggleSponsoredMutation = useMutation({ mutationFn: (id: string) => togglePostSponsored(token!, id), ...mutationOptions });
  const deleteCommentMutation = useMutation({ mutationFn: (id: string) => deleteAdminComment(token!, id), ...mutationOptions });
  const commissionRequestMutation = useMutation({ 
    mutationFn: ({id, payload}: {id: string, payload: { status: string, requestedCommission?: number }}) => updateAdminCommissionRequest(token!, id, payload),
    ...mutationOptions 
  });

  const [sessionDialog, setSessionDialog] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', description: '', hostName: '', date: '', sessionLink: '' });
  const [editSessionId, setEditSessionId] = useState<string | null>(null);

  const createSessionMutation = useMutation({ mutationFn: (payload: Omit<Session, 'id' | 'registeredUsers'>) => createSession(token!, payload), ...mutationOptions });
  const updateSessionMutation = useMutation({ mutationFn: ({id, payload}: {id: string, payload: Partial<Omit<Session, 'id' | 'registeredUsers'>>}) => updateSession(token!, id, payload), ...mutationOptions });
  const deleteSessionMutation = useMutation({ mutationFn: (id: string) => deleteSession(token!, id), ...mutationOptions });

  if (!isAdmin || !token) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Secure Session...</p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleUserAction = (id: string, action: 'block' | 'delete') => {
    if (action === 'block') blockMutation.mutate(id);
    if (action === 'delete') {
      if (confirm('Permanently delete this user?')) deleteUserMutation.mutate(id);
    }
  };

  const handleProductStatus = (id: string, status: string) => productStatusMutation.mutate({id, status});
  const handleProductDelete = (id: string) => productDeleteMutation.mutate(id);
  const handleDeletePost = (id: string) => deletePostMutation.mutate(id);
  const handleToggleSponsored = (id: string) => toggleSponsoredMutation.mutate(id);
  const handleDeleteComment = (id: string) => {
    if (confirm('Remove this comment from the community?')) deleteCommentMutation.mutate(id);
  };

  const handleCreateSession = () => {
    createSessionMutation.mutate(newSession, {
      onSuccess: () => { setSessionDialog(false); setNewSession({ title: '', description: '', hostName: '', date: '', sessionLink: '' }); toast.success('Session created'); }
    });
  };

  const handleUpdateSession = () => {
    if (!editSessionId) return;
    updateSessionMutation.mutate({ id: editSessionId, payload: newSession }, {
      onSuccess: () => { setEditSessionId(null); setSessionDialog(false); toast.success('Session updated'); }
    });
  };

  const handleDeleteSession = (id: string) => {
    if (confirm('Delete this session?')) deleteSessionMutation.mutate(id);
  };

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const pendingAffiliates = affiliates.filter(a => a.status === 'PENDING').length;
  const pendingBrands = brands.filter(b => b.status === 'PENDING').length;
  const pendingProducts = products.filter(p => p.status === 'PENDING').length;
  const pendingPartnerships = adminPartnerships.filter(p => p.status === 'pending').length;
  const totalPending = pendingAffiliates + pendingBrands + pendingProducts + pendingPartnerships;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 h-screen sticky top-0 bg-white border-r border-border/60 p-8 hidden lg:flex flex-col">
          <div className="flex items-center gap-3 mb-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-[1.25rem]">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
            <div>
              <span className="font-display text-2xl font-black tracking-tight block text-[#1E1E1E]/80">health&wellness</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Control Center</span>
            </div>
          </Link>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
              { id: 'users', label: 'Membership', icon: Users },
              { id: 'partners', label: 'Partner Hub', icon: Handshake },
              { id: 'marketplace', label: 'Marketplace', icon: Package },
              { id: 'commission-requests', label: 'Commission Queue', icon: TrendingUp },
              { id: 'content', label: 'Content Lab', icon: MessageSquare },
              { id: 'sessions', label: 'Wellness Events', icon: Calendar },
              { id: 'settings', label: 'Platform Settings', icon: Globe },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-border/40">
            <div className="bg-muted/30 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black">
                  {user?.fullName[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{user?.fullName}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">System Admin</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full text-xs font-black text-muted-foreground hover:text-destructive" onClick={() => { adminLogout(); navigate('/'); }}>
                TERMINATE SESSION
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-12 overflow-hidden">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-[#1A2E05]">
                {activeTab === 'overview' ? 'Command Center' : 
                 activeTab === 'users' ? 'Member Management' : 
                 activeTab === 'partners' ? 'Partner Ecosystem' : 
                 activeTab === 'marketplace' ? 'Marketplace Control' :
                 activeTab === 'settings' ? 'Platform Settings' :
                 'Moderation Suite'}
              </h1>
              <p className="text-muted-foreground font-medium mt-1">Platform health: <span className="text-emerald-600 font-bold">Stable & Optimal</span></p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="rounded-2xl h-12 pl-12 border-border/60 bg-white" 
                  placeholder="Universal search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-12 w-12 rounded-2xl bg-white border border-border/60 text-foreground hover:bg-muted p-0">
                    <Filter className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mb-10">
            <div className="relative rounded-[2.5rem] bg-[#C8DBC9] p-8 overflow-hidden shadow-lg shadow-[#4F7153]/20">
              <div className="absolute -left-10 -top-6 h-24 w-24 rounded-full border-4 border-white opacity-40" />
              <div className="absolute right-6 top-10 h-14 w-14 rounded-full border border-white/60" />
              <div className="text-sm font-black uppercase tracking-[0.4em] text-[#4F7153]">
                Engagement Access
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/90 px-6 py-5 shadow-lg shadow-black/10">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#4F7153]">Mindful Minutes</p>
                  <p className="text-4xl font-black text-[#1A2E05]">{mindfulMinutes}m</p>
                  <p className="text-sm text-[#4F7153]/80">{mindfulNote}</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/90 px-6 py-5 shadow-lg shadow-black/10">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#4F7153]">Today's Vitality</p>
                  <p className="text-4xl font-black text-[#1A2E05]">{vitalityScore}/100</p>
                  <p className="text-sm text-[#4F7153]/80">{vitalityComment}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[2.5rem] bg-white border border-[#4F7153]/20 p-8 shadow-lg shadow-[#2C4A2E]/15">
              <div className="text-sm font-black uppercase tracking-[0.3em] text-[#4F7153] mb-6">Edit Access Metrics</div>
              <div className="space-y-4">
                <div>
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-[#4F7153]/80">Mindful Minutes</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-2 rounded-2xl"
                    value={mindfulMinutes}
                    onChange={(e) => setMindfulMinutes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-[#4F7153]/80">Mindful Note</Label>
                  <Input
                    className="mt-2 rounded-2xl"
                    value={mindfulNote}
                    onChange={(e) => setMindfulNote(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-[#4F7153]/80">Vitality Score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="mt-2 rounded-2xl"
                    value={vitalityScore}
                    onChange={(e) => setVitalityScore(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-[0.3em] text-[#4F7153]/80">Vitality Note</Label>
                  <Input
                    className="mt-2 rounded-2xl"
                    value={vitalityComment}
                    onChange={(e) => setVitalityComment(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="mt-6 rounded-2xl bg-[#4F7153] text-[#F9F5EE] font-black tracking-[0.3em]"
                onClick={() => toast.success('Wellness highlights updated')}
              >
                Save Preview
              </Button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Pending Actions Alert */}
                {totalPending > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid gap-4 md:grid-cols-4 mb-10"
                  >
                    <div className="md:col-span-4 bg-[#FEE2E2] border border-red-200 rounded-[2rem] p-8 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                          <ShieldAlert className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-red-950 uppercase tracking-tight">Immediate Action Required</h3>
                          <p className="text-sm font-medium text-red-800/80">You have {totalPending} pending applications awaiting verification across the ecosystem.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {pendingAffiliates > 0 && (
                          <Button variant="ghost" onClick={() => setActiveTab('partners')} className="bg-white/50 hover:bg-white text-red-900 rounded-xl font-black text-[10px] uppercase tracking-widest px-4">
                            {pendingAffiliates} Affiliates
                          </Button>
                        )}
                        {pendingBrands > 0 && (
                          <Button variant="ghost" onClick={() => setActiveTab('partners')} className="bg-white/50 hover:bg-white text-red-900 rounded-xl font-black text-[10px] uppercase tracking-widest px-4">
                            {pendingBrands} Brands
                          </Button>
                        )}
                        {pendingProducts > 0 && (
                          <Button variant="ghost" onClick={() => setActiveTab('marketplace')} className="bg-white/50 hover:bg-white text-red-900 rounded-xl font-black text-[10px] uppercase tracking-widest px-4">
                            {pendingProducts} Products
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Stats Matrix */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Platform Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
                    { label: 'Comm. Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+24%' },
                    { label: 'Social Engagement', value: stats?.totalPosts || 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+8%' },
                    { label: 'Service Coverage', value: '100%', icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Optimal' },
                  ].map((s, i) => (
                    <motion.div 
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                    >
                      <div className={`h-14 w-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <s.icon className="h-7 w-7" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{s.label}</p>
                      <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black text-[#1A2E05]">{s.value}</h4>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md mb-1">{s.trend}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm p-8 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 font-black">
                            Live Insight
                          </p>
                          <h3 className="font-display text-2xl font-bold text-[#1A2E05]">
                            Growth Analytics Visualization
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Real-time engagement metrics streaming from the marketplace.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                          <TrendingUp className="h-4 w-4" />
                          Live
                        </span>
                      </div>
                      <RealTimeGrowthChart data={growthData} />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {(() => {
                          const latestPoint = growthData[growthData.length - 1];
                          const previousPoint = growthData[growthData.length - 2] ?? latestPoint;
                          const formatDelta = (delta: number) => (delta >= 0 ? `+${delta}` : `${delta}`);
                          return [
                            {
                              label: 'Users',
                              value: latestPoint.users,
                              delta: formatDelta(latestPoint.users - previousPoint.users),
                              color: '#1A2E05',
                            },
                            {
                              label: 'Posts',
                              value: latestPoint.posts,
                              delta: formatDelta(latestPoint.posts - previousPoint.posts),
                              color: '#0f766e',
                            },
                            {
                              label: 'Revenue',
                              value: latestPoint.revenue,
                              delta: formatDelta(latestPoint.revenue - previousPoint.revenue),
                              color: '#c026d3',
                            },
                          ];
                        })().map(item => (
                          <div key={item.label} className="bg-muted/5 rounded-2xl p-4 border border-border/60">
                            <div className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground mb-3">
                              {item.label}
                            </div>
                            <div className="text-3xl font-black text-[#1A2E05]">
                              {item.value.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: item.color }}>
                              {item.delta} since last sample
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-[#1A2E05] rounded-full" /> Users
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-[#0f766e] rounded-full" /> Posts
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-[#c026d3] rounded-full" /> Revenue
                        </span>
                      </div>
                    </div>
                  </div>
                  <NotificationPanel />
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-xl">Active Residents</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold">Export CSV</Button>
                    <Button size="sm" className="rounded-xl font-bold gap-2"><Plus className="h-4 w-4" /> Add User</Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/10">
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identified Member</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Functional Role</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Status</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocols</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center font-black text-lg text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                                {u.fullName[0]}
                              </div>
                              <div>
                                <div className="font-black text-[#1A2E05]">{u.fullName}</div>
                                <div className="text-[11px] font-bold text-muted-foreground opacity-70">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border ${
                              ROLE_BADGE_STYLES[u.role] ?? 'bg-muted border-border text-muted-foreground'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            {u.blocked ? (
                              <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-widest">
                                <ShieldAlert className="h-4 w-4" /> Restricted Access
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                <BadgeCheck className="h-4 w-4" /> Authorized
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100">
                              <Button variant="ghost" size="sm" className={`h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest ${u.blocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-orange-600 hover:bg-orange-50'}`} onClick={() => handleUserAction(u.id, 'block')}>
                                {u.blocked ? 'Restore' : 'Suspend'}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleUserAction(u.id, 'delete')}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'partners' && (
              <div className="space-y-12">
                {/* Brand Partners Section */}
                <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-border/40 bg-emerald-50/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Handshake className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl">Brand Ecosystem</h3>
                          <p className="text-xs text-muted-foreground font-medium">Approved brands and incoming applications</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border/40">
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity</th>
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verification</th>
                          <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {brands.map(b => (
                          <tr key={b.id} className="hover:bg-muted/10 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-black text-[#1A2E05]">{b.name || b.user.fullName}</div>
                              <div className="text-[11px] font-bold text-muted-foreground">{b.user.email}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-black uppercase bg-muted px-2 py-1 rounded-md">{b.businessCategory}</span>
                            </td>
                            <td className="px-8 py-6">
                              {b.status === 'PENDING' ? (
                                <span className="text-[10px] font-black text-orange-600 flex items-center gap-2"><Clock className="h-3 w-3" /> Under Review</span>
                              ) : b.status === 'APPROVED' ? (
                                <span className="text-[10px] font-black text-emerald-600 flex items-center gap-2"><Check className="h-3 w-3" /> Fully Verified</span>
                              ) : (
                                <span className="text-[10px] font-black text-destructive flex items-center gap-2"><X className="h-3 w-3" /> Rejected</span>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                {b.status === 'PENDING' && (
                                  <>
                                    <Button size="sm" className="h-8 rounded-lg font-black text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => brandStatusMutation.mutate({id: b.id, status: 'APPROVED'})}>Verify</Button>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => brandStatusMutation.mutate({id: b.id, status: 'REJECTED'})}>Decline</Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" onClick={() => brandDeleteMutation.mutate(b.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Affiliate Performance matrix */}
                <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-border/40 bg-blue-50/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl">Affiliate Performance</h3>
                          <p className="text-xs text-muted-foreground font-medium">Active promoters and revenue drivers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border/40">
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Promoter</th>
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Influence</th>
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Earnings Cycle</th>
                          <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {affiliates.map(a => (
                          <tr key={a.id} className="hover:bg-muted/10 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-black text-[#1A2E05]">{a.user.fullName}</div>
                              <div className="text-[11px] font-bold text-muted-foreground">{a.user.email}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-wrap gap-1">
                                {(a.interests || []).slice(0, 2).map((i: string) => (
                                  <span key={i} className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{i}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-[10px] font-black text-emerald-600">₹{a.totalEarnings || 0} Total</div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                {a.status === 'PENDING' && (
                                  <>
                                    <Button size="sm" className="h-8 rounded-lg font-black text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => affiliateStatusMutation.mutate({id: a.id, status: 'APPROVED'})}>Approve</Button>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => affiliateStatusMutation.mutate({id: a.id, status: 'REJECTED'})}>Reject</Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" onClick={() => affiliateDeleteMutation.mutate(a.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Partnership Inquiries Section */}
                <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-border/40 bg-purple-50/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl">Partnership Inquiries</h3>
                          <p className="text-xs text-muted-foreground font-medium">Generic platform collaboration requests</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border/40">
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partner</th>
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</th>
                          <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {adminPartnerships.map(p => (
                          <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-black text-[#1A2E05]">{p.organizationName}</div>
                              <div className="text-[11px] font-bold text-muted-foreground">{p.email}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-xs font-medium text-muted-foreground line-clamp-1">{p.proposal}</div>
                              <div className="text-[10px] font-bold text-primary mt-1">{p.contactPerson} • {p.phone}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                                p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                                p.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                                'bg-orange-50 text-orange-600'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                {p.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="h-8 rounded-lg font-black text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => partnershipStatusMutation.mutate({id: p.id, status: 'approved'})}>Accept</Button>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => partnershipStatusMutation.mutate({id: p.id, status: 'rejected'})}>Decline</Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden p-2">
                <div className="p-8 flex items-center justify-between border-b border-border/40">
                   <h3 className="font-black text-xl">Product Verification Queue</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Inventory Modulation</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/5">
                        <th className="px-8 py-6 text-left font-black text-muted-foreground uppercase tracking-widest text-[10px]">Product Asset</th>
                        <th className="px-8 py-6 text-left font-black text-muted-foreground uppercase tracking-widest text-[10px]">Source Brand</th>
                        <th className="px-8 py-6 text-left font-black text-muted-foreground uppercase tracking-widest text-[10px]">Valuation</th>
                        <th className="px-8 py-6 text-right font-black text-muted-foreground uppercase tracking-widest text-[10px]">Review Cycle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-md">
                                <img src={p.images?.[0] || 'https://via.placeholder.com/80'} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div>
                                <div className="font-black text-[#1A2E05]">{p.name}</div>
                                {p.variants && Array.isArray(p.variants) && (p.variants as any[]).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(p.variants as any[]).map((v, i) => (
                                      <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10">
                                        {v.quantity}{v.unit} • {v.size} {v.price ? `(₹${v.price})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-muted-foreground font-bold text-xs">{p.brand?.name || 'Authorized Partner'}</td>
                          <td className="px-8 py-6 font-black text-primary text-base">₹{p.price.toLocaleString()}</td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3">
                              {p.status === 'PENDING' ? (
                                <>
                                  <Button size="sm" className="h-9 px-5 font-black text-[10px] uppercase tracking-widest rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" onClick={() => handleProductStatus(p.id, 'APPROVED')}>
                                    Authorize
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-9 px-5 font-black text-[10px] uppercase tracking-widest rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => handleProductStatus(p.id, 'REJECTED')}>
                                    Quarantine
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                                    {p.status}
                                  </span>
                                  {p.status === 'REJECTED' && (
                                    <Button size="sm" variant="secondary" className="h-9 px-5 font-black text-[10px] uppercase tracking-widest rounded-xl bg-[#F6E8E6] text-destructive border border-destructive/30 hover:bg-[#FDEDED]" onClick={() => handleProductStatus(p.id, 'PENDING')}>
                                      Unreject
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button variant="ghost" size="icon" className="h-9 w-9 p-0 text-destructive rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleProductDelete(p.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="grid gap-6">
                <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-xl">Content Moderation Queue</h3>
                    <div className="flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scanning Platform...</span>
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    {posts.map(post => (
                      <div key={post.id} className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-all">
                        <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex-shrink-0 flex items-center justify-center p-2 relative">
                           <MessageSquare className="h-8 w-8 text-primary/40" />
                           {post.sponsored && (
                             <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-600 p-1.5 rounded-lg shadow-sm">
                               <BadgeCheck className="h-4 w-4" />
                             </div>
                           )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-lg text-[#1A2E05] line-clamp-1">{post.title}</h4>
                          <p className="text-sm text-muted-foreground font-medium line-clamp-1 mb-2">{post.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                              <Users className="h-3 w-3" /> {post.authorName}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {post.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className={`rounded-xl font-bold h-10 px-4 transition-all ${post.sponsored ? 'bg-amber-50 text-amber-600' : 'text-emerald-600 hover:bg-emerald-50'}`}
                             onClick={() => handleToggleSponsored(post.id)}
                           >
                             {post.sponsored ? 'Featured' : 'Feature'}
                           </Button>
                           <Button variant="ghost" size="sm" className="rounded-xl font-bold h-10 px-4 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePost(post.id)}>Censor</Button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl">Comment Oversight</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Feed</span>
                </div>
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-medium">No flagged comments available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-4 rounded-2xl bg-muted/20 border border-border/40 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-black text-sm text-[#1A2E05] line-clamp-1">{comment.userFullName}</p>
                            <p className="text-xs font-bold text-muted-foreground line-clamp-1">{comment.userEmail}</p>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-3">{comment.commentText}</p>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-black">Post: {comment.postTitle}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/40 font-black text-[10px]" onClick={() => handleDeleteComment(comment.id)}>
                            <Trash2 className="h-3 w-3" /> Delete Comment
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-xl text-destructive border text-destructive/40 font-black text-[10px]" onClick={() => handleUserAction(comment.userId, 'delete')}>
                            Remove User
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

            {activeTab === 'commission-requests' && (
              <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border/40 flex items-center justify-between bg-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl">Commission Request Queue</h3>
                      <p className="text-xs text-muted-foreground font-medium">Review and override commission rates for top performers</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/10">
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Affiliate</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proposed Change</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Justification</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {commissionRequests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground font-medium italic">
                            No pending commission requests at this time.
                          </td>
                        </tr>
                      ) : (
                        commissionRequests.map((req: any) => (
                          <tr key={req.id} className="hover:bg-primary/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-black text-[#1A2E05]">{req.affiliate.user.fullName}</div>
                              <div className="text-[11px] font-bold text-muted-foreground">{req.affiliate.user.email}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-muted-foreground line-through">{req.currentCommission}%</span>
                                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                <span className="text-lg font-black text-emerald-600">{req.requestedCommission}%</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-xs text-muted-foreground font-medium max-w-xs line-clamp-2 italic">
                                "{req.reason}"
                              </p>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => {
                                    const override = prompt('Enter approved commission percentage (or leave blank for requested rate):', String(req.requestedCommission));
                                    if (override !== null) {
                                      commissionRequestMutation.mutate({
                                        id: req.id,
                                        payload: { 
                                          status: 'APPROVED', 
                                          requestedCommission: parseFloat(override) || req.requestedCommission 
                                        }
                                      });
                                    }
                                  }}
                                  disabled={commissionRequestMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest text-destructive border-destructive/20 hover:bg-destructive/10"
                                  onClick={() => {
                                    if (confirm('Reject this commission request?')) {
                                      commissionRequestMutation.mutate({
                                        id: req.id,
                                        payload: { status: 'REJECTED' }
                                      });
                                    }
                                  }}
                                  disabled={commissionRequestMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-[#1A2E05] tracking-tight">Wellness Events</h2>
                    <p className="text-muted-foreground mt-1 font-medium italic">Orchestrate live training and community gatherings</p>
                  </div>
                  <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
                    <DialogTrigger asChild>
                      <Button className="rounded-2xl h-12 px-6 font-black tracking-widest text-xs uppercase bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Create Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] p-8 max-w-2xl border-none shadow-2xl bg-[#1E1E1E]/95 text-[#F9F5EE]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black mb-6">Schedule New Session</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6">
                        <div className="grid gap-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Session Title</Label>
                          <Input className="rounded-xl h-12 bg-[#2C4A2E]/40 border border-[#4F7153]/40 text-[#F9F5EE] placeholder:text-[#F9F5EE]/80 focus-visible:ring-[#7A9E7E]/40" value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} placeholder="e.g. Masterclass: Gut Health 101" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
                          <Textarea className="rounded-2xl bg-[#2C4A2E]/40 border border-[#4F7153]/40 min-h-[100px] text-[#F9F5EE] placeholder:text-[#F9F5EE]/80 focus-visible:ring-[#7A9E7E]/40" value={newSession.description} onChange={e => setNewSession({...newSession, description: e.target.value})} placeholder="What will participants learn?" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Host Name</Label>
                            <Input className="rounded-xl h-12 bg-[#2C4A2E]/40 border border-[#4F7153]/40 text-[#F9F5EE] placeholder:text-[#F9F5EE]/80 focus-visible:ring-[#7A9E7E]/40" value={newSession.hostName} onChange={e => setNewSession({...newSession, hostName: e.target.value})} placeholder="Dr. Sarah Johnson" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date & Time</Label>
                            <Input type="datetime-local" className="rounded-xl h-12 bg-[#2C4A2E]/40 border border-[#4F7153]/40 text-[#F9F5EE] placeholder:text-[#F9F5EE]/80 focus-visible:ring-[#7A9E7E]/40" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Meeting Link</Label>
                          <Input className="rounded-xl h-12 bg-[#2C4A2E]/40 border border-[#4F7153]/40 text-[#F9F5EE] placeholder:text-[#F9F5EE]/80 focus-visible:ring-[#7A9E7E]/40" value={newSession.sessionLink} onChange={e => setNewSession({...newSession, sessionLink: e.target.value})} placeholder="https://zoom.us/..." />
                        </div>
                        <Button className="rounded-xl h-12 font-black tracking-widest text-xs uppercase bg-primary mt-4" onClick={editSessionId ? handleUpdateSession : handleCreateSession}>
                          {editSessionId ? 'Update Session' : 'Publish Session'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map(session => (
                    <div key={session.id} className="group bg-white rounded-[2.5rem] border border-border/50 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                      <div className="flex items-center justify-between mb-6">
                        <div className="bg-primary/5 p-3 rounded-2xl">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => { setEditSessionId(session.id); setNewSession(session as any); setSessionDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSession(session.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-black text-xl text-[#1A2E05] mb-2 line-clamp-1">{session.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium mb-6 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                      <div className="space-y-4 pt-6 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground">
                            {session.hostName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expert Host</p>
                            <p className="text-xs font-bold">{session.hostName || 'Guest Expert'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule</p>
                            <p className="text-xs font-bold">
                              {session.date ? new Date(session.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Platform Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsPanel token={token!} globalSettings={globalSettings} onSaved={() => queryClient.invalidateQueries({ queryKey: ['globalSettings'] })} />
          )}
        </main>
      </div>
    </div>
  );
}

function SettingsPanel({ token, globalSettings, onSaved }: { token: string; globalSettings: Array<{ key: string; value: string }>; onSaved: () => void }) {
  const DEFAULT_KEYS = [
    { key: 'hero_stat_nutrition', label: 'Nutrition Members' },
    { key: 'hero_stat_fitness', label: 'Fitness Members' },
    { key: 'hero_stat_mental_wellness', label: 'Mental Wellness Members' },
    { key: 'hero_stat_yoga', label: 'Yoga Members' },
    { key: 'hero_stat_herbal', label: 'Herbal Products Members' },
    { key: 'hero_stat_supplements', label: 'Supplements Members' },
    { key: 'hero_stat_ayurveda', label: 'Ayurveda Members' },
    { key: 'hero_stat_weight_loss', label: 'Weight Loss Members' },
  ];

  const toMap = (arr: Array<{ key: string; value: string }>) =>
    arr.reduce((acc: Record<string, string>, s) => { acc[s.key] = s.value; return acc; }, {});

  const [values, setValues] = useState<Record<string, string>>(() => toMap(globalSettings));
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setValues(toMap(globalSettings));
  }, [globalSettings]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateGlobalSetting(token, key, values[key] || '0');
      setSaved(key);
      onSaved();
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      toast.error('Failed to save setting');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm p-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 font-black">Hero Banner</p>
        <h3 className="font-display text-2xl font-bold text-[#1A2E05] mb-2">Community Member Counts</h3>
        <p className="text-sm text-muted-foreground mb-8">These numbers appear on the homepage hero section. Set them to 0 until you have real data.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEFAULT_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={values[key] ?? '0'}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  className="rounded-xl h-10 text-lg font-black"
                  placeholder="0"
                />
                <Button
                  size="sm"
                  className="h-10 rounded-xl px-3"
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                >
                  {saved === key ? <Check className="h-4 w-4 text-emerald-400" /> : saving === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {globalSettings.filter(s => !DEFAULT_KEYS.map(k => k.key).includes(s.key)).length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm p-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 font-black">Other Settings</p>
          <h3 className="font-display text-2xl font-bold text-[#1A2E05] mb-6">Custom Platform Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {globalSettings.filter(s => !DEFAULT_KEYS.map(k => k.key).includes(s.key)).map(s => (
              <div key={s.key} className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{s.key}</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={values[s.key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                    className="rounded-xl h-10"
                  />
                  <Button size="sm" className="h-10 rounded-xl px-3" onClick={() => handleSave(s.key)} disabled={saving === s.key}>
                    {saved === s.key ? <Check className="h-4 w-4 text-emerald-400" /> : saving === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
