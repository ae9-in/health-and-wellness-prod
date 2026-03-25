import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, toggleSessionRegistration } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Sessions() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: sessions = [], isLoading } = useQuery({ 
    queryKey: ['sessions'], 
    queryFn: getSessions 
  });

  const isSubscribed = user?.subscriptionStatus === 'active' || user?.role === 'ADMIN';

  const registerMutation = useMutation({
    mutationFn: (sessionId: string) => toggleSessionRegistration(token!, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Registration updated!');
    },
    onError: () => toast.error('Failed to update registration')
  });

  const handleRegister = (sessionId: string) => {
    if (!user) { navigate('/login'); return; }
    if (!isSubscribed) { toast.error('Premium membership required for workshops'); navigate('/pricing'); return; }
    registerMutation.mutate(sessionId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton />
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold mb-3">Expert Workshops</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">Interactive sessions hosted by world-class wellness experts, nutritionists, and mental health professionals.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Syncing Schedule...</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s, i) => {
              const isRegistered = user ? s.registeredUsers?.includes(user.id) : false;
              const isPast = new Date(s.date) < new Date();
              return (
                <motion.div 
                  key={s.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.1 }} 
                  className="bg-gradient-to-br from-[#2C4A2E] to-[#4A3A2A] text-white rounded-[2.5rem] p-8 flex flex-col border border-[#8C4A2A]/40 shadow-2xl hover:shadow-black/30 hover:-translate-y-1 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white/70 group-hover:text-[#2C4A2E] transition-colors">
                      <Calendar className="h-6 w-6" />
                    </div>
                    {isRegistered && <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 italic">Confirmed</span>}
                  </div>

                  <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                  <p className="text-sm text-white/85 mb-8 flex-1 leading-relaxed">{s.description}</p>
                  
                  <div className="space-y-4 mb-8 bg-white/10 p-5 rounded-2xl border border-white/20">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm"><User className="h-4 w-4 text-primary" /></div>
                      {s.hostName}
                    </div>
                    <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-white/70"><Calendar className="h-4 w-4" />{new Date(s.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-white/70"><Clock className="h-4 w-4" />{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    {!isPast ? (
                      <Button
                        variant={isRegistered ? 'outline' : 'default'}
                      className={`flex-1 h-14 rounded-2xl font-bold transition-all rich-button shadow-lg/30 ${isRegistered ? 'opacity-80' : ''}`}
                        onClick={() => handleRegister(s.id)}
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? 'Updating...' : isRegistered ? 'Cancel Seat' : 'Reserve Spot'}
                      </Button>
                    ) : (
                      <div className="flex-1 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm uppercase tracking-widest">
                        Archive Session
                      </div>
                    )}
                    {isRegistered && (
                    <Button variant="outline" className="h-14 w-14 p-0 rounded-2xl border-white/40 text-white hover:bg-white hover:text-[#4A3A2A] transition-all shadow-lg shadow-black/20" asChild>
                        <a href={s.sessionLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-6 w-6" /></a>
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {sessions.length === 0 && !isLoading && (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-primary/5">
            <Calendar className="h-16 w-16 text-primary/10 mx-auto mb-6" />
            <h3 className="text-xl font-bold">New schedule incoming</h3>
            <p className="text-muted-foreground mt-2">Check back soon for upcoming live experiences.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
