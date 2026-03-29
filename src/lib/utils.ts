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
import { API_BASE } from './api';

export function resolveImageUrl(url: string | undefined): string {
  if (!url) return ''; // No image — let UI handle its own empty state
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  
  const baseUrl = API_BASE.replace('/api', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
