import { useState } from 'react';
import type { Ticket } from '../types';
import { 
  X, 
  ShieldCheck, 
  Phone, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Send,
  Lock,
  RotateCcw
} from 'lucide-react';
import { getWhatsAppUrl } from '../lib/whatsapp';

interface TwoStepClosureModalProps {
  ticket: Ticket;
  onClose: () => void;
  onConfirmAuthority: (ticketId: string, notes: string) => void;
  onConfirmCitizen: (ticketId: string, satisfied: boolean, feedback: string, callOutcome: string) => void;
}

export const TwoStepClosureModal = ({
  ticket,
  onClose,
  onConfirmAuthority,
  onConfirmCitizen
}: TwoStepClosureModalProps) => {

  // 1-Time Reopen Rule: A complaint can only be reopened ONCE. Once reopened, it can only be closed.
  const isAlreadyReopened = 
    Boolean(ticket.is_reopened) || 
    (ticket.reopen_count !== undefined && ticket.reopen_count >= 1) || 
    ticket.status === 'REOPENED';

  const [activeStep, setActiveStep] = useState<1 | 2>(ticket.authority_confirmed ? 2 : 1);
  const [authorityNotes, setAuthorityNotes] = useState(ticket.authority_notes || 'Field team & responsible officer verified on-site completion.');
  const [citizenFeedback, setCitizenFeedback] = useState(
    isAlreadyReopened 
      ? 'Citizen confirmed resolution upon re-verification call.' 
      : 'Citizen confirmed problem resolved satisfactorily on verification call.'
  );
  const [citizenSatisfied, setCitizenSatisfied] = useState<boolean | null>(true);
  const [callOutcome, setCallOutcome] = useState('ANSWERED_CONFIRMED');

  const todayDateStr = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const hindiWhatsAppMessage = `🏛️ *स्मार्ट नगर परिषद चित्तौड़गढ़*
*शिकायत समाधान सूचना* ✅

🙏 *नमस्ते ${ticket.citizen_name} जी,*

आपकी शिकायत संख्या *${ticket.ticket_number}* का नगर परिषद टीम द्वारा सफलतापूर्वक समाधान कर दिया गया है एवं आपके द्वारा सत्यापन भी प्राप्त हो चुका है।

📋 *समाधान विवरण:*
━━━━━━━━━━━━━━━━━━━
▫️ *टिकट सं.:* ${ticket.ticket_number}
▫️ *विभाग:* ${ticket.department_name}
▫️ *वार्ड सं.:* वार्ड ${ticket.ward_number}
▫️ *समाधान दिनांक:* ${todayDateStr}
▫️ *अंतिम स्थिति:* *सफलतापूर्वक निस्तारित एवं बंद (CLOSED)* ✅
━━━━━━━━━━━━━━━━━━━

📞 *नागरिक सुविधा सूचना (भविष्य में नई शिकायत हेतु):*
• *कार्यालय समय (सुबह 10:00 AM से शाम 06:00 PM):*
  हमारे कंट्रोल रूम हेल्पलाइन नंबर पर कॉल करके शिकायत दर्ज करा सकते हैं: *01472-240001*
• *कार्यालय समय के बाद (शाम 06:00 PM से सुबह 10:00 AM) एवं 24/7:*
  आप कभी भी इसी WhatsApp नंबर पर अपनी शिकायत लिखकर भेज सकते हैं।

🤝 *हम आपकी सेवा में सदैव तत्पर हैं।*
"स्वच्छ चित्तौड़गढ़, स्वस्थ एवं सुंदर चित्तौड़गढ़"

*आपका शुभचिंतक,*
*अनिल ईनाणी* (सभापति)
नगर परिषद चित्तौड़गढ़ 🙏`;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorityNotes.trim()) {
      alert("Please enter authority verification notes.");
      return;
    }
    onConfirmAuthority(ticket.id, authorityNotes);
    setActiveStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyReopened && citizenSatisfied === false) {
      alert("यह शिकायत पूर्व में 1 बार री-ओपन हो चुकी है। नियमानुसार इसे दोबारा री-ओपन नहीं किया जा सकता, केवल क्लोज किया जा सकता है।");
      return;
    }

    if (citizenSatisfied === null) {
      alert("Please record whether the citizen confirmed satisfaction or reported unresolved.");
      return;
    }

    // Auto-launch WhatsApp if citizen is satisfied
    if (citizenSatisfied === true) {
      const waUrl = getWhatsAppUrl(ticket.citizen_phone, hindiWhatsAppMessage);
      window.open(waUrl, '_blank');
    }

    onConfirmCitizen(ticket.id, citizenSatisfied, citizenFeedback, callOutcome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Mandatory Two-Step Complaint Closure
              </h3>
              <p className="text-xs text-slate-400">
                Ticket: <span className="font-mono text-amber-400 font-semibold">{ticket.ticket_number}</span> &bull; Ward {ticket.ward_number}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeStep === 1 
                ? 'border-blue-600 text-blue-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              ticket.authority_confirmed ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {ticket.authority_confirmed ? '✓' : '1'}
            </span>
            <span>Step 1: Authority Confirmation</span>
          </button>

          <button
            type="button"
            onClick={() => ticket.authority_confirmed && setActiveStep(2)}
            disabled={!ticket.authority_confirmed}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              !ticket.authority_confirmed
                ? 'opacity-50 cursor-not-allowed border-transparent text-slate-400'
                : activeStep === 2
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-300 text-slate-700">
              2
            </span>
            <span>Step 2: Citizen Confirmation</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Ticket Context summary */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between items-center text-slate-900 font-semibold">
              <span>Problem: {ticket.category_name}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                {ticket.department_name}
              </span>
            </div>
            <p className="text-slate-700 italic">"{ticket.problem_description}"</p>
            <div className="flex gap-4 pt-1 text-slate-500">
              <span>Location: {ticket.address}</span>
              <span>Officer: {ticket.assigned_officer_name} ({ticket.assigned_officer_phone})</span>
            </div>
          </div>

          {/* STEP 1: AUTHORITY CONFIRMATION */}
          {activeStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Portal Manager: Verify Completion with Responsible Officer</span>
                </div>
                <p>
                  Call responsible officer <strong>{ticket.assigned_officer_name}</strong> at{' '}
                  <a href={`tel:${ticket.assigned_officer_phone}`} className="font-semibold underline">
                    {ticket.assigned_officer_phone}
                  </a>{' '}
                  to confirm the on-site physical completion of work.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Officer Confirmation Details &amp; Work Evidence
                </label>
                <textarea
                  rows={3}
                  value={authorityNotes}
                  onChange={(e) => setAuthorityNotes(e.target.value)}
                  placeholder="Record officer response, vehicle number, team details, or date/time of completion..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Certify Authority &amp; Proceed to Citizen Verification</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CITIZEN CONFIRMATION */}
          {activeStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>Mandatory Citizen Verification Call</span>
                </div>
                <p>
                  Directly call complainant <strong>{ticket.citizen_name}</strong> at{' '}
                  <a href={`tel:${ticket.citizen_phone}`} className="font-semibold underline text-blue-700">
                    {ticket.citizen_phone}
                  </a>{' '}
                  and verify if they are fully satisfied with the on-ground resolution.
                </p>
              </div>

              {/* 1-Time Reopen Rule Notice if ticket was already reopened */}
              {isAlreadyReopened && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
                  <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950">नियम: अधिकतम 1 बार ही री-ओपन मान्य (1-Time Reopen Policy)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300 font-mono">
                        FINAL RESOLUTION CYCLE
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      यह शिकायत (<strong className="font-mono">{ticket.ticket_number}</strong>) पूर्व में 1 बार री-ओपन हो चुकी है। नियमानुसार दोबारा री-ओपन नहीं की जा सकती, अब केवल नागरिक सत्यापन उपरांत <strong>स्थायी रूप से क्लोज (Closed)</strong> ही की जा सकती है।
                    </p>
                  </div>
                </div>
              )}

              {/* Citizen Response Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Citizen Verification Result (Mandatory)
                  </label>
                  {isAlreadyReopened && (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Reopen Disabled (1-Time Limit)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenSatisfied(true);
                      setCallOutcome('ANSWERED_CONFIRMED');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      citizenSatisfied === true
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${citizenSatisfied === true ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {isAlreadyReopened ? 'Citizen Confirmed Resolution (Final Close)' : 'Citizen Confirmed Satisfied'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAlreadyReopened 
                          ? 'Work re-verified complete. Ticket will be permanently CLOSED and Hindi WhatsApp sent.' 
                          : 'Work verified complete. Ticket will be permanently CLOSED and Hindi WhatsApp sent.'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAlreadyReopened}
                    onClick={() => {
                      if (isAlreadyReopened) return;
                      setCitizenSatisfied(false);
                      setCallOutcome('ANSWERED_NOT_RESOLVED');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isAlreadyReopened
                        ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed text-slate-400'
                        : citizenSatisfied === false
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isAlreadyReopened ? (
                      <Lock className="w-5 h-5 shrink-0 text-slate-400" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 shrink-0 ${citizenSatisfied === false ? 'text-rose-600' : 'text-slate-400'}`} />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className={`font-bold text-xs ${isAlreadyReopened ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          Problem Still Unresolved
                        </p>
                        {isAlreadyReopened && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            LOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAlreadyReopened 
                          ? '1 बार री-ओपन की सीमा पूरी हो चुकी है। अब दोबारा री-ओपन नहीं किया जा सकता।'
                          : 'Citizen reports pending work. Ticket will be REOPENED and officer re-alerted.'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Citizen Feedback text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Citizen Call Notes / Feedback
                </label>
                <textarea
                  rows={2}
                  value={citizenFeedback}
                  onChange={(e) => setCitizenFeedback(e.target.value)}
                  placeholder="Record citizen statements, remarks, or specific reasons if unresolved..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Official Hindi WhatsApp Template Preview if satisfied */}
              {citizenSatisfied === true && (
                <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <span>WhatsApp Preview (Clear &amp; Spaced Format)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Official Notice
                    </span>
                  </div>

                  {/* Clean WhatsApp Chat Bubble with Generous Margins & Line Height */}
                  <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200/70 shadow-xs">
                    <pre className="text-xs sm:text-[13px] bg-white p-4 sm:p-5 rounded-xl border border-emerald-100/80 text-slate-900 font-sans whitespace-pre-wrap leading-6 sm:leading-7 tracking-wide shadow-2xs">
                      {hindiWhatsAppMessage}
                    </pre>
                  </div>

                  {/* Direct 1-Click WhatsApp Button requested by user */}
                  <a
                    href={getWhatsAppUrl(ticket.citizen_phone, hindiWhatsAppMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/15 transition-all active:scale-98 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>📲 WhatsApp खोलें एवं नागरिक ({ticket.citizen_name}) को भेजें</span>
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Back to Step 1
                </button>
                <button
                  type="submit"
                  disabled={citizenSatisfied === null}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all ${
                    citizenSatisfied === true
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : citizenSatisfied === false
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {citizenSatisfied === true ? 'Finalize Official Closure & Send WhatsApp' : 'Save & Reopen Ticket for Officer'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
