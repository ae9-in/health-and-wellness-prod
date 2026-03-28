import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
}

export function parseVariants(variants: any): any[] {
  if (!variants) return [];
  if (Array.isArray(variants)) return variants;
  if (typeof variants === 'string') {
    try {
      const parsed = JSON.parse(variants);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse variants string:', variants);
      return [];
    }
  }
  return [];
}
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1540344484110-2c93d80db616?auto=format&fit=crop&w=800&q=80'; // Neutral wellness herbs
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://health-and-wellness-prod.onrender.com/api';
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
