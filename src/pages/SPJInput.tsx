import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MapPin,
  ClipboardList,
  Tag,
  FileText,
  DollarSign,
  Upload,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSPJ } from '../context/SPJContext';
import { useFinance } from '../context/FinanceContext';
import { SPJ_CATEGORIES } from '../constants';
import SignaturePad, { SignaturePadHandle } from '../components/SignaturePad';

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

const SPJInput = () => {
  const { reports, addReport, updateReport } = useSPJ();
  const { user } = useFinance();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [form, setForm] = useState({ ...emptyForm, namaPegawai: user?.name || '' });
  const [signature, setSignature] = useState<string | null>(null);
  const sigRef = useRef<SignaturePadHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the target report into the form when arriving via an edit link (?id=...).
  useEffect(() => {
    if (editId) {
      const r = reports.find(rep => rep.id === editId);
      if (r) {
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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (editId) {
      updateReport(editId, payload);
      toast.success('Laporan SPJ berhasil diperbarui');
      navigate('/spj');
    } else {
      addReport(payload);
      toast.success('Laporan SPJ berhasil disimpan');
      resetForm();
    }
  };

  const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-neon-blue/30 focus:border-neon-blue/50 transition-all";
  const labelClass = "text-xs font-bold tracking-wide text-neon-blue uppercase mb-2 block";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{editId ? 'Edit Laporan SPD' : 'Input Laporan SPD'}</h1>
        <p className="text-slate-400 mt-1">Catat pengeluaran perjalanan dinas luar per kegiatan.</p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl glass p-6 sm:p-8 rounded-3xl space-y-5 border border-neon-blue/20"
      >
        {editId && (
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
          {editId ? 'Update SPJ' : 'Simpan SPJ'}
        </button>
        {editId && (
          <button
            type="button"
            onClick={() => navigate('/spj')}
            className="w-full text-center text-xs text-slate-400 hover:text-foreground transition-colors -mt-2"
          >
            Batalkan edit
          </button>
        )}
      </motion.form>
    </div>
  );
};

export default SPJInput;
