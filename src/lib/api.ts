import type { Partnership, Post, Session, User, Role, UserCommentActivity, Product, AdminComment, Brand, Payment } from './types';

const devDefault = 'http://localhost:5001/api';
const prodDefault = 'https://health-and-wellness-prod.onrender.com/api';
const envUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const normalizedEnvUrl = envUrl ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`) : undefined;
export const API_BASE = normalizedEnvUrl || (import.meta.env.DEV ? devDefault : prodDefault);

const buildUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const bodyIsFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    ...(bodyIsFormData ? {} : { 'Content-Type': 'application/json' }),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(buildUrl(path), { ...options, headers });
  } catch (error) {
    console.error('Network request failed:', error);
    throw new Error('Unable to reach the API server. Please verify the backend is running and accessible.');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = data?.error || data?.message || res.statusText;
    throw new Error(message);
  }
  return data;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function loginApi(email: string, password: string) {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function adminLoginApi(email: string, password: string) {
  return request<AuthResponse>('/auth/admin-login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function signupApi(payload: { 
  fullName: string; 
  email: string; 
  password: string; 
  role?: Role;
  mobile?: string;
  socialLinks?: string;
  businessCategory?: string;
  interests?: string[];
}) {
  return request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchProfile(token: string) {
  return request<User>('/auth/me', { method: 'GET' }, token);
}

export async function updateProfile(token: string, payload: { fullName: string }) {
  return request<User>('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }, token);
}

export async function getUserComments(token: string) {
  return request<UserCommentActivity[]>('/users/comments', { method: 'GET' }, token);
}

export async function getPosts(category?: string, search?: string) {
  let url = '/posts';
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  return request<Post[]>(url);
}

export async function getAuthorPosts(authorId: string) {
  return request<Post[]>(`/posts?authorId=${authorId}`);
}

export async function getAffiliateDashboard(token: string) {
  return request<{
    earnings: {
      total: number;
      pending: number;
      totalSales: number;
      conversionRate: number;
      nextPayoutDate?: string;
    };
    coupon?: { code: string };
    customCommission?: number | null;
    activeRequest?: unknown;
  }>('/affiliates/dashboard', { method: 'GET' }, token);
}

export async function createPost(token: string, payload: Partial<Post>) {
  return request<Post>('/posts', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function togglePostLike(token: string, postId: string) {
  return request<{ liked: boolean }>(`/posts/${postId}/like`, { method: 'POST' }, token);
}

export async function addComment(token: string, postId: string, commentText: string) {
  return request<{ message: string; comment: Post['comments'][0] }>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ commentText }) }, token);
}

export async function toggleSavePost(token: string, postId: string) {
  return request<{ saved: boolean }>(`/posts/${postId}/save`, { method: 'POST' }, token);
}


export async function getSessions() {
  return request<Session[]>('/sessions');
}

export async function toggleSessionRegistration(token: string, sessionId: string) {
  return request<{ message: string; registered: boolean }>(`/sessions/${sessionId}/register`, { method: 'POST' }, token);
}

export async function adminCreateSession(token: string, payload: Omit<Session, 'id' | 'registeredUsers'>) {
  return request<Session>('/admin/sessions', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function adminUpdateSession(token: string, sessionId: string, payload: Partial<Omit<Session, 'id' | 'registeredUsers'>>) {
  return request<Session>(`/admin/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
}

export async function adminDeleteSession(token: string, sessionId: string) {
  return request<{ message: string }>(`/admin/sessions/${sessionId}`, { method: 'DELETE' }, token);
}

export async function getPartnerships() {
  return request<Partnership[]>('/partnerships');
}

export async function submitPartnership(payload: Omit<Partnership, 'id' | 'status' | 'createdAt'>) {
  const data = await request<{ partnership: Partnership }>('/partnerships', { method: 'POST', body: JSON.stringify(payload) });
  return data.partnership;
}

export async function updatePartnershipStatus(token: string, id: string, status: Partnership['status']) {
  const data = await request<{ partnership: Partnership }>(`/partnerships/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
  return data.partnership;
}

export async function getAdminUsers(token: string) {
  return request<User[]>('/admin/users', { method: 'GET' }, token);
}

export async function updateAdminUser(token: string, id: string, payload: { blocked?: boolean }) {
  const data = await request<{ users: User[] }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  return data.users;
}

export async function deleteAdminUser(token: string, id: string) {
  const data = await request<{ users: User[] }>(`/admin/users/${id}`, { method: 'DELETE' }, token);
  return data.users;
}

export async function getAdminStats(token: string) {
  return request<{
    totalUsers: number;
    totalPosts: number;
    totalRevenue: number;
    growth: number;
    mindfulMinutes?: number;
    mindfulNote?: string;
    vitalityScore?: number;
    vitalityComment?: string;
  }>('/admin/stats', { method: 'GET' }, token);
}

export async function toggleBlockUser(token: string, userId: string) {
  return request<{ blocked: boolean }>(`/admin/users/${userId}/block`, { method: 'PATCH' }, token);
}

export async function deleteUser(token: string, userId: string) {
  return request<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE' }, token);
}

export async function getAdminPartnerships(token: string) {
  return request<Partnership[]>('/admin/partnerships', { method: 'GET' }, token);
}

export async function updateAdminPartnershipStatus(token: string, id: string, status: string) {
  return request<Partnership>(`/admin/partnerships/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
}

export async function getAdminProducts(token: string) {
  const data = await request<{ products: Product[] }>('/admin/products/all', { method: 'GET' }, token);
  return data.products;
}

export async function reviewProduct(token: string, productId: string, status: string) {
  return request<Product>(`/admin/products/${productId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
}

export async function deleteAdminProduct(token: string, productId: string) {
  return request<{ message: string }>(`/admin/products/${productId}`, { method: 'DELETE' }, token);
}

export async function createSession(token: string, payload: Omit<Session, 'id' | 'registeredUsers'>) {
  return request<Session>('/admin/sessions', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function updateSession(token: string, id: string, payload: Partial<Omit<Session, 'id' | 'registeredUsers'>>) {
  return request<Session>(`/admin/sessions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
}

export async function deleteSession(token: string, id: string) {
  return request<{ message: string }>(`/admin/sessions/${id}`, { method: 'DELETE' }, token);
}

export async function getProducts(filters: Record<string, string | number | boolean | undefined> = {}) {
  const query = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    const val = filters[key];
    if (val !== undefined && val !== '') {
      query.append(key, val.toString());
    }
  });
  const queryString = query.toString();
  const data = await request<{ products: Product[] }>(`/products${queryString ? `?${queryString}` : ''}`);
  return data?.products ?? [];
}

