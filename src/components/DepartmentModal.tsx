import { useState, useEffect } from 'react';
import type { Department } from '../types';
import { X, Save, Building2, UserCheck, Phone, Clock, PlusCircle, Loader2, Trash2 } from 'lucide-react';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null; // null = Add mode, present = Edit mode
  onSave: (dept: Department) => Promise<void> | void;
  onDelete?: (deptId: string) => Promise<void> | void;
}

export const DepartmentModal = ({
  isOpen,
  onClose,
  department,
  onSave,
  onDelete
}: DepartmentModalProps) => {
  const isEdit = Boolean(department);
  const [formData, setFormData] = useState<Department>({
    id: '',
    name: '',
    code: '',
    default_sla_hours: 24,
    head_officer_name: '',
    head_officer_phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({ ...department });
    } else {
      setFormData({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dept-${Date.now()}`,
        name: '',
        code: '',
        default_sla_hours: 24,
        head_officer_name: '',
        head_officer_phone: ''
      });
    }
    setIsSaving(false);
  }, [department, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('कृपया विभाग का नाम दर्ज करें (Please enter Department Name)');
      return;
    }
    if (!formData.code.trim()) {
      alert('कृपया विभाग कोड दर्ज करें (Please enter Department Code)');
      return;
    }
    if (!formData.head_officer_name.trim()) {
      alert('कृपया नोडल अधिकारी का नाम दर्ज करें (Please enter Nodal Officer Name)');
      return;
    }
    if (!formData.head_officer_phone.trim()) {
      alert('कृपया अधिकारी का फोन नंबर दर्ज करें (Please enter Officer Phone)');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        code: formData.code.toUpperCase().trim(),
        default_sla_hours: Number(formData.default_sla_hours) || 24
      });
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      alert(err?.message || 'डेटाबेस में सहेजने में विफल। कृपया पुनः प्रयास करें।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              {isEdit ? <Building2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {isEdit ? 'विभाग विवरण संपादित करें (Edit Department)' : 'नया विभाग जोड़ें (+ Add Department)'}
              </h3>
              <p className="text-xs text-blue-100 font-mono">
                {isEdit ? `${formData.code} • ${formData.name}` : 'स्मार्ट नगर परिषद चित्तौड़गढ़'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                विभाग कोड (Dept Code, e.g. SAN, WTR)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                maxLength={8}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
                placeholder="e.g. SAN"
              />
            </div>

          {/* Standard SLA Hours */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>मानक SLA समय सीमा (Configured SLA Duration)</span>
              </span>
              <span className="text-blue-600 font-mono font-bold text-xs">
                {formData.default_sla_hours} घंटे {formData.default_sla_hours >= 720 ? '(1 Month / 30 Days)' : formData.default_sla_hours >= 168 ? '(1 Week / 7 Days)' : formData.default_sla_hours >= 24 ? `(${Math.round(formData.default_sla_hours / 24)} Days)` : `(${formData.default_sla_hours} Hours)`}
              </span>
            </label>

            {/* Quick Fitted Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '12 Hours (Emergency)', hours: 12 },
                { label: '24 Hours (1 Day)', hours: 24 },
                { label: '48 Hours (2 Days)', hours: 48 },
                { label: '72 Hours (3 Days)', hours: 72 },
                { label: '1 Week (168h)', hours: 168 },
                { label: '1 Month (720h)', hours: 720 },
              ].map((preset) => (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => setFormData({ ...formData, default_sla_hours: preset.hours })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    formData.default_sla_hours === preset.hours
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Hours Input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 whitespace-nowrap">या कस्टम घंटे सेट करें:</span>
              <input
                type="number"
                min={1}
                max={2000}
                value={formData.default_sla_hours}
                onChange={(e) => setFormData({ ...formData, default_sla_hours: Number(e.target.value) })}
                required
                className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="24"
              />
              <span className="text-xs text-slate-500 font-medium">घंटे (Hours)</span>
            </div>
          </div>
        </div>

          {/* Department Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>विभाग का नाम (Department Name)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="e.g. Sanitation & Garbage Collection"
            />
          </div>

          {/* Nodal Officer Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-slate-400" />
              <span>विभागीय नोडल अधिकारी (Head / Nodal Officer Name)</span>
            </label>
            <input
              type="text"
              value={formData.head_officer_name}
              onChange={(e) => setFormData({ ...formData, head_officer_name: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="e.g. Ramesh Chandra Sharma (Executive Officer)"
            />
          </div>

          {/* Officer Phone */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>अधिकारी मोबाइल नंबर (Officer Phone / WhatsApp)</span>
            </label>
            <input
              type="tel"
              value={formData.head_officer_phone}
              onChange={(e) => setFormData({ ...formData, head_officer_phone: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white font-mono font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="+919414000001"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {isEdit && onDelete ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (department) {
                    onDelete(department.id);
                  }
                }}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="विभाग को स्थायी रूप से हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>विभाग हटाएं (Delete)</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>सहेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEdit ? 'सहेजें (Save Changes)' : 'विभाग जोड़ें (Add Department)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
