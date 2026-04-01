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
  if (!url) return 'https://placehold.co/400x300?text=No+Image'; 
  
  if (url.startsWith('http')) return url;
  if (url.startsWith('https://res.cloudinary.com')) return url;
  if (url.startsWith('data:')) return url;
  
  // Get backend base by removing /api from API_BASE
  const backendBase = API_BASE.replace(/\/api$/, '');
  
  // Ensure the URL starts with a slash
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${backendBase}${path}`;
}
