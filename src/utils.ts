import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { SPJReport } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  // Filter out large binary data like receipts for CSV
  const cleanData = data.map(({ receipt, ...rest }) => rest);
  const headers = Object.keys(cleanData[0]);
  
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of cleanData) {
    const values = headers.map(header => {
      const val = (row as any)[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Columns used consistently for SPJ CSV/Excel export & import.
const SPJ_COLUMNS = [
  'id', 'tanggal', 'namaPegawai', 'area', 'kegiatan', 'kategori', 'keterangan', 'nominal', 'createdAt',
] as const;

export function exportSPJToExcel(reports: SPJReport[], filename: string) {
  const rows = reports.map(r => ({
    ID: r.id,
    Tanggal: r.tanggal,
    'Nama Pegawai': r.namaPegawai,
    'Area/Lokasi': r.area,
    'Kegiatan/Uraian': r.kegiatan,
    Kategori: r.kategori,
    'Keterangan Rinci': r.keterangan,
    'Nominal (IDR)': r.nominal,
    'Dibuat Pada': r.createdAt,
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan SPJ');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportSPJToCSV(reports: SPJReport[], filename: string) {
  const rows = reports.map(r => SPJ_COLUMNS.map(col => (r as any)[col] ?? ''));
  const csvRows = [SPJ_COLUMNS.join(',')];
  rows.forEach(row => {
    const escaped = row.map(val => `"${String(val).replace(/"/g, '""')}"`);
    csvRows.push(escaped.join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportSPJToJSON(reports: SPJReport[], filename: string) {
  // JSON keeps everything, including kwitansi/tandaTangan images, for full backup/restore.
  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${filename}.json`);
}

// Parses an uploaded .json, .csv, or .xlsx/.xls file into an array of SPJReport-like objects.
// Note: CSV/Excel imports won't include kwitansi/tandaTangan images (those only round-trip via JSON).
export async function parseSPJFile(file: File): Promise<Partial<SPJReport>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  if (ext === 'csv') {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj: any = {};
      headers.forEach((h, i) => { obj[h.trim()] = values[i]; });
      return {
        id: obj.id,
        tanggal: obj.tanggal,
        namaPegawai: obj.namaPegawai,
        area: obj.area,
        kegiatan: obj.kegiatan,
        kategori: obj.kategori,
        keterangan: obj.keterangan,
        nominal: Number(obj.nominal) || 0,
        createdAt: obj.createdAt,
      };
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    return rows.map(row => ({
      id: row.ID || row.id,
      tanggal: row.Tanggal || row.tanggal,
      namaPegawai: row['Nama Pegawai'] || row.namaPegawai,
      area: row['Area/Lokasi'] || row.area,
      kegiatan: row['Kegiatan/Uraian'] || row.kegiatan,
      kategori: row.Kategori || row.kategori,
      keterangan: row['Keterangan Rinci'] || row.keterangan,
      nominal: Number(row['Nominal (IDR)'] ?? row.nominal) || 0,
      createdAt: row['Dibuat Pada'] || row.createdAt,
    }));
  }

  throw new Error('Format file tidak didukung. Gunakan .json, .csv, atau .xlsx');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

// Opens a print-friendly window with formatted SPJ report(s) and triggers the browser print dialog.
export function printSPJReports(reports: SPJReport[], title: string) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;

  const rowsHtml = reports.map((r, i) => `
    <div class="spj-sheet">
      <h2>Laporan Pertanggungjawaban Perjalanan Dinas</h2>
      <table class="meta">
        <tr><td>Nama Pegawai</td><td>: ${escapeHtml(r.namaPegawai)}</td></tr>
        <tr><td>Tanggal</td><td>: ${escapeHtml(r.tanggal)}</td></tr>
        <tr><td>Area / Lokasi Tujuan</td><td>: ${escapeHtml(r.area)}</td></tr>
        <tr><td>Kegiatan / Uraian Acara</td><td>: ${escapeHtml(r.kegiatan)}</td></tr>
        <tr><td>Kategori Pengeluaran</td><td>: ${escapeHtml(r.kategori)}</td></tr>
        <tr><td>Keterangan Rinci</td><td>: ${escapeHtml(r.keterangan)}</td></tr>
        <tr><td>Nominal</td><td>: ${formatCurrency(r.nominal)}</td></tr>
      </table>
      ${r.kwitansi ? `<div class="block"><p class="label">Kwitansi / Foto Nota</p><img src="${r.kwitansi}" class="receipt" /></div>` : ''}
      <div class="block signature-block">
        <p class="label">Tanda Tangan</p>
        ${r.tandaTangan ? `<img src="${r.tandaTangan}" class="signature" />` : '<div class="sig-line"></div>'}
        <p class="sig-name">${escapeHtml(r.namaPegawai || '')}</p>
      </div>
      ${i < reports.length - 1 ? '<div class="page-break"></div>' : ''}
    </div>
  `).join('');

  win.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; }
          h2 { text-align: center; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; }
          table.meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          table.meta td { padding: 4px 8px; font-size: 13px; vertical-align: top; }
          table.meta td:first-child { width: 200px; font-weight: bold; }
          .block { margin-bottom: 16px; }
          .label { font-weight: bold; font-size: 13px; margin-bottom: 6px; }
          .receipt { max-width: 260px; max-height: 260px; border: 1px solid #ccc; }
          .signature-block { margin-top: 32px; }
          .signature { max-width: 220px; max-height: 100px; }
          .sig-line { width: 220px; border-bottom: 1px solid #333; height: 80px; }
          .sig-name { margin-top: 4px; font-size: 13px; }
          .spj-sheet { padding-bottom: 24px; border-bottom: 1px dashed #ccc; margin-bottom: 24px; }
          .page-break { page-break-after: always; }
          @media print {
            .spj-sheet { border-bottom: none; }
          }
        </style>
      </head>
      <body>${rowsHtml}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
