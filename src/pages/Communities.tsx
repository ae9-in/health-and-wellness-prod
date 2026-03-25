import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getPosts, getSessions } from '@/lib/api';
import { Post, Session } from '@/lib/types';
import { CATEGORIES, CATEGORY_INFO } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPosts(), getSessions()]).then(([p, s]) => {
      setPosts(p || []);
      setSessions(s || []);
      setLoading(false);
    });
  }, []);

  const handleEnterCommunity = (cat: string) => {
    navigate(`/discussions?category=${encodeURIComponent(cat)}`);
  };

  const getSubscribedCount = (cat: string) => {
    // Demo calculation for activity
    return posts.filter(p => p.category === cat).length * 12 + 45;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <BackButton />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pt-8">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">Community Hub</h1>
            <p className="text-muted-foreground">Pulse of the Health & Wellness community</p>
          </div>
          <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
            <TrendingUp className="text-primary w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">{posts.length}+ Active Discussions</p>
              <p className="text-xs text-muted-foreground">Across {CATEGORIES.length} communities</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-16">
          {CATEGORIES.map((cat, i) => {
            const catPosts = posts.filter(p => p.category === cat).slice(0, 2);
            const activeUsers = getSubscribedCount(cat);
            
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 hover:shadow-md transition-all group border border-border/50"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold mb-1 group-hover:text-primary transition-colors">{cat}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {activeUsers} members active
                    </p>
                  </div>
                  <Button onClick={() => handleEnterCommunity(cat)} variant="outline" size="sm" className="gap-2">
                    Enter Community
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                  {CATEGORY_INFO[cat]?.description || "Connect with others on your wellness journey."}
                </p>

                <div className="space-y-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</p>
                  {catPosts.length > 0 ? (
                    catPosts.map(p => (
                      <div key={p.id} className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl">
                        <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                          <p className="text-[10px] text-muted-foreground">{p.authorName} • {new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No recent posts in this community.</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {posts.filter(p => p.category === cat).length} topics</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {sessions.length} upcoming</span>
                  </div>
                  <Link to={`/categories`} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    About this category <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
