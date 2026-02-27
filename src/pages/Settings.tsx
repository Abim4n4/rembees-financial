import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  Mail,
  Smartphone,
  ChevronRight,
  Save,
  CreditCard,
  Camera,
  Zap,
  Terminal,
  Palette,
  X,
  Lock,
  Key,
  ShieldOff
} from 'lucide-react';
import { useFinance, AppTheme } from '../context/FinanceContext';

const Settings = () => {
  const { user, updateUser, theme, setTheme } = useFinance();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSave = () => {
    updateUser({ name, email, avatar });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const themeOptions: { id: AppTheme; label: string; icon: any; color: string }[] = [
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-slate-400' },
    { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-400' },
    { id: 'matrix', label: 'Matrix', icon: Terminal, color: 'text-emerald-400' },
    { id: 'purple', label: 'Purple', icon: Palette, color: 'text-purple-400' },
    { id: 'neon', label: 'Neon', icon: Zap, color: 'text-pink-400' },
  ];

  const sections = [
    {
      title: 'Pengaturan Akun',
      items: [
        { 
          icon: User, 
          label: 'Informasi Profil', 
          desc: 'Perbarui nama dan email Anda', 
          color: 'text-blue-400',
          type: 'input',
          value: name,
          onChange: (e: any) => setName(e.target.value)
        },
        { 
          icon: Mail, 
          label: 'Alamat Email', 
          desc: 'Email utama untuk notifikasi', 
          color: 'text-emerald-400',
          type: 'input',
          value: email,
          onChange: (e: any) => setEmail(e.target.value)
        },
      ]
    },
    {
      title: 'Tampilan & Tema',
      items: [
        { 
          icon: Palette, 
          label: 'Tema Aplikasi', 
          desc: 'Pilih nuansa warna aplikasi Anda', 
          color: 'text-purple-400',
          type: 'theme-selector'
        },
        { 
          icon: Globe, 
          label: 'Bahasa & Wilayah', 
          desc: 'Bahasa Indonesia (IDR)', 
          color: 'text-cyan-400',
          type: 'button'
        },
      ]
    },
    {
      title: 'Keamanan',
      items: [
        { 
          icon: Shield, 
          label: 'Keamanan & Privasi', 
          desc: 'Kata sandi dan 2FA', 
          color: 'text-rose-400',
          type: 'button',
          onClick: () => setShowSecurityModal(true)
        },
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-slate-400 mt-1">Kelola preferensi akun dan pengaturan aplikasi Anda.</p>
      </div>

      {/* Profile Photo Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8"
      >
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon-blue/20 bg-white/5">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-slate-500" />
              </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2.5 bg-neon-blue text-black rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-foreground">Foto Profil</h2>
          <p className="text-slate-500 mt-1">Gunakan foto asli agar rekan Anda dapat mengenali Anda dengan mudah.</p>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
            >
              Ganti Foto
            </button>
            {avatar && (
              <button 
                onClick={() => setAvatar('')}
                className="px-4 py-2 text-rose-400 hover:bg-rose-400/10 rounded-xl text-sm font-medium transition-all"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">{section.title}</h2>
            <div className="glass rounded-3xl divide-y divide-white/5 overflow-hidden">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/5 transition-all group text-left gap-4"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {item.type === 'input' ? (
                      <input
                        type="text"
                        value={item.value}
                        onChange={item.onChange}
                        className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue w-full md:w-64"
                      />
                    ) : item.type === 'theme-selector' ? (
                      <div className="flex flex-wrap gap-2">
                        {themeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setTheme(opt.id)}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
                              theme === opt.id 
                                ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' 
                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                            title={opt.label}
                          >
                            <opt.icon className={`w-4 h-4 ${opt.color}`} />
                            <span className="text-xs font-medium hidden sm:inline">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button 
                        onClick={item.onClick}
                        className="p-2 text-slate-600 group-hover:text-foreground group-hover:translate-x-1 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-8 flex justify-end gap-4">
        <button className="px-6 py-3 glass rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">
          Batalkan Perubahan
        </button>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-2xl font-bold neon-glow-blue hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* Security Modal */}
      <AnimatePresence>
        {showSecurityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSecurityModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg glass p-8 rounded-3xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-rose-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Keamanan & Privasi</h2>
                </div>
                <button 
                  onClick={() => setShowSecurityModal(false)}
                  className="p-2 text-slate-400 hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <Lock className="w-5 h-5 text-slate-400 group-hover:text-neon-blue" />
                    <div className="text-left">
                      <p className="font-bold text-foreground">Ubah Kata Sandi</p>
                      <p className="text-xs text-slate-500">Terakhir diubah 3 bulan lalu</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-neon-blue" />
                    <div className="text-left">
                      <p className="font-bold text-foreground">Autentikasi Dua Faktor</p>
                      <p className="text-xs text-emerald-400">Aktif (SMS & App)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <ShieldOff className="w-5 h-5 text-slate-400 group-hover:text-neon-blue" />
                    <div className="text-left">
                      <p className="font-bold text-foreground">Sembunyikan Saldo</p>
                      <p className="text-xs text-slate-500">Sembunyikan saldo di dashboard</p>
                    </div>
                  </div>
                  <div className="w-10 h-5 bg-slate-700 rounded-full relative">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setShowSecurityModal(false)}
                className="w-full mt-8 py-4 bg-white/5 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-all"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
