import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Leaf,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronDown,
  ShoppingBag,
  MessageSquare,
  Users,
  Calendar,
  Home,
  ArrowLeft,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/community', label: 'Feed', icon: Users },
    { to: '/discussions', label: 'Discussions', icon: MessageSquare },
    { to: '/products', label: 'Shop', icon: ShoppingBag },
    { to: '/sessions', label: 'Sessions', icon: Calendar },
  ];

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'AFFILIATE': return '/affiliate-dashboard';
      case 'BRAND': return '/brand-dashboard';
      default: return '/dashboard';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-[60] border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground hidden sm:inline-block">
            health&wellness
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 bg-muted/30 p-1 rounded-2xl border border-border/40">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-white shadow-xl text-[#4F7153]'
                    : 'text-muted-foreground hover:text-[#4F7153] hover:bg-white/70'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              
              {/* Desktop Profile Dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 pr-3 rounded-full bg-[#7A9E7E] border border-[#7A9E7E] hover:shadow-lg transition-all outline-none text-white">
                        <Avatar className="h-8 w-8 border border-white/40 bg-white/30">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-black">
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden xl:block">
                        <p className="text-[10px] font-black uppercase text-white leading-none mb-0.5">{user.role}</p>
                        <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">{user.fullName}</p>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 mt-2 p-2 rounded-2xl bg-[#F9F5EE] border border-[#D4C4A8] shadow-2xl"
                  >
                    <DropdownMenuLabel className="p-3">
                      <p className="text-xs font-black uppercase text-muted-foreground mb-1 tracking-widest">My Account</p>
                      <p className="font-bold truncate">{user.fullName}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer p-3 rounded-xl font-bold">
                        <User className="h-4 w-4" />
                        <span className="font-bold text-sm">My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer p-3 rounded-xl text-destructive focus:text-destructive">
                      <Settings className="h-4 w-4" />
                      <span className="font-bold text-sm">Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer p-3 rounded-xl text-destructive focus:bg-destructive/5 focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-bold text-sm">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Account Action */}
              <button 
                className="md:hidden h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                onClick={() => setOpen(!open)}
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="font-bold hidden sm:flex" onClick={() => navigate('/login')}>Login</Button>
              <Button size="sm" className="rounded-full px-5 font-bold shadow-lg shadow-primary/10" onClick={() => navigate('/signup')}>Join</Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button className="lg:hidden text-foreground p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-20 left-0 right-0 border-b border-border bg-background/95 backdrop-blur-lg lg:hidden overflow-hidden shadow-2xl"
          >
            <div className="p-6 space-y-8">
              {/* Explore Section */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">Explore Wellnest</p>
                <div className="grid grid-cols-1 gap-2">
                  {navLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted font-bold transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <link.icon className="h-5 w-5" />
                      </div>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Section */}
              <div className="pt-6 border-t border-border/50 space-y-4">
                {user ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">My Account</p>
                    <div className="p-4 bg-muted/30 rounded-3xl border border-border/40 flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-black">
                          {user.fullName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{user.fullName}</p>
                        <p className="text-[10px] font-black uppercase text-primary">{user.role}</p>
                      </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-bold justify-start px-6 gap-3" asChild onClick={() => setOpen(false)}>
                      <Link to={getDashboardLink(user.role)}>
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full h-14 rounded-2xl font-bold justify-start px-6 gap-3 border-destructive/20 text-destructive" onClick={handleLogout}>
                      <LogOut className="h-5 w-5" /> Logout
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-14 rounded-2xl font-bold border-primary/20" onClick={() => { navigate('/login'); setOpen(false); }}>Sign In</Button>
                    <Button className="h-14 rounded-2xl font-bold px-6 shadow-lg shadow-primary/10" onClick={() => { navigate('/signup'); setOpen(false); }}>Join Now</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
