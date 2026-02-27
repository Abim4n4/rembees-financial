import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'salary', name: 'Gaji', icon: 'DollarSign', color: '#10b981' },
  { id: 'food', name: 'Makanan & Minuman', icon: 'Utensils', color: '#f59e0b' },
  { id: 'transport', name: 'Transportasi', icon: 'Car', color: '#3b82f6' },
  { id: 'shopping', name: 'Belanja', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'entertainment', name: 'Hiburan', icon: 'Film', color: '#8b5cf6' },
  { id: 'health', name: 'Kesehatan', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'utilities', name: 'Tagihan', icon: 'Zap', color: '#06b6d4' },
  { id: 'other', name: 'Lainnya', icon: 'MoreHorizontal', color: '#6b7280' },
];

export const APP_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#0a0a0c',
  card: 'rgba(23, 23, 26, 0.7)',
};
