import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { SPJReport } from '../types';
import { safeLocalStorageSet } from '../utils';

interface SPJContextType {
  reports: SPJReport[];
  addReport: (r: Omit<SPJReport, 'id' | 'createdAt'>) => void;
  deleteReport: (id: string) => void;
  updateReport: (id: string, data: Partial<SPJReport>) => void;
  importReports: (newReports: SPJReport[], mode: 'merge' | 'replace') => number;
  totalNominal: number;
}

const SPJContext = createContext<SPJContextType | undefined>(undefined);

const STORAGE_KEY = 'rembees_spj_reports';

export const SPJProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<SPJReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skip the write on mount (we just loaded this exact data from storage).
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const ok = safeLocalStorageSet(STORAGE_KEY, JSON.stringify(reports));
    if (!ok) {
      toast.error(
        'Gagal menyimpan laporan — penyimpanan browser penuh. Perubahan terakhir TIDAK tersimpan dan akan hilang jika reload. Hapus beberapa laporan lama (terutama yang ada foto kwitansi) lalu coba lagi.',
        { duration: 8000 }
      );
    }
  }, [reports]);

  const addReport = (r: Omit<SPJReport, 'id' | 'createdAt'>) => {
    const newReport: SPJReport = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const updateReport = (id: string, data: Partial<SPJReport>) => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, ...data } : r)));
  };

  // Imports reports from an uploaded file (already parsed). Returns count imported.
  const importReports = (newReports: SPJReport[], mode: 'merge' | 'replace') => {
    const sanitized = newReports.map(r => ({
      id: r.id || crypto.randomUUID(),
      tanggal: r.tanggal || new Date().toISOString().split('T')[0],
      namaPegawai: r.namaPegawai || '',
      area: r.area || '',
      kegiatan: r.kegiatan || '',
      kategori: r.kategori || 'Lain-lain',
      keterangan: r.keterangan || '',
      nominal: Number(r.nominal) || 0,
      kwitansi: r.kwitansi,
      tandaTangan: r.tandaTangan,
      createdAt: r.createdAt || new Date().toISOString(),
    }));

    if (mode === 'replace') {
      setReports(sanitized);
    } else {
      setReports(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const merged = [...prev];
        sanitized.forEach(r => {
          if (existingIds.has(r.id)) {
            r.id = crypto.randomUUID();
          }
          merged.unshift(r);
        });
        return merged;
      });
    }
    return sanitized.length;
  };

  const totalNominal = reports.reduce((acc, r) => acc + (r.nominal || 0), 0);

  return (
    <SPJContext.Provider value={{ reports, addReport, deleteReport, updateReport, importReports, totalNominal }}>
      {children}
    </SPJContext.Provider>
  );
};

export const useSPJ = () => {
  const context = useContext(SPJContext);
  if (!context) throw new Error('useSPJ must be used within SPJProvider');
  return context;
};
