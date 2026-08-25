import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Download,
  Printer,
  Trash2,
  X,
  Image as ImageIcon,
  FileUp,
  ArrowUpDown,
  Pencil,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSPJ } from '../context/SPJContext';
import { SPJ_CATEGORY_COLORS } from '../constants';
import {
  formatCurrency,
  exportSPJToExcel,
  exportSPJToCSV,
  exportSPJToJSON,
  parseSPJFile,
  printSPJReports,
  printSPJAsTable,
} from '../utils';
import { SPJReport } from '../types';

const SPJList = () => {
  const { reports, deleteReport, importReports } = useSPJ();
  const navigate = useNavigate();
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [sortKey, setSortKey] = useState<'tanggal' | 'kegiatan' | 'kategori' | 'nominal'>('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [monthFilter, setMonthFilter] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const monthSet = new Set<string>();
  reports.forEach(r => { if (r.tanggal) monthSet.add(r.tanggal.slice(0, 7)); });
  const availableMonths: string[] = Array.from(monthSet).sort().reverse();

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const filteredReports = monthFilter === 'all' ? reports : reports.filter(r => r.tanggal?.slice(0, 7) === monthFilter);

  const sortedReports = [...filteredReports].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'nominal') cmp = a.nominal - b.nominal;
    else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / PAGE_SIZE));
  const paginatedReports = sortedReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const SortHeader = ({ label, k }: { label: string; k: typeof sortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 text-[11px] uppercase tracking-wide font-bold hover:text-neon-blue transition-colors ${sortKey === k ? 'text-neon-blue' : 'text-slate-500'}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan SPD</h1>
          <p className="text-slate-400 mt-1">Daftar pertanggungjawaban pengeluaran perjalanan dinas luar.</p>
        </div>
        <div className="flex gap-3 relative flex-wrap">
          <select
            value={monthFilter}
            onChange={e => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            title="Filter bulan"
            className="glass rounded-xl text-xs px-3 py-2.5 text-foreground bg-transparent focus:outline-none"
          >
            <option value="all" className="bg-[#17171a]">Semua Bulan</option>
            {availableMonths.map(ym => (
              <option key={ym} value={ym} className="bg-[#17171a]">{monthLabel(ym)}</option>
            ))}
          </select>

          <button
            onClick={() => navigate('/spj/input')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl text-sm font-bold neon-glow-blue hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Laporan
          </button>

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

          <div className="relative">
            <button
              onClick={() => setPrintOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-foreground"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <AnimatePresence>
              {printOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-2 w-64 glass rounded-xl p-2 z-20"
                >
                  <button
                    onClick={() => {
                      if (!sortedReports.length) { toast.error('Tidak ada data untuk periode ini'); return; }
                      printSPJAsTable(sortedReports, `Laporan Harian SPD${monthFilter !== 'all' ? ' - ' + monthLabel(monthFilter) : ''}`, true);
                      setPrintOpen(false);
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-white/10 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-neon-blue" />
                    <div>
                      <p>Laporan Harian</p>
                      <p className="text-[11px] text-slate-500">Dikelompokkan per tanggal + subtotal</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (!sortedReports.length) { toast.error('Tidak ada data untuk periode ini'); return; }
                      printSPJAsTable(sortedReports, `Laporan Bulanan SPD${monthFilter !== 'all' ? ' - ' + monthLabel(monthFilter) : ' - Semua Periode'}`, false);
                      setPrintOpen(false);
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-white/10 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-neon-blue" />
                    <div>
                      <p>Laporan Bulanan</p>
                      <p className="text-[11px] text-slate-500">Rekap tabel + total keseluruhan</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="glass p-5 rounded-2xl flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-slate-400">
          {monthFilter !== 'all' && <span className="text-neon-blue font-semibold mr-2">{monthLabel(monthFilter)}</span>}
          Total laporan: <span className="text-foreground font-bold">{sortedReports.length}</span>
        </p>
        <p className="text-sm text-slate-400">Total nominal: <span className="text-neon-blue font-bold">{formatCurrency(sortedReports.reduce((a, r) => a + r.nominal, 0))}</span></p>
      </div>

      {reports.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center text-slate-500 text-sm">
          Belum ada laporan SPJ. Klik "Tambah Laporan" untuk menambahkan.
        </div>
      ) : sortedReports.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center text-slate-500 text-sm">
          Tidak ada laporan untuk bulan ini.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Desktop: table view, full width */}
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
                {paginatedReports.map(r => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{r.tanggal}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[160px] truncate">{r.area}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${SPJ_CATEGORY_COLORS[r.kategori] || 'bg-neon-blue/10 text-neon-blue'}`}>{r.kategori}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[280px]">
                      <p className="text-foreground font-medium truncate">{r.kegiatan}</p>
                      {r.keterangan && <p className="text-xs text-slate-500 truncate">{r.keterangan}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[160px] truncate">{r.namaPegawai || '-'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-rose-400 whitespace-nowrap">{formatCurrency(r.nominal)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {r.kwitansi && (
                          <button onClick={() => setPreviewReceipt(r.kwitansi!)} title="Lihat Kwitansi" className="p-2 rounded-lg text-slate-400 hover:text-neon-blue hover:bg-white/5 transition-colors">
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => navigate(`/spj/input?id=${r.id}`)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors">
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
            {paginatedReports.map(r => (
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
                  <button onClick={() => navigate(`/spj/input?id=${r.id}`)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-slate-500">
                Halaman {currentPage} dari {totalPages} &middot; {sortedReports.length} laporan
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg glass text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<number[]>((acc, p) => {
                    if (acc.length && p - acc[acc.length - 1] > 1) acc.push(-1); // gap marker
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => p === -1 ? (
                    <span key={`gap-${i}`} className="text-slate-600 text-xs px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === currentPage ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white' : 'glass text-slate-400 hover:text-foreground hover:bg-white/10'}`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg glass text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

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

export default SPJList;
