import React from 'react';

interface CurrencyInputProps {
  value: string; // raw numeric string, e.g. "250000"
  onChange: (rawValue: string) => void;
  className?: string;
  placeholder?: string;
}

// Formats a raw digit string with Indonesian thousand separators (dots), e.g. "250000" -> "250.000".
function formatWithDots(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Text-based currency input: avoids the native <input type="number"> pitfall where
// typing "250.000" (Indonesian thousands format) gets parsed as the decimal 250.0 = 250.
// Only digits are ever stored; dots are purely cosmetic and re-derived on every keystroke.
const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, className, placeholder }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    onChange(digitsOnly);
  };

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatWithDots(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} pl-10`}
      />
    </div>
  );
};

export default CurrencyInput;
