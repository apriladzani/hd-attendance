import React, { useState } from 'react';
import { Employee, OutletItem, PositionLevel } from '../types';
import { formatRupiah } from '../utils/formatters';
import { 
  Building2, 
  Users, 
  BadgePercent, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  Briefcase
} from 'lucide-react';

interface MasterDataModalProps {
  isOpen: boolean;
  activeInitialTab?: 'outlets' | 'employees' | 'positions';
  outlets: OutletItem[];
  employees: Employee[];
  positions: PositionLevel[];
  onClose: () => void;
  onUpdateOutlets: (outlets: OutletItem[]) => Promise<void>;
  onUpdateEmployees: (employees: Employee[]) => Promise<void>;
  onUpdatePositions: (positions: PositionLevel[]) => Promise<void>;
  onToast: (msg: string) => void;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  activeInitialTab = 'outlets',
  outlets,
  employees,
  positions,
  onClose,
  onUpdateOutlets,
  onUpdateEmployees,
  onUpdatePositions,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'outlets' | 'employees' | 'positions'>(activeInitialTab);

  // --- TAB 1: OUTLETS CRUD ---
  const [newOutletName, setNewOutletName] = useState('');
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [editingOutletName, setEditingOutletName] = useState('');
  const [outletError, setOutletError] = useState('');

  const handleAddOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newOutletName.trim();
    if (!cleanName) {
      setOutletError('Nama outlet tidak boleh kosong.');
      return;
    }
    if (outlets.some(o => o.name.toLowerCase() === cleanName.toLowerCase())) {
      setOutletError('Nama outlet sudah terdaftar.');
      return;
    }

