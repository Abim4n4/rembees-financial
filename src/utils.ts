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

// Resizes and re-encodes an uploaded image file into a compact base64 JPEG.
// Photos straight from a phone camera can be several MB each; storing them raw in
// localStorage (which has only ~5-10MB total quota) quickly fills it up and causes
// later writes to silently fail — which looks like "data disappearing on refresh".
// Downscaling to maxDimension + JPEG quality keeps each receipt well under ~200KB.
export function compressImage(file: File, maxDimension = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas tidak didukung')); return; }
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Wraps localStorage.setItem with error handling: quota-exceeded and other storage
// failures are common once photos/signatures accumulate, and failing silently makes
// data look like it "disappeared" on the next reload. Returns true on success.
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`Gagal menyimpan ke localStorage (key: ${key}):`, err);
    return false;
  }
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

// Prints reports as a compact data table (matching the on-screen columns), optionally
// grouped by date with per-day subtotals — used for "Laporan Harian" and "Laporan Bulanan".
export function printSPJAsTable(reports: SPJReport[], title: string, groupByDate: boolean) {
  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) return;

  const total = reports.reduce((acc, r) => acc + r.nominal, 0);

  const tableRowsHtml = (list: SPJReport[]) => list.map(r => `
    <tr>
      <td>${escapeHtml(r.tanggal)}</td>
      <td>${escapeHtml(r.area)}</td>
      <td>${escapeHtml(r.kategori)}</td>
      <td>
        <div class="title">${escapeHtml(r.kegiatan)}</div>
        ${r.keterangan ? `<div class="sub">${escapeHtml(r.keterangan)}</div>` : ''}
      </td>
      <td>${escapeHtml(r.namaPegawai || '-')}</td>
      <td class="num">${formatCurrency(r.nominal)}</td>
    </tr>
  `).join('');

  let bodyHtml = '';

  if (groupByDate) {
    const groups: Record<string, SPJReport[]> = {};
    reports.forEach(r => {
      if (!groups[r.tanggal]) groups[r.tanggal] = [];
      groups[r.tanggal].push(r);
    });
    const dates = Object.keys(groups).sort();
    bodyHtml = dates.map(date => {
      const items = groups[date];
      const subtotal = items.reduce((acc, r) => acc + r.nominal, 0);
      return `
        <h3 class="date-heading">${escapeHtml(date)}</h3>
        <table>
          <thead>
            <tr><th>Tanggal</th><th>Lokasi</th><th>Kategori</th><th>Keterangan / Judul</th><th>Pengguna</th><th class="num">Nominal</th></tr>
          </thead>
          <tbody>${tableRowsHtml(items)}</tbody>
          <tfoot>
            <tr><td colspan="5" class="num">Subtotal ${escapeHtml(date)}</td><td class="num">${formatCurrency(subtotal)}</td></tr>
          </tfoot>
        </table>
      `;
    }).join('');
  } else {
    bodyHtml = `
      <table>
        <thead>
          <tr><th>Tanggal</th><th>Lokasi</th><th>Kategori</th><th>Keterangan / Judul</th><th>Pengguna</th><th class="num">Nominal</th></tr>
        </thead>
        <tbody>${tableRowsHtml(reports)}</tbody>
      </table>
    `;
  }

  win.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 4px; text-transform: uppercase; }
          p.meta { text-align: center; font-size: 12px; color: #555; margin-bottom: 20px; }
          h3.date-heading { font-size: 13px; margin: 18px 0 6px; background: #f0f0f0; padding: 6px 10px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; text-align: left; vertical-align: top; }
          th { background: #eee; font-weight: bold; }
          td .title { font-weight: bold; }
          td .sub { color: #666; font-size: 10px; }
          td.num, th.num { text-align: right; white-space: nowrap; }
          tfoot td { font-weight: bold; background: #fafafa; }
          .grand-total { text-align: right; font-size: 13px; font-weight: bold; margin-top: 16px; padding-right: 4px; }
          @media print {
            h3.date-heading { break-inside: avoid; }
            table { break-inside: auto; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} &middot; ${reports.length} laporan</p>
        ${bodyHtml}
        <p class="grand-total">Total Keseluruhan: ${formatCurrency(total)}</p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
