import React, { useState } from 'react';
import { User, ClassSection } from '../types';
import { CollegeLogo } from './CollegeLogo';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Phone,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
  Building2,
  Check
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  classes?: ClassSection[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  classes = []
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [userType, setUserType] = useState<'STUDENT' | 'TEACHER' | 'PARENT'>('STUDENT');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotNotice, setForgotNotice] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId] = useState<number>(classes[0]?.id || 1);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [relationship, setRelationship] = useState<'Father' | 'Mother' | 'Guardian'>('Guardian');
  const [studentIdentifier, setStudentIdentifier] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotNotice(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (userType === 'PARENT' && regPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: regEmail,
          password: regPassword,
          role: userType,
          ...(userType === 'PARENT'
            ? {
                whatsapp_number: guardianPhone,
                relationship,
                student_identifier: studentIdentifier,
              }
            : {
                roll_number: rollNumber,
                class_id: classId,
                guardian_phone: guardianPhone,
              })
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please check details.');
      }

      onLoginSuccess(data.user);
      if (userType === 'PARENT') {
        setSuccessMsg(data.message || 'Parent account created and child verified. Opening your parent portal…');
        window.setTimeout(onClose, 1200);
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT') => {
    if (role === 'ADMIN') {
      setLoginEmail('admin@alpine.edu.pk');
      setLoginPassword('password123');
    } else if (role === 'TEACHER') {
      setLoginEmail('yasir@alpine.edu.pk');
      setLoginPassword('password123');
    } else if (role === 'PARENT') {
      setLoginEmail('tariq.khan@parents.alpine.edu.pk');
      setLoginPassword('password123');
    } else {
      setLoginEmail('ali.khan@student.alpine.edu.pk');
      setLoginPassword('password123');
    }
    setActiveTab('LOGIN');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm min-h-[100dvh] overflow-y-auto animate-fadeIn">
      
      {/* Outer Card: Fits comfortably within viewport */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md md:max-w-3xl overflow-hidden flex flex-col md:flex-row my-auto max-h-[92vh] animate-scaleUp relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: Branding & System Visual (Shown on md+ screens) */}
        <div className="hidden md:flex md:w-[320px] lg:w-[360px] bg-[#292524] p-6 text-white flex-col justify-between shrink-0 relative overflow-hidden border-r border-[#E7E5E4]">
          
          {/* Top Brand Header */}
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#EAF5F0] text-[#3F8F72] rounded-2xl border border-[#A3D9C9]">
                <GraduationCap className="w-6 h-6 text-[#3F8F72]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Alpine Degree College
                </h3>
                <p className="text-[10px] text-[#A3D9C9] font-bold uppercase tracking-wider">
                  Khanpur • IUB Affiliated
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white pt-2 leading-snug">
              Smart Attendance Management System
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed font-normal">
              Digital attendance registers, student performance tracking, IUB 75% exam criteria monitoring, and medical leave approvals.
            </p>
          </div>

          {/* Middle Visual Card */}
          <div className="relative z-10 my-4 bg-stone-800 rounded-2xl p-4 border border-stone-700 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A3D9C9] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Attendance Sync
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF5F0] text-[#3F8F72] text-[10px] font-bold">
                96.4% Active
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-white text-[11px]">
                <span>Today's Conducted Classes</span>
                <span>18 / 18</span>
              </div>
              <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                <div className="h-full bg-[#3F8F72] w-[96%]" />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-stone-300">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A3D9C9]" />
                Role-Based Security
              </span>
              <span>v2.5 Release</span>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 pt-2 border-t border-stone-700 text-[11px] text-stone-300 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#A3D9C9] shrink-0" />
            <span>Encrypted Single Sign-On Access</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Compact Login/Register Card */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4 bg-white text-[#292524]">
          
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 md:hidden mb-2">
              <div className="p-1.5 bg-[#EAF5F0] text-[#3F8F72] rounded-xl">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#292524] uppercase tracking-wider">
                Alpine Degree College
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#292524] tracking-tight">
              {activeTab === 'LOGIN' ? 'Welcome Back' : userType === 'PARENT' ? 'Create Parent Account' : 'Create Student / Faculty Account'}
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              {activeTab === 'LOGIN'
                ? 'Sign in with your email, Student ID, or Teacher ID'
                : 'Fill in your academic details to request portal access'}
            </p>

            {/* Compact Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-[#F5F5F4] p-1 rounded-xl mt-3 text-xs font-semibold border border-[#E7E5E4]">
              <button
                type="button"
                onClick={() => { setActiveTab('LOGIN'); setErrorMsg(''); setForgotNotice(false); }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'LOGIN'
                    ? 'bg-white text-[#3F8F72] shadow-2xs font-bold'
                    : 'text-[#57534E] hover:text-[#292524]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('REGISTER'); setErrorMsg(''); setForgotNotice(false); }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'REGISTER'
                    ? 'bg-white text-[#3F8F72] shadow-2xs font-bold'
                    : 'text-[#57534E] hover:text-[#292524]'
                }`}
              >
                New Registration
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {forgotNotice && (
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-300 rounded-xl text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                Password Recovery Instructions:
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Please contact the IT Helpdesk at <a href="mailto:admin@alpine.edu.pk" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">admin@alpine.edu.pk</a> or visit the Academic Office to reset your password. You can also use the Quick Demo buttons below.
              </p>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="block text-[#292524] font-bold mb-1 text-[11px]">
                  Email, Student ID, Roll No, or Teacher ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. CS-2022-042 or STU-2022-001 or email"
                    className="w-full bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl pl-9 pr-3 py-2 font-medium text-[#292524] text-xs focus:outline-none focus:ring-2 focus:ring-[#3F8F72]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[#292524] font-bold text-[11px]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotNotice(!forgotNotice)}
                    className="text-[10px] font-bold text-[#3F8F72] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl pl-9 pr-10 py-2 font-medium text-[#292524] text-xs focus:outline-none focus:ring-2 focus:ring-[#3F8F72]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#78716C] hover:text-[#292524] cursor-pointer"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Quick Info */}
              <div className="flex items-center justify-between text-[11px] text-[#57534E]">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-[#E7E5E4] text-[#3F8F72] focus:ring-[#3F8F72] w-3.5 h-3.5"
                  />
                  <span>Remember Me</span>
                </label>
                <span className="text-[10px] font-semibold text-[#3F8F72] bg-[#EAF5F0] px-2 py-0.5 rounded-full border border-[#A3D9C9]">
                  Demo Password: password123
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-extrabold py-2.5 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Autofill Pills */}
              <div className="pt-2 border-t border-zinc-100 dark:border-[#27272a] space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                  Quick Demo Account Sign In
                </p>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('STUDENT')}
                    className="py-1.5 px-1 bg-white hover:bg-[#F5F5F4] text-[#292524] rounded-lg font-bold text-[10px] border border-[#E7E5E4] transition-colors cursor-pointer text-center"
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('TEACHER')}
                    className="py-1.5 px-1 bg-white hover:bg-[#F5F5F4] text-[#292524] rounded-lg font-bold text-[10px] border border-[#E7E5E4] transition-colors cursor-pointer text-center"
                  >
                    👨‍🏫 Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('PARENT')}
                    className="py-1.5 px-1 bg-[#EAF5F0] hover:bg-[#D8EDE5] text-[#3F8F72] rounded-lg font-bold text-[10px] border border-[#3F8F72]/30 transition-colors cursor-pointer text-center"
                  >
                    👪 Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('ADMIN')}
                    className="py-1.5 px-1 bg-white hover:bg-[#F5F5F4] text-[#292524] rounded-lg font-bold text-[10px] border border-[#E7E5E4] transition-colors cursor-pointer text-center"
                  >
                    👑 Admin
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
              
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-[#78716C]">Account Type:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setUserType('STUDENT')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      userType === 'STUDENT' ? 'bg-[#3F8F72] text-white' : 'bg-[#F5F5F4] text-[#78716C]'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('TEACHER')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      userType === 'TEACHER' ? 'bg-[#3F8F72] text-white' : 'bg-[#F5F5F4] text-[#78716C]'
                    }`}
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('PARENT')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      userType === 'PARENT' ? 'bg-[#3F8F72] text-white' : 'bg-[#F5F5F4] text-[#78716C]'
                    }`}
                  >
                    Parent
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Hamza"
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">
                  {userType === 'PARENT' ? 'Email Address' : 'Official Email'}
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="hamza@student.alpine.edu.pk"
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {userType === 'PARENT' && (
                <>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Confirm Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">WhatsApp Number (with country code)</label>
                    <input
                      type="tel"
                      required
                      pattern="(?:\+|00|92)[0-9 ()-]{7,20}"
                      value={guardianPhone}
                      onChange={e => setGuardianPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Relationship with Student</label>
                      <select
                        required
                        value={relationship}
                        onChange={e => setRelationship(e.target.value as 'Father' | 'Mother' | 'Guardian')}
                        className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Student ID / Registration Number</label>
                      <input
                        type="text"
                        required
                        value={studentIdentifier}
                        onChange={e => setStudentIdentifier(e.target.value)}
                        placeholder="e.g. STU-2022-001"
                        className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    We verify the student number against the WhatsApp number already registered by the institution.
                  </p>
                </>
              )}

              {userType === 'STUDENT' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Roll Number</label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={e => setRollNumber(e.target.value)}
                        placeholder="CS-2022-099"
                        className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Class Section</label>
                      <select
                        value={classId}
                        onChange={e => setClassId(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-0.5 text-[11px]">Contact Phone</label>
                    <input
                      type="text"
                      required={activeTab === 'REGISTER'}
                      value={guardianPhone}
                      onChange={e => setGuardianPhone(e.target.value)}
                      placeholder="Registered guardian WhatsApp, e.g. +92 300 1234567"
                      className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#263449] rounded-xl p-2 text-xs font-medium text-slate-900 dark:text-white"
                    />
                    {activeTab === 'REGISTER' && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Existing students must enter the guardian number registered with the institution to activate their portal login.
                      </p>
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold py-2.5 rounded-xl shadow-2xs transition-colors mt-2 cursor-pointer text-xs"
              >
                {loading ? 'Creating Account...' : 'Register Account & Sign In'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