export async function getPublicBrands() {
  return request<Brand[]>('/products/public-brands');
}

export async function getAdminComments(token: string) {
  return request<AdminComment[]>('/admin/comments', { method: 'GET' }, token);
}

export async function deleteAdminComment(token: string, commentId: string) {
  return request<{ commentId: string }>(`/admin/comments/${commentId}`, { method: 'DELETE' }, token);
}

export async function getProductDetails(id: string) {
  return request<Product>(`/products/${id}`);
}

export async function getBrandProducts(token: string) {
  return request<Product[]>('/brands/products', { method: 'GET' }, token);
}

export async function createBrandProduct(token: string, product: Partial<Product> | FormData) {
  const isFormData = product instanceof FormData;
  return request<Product>(
    '/brands/products',
    {
      method: 'POST',
      body: isFormData ? product : JSON.stringify(product),
    },
    token
  );
}

export async function deleteBrandProduct(token: string, id: string) {
  return request<any>(`/brands/products/${id}`, { method: 'DELETE' }, token);
}

export async function updateBrandProduct(token: string, id: string, product: Partial<Product> | FormData) {
  const isFormData = product instanceof FormData;
  return request<Product>(
    `/brands/products/${id}`,
    {
      method: 'PUT',
      body: isFormData ? product : JSON.stringify(product),
    },
    token
  );
}

export async function updateAffiliateProfile(token: string, profile: Partial<User>) {
  return request<User>('/user/affiliate-profile', { method: 'PUT', body: JSON.stringify(profile) }, token);
}

export async function getNotifications(token: string) {
  return request<{ notifications: any[] }>('/notifications', { method: 'GET' }, token);
}

export async function markNotificationRead(token: string, id: string) {
  return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }, token);
}

export async function updatePostAdmin(token: string, id: string, payload: Partial<Post>) {
  return request<Post>(`/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
}

export async function deletePostAdmin(token: string, id: string) {
  return request<{ message: string }>(`/admin/posts/${id}`, { method: 'DELETE' }, token);
}
export async function getAdminAffiliates(token: string) {
  const data = await request<{ affiliates: any[] }>('/admin/affiliates/applications', { method: 'GET' }, token);
  return data.affiliates;
}

export async function reviewAffiliateStatus(token: string, affiliateId: string, status: string) {
  return request<User>(`/admin/affiliates/${affiliateId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
}

export async function deleteAdminAffiliate(token: string, affiliateId: string) {
  return request<{ message: string }>(`/admin/affiliates/${affiliateId}`, { method: 'DELETE' }, token);
}

export async function getAdminBrands(token: string) {
  const data = await request<{ brands: any[] }>('/admin/brands/applications', { method: 'GET' }, token);
  return data.brands;
}

export async function reviewBrandStatus(token: string, brandId: string, status: string) {
  return request<User>(`/admin/brands/${brandId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
}

export async function deleteAdminBrand(token: string, brandId: string) {
  return request<{ message: string }>(`/admin/brands/${brandId}`, { method: 'DELETE' }, token);
}

export async function togglePostSponsored(token: string, postId: string) {
  return request<Post>(`/admin/posts/${postId}/sponsored`, { method: 'PATCH' }, token);
}

export async function createPayment(token: string, payload: { amount: number; plan: string; paymentStatus: string; transactionId: string }) {
  return request<Payment>('/payments', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function createCommissionRequest(token: string, payload: { requestedCommission: number; reason: string; currentCommission: number }) {
  return request<{ message: string }>('/affiliates/commission-request', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function getAdminCommissionRequests(token: string) {
  const data = await request<{ requests: any[] }>('/admin/affiliates/commission-requests', { method: 'GET' }, token);
  return data.requests;
}

export async function updateAdminCommissionRequest(token: string, requestId: string, payload: { status: string; requestedCommission?: number }) {
  return request<{ message: string }>(`/admin/affiliates/commission-requests/${requestId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
}

// Global Settings API
export async function getGlobalSettings(token: string) {
  return request<Array<{ key: string, value: string }>>('/admin/settings', { method: 'GET' }, token);
}

export async function updateGlobalSetting(token: string, key: string, value: string | number) {
  return request<{ key: string, value: string }>(`/admin/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }, token);
}

export async function getPublicSettings() {
  return request<Record<string, string>>('/settings', { method: 'GET' });
}