    const newOutlet: OutletItem = {
      id: cleanName,
      name: cleanName
    };
    try {
      await onUpdateOutlets([...outlets, newOutlet]);
    } catch (error) {
      setOutletError(error instanceof Error ? error.message : 'Outlet gagal disimpan.');
      return;
    }
    setNewOutletName('');
    setOutletError('');
    onToast(`Outlet "${cleanName}" berhasil ditambahkan.`);
  };

  const handleSaveEditOutlet = async (id: string) => {
    const cleanName = editingOutletName.trim();
    if (!cleanName) return;

    try {
      await onUpdateOutlets(outlets.map(o => o.id === id ? { ...o, name: cleanName } : o));
    } catch (error) {
      setOutletError(error instanceof Error ? error.message : 'Nama outlet gagal disimpan.');
      return;
    }
    setEditingOutletId(null);
    onToast(`Nama outlet diperbarui menjadi "${cleanName}".`);
  };

  const handleDeleteOutlet = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus outlet "${name}"?`)) {
      try {
        await onUpdateOutlets(outlets.filter(o => o.id !== id));
      } catch (error) {
        setOutletError(error instanceof Error ? error.message : 'Outlet gagal dihapus.');
        return;
      }
      onToast(`Outlet "${name}" berhasil dihapus.`);
    }
  };

  // --- TAB 2: EMPLOYEES CRUD ---
  const [isAddingEmp, setIsAddingEmp] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  
  // Employee form fields: NIP, Nama, Posisi/Level
  const [empNip, setEmpNip] = useState('');
  const [empName, setEmpName] = useState('');
  const [empPositionId, setEmpPositionId] = useState(positions[0]?.id || '');
  const [empStatus, setEmpStatus] = useState<Employee['status']>('active');
  const [empError, setEmpError] = useState('');
  const [isSavingEmp, setIsSavingEmp] = useState(false);

  const handleStartAddEmployee = () => {
    // Generate next NIP suggestion (HD-011, etc)
    const maxNipNum = employees.reduce((max, e) => {
      const match = e.nip.match(/HD-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextNip = `HD-${String(maxNipNum + 1).padStart(3, '0')}`;

    setEmpNip(nextNip);
    setEmpName('');
    setEmpPositionId(positions[0]?.id || '');
    setEmpStatus('active');
    setEmpError('');
    setIsAddingEmp(true);
    setEditingEmpId(null);
  };

  const handleStartEditEmployee = (emp: Employee) => {
    setEmpNip(emp.nip);
    setEmpName(emp.name);
    setEmpPositionId(emp.positionId);
    setEmpStatus(emp.status);
    setEmpError('');
    setEditingEmpId(emp.id);
    setIsAddingEmp(false);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingEmp) return;
    if (!empNip.trim() || !empName.trim()) {
      setEmpError('NIP dan Nama Karyawan wajib diisi.');
      return;
    }

    const pos = positions.find(p => p.id === empPositionId);
    if (!pos) {
      setEmpError('Posisi / level belum tersedia.');
      return;
    }
    setIsSavingEmp(true);

    if (editingEmpId) {
      // Update employee
      const updatedEmployees = employees.map(e => {
        if (e.id === editingEmpId) {
          return {
            ...e,
            nip: empNip.trim(),
            name: empName.trim(),
            positionId: pos.id,
            positionName: pos.name,
            status: empStatus,
          };
        }
        return e;
      });
      try {
        await onUpdateEmployees(updatedEmployees);
      } catch (error) {
        setEmpError(error instanceof Error ? error.message : 'Data karyawan gagal disimpan.');
        setIsSavingEmp(false);
        return;
      }
      setIsSavingEmp(false);
      setEditingEmpId(null);
      onToast(`Data karyawan ${empName} berhasil diperbarui.`);
    } else {
      // Add new employee
      const newId = `EMP-${Date.now()}`;
      const newEmp: Employee = {
        id: newId,
        nip: empNip.trim(),
        name: empName.trim(),
        positionId: pos.id,
        positionName: pos.name,
        status: empStatus,
        joinDate: new Date().toISOString().slice(0, 10),
      };
      try {
        await onUpdateEmployees([...employees, newEmp]);
      } catch (error) {
        setEmpError(error instanceof Error ? error.message : 'Data karyawan gagal disimpan.');
        setIsSavingEmp(false);
        return;
      }
      setIsSavingEmp(false);
      setIsAddingEmp(false);
      onToast(`Karyawan baru ${empName} (${pos.name}) berhasil didaftarkan.`);
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (confirm(`Yakin ingin menghapus karyawan "${emp.name}" (${emp.nip})?`)) {
      try {
        await onUpdateEmployees(employees.filter(e => e.id !== emp.id));
        onToast(`Karyawan ${emp.name} berhasil dihapus.`);
      } catch (error) {
        onToast(error instanceof Error ? error.message : 'Karyawan gagal dihapus.');
      }
    }
  };

  // --- TAB 3: POSITIONS & WAGES CRUD ---
  const [newPosName, setNewPosName] = useState('');
  const [newPosWage, setNewPosWage] = useState<number>(50000);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editingPosName, setEditingPosName] = useState('');
  const [editingPosWage, setEditingPosWage] = useState<number>(50000);
  const [posError, setPosError] = useState('');

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newPosName.trim();
    if (!cleanName) {
      setPosError('Nama posisi / level wajib diisi.');
      return;
    }
    if (positions.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      setPosError('Nama posisi sudah terdaftar.');
      return;
    }

    const newPos: PositionLevel = {
      id: `pos-${Date.now()}`,
      name: cleanName,
      dailyWage: Number(newPosWage) || 50000
    };
    try {
      await onUpdatePositions([...positions, newPos]);
    } catch (error) {
      setPosError(error instanceof Error ? error.message : 'Posisi gagal disimpan.');
      return;
    }
    setNewPosName('');
    setNewPosWage(50000);
    setPosError('');
    onToast(`Level/Posisi "${cleanName}" (${formatRupiah(newPos.dailyWage)}/hari) berhasil ditambahkan.`);
  };

  const handleSaveEditPosition = async (posId: string) => {
    const cleanName = editingPosName.trim();
    if (!cleanName) return;

    const wage = Number(editingPosWage) || 50000;
    try {
      await onUpdatePositions(positions.map(p => p.id === posId ? { ...p, name: cleanName, dailyWage: wage } : p));
    } catch (error) {
      setPosError(error instanceof Error ? error.message : 'Posisi gagal diperbarui.');
      return;
    }
    
    setEditingPosId(null);
    onToast(`Level "${cleanName}" diperbarui: ${formatRupiah(wage)}/hari. Seluruh perhitungan gaji telah disinkronkan.`);
  };

  const handleDeletePosition = async (pos: PositionLevel) => {
    const inUseCount = employees.filter(e => e.positionId === pos.id).length;
    if (inUseCount > 0) {
      alert(`Level/Posisi "${pos.name}" tidak dapat dihapus karena masih digunakan oleh ${inUseCount} karyawan.`);
      return;
    }
    if (confirm(`Yakin ingin menghapus level/posisi "${pos.name}"?`)) {
      try {
        await onUpdatePositions(positions.filter(p => p.id !== pos.id));
      } catch (error) {
        setPosError(error instanceof Error ? error.message : 'Posisi gagal dihapus.');
        return;
      }
      onToast(`Level "${pos.name}" berhasil dihapus.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D31027] shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                Kelola Master Data & Tarif Gaji
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
                Atur data outlet, karyawan, dan besaran gaji per level/posisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Smooth horizontal scrolling on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 pt-2 sm:pt-3 border-b border-neutral-200 bg-white overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('outlets')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'outlets'
                ? 'border-[#D31027] text-[#D31027]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Outlet ({outlets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'employees'
                ? 'border-[#D31027] text-[#D31027]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Karyawan ({employees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'positions'
                ? 'border-[#D31027] text-[#D31027]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <BadgePercent className="w-4 h-4 shrink-0" />
            <span>Level & Tarif ({positions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {/* ================= TAB 1: OUTLETS ================= */}
          {activeTab === 'outlets' && (
            <div className="space-y-4">
              {/* Add Outlet Simple Form */}
              <form onSubmit={handleAddOutlet} className="p-3.5 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                  Tambah Nama Outlet Baru
                </span>
                {outletError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {outletError}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newOutletName}
                    onChange={(e) => {
                      setOutletError('');
                      setNewOutletName(e.target.value);
                    }}
                    placeholder="Masukkan nama outlet (contoh: Cisalak, BRP, Margonda)..."
                    className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Outlet</span>
                  </button>
                </div>
              </form>

              {/* Outlet List Table */}
              <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[480px]">
                  <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">No</th>
                      <th className="py-2.5 px-4">Nama Outlet</th>
                      <th className="py-2.5 px-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {outlets.map((outlet, idx) => {
                      const isEditing = editingOutletId === outlet.id;

                      return (
                        <tr key={outlet.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 px-4 text-center text-neutral-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-neutral-900">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingOutletName}
                                  onChange={(e) => setEditingOutletName(e.target.value)}
                                  className="text-xs px-2 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:border-[#D31027]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditOutlet(outlet.id)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOutletId(null)}
                                  className="p-1 bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span>{outlet.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOutletId(outlet.id);
                                  setEditingOutletName(outlet.name);
                                }}
                                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                                title="Edit Nama Outlet"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOutlet(outlet.id, outlet.name)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Outlet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 2: EMPLOYEES ================= */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Daftar Karyawan (NIP, Nama, Posisi/Level, Status)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Karyawan yang terdaftar langsung otomatis muncul pada form absensi.
                  </p>
                </div>
                {!isAddingEmp && !editingEmpId && (
                  <button
                    type="button"
                    onClick={handleStartAddEmployee}
                    className="px-3.5 py-1.5 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Karyawan</span>
                  </button>
                )}
              </div>

              {/* Add or Edit Form Drawer/Box */}
              {(isAddingEmp || editingEmpId) && (
                <form onSubmit={handleSaveEmployee} className="p-4 bg-red-50/40 rounded-xl border border-red-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D31027] uppercase tracking-wider">
                      {editingEmpId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingEmp(false);
                        setEditingEmpId(null);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-800"
                    >
                      Batal
                    </button>
                  </div>

                  {empError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {empError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* NIP */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        NIP *
                      </label>
                      <input
                        type="text"
                        value={empNip}
                        onChange={(e) => setEmpNip(e.target.value)}
                        placeholder="Contoh: HD-011"
                        className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono focus:outline-none focus:border-[#D31027]"
                      />
                    </div>

                    {/* Nama Karyawan */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={empName}
                        onChange={(e) => setEmpName(e.target.value)}
                        placeholder="Nama karyawan"
                        className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
                      />
                    </div>

                    {/* Level / Posisi */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Posisi / Level *
                      </label>
                      <select
                        value={empPositionId}
                        onChange={(e) => setEmpPositionId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
                      >
                        {empPositionId && !positions.some(position => position.id === empPositionId) && (
                          <option value={empPositionId}>
                            Posisi saat ini: {employees.find(employee => employee.id === editingEmpId)?.positionName || 'pilih posisi'}
                          </option>
                        )}
                        {positions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatRupiah(p.dailyWage)}/hari)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Status Karyawan *</label>
                      <select value={empStatus} onChange={event => setEmpStatus(event.target.value as Employee['status'])}
                        className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]">
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingEmp(false);
                        setEditingEmpId(null);
                      }}
                      className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEmp}
                      className="px-4 py-1.5 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      {isSavingEmp ? 'Menyimpan…' : editingEmpId ? 'Simpan Perubahan' : 'Simpan Karyawan'}
                    </button>
                  </div>
                </form>
              )}

              {/* Employees Table */}
              <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-3.5 w-16 text-center">ID</th>
                      <th className="py-2.5 px-3.5">NIP</th>
                      <th className="py-2.5 px-3.5">Nama Karyawan</th>
                      <th className="py-2.5 px-3.5">Level / Posisi</th>
                      <th className="py-2.5 px-3.5 text-center">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Gaji Harian</th>
                      <th className="py-2.5 px-3.5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {employees.map((emp) => {
                      const pos = positions.find(p => p.id === emp.positionId) || { dailyWage: 50000, name: emp.positionName };

                      return (
                        <tr key={emp.id} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 px-3.5 text-center text-neutral-500 font-mono">{emp.id}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-neutral-800">{emp.nip}</td>
                          <td className="py-2.5 px-3.5 font-semibold text-neutral-900">{emp.name}</td>
                          <td className="py-2.5 px-3.5 text-neutral-800">
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium border border-neutral-200/80">
                              {pos.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                              {emp.status === 'active' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-[#D31027]">
                            {formatRupiah(pos.dailyWage)}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditEmployee(emp)}
                                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                                title="Edit Karyawan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: POSITIONS & WAGES ================= */}
          {activeTab === 'positions' && (
            <div className="space-y-4">
              {/* Add Position Form */}
              <form onSubmit={handleAddPosition} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                  Tambah Level / Posisi Baru & Besaran Gaji
                </span>
                {posError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {posError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Nama Level / Posisi *
                    </label>
                    <input
                      type="text"
                      value={newPosName}
                      onChange={(e) => {
                        setPosError('');
                        setNewPosName(e.target.value);
                      }}
                      placeholder="Contoh: Head Kitchen, Quality Control, Kasir..."
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Tarif Gaji Harian (Rp) *
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={newPosWage}
                      onChange={(e) => setNewPosWage(Number(e.target.value))}
                      placeholder="50000"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-mono focus:outline-none focus:border-[#D31027]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Level & Gaji</span>
                  </button>
                </div>
              </form>

              {/* Positions List Table */}
              <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">No</th>
                      <th className="py-2.5 px-4">Level / Posisi</th>
                      <th className="py-2.5 px-4 text-right">Tarif Gaji Harian</th>
                      <th className="py-2.5 px-4 text-center">Jumlah Karyawan</th>
                      <th className="py-2.5 px-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {positions.map((pos, idx) => {
                      const empCount = employees.filter(e => e.positionId === pos.id).length;
                      const isEditing = editingPosId === pos.id;

                      return (
                        <tr key={pos.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 px-4 text-center text-neutral-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-neutral-900">
                            {isEditing ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingPosName}
                                onChange={(e) => setEditingPosName(e.target.value)}
                                className="text-xs px-2 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:border-[#D31027]"
                              />
                            ) : (
                              <span>{pos.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#D31027]">
                            {isEditing ? (
                              <input
                                type="number"
                                step={1000}
                                value={editingPosWage}
                                onChange={(e) => setEditingPosWage(Number(e.target.value))}
                                className="w-28 text-xs text-right px-2 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:border-[#D31027]"
                              />
                            ) : (
                              <span>{formatRupiah(pos.dailyWage)} / hari</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums text-neutral-700">
                            {empCount} Orang
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditPosition(pos.id)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPosId(null)}
                                  className="p-1 bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPosId(pos.id);
                                    setEditingPosName(pos.name);
                                    setEditingPosWage(pos.dailyWage);
                                  }}
                                  className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                                  title="Edit Nama / Gaji"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePosition(pos)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Posisi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <span>Perubahan data master & tarif gaji langsung tersinkronisasi ke absensi dan kalkulasi gaji.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
