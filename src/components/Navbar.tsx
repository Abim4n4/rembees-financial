import React, { useState } from 'react';
import { Search, Bell, User, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { user } = useFinance();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Laporan Bulanan Siap', desc: 'Laporan Februari Anda sudah tersedia.', time: '2 jam yang lalu' },
    { id: 2, title: 'Pengeluaran Tinggi', desc: 'Pengeluaran kategori Makanan meningkat 10%.', time: '5 jam yang lalu' },
    { id: 3, title: 'Selamat Datang!', desc: 'Terima kasih telah menggunakan Rembees.', time: '1 hari yang lalu' },
  ];

  return (
    <header className="h-20 glass-dark border-b border-black/5 dark:border-white/5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1 max-w-xl ml-12 lg:ml-0">
        <div className="relative w-full group hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
          <input
            type="text"
            placeholder="Cari transaksi, laporan..."
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/20 focus:border-neon-blue/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-blue rounded-full neon-glow-blue" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-[var(--background)] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden z-20"
                >
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-white/5">
                    <h3 className="font-bold text-foreground">Notifikasi</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-500 hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border)]">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                        <p className="text-sm font-bold text-foreground">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.desc}</p>
                        <p className="text-[10px] text-neon-blue mt-2 uppercase tracking-wider">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white/5 text-center">
                    <button className="text-xs text-slate-400 hover:text-neon-blue transition-colors">
                      Tandai semua telah dibaca
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-black/10 dark:border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-500">Paket Premium</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
