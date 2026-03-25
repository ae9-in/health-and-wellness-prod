// Demo data store using localStorage

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  subscriptionStatus: 'free' | 'active' | 'expired';
  subscriptionPlan: 'none' | 'basic' | 'premium';
  subscriptionExpiry: string | null;
  blocked: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  commentText: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  hostName: string;
  date: string;
  sessionLink: string;
  registeredUsers: string[];
}

export interface Product {
  id: string;
  name: string;
  brandName: string;
  category: string;
  description: string;
  price: number;
  commissionRate: number;
  image: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  plan: string;
  paymentStatus: 'success' | 'failed';
  transactionId: string;
  createdAt: string;
}

export interface Partnership {
  id: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  proposal: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const CATEGORIES = ['Mental Health', 'Fitness', 'Nutrition', 'Lifestyle', 'Chronic Conditions'];

function getStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function initDemoData() {
  if (localStorage.getItem('_demo_init')) return;

  const users: User[] = [
    { id: 'u1', fullName: 'Demo User', email: 'user@example.com', password: 'password', subscriptionStatus: 'free', subscriptionPlan: 'none', subscriptionExpiry: null, blocked: false, createdAt: new Date().toISOString() },
    { id: 'u2', fullName: 'Premium Member', email: 'premium@example.com', password: 'password', subscriptionStatus: 'active', subscriptionPlan: 'premium', subscriptionExpiry: new Date(Date.now() + 86400000 * 30).toISOString(), blocked: false, createdAt: new Date().toISOString() },
  ];

  const products: Product[] = [
    { id: 'pr1', name: 'Organic Matcha Powder', brandName: 'GreenTea Co', category: 'Nutrition', description: 'High-quality ceremonial grade matcha powder for better focus and energy.', price: 1200, commissionRate: 15, image: 'https://images.unsplash.com/photo-1582793988951-9aed55099993?w=400', status: 'approved', createdAt: new Date().toISOString() },
    { id: 'pr2', name: 'Yoga Mat Pro', brandName: 'FlowState', category: 'Fitness', description: 'Eco-friendly, non-slip yoga mat with alignment lines.', price: 2500, commissionRate: 10, image: 'https://images.unsplash.com/photo-1592432678886-f245a443c52e?w=400', status: 'pending', createdAt: new Date().toISOString() },
  ];

  const posts: Post[] = [
    { id: 'p1', title: 'Managing Anxiety in Daily Life', description: 'Anxiety can feel overwhelming, but small daily practices like deep breathing, journaling, and mindful walking can make a significant difference. Share your experiences and tips for managing anxiety.', category: 'Mental Health', authorId: 'demo', authorName: 'Dr. Sarah Chen', likes: ['u1', 'u2'], comments: [], createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'p2', title: 'Best Morning Workout Routines', description: 'Starting the day with a good workout sets the tone for everything. Here are some 20-minute morning routines that work for all fitness levels.', category: 'Fitness', authorId: 'demo', authorName: 'Coach Mike', likes: ['u1'], comments: [], createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'p3', title: 'Plant-Based Nutrition Guide', description: 'Switching to plant-based eating doesn\'t have to be all-or-nothing. Learn about balanced nutrition and simple meal prep ideas for beginners.', category: 'Nutrition', authorId: 'demo', authorName: 'Lisa Nguyen, RD', likes: ['u2', 'u3'], comments: [], createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  ];

  const sessions: Session[] = [
    { id: 's1', title: 'Morning Yoga Flow', description: 'A gentle 45-minute yoga session suitable for all levels. Focus on breathing and flexibility.', hostName: 'Instructor Priya', date: new Date(Date.now() + 86400000 * 3).toISOString(), sessionLink: 'https://zoom.us/j/example1', registeredUsers: [] },
    { id: 's2', title: 'Stress Management Workshop', description: 'Learn practical techniques for managing stress including CBT-based approaches and mindfulness.', hostName: 'Dr. Sarah Chen', date: new Date(Date.now() + 86400000 * 7).toISOString(), sessionLink: 'https://meet.google.com/example2', registeredUsers: [] },
  ];

  setStore('users', users);
  setStore('products', products);
  setStore('posts', posts);
  setStore('sessions', sessions);
  localStorage.setItem('_demo_init', '1');
}

// Users
export const getUsers = () => getStore<User>('users');
export const saveUsers = (users: User[]) => setStore('users', users);

// Products
export const getProducts = () => getStore<Product>('products');
export const saveProducts = (products: Product[]) => setStore('products', products);

// Notifications
export const getNotifications = () => getStore<Notification>('notifications');
export const saveNotifications = (notifications: Notification[]) => setStore('notifications', notifications);

// Posts
export const getPosts = () => getStore<Post>('posts');
export const savePosts = (posts: Post[]) => setStore('posts', posts);

// Sessions
export const getSessions = () => getStore<Session>('sessions');
export const saveSessions = (sessions: Session[]) => setStore('sessions', sessions);

// Payments
export const getPayments = () => getStore<Payment>('payments');
export const savePayments = (payments: Payment[]) => setStore('payments', payments);

// Partnerships
export const getPartnerships = () => getStore<Partnership>('partnerships');
export const savePartnerships = (partnerships: Partnership[]) => setStore('partnerships', partnerships);

export { CATEGORIES };
