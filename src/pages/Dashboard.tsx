import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, exportToCSV } from '../utils';
import { CATEGORIES } from '../constants';

import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { transactions, balance, totalIncome, totalExpense } = useFinance();
  const navigate = useNavigate();

  const recentTransactions = transactions.slice(0, 5);

  const chartData = [
    { name: 'Mon', income: 4000, expense: 2400 },
    { name: 'Tue', income: 3000, expense: 1398 },
    { name: 'Wed', income: 2000, expense: 9800 },
    { name: 'Thu', income: 2780, expense: 3908 },
    { name: 'Fri', income: 1890, expense: 4800 },
    { name: 'Sat', income: 2390, expense: 3800 },
    { name: 'Sun', income: 3490, expense: 4300 },
  ];

  const stats = [
    { label: 'Total Saldo', value: balance, icon: Wallet, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
    { label: 'Total Pemasukan', value: totalIncome, icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Pengeluaran', value: totalExpense, icon: ArrowDownLeft, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ringkasan Keuangan</h1>
          <p className="text-slate-400 mt-1">Selamat datang kembali, inilah kondisi keuangan Anda.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToCSV(transactions, 'transaksi')}
            className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-foreground"
          >
            <Download className="w-4 h-4" />
            Ekspor Data
          </button>
          <button 
            onClick={() => navigate('/transactions?add=true')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl text-sm font-bold neon-glow-blue hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`} />
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stat.value)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-foreground">Arus Kas</h2>
            <select className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-neon-blue">
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
              <option>Tahun Ini</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="income" stroke="#00f2ff" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#bc13fe" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-foreground">Aktivitas Terbaru</h2>
            <button className="text-sm text-neon-blue hover:underline">Lihat Semua</button>
          </div>
          <div className="space-y-6">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => {
                const category = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[CATEGORIES.length - 1];
                return (
                  <div key={t.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                        <Wallet className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.date}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">Tidak ada transaksi terbaru</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
