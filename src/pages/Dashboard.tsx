import React from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  FileText,
  TrendingUp,
  Plus,
  Download,
  Printer,
  MapPin,
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
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSPJ } from '../context/SPJContext';
import { formatCurrency, exportSPJToExcel, printSPJAsTable } from '../utils';
import { SPJ_CATEGORY_HEX } from '../constants';

const Dashboard = () => {
  const { reports } = useSPJ();
  const navigate = useNavigate();

  const totalNominal = reports.reduce((acc, r) => acc + r.nominal, 0);
  const totalLaporan = reports.length;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const bulanIniTotal = reports
    .filter(r => r.tanggal?.slice(0, 7) === currentMonthKey)
    .reduce((acc, r) => acc + r.nominal, 0);

  const stats = [
    { label: 'Total Pengeluaran SPD', value: formatCurrency(totalNominal), icon: Wallet, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
    { label: 'Total Laporan', value: String(totalLaporan), icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Bulan Ini', value: formatCurrency(bulanIniTotal), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  // Monthly trend: sum nominal per YYYY-MM across all reports, chronological order.
  const monthlyMap: Record<string, number> = {};
  reports.forEach(r => {
    const key = r.tanggal?.slice(0, 7);
    if (!key) return;
    monthlyMap[key] = (monthlyMap[key] || 0) + r.nominal;
  });
  const trendData = Object.keys(monthlyMap).sort().map(key => {
    const [y, m] = key.split('-');
    const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    return { name: label, total: monthlyMap[key] };
  });

  // Breakdown per kategori
  const categoryMap: Record<string, number> = {};
  reports.forEach(r => {
    categoryMap[r.kategori] = (categoryMap[r.kategori] || 0) + r.nominal;
  });
  const categoryData = Object.keys(categoryMap)
    .map(kat => ({ name: kat, total: categoryMap[kat] }))
    .sort((a, b) => b.total - a.total);

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ringkasan Laporan SPD</h1>
          <p className="text-slate-400 mt-1">Selamat datang kembali, inilah rekap perjalanan dinas Anda.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reports.length ? exportSPJToExcel(reports, 'laporan_spj') : null}
            className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-foreground"
          >
            <Download className="w-4 h-4" />
            Ekspor
          </button>
          <button
            onClick={() => navigate('/spj/input')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl text-sm font-bold neon-glow-blue hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Laporan
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
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-foreground">Tren Pengeluaran SPD per Bulan</h2>
          </div>
          <div className="h-[300px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}rb`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="total" name="Pengeluaran" stroke="#00f2ff" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Belum ada data untuk ditampilkan
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-foreground">Aktivitas Terbaru</h2>
            <button onClick={() => navigate('/spj')} className="text-sm text-neon-blue hover:underline">Lihat Semua</button>
          </div>
          <div className="space-y-6">
            {recentReports.length > 0 ? (
              recentReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between group gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors flex-shrink-0">
                      <MapPin className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.kegiatan}</p>
                      <p className="text-xs text-slate-500">{r.area} &middot; {r.tanggal}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-rose-400 whitespace-nowrap">
                    {formatCurrency(r.nominal)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">Belum ada laporan SPD</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-foreground">Pengeluaran per Kategori</h2>
          <button
            onClick={() => reports.length ? printSPJAsTable(reports, 'Laporan Bulanan SPD - Semua Periode', false) : null}
            className="flex items-center gap-2 text-sm text-neon-blue hover:underline"
          >
            <Printer className="w-3.5 h-3.5" /> Print Rekap
          </button>
        </div>
        <div className="h-[280px] w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}rb`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={180} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17171a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SPJ_CATEGORY_HEX[entry.name] || '#00f2ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Belum ada data untuk ditampilkan
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
