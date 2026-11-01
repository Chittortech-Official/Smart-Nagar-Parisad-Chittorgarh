import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  GitBranch, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  ShieldAlert, 
  Sparkles,
  Smartphone,
  Info,
  AlertTriangle,
  Building2,
} from 'lucide-react';

interface TabGuideBannerProps {
  tabKey: 'DASHBOARD' | 'INTAKE' | 'TICKETS' | 'SLA' | 'WARDS' | 'DEPARTMENTS' | 'WHATSAPP';
}

export function TabGuideBanner({ tabKey }: TabGuideBannerProps) {
  // Collapsed by default as requested by user, so the page stays compact and main content is top-level
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [viewMode, setViewMode] = useState<'flowchart' | 'guide'>('flowchart');

  // Title and subtitle mapping
  const getBannerMeta = () => {
    switch (tabKey) {
      case 'DASHBOARD':
        return {
          title: lang === 'hi' 
            ? 'सम्पूर्ण नगर परिषद शिकायत प्रणाली मास्टर फ्लोचार्ट (End-to-End Master Workflow)' 
            : 'Complete Municipal Complaint System Master Flowchart (End-to-End)',
          subtitle: lang === 'hi'
            ? 'नागरिक कॉल/व्हाट्सएप से लेकर 2-स्टेप समाधान और सभापति मोबाइल ऐप तक का सम्पूर्ण सचित्र प्रवाह'
            : 'Full lifecycle flow from citizen intake to 2-step verified closure and executive mobile monitoring'
        };
      case 'INTAKE':
        return {
          title: lang === 'hi' 
            ? 'इनटेक क्यू कार्यप्रवाह एवं सत्यापन आरेख (Workflow A & B)' 
            : 'Intake Queue Flowchart & Verification (Workflow A & B)',
          subtitle: lang === 'hi'
            ? 'हेल्पलाइन कॉल (10 AM - 6 PM) व 24/7 व्हाट्सएप इनटेक, कार्य समय नियम एवं स्वीकृत/अस्वीकृत निर्णय'
            : 'Helpline call (10 AM - 6 PM) & 24/7 WhatsApp intake, working hours logic, and accept/reject decisions'
        };
      case 'TICKETS':
        return {
          title: lang === 'hi' 
            ? 'अनिवार्य 2-चरणीय समाधान एवं टिकट जीवनचक्र (Workflow E & F)' 
            : 'Mandatory 2-Step Closure & Ticket Lifecycle (Workflow E & F)',
          subtitle: lang === 'hi'
            ? 'अधिकारी पुष्टि (Step 1) + नागरिक पुष्टि (Step 2) = तभी टिकट बंद होगा (सचित्र फ्लोचार्ट)'
            : 'Authority Confirmation (Step 1) + Citizen Confirmation (Step 2) = Ticket Closure'
        };
      case 'SLA':
        return {
          title: lang === 'hi' 
            ? 'SLA समय-सीमा उल्लंघन, मोबाइल ऐप सिंक एवं एस्केलेशन (Workflow G & D)' 
            : 'SLA Breach, Executive Mobile Sync & Escalation Flowchart (Workflow G & D)',
          subtitle: lang === 'hi'
            ? '24h/48h/72h समय-सीमा, ओवरड्यू रेड अलर्ट, सभापति/उपसभापति हस्तक्षेप एवं अनसुलझे मामलों की प्रक्रिया'
            : 'Standard municipal SLAs, overdue red alerts, Chairman & Vice-Chairman mobile app sync, and escalation'
        };
      case 'WARDS':
        return {
          title: lang === 'hi' 
            ? 'वार्ड 1-60 पार्षद समन्वय एवं फील्ड आवंटन प्रवाह' 
            : 'Ward Councillor (1-60) Field Coordination & Alert Flow',
          subtitle: lang === 'hi'
            ? 'नागरिक पता से वार्ड पहचान, निर्वाचित पार्षद को सीधा फोन व स्वचालित व्हाट्सएप अलर्ट'
            : 'Ward mapping from citizen locality, instant councillor calls, and automated forward alerts'
        };
      case 'DEPARTMENTS':
        return {
          title: lang === 'hi' 
            ? 'नगर परिषद के 6 विभाग, नोडल अधिकारी एवं मानक SLA प्रवाह' 
            : 'Municipal Departments, Nodal Officers & Standard SLA Timeframes',
          subtitle: lang === 'hi'
            ? 'सफाई (24h), स्ट्रीटलाइट (48h), सड़क/नाली (72h) - नोडल अधिकारी दायित्व एवं ट्रैकिंग'
            : 'Sanitation (24h), Streetlights (48h), Roads/Drainage (72h) - nodal responsibility and tracking'
        };
      case 'WHATSAPP':
        return {
          title: lang === 'hi' 
            ? 'व्हाट्सएप ऑटोमेशन, ऑडिट लॉग एवं नागरिक रसीद प्रवाह (Workflow H)' 
            : 'WhatsApp Automation, Audit Trail & Official Closure Receipts (Workflow H)',
          subtitle: lang === 'hi'
            ? 'पंजीकरण अलर्ट, अधिकारी कार्य आदेश एवं नागरिक संतुष्टि उपरांत आधिकारिक हिंदी रसीद प्रेषण'
            : 'Registration alerts, officer work orders, and official Hindi closure receipts post citizen confirmation'
        };
    }
  };

  const meta = getBannerMeta();

  return (
    <div className="bg-gradient-to-r from-blue-50/95 via-indigo-50/70 to-white rounded-2xl border-2 border-blue-300 shadow-sm overflow-hidden select-none mb-6 transition-all print:hidden">
      {/* Header Bar */}
      <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-white/95 transition-all ${
        isOpen ? 'border-b-2 border-blue-200' : ''
      }`}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            {viewMode === 'flowchart' ? <GitBranch className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-blue-950 tracking-tight">
                {meta.title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                {viewMode === 'flowchart' 
                  ? (lang === 'hi' ? 'सचित्र फ्लोचार्ट' : 'Visual Flowchart') 
                  : (lang === 'hi' ? 'विस्तृत गाइड' : 'Detailed Guide')}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode Switcher: Flowchart vs Guide */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setViewMode('flowchart'); setIsOpen(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                viewMode === 'flowchart'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'फ्लोचार्ट' : 'Flowchart'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('guide'); setIsOpen(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                viewMode === 'guide'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'गाइड' : 'Guide'}</span>
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all ${
                lang === 'hi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>

          {/* Prominent Open / Collapse toggle button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              isOpen 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
            }`}
            title={isOpen ? 'Collapse' : 'Open Flowchart'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>
              {isOpen 
                ? (lang === 'hi' ? 'छिपाएं' : 'Collapse') 
                : (lang === 'hi' ? 'फ्लोचार्ट देखें' : 'View Flowchart')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Flowchart / Guide Content */}
      {isOpen && (
        <div className="p-5 space-y-4 animate-in fade-in duration-200">
          
          {/* ============================================================ */}
          {/* MODE 1: VISUAL FLOWCHARTS WITH PROCESS BOXES & DECISION DIAMONDS */}
          {/* ============================================================ */}
          {viewMode === 'flowchart' && (
            <div className="space-y-4">

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: SLA & OVERDUE (Workflow G & Mobile Sync D)       */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'SLA' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[1050px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-5">
                    
                    {/* Header Banner inside Flowchart */}
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-rose-600" />
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                            {lang === 'hi' 
                              ? 'SLA समय-सीमा उल्लंघन, मोबाइल ऐप चेतावनी एवं एस्केलेशन फ्लोचार्ट' 
                              : 'SLA Breach, Executive Mobile Alert & Escalation Flowchart'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lang === 'hi' 
                              ? 'Workflow G: धरातल पर काम नहीं होने पर स्वचालित ओवरड्यू फ्लैग एवं उच्चाधिकारी हस्तक्षेप'
                              : 'Workflow G: Automatic overdue tagging upon deadline expiry & executive escalation'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px] font-bold flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'सभापति/उपसभापति ऐप में लाइव' : 'Synced to Executive Mobile App'}</span>
                        </span>
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] font-bold">
                          {lang === 'hi' ? 'कड़ा नियम: बिना 2-स्टेप पुष्टि कभी बंद नहीं होगा' : 'Rule: Never closed without 2-step verification'}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-Step Connected Diagram */}
                    <div className="grid grid-cols-6 gap-3 items-stretch relative">
                      
                      {/* Node 1: SLA Assignment */}
                      <div className="bg-blue-50/90 border-2 border-blue-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'चरण 1' : 'Step 1'}
                            </span>
                            <span className="text-[10px] text-blue-800 font-semibold">
                              {lang === 'hi' ? '🖥️ पोर्टल मैनेजर' : '🖥️ Portal Manager'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-blue-950">
                            {lang === 'hi' ? 'SLA समय-सीमा निर्धारण' : 'SLA Target Assignment'}
                          </p>
                          <div className="text-[10px] text-slate-700 bg-white/80 p-2 rounded border border-blue-200 text-left space-y-0.5">
                            <div>🧹 <b>{lang === 'hi' ? 'सफाई:' : 'Sanitation:'}</b> {lang === 'hi' ? '24 घंटे' : '24 Hours'}</div>
                            <div>💡 <b>{lang === 'hi' ? 'स्ट्रीटलाइट:' : 'Streetlights:'}</b> {lang === 'hi' ? '48 घंटे' : '48 Hours'}</div>
                            <div>🛣️ <b>{lang === 'hi' ? 'सड़क/नाली:' : 'Roads/Drainage:'}</b> {lang === 'hi' ? '72 घंटे' : '72 Hours'}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-blue-700 font-medium">
                          {lang === 'hi' ? 'काउन्टडाउन शुरू ⏱️' : 'Countdown Starts ⏱️'}
                        </div>
                      </div>

                      {/* Node 2: Field Execution */}
                      <div className="bg-indigo-50/90 border-2 border-indigo-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'चरण 2' : 'Step 2'}
                            </span>
                            <span className="text-[10px] text-indigo-800 font-semibold">
                              {lang === 'hi' ? '👷 नोडल अधिकारी' : '👷 Nodal Officer'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-indigo-950">
                            {lang === 'hi' ? 'धरातल पर कार्य निष्पादन' : 'Field Work Execution'}
                          </p>
                          <p className="text-[11px] text-slate-600 text-left leading-relaxed">
                            {lang === 'hi' 
                              ? 'नोडल अधिकारी अपनी फील्ड टीम को भेजकर समस्या का निस्तारण करवाता है।' 
                              : 'Department nodal officer deploys field crew to resolve citizen complaint on site.'}
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] text-indigo-700 font-medium">
                          {lang === 'hi' ? 'समय रहते समाधान?' : 'On-time Resolution?'}
                        </div>
                      </div>

                      {/* Decision Diamond 1: Resolved in Time? */}
                      <div className="bg-gradient-to-b from-purple-50 to-purple-100/90 border-2 border-purple-500 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center">
                            <span className="px-2 py-0.5 bg-purple-700 text-white rounded text-[10px] font-extrabold uppercase">
                              {lang === 'hi' ? '<> निर्णय 1 (निर्णय)' : '<> Decision 1 (SLA Check)'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-purple-950 mt-1">
                            {lang === 'hi' ? 'क्या तय समय में कार्य पूरा हुआ?' : 'Work done within SLA deadline?'}
                          </p>
                          
                          {/* Branch A: YES */}
                          <div className="bg-emerald-50 border border-emerald-400 rounded-lg p-1.5 text-left text-[11px]">
                            <span className="font-bold text-emerald-800">
                              {lang === 'hi' ? '✅ हाँ: समय पर पूर्ण' : '✅ YES: On-time Resolution'}
                            </span>
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                              {lang === 'hi' ? 'सीधे 2-स्टेप सत्यापन पर जाएं' : 'Proceed directly to 2-Step Closure'}
                            </p>
                          </div>

                          {/* Branch B: NO */}
                          <div className="bg-rose-50 border border-rose-400 rounded-lg p-1.5 text-left text-[11px]">
                            <span className="font-bold text-rose-800">
                              {lang === 'hi' ? '❌ नहीं: समय सीमा समाप्त' : '❌ NO: Deadline Expired'}
                            </span>
                            <p className="text-[10px] text-rose-700 mt-0.5">
                              {lang === 'hi' ? 'स्वचालित ओवरड्यू मार्क' : 'Auto SLA Breach Triggered'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-purple-700 font-bold">
                          {lang === 'hi' ? 'शाखा विभाजन ➔' : 'Branch Split ➔'}
                        </div>
                      </div>

                      {/* Node 3: SLA Overdue Alert */}
                      <div className="bg-rose-50/95 border-2 border-rose-500 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'ओवरड्यू' : 'Overdue'}
                            </span>
                            <span className="text-[10px] text-rose-800 font-semibold">
                              {lang === 'hi' ? '📱 सभापति / उपसभापति' : '📱 Chairman & Vice-Chairman'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-rose-950">
                            {lang === 'hi' ? 'मोबाइल ऐप पर रेड अलर्ट' : 'Executive Mobile Alert'}
                          </p>
                          <p className="text-[11px] text-rose-900 text-left leading-relaxed">
                            {lang === 'hi' 
                              ? 'शिकायत लाल रंग में चमकती है। सभापति व उपसभापति के पास तुरंत अलर्ट पहुँचता है।' 
                              : 'Flashes in Red on Chairman & Vice-Chairman dashboard under Overdue tab.'}
                          </p>
                        </div>
                        <div className="mt-2 px-2 py-1 bg-rose-200/80 rounded text-[10px] text-rose-900 font-bold">
                          {lang === 'hi' ? 'उच्च स्तर पर मॉनिटरिंग' : 'High Priority Oversight'}
                        </div>
                      </div>

                      {/* Node 4: Administrative Follow-up */}
                      <div className="bg-amber-50/95 border-2 border-amber-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'चरण 3' : 'Step 3'}
                            </span>
                            <span className="text-[10px] text-amber-800 font-semibold">
                              {lang === 'hi' ? '📞 उच्चाधिकारी हस्तक्षेप' : '📞 Leadership Follow-up'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-amber-950">
                            {lang === 'hi' ? 'अधिकारी से सीधा फोन' : 'Officer Phone Intervention'}
                          </p>
                          <p className="text-[11px] text-slate-700 text-left leading-relaxed">
                            {lang === 'hi'
                              ? 'पोर्टल मैनेजर व सभापति नोडल अधिकारी को फोन कर काम तुरंत पूरा करने का निर्देश देते हैं।'
                              : 'Leadership calls nodal officer; councillor alerted to inspect delayed ground work.'}
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] text-amber-800 font-medium">
                          {lang === 'hi' ? 'समाधान संभव है या नहीं?' : 'Feasible to Resolve?'}
                        </div>
                      </div>

                      {/* Decision Diamond 2 & Final Outcome */}
                      <div className="bg-slate-50 border-2 border-slate-400 rounded-xl p-3 flex flex-col justify-between text-left relative shadow-xs">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-slate-700 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? '<> निर्णय 2' : '<> Decision 2'}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">
                              {lang === 'hi' ? 'अंतिम स्थिति' : 'Final Outcome'}
                            </span>
                          </div>
                          
                          {/* Outcome 1: Resolved */}
                          <div className="bg-emerald-50 border border-emerald-400 rounded p-1.5 text-[10px]">
                            <span className="font-bold text-emerald-900">
                              {lang === 'hi' ? '🟢 काम पूरा हुआ:' : '🟢 Work Completed:'}
                            </span>
                            <p className="text-emerald-800 mt-0.5 leading-snug">
                              {lang === 'hi' 
                                ? '2-चरणीय पुष्टि (अधिकारी + नागरिक) के बाद ही बंद।' 
                                : '2-Step verification (Officer + Citizen) certified closure.'}
                            </p>
                          </div>

                          {/* Outcome 2: Unsolvable */}
                          <div className="bg-rose-50 border border-rose-400 rounded p-1.5 text-[10px]">
                            <span className="font-bold text-rose-900">
                              {lang === 'hi' ? '🔴 अनसुलझा (Unsolvable):' : '🔴 Unsolvable / Disputed:'}
                            </span>
                            <p className="text-rose-800 mt-0.5 leading-snug">
                              {lang === 'hi' 
                                ? 'अधिकारी लिखित कारण देगा। बोर्ड समीक्षा हेतु एस्केलेट। कभी भी चुपचाप बंद नहीं होगा!' 
                                : 'Written justification required. Escalated for council review. Never silently closed!'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-center font-bold text-slate-700">
                          {lang === 'hi' ? 'पूर्ण पारदर्शिता ऑडिट' : 'Full Audit Trail'}
                        </div>
                      </div>

                    </div>

                    {/* Operational Summary Banner for Non-Technical Users */}
                    <div className="bg-slate-100 rounded-xl p-3 border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {lang === 'hi' ? 'ऑपरेटर एवं नोडल अधिकारी ध्यान दें:' : 'Operator & Officer Notice:'}
                        </span>
                        <span className="text-slate-700">
                          {lang === 'hi'
                            ? 'यदि कोई शिकायत SLA पार कर जाती है, तो उसे सीधे क्लोज़ नहीं किया जा सकता। अधिकारी की पुष्टि और नागरिक की फोन पुष्टि दोनों अनिवार्य हैं।'
                            : 'If a complaint breaches SLA, it cannot be arbitrarily marked resolved without both Authority Confirmation and Citizen Confirmation.'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                        {lang === 'hi' 
                          ? 'SLA ओवरड्यू ➔ उच्चाधिकारी निगरानी ➔ 2-स्टेप क्लोज़र'
                          : 'SLA Overdue ➔ Executive Oversight ➔ 2-Step Closure'}
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: ALL COMPLAINTS / 2-STEP CLOSURE (Workflow E & F)  */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'TICKETS' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[1050px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-5">
                    
                    {/* Header Banner */}
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                            {lang === 'hi' 
                              ? 'अनिवार्य 2-चरणीय टिकट क्लोज़र फ्लोचार्ट (Mandatory 2-Step Closure Flowchart)' 
                              : 'Mandatory Two-Step Ticket Closure Flowchart (Workflow E & F)'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lang === 'hi'
                              ? 'चित्तौड़गढ़ नगर परिषद का सर्वोच्च नियम: जब तक नागरिक खुद फोन पर संतुष्टि की पुष्टि नहीं करता, टिकट बंद नहीं हो सकता!'
                              : 'Golden Rule: Authority Confirmation + Citizen Confirmation = Certified Ticket Closure'}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-100 border-2 border-emerald-500 rounded-lg text-emerald-950 font-extrabold font-mono text-xs">
                        {lang === 'hi'
                          ? 'अधिकारी पुष्टि + नागरिक पुष्टि = प्रमाणित टिकट क्लोज़'
                          : 'Authority Confirmation + Citizen Confirmation = Ticket Closed'}
                      </div>
                    </div>

                    {/* 5-Column Detailed Flow */}
                    <div className="grid grid-cols-5 gap-3 items-stretch relative">
                      
                      {/* Step 1: Officer Reports Work Done */}
                      <div className="bg-blue-50/90 border-2 border-blue-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'चरण 1' : 'Phase 1'}
                            </span>
                            <span className="text-[10px] text-blue-800 font-semibold">
                              {lang === 'hi' ? '👷 नोडल अधिकारी' : '👷 Field Nodal Officer'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-blue-950">
                            {lang === 'hi' ? 'फील्ड कार्य पूर्ण सूचना' : 'Field Work Completed'}
                          </p>
                          <p className="text-[11px] text-slate-600 text-left leading-relaxed">
                            {lang === 'hi'
                              ? 'संबंधित विभागीय अधिकारी (सफाई, लाइट, नाली आदि) सूचना देता है कि धरातल पर काम पूरा हो गया है।'
                              : 'Field officer reports that municipal work has been executed on the ground.'}
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] text-blue-700 font-bold bg-blue-100/70 p-1 rounded">
                          {lang === 'hi' ? 'महत्वपूर्ण: अभी टिकट बंद नहीं हुआ!' : 'Important: Ticket is NOT closed yet!'}
                        </div>
                      </div>

                      {/* Step 2: PM Calls Officer */}
                      <div className="bg-amber-50/90 border-2 border-amber-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'स्टेप 1' : 'Step 1'}
                            </span>
                            <span className="text-[10px] text-amber-800 font-semibold">
                              {lang === 'hi' ? '🖥️ पोर्टल मैनेजर' : '🖥️ Portal Manager'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-amber-950">
                            {lang === 'hi' ? 'अधिकारी को फोन कॉल' : 'Officer Phone Call Verification'}
                          </p>
                          <p className="text-[11px] text-slate-700 text-left leading-relaxed">
                            {lang === 'hi'
                              ? 'पोर्टल मैनेजर नोडल अधिकारी को फोन कर पूछता है: "क्या आपने व्यक्तिगत रूप से काम की जांच कर ली है?"'
                              : 'Portal Manager calls the officer to verify completion & inspection.'}
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] text-amber-900 font-bold bg-amber-100 p-1 rounded border border-amber-300">
                          {lang === 'hi' ? 'स्थिति: Awaiting Citizen' : 'Status: Awaiting Citizen Confirmation'}
                        </div>
                      </div>

                      {/* Step 3: PM Calls Citizen */}
                      <div className="bg-purple-50/95 border-2 border-purple-500 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-purple-700 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'स्टेप 2 (अनिवार्य)' : 'Step 2 (Mandatory)'}
                            </span>
                            <span className="text-[10px] text-purple-900 font-semibold">
                              {lang === 'hi' ? '📞 नागरिक फोन सत्यापन' : '📞 Direct Citizen Call'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-purple-950">
                            {lang === 'hi' ? 'नागरिक से प्रत्यक्ष पूछना' : 'Direct Citizen Verification Call'}
                          </p>
                          <div className="bg-white p-2 rounded-lg border border-purple-300 text-left text-[11px] text-purple-950 font-medium italic">
                            {lang === 'hi'
                              ? '"नमस्कार! क्या आपकी दर्ज शिकायत का वास्तव में समाधान हो गया है और आप संतुष्ट हैं?"'
                              : '"Hello! Has your registered grievance actually been resolved on ground and are you satisfied?"'}
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-purple-800 font-bold">
                          {lang === 'hi' ? 'नागरिक का जवाब निर्णय ➔' : 'Citizen Response ➔'}
                        </div>
                      </div>

                      {/* Outcomes: YES vs NO vs NO ANSWER */}
                      <div className="col-span-2 space-y-2.5">
                        
                        {/* Branch 1: Citizen YES */}
                        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold uppercase">
                                {lang === 'hi' ? '✅ हाँ: नागरिक संतुष्ट' : '✅ YES: Citizen Satisfied'}
                              </span>
                              <span className="font-bold text-xs text-emerald-950">
                                {lang === 'hi' ? 'टिकट प्रमाणित बंद (CLOSED)' : 'Ticket Certified CLOSED'}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-800 leading-snug">
                              {lang === 'hi'
                                ? 'पोर्टल में नागरिक पुष्टि दर्ज होती है। नागरिक को तुरंत आधिकारिक हिंदी व्हाट्सएप रसीद प्रेषित होती है।'
                                : 'Citizen confirmation logged in DB. Automated official Hindi WhatsApp closure receipt dispatched.'}
                            </p>
                          </div>
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 ml-2" />
                        </div>

                        {/* Branch 2: Citizen NO */}
                        <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-2.5 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-extrabold uppercase">
                                {lang === 'hi' ? '❌ नहीं: नागरिक असंतुष्ट' : '❌ NO: Citizen Unsatisfied'}
                              </span>
                              <span className="font-bold text-xs text-rose-950">
                                {lang === 'hi' ? 'टिकट बंद नहीं होगा! (REOPENED)' : 'Ticket Cannot Be Closed! (REOPENED)'}
                              </span>
                            </div>
                            <p className="text-[10px] text-rose-800 leading-snug">
                              {lang === 'hi'
                                ? 'टिकट तुरंत Reopened किया जाता है और नोडल अधिकारी को पुनः फील्ड में भेजकर काम ठीक कराया जाता है।'
                                : 'Ticket cannot be closed! Marked Reopened and reassigned to field team.'}
                            </p>
                          </div>
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                        </div>

                        {/* Branch 3: Citizen DID NOT ANSWER */}
                        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-2 flex items-center justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9px] font-bold uppercase mr-1.5">
                              {lang === 'hi' ? '⚠️ कॉल नहीं उठाया (No Answer)' : '⚠️ Call Not Answered'}
                            </span>
                            <span className="font-bold text-[11px] text-amber-950">
                              {lang === 'hi' ? 'टिकट खुला रहेगा (लंबित नागरिक पुष्टि)' : 'Remains Pending Citizen Confirmation'}
                            </span>
                            <span className="text-[10px] text-amber-800 block mt-0.5">
                              {lang === 'hi' ? 'कॉल प्रयास दर्ज होगा; बिना बात किए कभी बंद नहीं किया जाएगा।' : 'Follow-up attempt recorded; retry scheduled.'}
                            </span>
                          </div>
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                        </div>

                      </div>

                    </div>

                    {/* Operational Rule Notice */}
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <b>{lang === 'hi' ? 'सख्त निर्देश:' : 'Strict Protocol:'}</b>{' '}
                        {lang === 'hi'
                          ? 'ना तो संबंधित अधिकारी और ना ही पोर्टल मैनेजर नागरिक की सहमति के बिना टिकट बंद कर सकते हैं। दोनों चरणों की पुष्टि अनिवार्य है।'
                          : 'Neither the municipal officer nor the Portal Manager can bypass citizen confirmation. Both 2-step verifications are legally mandatory.'}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: INTAKE QUEUE (Workflow A & B)                    */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'INTAKE' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[1050px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-5">
                    
                    {/* Header Banner */}
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                            {lang === 'hi' 
                              ? 'इनटेक सत्यापन एवं पंजीकरण फ्लोचार्ट (Workflow A: हेल्पलाइन फोन + Workflow B: व्हाट्सएप)' 
                              : 'Intake Verification & Registration Flowchart (Workflow A: Helpline + Workflow B: WhatsApp)'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lang === 'hi'
                              ? 'नियम: कॉल या व्हाट्सएप आने से शिकायत सीधे टिकट नहीं बनती; पोर्टल मैनेजर का सत्यापन अनिवार्य है।'
                              : 'Rule: Grievance inflow is never an official ticket without Portal Manager verification and acceptance.'}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 border border-blue-300 rounded-lg text-blue-900 font-bold text-xs">
                        Intake ➔ Verification ➔ CGR-XXXX Ticket
                      </div>
                    </div>

                    {/* Step-by-Step Connected Diagram */}
                    <div className="grid grid-cols-5 gap-3 items-stretch relative">
                      
                      {/* Step 1: Citizen Inflow */}
                      <div className="bg-blue-50/90 border-2 border-blue-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'चरण 1' : 'Step 1'}
                            </span>
                            <span className="text-[10px] text-blue-800 font-semibold">
                              {lang === 'hi' ? '👤 नागरिक' : '👤 Citizen'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-blue-950">
                            {lang === 'hi' ? 'शिकायत प्राप्ति माध्यम' : 'Citizen Grievance Inflow'}
                          </p>
                          <div className="text-[10px] text-slate-700 bg-white/80 p-2 rounded border border-blue-200 text-left space-y-1">
                            <div>📞 <b>{lang === 'hi' ? 'हेल्पलाइन कॉल:' : 'Helpline Call:'}</b> {lang === 'hi' ? 'सुबह 10 से शाम 6' : '10:00 AM – 6:00 PM'}</div>
                            <div>💬 <b>{lang === 'hi' ? 'व्हाट्सएप:' : 'WhatsApp:'}</b> {lang === 'hi' ? '24/7 कभी भी' : '24/7 Intake'}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-blue-700 font-medium">
                          {lang === 'hi' ? 'विवरण संकलन' : 'Details Captured'}
                        </div>
                      </div>

                      {/* Step 2: Working Hours Check */}
                      <div className="bg-amber-50/90 border-2 border-amber-400 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? 'चरण 2' : 'Step 2'}
                            </span>
                            <span className="text-[10px] text-amber-800 font-semibold">
                              {lang === 'hi' ? '<> कार्य समय जांच' : '<> Hours Check'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-amber-950">
                            {lang === 'hi' ? 'वर्किंग ऑवर्स (10 AM - 6 PM)' : 'Working Hours Check'}
                          </p>
                          <div className="space-y-1 text-left text-[10px]">
                            <div className="bg-emerald-50 border border-emerald-300 p-1.5 rounded text-emerald-900">
                              <b>{lang === 'hi' ? 'कार्य समय में:' : 'Working Hours:'}</b> {lang === 'hi' ? 'तुरंत पोर्टल में सत्यापन' : 'Instant portal verification'}
                            </div>
                            <div className="bg-amber-100 border border-amber-300 p-1.5 rounded text-amber-900">
                              <b>{lang === 'hi' ? 'शाम 6 के बाद / छुट्टी:' : 'After 6 PM / Holiday:'}</b> {lang === 'hi' ? 'अगली सुबह 10 AM इनटेक क्यू में समीक्षा' : 'Queued for review next morning'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-amber-800 font-bold">
                          {lang === 'hi' ? 'पोर्टल मैनेजर के पास प्रेषित' : 'Queued for Verification'}
                        </div>
                      </div>

                      {/* Step 3: Decision Diamond - Accept or Reject */}
                      <div className="bg-purple-50/95 border-2 border-purple-500 rounded-xl p-3 flex flex-col justify-between text-center relative shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-purple-700 text-white rounded text-[10px] font-bold">
                              {lang === 'hi' ? '<> निर्णय' : '<> Decision'}
                            </span>
                            <span className="text-[10px] text-purple-900 font-semibold">
                              {lang === 'hi' ? '🖥️ पोर्टल मैनेजर' : '🖥️ Portal Manager'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-purple-950">
                            {lang === 'hi' ? 'सत्यापन: वैध व स्वीकृत?' : 'Valid & Acceptable?'}
                          </p>
                          <p className="text-[11px] text-slate-600 text-left leading-relaxed">
                            {lang === 'hi'
                              ? 'पोर्टल मैनेजर वार्ड संख्या, नागरिक पता और नगर परिषद के अधिकार क्षेत्र की पुष्टि करता है।'
                              : 'PM verifies citizen identity, ward 1-60 locality, and municipal jurisdiction.'}
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] text-purple-800 font-bold">
                          {lang === 'hi' ? 'स्वीकृत अथवा अस्वीकृत' : 'Accept / Reject'}
                        </div>
                      </div>

                      {/* Step 4 & 5: Outcome Branches */}
                      <div className="col-span-2 space-y-2.5">
                        
                        {/* Branch YES: Accept & Register */}
                        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase">
                                {lang === 'hi' ? '✅ हाँ: स्वीकृत (Accept)' : '✅ YES: Accept & Register'}
                              </span>
                              <span className="font-bold text-xs text-emerald-950">
                                {lang === 'hi' ? 'आधिकारिक टिकट जारी (CGR-XXXX)' : 'Issue Ticket (CGR-XXXX)'}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-900 leading-snug">
                              {lang === 'hi'
                                ? 'केंद्रीय पोर्टल में दर्ज ➔ नागरिक को व्हाट्सएप ➔ वार्ड पार्षद व विभागीय नोडल अधिकारी को सीधा 3-तरफा प्रेषण (Workflow C)।'
                                : 'Registered in central DB ➔ Dispatched via 3-way WhatsApp to Citizen, Councillor & Nodal Officer (Workflow C).'}
                            </p>
                          </div>
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 ml-2" />
                        </div>

                        {/* Branch NO: Reject with Audit Reason */}
                        <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-3 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase">
                                {lang === 'hi' ? '❌ नहीं: अस्वीकृत (Reject)' : '❌ NO: Reject Grievance'}
                              </span>
                              <span className="font-bold text-xs text-rose-950">
                                {lang === 'hi' ? 'कोई टिकट नहीं, ऑडिट कारण दर्ज' : 'No Ticket, Audit Reason Logged'}
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-900 leading-snug">
                              {lang === 'hi'
                                ? 'अस्वीकृति का स्पष्ट कारण पोर्टल में दर्ज होता है (जैसे: अन्य नगर पालिका क्षेत्र या अस्पष्ट विवरण)। नागरिक को सूचित किया जाता है।'
                                : 'Mandatory rejection reason logged for audit. Citizen informed; no official ticket created.'}
                            </p>
                          </div>
                          <XCircle className="w-6 h-6 text-rose-600 shrink-0 ml-2" />
                        </div>

                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: DASHBOARD (Master Integrated Workflow)            */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'DASHBOARD' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[1050px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-5">
                    
                    {/* Header Banner */}
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                            {lang === 'hi' 
                              ? 'स्मार्ट नगर परिषद चित्तौड़गढ़ — सम्पूर्ण एकीकृत जीवनचक्र प्रवाह (Master Workflow)' 
                              : 'Smart Nagar Parishad Chittorgarh — Integrated Master Workflow'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lang === 'hi'
                              ? 'चित्तौड़टेक द्वारा प्रस्तावित: नागरिक शिकायत प्राप्ति से लेकर अंतिम समाधान एवं उच्चाधिकारी निगरानी का सम्पूर्ण सचित्र ढांचा'
                              : 'Proposed by ChittorTech: End-to-end operational architecture connecting all stakeholders'}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 border border-blue-300 rounded-lg text-blue-900 font-bold text-xs">
                        Page 1 & 10 Integrated Architecture
                      </div>
                    </div>

                    {/* Visual 5-Stage Architecture */}
                    <div className="grid grid-cols-5 gap-3 items-stretch relative">
                      
                      {/* Stage 1 */}
                      <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-center space-y-2">
                        <span className="px-2 py-0.5 bg-slate-700 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? '1. शिकायत आवक' : '1. Grievance Inflow'}
                        </span>
                        <p className="font-bold text-xs text-slate-900">
                          {lang === 'hi' ? 'हेल्पलाइन व व्हाट्सएप' : 'Helpline & WhatsApp'}
                        </p>
                        <p className="text-[10px] text-slate-600 leading-snug">
                          {lang === 'hi' ? 'कॉल 10 AM-6 PM या 24/7 व्हाट्सएप द्वारा विवरण संकलन' : 'Intake captured via phone or WhatsApp'}
                        </p>
                      </div>

                      {/* Stage 2 */}
                      <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-3 text-center space-y-2">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? '2. इनटेक सत्यापन' : '2. Intake Verification'}
                        </span>
                        <p className="font-bold text-xs text-blue-950">
                          {lang === 'hi' ? 'सत्यापन एवं टिकट जारी' : 'Verify & Generate Ticket'}
                        </p>
                        <p className="text-[10px] text-blue-800 leading-snug">
                          {lang === 'hi' ? 'पोर्टल मैनेजर द्वारा स्वीकृति ➔ CGR-XXXX टिकट' : 'Acceptance creates official ticket'}
                        </p>
                      </div>

                      {/* Stage 3 */}
                      <div className="bg-indigo-50 border-2 border-indigo-400 rounded-xl p-3 text-center space-y-2">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? '3. 3-तरफा प्रेषण' : '3. 3-Way Forwarding'}
                        </span>
                        <p className="font-bold text-xs text-indigo-950">
                          {lang === 'hi' ? 'व्हाट्सएप अलर्ट एवं SLA' : 'WhatsApp Dispatch & SLA'}
                        </p>
                        <p className="text-[10px] text-indigo-800 leading-snug">
                          {lang === 'hi' ? 'नागरिक, पार्षद व नोडल अधिकारी को सूचना (24h/48h/72h)' : 'Instant 3-way notification'}
                        </p>
                      </div>

                      {/* Stage 4 */}
                      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 text-center space-y-2">
                        <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? '4. फील्ड कार्य व मॉनिटरिंग' : '4. Field Work & Mobile Sync'}
                        </span>
                        <p className="font-bold text-xs text-amber-950">
                          {lang === 'hi' ? 'कार्य प्रगति एवं ऐप सिंक' : 'Field Work & Mobile App'}
                        </p>
                        <p className="text-[10px] text-amber-800 leading-snug">
                          {lang === 'hi' ? 'सभापति व उपसभापति ऐप पर लाइव ओवरड्यू निगरानी' : 'Live monitoring on executive mobile app'}
                        </p>
                      </div>

                      {/* Stage 5 */}
                      <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 text-center space-y-2">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? '5. 2-स्टेप समाधान' : '5. 2-Step Verified Closure'}
                        </span>
                        <p className="font-bold text-xs text-emerald-950">
                          {lang === 'hi' ? 'अनिवार्य दोहरी पुष्टि' : 'Mandatory 2-Step Closure'}
                        </p>
                        <p className="text-[10px] text-emerald-800 leading-snug">
                          {lang === 'hi' ? 'अधिकारी पुष्टि + नागरिक फोन पुष्टि = तभी टिकट बंद' : 'Authority + Citizen call confirmation'}
                        </p>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: WARDS 1-60                                        */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'WARDS' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[950px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>{lang === 'hi' ? 'वार्ड 1 से 60 पार्षद समन्वय एवं फील्ड आवंटन प्रवाह' : 'Ward Councillor Coordination Flowchart'}</span>
                      </span>
                      <span className="text-[11px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">
                        {lang === 'hi' ? 'सभी 60 वार्डों के निर्वाचित पार्षदों से सीधा संपर्क' : 'Direct contact with elected representatives'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 1' : 'Step 1'}
                        </span>
                        <p className="font-bold text-blue-950">{lang === 'hi' ? 'नागरिक पता व वार्ड पहचान' : 'Locality to Ward Mapping'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'शिकायत का वार्ड 1-60 में निर्धारण' : 'Assigned based on citizen landmark'}</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 2' : 'Step 2'}
                        </span>
                        <p className="font-bold text-indigo-950">{lang === 'hi' ? 'पार्षद डेटाबेस मैपिंग' : 'Councillor Lookup'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'पार्षद का नाम एवं मोबाइल नंबर लिंक' : 'Elected councillor linked to ticket'}</p>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 3' : 'Step 3'}
                        </span>
                        <p className="font-bold text-purple-950">{lang === 'hi' ? 'व्हाट्सएप अलर्ट प्रेषण' : 'WhatsApp Ward Alert'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'पार्षद को वार्ड शिकायत का पूरा ब्योरा' : 'Complete details forwarded instantly'}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-400 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 4' : 'Step 4'}
                        </span>
                        <p className="font-bold text-emerald-950">{lang === 'hi' ? 'धरातल पर निरीक्षण' : 'Ground Inspection'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'पार्षद द्वारा फील्ड कार्य की सीधी निगरानी' : 'Councillor oversees site progress'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: DEPARTMENTS                                       */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'DEPARTMENTS' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[950px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>{lang === 'hi' ? 'नगर परिषद के 6 विभाग, नोडल अधिकारी एवं मानक SLA प्रवाह' : 'Municipal Departments & SLA Flowchart'}</span>
                      </span>
                      <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-300">
                        {lang === 'hi' ? 'समयबद्ध नागरिक सेवा गारंटी' : 'Time-bound Civic Service Standards'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 1' : 'Step 1'}
                        </span>
                        <p className="font-bold text-blue-950">{lang === 'hi' ? 'विभाग चयन' : 'Department Routing'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'सफाई, रोशनी, सड़क, नाली आदि' : 'Sanitation, Lights, Roads, etc.'}</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 2' : 'Step 2'}
                        </span>
                        <p className="font-bold text-indigo-950">{lang === 'hi' ? 'नोडल अधिकारी दायित्व' : 'Nodal Officer Assigned'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'नामित अधिकारी के फोन पर कार्य आदेश' : 'Direct work order dispatch'}</p>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 3' : 'Step 3'}
                        </span>
                        <p className="font-bold text-amber-950">{lang === 'hi' ? 'SLA उल्टी गिनती' : 'SLA Countdown'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? '24h / 48h / 72h समय-सीमा ट्रैकिंग' : '24h/48h/72h resolution window'}</p>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'चरण 4' : 'Step 4'}
                        </span>
                        <p className="font-bold text-purple-950">{lang === 'hi' ? 'कार्य समाप्ति रिपोर्ट' : 'Completion Report'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'अधिकारी द्वारा पोर्टल मैनेजर को सूचना' : 'Reported to PM for 2-step call'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FLOWCHART: WHATSAPP AUDIT                                    */}
              {/* ------------------------------------------------------------ */}
              {tabKey === 'WHATSAPP' && (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[950px] bg-white rounded-xl p-5 border-2 border-slate-300 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                        <Send className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'hi' ? 'व्हाट्सएप ऑटोमेशन, ऑडिट लॉग एवं नागरिक सूचना प्रवाह' : 'WhatsApp Automation & Citizen Audit Flowchart'}</span>
                      </span>
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-300">
                        Workflow H: 100% Audit Logged
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'संदेश 1' : 'Message 1'}
                        </span>
                        <p className="font-bold text-blue-950">{lang === 'hi' ? 'पंजीकरण रसीद' : 'Registration Alert'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'नागरिक को टिकट नंबर (CGR-XXXX)' : 'Ticket ID & SLA sent to citizen'}</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'संदेश 2' : 'Message 2'}
                        </span>
                        <p className="font-bold text-indigo-950">{lang === 'hi' ? 'पार्षद अलर्ट' : 'Councillor Alert'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'वार्ड पार्षद को नागरिक शिकायत का अलर्ट' : 'Dispatched to elected representative'}</p>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'संदेश 3' : 'Message 3'}
                        </span>
                        <p className="font-bold text-amber-950">{lang === 'hi' ? 'अधिकारी कार्य आदेश' : 'Officer Work Order'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'विभागीय नोडल प्रभारी को फील्ड आदेश' : 'Direct order to department head'}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-400 rounded-xl text-center space-y-1">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                          {lang === 'hi' ? 'संदेश 4 (अंतिम)' : 'Message 4 (Final)'}
                        </span>
                        <p className="font-bold text-emerald-950">{lang === 'hi' ? 'आधिकारिक समाधान रसीद' : 'Official Hindi Closure'}</p>
                        <p className="text-[11px] text-slate-600">{lang === 'hi' ? 'नागरिक संतुष्टि पुष्टि के बाद रसीद' : 'Sent only post citizen confirmation'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 2: DETAILED OPERATIONAL GUIDELINES (TEXT VIEW)         */}
          {/* ============================================================ */}
          {viewMode === 'guide' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'hi' ? 'यहाँ क्या जानकारी उपलब्ध है?' : 'What information is available here?'}</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {tabKey === 'DASHBOARD' && (lang === 'hi'
                    ? 'चित्तौड़गढ़ नगर परिषद शिकायत निवारण प्रणाली का संपूर्ण केंद्रीय अवलोकन। यहाँ आज की दर्ज शिकायतें, कुल शिकायतें, फील्ड में लंबित कार्य, 2-चरणीय प्रमाणित समाधान, और SLA पार कर चुके मामलों के लाइव आंकड़े उपलब्ध हैं।'
                    : 'Central dashboard overview of Nagar Parishad Chittorgarh grievance operations, with real-time counters for today intakes, total tickets, pending field execution, 2-step certified closures, and SLA breaches.')}
                  {tabKey === 'INTAKE' && (lang === 'hi' 
                    ? 'हेल्पलाइन कॉल (सुबह 10 बजे से शाम 6 बजे) और 24/7 व्हाट्सएप से प्राप्त अन-सत्यापित शिकायतें। पोर्टल मैनेजर द्वारा सत्यापन के बाद ही आधिकारिक टिकट नंबर जारी होता है।' 
                    : 'Unverified citizen complaints received via Helpline (10 AM - 6 PM) and 24/7 WhatsApp. A ticket number is issued only after Portal Manager acceptance.')}
                  {tabKey === 'TICKETS' && (lang === 'hi'
                    ? 'चित्तौड़गढ़ नगर परिषद के सभी 60 वार्डों की आधिकारिक शिकायतें। यहाँ प्रत्येक टिकट का स्टेटस, नागरिक संपर्क, वार्ड, विभाग और SLA स्थिति उपलब्ध है।'
                    : 'Officially registered municipal tickets across all 60 wards, with citizen info, assigned departments, SLAs, and live resolution status.')}
                  {tabKey === 'SLA' && (lang === 'hi'
                    ? 'तय समय-सीमा (SLA) पार कर चुकी या उच्चाधिकारियों को प्रेषित शिकायतें। यह सूची सभापति एवं उपसभापति मोबाइल ऐप पर प्राथमिकता से प्रदर्शित होती है।'
                    : 'Overdue complaints and critical administrative escalations synced directly with Chairman & Vice-Chairman mobile apps.')}
                  {tabKey === 'WARDS' && (lang === 'hi'
                    ? 'सभी 60 वार्डों का वर्गीकरण, निर्वाचित पार्षद का नाम, मोबाइल नंबर और प्रमुख लैंडमार्क।'
                    : 'Complete directory of 60 wards, elected councillors, phone contacts, and municipal landmarks.')}
                  {tabKey === 'DEPARTMENTS' && (lang === 'hi'
                    ? 'नगर परिषद के सभी 6 आधिकारिक विभाग, उनके नोडल अधिकारी, संपर्क नंबर और निर्धारित समाधान SLA घंटे।'
                    : 'Official municipal departments, designated nodal heads, phone numbers, and standard SLA hours.')}
                  {tabKey === 'WHATSAPP' && (lang === 'hi'
                    ? 'नागरिकों, पार्षदों और अधिकारियों को भेजे गए सभी आधिकारिक हिंदी संदेशों का ऑडिट लॉग।'
                    : 'Full audit trail of automated WhatsApp notifications dispatched to citizens, councillors, and department officers.')}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'hi' ? 'आप यहाँ क्या-क्या कार्य कर सकते हैं?' : 'What actions can you perform here?'}</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {tabKey === 'DASHBOARD' && (lang === 'hi'
                    ? 'समस्त नगर परिषद की समग्र स्थिति का निरीक्षण करें, नए इनटेक दर्ज करें, डेटाबेस रीफ्रेश करें और किसी भी विशिष्ट वार्ड अथवा स्थिति के अनुसार फिल्टर करें।'
                    : 'Monitor municipal metrics, register new citizen grievances, sync database, and drill down by status or ward.')}
                  {tabKey === 'INTAKE' && (lang === 'hi'
                    ? 'शिकायत की पुष्टि कर विभाग व SLA आवंटित करें (Verify & Accept) या वैध कारण दर्ज कर अस्वीकृत (Reject) करें।'
                    : 'Verify and accept complaints with SLA assignment, or reject invalid complaints with a mandatory audit reason.')}
                  {tabKey === 'TICKETS' && (lang === 'hi'
                    ? 'नागरिक को फोन करें, समाधान की जांच करें, तथा 2-स्टेप सत्यापन (अधिकारी पुष्टि + नागरिक पुष्टि) के बाद ही टिकट बंद करें।'
                    : 'Call citizens, verify ground progress, and execute the mandatory Two-Step Ticket Closure.')}
                  {tabKey === 'SLA' && (lang === 'hi'
                    ? 'नोडल अधिकारी व पार्षद से तुरंत संपर्क कर समाधान में तेजी लाएं अथवा आयुक्त/सभापति को एस्केलेट करें।'
                    : 'Directly escalate to department heads and ward councillors for immediate resolution intervention.')}
                  {tabKey === 'WARDS' && (lang === 'hi'
                    ? 'पार्षद के नंबर पर क्लिक करके तुरंत कॉल करें और नागरिक की समस्या से अवगत कराएं।'
                    : 'Click councillor phone numbers to establish instant telephonic contact for ward oversight.')}
                  {tabKey === 'DEPARTMENTS' && (lang === 'hi'
                    ? 'विभागीय प्रभारी को सीधे कॉल कर शिकायत के त्वरित समाधान का निर्देश दें।'
                    : 'Call department nodal officers directly to issue follow-up or priority instructions.')}
                  {tabKey === 'WHATSAPP' && (lang === 'hi'
                    ? 'जांच करें कि नागरिक और अधिकारी को व्हाट्सएप संदेश पहुँचा या नहीं, तथा मैसेज का पूरा पाठ देखें।'
                    : 'Review delivery status and inspect the full content of automated notifications.')}
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
