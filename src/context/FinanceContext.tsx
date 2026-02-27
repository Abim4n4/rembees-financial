import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, User } from '../types';

export type AppTheme = 'dark' | 'light' | 'matrix' | 'purple' | 'neon';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  user: User | null;
  updateUser: (data: Partial<User>) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  login: (email: string) => void;
  logout: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('rembees_transactions');
    if (saved) return JSON.parse(saved);
    
    // Seed data
    return [
      { id: '1', amount: 15000000, type: 'income', category: 'salary', description: 'Gaji Bulanan', date: '2024-03-01' },
      { id: '2', amount: 150000, type: 'expense', category: 'food', description: 'Makan Malam', date: '2024-03-02' },
      { id: '3', amount: 50000, type: 'expense', category: 'transport', description: 'Ojek Online', date: '2024-03-03' },
      { id: '4', amount: 1200000, type: 'expense', category: 'shopping', description: 'Sepatu Baru', date: '2024-03-04' },
      { id: '5', amount: 350000, type: 'expense', category: 'utilities', description: 'Tagihan Listrik', date: '2024-03-05' },
    ];
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rembees_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('rembees_theme');
    return (saved as AppTheme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('rembees_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('rembees_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rembees_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('rembees_theme', theme);
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'light', 'theme-matrix', 'theme-purple', 'theme-neon');
    
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else if (theme === 'matrix') {
      document.documentElement.classList.add('dark', 'theme-matrix');
    } else if (theme === 'purple') {
      document.documentElement.classList.add('dark', 'theme-purple');
    } else if (theme === 'neon') {
      document.documentElement.classList.add('dark', 'theme-neon');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const setTheme = (t: AppTheme) => setThemeState(t);

  const login = (email: string) => {
    setUser({ name: email.split('@')[0], email });
  };

  const logout = () => {
    setUser(null);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <FinanceContext.Provider value={{
      transactions,
      addTransaction,
      deleteTransaction,
      balance,
      totalIncome,
      totalExpense,
      user,
      updateUser,
      theme,
      setTheme,
      login,
      logout
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
