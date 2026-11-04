import React, { useState, useRef, useEffect } from 'react';
import { User, Student, Teacher, Subject } from '../types';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Calendar,
  ShieldCheck,
  Edit3,
  Check,
  Building2,
  FileText,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface UserProfileModuleProps {
  currentUser: User | null;
  students: Student[];
  teachers?: Teacher[];
  subjects: Subject[];
  onRefresh?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  { label: 'Student Male 1', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
  { label: 'Student Female 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { label: 'Student Male 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { label: 'Faculty Male', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { label: 'Faculty Female', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { label: 'Academic Admin', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150' },
];

export const UserProfileModule: React.FC<UserProfileModuleProps> = ({
  currentUser,
  students,
  teachers = [],
  subjects,
  onRefresh,
  onUpdateUser
}) => {
  const isStudent = currentUser?.role === 'STUDENT';
  const isTeacher = currentUser?.role === 'TEACHER';
  const studentData = currentUser ? (students.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase()) || (isStudent ? students[0] : null)) : null;
  const teacherData = currentUser ? (teachers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase()) || (isTeacher ? teachers[0] : null)) : null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(studentData?.phone || teacherData?.phone || '+92 300 1234567');
  const [address, setAddress] = useState('College Road, Model Town, Khanpur, Punjab');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(currentUser?.avatar || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setSelectedAvatar(currentUser.avatar || '');
      setCustomAvatarUrl(currentUser.avatar || '');
    }
    if (studentData?.phone) setPhone(studentData.phone);
    else if (teacherData?.phone) setPhone(teacherData.phone);
  }, [currentUser]);
  
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please sign in to view your user profile.
      </div>
    );
  }

  // Handle image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedAvatar(base64String);
      saveAvatarToBackend(base64String);
    };
    reader.readAsDataURL(file);
  };

  const saveAvatarToBackend = async (avatarUrl: string, updatedName?: string, updatedPhone?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: avatarUrl,
          full_name: updatedName || fullName,
          phone: updatedPhone || phone,
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile picture.');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);

      if (data.user) {
        if (onUpdateUser) onUpdateUser(data.user);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    await saveAvatarToBackend(selectedAvatar, fullName, phone);
  };

  const handleSelectPreset = (url: string) => {
    setSelectedAvatar(url);
    saveAvatarToBackend(url);
  };

  // Student specific stats
  const totalClasses = studentData?.total_classes || 120;
  const attendedClasses = studentData?.attended_classes || 102;
  const percentage = studentData?.attendance_percentage || Math.round((attendedClasses / totalClasses) * 100);
  const isEligible = percentage >= 75;

  return (
    <div className="profile-status-column space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fadeInSlideUp">
        <div className="flex items-center gap-5">
          
          {/* Avatar with Upload Camera Button */}
          <div className="relative group shrink-0">
            <img
              src={selectedAvatar || currentUser.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={currentUser.full_name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/30 border-2 border-white shadow-md transition-all group-hover:brightness-90"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload New Profile Picture"
              className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg ring-2 ring-slate-900 transition-all hover:scale-110 flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                {currentUser.role} Account Profile
              </span>
              {isStudent && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isEligible ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {isEligible ? 'Exam Eligible (75%+)' : 'Below Exam Threshold'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white">{currentUser.full_name}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{currentUser.email}</span>
              <span>•</span>
              <span className="font-mono text-amber-400">
                {isStudent ? (studentData?.roll_number || 'CS-2022-044') : `ID: #${currentUser.id}`}
              </span>
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 underline underline-offset-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New Photo
              </button>
            </div>
          </div>
        </div>

        {isStudent && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Attendance</p>
              <p className={`text-2xl font-black ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                {percentage}%
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Attended</p>
              <p className="text-xl font-black text-white">{attendedClasses} / {totalClasses}</p>
            </div>
          </div>
        )}
      </div>

      {/* Notifications / Feedback Messages */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile picture and details updated successfully across the portal!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="profile-content-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Profile Picture Upload & Personal Details */}
        <div className="profile-primary-column lg:col-span-2 space-y-6">
          
          {/* Dedicated Profile Picture Upload Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                Change Profile Picture ({currentUser.role})
              </h3>
              {loading && (
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Device Upload Option */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2 group"
              >
                <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Upload Image File</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG or WebP up to 5MB</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-xs"
                >
                  Browse Computer / Phone
                </button>
              </div>

              {/* Direct Image URL Option */}
              <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col justify-between space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Paste Image URL</label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={e => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl.trim()) {
                      setSelectedAvatar(customAvatarUrl.trim());
                      saveAvatarToBackend(customAvatarUrl.trim());
                    }
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Apply Image URL
                </button>
              </div>

            </div>

            {/* Professional Preset Avatars */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Or Select High-Resolution Preset Avatar
              </p>
              <div className="profile-avatar-grid grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
                      selectedAvatar === preset.url ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105' : 'border-slate-200 hover:border-slate-400'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover" />
                    {selectedAvatar === preset.url && (
                      <span className="absolute top-1 right-1 p-0.5 bg-indigo-600 text-white rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Personal & Academic Credentials Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                Personal & Academic Information
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditing ? 'Cancel Editing' : 'Edit Details'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Profile Details
                </button>
              </form>
            ) : (
              <div className="profile-information-grid grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                  <p className="font-bold text-slate-900">{currentUser.full_name}</p>
                </div>

                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Roll / Faculty Number</span>
                  <p className="font-mono font-bold text-indigo-700">{studentData?.roll_number || 'CS-2022-044'}</p>
                </div>

                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                  <p className="font-semibold text-slate-800">{currentUser.email}</p>
                </div>

                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phone / Contact</span>
                  <p className="font-semibold text-slate-800">{phone}</p>
                </div>

                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Department / Section</span>
                  <p className="font-semibold text-slate-800">{studentData?.class_name || 'BS Computer Science (6th Sem)'}</p>
                </div>

                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Affiliated Institute</span>
                  <p className="font-semibold text-slate-800">Alpine Degree College Khanpur (IUB)</p>
                </div>

                <div className="profile-information-item p-3 bg-slate-50 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
                  <p className="font-semibold text-slate-800">{address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Enrolled Courses / Subjects List */}
          {isStudent && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Enrolled Academic Courses ({subjects.length})
              </h3>

              <div className="profile-course-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map(subject => (
                  <div key={subject.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{subject.subject_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{subject.subject_code} • {subject.credit_hours} Cr. Hrs</p>
                    </div>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Quick Status & Security */}
        <div className="space-y-6">
          
          {/* Status Badge Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Account Verification Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
                <span className="font-bold">Account Status:</span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase">
                  Active Verified
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">System Role</span>
                <p className="font-bold text-slate-900">{currentUser.role}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Institutional Portal</span>
                <p className="font-bold text-slate-900">Alpine College Attendance Engine</p>
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl border border-indigo-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
              <span>Need Profile Adjustments?</span>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed">
              If your registered subject list or roll number requires official correction, please contact the College Admin Office or Head of Department.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
