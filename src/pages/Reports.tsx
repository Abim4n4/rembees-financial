import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Calendar,
  Download,
  X,
  Target,
  Lightbulb,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils';
import { CATEGORIES } from '../constants';

const Reports = () => {
  const { transactions } = useFinance();
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const expenseByCategory = CATEGORIES.map(cat => {
    const amount = transactions
      .filter(t => t.type === 'expense' && t.category === cat.id)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: cat.name, value: amount, color: cat.color };
  }).filter(item => item.value > 0);

  const monthlyData = [
    { name: 'Jan', income: 4500, expense: 3200 },
    { name: 'Feb', income: 5200, expense: 3800 },
    { name: 'Mar', income: 4800, expense: 4100 },
    { name: 'Apr', income: 6100, expense: 3500 },
    { name: 'May', income: 5500, expense: 4200 },
    { name: 'Jun', income: 6700, expense: 3900 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-slate-400 mt-1">Analisis mendalam tentang kebiasaan belanja dan pertumbuhan pendapatan Anda.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-foreground"
        >
          <Download className="w-4 h-4" />
          Unduh PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-neon-purple" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Pengeluaran per Kategori</h2>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center">
              <BarChartIcon className="w-5 h-5 text-neon-blue" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Perbandingan Bulanan</h2>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="income" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#bc13fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Insight Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-white/10 p-8 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-10 h-10 text-neon-blue" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Wawasan Pintar</h3>
            <p className="text-slate-300 leading-relaxed">
              Berdasarkan pola pengeluaran Anda, Anda telah menabung <span className="text-emerald-400 font-bold">12% lebih banyak</span> bulan ini dibandingkan bulan lalu. 
              Kategori pengeluaran terbesar Anda adalah <span className="text-neon-purple font-bold">Makanan & Minuman</span>. 
              Pertimbangkan untuk menetapkan anggaran untuk ini agar bisa menabung tambahan Rp 200.000 bulan depan.
            </p>
          </div>
          <button 
            onClick={() => setShowAnalysis(true)}
            className="md:ml-auto px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-all shrink-0"
          >
            Lihat Analisis
          </button>
        </div>
      </motion.div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnalysis(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass p-8 rounded-3xl relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-neon-blue" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Analisis Keuangan Mendalam</h2>
                </div>
                <button 
                  onClick={() => setShowAnalysis(false)}
                  className="p-2 text-slate-400 hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-foreground">Target Tabungan</h3>
                    </div>
                    <p className="text-sm text-slate-400">Anda berada di jalur yang tepat! Tabungan Anda meningkat 12% bulan ini. Pertahankan rasio tabungan di atas 20% dari total pendapatan.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-foreground">Efisiensi Biaya</h3>
                    </div>
                    <p className="text-sm text-slate-400">Biaya utilitas Anda turun 5% berkat penghematan listrik. Namun, biaya transportasi meningkat karena seringnya penggunaan ojek online.</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-neon-purple/5 border border-neon-purple/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-5 h-5 text-neon-purple" />
                    <h3 className="font-bold text-foreground">Rekomendasi Strategis</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5 shrink-0" />
                      Kurangi anggaran makan luar sebesar 15% untuk dialokasikan ke dana darurat.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5 shrink-0" />
                      Gunakan transportasi umum 2x seminggu untuk menghemat biaya bensin/ojek.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5 shrink-0" />
                      Manfaatkan promo cashback untuk belanja bulanan di supermarket langganan.
                    </li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => setShowAnalysis(false)}
                className="w-full mt-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-2xl hover:opacity-90 transition-all"
              >
                Tutup Analisis
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
