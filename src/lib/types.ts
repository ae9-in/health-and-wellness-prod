export type Role = 'USER' | 'AFFILIATE' | 'BRAND' | 'ADMIN' | 'EXPERT';

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
}

export interface ProductVariant {
  quantity: number;
  unit: 'ml' | 'liter' | 'gram' | 'kg' | 'pieces' | 'tablets' | 'capsules';
  size: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  image?: string;
  isPopular?: boolean;
  commissionRate: number;
  brandId: string;
  brand?: Brand;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  variants?: ProductVariant[];
  createdAt: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  mobile?: string;
  city?: string;
  age?: number;
  interests: string[];
  status?: ApprovalStatus;
  blocked: boolean;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title?: string;
  description: string;
  category?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  brand?: Brand;
  brandName?: string;
  createdAt: string;
  likesCount?: number; // legacy
  commentsCount?: number; // legacy
  likes: string[]; // List of user IDs who liked
  comments: {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    commentText: string;
    createdAt: string;
    status?: string;
  }[];
  savedUsers: string[]; // List of user IDs who saved
  isLiked?: boolean;
  isSaved?: boolean;
  postType: string; // Dynamic
  images: string[];
  videoUrl?: string;
  video?: string;
  audioUrl?: string;
  fileUrl?: string;
  userType?: string;
  mediaType?: string;
  mediaUrls?: string[];
  sponsored?: boolean;
  published?: boolean;
  tags?: string[];
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

export interface UserCommentActivity {
  id: string;
  postId: string;
  postTitle: string;
  commentText: string;
  createdAt: string;
}

export interface AdminComment {
  id: string;
  commentText: string;
  createdAt: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  postId: string;
  postTitle: string;
}
export interface Payment {
  id: string;
  userId: string;
  user?: User;
  amount: number;
  plan: string;
  paymentStatus: string;
  transactionId: string;
  createdAt: string;
}
