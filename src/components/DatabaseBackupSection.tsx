import React, { useState } from 'react';
import type { Ticket, IntakeComplaint, Ward, Department } from '../types';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  FileSpreadsheet, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  Info
} from 'lucide-react';

interface DatabaseBackupSectionProps {
  tickets: Ticket[];
  intakes: IntakeComplaint[];
  wards: Ward[];
  departments: Department[];
  userEmail: string;
  onRestoreAllData: (data: any) => Promise<{ success: boolean; message: string; counts?: any }>;
  onRefreshData?: () => Promise<void> | void;
}

export const DatabaseBackupSection: React.FC<DatabaseBackupSectionProps> = ({
  tickets,
  intakes,
  wards,
  departments,
  userEmail,
  onRestoreAllData,
  onRefreshData
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('snp_last_backup_timestamp');
  });
  const [previewBackup, setPreviewBackup] = useState<any | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string;
  }>({ type: null, message: '' });

  // 1. Download Full JSON Database Backup
  const handleDownloadJsonBackup = () => {
    try {
      setIsExporting(true);
      const now = new Date();
      const timestampIso = now.toISOString();
      const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

      const backupData = {
        metadata: {
          system: 'Smart Nagar Parishad Chittorgarh',
          platform: 'ChittorTech Official Civic Platform',
          version: '2.0.0',
          exported_at: timestampIso,
          exported_at_formatted: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          exported_by: userEmail,
          counts: {
            tickets: tickets.length,
            intakes: intakes.length,
            wards: wards.length,
            departments: departments.length
          }
        },
        data: {
          tickets,
          complaint_intakes: intakes,
          wards,
          departments
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Nagar_Parishad_Backup_${dateStr}_${timeStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const formattedTime = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      localStorage.setItem('snp_last_backup_timestamp', formattedTime);
      setLastBackupTime(formattedTime);

      setRestoreStatus({
        type: 'success',
        message: 'Backup Downloaded Successfully',
        details: `${tickets.length} complaints, ${intakes.length} intakes, ${wards.length} wards, and ${departments.length} departments safely exported.`
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setRestoreStatus({
        type: 'error',
        message: 'Backup Export Failed',
        details: err?.message || 'Unknown error occurred during export.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Download CSV Format Summary for Spreadsheet / Excel
  const handleDownloadCsvBackup = () => {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA');
      
      const headers = [
        'Ticket ID',
        'Citizen Name',
        'Phone',
        'Ward No',
        'Address',
        'Department',
        'Status',
        'SLA Deadline',
        'Is Overdue',
        'Problem Description'
      ];

      const csvRows = [
        headers.join(','),
        ...tickets.map(t => [
          `"${t.ticket_number || ''}"`,
          `"${(t.citizen_name || '').replace(/"/g, '""')}"`,
          `"${t.citizen_phone || ''}"`,
          `"${t.ward_number || ''}"`,
          `"${(t.address || '').replace(/"/g, '""')}"`,
          `"${(t.department_name || '').replace(/"/g, '""')}"`,
          `"${t.status || ''}"`,
          `"${t.sla_deadline || ''}"`,
          `"${t.is_overdue ? 'YES' : 'NO'}"`,
          `"${(t.problem_description || '').replace(/"/g, '""')}"`
        ].join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Nagar_Parishad_Complaints_Audit_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('CSV Export Failed: ' + err?.message);
    }
  };

  // 3. Handle File Selection for Restoration
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreStatus({ type: null, message: '' });
    setPreviewFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation
        const dataPayload = parsed.data || parsed;
        const ticketList = dataPayload.tickets || [];
        const intakeList = dataPayload.complaint_intakes || dataPayload.intakes || [];
        const wardList = dataPayload.wards || [];
        const deptList = dataPayload.departments || [];

        if (!Array.isArray(ticketList) && !Array.isArray(wardList)) {
          throw new Error('Invalid file structure: The selected file does not contain valid Nagar Parishad backup data.');
        }

        setPreviewBackup({
          metadata: parsed.metadata || {
            exported_at: 'Unknown Date',
            exported_by: 'Manual File'
          },
          tickets: ticketList,
          intakes: intakeList,
          wards: wardList,
          departments: deptList
        });
      } catch (err: any) {
        setRestoreStatus({
          type: 'error',
          message: 'Invalid Backup File',
          details: err?.message || 'File must be in valid Nagar Parishad JSON backup format.'
        });
        setPreviewBackup(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 4. Execute Restore into Database
  const handleConfirmRestore = async () => {
    if (!previewBackup) return;

    try {
      setIsRestoring(true);
      setRestoreStatus({ type: null, message: '' });

      const result = await onRestoreAllData(previewBackup);

      if (result.success) {
        setRestoreStatus({
          type: 'success',
          message: 'Database Restored Successfully',
          details: result.message
        });
        setPreviewBackup(null);
        setPreviewFileName('');
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        setRestoreStatus({
          type: 'error',
          message: 'Restore Incomplete',
          details: result.message
        });
      }
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: 'Restore Failed',
        details: err?.message || 'Error communicating with database.'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Database Backup &amp; Disaster Recovery
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE SAFEGUARD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Export a 1-click comprehensive backup of all municipal records (complaints, wards, departments, and SLA deadlines) or restore instantly during an emergency.
            </p>
          </div>
        </div>

        {/* Last Backup Info Badge */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">Last Backup:</span>
          <span className="font-bold text-slate-800 font-mono">
            {lastBackupTime || 'Not Taken Yet'}
          </span>
        </div>
      </div>

      {/* Status Alert Notification */}
      {restoreStatus.type && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            restoreStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {restoreStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-sm">{restoreStatus.message}</p>
            {restoreStatus.details && <p className="opacity-90">{restoreStatus.details}</p>}
          </div>
        </div>
      )}

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: EXPORT / DOWNLOAD BACKUP */}
        <div className="p-5 rounded-xl border border-slate-200 bg-linear-to-b from-slate-50/70 to-white flex flex-col justify-between space-y-4 shadow-2xs hover:border-blue-300 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Step 1: Export Data
              </span>
              <span className="text-[11px] text-slate-400 font-mono">JSON / CSV Formats</span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm">
              Download Full Database Backup
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export all active, pending, and resolved complaints, citizen details, ward directory, and department SLA hours into a secure, portable file. Taking a weekly or daily backup is highly recommended.
            </p>

            {/* Current Snapshot Metrics */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Complaints</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{tickets.length}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Call Intakes</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{intakes.length}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Total Wards</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{wards.length}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Departments</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{departments.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              disabled={isExporting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>{isExporting ? 'Generating Backup...' : 'Download Full Backup (.json)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvBackup}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
              title="Download Excel CSV Audit Sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: IMPORT / RESTORE BACKUP */}
        <div className="p-5 rounded-xl border border-slate-200 bg-linear-to-b from-slate-50/70 to-white flex flex-col justify-between space-y-4 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Step 2: Recovery (Restore)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">1-Click Restoration</span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm">
              Restore from Backup File
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              If the database is ever cleared, corrupted, or when migrating to a new server, upload a previously downloaded <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">.json</code> backup file to recover all data in under 10 seconds.
            </p>

            {/* File Selector Dropzone */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white transition-colors text-center cursor-pointer relative group">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Select a valid Nagar Parishad backup JSON file"
              />
              <div className="flex flex-col items-center gap-1.5">
                <HardDrive className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-xs font-bold text-slate-800">
                  {previewFileName ? previewFileName : 'Select Backup File (.json) from Computer'}
                </span>
                <span className="text-[11px] text-slate-400">Click to browse or drag file here</span>
              </div>
            </div>
          </div>

          {/* Confirm Restore Button when preview is ready */}
          {previewBackup ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Recovery Preview:</span>
                <span className="font-mono text-[11px] text-amber-700">
                  {previewBackup.tickets?.length || 0} Tickets Found
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                <div className="bg-white/80 p-1 rounded font-mono font-bold text-slate-800">
                  {previewBackup.tickets?.length || 0} Tickets
                </div>
                <div className="bg-white/80 p-1 rounded font-mono font-bold text-slate-800">
                  {previewBackup.intakes?.length || 0} Intakes
                </div>
                <div className="bg-white/80 p-1 rounded font-mono font-bold text-slate-800">
                  {previewBackup.wards?.length || 0} Wards
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="w-full mt-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring to Database...' : 'Confirm & Restore Database Now'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-100">
              <span>Collision Protection: Automatic Verification &amp; Merge</span>
              <span>100% Collision-Proof</span>
            </div>
          )}
        </div>

      </div>

      {/* Disaster Recovery Best Practice Guidance Box */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">
            Disaster Recovery Standard Operating Procedure (SOP):
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
            <li>
              <strong>Daily / Weekly Backup:</strong> At the close of each working shift (or weekly on Friday), the Portal Manager should click <code className="bg-white px-1 py-0.5 rounded border text-blue-700 font-mono">Download Full Backup (.json)</code> to save a full snapshot.
            </li>
            <li>
              <strong>Secure Storage:</strong> Store downloaded backup files in an official secure offline drive (e.g., Nagar Parishad IT USB drive) or authorized administrative email storage (<code className="font-mono text-slate-800">chittortech@gmail.com</code>).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
