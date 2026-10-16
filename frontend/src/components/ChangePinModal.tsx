import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, Check } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  currentPin: string;
  onClose: () => void;
  onUpdatePin: (newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  currentPin,
  onClose,
  onUpdatePin,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPin !== currentPin) {
      setError('PIN lama yang Anda masukkan salah.');
      return;
    }

    if (newPin.length < 4) {
      setError('PIN baru minimal harus 4 digit angka.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Konfirmasi PIN baru tidak sesuai.');
      return;
    }

    onUpdatePin(newPin);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D31027]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Ganti PIN Admin
              </h3>
              <p className="text-xs text-neutral-500">
                Ubah kode keamanan akses halaman gaji
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              PIN Lama
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={oldPin}
              onChange={(e) => {
                setError('');
                setOldPin(e.target.value);
              }}
              placeholder="••••"
              className="w-full text-center text-lg tracking-[0.3em] font-mono px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              PIN Baru (4-6 Angka)
            </label>
            <input
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => {
                setError('');
                setNewPin(e.target.value);
              }}
              placeholder="••••"
              className="w-full text-center text-lg tracking-[0.3em] font-mono px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Konfirmasi PIN Baru
            </label>
            <input
              type="password"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => {
                setError('');
                setConfirmPin(e.target.value);
              }}
              placeholder="••••"
              className="w-full text-center text-lg tracking-[0.3em] font-mono px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan PIN Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
