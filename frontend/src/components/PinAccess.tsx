import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

interface PinAccessProps {
  onUnlock: (pin: string) => void;
}

export const PinAccess: React.FC<PinAccessProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('Silakan masukkan PIN admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin-pin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_code: pin }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'PIN admin salah. Silakan coba lagi.');
      setError('');
      onUnlock(pin);
    } catch (err) {
      setError(err instanceof Error && err.message.includes('Failed to fetch')
        ? 'Server tidak dapat dihubungi. Periksa koneksi backend.'
        : err instanceof Error ? err.message : 'Verifikasi PIN gagal.');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setError('');
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  return (
    <div className="py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs text-center space-y-6">
        {/* Lock Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D31027] shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-[#171717]">
            Akses Generate Gaji
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Masukkan PIN admin untuk melihat rekap absensi dan gaji.
          </p>
        </div>

        {/* PIN Input & Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.5em] py-3 px-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D31027] font-mono text-neutral-900 placeholder:text-neutral-300"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeyPress(String(n))}
                className="py-2.5 bg-neutral-50 hover:bg-neutral-100/80 active:bg-neutral-200 text-neutral-800 font-semibold rounded-lg text-base transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 font-medium rounded-lg text-xs transition-colors"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-2.5 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-800 font-semibold rounded-lg text-base transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 font-medium rounded-lg text-xs transition-colors"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || pin.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              pin.length > 0
                ? 'bg-[#D31027] hover:bg-[#B80D21] text-white shadow-xs cursor-pointer'
                : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Memverifikasi...' : 'Buka Rekap Gaji'}</span>
          </button>
        </form>

        {/* Access Notice */}
        <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl text-[11px] text-neutral-500 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-neutral-700">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
            <span>Keamanan Akses Admin</span>
          </div>
          <p className="text-[10px] text-neutral-500 leading-normal">
            Akses ini hanya untuk admin yang berwenang. PIN tidak ditampilkan pada halaman ini.
          </p>
        </div>
      </div>
    </div>
  );
};
