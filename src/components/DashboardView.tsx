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
import { TabGuideBanner } from './TabGuideBanner';
import { AdminFooter } from './AdminFooter';
import { HelpSupportView } from './HelpSupportView';
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
  Bell, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  Pencil,
  Sparkles,
  Headphones
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
}

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
  onAddIntake,
  onAddNotification,
  onUpdateWard,
  onUpdateDepartment,
  onAddDepartment
}: DashboardViewProps) => {

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INTAKE' | 'TICKETS' | 'CLOSED' | 'SLA' | 'WARDS' | 'DEPARTMENTS' | 'SETTINGS' | 'SUPPORT'>('DASHBOARD');
  
  // Advanced Filters State
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state for scalable handling of hundreds of complaints
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWard, selectedDepartment, selectedStatus, searchQuery, activeTab]);

  // Modals state
  const [selectedTicketForClosure, setSelectedTicketForClosure] = useState<Ticket | null>(null);
  const [selectedIntakeForVerification, setSelectedIntakeForVerification] = useState<IntakeComplaint | null>(null);
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [modalDefaultDecision, setModalDefaultDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [intakeFilterStatus, setIntakeFilterStatus] = useState<'ALL' | 'PENDING_REVIEW' | 'REJECTED' | 'ACCEPTED'>('ALL');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

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

  // Derived filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (activeTab === 'CLOSED' && ticket.status !== 'CLOSED') return false;
      if (selectedWard !== 'ALL' && ticket.ward_number.toString() !== selectedWard) return false;
      if (selectedDepartment !== 'ALL' && ticket.department_name !== selectedDepartment) return false;
      if (selectedStatus !== 'ALL' && ticket.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          ticket.ticket_number.toLowerCase().includes(q) ||
          ticket.citizen_name.toLowerCase().includes(q) ||
          ticket.citizen_phone.includes(q) ||
          ticket.address.toLowerCase().includes(q) ||
          ticket.category_name.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tickets, activeTab, selectedWard, selectedDepartment, selectedStatus, searchQuery]);

  // Derived active tickets based on SLA / All / Closed
  const activeTicketsList = useMemo(() => {
    if (activeTab === 'SLA') {
      return filteredTickets.filter(t => t.is_overdue || t.is_escalated);
    }
    return filteredTickets;
  }, [activeTab, filteredTickets]);

  // Pagination calculation
  const totalItems = activeTicketsList.length;
  const totalPages = pageSize >= 99999 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTickets = useMemo(() => {
    if (pageSize >= 99999) return activeTicketsList;
    const startIndex = (currentPage - 1) * pageSize;
    return activeTicketsList.slice(startIndex, startIndex + pageSize);
  }, [activeTicketsList, currentPage, pageSize]);

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

  // Real-time KPI Counts (from Master Prompt Section 9)
  const kpis = useMemo(() => {
    const todayRegistered = tickets.filter(t => t.registration_time.includes('2026-10-20') || t.registration_time.includes('Today')).length;
    const totalComplaints = tickets.length;
    const pendingComplaints = tickets.filter(t => t.status === 'REGISTERED' || t.status === 'IN_PROGRESS' || t.status === 'RESOLVED_AWAITING_CITIZEN').length;
    const confirmedResolvedClosed = tickets.filter(t => t.status === 'CLOSED').length;
    const overdueComplaints = tickets.filter(t => t.is_overdue && t.status !== 'CLOSED').length;
    const escalatedComplaints = tickets.filter(t => t.is_escalated && t.status !== 'CLOSED').length;
    const pendingIntakes = intakes.filter(i => i.status === 'PENDING_REVIEW').length;

    return {
      todayRegistered,
      totalComplaints,
      pendingComplaints,
      confirmedResolvedClosed,
      overdueComplaints,
      escalatedComplaints,
      pendingIntakes
    };
  }, [tickets, intakes]);

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
        closed_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
      // Citizen Unsatisfied: Reopen ticket and alert officer
      const updated: Ticket = {
        ...target,
        citizen_satisfied: false,
        citizen_feedback: feedback,
        status: 'REOPENED',
        authority_confirmed: false // reset for re-verification
      };
      onUpdateTicket(updated);
      setStatusModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Reopened!',
        subtitle: `Ticket ${target.ticket_number} has been returned to officer ${target.assigned_officer_name} for priority resolution.`,
        details: [
          `Ticket Number: ${target.ticket_number}`,
          `Citizen Feedback: ${feedback || 'Reported Unresolved'}`
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
    const nextNum = 840 + tickets.length + 1;
    const ticketNum = `SNP-2026-0${nextNum}`;
    const deadlineHours = slaHours;
    let deadlineMs = Math.round(deadlineHours * 3600 * 1000);
    if (deadlineHours < 0.01) {
      deadlineMs = 30 * 1000;
    } else if (deadlineHours < 0.05) {
      deadlineMs = 60 * 1000;
    }
    const deadlineDate = new Date(Date.now() + deadlineMs);

    const formatDeadlineDisplay = (hours: number, date: Date) => {
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (hours < 0.01) return `30s Target (${timeStr})`;
      if (hours < 0.05) return `1m Target (${timeStr})`;
      return date.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
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

    onUpdateIntake({
      ...intake,
      status: 'REJECTED',
      rejection_reason: reason
    });

    setStatusModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Rejected!',
      subtitle: `Complaint from ${intake.citizen_name} has been rejected and permanently recorded in the municipal audit trail.`,
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
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden min-w-[1024px]">
      {/* 1. LEFT SIDEBAR NAVIGATION (Compact & Optimized for Maximum Content Area) */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Sidebar Header Brand: Nagar Parishad Portal */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
            <NagarParishadLogo 
              size="sm" 
              theme="dark"
              hindiTitle="नगर परिषद पोर्टल"
              englishSubtitle="Nagar Parishad Portal"
            />
            <div className="mt-1.5 text-[9px] uppercase font-mono tracking-wider text-slate-400 pl-0.5">
              ADMIN PORTAL &bull; CHITTORGARH
            </div>
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
                  onClick={() => setActiveTab('DASHBOARD')}
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
                <button
                  type="button"
                  onClick={() => setActiveTab('INTAKE')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'INTAKE'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-3.5 h-3.5 shrink-0" />
                    <span>Intake Queue</span>
                  </div>
                  {kpis.pendingIntakes > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px]">
                      {kpis.pendingIntakes}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('TICKETS');
                    setSelectedStatus('ALL');
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
                    {tickets.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('CLOSED');
                    setSelectedStatus('CLOSED');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'CLOSED'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Closed Complaints</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                    {kpis.confirmedResolvedClosed}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SLA')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'SLA'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClockAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>SLA &amp; Overdue</span>
                  </div>
                  {kpis.overdueComplaints > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px] animate-pulse">
                      {kpis.overdueComplaints}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('WARDS')}
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
                  onClick={() => setActiveTab('DEPARTMENTS')}
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
                  onClick={() => setActiveTab('SETTINGS')}
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
                  onClick={() => setActiveTab('SUPPORT')}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar (Matches Reference Screenshot 2) */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {activeTab === 'WARDS' 
                ? 'Parshad List' 
                : activeTab === 'CLOSED'
                ? 'Closed Complaints'
                : activeTab === 'TICKETS'
                ? 'All Complaints'
                : activeTab === 'INTAKE'
                ? 'Intake Queue'
                : activeTab === 'SLA'
                ? 'SLA & Overdue'
                : activeTab === 'SUPPORT'
                ? 'Help & Developer Support'
                : activeTab.toLowerCase()}
            </h2>
            <span className="text-xs text-slate-400 font-normal">
              &bull; Nagar Parishad Chittorgarh Live Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Universal Search Bar */}
            <div className="relative w-64 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, citizen, ward, street..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Quick action buttons */}
            <button
              type="button"
              onClick={() => {
                setStatusModalConfig({
                  isOpen: true,
                  type: 'success',
                  title: 'Synchronized!',
                  subtitle: 'Central database records have been refreshed and updated.',
                  confirmText: 'OK'
                });
              }}
              title="Refresh Data"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Interactive Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                title="System Notifications & Overdue Alerts"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {kpis.overdueComplaints > 0 ? (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold text-[9px] animate-pulse shadow-xs">
                    {kpis.overdueComplaints}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotificationsDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-left space-y-3 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-900 text-xs">Live System Alerts</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {kpis.overdueComplaints} Breached
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {tickets.filter(t => t.is_overdue && t.status !== 'CLOSED').length === 0 ? (
                      <div className="py-6 text-center text-slate-400 space-y-1.5">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80" />
                        <p className="text-xs font-semibold text-slate-700">All SLAs Healthy</p>
                        <p className="text-[10px] text-slate-400">No complaints have breached target resolution deadlines.</p>
                      </div>
                    ) : (
                      tickets.filter(t => t.is_overdue && t.status !== 'CLOSED').map(ticket => (
                        <div 
                          key={ticket.id}
                          onClick={() => {
                            setActiveTab('SLA');
                            setShowNotificationsDropdown(false);
                          }}
                          className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100/70 transition-colors cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              SLA Breached: {ticket.ticket_number}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-200/80 px-1.5 py-0.2 rounded">
                              Ward {ticket.ward_number}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 truncate font-medium">
                            {ticket.category_name} &bull; {ticket.citizen_name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-rose-700 pt-0.5">
                            <span>Due was: {ticket.sla_deadline}</span>
                            <span className="font-bold underline">Inspect ➔</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {kpis.overdueComplaints > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('SLA');
                        setShowNotificationsDropdown(false);
                      }}
                      className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs text-center transition-colors shadow-xs cursor-pointer"
                    >
                      Inspect All {kpis.overdueComplaints} Breached Complaints
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Register New Complaint button (Prominent Primary Button) */}
            <button
              type="button"
              onClick={() => {
                setModalDefaultDecision('ACCEPT');
                setShowNewComplaintModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-blue-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Register Complaint</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-6">
          {(activeTab === 'DASHBOARD' || activeTab === 'TICKETS' || activeTab === 'CLOSED' || activeTab === 'SLA') && (
            <>
              {/* Greeting & Subtitle (Matches Reference Screenshot 2) */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Good morning, {userRole.replace('_', ' ')} 👋
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Here's what's happening across Nagar Parishad Chittorgarh today.
                  </p>
                </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync: Chittorgarh Central DB Connected
              </span>
            </div>
          </div>

          {/* ADVANCED FILTERS CARD (Matches Reference Screenshot 2) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* From Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">FROM DATE</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
                    />
                  </div>

                  {/* To Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TO DATE</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
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
                      {wards.map((w) => (
                        <option key={w.ward_number} value={w.ward_number}>
                          Ward {w.ward_number} - {w.ward_name}
                        </option>
                      ))}
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

                {/* Helpful Note Bar (Matches Screenshot 2) */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    To view complaints for a <strong>single specific date</strong>, simply select that same date in both the "From Date" and "To Date" fields.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 6 OFFICIAL KPI CARDS (Workflow D: Chairman/Executive & Admin Monitoring) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
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

            {/* Card 3: Pending In-Progress */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('TICKETS');
                setSelectedStatus('IN_PROGRESS');
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
                <span>In field execution</span>
                <span className="text-amber-700 font-semibold text-[9px]">Filter ➔</span>
              </div>
            </button>

            {/* Card 4: Confirmed Closed */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('CLOSED');
                setSelectedStatus('CLOSED');
              }}
              title="Click to view certified closed complaints"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-emerald-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Confirmed Closed</span>
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

            {/* Card 5: Overdue Complaints */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('SLA');
              }}
              title="Click to inspect overdue SLA complaints"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-left hover:border-rose-400 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Overdue Complaints</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">
                {kpis.overdueComplaints}
              </p>
              <div className="text-[10px] text-rose-600 font-semibold flex items-center justify-between">
                <span>SLA Breached</span>
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

          {/* TAB: DASHBOARD / ALL TICKETS / CLOSED / SLA */}
          {(activeTab === 'DASHBOARD' || activeTab === 'TICKETS' || activeTab === 'CLOSED' || activeTab === 'SLA') && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeTab === 'SLA' 
                      ? 'SLA Breached & Urgent Escalations' 
                      : activeTab === 'CLOSED'
                      ? 'Closed & Resolved Complaints'
                      : 'Complaints & Official Tickets Management'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'SLA'
                      ? `Showing ${activeTicketsList.length} critical complaints requiring immediate action`
                      : activeTab === 'CLOSED'
                      ? `Showing ${activeTicketsList.length} two-step certified closed complaints`
                      : `Showing ${activeTicketsList.length} complaints across Chittorgarh Nagar Parishad`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Quick Filter Tabs */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'CLOSED') setActiveTab('TICKETS');
                        setSelectedStatus('ALL');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab !== 'CLOSED' && selectedStatus === 'ALL'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({tickets.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'CLOSED') setActiveTab('TICKETS');
                        setSelectedStatus('REGISTERED');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab !== 'CLOSED' && selectedStatus === 'REGISTERED'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Registered ({tickets.filter(t => t.status === 'REGISTERED').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'CLOSED') setActiveTab('TICKETS');
                        setSelectedStatus('IN_PROGRESS');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab !== 'CLOSED' && (selectedStatus === 'IN_PROGRESS' || selectedStatus === 'RESOLVED_AWAITING_CITIZEN')
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      In Progress ({tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'RESOLVED_AWAITING_CITIZEN').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('CLOSED');
                        setSelectedStatus('CLOSED');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'CLOSED' || selectedStatus === 'CLOSED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Closed ({kpis.confirmedResolvedClosed})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 hidden md:inline">Dropdown:</span>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedStatus(val);
                        if (val === 'CLOSED') {
                          setActiveTab('CLOSED');
                        } else if (activeTab === 'CLOSED' && val !== 'CLOSED') {
                          setActiveTab('TICKETS');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white shadow-2xs"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="REGISTERED">Registered</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED_AWAITING_CITIZEN">Resolved (Awaiting Citizen)</option>
                      <option value="CLOSED">Closed (Verified)</option>
                      <option value="REOPENED">Reopened</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table Container with Horizontal Scaling & Visible Grid Lines */}
              <div className="overflow-x-auto border-t-2 border-slate-400">
                <table className="w-full min-w-[1020px] border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[140px] min-w-[140px] whitespace-nowrap">Ticket ID</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px] whitespace-nowrap">Citizen &amp; Contact</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[190px] min-w-[190px]">Ward &amp; Location</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[220px]">Department &amp; Problem</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[160px] min-w-[160px] whitespace-nowrap">SLA &amp; Deadline</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[150px] min-w-[150px] text-center whitespace-nowrap">Status</th>
                      <th className="px-4 py-3.5 text-right w-[200px] min-w-[200px] whitespace-nowrap sticky right-0 bg-slate-100 border-l border-slate-400 z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 bg-white">
                    {paginatedTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          No matching complaints found for the current filter criteria.
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
                                {ticket.sla_deadline}
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

                          {/* Status */}
                          <td className="px-4 py-3.5 border-r border-slate-400 align-middle text-center whitespace-nowrap">
                            {ticket.status !== 'CLOSED' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedTicketForClosure(ticket)}
                                title="Click to verify & close complaint"
                                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border cursor-pointer hover:opacity-85 transition-opacity ${
                                  ticket.status === 'RESOLVED_AWAITING_CITIZEN'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300'
                                    : ticket.status === 'REOPENED'
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}
                              >
                                {ticket.status.replace(/_/g, ' ')}
                              </button>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap shadow-2xs border bg-emerald-50 text-emerald-800 border-emerald-300">
                                CLOSED
                              </span>
                            )}
                          </td>

                          {/* Actions (Sticky Right Column) */}
                          <td className="px-3 py-3.5 align-middle text-right whitespace-nowrap sticky right-0 bg-white border-l border-slate-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              {ticket.status !== 'CLOSED' ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTicketForClosure(ticket)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                                  title="Mandatory Two-Step Complaint Closure (Verify & Close)"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>🛡️ 2-Step Closure</span>
                                </button>
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
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs inline-flex items-center gap-1 shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </button>
                              <a
                                href={`tel:${ticket.citizen_phone}`}
                                title="Call Citizen"
                                className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center justify-center shrink-0"
                              >
                                <Phone className="w-4 h-4 text-blue-600" />
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
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 select-none">
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

            {/* Workflow Flowcharts & Guides (Placed at bottom, collapsed by default) */}
            {activeTab === 'DASHBOARD' && <TabGuideBanner tabKey="DASHBOARD" />}
            {activeTab === 'TICKETS' && <TabGuideBanner tabKey="TICKETS" />}
            {activeTab === 'CLOSED' && <TabGuideBanner tabKey="TICKETS" />}
            {activeTab === 'SLA' && <TabGuideBanner tabKey="SLA" />}
          </div>
          )}

          {/* TAB: INTAKE QUEUE (Helpline Calls & WhatsApp Intake) */}
          {activeTab === 'INTAKE' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
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
                </div>
              </div>

              <div className="overflow-x-auto border-t-2 border-slate-400">
                <table className="w-full min-w-[1050px] border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px] whitespace-nowrap">Channel &amp; Time</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[180px] min-w-[180px] whitespace-nowrap">Citizen Info</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[200px] min-w-[200px]">Ward &amp; Locality</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[260px]">Reported Problem</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[150px] min-w-[150px] text-center whitespace-nowrap">Queue Status</th>
                      <th className="px-4 py-3.5 text-right w-[160px] min-w-[160px] whitespace-nowrap">Verification Action</th>
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

                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
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

            {/* Workflow Flowchart & Guide (Placed at bottom, collapsed by default) */}
            <TabGuideBanner tabKey="INTAKE" />
          </div>
          )}

          {/* TAB: 60 WARDS DIRECTORY */}
          {activeTab === 'WARDS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
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
                  <div className="relative w-64">
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
                </div>
              </div>

              <div className="overflow-x-auto max-h-[600px] border-t-2 border-slate-400">
                <table className="w-full min-w-[1050px] border-collapse border border-slate-400 text-left text-xs text-slate-800">
                  <thead className="sticky top-0 bg-slate-100 border-b-2 border-slate-500 font-bold uppercase tracking-wider text-[11px] text-slate-800 z-10 select-none">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[100px] min-w-[100px] whitespace-nowrap">Ward</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[190px] min-w-[190px]">Ward Name</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[130px] min-w-[130px] whitespace-nowrap">Zone</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[170px] min-w-[170px]">Parshad</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 w-[160px] min-w-[160px] whitespace-nowrap">Parshad Phone Number</th>
                      <th className="px-4 py-3.5 border-r border-slate-400 min-w-[200px]">Key Landmarks</th>
                      <th className="px-4 py-3.5 text-right w-[140px] min-w-[140px] whitespace-nowrap">Actions</th>
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
                            {ward.ward_name}
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
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
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

            {/* Workflow Flowchart & Guide (Placed at bottom, collapsed by default) */}
            <TabGuideBanner tabKey="WARDS" />
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
                    <span>+ Add Department</span>
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
                      <th className="px-4 py-3.5 text-right w-[140px] min-w-[140px] whitespace-nowrap">Actions</th>
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
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDepartment(dept);
                                setIsDepartmentModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title={`Edit ${dept.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Dept</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workflow Flowchart & Guide (Placed at bottom, collapsed by default) */}
            <TabGuideBanner tabKey="DEPARTMENTS" />
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
                    <span>+ Add New Department</span>
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
                        <th className="px-4 py-3.5 text-right w-40">Actions</th>
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
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDepartment(dept);
                                setIsDepartmentModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title={`Edit SLA and Officer for ${dept.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit SLA &amp; Officer</span>
                            </button>
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
        <div className="px-6 pb-6">
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
          defaultDecision={modalDefaultDecision}
          onClose={() => setShowNewComplaintModal(false)}
          onSubmit={(data) => {
            if (data.decision === 'ACCEPT') {
              const dept = departments.find(d => d.name === data.department_name) || departments[0];
              const wardObj = wards.find(w => w.ward_number === data.ward_number);
              const ticketNum = `SNP-2026-${String(tickets.length + 842).padStart(4, '0')}`;
              const deadlineHours = data.sla_hours || dept.default_sla_hours || 48;

              let deadlineMs = Math.round(deadlineHours * 3600 * 1000);
              if (deadlineHours < 0.01) {
                deadlineMs = 30 * 1000;
              } else if (deadlineHours < 0.05) {
                deadlineMs = 60 * 1000;
              }
              const deadlineDate = new Date(Date.now() + deadlineMs);

              const formatDeadlineDisplay = (hours: number, date: Date) => {
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                if (hours < 0.01) return `30s Target (${timeStr})`;
                if (hours < 0.05) return `1m Target (${timeStr})`;
                return date.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
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
              const newIntake: IntakeComplaint = {
                id: `intake-${Date.now()}`,
                intake_channel: data.intake_channel,
                citizen_name: data.citizen_name,
                citizen_phone: data.citizen_phone,
                ward_number: data.ward_number,
                address: data.address,
                landmark: data.landmark || '',
                category_name: data.category_name,
                department_name: data.department_name || 'N/A (Rejected)',
                problem_description: data.problem_description,
                status: 'REJECTED',
                rejection_reason: data.rejection_reason || 'Rejected by Portal Manager',
                is_after_hours: false,
                received_at: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              };

              onAddIntake(newIntake);

              // If automated WhatsApp notice to citizen was selected
              if (data.notify_citizen) {
                const rejectHindiNotice = `नमस्कार ${data.citizen_name},\n\nस्मार्ट नगर परिषद चित्तौड़गढ़ में आपकी शिकायत दर्ज कराने के संबंध में:\n\nशिकायत श्रेणी: ${data.category_name}\nस्थान: ${data.address}, वार्ड ${data.ward_number}\nनिर्णय: अस्वीकृत (Rejected)\nअस्वीकृति का कारण: ${data.rejection_reason || 'दिशानिर्देशों के अनुरूप नहीं'}\n\nसूचित किया जाता है कि उपरोक्त कारण से आपकी शिकायत को आधिकारिक रूप से स्वीकार नहीं किया गया है। किसी भी स्पष्टीकरण हेतु नगर परिषद कार्यालय में संपर्क करें।\n\nधन्यवाद,\nस्मार्ट नगर परिषद चित्तौड़गढ़`;

                const rejectNotif: NotificationLog = {
                  id: `notif-${Date.now()}`,
                  ticket_number: `INTAKE-REJ-${newIntake.id.slice(-6).toUpperCase()}`,
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

              setShowNewComplaintModal(false);
              setActiveTab('INTAKE');
              setIntakeFilterStatus('REJECTED');

              setStatusModalConfig({
                isOpen: true,
                type: 'warning',
                title: 'Rejected!',
                subtitle: `Complaint from ${data.citizen_name} has been rejected and recorded in the municipal audit trail.`,
                details: [
                  `Citizen: ${data.citizen_name} (${data.citizen_phone})`,
                  `Rejection Reason: ${data.rejection_reason || 'Rejected by Portal Manager'}`,
                  `Citizen WhatsApp Notice: ${data.notify_citizen ? 'Dispatched' : 'Skipped / Not Sent (Silent)'}`
                ],
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
      />

      {/* Global Status / Confirmation / Success Modal (AMPLR Health Style) */}
      <StatusModal
        config={statusModalConfig}
        onClose={() => setStatusModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
