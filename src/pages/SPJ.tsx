import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  ClipboardList,
  Tag,
  FileText,
  DollarSign,
  Upload,
  Download,
  Printer,
  Trash2,
  X,
  Image as ImageIcon,
  FileUp,
  ArrowUpDown,
  Pencil,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSPJ } from '../context/SPJContext';
import { useFinance } from '../context/FinanceContext';
import { SPJ_CATEGORIES, SPJ_CATEGORY_COLORS } from '../constants';
import {
  formatCurrency,
  exportSPJToExcel,
  exportSPJToCSV,
  exportSPJToJSON,
  parseSPJFile,
  printSPJReports,
} from '../utils';
import SignaturePad, { SignaturePadHandle } from '../components/SignaturePad';
import { SPJReport } from '../types';

const emptyForm = {
  tanggal: new Date().toISOString().split('T')[0],
  namaPegawai: '',
  area: '',
  kegiatan: '',
  kategori: SPJ_CATEGORIES[0],
  keterangan: '',
  nominal: '',
  kwitansi: '' as string | undefined,
};

const SPJ = () => {
  const { reports, addReport, deleteReport, importReports, updateReport } = useSPJ();
  const { user } = useFinance();
  const [form, setForm] = useState({ ...emptyForm, namaPegawai: user?.name || '' });
  const [signature, setSignature] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [editingId, setEditingId] = useState<string | null>(null);
  const sigRef = useRef<SignaturePadHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [sortKey, setSortKey] = useState<'tanggal' | 'kegiatan' | 'kategori' | 'nominal'>('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'nominal') cmp = a.nominal - b.nominal;
    else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortHeader = ({ label, k }: { label: string; k: typeof sortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 text-[11px] uppercase tracking-wide font-bold hover:text-neon-blue transition-colors ${sortKey === k ? 'text-neon-blue' : 'text-slate-500'}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, kwitansi: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm, namaPegawai: user?.name || '', tanggal: new Date().toISOString().split('T')[0] });
    sigRef.current?.clear();
    setSignature(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (r: SPJReport) => {
    setEditingId(r.id);
    setForm({
      tanggal: r.tanggal,
      namaPegawai: r.namaPegawai,
      area: r.area,
      kegiatan: r.kegiatan,
      kategori: r.kategori,
      keterangan: r.keterangan,
      nominal: String(r.nominal),
      kwitansi: r.kwitansi,
    });
    setSignature(r.tandaTangan || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.area || !form.kegiatan || !form.nominal) {
      toast.error('Mohon lengkapi Area, Kegiatan, dan Nominal.');
      return;
    }
    if (parseFloat(form.nominal) <= 0) {
      toast.error('Nominal harus lebih besar dari 0. Pastikan angka penuh, misal 150000 bukan 150.');
      return;
    }
    const payload = {
      tanggal: form.tanggal,
      namaPegawai: form.namaPegawai,
      area: form.area,
      kegiatan: form.kegiatan,
      kategori: form.kategori,
      keterangan: form.keterangan,
      nominal: parseFloat(form.nominal) || 0,
      kwitansi: form.kwitansi,
      tandaTangan: signature || undefined,
    };
    if (editingId) {
      updateReport(editingId, payload);
      toast.success('Laporan SPJ berhasil diperbarui');
    } else {
      addReport(payload);
      toast.success('Laporan SPJ berhasil disimpan');
    }
    resetForm();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseSPJFile(file);
      const count = importReports(parsed as SPJReport[], importMode);
      toast.success(`${count} laporan berhasil diimpor`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengimpor file');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-neon-blue/30 focus:border-neon-blue/50 transition-all";
  const labelClass = "text-xs font-bold tracking-wide text-neon-blue uppercase mb-2 block";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan SPD</h1>
          <p className="text-slate-400 mt-1">Pertanggungjawaban pengeluaran perjalanan dinas luar.</p>
        </div>
        <div className="flex gap-3 relative">
          <select
            value={importMode}
            onChange={e => setImportMode(e.target.value as 'merge' | 'replace')}
            title="Mode import"
            className="glass rounded-xl text-xs px-2 text-foreground bg-transparent focus:outline-none"
          >
            <option value="merge" className="bg-[#17171a]">Gabung data</option>
            <option value="replace" className="bg-[#17171a]">Ganti semua</option>
          </select>
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-foreground"
          >
            <FileUp className="w-4 h-4" />
            Import
          </button>
          <input ref={importInputRef} type="file" accept=".json,.csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />

          <div className="relative">
            <button
              onClick={() => setExportOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-foreground"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-2 w-48 glass rounded-xl p-2 z-20"
                >
                  {[
                    { label: 'Excel (.xlsx)', fn: () => exportSPJToExcel(reports, 'laporan_spj') },
                    { label: 'CSV (.csv)', fn: () => exportSPJToCSV(reports, 'laporan_spj') },
                    { label: 'JSON (backup)', fn: () => exportSPJToJSON(reports, 'laporan_spj') },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => { opt.fn(); setExportOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-white/10 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => reports.length ? printSPJReports(reports, 'Laporan SPD - Semua') : toast.error('Belum ada laporan')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl text-sm font-bold neon-glow-blue hover:opacity-90 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Semua
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass p-6 sm:p-8 rounded-3xl space-y-5 border border-neon-blue/20 h-fit"
        >
          {editingId && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-2 rounded-xl">
              <Pencil className="w-3.5 h-3.5" />
              Mengedit laporan yang sudah ada
            </div>
          )}
          <div>
            <label className={labelClass}><MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Area / Lokasi Tujuan</label>
            <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Contoh: Bandung / Kantor Cabang" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}><ClipboardList className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Kegiatan / Uraian Acara</label>
            <input type="text" value={form.kegiatan} onChange={e => setForm({ ...form, kegiatan: e.target.value })} placeholder="Contoh: Monitoring & Evaluasi Proyek" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}><Tag className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Kategori Pengeluaran</label>
            <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} className={inputClass}>
              {SPJ_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}><FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Keterangan Rinci</label>
            <input type="text" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Contoh: Taksi online dari stasiun ke hotel" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}><DollarSign className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Nominal (IDR)</label>
            <input type="number" min="0" value={form.nominal} onChange={e => setForm({ ...form, nominal: e.target.value })} placeholder="150000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}><Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Upload Kwitansi / Foto Nota</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className={`${inputClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-foreground`} />
            {form.kwitansi && (
              <img src={form.kwitansi} alt="Preview kwitansi" className="mt-3 h-24 rounded-lg border border-white/10 object-cover" />
            )}
          </div>

          <div>
            <label className={labelClass}>Tanda Tangan Digital</label>
            <SignaturePad ref={sigRef} onChange={setSignature} />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold py-3.5 rounded-2xl neon-glow-blue hover:opacity-90 transition-all"
          >
            {editingId ? 'Update SPJ' : 'Simpan SPJ'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full text-center text-xs text-slate-400 hover:text-foreground transition-colors -mt-2"
            >
              Batalkan edit
            </button>
          )}
        </motion.form>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 space-y-4"
        >
          <div className="glass p-5 rounded-2xl flex items-center justify-between">
            <p className="text-sm text-slate-400">Total laporan: <span className="text-foreground font-bold">{reports.length}</span></p>
            <p className="text-sm text-slate-400">Total nominal: <span className="text-neon-blue font-bold">{formatCurrency(reports.reduce((a, r) => a + r.nominal, 0))}</span></p>
          </div>

          {reports.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center text-slate-500 text-sm">
              Belum ada laporan SPJ. Isi form di samping untuk menambahkan.
            </div>
          ) : (
            <>
              {/* Desktop: table view */}
              <div className="hidden lg:block glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-5 py-3"><SortHeader label="Tanggal" k="tanggal" /></th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wide font-bold text-slate-500">Lokasi</th>
                      <th className="px-5 py-3"><SortHeader label="Kategori" k="kategori" /></th>
                      <th className="px-5 py-3"><SortHeader label="Keterangan / Judul" k="kegiatan" /></th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wide font-bold text-slate-500">Pengguna</th>
                      <th className="px-5 py-3 text-right"><div className="flex justify-end"><SortHeader label="Nominal" k="nominal" /></div></th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wide font-bold text-slate-500 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReports.map(r => (
                      <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{r.tanggal}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[140px] truncate">{r.area}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${SPJ_CATEGORY_COLORS[r.kategori] || 'bg-neon-blue/10 text-neon-blue'}`}>{r.kategori}</span>
                        </td>
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <p className="text-foreground font-medium truncate">{r.kegiatan}</p>
                          {r.keterangan && <p className="text-xs text-slate-500 truncate">{r.keterangan}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[140px] truncate">{r.namaPegawai || '-'}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-rose-400 whitespace-nowrap">{formatCurrency(r.nominal)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {r.kwitansi && (
                              <button onClick={() => setPreviewReceipt(r.kwitansi!)} title="Lihat Kwitansi" className="p-2 rounded-lg text-slate-400 hover:text-neon-blue hover:bg-white/5 transition-colors">
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => startEdit(r)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => printSPJReports([r], `SPJ - ${r.kegiatan}`)} title="Cetak/Kwitansi" className="p-2 rounded-lg text-slate-400 hover:text-neon-blue hover:bg-white/5 transition-colors">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteReport(r.id)} title="Hapus" className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: card view */}
              <div className="lg:hidden space-y-4">
                {sortedReports.map(r => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass p-5 rounded-2xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground truncate">{r.kegiatan}</p>
                          <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${SPJ_CATEGORY_COLORS[r.kategori] || 'bg-neon-blue/10 text-neon-blue'}`}>{r.kategori}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                          <MapPin className="w-3 h-3" />{r.area} &middot; {r.tanggal} &middot; <User className="w-3 h-3" />{r.namaPegawai || '-'}
                        </p>
                        {r.keterangan && <p className="text-xs text-slate-400 mt-1">{r.keterangan}</p>}
                      </div>
                      <p className="text-sm font-bold text-rose-400 whitespace-nowrap">{formatCurrency(r.nominal)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                      {r.kwitansi && (
                        <button onClick={() => setPreviewReceipt(r.kwitansi!)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-neon-blue transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                          <ImageIcon className="w-3.5 h-3.5" /> Lihat Kwitansi
                        </button>
                      )}
                      <button onClick={() => startEdit(r)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => printSPJReports([r], `SPJ - ${r.kegiatan}`)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-neon-blue transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                        <Printer className="w-3.5 h-3.5" /> Cetak
                      </button>
                      <button onClick={() => deleteReport(r.id)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Receipt preview modal */}
      <AnimatePresence>
        {previewReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewReceipt(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-lg w-full"
            >
              <button onClick={() => setPreviewReceipt(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <img src={previewReceipt} alt="Kwitansi" className="w-full rounded-2xl border border-white/10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SPJ;
