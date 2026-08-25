export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  receipt?: string; // Base64 string for the receipt image
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export interface SPJReport {
  id: string;
  tanggal: string;
  namaPegawai: string;
  area: string;
  kegiatan: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  kwitansi?: string; // Base64 string for the receipt/nota image
  tandaTangan?: string; // Base64 string (PNG) for the digital signature
  createdAt: string;
}
