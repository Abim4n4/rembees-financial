import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Upload,
  Maximize2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils';
import { CATEGORIES } from '../constants';
import { TransactionType } from '../types';
import toast from 'react-hot-toast';

import { useSearchParams } from 'react-router-dom';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction } = useFinance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('add') === 'true');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as TransactionType,
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receipt: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      receipt: formData.receipt
    });
    toast.success('Transaksi berhasil ditambahkan!');
    setIsModalOpen(false);
    setFormData({
      amount: '',
      type: 'expense',
      category: 'other',
      description: '',
      date: new Date().toISOString().split('T')[0],
      receipt: ''
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-slate-400 mt-1">Catatan detail dari semua aktivitas keuangan Anda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-2xl font-bold neon-glow-blue hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Transaksi Baru
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
          <input
            type="text"
            placeholder="Cari berdasarkan deskripsi atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-3 rounded-2xl font-medium transition-all capitalize ${
                filterType === type 
                  ? 'bg-black/10 dark:bg-white/10 text-foreground border border-black/10 dark:border-white/20' 
                  : 'text-slate-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {type === 'all' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, i) => {
                  const category = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[CATEGORIES.length - 1];
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-5 text-sm text-slate-400">{t.date}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            t.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
                          }`}>
                            {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <span className="text-sm font-medium text-foreground">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                          {category.name}
                        </span>
                      </td>
                      <td className={`px-8 py-5 text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.receipt && (
                            <button 
                              onClick={() => setSelectedReceipt(t.receipt || null)}
                              className="p-2 text-slate-500 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                              title="Lihat Bukti Bon"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteTransaction(t.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-slate-700" />
                      <p className="text-slate-500">Tidak ada transaksi yang ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg glass p-8 rounded-3xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-foreground">Transaksi Baru</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.type === 'income' 
                        ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' 
                        : 'bg-black/5 dark:bg-white/5 text-slate-400 border border-black/10 dark:border-white/10'
                    }`}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.type === 'expense' 
                        ? 'bg-rose-400/20 text-rose-400 border border-rose-400/30' 
                        : 'bg-black/5 dark:bg-white/5 text-slate-400 border border-black/10 dark:border-white/10'
                    }`}
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                    Pengeluaran
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Jumlah (Rp)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Deskripsi</label>
                  <input
                    type="text"
                    required
                    placeholder="Untuk apa transaksi ini?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue/50 transition-all appearance-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Bukti Bon (Opsional)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 border-dashed rounded-2xl py-4 px-4 text-slate-400 flex items-center justify-center gap-2 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                    >
                      {formData.receipt ? (
                        <span className="text-neon-blue flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          Gambar Terpilih
                        </span>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Unggah Foto Bon
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all neon-glow-blue"
                >
                  Tambah Transaksi
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 max-w-2xl w-full"
            >
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-neon-blue transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="glass p-2 rounded-3xl overflow-hidden">
                <img src={selectedReceipt} alt="Bukti Bon" className="w-full h-auto rounded-2xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
