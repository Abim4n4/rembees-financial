export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  receipt?: string; // Base64 string for the receipt image
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};
