import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getNotifications } from '@/lib/api';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, any>;
}

const notificationSections = [
  {
    key: 'community',
    label: 'Community Alerts',
    description: 'New posts in followed topics, replies to your comments, and trending health stories.',
    types: ['new_post_topic', 'reply_comment', 'trending_post']
  },
  {
    key: 'affiliate',
    label: 'Affiliate Signals',
    description: 'Brand partnership updates, commission history, and payment confirmations.',
    types: ['brand_partnership', 'commission_earned', 'payment_processed']
  },
  {
    key: 'brand',
    label: 'Brand Updates',
    description: 'Affiliate promotions, sales activity, and product approval status.',
    types: ['affiliate_promotion', 'product_sale', 'product_approval']
  }
];

const typeLabels: Record<string, string> = {
  new_post_topic: 'New post in followed topic',
  reply_comment: 'Reply to your comment',
  trending_post: 'Trending health post',
  brand_partnership: 'New brand partnership',
  commission_earned: 'Commission earned',
  payment_processed: 'Payment processed',
  affiliate_promotion: 'Affiliate promoting product',
  product_sale: 'Product sales update',
  product_approval: 'Product approval status'
};

export default function NotificationPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeSection, setActiveSection] = useState<'community' | 'affiliate' | 'brand' | 'all'>('community');

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem('wellnest_token');
    if (!user || !token) return;
    getNotifications(token)
      .then(data => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(err => console.error('Failed to fetch notifications:', err));
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 5000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  if (!user) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeSection === 'all') return true;
    const section = notificationSections.find(s => s.key === activeSection);
    return section ? section.types.includes(n.type) : true;
  });

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Notifications</h2>
        </div>
        <span className="text-xs text-muted-foreground">{notifications.length} total</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`text-xs font-bold uppercase tracking-[0.3em] px-3 py-1 rounded-full transition ${activeSection === 'all' ? 'bg-primary text-white' : 'bg-white/70 text-primary border border-primary/20'}`}
          onClick={() => setActiveSection('all')}
        >
          All
        </button>
        {notificationSections.map(section => (
          <button
            key={section.key}
            className={`text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full transition ${activeSection === section.key ? 'bg-primary/80 text-white' : 'bg-white/80 text-primary/80 border border-primary/20'}`}
            onClick={() => setActiveSection(section.key as any)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground italic mb-4">
        {activeSection === 'all'
          ? 'All alerts are visible here.'
          : notificationSections.find(section => section.key === activeSection)?.description}
      </p>
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
            No notifications in this stream yet.
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div key={n.id} className={`rounded-lg border border-border/50 px-3 py-2 text-sm ${n.read ? 'bg-white/80' : 'bg-primary/5'}`}>
              <p className="text-[12px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{typeLabels[n.type] || 'Community alert'}</p>
              <p className="font-medium text-[15px]">{n.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
