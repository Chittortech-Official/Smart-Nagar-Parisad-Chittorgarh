import { useState, useEffect } from 'react';
import type { Ward, Department, ForwardingOption } from '../types';
import {
  X,
  Phone,
  Ticket as TicketIcon,
  Send,
  Clock,
  UserCheck,
  ShieldCheck,
  MapPin,
  Building2,
  MessageSquare,
  BellOff,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export type ComplaintDecision = 'ACCEPT' | 'REJECT';

interface NewComplaintModalProps {
  wards: Ward[];
  departments: Department[];
  nextTicketNumber?: string;
  defaultDecision?: ComplaintDecision;
  onClose: () => void;
  onSubmit: (data: {
    decision: ComplaintDecision;
    rejection_reason?: string;
    citizen_name: string;
    citizen_phone: string;
    ward_number: number;
    address: string;
    landmark?: string;
    department_name?: string;
    category_name: string;
    problem_description: string;
    intake_channel: 'HELPLINE_CALL' | 'WHATSAPP';
    forwarding_option?: ForwardingOption;
    sla_hours?: number;
    notify_citizen?: boolean;
  }) => void;
}

export const NewComplaintModal = ({
  wards,
  departments,
  nextTicketNumber,
  defaultDecision = 'ACCEPT',
  onClose,
  onSubmit
}: NewComplaintModalProps) => {
  const [decision, setDecision] = useState<ComplaintDecision>(defaultDecision);
  const [rejectionReason, setRejectionReason] = useState('');
  const [channel, setChannel] = useState<'HELPLINE_CALL' | 'WHATSAPP'>('HELPLINE_CALL');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('+91 ');
  const [wardNumber, setWardNumber] = useState<number>(1);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [selectedDept, setSelectedDept] = useState(departments[0]?.name || 'Sanitation & Garbage Collection');
  const [categoryName, setCategoryName] = useState('Kachra Patra Emptying & Overflow');
  const [description, setDescription] = useState('');
  const [forwardingOption, setForwardingOption] = useState<ForwardingOption>('COUNCILLOR_AND_OFFICER');
  const [slaHours, setSlaHours] = useState<number>(24);
  const [notifyCitizenOnReject, setNotifyCitizenOnReject] = useState<boolean>(true);
  const [validationAlert, setValidationAlert] = useState<{
    title: string;
    subtitle: string;
    details?: string[];
  } | null>(null);

  // Auto-update default SLA when department changes
  useEffect(() => {
    const dept = departments.find(d => d.name === selectedDept);
    if (dept?.default_sla_hours) {
      setSlaHours(dept.default_sla_hours);
    }
  }, [selectedDept, departments]);

  const selectedWardObj = wards.find(w => w.ward_number === wardNumber);
  const selectedDeptObj = departments.find(d => d.name === selectedDept);

  // Clean ward name helper to prevent duplicate "Ward XX - Ward XX" display
  const getCleanWardDisplay = (w: Ward) => {
    const raw = w.ward_name || '';
    const clean = raw.replace(new RegExp(`^Ward\\s*${w.ward_number}\\s*[-–—:]*\\s*`, 'i'), '').trim();
    return `Ward ${w.ward_number} — ${clean || raw}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Citizen Name
    if (!citizenName.trim()) {
      setValidationAlert({
        title: "नागरिक का नाम आवश्यक है (Citizen Name Required)",
        subtitle: "कृपया शिकायतकर्ता नागरिक का पूरा नाम दर्ज करें।",
        details: [
          "Citizen Full Name field khali nahi ho sakta.",
          "Shikayat darj karne ke liye nagrik ka naam likhna anivarya hai."
        ]
      });
      return;
    }

    // 2. Validate 10-Digit Indian Mobile Number (starts with 6, 7, 8, or 9)
    const rawDigits = citizenPhone.replace(/\D/g, '').slice(-10);
    const isValidIndianMobile = /^[6-9]\d{9}$/.test(rawDigits);
    if (!isValidIndianMobile) {
      setValidationAlert({
        title: "अमान्य मोबाइल नंबर (Invalid Mobile Number)",
        subtitle: "कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।",
        details: [
          "मोबाइल नंबर ठीक 10 अंकों का होना आवश्यक है।",
          "नंबर 6, 7, 8, या 9 से शुरू होना चाहिए (Indian Telecom Standard)।",
          "उदाहरण (Example): 98290 12345 (Total 10 digits)"
        ]
      });
      return;
    }
    const formattedPhone = `+91 ${rawDigits}`;

    // 3. For ACCEPT: Address and Detailed Description are strictly mandatory
    if (decision === 'ACCEPT') {
      if (!address.trim()) {
        setValidationAlert({
          title: "स्थान एवं पता आवश्यक है (Address Required)",
          subtitle: "सफाई या मरम्मत टीम को मौके पर भेजने हेतु पूरा पता आवश्यक है।",
          details: [
            "मकान / दुकान नंबर, गली का नाम या मोहल्ला दर्ज करें।",
            "बिना पते के फील्ड टीम मौके पर कार्य का समाधान नहीं कर सकेगी।"
          ]
        });
        return;
      }
      if (!description.trim()) {
        setValidationAlert({
          title: "समस्या का विवरण आवश्यक है (Description Required)",
          subtitle: "कृपया नागरिक द्वारा बताई गई समस्या का विवरण दर्ज करें।",
          details: [
            "Detailed Complaint Description field khali nahi ho sakta.",
            "Taaki vibhag ke officer ko samasya spasht roop se samajh aa sake."
          ]
        });
        return;
      }
    }

    // 4. For REJECT: Rejection Reason is mandatory
    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setValidationAlert({
        title: "अस्वीकृति का कारण आवश्यक है (Rejection Reason Required)",
        subtitle: "कृपया शिकायत अस्वीकृत (Reject) करने का आधिकारिक कारण दर्ज करें।",
        details: [
          "उदा. नगर परिषद सीमा से बाहर, निजी विवाद, या गलत कॉल।",
          "यह कारण नागरिक को WhatsApp सूचना में भी भेजा जाता है।"
        ]
      });
      return;
    }

    onSubmit({
      decision,
      rejection_reason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
      citizen_name: citizenName.trim(),
      citizen_phone: formattedPhone,
      ward_number: Number(wardNumber),
      address: address.trim() || 'N/A (Rejected Complaint)',
      landmark: decision === 'ACCEPT' ? landmark.trim() : '',
      department_name: decision === 'ACCEPT' ? selectedDept : 'N/A (Rejected)',
      category_name: categoryName,
      problem_description: description.trim() || (decision === 'REJECT' ? `Rejection Reason: ${rejectionReason}` : ''),
      intake_channel: channel,
      forwarding_option: decision === 'ACCEPT' ? forwardingOption : undefined,
      sla_hours: decision === 'ACCEPT' ? slaHours : undefined,
      notify_citizen: decision === 'REJECT' ? notifyCitizenOnReject : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-[96%] max-w-5xl h-[92vh] max-h-[880px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">

        {/* Header - Spacious & Prominent */}
        <div className="flex items-center justify-between px-7 py-4.5 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl text-white shadow-sm ${decision === 'ACCEPT' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <TicketIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-lg leading-tight text-white tracking-tight">
                  Citizen Complaint Registration &amp; Decision
                </h3>
                {decision === 'ACCEPT' && nextTicketNumber && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/25 text-blue-200 border border-blue-400/40 shadow-xs">
                    Assigned Ticket: {nextTicketNumber}
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${decision === 'ACCEPT'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}>
                  {decision === 'ACCEPT' ? 'Decision: Accept Complaint' : 'Decision: Reject Complaint'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Smart Nagar Parishad Chittorgarh &bull; All 60 Wards &bull; Workflow A, B &amp; C
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Two Spacious Columns */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 text-xs bg-slate-50/40">

          {/* Decision Selector: Accept vs Reject (2 Options Only) */}
          <div className="mb-5 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="font-bold text-slate-900 text-xs block mb-2.5">
              Select Decision (निर्णय चुनें):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${decision === 'ACCEPT'
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                  }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'ACCEPT'}
                  onChange={() => setDecision('ACCEPT')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>Accept Complaint (स्वीकृत करें)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">Intake Queue</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Complaint is accepted and immediately sent to the <strong>Intake Queue</strong> for verification and official ticket dispatch.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${decision === 'REJECT'
                    ? 'bg-rose-50/70 border-rose-500 shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                  }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'REJECT'}
                  onChange={() => setDecision('REJECT')}
                  className="mt-1 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>Reject Complaint (अस्वीकृत करें)</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">Reject Audit</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Rejects grievance with an official reason and records it in the <strong>Rejected Audit</strong> data without generating a ticket.
                  </p>
                </div>
              </label>
            </div>

            {/* Rejection Reason Input (Visible only if REJECT is selected) */}
            {decision === 'REJECT' && (
              <div className="mt-3.5 p-3 bg-rose-50/80 rounded-xl border border-rose-200">
                <label className="block font-bold text-rose-900 text-xs mb-1.5">
                  Official Rejection Reason (अस्वीकृति का कारण) *
                </label>
                <input
                  type="text"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Complaint outside Nagar Parishad limits / Incomplete details / Duplicate request"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
              </div>
            )}
          </div>

          {/* Top Channel Bar */}
          <div className="mb-6 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-600" />
                Select Inflow Channel:
              </span>
              <span className="text-[11px] text-slate-500">(Where did the citizen contact?)</span>
            </div>

            <div className="flex items-center gap-3">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer font-medium transition-all ${channel === 'HELPLINE_CALL' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="channel"
                  checked={channel === 'HELPLINE_CALL'}
                  onChange={() => setChannel('HELPLINE_CALL')}
                  className="accent-blue-600 w-3.5 h-3.5"
                />
                <span>Helpline Call (10:00 AM – 6:00 PM)</span>
              </label>

              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer font-medium transition-all ${channel === 'WHATSAPP' ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="channel"
                  checked={channel === 'WHATSAPP'}
                  onChange={() => setChannel('WHATSAPP')}
                  className="accent-emerald-600 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Citizen Intake (24/7)
                </span>
              </label>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN: Citizen & Location Details */}
            <div className="space-y-4.5 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Citizen &amp; Location Details</h4>
                  <p className="text-[11px] text-slate-400">Caller credentials and municipal ward mapping</p>
                </div>
              </div>

              {/* Citizen Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Citizen Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. Lav Sharma"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Mobile Number (10 Digits) *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Starts with 6-9</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-bold text-slate-600 select-none bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={citizenPhone.replace(/^\+91\s*/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCitizenPhone(`+91 ${val}`);
                      }}
                      placeholder="98290 12345"
                      maxLength={10}
                      className="w-full pl-17 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Ward Selection (Wide & Clean) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Select Chittorgarh Ward (1 to 60) *
                  </label>
                  {selectedWardObj && (
                    <span className="text-[11px] text-blue-600 font-semibold">
                      Zone: {selectedWardObj.zone}
                    </span>
                  )}
                </div>
                <select
                  value={wardNumber}
                  onChange={(e) => setWardNumber(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {wards.map((w) => (
                    <option key={w.ward_number} value={w.ward_number}>
                      {getCleanWardDisplay(w)}
                    </option>
                  ))}
                </select>

                {/* Ward Councillor Info Card */}
                {selectedWardObj && (
                  <div className="mt-2 p-3 rounded-lg bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-blue-900">Ward Councillor:</strong> {selectedWardObj.councillor_name} &bull; <span className="font-mono font-semibold">{selectedWardObj.councillor_phone}</span>
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        <strong>Key Landmarks:</strong> {selectedWardObj.key_landmarks}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Exact Locality & Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Exact Locality &amp; Street Address {decision === 'ACCEPT' ? '*' : '(Optional)'}
                  </label>
                  {decision === 'REJECT' && (
                    <span className="text-[10px] text-slate-400">Not required for rejected calls</span>
                  )}
                </div>
                <input
                  type="text"
                  required={decision === 'ACCEPT'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={decision === 'ACCEPT' ? "Plot/Shop No., Street name, Mohalla, Near circle..." : "Optional address for rejected records"}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Landmark - Only for ACCEPT */}
              {decision === 'ACCEPT' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Prominent Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Gurudwara, Behind Govt High School, Old Bridge"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Conditional based on ACCEPT vs REJECT */}
            {decision === 'ACCEPT' ? (
              <div className="space-y-4.5 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Department &amp; Grievance Scope</h4>
                    <p className="text-[11px] text-slate-400">Responsible authority, SLA deadline &amp; dispatch</p>
                  </div>
                </div>

                {/* Department Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Municipal Department *
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code}) &bull; Standard SLA: {d.default_sla_hours}h
                      </option>
                    ))}
                  </select>

                  {/* Department Nodal Officer Info Card */}
                  {selectedDeptObj && (
                    <div className="mt-2 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="text-emerald-950">Nodal Officer:</strong> {selectedDeptObj.head_officer_name} &bull; <span className="font-mono font-semibold">{selectedDeptObj.head_officer_phone}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        {selectedDeptObj.code}
                      </span>
                    </div>
                  )}
                </div>

                {/* Problem Category */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Problem Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Streetlight Defective, Waste Accumulation, Broken Slabs"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Complaint Description (Mandatory for ACCEPT) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Detailed Complaint Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide precise details of the issue as reported by citizen..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Forwarding Option & SLA Selection */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      Automated WhatsApp Forwarding Option:
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/60 px-2 py-0.5 rounded">
                      Dispatched on Submit
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <label className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${forwardingOption === 'COUNCILLOR_AND_OFFICER' ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="forwarding"
                        className="sr-only"
                        checked={forwardingOption === 'COUNCILLOR_AND_OFFICER'}
                        onChange={() => setForwardingOption('COUNCILLOR_AND_OFFICER')}
                      />
                      <div className="text-[11px] leading-tight">Councillor &amp; Officer</div>
                      <div className="text-[9px] opacity-85 mt-0.5">(Recommended)</div>
                    </label>

                    <label className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${forwardingOption === 'OFFICER_ONLY' ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="forwarding"
                        className="sr-only"
                        checked={forwardingOption === 'OFFICER_ONLY'}
                        onChange={() => setForwardingOption('OFFICER_ONLY')}
                      />
                      <div className="text-[11px] leading-tight">Officer Only</div>
                      <div className="text-[9px] opacity-85 mt-0.5">(Departmental)</div>
                    </label>

                    <label className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${forwardingOption === 'COUNCILLOR_ONLY' ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="forwarding"
                        className="sr-only"
                        checked={forwardingOption === 'COUNCILLOR_ONLY'}
                        onChange={() => setForwardingOption('COUNCILLOR_ONLY')}
                      />
                      <div className="text-[11px] leading-tight">Councillor Only</div>
                      <div className="text-[9px] opacity-85 mt-0.5">(Ward Esc.)</div>
                    </label>
                  </div>

                  {/* Target Resolution SLA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Target Resolution SLA:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { val: 0.008333, label: '⚡ 30s (Test)' },
                        { val: 0.016667, label: '⚡ 1m (Test)' },
                        { val: 12, label: '12h' },
                        { val: 24, label: '24h' },
                        { val: 48, label: '48h' },
                        { val: 72, label: '72h' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setSlaHours(opt.val)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${slaHours === opt.val
                              ? opt.val < 1 ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : opt.val < 1 ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* REJECT DECISION: Streamlined without Municipal Dept or Officer Dispatch */
              <div className="space-y-4.5 bg-white p-5 rounded-xl border border-rose-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-2.5 border-b border-rose-100">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                    <TicketIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Grievance Scope &amp; Citizen Notice</h4>
                    <p className="text-[11px] text-slate-500">Classification and citizen WhatsApp notification option</p>
                  </div>
                </div>

                {/* Problem Category (Selectable / Editable) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Problem Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Kachra Patra Emptying, Streetlight, Drain Blockage"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Kachra Patra Emptying & Overflow',
                      'Streetlight Defective',
                      'Drain Blockage / Nali Safai',
                      'Road Repair / Potholes',
                      'Encroachment / Illegal Work'
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryName(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${categoryName === cat
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complaint Description (Optional for REJECT) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Detailed Complaint Description (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Optional for rejection</span>
                  </div>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional: Enter extra details or notes as reported by citizen..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Citizen WhatsApp Notification Option (Replaces officer/councillor dispatch) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-rose-600" />
                      Automated WhatsApp Option for Citizen:
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Citizen Only
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Send WhatsApp Notice to Citizen */}
                    <button
                      type="button"
                      onClick={() => setNotifyCitizenOnReject(true)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${notifyCitizenOnReject
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-100/60'
                        }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${notifyCitizenOnReject ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${notifyCitizenOnReject ? 'text-emerald-900' : 'text-slate-700'}`}>
                          Send WhatsApp to Citizen
                        </div>
                        <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                          Sends official WhatsApp notice with rejection reason to citizen's number.
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Do Not Notify (Silent Rejection) */}
                    <button
                      type="button"
                      onClick={() => setNotifyCitizenOnReject(false)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${!notifyCitizenOnReject
                          ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-100/60'
                        }`}
                    >
                      <BellOff className={`w-4 h-4 shrink-0 mt-0.5 ${!notifyCitizenOnReject ? 'text-slate-800' : 'text-slate-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${!notifyCitizenOnReject ? 'text-slate-900' : 'text-slate-700'}`}>
                          Do Not Send (Silent Rejection)
                        </div>
                        <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                          Complaint rejected silently without alerting citizen. Citizen will not know.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar - Action Controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border">
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${decision === 'ACCEPT' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span>
                {decision === 'ACCEPT'
                  ? 'Official municipal complaint ticket will be generated & dispatched directly'
                  : `Complaint rejected & logged into audit trail • ${notifyCitizenOnReject ? 'WhatsApp receipt will be sent to citizen' : 'Silent rejection (Citizen will not be notified)'}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer ${decision === 'ACCEPT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
              >
                <TicketIcon className="w-4 h-4" />
                <span className="text-sm">
                  {decision === 'ACCEPT' ? 'Register & Generate Official Ticket' : 'Reject Complaint & Record Audit'}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Custom High-Quality Portal Notification Dialog (No browser alert) */}
        {validationAlert && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-300 p-6 md:p-7 text-center space-y-4 animate-in zoom-in-95 duration-150 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Circular Amber Warning Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {validationAlert.title}
                </h3>
                <p className="text-xs text-slate-600">
                  {validationAlert.subtitle}
                </p>
              </div>

              {/* Details List */}
              {validationAlert.details && validationAlert.details.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-left space-y-1.5">
                  {validationAlert.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-950 font-medium">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setValidationAlert(null)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-slate-900/10 active:scale-98"
              >
                समझ गया / OK (Theek Hai)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
