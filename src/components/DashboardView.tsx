import { useState, useMemo, useEffect } from 'react';
import type { 
  UserRole, 
  Ticket, 
  IntakeComplaint, 
  Ward, 
  Department, 
  NotificationLog
} from '../types';
import { NagarParishadLogo } from './NagarParishadLogo';
import { TwoStepClosureModal } from './TwoStepClosureModal';
import { IntakeVerificationModal } from './IntakeVerificationModal';
import { NewComplaintModal } from './NewComplaintModal';
import { EditParshadModal } from './EditParshadModal';
import { DepartmentModal } from './DepartmentModal';
import { StatusModal } from './StatusModal';
import { cleanPhoneForWhatsApp } from '../lib/whatsapp';
import type { StatusModalConfig, WhatsAppAction } from './StatusModal';
import { AdminFooter } from './AdminFooter';
import { HelpSupportView } from './HelpSupportView';
import { generateNextTicketNumber, formatDeadlineIST } from '../utils/ticketGenerator';
import { 
  LayoutDashboard, 
  Inbox, 
  TicketCheck, 
  ClockAlert, 
  MapPin, 
  Building2, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Phone, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2, 
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  Pencil,
  Sparkles,
  Headphones,
  Download,
  Printer,
  XCircle,
  Menu,
  X,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface DashboardViewProps {
  userRole: UserRole;
  userEmail: string;
  onLogout: () => void;
  wards: Ward[];
  departments: Department[];
  tickets: Ticket[];
  intakes: IntakeComplaint[];
  notifications: NotificationLog[];
  onUpdateTicket: (ticket: Ticket) => void;
  onAddTicket: (ticket: Ticket) => void;
  onUpdateIntake: (intake: IntakeComplaint) => void;
  onAddIntake: (intake: IntakeComplaint) => void;
  onAddNotification: (notif: NotificationLog) => void;
  onUpdateWard?: (ward: Ward) => Promise<void> | void;
  onUpdateDepartment?: (dept: Department) => Promise<void> | void;
  onAddDepartment?: (dept: Department) => Promise<void> | void;
  onDeleteDepartment?: (deptId: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
}

const TAB_HEADER_METADATA: Record<string, { title: string; hindi: string; icon: any; bg: string }> = {
  DASHBOARD: {
    title: 'Dashboard Overview',
    hindi: 'डैशबोर्ड अवलोकन',
    icon: LayoutDashboard,
    bg: 'bg-white/95 border-sky-300 text-blue-600 shadow-2xs'
  },
  INTAKE: {
    title: 'Intake Queue',
    hindi: 'आवक नागरिक शिकायतें',
    icon: Inbox,
    bg: 'bg-white/95 border-amber-300 text-amber-600 shadow-2xs'
  },
  TICKETS: {
    title: 'All Complaints',
    hindi: 'शिकायत निवारण रजिस्टर',
    icon: TicketCheck,
    bg: 'bg-white/95 border-blue-300 text-blue-600 shadow-2xs'
  },
  CLOSED: {
    title: 'Completed Complaints',
    hindi: 'प्रमाणित पूर्ण शिकायतें',
    icon: CheckCircle2,
    bg: 'bg-white/95 border-emerald-300 text-emerald-600 shadow-2xs'
  },
  REJECTED: {
    title: 'Rejected Complaints',
    hindi: 'अस्वीकृत शिकायत ऑडिट',
    icon: XCircle,
    bg: 'bg-white/95 border-rose-300 text-rose-600 shadow-2xs'
  },
  REOPENED: {
    title: 'Reopened Complaints',
    hindi: 'पुनः खुली शिकायतें (असंतुष्ट नागरिक)',
    icon: RotateCcw,
    bg: 'bg-white/95 border-purple-300 text-purple-600 shadow-2xs'
  },
  SLA: {
    title: 'SLA Breached Complaints',
    hindi: 'समय-सीमा उल्लंघन शिकायतें',
    icon: AlertTriangle,
    bg: 'bg-white/95 border-rose-300 text-rose-600 shadow-2xs'
  },
  WARDS: {
    title: 'Parshad List (All 60 Wards)',
    hindi: 'वार्ड पार्षद निर्देशिका',
    icon: MapPin,
    bg: 'bg-white/95 border-sky-300 text-sky-600 shadow-2xs'
  },
  DEPARTMENTS: {
    title: 'Municipal Departments',
    hindi: 'विभागीय नोडल अधिकारी',
    icon: Building2,
    bg: 'bg-white/95 border-violet-300 text-violet-600 shadow-2xs'
  },
  SETTINGS: {
    title: 'Settings & Office Hours',
    hindi: 'पोर्टल सेटिंग्स',
    icon: Settings,
    bg: 'bg-white/95 border-slate-300 text-slate-700 shadow-2xs'
  },
  SUPPORT: {
    title: 'Help & Developer Support',
    hindi: 'सहायता एवं सपोर्ट',
    icon: Headphones,
    bg: 'bg-white/95 border-teal-300 text-teal-600 shadow-2xs'
  }
};

export const DashboardView = ({
  userRole,
  userEmail,
  onLogout,
  wards,
  departments,
  tickets,
  intakes,
  notifications: _notifications,
  onUpdateTicket,
  onAddTicket,
  onUpdateIntake,
  onAddIntake: _onAddIntake,
  onAddNotification,
  onUpdateWard,
  onUpdateDepartment,
  onAddDepartment,
  onDeleteDepartment,
  onRefreshData
}: DashboardViewProps) => {

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INTAKE' | 'TICKETS' | 'CLOSED' | 'REJECTED' | 'REOPENED' | 'SLA' | 'WARDS' | 'DEPARTMENTS' | 'SETTINGS' | 'SUPPORT'>('DASHBOARD');
  
  // Date Scope Mode: Defaults to 'TODAY' (portal shows only today's data by default, switchable to 'ALL' via View More / All History)
  const [dateScopeMode, setDateScopeMode] = useState<'TODAY' | 'ALL'>('TODAY');

  // Advanced Filters State
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied Filters State (Activated upon clicking "Apply Filters" button)
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [appliedWard, setAppliedWard] = useState<string>('ALL');
  const [appliedDepartment, setAppliedDepartment] = useState<string>('ALL');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD format for max calendar date restriction
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const handleApplyFilters = () => {
    setDateError(null);

    // CRITERIA 1: Future Date Validation (From Date cannot be after Today)
    if (fromDate && fromDate > todayStr) {
      setDateError("⛔ Invalid Date: 'From Date' cannot be in the future. Please select today or an earlier date.");
      return;
    }

    // CRITERIA 2: Future Date Validation (To Date cannot be after Today)
    if (toDate && toDate > todayStr) {
      setDateError("⛔ Invalid Date: 'To Date' cannot be in the future. Please select today or an earlier date.");
      return;
    }

    // CRITERIA 3: Chronological Order (From Date cannot be later than To Date)
    if (fromDate && toDate && fromDate > toDate) {
      setDateError("⛔ Invalid Date Range: 'From Date' cannot be later than 'To Date'. Please select dates in chronological order.");
      return;
    }

    // CRITERIA 4: Reasonable Historical Year (Cannot be before year 2020)
    if (fromDate && fromDate < '2020-01-01') {
      setDateError("⛔ Invalid Year: 'From Date' is too far in the past. Please select year 2020 or later.");
      return;
    }
    if (toDate && toDate < '2020-01-01') {
      setDateError("⛔ Invalid Year: 'To Date' is too far in the past. Please select year 2020 or later.");
      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedWard(selectedWard);
    setAppliedDepartment(selectedDepartment);
    const hasFilter = Boolean(fromDate || toDate || selectedWard !== 'ALL' || selectedDepartment !== 'ALL');
    setIsFilterActive(hasFilter);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedWard('ALL');
    setSelectedDepartment('ALL');
    setAppliedFromDate('');
    setAppliedToDate('');
    setAppliedWard('ALL');
    setAppliedDepartment('ALL');
    setIsFilterActive(false);
    setDateError(null);
    setDateScopeMode('TODAY');
    setCurrentPage(1);
  };

  // Pagination state for scalable handling of hundreds of complaints
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedWard, appliedDepartment, appliedFromDate, appliedToDate, selectedStatus, searchQuery, activeTab]);

  // Global keyboard shortcut to focus compact search bar with "/" or "Ctrl+K"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modals state
  const [selectedTicketForClosure, setSelectedTicketForClosure] = useState<Ticket | null>(null);
  const [selectedIntakeForVerification, setSelectedIntakeForVerification] = useState<IntakeComplaint | null>(null);
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [modalDefaultDecision, setModalDefaultDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [intakeFilterStatus, setIntakeFilterStatus] = useState<'ALL' | 'PENDING_REVIEW' | 'REJECTED' | 'ACCEPTED'>('ALL');
  // Status modal state (custom confirmation & success popup)
  const [statusModalConfig, setStatusModalConfig] = useState<StatusModalConfig>({
    isOpen: false,
    type: 'success',
    title: ''
  });

  // Parshad (Ward Councillor) & Department Management States
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [parshadSearch, setParshadSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  // Mobile sidebar drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dedicated Filter States for Rejected Complaints Tab
  const [rejectedSearch, setRejectedSearch] = useState('');
  const [rejectedWard, setRejectedWard] = useState<string>('ALL');
  const [rejectedChannel, setRejectedChannel] = useState<string>('ALL');
  const [rejectedCategory, setRejectedCategory] = useState<string>('ALL');

  const handleSaveWard = async (updatedWard: Ward) => {
    await onUpdateWard?.(updatedWard);
    setStatusModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Updated!',
      subtitle: `Ward ${updatedWard.ward_number} Parshad details have been saved.`,
      confirmText: 'OK'
    });
  };

  const handleSaveDepartment = async (dept: Department) => {
    const isEdit = Boolean(editingDepartment);
    if (isEdit) {
      await onUpdateDepartment?.(dept);
    } else {
      await onAddDepartment?.(dept);
    }
    setStatusModalConfig({
      isOpen: true,
      type: 'success',
      title: isEdit ? 'Updated!' : 'Added!',
      subtitle: isEdit
        ? `Department "${dept.name}" details have been saved.`
        : `New department "${dept.name}" has been added.`,
      confirmText: 'OK'
    });
  };

  const handleConfirmDeleteDepartment = (dept: Department) => {
    const linkedTicketsCount = tickets.filter(
      t => t.department_name === dept.name
    ).length;

    setStatusModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'विभाग स्थायी रूप से हटाएं (Delete Department)?',
      subtitle: `क्या आप "${dept.name}" (${dept.code}) को सेंट्रल डेटाबेस से हमेशा के लिए हटाना चाहते हैं?`,
      details: linkedTicketsCount > 0 ? [
        `⚠️ इस विभाग से कुल ${linkedTicketsCount} शिकायतें (Tickets) जुड़ी हुई हैं।`,
        'डिपार्टमेंट हटाने पर ये शिकायतें स्वतः डिफ़ॉल्ट विभाग (Sanitation & Garbage Collection) पर री-असाइन हो जाएंगी।',
        'यह कार्रवाई स्थायी है और इसे वापस नहीं किया जा सकता।'
      ] : [
        `विभाग कोड: ${dept.code}`,
        `जिम्मेदार नोडल अधिकारी: ${dept.head_officer_name}`,
        'यह विभाग सेंट्रल डेटाबेस से स्थायी रूप से हटा दिया जाएगा।'
      ],
      showCancel: true,
      confirmText: 'हाँ, स्थायी रूप से हटाएं (Delete)',
      cancelText: 'रद्द करें (Cancel)',
      onConfirm: async () => {
        try {
          if (onDeleteDepartment) {
            await onDeleteDepartment(dept.id);
          }
          setIsDepartmentModalOpen(false);
          setEditingDepartment(null);
          setStatusModalConfig({
            isOpen: true,
            type: 'success',
            title: 'विभाग हटाया गया (Deleted Successfully)',
            subtitle: `विभाग "${dept.name}" सेंट्रल डेटाबेस से सफलतापूर्वक हटा दिया गया है।`,
            confirmText: 'ठीक है (OK)'
          });
        } catch (err: any) {
          setStatusModalConfig({
            isOpen: true,
            type: 'error',
            title: 'हटाने में त्रुटि (Failed to Delete)',
            subtitle: err?.message || 'डेटाबेस से विभाग हटाने में त्रुटि आई।',
            confirmText: 'ठीक है (OK)'
          });
        }
      }
    });
  };

  // Filtered wards for 60 Parshad list search (Strictly sorted 1 to 60)
  const filteredWards = useMemo(() => {
    let list = wards;
    if (parshadSearch.trim()) {
      const q = parshadSearch.toLowerCase();
      list = wards.filter(w => 
        w.ward_number.toString().includes(q) ||
        w.ward_name.toLowerCase().includes(q) ||
        w.councillor_name.toLowerCase().includes(q) ||
        w.councillor_phone.includes(q) ||
        w.zone.toLowerCase().includes(q) ||
        w.key_landmarks.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => a.ward_number - b.ward_number);
  }, [wards, parshadSearch]);

  // Filtered departments for municipal department directory search
  const filteredDepartments = useMemo(() => {
    if (!departmentSearch.trim()) return departments;
    const q = departmentSearch.toLowerCase();
    return departments.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.head_officer_name.toLowerCase().includes(q) ||
      d.head_officer_phone.includes(q)
    );
  }, [departments, departmentSearch]);

  // Helper to reliably parse any municipal registration date format
  const parseTicketDate = (ticket: Ticket): Date | null => {
    if (ticket.registration_time_iso) {
      const d = new Date(ticket.registration_time_iso);
      if (!isNaN(d.getTime())) return d;
    }
    const reg = ticket.registration_time || '';
    if (!reg) return null;
    if (reg.toLowerCase().includes('today') || reg.includes('आज')) {
      return new Date();
    }
    const match = reg.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      let year = new Date().getFullYear();
      if (match[3]) {
        year = match[3].length === 2 ? 2000 + parseInt(match[3], 10) : parseInt(match[3], 10);
      }
      return new Date(year, month, day);
    }
    const fallback = new Date(reg);
    if (!isNaN(fallback.getTime())) return fallback;
    return null;
  };

  // Helper to check if a ticket was registered today
  const isTodayRegistration = (t: Ticket) => {
    if (t.registration_time_iso) {
      const d = new Date(t.registration_time_iso);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
    }
    const str = t.registration_time || '';
    if (str.toLowerCase().includes('today') || str.includes('आज')) return true;
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return str.includes(`${day}/${month}`);
  };

  // Applied Filter Scope (Tickets matching the active Date Range, Ward, and Department)
  // When dateScopeMode is 'TODAY' and no custom date range is active, only today's data is displayed.
  // This scoped dataset drives the 6 KPI cards, the status filter pills, and the main table.
  const scopeTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // 1. Date Scope: Default to TODAY if dateScopeMode === 'TODAY' and no custom date filter is set
      if (!appliedFromDate && !appliedToDate) {
        if (dateScopeMode === 'TODAY' && !isTodayRegistration(ticket)) {
          return false;
        }
      } else {
        // Custom Applied Date Range Filtering (Inclusive: Start 00:00:00 to End 23:59:59)
        const ticketDate = parseTicketDate(ticket);
        if (!ticketDate) return false;

        if (appliedFromDate) {
          const [fYear, fMonth, fDay] = appliedFromDate.split('-').map(Number);
          const start = new Date(fYear, fMonth - 1, fDay, 0, 0, 0, 0);
          if (ticketDate < start) return false;
        }

        if (appliedToDate) {
          const [tYear, tMonth, tDay] = appliedToDate.split('-').map(Number);
          const end = new Date(tYear, tMonth - 1, tDay, 23, 59, 59, 999);
          if (ticketDate > end) return false;
        }
      }

      // 2. Applied Ward Filter
      if (appliedWard !== 'ALL' && ticket.ward_number.toString() !== appliedWard) return false;

      // 3. Applied Department Filter
      if (appliedDepartment !== 'ALL' && ticket.department_name !== appliedDepartment) return false;

      return true;
    });
  }, [tickets, dateScopeMode, appliedWard, appliedDepartment, appliedFromDate, appliedToDate]);

  // Derived filtered tickets with Advanced 2-Step Closure & Keyword Filtering within the active scope
  const filteredTickets = useMemo(() => {
    return scopeTickets.filter((ticket) => {
      // Exclude REJECTED tickets from regular complaints register (they belong strictly in the Rejected Complaints audit tab)
      if (ticket.status === 'REJECTED') return false;
      if (activeTab === 'CLOSED' && ticket.status !== 'CLOSED') return false;
      if (activeTab === 'REOPENED' && ticket.status !== 'REOPENED' && !ticket.is_reopened && (ticket.reopen_count ?? 0) <= 0) return false;

      // Advanced 2-Step Closure Status Filtering
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OFFICER_PENDING') {
          // Step 1: Officer Verification Baaki
          if (ticket.status === 'CLOSED' || ticket.authority_confirmed) return false;
        } else if (selectedStatus === 'CITIZEN_PENDING' || selectedStatus === 'RESOLVED_AWAITING_CITIZEN') {
          // Step 2: Officer Confirmed, but Citizen Confirmation Baaki
          if (ticket.status === 'CLOSED' || !ticket.authority_confirmed) return false;
        } else if (selectedStatus === 'CLOSED') {
          if (ticket.status !== 'CLOSED') return false;
        } else if (selectedStatus === 'REGISTERED') {
          if (ticket.status === 'CLOSED') return false;
        } else if (ticket.status !== selectedStatus) {
          return false;
        }
      }

      // Advanced Search (Supports Ticket #, Citizen, Phone, Ward, Dept, Category & 2-Step Keywords)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();

        // 2-Step closure state keywords
        const isCitizenPending = ticket.authority_confirmed && ticket.status !== 'CLOSED';
        const isOfficerPending = !ticket.authority_confirmed && ticket.status !== 'CLOSED';
        const isClosed = ticket.status === 'CLOSED';

        const keywordMatch = 
          ((q === 'citizen' || q.includes('citizen') || q.includes('step 2') || q.includes('nagrik')) && isCitizenPending) ||
          ((q === 'officer' || q.includes('officer') || q.includes('step 1') || q.includes('adhikari')) && isOfficerPending) ||
          ((q === 'closed' || q.includes('closed') || q.includes('complete') || q.includes('2 step') || q.includes('verified') || q.includes('band')) && isClosed);

        const textMatch = 
          ticket.ticket_number.toLowerCase().includes(q) ||
          ticket.citizen_name.toLowerCase().includes(q) ||
          ticket.citizen_phone.includes(q) ||
          ticket.address.toLowerCase().includes(q) ||
          ticket.category_name.toLowerCase().includes(q) ||
          ticket.department_name.toLowerCase().includes(q) ||
          `ward ${ticket.ward_number}`.includes(q) ||
          `ward ${ticket.ward_number}`.toLowerCase() === q ||
          ticket.ward_number.toString() === q;

        if (!keywordMatch && !textMatch) return false;
      }
      return true;
    });
  }, [scopeTickets, activeTab, selectedStatus, searchQuery]);

  // Derived active tickets based on SLA / All / Closed / Reopened
  const activeTicketsList = useMemo(() => {
    if (activeTab === 'SLA') {
      return filteredTickets.filter(t => t.is_overdue || t.is_escalated);
    }
    if (activeTab === 'REOPENED') {
      return filteredTickets.filter(t => t.status === 'REOPENED' || Boolean(t.is_reopened) || (t.reopen_count ?? 0) > 0);
    }
    return filteredTickets;
  }, [activeTab, filteredTickets]);

  // Reopened tickets within current scope & overall count
  const reopenedTickets = useMemo(() => {
    return scopeTickets.filter(t => t.status === 'REOPENED' || Boolean(t.is_reopened) || (t.reopen_count ?? 0) > 0);
  }, [scopeTickets]);

  const totalReopenedCount = useMemo(() => {
    return tickets.filter(t => t.status === 'REOPENED' || Boolean(t.is_reopened) || (t.reopen_count ?? 0) > 0).length;
  }, [tickets]);

  const todayTicketsCount = useMemo(() => {
    return tickets.filter(t => isTodayRegistration(t) && t.status !== 'REJECTED').length;
  }, [tickets]);

  const activeTicketsCount = useMemo(() => {
    return tickets.filter(t => t.status !== 'REJECTED').length;
  }, [tickets]);

  // Pagination calculation
  const [isPrinting, setIsPrinting] = useState(false);

  // Print trigger handler: resets scroll position to 0 and disables pagination temporarily so 100% of rows print cleanly across all pages
  const handleTriggerPrint = () => {
    setIsPrinting(true);
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll('.overflow-y-auto, .overflow-x-auto, main');
    scrollContainers.forEach(el => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const totalItems = activeTicketsList.length;
  const totalPages = pageSize >= 99999 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTickets = useMemo(() => {
    if (isPrinting || pageSize >= 99999) return activeTicketsList;
    const startIndex = (currentPage - 1) * pageSize;
    return activeTicketsList.slice(startIndex, startIndex + pageSize);
  }, [activeTicketsList, currentPage, pageSize, isPrinting]);

  // Derived filtered intakes (All, Pending Review, Rejected, Accepted)
  const filteredIntakes = useMemo(() => {
    let result = intakes;
    if (intakeFilterStatus !== 'ALL') {
      result = result.filter(i => i.status === intakeFilterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.citizen_name.toLowerCase().includes(q) ||
        i.citizen_phone.includes(q) ||
        i.address.toLowerCase().includes(q) ||
        i.problem_description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [intakes, intakeFilterStatus, searchQuery]);

  // All Rejected Complaints (from both intake and tickets audit log)
  const allRejectedComplaints = useMemo(() => {
    const list: Array<{
      id: string;
      ticket_number?: string;
      channel: string;
      citizen_name: string;
      citizen_phone: string;
      ward_number: number;
      address: string;
      landmark?: string;
      category_name: string;
      problem_description: string;
      rejection_reason: string;
      received_at: string;
    }> = [];

    intakes.filter(i => i.status === 'REJECTED').forEach(i => {
      list.push({
        id: i.id,
        ticket_number: (i as any).ticket_number || undefined,
        channel: i.intake_channel || 'Citizen Intake',
        citizen_name: i.citizen_name,
        citizen_phone: i.citizen_phone,
        ward_number: i.ward_number,
        address: i.address,
        landmark: i.landmark,
        category_name: i.category_name,
        problem_description: i.problem_description,
        rejection_reason: i.rejection_reason || 'Rejected by Portal Manager',
        received_at: i.received_at || 'Recently'
      });
    });

    tickets.filter(t => t.status === 'REJECTED').forEach(t => {
      list.push({
        id: t.id,
        ticket_number: t.ticket_number,
        channel: 'Official Ticket',
        citizen_name: t.citizen_name,
        citizen_phone: t.citizen_phone,
        ward_number: t.ward_number,
        address: t.address,
        landmark: t.landmark,
        category_name: t.category_name,
        problem_description: t.problem_description,
        rejection_reason: t.escalation_notes || t.authority_notes || 'Rejected in Review',
        received_at: t.registration_time || 'Recently'
      });
    });

    return list;
  }, [intakes, tickets]);

  // Multi-criteria filter for Rejected Complaints Tab (Ward, Source Channel, Category & Search)
  const filteredRejectedComplaints = useMemo(() => {
    return allRejectedComplaints.filter((item) => {
      if (rejectedWard !== 'ALL' && item.ward_number.toString() !== rejectedWard) {
        return false;
      }
      if (rejectedChannel !== 'ALL') {
        const ch = item.channel.toLowerCase();
        if (rejectedChannel === 'WHATSAPP' && !ch.includes('whatsapp')) return false;
        if (rejectedChannel === 'INTAKE' && !ch.includes('intake') && !ch.includes('citizen') && !ch.includes('helpline')) return false;
        if (rejectedChannel === 'TICKET' && !ch.includes('ticket')) return false;
      }
      if (rejectedCategory !== 'ALL' && item.category_name !== rejectedCategory) {
        return false;
      }

      const q = (rejectedSearch || searchQuery).trim().toLowerCase();
      if (q) {
        const textMatch =
          (item.ticket_number && item.ticket_number.toLowerCase().includes(q)) ||
          item.citizen_name.toLowerCase().includes(q) ||
          item.citizen_phone.includes(q) ||
          item.address.toLowerCase().includes(q) ||
          (item.landmark && item.landmark.toLowerCase().includes(q)) ||
          item.problem_description.toLowerCase().includes(q) ||
          item.rejection_reason.toLowerCase().includes(q) ||
          item.category_name.toLowerCase().includes(q) ||
          item.channel.toLowerCase().includes(q) ||
          `ward ${item.ward_number}`.includes(q) ||
          item.ward_number.toString() === q;
        if (!textMatch) return false;
      }
      return true;
    });
  }, [allRejectedComplaints, rejectedWard, rejectedChannel, rejectedCategory, rejectedSearch, searchQuery]);

  // Unique categories for the Rejected Complaints filter dropdown
  const rejectedCategories = useMemo(() => {
    const set = new Set<string>();
    allRejectedComplaints.forEach((item) => {
      if (item.category_name) set.add(item.category_name);
    });
    return Array.from(set).sort();
  }, [allRejectedComplaints]);

  // Next upcoming ticket number calculated from live central database sequence
  const nextTicketNumber = useMemo(() => generateNextTicketNumber(tickets), [tickets]);

  // Real-time KPI Counts (from Master Prompt Section 9)
  const kpis = useMemo(() => {
    const todayRegistered = todayTicketsCount;
    const totalComplaints = scopeTickets.filter(t => t.status !== 'REJECTED').length;
    const pendingComplaints = scopeTickets.filter(t => (t.status === 'REGISTERED' || t.status === 'IN_PROGRESS' || t.status === 'RESOLVED_AWAITING_CITIZEN') && t.status !== 'REJECTED').length;
    const confirmedResolvedClosed = scopeTickets.filter(t => t.status === 'CLOSED').length;
    const overdueComplaints = scopeTickets.filter(t => t.is_overdue && t.status !== 'CLOSED' && t.status !== 'REJECTED').length;
    const escalatedComplaints = scopeTickets.filter(t => t.is_escalated && t.status !== 'CLOSED' && t.status !== 'REJECTED').length;
    const pendingIntakes = intakes.filter(i => i.status === 'PENDING_REVIEW').length;
    const reopenedCount = reopenedTickets.length;

    return {
      todayRegistered,
      totalComplaints,
      pendingComplaints,
      confirmedResolvedClosed,
      overdueComplaints,
      escalatedComplaints,
      pendingIntakes,
      reopenedCount
    };
  }, [scopeTickets, intakes, todayTicketsCount, reopenedTickets]);

  // Utility for Universal UTF-8 CSV Export (Microsoft Excel / Google Sheets compatible with Hindi BOM)
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvRows = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => 
        row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ];
    // \uFEFF Byte Order Mark ensures Hindi / Devanagari renders cleanly in Excel on Windows
    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTicketsCsv = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const isClosedOnly = activeTab === 'CLOSED';
    const isReopenedOnly = activeTab === 'REOPENED';
    const dataList = isClosedOnly 
      ? scopeTickets.filter(t => t.status === 'CLOSED') 
      : isReopenedOnly
      ? scopeTickets.filter(t => t.status === 'REOPENED' || Boolean(t.is_reopened) || (t.reopen_count ?? 0) > 0)
      : filteredTickets;

    const headers = [
      'Ticket Number (टिकट सं.)',
      'Citizen Name (नागरिक का नाम)',
      'Mobile Number (मोबाइल नंबर)',
      'Ward Number (वार्ड सं.)',
      'Locality & Address (स्थान एवं पता)',
      'Landmark (पहचान)',
      'Department (विभाग)',
      'Problem Category (समस्या श्रेणी)',
      'Problem Description (समस्या विवरण)',
      'Registration Time (दर्ज समय)',
      'SLA Deadline (समाधान लक्ष्य)',
      'SLA Hours (घंटे)',
      'SLA Overdue? (समय सीमा पार)',
      'Step 1 Officer Verified (अधिकारी पुष्टि)',
      'Step 1 Officer Notes (अधिकारी टिप्पणी)',
      'Step 2 Citizen Satisfied (नागरिक संतुष्टि)',
      'Step 2 Citizen Feedback (नागरिक फीडबैक)',
      'Reopen Count (पुनः खुला सं.)',
      'Final Status (अंतिम स्थिति)'
    ];

    const rows = dataList.map(t => [
      t.ticket_number,
      t.citizen_name,
      t.citizen_phone,
      `Ward ${t.ward_number}`,
      t.address,
      t.landmark || '',
      t.department_name,
      t.category_name,
      t.problem_description,
      t.registration_time || '',
      t.sla_deadline || '',
      t.sla_hours || '',
      t.is_overdue ? 'YES (Overdue)' : 'NO (On Time)',
      t.authority_confirmed ? 'YES (Verified)' : 'PENDING',
      t.authority_notes || '',
      t.citizen_satisfied !== undefined ? (t.citizen_satisfied ? 'YES (Satisfied)' : 'NO (Unsatisfied)') : 'PENDING',
      t.citizen_feedback || '',
      t.reopen_count || 0,
      t.status
    ]);

    const filename = isClosedOnly
      ? `SNP_Chittorgarh_Completed_Complaints_${dateStr}.csv`
      : isReopenedOnly
      ? `SNP_Chittorgarh_Reopened_Complaints_${dateStr}.csv`
      : `SNP_Chittorgarh_Complaints_Report_${dateStr}.csv`;

    downloadCsv(
      filename,
      headers,
      rows
    );
  };

  const handleExportWardsCsv = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const headers = [
      'Ward Number (वार्ड संख्या)',
      'Ward Name (वार्ड का नाम)',
      'Zone (क्षेत्र)',
      'Elected Parshad (पार्षद का नाम)',
      'Parshad Mobile (मोबाइल नंबर)',
      'Key Landmarks (प्रमुख स्थल)'
    ];

    const rows = [...wards]
      .sort((a, b) => a.ward_number - b.ward_number)
      .map(w => [
        w.ward_number,
        w.ward_name,
        w.zone,
        w.councillor_name,
        w.councillor_phone,
        w.key_landmarks || ''
      ]);

    downloadCsv(
      `SNP_Chittorgarh_Parshad_List_60_Wards_${dateStr}.csv`,
      headers,
      rows
    );
  };

  const handleExportIntakesCsv = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const headers = [
      'Intake Channel (माध्यम)',
      'Citizen Name (नागरिक का नाम)',
      'Citizen Mobile (मोबाइल नंबर)',
      'Ward Number (वार्ड सं.)',
      'Locality & Address (पता)',
      'Problem Category (श्रेणी)',
      'Problem Description (समस्या विवरण)',
      'Queue Status (स्थिति)',
      'Received Time (प्राप्ति समय)',
      'Rejection Reason (अस्वीकृति कारण)'
    ];

    const rows = intakes.map(i => [
      i.intake_channel,
      i.citizen_name,
      i.citizen_phone,
      `Ward ${i.ward_number}`,
      i.address,
      i.category_name,
      i.problem_description,
      i.status,
      i.received_at || '',
      i.rejection_reason || ''
    ]);

    downloadCsv(
      `SNP_Chittorgarh_Intake_Queue_${dateStr}.csv`,
      headers,
      rows
    );
  };

  const handleExportRejectedCsv = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const headers = [
      'Ticket ID (टिकट सं.)',
      'Channel (माध्यम)',
      'Citizen Name (नागरिक का नाम)',
      'Mobile Number (मोबाइल नंबर)',
      'Ward Number (वार्ड संख्या)',
      'Locality & Address (स्थान एवं पता)',
      'Landmark (पहचान)',
      'Problem Category (समस्या श्रेणी)',
      'Problem Description (समस्या विवरण)',
      'Rejection Reason (अस्वीकृति का कारण)',
      'Logged Time (दर्ज समय)',
      'Status (स्थिति)'
    ];

    const rows = filteredRejectedComplaints.map(item => [
      item.ticket_number || 'N/A',
      item.channel,
      item.citizen_name,
      item.citizen_phone,
      `Ward ${item.ward_number}`,
      item.address,
      item.landmark || '',
      item.category_name,
      item.problem_description,
      item.rejection_reason,
      item.received_at,
      'REJECTED'
    ]);

    downloadCsv(`SNP_Chittorgarh_Rejected_Complaints_${dateStr}.csv`, headers, rows);
  };

  // Handlers for Two Step Closure
  const handleAuthorityConfirm = (ticketId: string, notes: string) => {
    const target = tickets.find(t => t.id === ticketId);
    if (!target) return;
    const updated: Ticket = {
      ...target,
      authority_confirmed: true,
      authority_notes: notes,
      status: 'RESOLVED_AWAITING_CITIZEN',
      resolution_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateTicket(updated);
  };

  const handleCitizenConfirm = (ticketId: string, satisfied: boolean, feedback: string, _callOutcome: string) => {
    const target = tickets.find(t => t.id === ticketId);
    if (!target) return;
    
    if (satisfied) {
      // Step 2 Success: Mark CLOSED and send Official Hindi WhatsApp message
      const updated: Ticket = {
        ...target,
        citizen_satisfied: true,
        citizen_feedback: feedback,
        status: 'CLOSED',
        closed_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        reopen_count: target.reopen_count ?? (target.status === 'REOPENED' ? 1 : 0),
        is_reopened: target.is_reopened ?? (target.status === 'REOPENED')
      };
      onUpdateTicket(updated);

      // Auto-dispatch Hindi WhatsApp Closure Notification
      const dateStr = new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hindiMsg = `🏛️ *स्मार्ट नगर परिषद चित्तौड़गढ़*\n*शिकायत समाधान सूचना* ✅\n\n🙏 *नमस्ते ${target.citizen_name} जी,*\n\nआपकी शिकायत संख्या *${target.ticket_number}* का नगर परिषद टीम द्वारा सफलतापूर्वक समाधान कर दिया गया है एवं आपके द्वारा सत्यापन भी प्राप्त हो चुका है।\n\n📋 *समाधान विवरण:*\n━━━━━━━━━━━━━━━━━━━\n▫️ *टिकट सं.:* ${target.ticket_number}\n▫️ *विभाग:* ${target.department_name}\n▫️ *वार्ड सं.:* वार्ड ${target.ward_number}\n▫️ *समाधान दिनांक:* ${dateStr}\n▫️ *अंतिम स्थिति:* *सफलतापूर्वक निस्तारित एवं बंद (CLOSED)* ✅\n━━━━━━━━━━━━━━━━━━━\n\n📞 *नागरिक सुविधा सूचना (भविष्य में नई शिकायत हेतु):*\n• *कार्यालय समय (सुबह 10:00 AM से शाम 06:00 PM):*\n  हमारे कंट्रोल रूम हेल्पलाइन नंबर पर कॉल करके शिकायत दर्ज करा सकते हैं: *01472-240001*\n• *कार्यालय समय के बाद (शाम 06:00 PM से सुबह 10:00 AM) एवं 24/7:*\n  आप कभी भी इसी WhatsApp नंबर पर अपनी शिकायत लिखकर भेज सकते हैं।\n\n🤝 *हम आपकी सेवा में सदैव तत्पर हैं।*\n"स्वच्छ चित्तौड़गढ़, स्वस्थ एवं सुंदर चित्तौड़गढ़"\n\n*आपका शुभचिंतक,*\n*अनिल ईनाणी* (सभापति)\nनगर परिषद चित्तौड़गढ़ 🙏`;

      const newNotif: NotificationLog = {
        id: `notif-${Date.now()}`,
        ticket_number: target.ticket_number,
        recipient_type: 'CITIZEN',
        recipient_name: target.citizen_name,
        recipient_phone: target.citizen_phone,
        channel: 'WHATSAPP',
        template_name: 'snp_closure_official_hindi',
        message_content: hindiMsg,
        status: 'DELIVERED',
        sent_at: 'Just now'
      };
      onAddNotification(newNotif);
      setStatusModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Closed!',
        subtitle: `Ticket ${target.ticket_number} has been certified closed. Official WhatsApp closure receipt dispatched to citizen.`,
        details: [
          `Ticket Number: ${target.ticket_number}`,
          `Citizen: ${target.citizen_name} (${target.citizen_phone})`,
          `Ward: Ward ${target.ward_number} (${target.address})`,
          `Feedback: ${feedback || 'Citizen Confirmed Satisfied'}`
        ],
        confirmText: 'OK'
      });
    } else {
      // Citizen Unsatisfied: Reopen ticket and alert officer (Strict 1-Time Reopen Rule)
      const currentReopenCount = target.reopen_count || (target.status === 'REOPENED' || target.is_reopened ? 1 : 0);
      if (currentReopenCount >= 1 || target.is_reopened) {
        alert("यह शिकायत पहले ही 1 बार री-ओपन हो चुकी है। नियमानुसार इसे दोबारा री-ओपन नहीं किया जा सकता, अब केवल क्लोज किया जा सकता है।");
        setSelectedTicketForClosure(null);
        return;
      }

      const updated: Ticket = {
        ...target,
        citizen_satisfied: false,
        citizen_feedback: feedback,
        status: 'REOPENED',
        authority_confirmed: false, // reset for re-verification
        reopen_count: currentReopenCount + 1,
        is_reopened: true
      };
      onUpdateTicket(updated);
      setStatusModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Reopened!',
        subtitle: `Ticket ${target.ticket_number} has been returned to officer ${target.assigned_officer_name} for priority resolution. (Note: 1st & final reopen cycle — subsequent resolution will be final closure).`,
        details: [
          `Ticket Number: ${target.ticket_number}`,
          `Citizen Feedback: ${feedback || 'Reported Unresolved'}`,
          `Reopen Status: 1st & Final Cycle`
        ],
        confirmText: 'OK'
      });
    }

    setSelectedTicketForClosure(null);
  };

  // Handlers for Intake verification with Confirmation & Success (English)
  const handleAcceptIntake = (intakeId: string, slaHours: number) => {
    const intake = intakes.find(i => i.id === intakeId);
    if (!intake) return;

    const dept = departments.find(d => d.name === intake.department_name) || departments[0];
    const ticketNum = generateNextTicketNumber(tickets);
    const deadlineHours = slaHours;
    let deadlineMs = Math.round(deadlineHours * 3600 * 1000);
    if (deadlineHours < 0.01) {
      deadlineMs = 30 * 1000;
    } else if (deadlineHours < 0.05) {
      deadlineMs = 60 * 1000;
    }
    const deadlineDate = new Date(Date.now() + deadlineMs);

    const formatDeadlineDisplay = (hours: number, date: Date) => {
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      if (hours < 0.01) return `30s Target (${timeStr})`;
      if (hours < 0.05) return `1m Target (${timeStr})`;
      const datePart = date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Kolkata' });
      const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      return `${datePart}, ${timePart}`;
    };

    const formatSlaLabel = (hours: number) => {
      if (hours < 0.01) return '30 Seconds (⚡ Fast Testing)';
      if (hours < 0.05) return '1 Minute (⚡ Fast Testing)';
      return `${hours} Hours`;
    };

    setSelectedIntakeForVerification(null);

    // 1. Update intake status to ACCEPTED
    onUpdateIntake({
      ...intake,
      status: 'ACCEPTED'
    });

    // 2. Create the official municipal ticket directly
    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      ticket_number: ticketNum,
      citizen_name: intake.citizen_name,
      citizen_phone: intake.citizen_phone,
      ward_number: intake.ward_number,
      address: intake.address,
      landmark: intake.landmark,
      category_name: intake.category_name,
      department_name: intake.department_name,
      problem_description: intake.problem_description,
      status: 'REGISTERED',
      forwarding_option: 'COUNCILLOR_AND_OFFICER',
      sla_hours: deadlineHours,
      sla_deadline: formatDeadlineDisplay(deadlineHours, deadlineDate),
      sla_deadline_iso: deadlineDate.toISOString(),
      is_overdue: false,
      is_escalated: false,
      assigned_officer_name: dept.head_officer_name,
      assigned_officer_phone: dept.head_officer_phone,
      registration_time: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      authority_confirmed: false
    };

    onAddTicket(newTicket);

    // 3. Build official pre-filled WhatsApp messages
    const wardObj = wards.find(w => w.ward_number === intake.ward_number);
    const citizenMsg = `स्मार्ट नगर परिषद चित्तौड़गढ़ - शिकायत पावती\nनमस्ते ${intake.citizen_name} जी,\nआपकी शिकायत सत्यापित कर पोर्टल पर दर्ज कर ली गई है।\n\n📋 टिकट सं.: ${ticketNum}\n📍 वार्ड: वार्ड ${intake.ward_number}\n🏢 विभाग: ${intake.department_name}\n📍 स्थान: ${intake.address}\n📝 समस्या: ${intake.problem_description}\n⏱️ निस्तारण समय (SLA): ${formatSlaLabel(deadlineHours)}\n\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़`;
    const councillorMsg = `स्मार्ट नगर परिषद चित्तौड़गढ़ - वार्ड शिकायत सूचना\nआदरणीय पार्षद महोदय (${wardObj?.councillor_name || 'पार्षद'} जी),\nआपके वार्ड ${intake.ward_number} से एक नई शिकायत सत्यापित होकर दर्ज हुई है:\n\n📋 टिकट सं.: ${ticketNum}\n👤 नागरिक: ${intake.citizen_name} (${intake.citizen_phone})\n📍 स्थान: ${intake.address}\n🏢 विभाग: ${intake.department_name}\n📝 समस्या विवरण: ${intake.problem_description}\n⏱️ लक्षित SLA समय: ${formatSlaLabel(deadlineHours)}\n\nकृपया संज्ञान लेकर समाधान में सहयोग करें।\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़`;
    const officerMsg = `कार्यालय आदेश / प्राथमिकता कार्य:\nस्मार्ट नगर परिषद चित्तौड़गढ़ शिकायत निवारण पोर्टल\n\n📋 टिकट सं.: ${ticketNum}\n🏢 विभाग: ${dept.name}\n👤 नागरिक: ${intake.citizen_name} (${intake.citizen_phone})\n📍 वार्ड व पता: वार्ड ${intake.ward_number}, ${intake.address}\n📝 समस्या विवरण: ${intake.problem_description}\n⏱️ समाधान SLA सीमा: ${formatSlaLabel(deadlineHours)}\n\nकृपया प्राथमिकता के आधार पर कार्य दल भेजकर समाधान सुनिश्चित करें।\n- पोर्टल मैनेजर, नगर परिषद चित्तौड़गढ़`;

    // 4. Log notifications into audit trail
    onAddNotification({
      id: `notif-${Date.now()}-cit`,
      ticket_number: ticketNum,
      recipient_type: 'CITIZEN',
      recipient_name: `${intake.citizen_name} (Citizen)`,
      recipient_phone: intake.citizen_phone,
      channel: 'WHATSAPP',
      template_name: 'snp_citizen_ack',
      message_content: citizenMsg,
      status: 'DELIVERED',
      sent_at: 'Just now'
    });

    onAddNotification({
      id: `notif-${Date.now()}-c`,
      ticket_number: ticketNum,
      recipient_type: 'COUNCILLOR',
      recipient_name: `${wardObj?.councillor_name || 'Councillor'} (Ward ${intake.ward_number})`,
      recipient_phone: wardObj?.councillor_phone || '+91 98290 00000',
      channel: 'WHATSAPP',
      template_name: 'snp_councillor_forward',
      message_content: councillorMsg,
      status: 'DELIVERED',
      sent_at: 'Just now'
    });

    onAddNotification({
      id: `notif-${Date.now()}-o`,
      ticket_number: ticketNum,
      recipient_type: 'OFFICER',
      recipient_name: `${dept.head_officer_name} (${dept.code})`,
      recipient_phone: dept.head_officer_phone,
      channel: 'WHATSAPP',
      template_name: 'snp_officer_assign',
      message_content: officerMsg,
      status: 'DELIVERED',
      sent_at: 'Just now'
    });

    // 5. Pre-filled WhatsApp Actions for Success Modal
    // Citizen is always included; Councillor and Officer can be selected or toggled right on screen
    const waActions: WhatsAppAction[] = [
      {
        role: 'CITIZEN',
        label: `Citizen Confirmation (नागरिक: ${intake.citizen_name})`,
        phone: intake.citizen_phone,
        recipientName: intake.citizen_name,
        message: citizenMsg
      },
      {
        role: 'COUNCILLOR',
        label: `Ward Councillor (वार्ड पार्षद: ${wardObj?.councillor_name || 'Councillor'})`,
        phone: wardObj?.councillor_phone || '+91 98290 00000',
        recipientName: wardObj?.councillor_name,
        message: councillorMsg
      },
      {
        role: 'OFFICER',
        label: `Nodal Officer (विभाग अधिकारी: ${dept.head_officer_name})`,
        phone: dept.head_officer_phone,
        recipientName: dept.head_officer_name,
        message: officerMsg
      }
    ];

    // 6. Immediate Success Modal with WhatsApp Dispatch Controls
    setStatusModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Ticket Generated!',
      subtitle: `Official ticket ${ticketNum} has been generated. Pre-filled WhatsApp dispatch options are ready below.`,
      details: [
        `Ticket ID: ${ticketNum}`,
        `Citizen: ${intake.citizen_name} (${intake.citizen_phone})`,
        `Ward: Ward ${intake.ward_number} (${wardObj?.councillor_name || 'Councillor'})`,
        `Department: ${intake.department_name} (${dept.head_officer_name})`,
        `Resolution SLA: ${formatSlaLabel(deadlineHours)}`
      ],
      whatsAppActions: waActions,
      confirmText: 'OK'
    });
  };

  const handleRejectIntake = (intakeId: string, reason: string) => {
    const intake = intakes.find(i => i.id === intakeId);
    if (!intake) return;

    setSelectedIntakeForVerification(null);

    // 1. Generate sequential ticket number for the rejected grievance
    const ticketNum = generateNextTicketNumber(tickets);

    // 2. Persist to Supabase tickets table with REJECTED status
    const rejectedTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticket_number: ticketNum,
      citizen_name: intake.citizen_name,
      citizen_phone: intake.citizen_phone,
      ward_number: intake.ward_number,
      address: intake.address || 'N/A (Rejected)',
      landmark: intake.landmark || '',
      category_name: intake.category_name || 'General Municipal Grievance',
      department_name: intake.department_name || departments[0]?.name || 'General Administration',
      problem_description: intake.problem_description || `Rejection: ${reason}`,
      status: 'REJECTED',
      forwarding_option: 'OFFICER_ONLY',
      sla_hours: 0,
      sla_deadline: 'Rejected',
      sla_deadline_iso: new Date().toISOString(),
      is_overdue: false,
      is_escalated: false,
      escalation_notes: reason,
      assigned_officer_name: 'N/A (Rejected)',
      assigned_officer_phone: 'N/A',
      registration_time: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      registration_time_iso: new Date().toISOString(),
      closed_at: new Date().toISOString(),
      authority_confirmed: false,
      citizen_satisfied: false
    };

    onAddTicket(rejectedTicket);

    // 3. Update intake status in local queue
    onUpdateIntake({
      ...intake,
      status: 'REJECTED',
      rejection_reason: reason
    });

    // 4. Build official WhatsApp rejection message with Ticket ID
    const rejectHindiNotice = `स्मार्ट नगर परिषद चित्तौड़गढ़ - शिकायत निस्तारण सूचना\nनमस्ते ${intake.citizen_name} जी,\n\nआपकी शिकायत संख्या: ${ticketNum}\n📍 वार्ड: वार्ड ${intake.ward_number}\nनिर्णय: ❌ अस्वीकृत (Rejected)\n\nअस्वीकृति का आधिकारिक कारण:\n"${reason}"\n\nसूचित किया जाता है कि उपरोक्त कारण से आपकी शिकायत को आधिकारिक रूप से स्वीकार नहीं किया गया है। किसी भी स्पष्टीकरण हेतु नगर परिषद कंट्रोल रूम (01472-240001) पर संपर्क करें।\n\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़ 🙏`;

    const waActions: WhatsAppAction[] = [
      {
        role: 'CITIZEN',
        label: `Send Rejection WhatsApp Notice (${intake.citizen_name})`,
        phone: intake.citizen_phone,
        recipientName: intake.citizen_name,
        message: rejectHindiNotice
      }
    ];

    setStatusModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Complaint Rejected & Ticket Assigned!',
      subtitle: `Official Ticket ${ticketNum} assigned to rejected grievance from ${intake.citizen_name} and recorded in Supabase.`,
      details: [
        `Ticket ID: ${ticketNum}`,
        `Citizen: ${intake.citizen_name} (${intake.citizen_phone})`,
        `Ward: Ward ${intake.ward_number}`,
        `Rejection Reason: ${reason}`
      ],
      whatsAppActions: waActions,
      confirmText: 'OK'
    });
  };

  const handleOpenWhatsAppModal = (ticket: Ticket) => {
    const wardObj = wards.find(w => w.ward_number === ticket.ward_number);
    const dept = departments.find(d => d.name === ticket.department_name) || departments[0];

    const citizenMsg = `स्मार्ट नगर परिषद चित्तौड़गढ़ - शिकायत अद्यतन\nनमस्ते ${ticket.citizen_name} जी,\nआपकी शिकायत संख्या ${ticket.ticket_number} (वार्ड ${ticket.ward_number}) का विवरण:\n\n📋 टिकट: ${ticket.ticket_number}\n🏢 विभाग: ${ticket.department_name}\n⏱️ SLA समय: ${ticket.sla_hours} घंटे\nवर्तमान स्थिति: ${ticket.status.replace(/_/g, ' ')}\n\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़`;

    const councillorMsg = `स्मार्ट नगर परिषद चित्तौड़गढ़ - वार्ड शिकायत सूचना\nआदरणीय पार्षद महोदय (${wardObj?.councillor_name || 'पार्षद'} जी),\nवार्ड ${ticket.ward_number} की शिकायत ${ticket.ticket_number} का विवरण:\n\n👤 नागरिक: ${ticket.citizen_name} (${ticket.citizen_phone})\n📍 स्थान: ${ticket.address}\n🏢 विभाग: ${ticket.department_name}\n📝 विवरण: ${ticket.problem_description}\nवर्तमान स्थिति: ${ticket.status.replace(/_/g, ' ')}\n\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़`;

    const officerMsg = `कार्यालय आदेश / प्राथमिकता कार्य:\nस्मार्ट नगर परिषद चित्तौड़गढ़ शिकायत निवारण पोर्टल\n\n📋 टिकट सं.: ${ticket.ticket_number}\n🏢 विभाग: ${dept.name}\n👤 नागरिक: ${ticket.citizen_name} (${ticket.citizen_phone})\n📍 वार्ड व पता: वार्ड ${ticket.ward_number}, ${ticket.address}\n📝 समस्या विवरण: ${ticket.problem_description}\n\n- पोर्टल मैनेजर, नगर परिषद चित्तौड़गढ़`;

    const waActions: WhatsAppAction[] = [
      {
        label: `Citizen Confirmation (नागरिक: ${ticket.citizen_name})`,
        phone: ticket.citizen_phone,
        recipientName: ticket.citizen_name,
        message: citizenMsg
      }
    ];

    if (wardObj?.councillor_phone) {
      waActions.push({
        label: `Ward Councillor (वार्ड पार्षद: ${wardObj.councillor_name} - वार्ड ${ticket.ward_number})`,
        phone: wardObj.councillor_phone,
        recipientName: wardObj.councillor_name,
        message: councillorMsg
      });
    }

    if (ticket.assigned_officer_phone || dept.head_officer_phone) {
      waActions.push({
        label: `Nodal Officer (विभाग अधिकारी: ${ticket.assigned_officer_name || dept.head_officer_name})`,
        phone: ticket.assigned_officer_phone || dept.head_officer_phone,
        recipientName: ticket.assigned_officer_name || dept.head_officer_name,
        message: officerMsg
      });
    }

    setStatusModalConfig({
      isOpen: true,
      type: 'info',
      title: `Official WhatsApp Dispatch — ${ticket.ticket_number}`,
      subtitle: `Click any button below to open pre-filled WhatsApp message directly in 1 click:`,
      details: [
        `Ticket ID: ${ticket.ticket_number}`,
        `Citizen: ${ticket.citizen_name} (${ticket.citizen_phone})`,
        `Ward: Ward ${ticket.ward_number} (${wardObj?.councillor_name || 'Councillor'})`,
        `Department: ${ticket.department_name}`,
        `Status: ${ticket.status.replace(/_/g, ' ')}`
      ],
      whatsAppActions: waActions,
      confirmText: 'Done / Close'
    });
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden w-full print:h-auto print:overflow-visible print:min-w-0 print:block">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden print:hidden"
        />
      )}

      {/* 1. LEFT SIDEBAR NAVIGATION (Responsive Drawer on Mobile, Fixed Sidebar on Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out md:static md:w-56 md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } print:hidden`}>
        <div>
          {/* Sidebar Header Brand: Nagar Parishad Portal */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <NagarParishadLogo 
              size="sm" 
              theme="dark"
              hindiTitle="नगर परिषद पोर्टल"
              englishSubtitle="Nagar Parishad Portal"
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-3 pt-1 text-[9px] uppercase font-mono tracking-wider text-slate-400">
            ADMIN PORTAL &bull; CHITTORGARH
          </div>

          {/* MAIN MENU */}
          <div className="p-2 space-y-4">
            <div>
              <span className="px-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                MAIN
              </span>
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('DASHBOARD');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'DASHBOARD'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>

            {/* MANAGEMENT MENU */}
            <div>
              <span className="px-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                MANAGEMENT
              </span>
              <div className="mt-1 space-y-0.5">
                {/* 1. All Complaints */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('TICKETS');
                    setSelectedStatus('ALL');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'TICKETS'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TicketCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>All Complaints</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeTicketsCount}
                  </span>
                </button>

                {/* 2. Completed Complaints (formerly Closed) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('CLOSED');
                    setSelectedStatus('CLOSED');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'CLOSED'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Completed Complaints</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                    {kpis.confirmedResolvedClosed}
                  </span>
                </button>

                {/* 3. Rejected Complaints */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('REJECTED');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'REJECTED'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>Rejected Complaints</span>
                  </div>
                  {allRejectedComplaints.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold">
                      {allRejectedComplaints.length}
                    </span>
                  )}
                </button>

                {/* 4. Reopened Complaints */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('REOPENED');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'REOPENED'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    <span>Reopened Complaints</span>
                  </div>
                  {totalReopenedCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold">
                      {totalReopenedCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">0</span>
                  )}
                </button>

                {/* 4. SLA Breached Tab (Dedicated Tab) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SLA');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'SLA'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>SLA Breached</span>
                  </div>
                  {kpis.overdueComplaints > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px] animate-pulse">
                      {kpis.overdueComplaints}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">0</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('WARDS');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'WARDS'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Parshad List</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('DEPARTMENTS');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'DEPARTMENTS'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Departments</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SETTINGS');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'SETTINGS'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 shrink-0" />
                  <span>Settings &amp; Hours</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SUPPORT');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'SUPPORT'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 shrink-0" />
                  <span>Help &amp; Support</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ChittorTech Software Sidebar Badge & Direct Link */}
        <div className="px-2 pb-1">
          <a
            href="https://chittortech.in"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-sky-950/70 to-slate-900/90 hover:from-sky-900/60 hover:to-slate-850 border border-sky-700/40 hover:border-sky-500/60 transition-all text-white shadow-sm"
            title="Visit ChittorTech Software Official Portal (chittortech.in)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-md bg-sky-500/20 text-amber-400 group-hover:rotate-12 transition-transform shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-bold text-sky-200 leading-tight truncate">ChittorTech Software</p>
                <p className="text-[9px] text-slate-400 font-mono truncate">chittortech.in &bull; Official</p>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </a>
        </div>

        {/* User Profile Pill at Bottom */}
        <div className="p-2 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/70 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                {userRole.substring(0, 2)}
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold truncate leading-tight">
                  {userRole.replace('_', ' ')}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto print:overflow-visible print:h-auto print:block">
        {/* Top Header Bar (Professional Municipal Header) */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 print:hidden">
          {(() => {
            const meta = TAB_HEADER_METADATA[activeTab] || TAB_HEADER_METADATA.DASHBOARD;
            const Icon = meta.icon;
            return (
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  title="Toggle Menu"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden transition-colors shrink-0"
                >
                  <Menu className="w-4 h-4" />
                </button>

                {/* Tab Icon Badge */}
                <div className={`p-1.5 rounded-lg border shrink-0 ${meta.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Tab Title & Hindi Translation */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                    {meta.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hidden md:inline-block whitespace-nowrap">
                    {meta.hindi}
                  </span>
                </div>

                {/* Live Portal Official Tag */}
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200 hidden xl:inline-flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Nagar Parishad Chittorgarh Live Portal</span>
                </span>
              </div>
            );
          })()}

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Universal Search Bar - Compact, Modern & Attractive Pill */}
            <div className="relative group w-36 sm:w-44 md:w-52 focus-within:w-60 transition-all duration-200">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CGR, citizen..."
                className="w-full pl-8 pr-8 py-1.5 rounded-full border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs font-medium"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-2.5 hidden sm:flex items-center pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                    /
                  </kbd>
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <button
              type="button"
              onClick={async () => {
                if (onRefreshData) {
                  await onRefreshData();
                }
                setStatusModalConfig({
                  isOpen: true,
                  type: 'success',
                  title: 'Synchronized!',
                  subtitle: 'Central database records have been refreshed and updated.',
                  confirmText: 'OK'
                });
              }}
              title="Refresh Data from Central Database"
              className="p-2 rounded-xl border border-sky-200 bg-white/95 text-sky-700 hover:text-sky-900 hover:bg-white transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Register New Complaint button (Prominent Primary Button with upcoming Ticket Number) */}
            <button
              type="button"
              onClick={() => {
                setModalDefaultDecision('ACCEPT');
                setShowNewComplaintModal(true);
              }}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-blue-500/20 shrink-0"
              title={`Register New Complaint — Next Assigned Ticket: ${nextTicketNumber}`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Complaint</span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-[11px] font-black border border-white/30 tracking-wider shadow-2xs">
                {nextTicketNumber}
              </span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-6 print:p-0 print:space-y-3 print:block print:w-full">
          {/* Official Printable Nagar Parishad Letterhead */}
          <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-center space-y-1">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider">
              नगर परिषद चित्तौड़गढ़ (Nagar Parishad Chittorgarh)
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              स्वायत्त शासन विभाग, राजस्थान सरकार • आधिकारिक नागरिक शिकायत निवारण एवं वार्ड प्रबंधन रिकॉर्ड
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold px-2 pt-1 border-t border-slate-300 mt-1">
              <span>
                <strong>रिपोर्ट प्रकार:</strong>{' '}
                {activeTab === 'WARDS'
                  ? 'वार्ड पार्षद सूची (All 60 Wards Council Directory)'
                  : activeTab === 'CLOSED'
                  ? 'प्रमाणित पूर्ण शिकायतें (Two-Step Certified Completed Complaints)'
                  : activeTab === 'REOPENED'
                  ? 'पुनः खुली शिकायतें (Reopened Complaints Register)'
                  : activeTab === 'SLA'
                  ? 'SLA समय-सीमा उल्लंघन रजिस्टर (SLA Breached Complaints Register)'
                  : activeTab === 'REJECTED'
                  ? 'अस्वीकृत शिकायत ऑडिट रजिस्टर (Rejected Complaints Audit Register)'
                  : 'शिकायत निवारण रजिस्टर (Complaints & Official Tickets Register)'}
              </span>
              <span>
                <strong>कुल रिकॉर्ड:</strong>{' '}
                {activeTab === 'WARDS'
                  ? `${filteredWards.length} वार्ड पार्षद`
                  : activeTab === 'REJECTED'
                  ? `${allRejectedComplaints.length} अस्वीकृत शिकायतें`
                  : activeTab === 'REOPENED'
                  ? `${reopenedTickets.length} पुनः खुली शिकायतें`
                  : `${activeTab === 'CLOSED' ? tickets.filter(t => t.status === 'CLOSED').length : filteredTickets.length} शिकायतें`}
              </span>
              <span>
                <strong>प्रिंट दिनांक:</strong>{' '}
                {new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {(activeTab === 'DASHBOARD' || activeTab === 'TICKETS' || activeTab === 'CLOSED' || activeTab === 'REOPENED' || activeTab === 'SLA') && (
            <>
              {/* Greeting & Scope Switcher (Today Only vs View More / All History) */}
              <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Good morning, {userRole.replace('_', ' ')} 👋
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {dateScopeMode === 'TODAY' && !isFilterActive
                      ? "Showing Today's Complaints only (आज की शिकायतें). Click 'View More / All History' to see all previous records."
                      : "Showing complaints based on active filter scope."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Today vs All Records Scope Switcher */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDateScopeMode('TODAY');
                        if (appliedFromDate || appliedToDate) {
                          handleClearFilters();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        dateScopeMode === 'TODAY' && !isFilterActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Show only today's registrations"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Today Only (आज)</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        dateScopeMode === 'TODAY' && !isFilterActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {todayTicketsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDateScopeMode('ALL');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        dateScopeMode === 'ALL' || isFilterActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Show all complaints history"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View More / All History (सभी पुरानी)</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        dateScopeMode === 'ALL' || isFilterActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {activeTicketsCount}
                      </span>
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync: Central DB Connected
                  </span>
                </div>
              </div>

          {/* ADVANCED FILTERS CARD (Matches Reference Screenshot 2) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:hidden">
            <div 
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 cursor-pointer border-b border-slate-200"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-xs text-slate-800">Advanced Filters</span>
                <span className="text-[11px] text-slate-400">(Click to {filtersOpen ? 'collapse' : 'expand'} options)</span>
              </div>
              <button className="text-slate-500">
                {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {filtersOpen && (
              <div className="p-5 space-y-4">
                {/* Date Validation Error Alert */}
                {dateError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{dateError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDateError(null)}
                      className="text-rose-500 hover:text-rose-800 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                      title="Dismiss error"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* From Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">FROM DATE</label>
                    <input
                      type="date"
                      value={fromDate}
                      max={todayStr}
                      min="2020-01-01"
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setDateError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-700 bg-white transition-all ${
                        dateError && fromDate > todayStr ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  {/* To Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TO DATE</label>
                    <input
                      type="date"
                      value={toDate}
                      max={todayStr}
                      min={fromDate || "2020-01-01"}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setDateError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-700 bg-white transition-all ${
                        dateError && toDate > todayStr ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  {/* Ward Filter (1 to 60) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CHITTORGARH WARD</label>
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white font-medium"
                    >
                      <option value="ALL">All 60 Wards</option>
                      {wards.map((w) => {
                        const cleanName = (w.ward_name || '').replace(new RegExp(`^Ward\\s*${w.ward_number}\\s*[-–—:]*\\s*`, 'i'), '').trim();
                        return (
                          <option key={w.ward_number} value={w.ward_number}>
                            Ward {w.ward_number} — {cleanName || w.ward_name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DEPARTMENT</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white font-medium"
                    >
                      <option value="ALL">All Municipal Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Action Buttons (Apply & Clear) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      Apply Filters
                    </button>
                    {(fromDate || toDate || selectedWard !== 'ALL' || selectedDepartment !== 'ALL' || isFilterActive) && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Helpful Note */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>To view complaints for a <strong>single specific date</strong>, select the same date in both From &amp; To Date.</span>
                  </div>
                </div>

                {/* Active Filter Status Bar */}
                {isFilterActive && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                      <span className="font-bold">Active Filter:</span>
                      {appliedFromDate && appliedToDate ? (
                        appliedFromDate === appliedToDate ? (
                          <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold">Date: {appliedFromDate}</span>
                        ) : (
                          <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold">{appliedFromDate} to {appliedToDate}</span>
                        )
                      ) : appliedFromDate ? (
                        <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold">From {appliedFromDate} onwards</span>
                      ) : appliedToDate ? (
                        <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold">Up to {appliedToDate}</span>
                      ) : null}
                      {appliedWard !== 'ALL' && (
                        <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">Ward {appliedWard}</span>
                      )}
                      {appliedDepartment !== 'ALL' && (
                        <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">{appliedDepartment}</span>
                      )}
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {filteredTickets.length} complaints found
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer shrink-0"
                    >
                      Clear Filter ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6 OFFICIAL KPI CARDS (Workflow D: Portal Manager & Executive SLA Monitoring) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 print:hidden">
            {/* Card 1: Today's Registered */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Today's Registered</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {kpis.todayRegistered}
              </p>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>Helpline &amp; WA</span>
              </div>
            </div>

            {/* Card 2: Total Complaints */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('TICKETS');
                setSelectedStatus('ALL');
              }}
              title="Click to view all complaints"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total Complaints</span>
                <Layers className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {kpis.totalComplaints}
              </p>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>All 60 Wards</span>
                <span className="text-blue-600 font-semibold text-[9px]">Filter ➔</span>
              </div>
            </button>

            {/* Card 3: Pending Complaints */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('TICKETS');
                setSelectedStatus('REGISTERED');
              }}
              title="Click to filter pending complaints"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-amber-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Pending Complaints</span>
                <ClockAlert className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-amber-600 font-mono">
                {kpis.pendingComplaints}
              </p>
              <div className="text-[10px] text-amber-700 flex items-center justify-between">
                <span>Awaiting resolution</span>
                <span className="text-amber-700 font-semibold text-[9px]">Filter ➔</span>
              </div>
            </button>

            {/* Card 4: Completed Complaints (formerly Closed) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('CLOSED');
                setSelectedStatus('CLOSED');
              }}
              title="Click to view certified completed complaints"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-emerald-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Completed Complaints</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">
                {kpis.confirmedResolvedClosed}
              </p>
              <div className="text-[10px] text-emerald-700 flex items-center justify-between">
                <span>2-Step Certified</span>
                <span className="text-emerald-700 font-semibold text-[9px]">View Tab ➔</span>
              </div>
            </button>

            {/* Card 5: SLA Breached Complaints */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('SLA');
              }}
              title="Click to inspect SLA breached complaints"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-rose-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>SLA Breached Complaints</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">
                {kpis.overdueComplaints}
              </p>
              <div className="text-[10px] text-rose-600 font-semibold flex items-center justify-between">
                <span>Critical Attention</span>
                <span className="font-semibold text-[9px]">Inspect ➔</span>
              </div>
            </button>

            {/* Card 6: Escalated */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('SLA');
              }}
              title="Click to inspect escalated cases"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-purple-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Escalated Cases</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-extrabold text-purple-600 font-mono">
                {kpis.escalatedComplaints}
              </p>
              <div className="text-[10px] text-purple-700 flex items-center justify-between">
                <span>Executive Action</span>
                <span className="font-semibold text-[9px]">Inspect ➔</span>
              </div>
            </button>
          </div>
        </>
      )}

          {/* ACTIVE TAB CONTENT DISPLAY */}

          {/* TAB: DASHBOARD / ALL TICKETS / CLOSED / REOPENED / SLA */}
          {(activeTab === 'DASHBOARD' || activeTab === 'TICKETS' || activeTab === 'CLOSED' || activeTab === 'REOPENED' || activeTab === 'SLA') && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeTab === 'SLA' 
                        ? 'SLA Breached Complaints Register (समय-सीमा उल्लंघन)' 
                        : activeTab === 'CLOSED'
                        ? 'Completed Complaints (प्रमाणित पूर्ण शिकायतें)'
                        : activeTab === 'REOPENED'
                        ? 'Reopened Complaints Register (पुनः खुली शिकायतें)'
                        : 'Complaints & Official Tickets Management'}
                    </h3>

                    {/* Scope indicator badge next to title */}
                    {!isFilterActive && (
                      dateScopeMode === 'TODAY' ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                          Today Only (आज)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-300">
                          All History (सभी)
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'SLA'
                      ? `Showing ${activeTicketsList.length} complaints exceeding standard resolution SLA deadlines`
                      : activeTab === 'CLOSED'
                      ? `Showing ${activeTicketsList.length} two-step certified completed complaints`
                      : activeTab === 'REOPENED'
                      ? `Showing ${activeTicketsList.length} grievances reopened after citizen dissatisfaction or pending re-verification`
                      : `Showing ${activeTicketsList.length} complaints across Chittorgarh Nagar Parishad`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Quick Filter Tabs */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'CLOSED' || activeTab === 'REOPENED') setActiveTab('TICKETS');
                        setSelectedStatus('ALL');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab !== 'CLOSED' && activeTab !== 'REOPENED' && selectedStatus === 'ALL'
                          ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({scopeTickets.filter(t => t.status !== 'REJECTED').length})
                    </button>

                    {/* Step 1: Officer Verification Baaki */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'CLOSED' || activeTab === 'REOPENED') setActiveTab('TICKETS');
                        setSelectedStatus('OFFICER_PENDING');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab !== 'CLOSED' && activeTab !== 'REOPENED' && selectedStatus === 'OFFICER_PENDING'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Step 1: Officer Pending ({scopeTickets.filter(t => !t.authority_confirmed && t.status !== 'CLOSED' && t.status !== 'REJECTED').length})</span>
                    </button>

                    {/* Step 2: Citizen Confirmation Baaki */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'CLOSED' || activeTab === 'REOPENED') setActiveTab('TICKETS');
                        setSelectedStatus('CITIZEN_PENDING');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab !== 'CLOSED' && activeTab !== 'REOPENED' && selectedStatus === 'CITIZEN_PENDING'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Step 2: Citizen Call Pending ({scopeTickets.filter(t => t.authority_confirmed && t.status !== 'CLOSED' && t.status !== 'REJECTED').length})</span>
                    </button>

                    {/* Both Complete: Closed */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('CLOSED');
                        setSelectedStatus('CLOSED');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'CLOSED' || selectedStatus === 'CLOSED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>2-Step Complete ({scopeTickets.filter(t => t.status === 'CLOSED').length})</span>
                    </button>
                  </div>

                  {/* Export & Print Action Buttons */}
                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={handleExportTicketsCsv}
                      title="Download Complaints as Excel CSV (Devanagari / Hindi UTF-8 Supported)"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Excel (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerPrint}
                      title="Print Official Complaints Sheet or Save as PDF"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Container with Smooth Horizontal Scrolling & Zero Overlap */}
              <div className="overflow-x-auto print:overflow-visible border-t-2 border-slate-400 rounded-b-xl shadow-xs print:border-none print:shadow-none">
                <table className="w-full min-w-[1260px] print:min-w-full border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 print:static border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[140px] min-w-[140px] whitespace-nowrap">Ticket ID</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px] whitespace-nowrap">Citizen &amp; Contact</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[190px] min-w-[190px]">Ward &amp; Location</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[220px]">Department &amp; Problem</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[160px] min-w-[160px] whitespace-nowrap">SLA &amp; Deadline</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[175px] min-w-[175px] text-center whitespace-nowrap">Status</th>
                      <th className="px-4 py-3.5 text-right w-[255px] min-w-[255px] whitespace-nowrap bg-slate-100 border-l border-slate-400 print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 bg-white">
                    {paginatedTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <div className="max-w-md mx-auto space-y-3">
                            <Filter className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="font-bold text-sm text-slate-700">
                              {isFilterActive
                                ? 'No matching complaints found for the selected filter criteria (Date / Ward / Department).'
                                : activeTab === 'REOPENED'
                                ? 'No reopened complaints currently. All resolved complaints have satisfied citizens! 👏'
                                : 'No matching complaints found for the current filter criteria.'}
                            </p>
                            {isFilterActive && (
                              <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-blue-50/70 even:bg-slate-50/50 transition-colors">
                          {/* Ticket Number */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-400 text-xs tracking-tight whitespace-nowrap">
                                {ticket.ticket_number}
                              </span>
                              {ticket.is_escalated && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px] uppercase tracking-wide border border-purple-300 whitespace-nowrap">
                                  Escalated
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Citizen */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <p className="font-bold text-slate-900 text-xs whitespace-nowrap">{ticket.citizen_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a 
                                href={`tel:${ticket.citizen_phone}`} 
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-mono text-xs whitespace-nowrap font-medium"
                                title="Call Citizen"
                              >
                                <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>{ticket.citizen_phone}</span>
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhoneForWhatsApp(ticket.citizen_phone)}?text=${encodeURIComponent(
                                  `स्मार्ट नगर परिषद चित्तौड़गढ़\nनमस्ते ${ticket.citizen_name} जी, आपकी शिकायत संख्या ${ticket.ticket_number} (वार्ड ${ticket.ward_number}) की स्थिति: ${ticket.status.replace(/_/g, ' ')}।\n- कंट्रोल रूम, नगर परिषद`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Chat with citizen ${ticket.citizen_name} on WhatsApp`}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors inline-flex items-center gap-1 shrink-0 text-[10px] font-bold"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>WA Chat</span>
                              </a>
                            </div>
                          </td>

                          {/* Ward & Address */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-400 whitespace-nowrap">
                                Ward {ticket.ward_number}
                              </span>
                              <p className="text-slate-700 text-xs leading-relaxed" title={ticket.address}>
                                {ticket.address}
                              </p>
                            </div>
                          </td>

                          {/* Department & Problem */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 text-xs block leading-snug">
                                {ticket.department_name}
                              </span>
                              <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2" title={ticket.problem_description}>
                                {ticket.problem_description}
                              </p>
                            </div>
                          </td>

                          {/* SLA */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap">
                              <ClockAlert className={`w-3.5 h-3.5 shrink-0 ${ticket.is_overdue ? 'text-rose-600' : 'text-slate-500'}`} />
                              <span className={ticket.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-800 font-medium'}>
                                {formatDeadlineIST(ticket.sla_deadline)}
                              </span>
                            </div>
                            {ticket.is_overdue ? (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold whitespace-nowrap">
                                ⚠️ SLA Overdue
                              </span>
                            ) : (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-medium whitespace-nowrap">
                                On Schedule
                              </span>
                            )}
                          </td>

                          {/* Status - Explicit 2-Step Closure Lifecycle Indicator */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle text-center whitespace-nowrap">
                            {ticket.status === 'REJECTED' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border bg-rose-50 text-rose-800 border-rose-300">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            ) : ticket.status === 'REOPENED' || ticket.is_reopened ? (
                              <button
                                type="button"
                                onClick={() => setSelectedTicketForClosure(ticket)}
                                title="Complaint reopened by citizen! Click to inspect and resolve."
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-300/80 animate-pulse cursor-pointer hover:bg-purple-200 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3 text-purple-700" />
                                <span>Reopened {(ticket.reopen_count ?? 0) > 0 ? `(${ticket.reopen_count}x)` : ''}</span>
                              </button>
                            ) : ticket.status !== 'CLOSED' ? (
                              ticket.authority_confirmed ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTicketForClosure(ticket)}
                                  title="Officer confirmed resolution! Step 2 Citizen call is pending."
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-300/80 animate-pulse cursor-pointer hover:bg-amber-200 transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                  <span>📞 Citizen Conf. Baaki</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTicketForClosure(ticket)}
                                  title="Step 1 Pending: Click to call officer and verify field completion."
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border bg-blue-50 text-blue-800 border-blue-300 cursor-pointer hover:bg-blue-100 transition-colors"
                                >
                                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                                  <span>Step 1: Officer Baaki</span>
                                </button>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border bg-emerald-50 text-emerald-800 border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>2-Step Complete</span>
                              </span>
                            )}
                          </td>

                          {/* Actions (Clean & Properly Sized with No Overlap) */}
                          <td className="px-3.5 py-3.5 align-middle text-right whitespace-nowrap bg-white border-l border-slate-300 print:hidden">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              {ticket.status === 'REJECTED' ? (
                                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 font-bold text-[11px] inline-flex items-center gap-1 whitespace-nowrap">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              ) : ticket.status !== 'CLOSED' ? (
                                ticket.authority_confirmed ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTicketForClosure(ticket)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1 transition-all active:scale-95 whitespace-nowrap cursor-pointer ring-1 ring-amber-300"
                                    title="Officer Confirmed! Click to call citizen & certify final closure."
                                  >
                                    <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                                    <span>Call &amp; Close</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTicketForClosure(ticket)}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                                    title="Step 1: Call officer to verify field resolution"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Officer Verify</span>
                                  </button>
                                )
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Closed</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppModal(ticket)}
                                title="Forward / Dispatch WhatsApp to Citizen, Councillor or Officer"
                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs inline-flex items-center gap-1 shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden xl:inline">WhatsApp</span>
                              </button>
                              <a
                                href={`tel:${ticket.citizen_phone}`}
                                title="Call Citizen"
                                className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center justify-center shrink-0"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls & Rows Per Page (Addresses user question: "Will it only show top 10?") */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 select-none print:hidden">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span>
                    Showing{' '}
                    <strong className="font-semibold text-slate-900 font-mono">
                      {totalItems === 0 ? 0 : (currentPage - 1) * (pageSize >= 99999 ? totalItems : pageSize) + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="font-semibold text-slate-900 font-mono">
                      {pageSize >= 99999 ? totalItems : Math.min(currentPage * pageSize, totalItems)}
                    </strong>{' '}
                    of{' '}
                    <strong className="font-semibold text-slate-900 font-mono">{totalItems}</strong> complaints
                  </span>

                  {/* Rows per page selector */}
                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                    <span className="text-slate-500 text-[11px]">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-0.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={99999}>All Records ({totalItems})</option>
                    </select>
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                      .map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer ${
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* TAB: INTAKE QUEUE (Helpline Calls & WhatsApp Intake) */}
          {activeTab === 'INTAKE' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Incoming Unverified Complaint Intake Queue (Workflow A &amp; B)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Helpline calls (10 AM - 6 PM) and WhatsApp messages requiring Portal Manager acceptance
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status Filter Tabs */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIntakeFilterStatus('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        intakeFilterStatus === 'ALL'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({intakes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntakeFilterStatus('PENDING_REVIEW')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        intakeFilterStatus === 'PENDING_REVIEW'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pending Review ({intakes.filter(i => i.status === 'PENDING_REVIEW').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntakeFilterStatus('REJECTED')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        intakeFilterStatus === 'REJECTED'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rejected ({intakes.filter(i => i.status === 'REJECTED').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntakeFilterStatus('ACCEPTED')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        intakeFilterStatus === 'ACCEPTED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Accepted ({intakes.filter(i => i.status === 'ACCEPTED').length})
                    </button>
                  </div>

                  {/* Export & Print */}
                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={handleExportIntakesCsv}
                      title="Export Intake Queue to Excel CSV"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Excel (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerPrint}
                      title="Print Intake Queue or Save as PDF"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto print:overflow-visible border-t-2 border-slate-400 print:border-none">
                <table className="w-full min-w-[1050px] print:min-w-full border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 print:static border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px] whitespace-nowrap">Channel &amp; Time</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[180px] min-w-[180px] whitespace-nowrap">Citizen Info</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[200px] min-w-[200px]">Ward &amp; Locality</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[260px]">Reported Problem</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[150px] min-w-[150px] text-center whitespace-nowrap">Queue Status</th>
                      <th className="px-4 py-3.5 text-right w-[160px] min-w-[160px] whitespace-nowrap print:hidden">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 bg-white">
                    {filteredIntakes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                              <Inbox className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              {intakeFilterStatus === 'REJECTED' 
                                ? 'No Rejected Complaints' 
                                : intakeFilterStatus === 'PENDING_REVIEW'
                                ? 'No Pending Reviews in Queue'
                                : 'No Records in this Filter'}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {intakeFilterStatus === 'REJECTED'
                                ? 'No complaints have been rejected yet. Any complaint you reject will appear here.'
                                : 'Use the top "+ Register Complaint" button in the navigation bar to register incoming grievances.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredIntakes.map((intake) => (
                        <tr key={intake.id} className="hover:bg-blue-50/70 even:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                              intake.intake_channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {intake.intake_channel === 'WHATSAPP' ? 'WhatsApp 24/7' : 'Helpline Call'}
                            </span>
                            <p className="text-[11px] text-slate-500 font-mono mt-1 whitespace-nowrap">{intake.received_at}</p>
                            {intake.is_after_hours && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200 mt-0.5 inline-block whitespace-nowrap">
                                After-Hours Queue
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <p className="font-bold text-slate-900 text-xs whitespace-nowrap">{intake.citizen_name}</p>
                            <p className="font-mono text-slate-700 text-xs mt-0.5 whitespace-nowrap font-medium">{intake.citizen_phone}</p>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-400 mb-0.5 whitespace-nowrap">
                              Ward {intake.ward_number}
                            </span>
                            <p className="text-slate-700 text-xs leading-relaxed" title={intake.address}>{intake.address}</p>
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                            <p className="font-bold text-slate-900 text-xs leading-snug">{intake.category_name}</p>
                            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed line-clamp-2" title={intake.problem_description}>{intake.problem_description}</p>
                            {intake.status === 'REJECTED' && intake.rejection_reason && (
                              <div className="mt-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-medium">
                                <strong>Rejection Reason:</strong> {intake.rejection_reason}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                              intake.status === 'ACCEPTED' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : intake.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {intake.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap print:hidden">
                            {intake.status === 'PENDING_REVIEW' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedIntakeForVerification(intake)}
                                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                              >
                                Verify &amp; Accept
                              </button>
                            ) : intake.status === 'REJECTED' ? (
                              <span className="text-xs text-rose-600 font-bold px-2 py-1 rounded bg-rose-50 border border-rose-200">
                                Rejected
                              </span>
                            ) : (() => {
                              const linkedTicket = tickets.find(t => 
                                t.citizen_phone === intake.citizen_phone && 
                                (t.ward_number === intake.ward_number || t.address === intake.address)
                              );

                              if (linkedTicket && linkedTicket.status === 'CLOSED') {
                                return (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Closed ({linkedTicket.ticket_number})</span>
                                  </span>
                                );
                              }

                              if (linkedTicket) {
                                return (
                                  <div className="inline-flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500 font-mono hidden md:inline">{linkedTicket.ticket_number}</span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTicketForClosure(linkedTicket)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                                      title="Mandatory 2-Step Ticket Closure (Verify & Close)"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>🛡️ Close Ticket</span>
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <span className="text-xs text-emerald-600 font-bold px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
                                  Accepted
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {/* TAB: REJECTED COMPLAINTS (अस्वीकृत शिकायत ऑडिट रजिस्टर) */}
          {activeTab === 'REJECTED' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
                {/* Header Section */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Rejected Complaints Audit Register (अस्वीकृत शिकायतें)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Complaints rejected during citizen intake or registration with recorded mandatory audit reasons
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full whitespace-nowrap">
                      {filteredRejectedComplaints.length} / {allRejectedComplaints.length} Rejected
                    </span>

                    <button
                      type="button"
                      onClick={handleExportRejectedCsv}
                      title="Download Filtered Rejected Complaints as Excel CSV"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Excel (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerPrint}
                      title="Print Rejected Complaints Report or Save as PDF"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Filter Bar for Rejected Complaints (Responsive) */}
                <div className="p-3 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center gap-2.5 print:hidden">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={rejectedSearch}
                      onChange={(e) => setRejectedSearch(e.target.value)}
                      placeholder="Search citizen, phone, ward, problem, audit reason..."
                      className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                    />
                    {rejectedSearch && (
                      <button
                        type="button"
                        onClick={() => setRejectedSearch('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Ward Dropdown Filter */}
                  <div className="w-full sm:w-auto min-w-[170px]">
                    <select
                      value={rejectedWard}
                      onChange={(e) => setRejectedWard(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All 60 Wards (सभी वार्ड)</option>
                      {[...wards]
                        .sort((a, b) => a.ward_number - b.ward_number)
                        .map((w) => (
                          <option key={w.ward_number} value={w.ward_number.toString()}>
                            Ward {w.ward_number} - {w.councillor_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Source Channel Dropdown Filter */}
                  <div className="w-full sm:w-auto min-w-[150px]">
                    <select
                      value={rejectedChannel}
                      onChange={(e) => setRejectedChannel(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All Channels (सभी स्रोत)</option>
                      <option value="WHATSAPP">WhatsApp (व्हाट्सएप)</option>
                      <option value="INTAKE">Helpline / Desk (हेल्पलाइन)</option>
                      <option value="TICKET">Official Ticket (आधिकारिक टिकट)</option>
                    </select>
                  </div>

                  {/* Problem Category Dropdown Filter */}
                  <div className="w-full sm:w-auto min-w-[170px]">
                    <select
                      value={rejectedCategory}
                      onChange={(e) => setRejectedCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All Categories (सभी श्रेणियां)</option>
                      {rejectedCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Filters Button */}
                  {(rejectedWard !== 'ALL' || rejectedChannel !== 'ALL' || rejectedCategory !== 'ALL' || rejectedSearch.trim() !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectedSearch('');
                        setRejectedWard('ALL');
                        setRejectedChannel('ALL');
                        setRejectedCategory('ALL');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                {/* Mobile View: Responsive Cards (< md screens) */}
                <div className="block md:hidden divide-y divide-slate-200 print:hidden">
                  {filteredRejectedComplaints.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <XCircle className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">No Rejected Complaints Found</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {rejectedWard !== 'ALL' || rejectedChannel !== 'ALL' || rejectedCategory !== 'ALL' || rejectedSearch.trim()
                            ? 'No complaints match your active filter criteria. Click "Reset Filters" to clear.'
                            : 'Any complaints rejected during intake or registration with a mandatory audit reason will appear here.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredRejectedComplaints.map((item) => (
                      <div key={item.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.ticket_number && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                {item.ticket_number}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 bg-slate-100 text-slate-700">
                              {item.channel}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-300">
                              Ward {item.ward_number}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-rose-50 text-rose-800 border-rose-300">
                            REJECTED
                          </span>
                        </div>

                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{item.citizen_name}</p>
                              <p className="text-slate-500 font-mono text-[11px] mt-0.5">{item.citizen_phone}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={`tel:${item.citizen_phone}`}
                                title="Call Citizen"
                                className="p-1.5 rounded-lg border border-slate-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center justify-center"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhoneForWhatsApp(item.citizen_phone)}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Citizen"
                                className="p-1.5 rounded-lg border border-emerald-300 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors inline-flex items-center justify-center"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                          <p className="text-slate-600 text-xs mt-1.5 leading-snug">{item.address}</p>
                          {item.landmark && (
                            <p className="text-slate-400 text-[10px] mt-0.5">Near: {item.landmark}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="font-bold text-slate-900 text-xs">{item.category_name}</p>
                          <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{item.problem_description}</p>
                        </div>

                        {/* Rejection Reason Alert Box */}
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-snug">
                          <strong className="text-rose-900 font-bold block text-[11px] mb-0.5">
                            Audit Reason (अस्वीकृति का कारण):
                          </strong>
                          <p className="font-medium text-rose-800">{item.rejection_reason}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Logged: {item.received_at}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop & Printable Table View */}
                <div className="hidden md:block print:block overflow-x-auto print:overflow-visible border-t-2 border-slate-400 print:border-none">
                  <table className="w-full min-w-[1050px] print:min-w-full border-collapse border border-slate-400 text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 print:static border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 select-none">
                      <tr>
                        <th className="px-4 py-3.5 border-r border-slate-400 w-[130px] min-w-[130px] whitespace-nowrap">Ticket ID</th>
                        <th className="px-4 py-3.5 border-r border-slate-400 w-[150px] min-w-[150px] whitespace-nowrap">Channel &amp; Time</th>
                        <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px] whitespace-nowrap">Citizen Info</th>
                        <th className="px-4 py-3.5 border-r border-slate-400 w-[190px] min-w-[190px]">Ward &amp; Locality</th>
                        <th className="px-4 py-3.5 border-r border-slate-400 min-w-[220px]">Reported Problem</th>
                        <th className="px-4 py-3.5 border-r border-slate-400 min-w-[240px]">Rejection Reason (अस्वीकृति का कारण)</th>
                        <th className="px-4 py-3.5 border-r border-slate-400 w-[110px] min-w-[110px] text-center whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 text-right w-[110px] min-w-[110px] whitespace-nowrap print:hidden">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400 bg-white">
                      {filteredRejectedComplaints.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <XCircle className="w-8 h-8 text-slate-300" />
                              <p className="font-semibold text-slate-600">No Rejected Complaints Found</p>
                              <p className="text-xs text-slate-400">
                                {rejectedWard !== 'ALL' || rejectedChannel !== 'ALL' || rejectedCategory !== 'ALL' || rejectedSearch.trim()
                                  ? 'No rejected complaints match your active filter criteria.'
                                  : 'Any complaints rejected during intake or registration with a mandatory audit reason will appear here.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRejectedComplaints.map((item) => (
                          <tr key={item.id} className="hover:bg-rose-50/40 even:bg-slate-50/50 transition-colors">
                            {/* Ticket ID */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                              {item.ticket_number ? (
                                <span className="font-mono font-bold text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md inline-block shadow-2xs">
                                  {item.ticket_number}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs italic">N/A</span>
                              )}
                            </td>

                            {/* Channel & Time */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-300 bg-slate-100 text-slate-700">
                                {item.channel}
                              </span>
                              <p className="text-[11px] text-slate-500 font-medium mt-1">{item.received_at}</p>
                            </td>

                            {/* Citizen Info */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                              <p className="font-bold text-slate-900 text-xs">{item.citizen_name}</p>
                              <p className="text-slate-600 font-mono text-[11px] mt-0.5">{item.citizen_phone}</p>
                            </td>

                            {/* Ward & Locality */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-300">
                                Ward {item.ward_number}
                              </span>
                              <p className="text-slate-600 text-[11px] mt-1 leading-snug">{item.address}</p>
                              {item.landmark && (
                                <p className="text-slate-400 text-[10px] mt-0.5">Near: {item.landmark}</p>
                              )}
                            </td>

                            {/* Reported Problem */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                              <p className="font-bold text-slate-900 text-xs leading-snug">{item.category_name}</p>
                              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed line-clamp-2" title={item.problem_description}>
                                {item.problem_description}
                              </p>
                            </td>

                            {/* Rejection Reason */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle">
                              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-snug">
                                <strong className="text-rose-900 font-bold block text-[11px] mb-0.5">Audit Reason:</strong>
                                <span>{item.rejection_reason}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5 border-r border-slate-400 align-middle text-center whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-rose-50 text-rose-800 border-rose-300">
                                REJECTED
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap print:hidden">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`tel:${item.citizen_phone}`}
                                  title="Call Citizen"
                                  className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center justify-center shrink-0"
                                >
                                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                                </a>
                                <a
                                  href={`https://wa.me/${cleanPhoneForWhatsApp(item.citizen_phone)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="WhatsApp Citizen"
                                  className="p-1.5 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors inline-flex items-center justify-center shrink-0"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: 60 WARDS DIRECTORY */}
          {activeTab === 'WARDS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Chittorgarh Nagar Parishad: Parshad List (All 60 Wards)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ward mapping, elected parshads, phone contacts, and key municipal landmarks
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Quick Parshad Search */}
                  <div className="relative w-64 print:hidden">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={parshadSearch}
                      onChange={(e) => setParshadSearch(e.target.value)}
                      placeholder="Search ward, parshad, landmark..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {filteredWards.length} / 60 Parshads
                  </span>

                  {/* Export & Print */}
                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={handleExportWardsCsv}
                      title="Export 60 Wards Parshad Directory to Excel CSV"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Excel (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerPrint}
                      title="Print 60 Wards Parshad List or Save as PDF"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[600px] print:max-h-none print:overflow-visible border-t-2 border-slate-400 print:border-none">
                <table className="w-full min-w-[1050px] print:min-w-full border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="sticky top-0 print:static bg-slate-100 border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 z-10 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[100px] min-w-[100px] whitespace-nowrap">Ward</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[190px] min-w-[190px]">Ward Name</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[130px] min-w-[130px] whitespace-nowrap">Zone</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px]">Parshad</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[160px] min-w-[160px] whitespace-nowrap">Parshad Phone Number</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[200px]">Key Landmarks</th>
                      <th className="px-4 py-3.5 text-right w-[140px] min-w-[140px] whitespace-nowrap print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 bg-white">
                    {filteredWards.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No parshads match your search "{parshadSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredWards.map((ward) => (
                        <tr key={ward.ward_number} className="hover:bg-blue-50/70 even:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-mono font-bold text-blue-600 whitespace-nowrap">
                            Ward {ward.ward_number}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-semibold text-slate-900">
                            {(ward.ward_name || '').replace(new RegExp(`^Ward\\s*${ward.ward_number}\\s*[-–—:]*\\s*`, 'i'), '').trim() || ward.ward_name}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-300">
                              {ward.zone}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-bold text-slate-800">
                            {ward.councillor_name}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-mono whitespace-nowrap">
                            <a href={`tel:${ward.councillor_phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                              <Phone className="w-3 h-3 text-blue-500" />
                              <span>{ward.councillor_phone}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle text-slate-600 text-xs">
                            {ward.key_landmarks}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap print:hidden">
                            <button
                              type="button"
                              onClick={() => setEditingWard(ward)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title={`Edit Ward ${ward.ward_number} Parshad Details`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Parshad</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {/* TAB: MUNICIPAL DEPARTMENTS DIRECTORY */}
          {activeTab === 'DEPARTMENTS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Nagar Parishad Chittorgarh: Municipal Departments Directory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official departments, nodal executive officers, contact details, and resolution SLAs
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Department Search */}
                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={departmentSearch}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                      placeholder="Search dept, officer..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {filteredDepartments.length} Departments
                  </span>

                  {/* Add Department Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDepartment(null);
                      setIsDepartmentModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Department</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border-t-2 border-slate-400">
                <table className="w-full min-w-[1000px] border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[110px] min-w-[110px] whitespace-nowrap">Code</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[220px]">Department Name</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[150px] min-w-[150px] whitespace-nowrap">Standard SLA</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[190px] min-w-[190px]">Nodal Officer</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px] whitespace-nowrap">Officer Phone</th>
                      <th className="px-4 py-3.5 text-right w-[170px] min-w-[170px] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 bg-white">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No departments match your search "{departmentSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-blue-50/70 even:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-mono font-bold text-blue-600 whitespace-nowrap">
                            {dept.code}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-bold text-slate-900">
                            {dept.name}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                              <ClockAlert className="w-3 h-3 text-blue-600" />
                              <span>{dept.default_sla_hours} Hours</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-semibold text-slate-800">
                            {dept.head_officer_name}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle font-mono whitespace-nowrap">
                            <a href={`tel:${dept.head_officer_phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                              <Phone className="w-3 h-3 text-blue-500" />
                              <span>{dept.head_officer_phone}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDepartment(dept);
                                  setIsDepartmentModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`Edit ${dept.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteDepartment(dept)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`Delete ${dept.name} permanently`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {/* TAB: SETTINGS & WORKING HOURS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              {/* Row 1: Official Municipal Working Hours */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ClockAlert className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Official Municipal Working Hours &amp; Intake Rules (Workflow A &amp; B)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    MUNICIPAL POLICY
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-medium text-slate-500 block">Helpline Intake Hours:</span>
                    <span className="font-bold text-slate-900 text-sm">10:00 AM – 6:00 PM IST</span>
                    <p className="text-[11px] text-slate-500 pt-0.5">कार्यालयीन कार्य दिवस: सोमवार से शनिवार</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-medium text-slate-500 block">WhatsApp &amp; Helpline Reception:</span>
                    <span className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Manual Operator Verification
                    </span>
                    <p className="text-[11px] text-slate-500 pt-0.5">हेल्पलाइन ऑपरेटर द्वारा नागरिक शिकायतों का मैन्युअल सत्यापन व प्रविष्टि</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-medium text-slate-500 block">After-Hours Queue Processing:</span>
                    <span className="font-bold text-slate-900 text-sm">Next Working Day at 10:00 AM</span>
                    <p className="text-[11px] text-slate-500 pt-0.5">समय समाप्ति पश्चात प्राप्त शिकायतों का आगामी कार्यदिवस निस्तारण</p>
                  </div>
                </div>
              </div>

              {/* Row 2: Configured Department SLA Deadlines & Concerned Officers (Dynamic from departments) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Configured Department SLA Deadlines &amp; Concerned Officers</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      सभी विभागों के लिए मानक समय सीमा (SLA) एवं जिम्मेदार नोडल अधिकारी सेट करें — शिकायत इंटेक व निस्तारण में यही डेटा लागू होता है।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingDepartment(null);
                      setIsDepartmentModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Department</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px] text-slate-700 select-none">
                      <tr>
                        <th className="px-4 py-3.5 border-r border-slate-200 w-24">Code</th>
                        <th className="px-4 py-3.5 border-r border-slate-200">Department Name</th>
                        <th className="px-4 py-3.5 border-r border-slate-200 w-48">Configured SLA Deadline</th>
                        <th className="px-4 py-3.5 border-r border-slate-200 w-56">Concerned Officer (जिम्मेदार अधिकारी)</th>
                        <th className="px-4 py-3.5 border-r border-slate-200 w-44">Officer Phone</th>
                        <th className="px-4 py-3.5 text-right w-52">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {departments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-blue-50/60 transition-colors">
                          <td className="px-4 py-3.5 border-r border-slate-200 font-mono font-bold text-blue-600">
                            {dept.code}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-200 font-semibold text-slate-900">
                            {dept.name}
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs">
                              <ClockAlert className="w-3.5 h-3.5 text-blue-600" />
                              <span>{dept.default_sla_hours} Hours</span>
                              <span className="text-[10px] text-blue-600 font-normal">
                                {dept.default_sla_hours >= 720 ? '(1 Month)' : dept.default_sla_hours >= 168 ? '(1 Week)' : dept.default_sla_hours >= 24 ? `(${Math.round(dept.default_sla_hours / 24)}d)` : ''}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-200 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-[10px] font-bold">
                                {dept.head_officer_name.charAt(0)}
                              </div>
                              <span className="truncate">{dept.head_officer_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-200 font-mono">
                            <a href={`tel:${dept.head_officer_phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{dept.head_officer_phone}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDepartment(dept);
                                  setIsDepartmentModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`Edit SLA and Officer for ${dept.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteDepartment(dept)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`Delete ${dept.name} permanently`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HELP & DEVELOPER SUPPORT */}
          {activeTab === 'SUPPORT' && (
            <HelpSupportView />
          )}

        </main>

        {/* Global Municipal Admin Footer (Civic Leadership & ChittorTech Credits) */}
        <div className="px-6 pb-6 print:hidden">
          <AdminFooter />
        </div>
      </div>

      {/* 3. MODALS */}
      {selectedTicketForClosure && (
        <TwoStepClosureModal
          ticket={selectedTicketForClosure}
          onClose={() => setSelectedTicketForClosure(null)}
          onConfirmAuthority={handleAuthorityConfirm}
          onConfirmCitizen={handleCitizenConfirm}
        />
      )}

      {selectedIntakeForVerification && (
        <IntakeVerificationModal
          intake={selectedIntakeForVerification}
          onClose={() => setSelectedIntakeForVerification(null)}
          onAccept={handleAcceptIntake}
          onReject={handleRejectIntake}
        />
      )}

      {showNewComplaintModal && (
        <NewComplaintModal
          wards={wards}
          departments={departments}
          nextTicketNumber={nextTicketNumber}
          defaultDecision={modalDefaultDecision}
          onClose={() => setShowNewComplaintModal(false)}
          onSubmit={(data) => {
            if (data.decision === 'ACCEPT') {
              const dept = departments.find(d => d.name === data.department_name) || departments[0];
              const wardObj = wards.find(w => w.ward_number === data.ward_number);
              const ticketNum = generateNextTicketNumber(tickets);
              const deadlineHours = data.sla_hours || dept.default_sla_hours || 48;

              let deadlineMs = Math.round(deadlineHours * 3600 * 1000);
              if (deadlineHours < 0.01) {
                deadlineMs = 30 * 1000;
              } else if (deadlineHours < 0.05) {
                deadlineMs = 60 * 1000;
              }
              const deadlineDate = new Date(Date.now() + deadlineMs);

              const formatDeadlineDisplay = (hours: number, date: Date) => {
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                if (hours < 0.01) return `30s Target (${timeStr})`;
                if (hours < 0.05) return `1m Target (${timeStr})`;
                const datePart = date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Kolkata' });
                const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                return `${datePart}, ${timePart}`;
              };

              const formatSlaLabel = (hours: number) => {
                if (hours < 0.01) return '30 Seconds (⚡ Fast Testing)';
                if (hours < 0.05) return '1 Minute (⚡ Fast Testing)';
                return `${hours} Hours`;
              };

              // 1. Create official municipal ticket directly
              const newTicket: Ticket = {
                id: `tkt-${Date.now()}`,
                ticket_number: ticketNum,
                citizen_name: data.citizen_name,
                citizen_phone: data.citizen_phone,
                ward_number: data.ward_number,
                address: data.address,
                landmark: data.landmark || '',
                category_name: data.category_name,
                department_name: dept.name,
                problem_description: data.problem_description,
                status: 'REGISTERED',
                forwarding_option: data.forwarding_option || 'COUNCILLOR_AND_OFFICER',
                sla_hours: deadlineHours,
                sla_deadline: formatDeadlineDisplay(deadlineHours, deadlineDate),
                sla_deadline_iso: deadlineDate.toISOString(),
                is_overdue: false,
                is_escalated: false,
                assigned_officer_name: dept.head_officer_name,
                assigned_officer_phone: dept.head_officer_phone,
                registration_time: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                authority_confirmed: false
              };

              onAddTicket(newTicket);

              // 2. Build official pre-filled WhatsApp messages
              const citizenMsg = `स्मार्ट नगर परिषद चित्तौड़गढ़ - शिकायत पावती\nनमस्ते ${data.citizen_name} जी,\nआपकी शिकायत सत्यापित कर पोर्टल पर दर्ज कर ली गई है।\n\n📋 टिकट सं.: ${ticketNum}\n📍 वार्ड: वार्ड ${data.ward_number}\n🏢 विभाग: ${dept.name}\n📍 स्थान: ${data.address}\n📝 समस्या: ${data.problem_description}\n⏱️ निस्तारण समय (SLA): ${formatSlaLabel(deadlineHours)}\n\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़`;
              const councillorMsg = `स्मार्ट नगर परिषद चित्तौड़गढ़ - वार्ड शिकायत सूचना\nआदरणीय पार्षद महोदय (${wardObj?.councillor_name || 'पार्षद'} जी),\nआपके वार्ड ${data.ward_number} से एक नई शिकायत सत्यापित होकर दर्ज हुई है:\n\n📋 टिकट सं.: ${ticketNum}\n👤 नागरिक: ${data.citizen_name} (${data.citizen_phone})\n📍 स्थान: ${data.address}\n🏢 विभाग: ${dept.name}\n📝 समस्या विवरण: ${data.problem_description}\n⏱️ लक्षित SLA समय: ${formatSlaLabel(deadlineHours)}\n\nकृपया संज्ञान लेकर समाधान में सहयोग करें।\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़`;
              const officerMsg = `कार्यालय आदेश / प्राथमिकता कार्य:\nस्मार्ट नगर परिषद चित्तौड़गढ़ शिकायत निवारण पोर्टल\n\n📋 टिकट सं.: ${ticketNum}\n🏢 विभाग: ${dept.name}\n👤 नागरिक: ${data.citizen_name} (${data.citizen_phone})\n📍 वार्ड व पता: वार्ड ${data.ward_number}, ${data.address}\n📝 समस्या विवरण: ${data.problem_description}\n⏱️ समाधान SLA सीमा: ${formatSlaLabel(deadlineHours)}\n\nकृपया प्राथमिकता के आधार पर कार्य दल भेजकर समाधान सुनिश्चित करें।\n- पोर्टल मैनेजर, नगर परिषद चित्तौड़गढ़`;

              // 3. Log notifications
              onAddNotification({
                id: `notif-${Date.now()}-cit`,
                ticket_number: ticketNum,
                recipient_type: 'CITIZEN',
                recipient_name: `${data.citizen_name} (Citizen)`,
                recipient_phone: data.citizen_phone,
                channel: 'WHATSAPP',
                template_name: 'snp_citizen_ack',
                message_content: citizenMsg,
                status: 'DELIVERED',
                sent_at: 'Just now'
              });

              onAddNotification({
                id: `notif-${Date.now()}-c`,
                ticket_number: ticketNum,
                recipient_type: 'COUNCILLOR',
                recipient_name: `${wardObj?.councillor_name || 'Councillor'} (Ward ${data.ward_number})`,
                recipient_phone: wardObj?.councillor_phone || '+91 98290 00000',
                channel: 'WHATSAPP',
                template_name: 'snp_councillor_forward',
                message_content: councillorMsg,
                status: 'DELIVERED',
                sent_at: 'Just now'
              });

              onAddNotification({
                id: `notif-${Date.now()}-o`,
                ticket_number: ticketNum,
                recipient_type: 'OFFICER',
                recipient_name: `${dept.head_officer_name} (${dept.code})`,
                recipient_phone: dept.head_officer_phone,
                channel: 'WHATSAPP',
                template_name: 'snp_officer_assign',
                message_content: officerMsg,
                status: 'DELIVERED',
                sent_at: 'Just now'
              });

              const waActions: WhatsAppAction[] = [
                {
                  role: 'CITIZEN',
                  label: `Citizen Confirmation (नागरिक: ${data.citizen_name})`,
                  phone: data.citizen_phone,
                  recipientName: data.citizen_name,
                  message: citizenMsg
                },
                {
                  role: 'COUNCILLOR',
                  label: `Ward Councillor (वार्ड पार्षद: ${wardObj?.councillor_name || 'Councillor'})`,
                  phone: wardObj?.councillor_phone || '+91 98290 00000',
                  recipientName: wardObj?.councillor_name,
                  message: councillorMsg
                },
                {
                  role: 'OFFICER',
                  label: `Nodal Officer (विभाग अधिकारी: ${dept.head_officer_name})`,
                  phone: dept.head_officer_phone,
                  recipientName: dept.head_officer_name,
                  message: officerMsg
                }
              ];

              setShowNewComplaintModal(false);
              setActiveTab('TICKETS');
              setSelectedStatus('ALL');

              setStatusModalConfig({
                isOpen: true,
                type: 'success',
                title: 'Official Ticket Generated!',
                subtitle: `Complaint from ${data.citizen_name} has been verified and registered as Official Ticket ${ticketNum}.`,
                details: [
                  `Ticket Number: ${ticketNum}`,
                  `Citizen: ${data.citizen_name} (${data.citizen_phone})`,
                  `Ward & Locality: Ward ${data.ward_number} - ${data.address}`,
                  `Department: ${dept.name} (${dept.head_officer_name})`,
                  `Resolution SLA: ${formatSlaLabel(deadlineHours)}`
                ],
                whatsAppActions: waActions,
                confirmText: 'OK'
              });
              return;
            }

            if (data.decision === 'REJECT') {
              // 1. Assign sequential Ticket ID for rejected complaint
              const ticketNum = data.ticket_number || generateNextTicketNumber(tickets);

              // 2. Persist to Supabase tickets table as an official REJECTED ticket
              const rejectedTicket: Ticket = {
                id: `ticket-${Date.now()}`,
                ticket_number: ticketNum,
                citizen_name: data.citizen_name,
                citizen_phone: data.citizen_phone,
                ward_number: data.ward_number,
                address: data.address || 'N/A (Rejected)',
                landmark: data.landmark || '',
                category_name: data.category_name,
                department_name: data.department_name || departments[0]?.name || 'General Municipal Administration',
                problem_description: data.problem_description || `Rejection: ${data.rejection_reason}`,
                status: 'REJECTED',
                forwarding_option: 'COUNCILLOR_AND_OFFICER',
                sla_hours: 0,
                sla_deadline: 'Rejected',
                sla_deadline_iso: new Date().toISOString(),
                is_overdue: false,
                is_escalated: false,
                escalation_notes: data.rejection_reason || 'Rejected by Portal Manager',
                assigned_officer_name: 'N/A (Rejected)',
                assigned_officer_phone: 'N/A',
                registration_time: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                registration_time_iso: new Date().toISOString(),
                closed_at: new Date().toISOString(),
                authority_confirmed: false,
                citizen_satisfied: false
              };

              onAddTicket(rejectedTicket);

              // 3. Build WhatsApp notice with official Ticket Number
              const rejectHindiNotice = `स्मार्ट नगर परिषद चित्तौड़गढ़ - शिकायत निस्तारण सूचना\nनमस्ते ${data.citizen_name} जी,\n\nआपकी शिकायत संख्या: ${ticketNum}\n📍 वार्ड: वार्ड ${data.ward_number}\n📝 श्रेणी: ${data.category_name}\nनिर्णय: ❌ अस्वीकृत (Rejected)\n\nअस्वीकृति का आधिकारिक कारण:\n"${data.rejection_reason || 'दिशानिर्देशों के अनुरूप नहीं'}"\n\nसूचित किया जाता है कि उपरोक्त कारण से आपकी शिकायत को आधिकारिक रूप से स्वीकार नहीं किया गया है। किसी भी स्पष्टीकरण हेतु नगर परिषद कंट्रोल रूम (01472-240001) पर संपर्क करें।\n\n- पोर्टल कंट्रोल रूम, नगर परिषद चित्तौड़गढ़ 🙏`;

              if (data.notify_citizen) {
                const rejectNotif: NotificationLog = {
                  id: `notif-${Date.now()}`,
                  ticket_number: ticketNum,
                  recipient_type: 'CITIZEN',
                  recipient_name: data.citizen_name,
                  recipient_phone: data.citizen_phone,
                  channel: 'WHATSAPP',
                  template_name: 'snp_rejection_citizen_notice',
                  message_content: rejectHindiNotice,
                  status: 'DELIVERED',
                  sent_at: 'Just now'
                };
                onAddNotification(rejectNotif);
              }

              const waActions: WhatsAppAction[] = [
                {
                  role: 'CITIZEN',
                  label: `Send WhatsApp Rejection Notice (${data.citizen_name})`,
                  phone: data.citizen_phone,
                  recipientName: data.citizen_name,
                  message: rejectHindiNotice
                }
              ];

              setShowNewComplaintModal(false);
              setActiveTab('REJECTED');

              setStatusModalConfig({
                isOpen: true,
                type: 'warning',
                title: 'Official Ticket Assigned & Rejected!',
                subtitle: `Complaint from ${data.citizen_name} has been assigned Ticket ${ticketNum} and recorded in Supabase.`,
                details: [
                  `Assigned Ticket ID: ${ticketNum}`,
                  `Citizen: ${data.citizen_name} (${data.citizen_phone})`,
                  `Ward & Locality: Ward ${data.ward_number} - ${data.address}`,
                  `Rejection Reason: ${data.rejection_reason || 'Rejected by Portal Manager'}`,
                  `Citizen WhatsApp Notice: ${data.notify_citizen ? 'Dispatched' : 'Skipped / Optional'}`
                ],
                whatsAppActions: waActions,
                confirmText: 'OK'
              });
              return;
            }
          }}
        />
      )}

      {/* Edit Parshad Modal (60 Wards) */}
      <EditParshadModal
        isOpen={Boolean(editingWard)}
        ward={editingWard}
        onClose={() => setEditingWard(null)}
        onSave={handleSaveWard}
      />

      {/* Add & Edit Municipal Department Modal */}
      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        department={editingDepartment}
        onClose={() => {
          setIsDepartmentModalOpen(false);
          setEditingDepartment(null);
        }}
        onSave={handleSaveDepartment}
        onDelete={(deptId) => {
          const dept = departments.find(d => d.id === deptId) || editingDepartment;
          if (dept) {
            handleConfirmDeleteDepartment(dept);
          }
        }}
      />

      {/* Global Status / Confirmation / Success Modal (AMPLR Health Style) */}
      <StatusModal
        config={statusModalConfig}
        onClose={() => setStatusModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
