import { useAuth } from '@/lib/auth';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import NotificationPanel from '@/components/NotificationPanel';
import { getPosts, getSessions, getUserComments } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Check, ArrowRight, Hash, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Post, UserCommentActivity } from '@/lib/types';

type DiscussionEntry = {
  id: string;
  title: string;
  snippet: string;
  date: string;
  type: 'comment' | 'post';
};

export default function UserDashboard() {
  const { user, token } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'USER' && user.role !== 'ADMIN') return null; // Safety check

  // Queries
  const { data: posts = [] } = useQuery<Post[]>({ queryKey: ['posts'], queryFn: getPosts });
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: getSessions });
  const { data: recentComments = [] } = useQuery<UserCommentActivity[]>({
    queryKey: ['user-comments'],
    queryFn: () => getUserComments(token!),
    enabled: !!token,
  });

  const userPosts = posts.filter(p => p.authorId === user.id);
  const registeredSessions = sessions.filter(s => s.registeredUsers?.includes(user.id));
  const commentEntries: DiscussionEntry[] = recentComments.map(comment => ({
    id: comment.id,
    title: comment.postTitle,
    snippet: comment.commentText,
    date: comment.createdAt,
    type: 'comment',
  }));
  const postEntries: DiscussionEntry[] = userPosts.map(post => ({
    id: post.id,
    title: post.title,
    snippet: post.description,
    date: post.createdAt,
    type: 'post',
  }));
  const discussionEntries = [...commentEntries, ...postEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentDiscussions = discussionEntries.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFB]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
          <div className="space-y-10">
            <div className="mb-4">
              <h1 className="font-display text-4xl font-bold mb-3 tracking-tight text-[#1A2E05]">Wellness Hub</h1>
              <p className="text-muted-foreground text-lg font-medium">Welcome back, <span className="text-foreground font-bold">{user.fullName}</span>.</p>
              {user.city && <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-2">📍 {user.city} {user.age && <span>• {user.age} years old</span>}</p>}
            </div>


            {/* Discover Products */}
            <div className="bg-[#1A2E05] text-white rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Curated Wellness Marketplace
                  </h3>
                  <p className="text-white/60 text-sm font-medium">Discover products verified by our clinical experts.</p>
                </div>
                <Button variant="secondary" className="rounded-xl font-bold h-12" asChild>
                  <Link to="/products">Browse Shop</Link>
                </Button>
              </div>
            </div>

            {/* Personal Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: MessageSquare, label: 'Discussion Posts', value: userPosts.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Calendar, label: 'Upcoming Sessions', value: registeredSessions.length, color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: Check, label: 'Active Member', value: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <motion.div 
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2rem] p-7 text-center border border-primary/5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-14 w-14 ${s.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 ${s.color}`}>
                    <s.icon className="h-8 w-8" />
                  </div>
                  <p className="text-3xl font-black mb-1">{s.value}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Activity Sections */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Recent Discussions
                </h3>
                <div className="space-y-4">
                  {recentDiscussions.map(entry => (
                    <div key={`${entry.type}-${entry.id}`} className="p-4 rounded-xl bg-muted/20 border border-border/40">
                      <p className="font-bold text-sm mb-1 line-clamp-1">{entry.title}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-2">
                        {entry.type === 'comment' ? 'Commented' : 'Posted'} {new Date(entry.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {entry.snippet}
                      </p>
                    </div>
                  ))}
                  {recentDiscussions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-4">
                      No recent discussions yet. Start a conversation or reply to a post to see it here.
                    </p>
                  )}
                </div>
                <Button variant="link" className="mt-2 p-0 h-auto font-bold text-primary group" asChild>
                  <Link to="/discussions">Browse All Discussions <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" /> Booked Sessions
                </h3>
                <div className="space-y-4">
                  {registeredSessions.slice(0, 3).map(session => (
                    <div key={session.id} className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                      <p className="font-bold text-sm mb-1 line-clamp-1">{session.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {registeredSessions.length === 0 && <p className="text-sm text-muted-foreground italic py-4">No sessions booked yet.</p>}
                </div>
                <Button variant="link" className="mt-2 p-0 h-auto font-bold text-purple-600 group" asChild>
                  <Link to="/sessions">Find New Workshops <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <NotificationPanel />

            <div className="bg-[#1A2E05] text-white rounded-[2.5rem] p-6 border border-white/20 shadow-lg space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Member Snapshot</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black">
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg">{user.fullName}</p>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Wellness Member</p>
                </div>
              </div>
              {user.city && (
                <p className="text-sm text-white/80">Location: {user.city}</p>
              )}
              <p className="text-sm text-white/80">Posts: {userPosts.length}</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
