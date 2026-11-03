import { useState } from 'react';
import { NagarParishadLogo } from './NagarParishadLogo';
import type { UserRole } from '../types';
import { 
  Database, 
  MapPin, 
  ShieldCheck, 
  Headphones, 
  Eye, 
  EyeOff, 
  Phone, 
  MessageSquare, 
  Mail, 
  ExternalLink,
  Lock,
  ArrowRight,
  ClockAlert,
  Inbox,
  Sparkles
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: UserRole, email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('PORTAL_MANAGER');
  const [email, setEmail] = useState('portalmanager@chittorgarh.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setLoginError(null);
    if (role === 'PORTAL_MANAGER') {
      setEmail('portalmanager@chittorgarh.gov.in');
    } else {
      setEmail('chairman@chittorgarh.gov.in');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLoginError("कृपया एक मान्य आधिकारिक ईमेल पता दर्ज करें (Valid email address required).");
      return;
    }

    if (!password || password.length < 4) {
      setLoginError("पासवर्ड कम से कम 4 अक्षरों का होना आवश्यक है (Password must be at least 4 characters).");
      return;
    }

    onLogin(selectedRole, cleanEmail);
  };

  // Official portal functionalities listed under Nagar Parishad Admin
  const portalFeatures = [
    {
      title: 'Live Chittorgarh Central Database Synchronization',
      desc: 'Encrypted, confidential municipal database sync with zero third-party exposure.',
      icon: <Database className="w-4 h-4 text-sky-400" />,
      accent: 'border-sky-500/20 bg-sky-500/10 text-sky-300'
    },
    {
      title: '60-Ward GIS Complaint & Councillor Routing',
      desc: 'Automated locality mapping, landmark tagging, and direct councillor dispatch.',
      icon: <MapPin className="w-4 h-4 text-emerald-400" />,
      accent: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    },
    {
      title: 'Automated Hindi WhatsApp Citizen Notifications',
      desc: 'Instant 24/7 registration acknowledgements, tracking links, and progress updates.',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      accent: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    },
    {
      title: 'Mandatory 2-Step Citizen-Certified Closure',
      desc: 'Department officer sign-off followed by mandatory citizen telephonic satisfaction verification.',
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
      accent: 'border-purple-500/20 bg-purple-500/10 text-purple-300'
    },
    {
      title: 'Real-Time SLA & Executive Escalation Monitoring',
      desc: '12h, 24h, 48h, 72h departmental resolution countdowns with Hon. Chairman oversight.',
      icon: <ClockAlert className="w-4 h-4 text-amber-400" />,
      accent: 'border-amber-500/20 bg-amber-500/10 text-amber-300'
    },
    {
      title: 'Helpline Intake Queue (10 AM - 6 PM) & Verification',
      desc: 'Centralized review desk for incoming helpline calls, WhatsApp bot intakes, and after-hours queues.',
      icon: <Inbox className="w-4 h-4 text-sky-400" />,
      accent: 'border-sky-500/20 bg-sky-500/10 text-sky-300'
    }
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-900 font-sans">
      
      {/* ========================================================
          LEFT BRAND PANEL: Official Government & ChittorTech Showcase
          Color Palette: Deep Royal Navy (#0A1628), White, and Sky-Blue Glows
         ======================================================== */}
      <div className="relative flex flex-col justify-between bg-gradient-to-br from-[#071224] via-[#0C1D36] to-[#060F1E] p-8 lg:p-12 xl:p-14 lg:w-1/2 text-white overflow-hidden border-b lg:border-b-0 lg:border-r border-sky-950/60 shadow-2xl">
        
        {/* Sky-Blue and Navy Ambient Lighting / Subtle Gradients */}
        <div className="absolute top-0 right-0 -mr-28 -mt-28 w-[420px] h-[420px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-28 -mb-28 w-[420px] h-[420px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-sky-400/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Badges: Government Seal & ChittorTech Verification */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-sky-800/40 px-3.5 py-1.5 rounded-xl shadow-md backdrop-blur-md">
            <NagarParishadLogo size="sm" theme="dark" />
          </div>
          
          <div className="flex items-center gap-1.5 bg-sky-950/70 border border-sky-600/40 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider text-sky-200 shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>ChittorTech</span>
            <span className="text-amber-400 font-mono font-normal text-[11px] ml-1">OFFICIAL DEVELOPER</span>
          </div>
        </div>

        {/* Main Content & Feature Architecture */}
        <div className="relative z-10 my-8 lg:my-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-xs font-mono text-sky-300 tracking-wide uppercase shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>OFFICIAL MUNICIPAL ADMINISTRATIVE PORTAL</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Nagar Parishad <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-amber-300 bg-clip-text text-transparent">Admin</span>
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/90 font-medium">
              स्मार्ट शिकायत एवं नागरिक सेवा प्रबंधन प्रणाली &bull; Government of Rajasthan
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl pt-1">
              Central administrative portal for Nagar Parishad Chittorgarh. Securely interconnecting 60 Municipal Wards, 
              Live Chittorgarh Central Database Synchronization, automated Hindi WhatsApp citizen dispatch, and executive SLA monitoring.
            </p>
          </div>

          {/* Core Functional Capabilities (User Requested Section) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Core Administrator &amp; Executive Capabilities
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-sky-500/40 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {portalFeatures.map((feat, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all backdrop-blur-xs"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${feat.accent}`}>
                    {feat.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 leading-snug">
                      {feat.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Security & Governance Status */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-5 border-t border-sky-900/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Live Chittorgarh Central Database: Active &amp; Operational</span>
          </div>
          <div className="text-[11px] text-sky-300/80 font-mono">
            SSL Edge Encrypted &bull; ISO 27001 Protocol
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT LOGIN PANEL: Clean White & Sky-Blue Official Card
         ======================================================== */}
      <div className="flex items-center justify-center bg-gradient-to-b from-white via-slate-50/50 to-sky-50/30 lg:w-1/2 p-6 sm:p-10 lg:p-14 xl:p-16">
        <div className="w-full max-w-md space-y-6">
          
          {/* Welcome Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100/80 border border-sky-200 text-sky-700 mb-1 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Please enter your official municipal credentials to access the portal.
            </p>
          </div>

          {/* Official Role Indicator: Portal Manager & Chairman (Only Two Roles) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Select Authorized Role
              </label>
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                Equal Permissions
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('PORTAL_MANAGER')}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  selectedRole === 'PORTAL_MANAGER'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20 text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  selectedRole === 'PORTAL_MANAGER' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  PM
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Portal Manager</span>
                  <span className="text-[10px] text-slate-500 block">Full Governance</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('CHAIRMAN')}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  selectedRole === 'CHAIRMAN'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20 text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  selectedRole === 'CHAIRMAN' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  CH
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Chairman</span>
                  <span className="text-[10px] text-slate-500 block">Full Governance</span>
                </div>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="portalmanager@chittorgarh.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert("Please contact ChittorTech Technical Support (+91 7597451057) for password recovery."); }} 
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 hover:from-sky-600 hover:to-blue-800 active:scale-[0.99] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* DEDICATED CHITTORTECH SUPPORT CARD */}
          <div className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold tracking-tight">
                <Headphones className="w-4 h-4 text-sky-600" />
                <span>CHITTORTECH DEDICATED SUPPORT</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                24/7 Priority
              </span>
            </div>

            {/* Quick Call & WhatsApp Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a 
                href="tel:+917597451057" 
                className="flex items-center justify-center gap-1.5 p-2 bg-sky-50/70 rounded-lg border border-sky-200 font-semibold text-sky-900 hover:bg-sky-100 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>+91 7597451057</span>
              </a>
              <a 
                href="https://wa.me/917597451057" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50/70 rounded-lg border border-emerald-200 font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Alternate Numbers & Emails */}
            <div className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  Alternate: <a href="tel:+917597901057" className="text-slate-800 hover:underline font-mono font-medium">+91 7597901057</a>, <a href="tel:+918233816674" className="text-slate-800 hover:underline font-mono font-medium">+91 8233816674</a>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  Email: <a href="mailto:support@chittortech.in" className="text-sky-700 hover:underline font-medium">support@chittortech.in</a> &bull; <a href="mailto:business@chittortech.in" className="text-sky-700 hover:underline font-medium">business@chittortech.in</a>
                </span>
              </div>
            </div>

            {/* Portal Link */}
            <div className="text-center pt-1 border-t border-slate-100">
              <a 
                href="https://chittortech.in" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:underline"
              >
                <span>Visit Official ChittorTech Portal (chittortech.in)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
