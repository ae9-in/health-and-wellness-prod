import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { socket } from '@/lib/socket';
import { API_BASE as API_URL, getNotifications, markNotificationRead } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

const typeLabels: Record<string, string> = {
  new_post_topic: 'New post in your followed topic',
  reply_comment: 'Reply to your comment',
  trending_post: 'Trending health post',
  brand_partnership: 'New brand partnership',
  commission_earned: 'Commission earned',
  payment_processed: 'Payment received',
  affiliate_promotion: 'Affiliate promoting your product',
  product_sale: 'Product sales update',
  product_approval: 'Product approval status'
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const storedToken = localStorage.getItem('wellnest_token');
    if (storedToken) {
      getNotifications(storedToken)
        .then(data => {
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        })
        .catch(err => console.error('Failed to fetch notifications:', err));
    }

    // Join room
    socket.emit('join', user.id);

    // Handle real-time notifications
    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('notification:new');
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const storedToken = localStorage.getItem('wellnest_token');
      if (!storedToken) return;
      await markNotificationRead(storedToken, id);
      
      setNotifications(prev => 
        id === 'all' 
          ? prev.map(n => ({ ...n, read: true }))
          : prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#4F7153] hover:bg-white/80 hover:text-[#1e1e1e] group shadow-sm"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 mr-4 mt-2 rounded-[2rem] bg-[#FDFDFB] border border-[#D4C4A8] shadow-xl shadow-black/10"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 text-muted-foreground hover:text-primary p-0 px-2"
              onClick={() => markAsRead('all')}
            >
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className={`text-[10px] uppercase tracking-[0.3em] ${!notification.read ? 'text-primary' : 'text-muted-foreground/80'}`}>
                    {typeLabels[notification.type] || 'Community alert'}
                  </p>
                  <p className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
