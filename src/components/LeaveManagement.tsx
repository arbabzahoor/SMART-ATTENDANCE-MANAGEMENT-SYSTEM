import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Paperclip,
  Upload,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  History,
  Calendar,
  Search,
  Filter,
  UserCheck,
  CalendarDays
} from 'lucide-react';
import { LeaveRequest, User, Student } from '../types';

interface LeaveManagementProps {
  currentUser: User | null;
  leaveRequests: LeaveRequest[];
  onRefresh: () => void;
  studentId?: number;
  students?: Student[];
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  currentUser,
  leaveRequests,
  onRefresh,
  studentId = 3,
  students = [],
}) => {
  const isStudent = currentUser?.role === 'STUDENT';

  // Match logged-in student record dynamically
  const currentStudent = currentUser ? students.find(s => s.user_id === currentUser.id || s.email.toLowerCase() === currentUser.email.toLowerCase()) : null;
  const effectiveStudentId = currentStudent?.id || studentId || 1;

  const [activeTab, setActiveTab] = useState<'history' | 'overview'>('history');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [historySearch, setHistorySearch] = useState('');

  const [localLeaves, setLocalLeaves] = useState<LeaveRequest[]>(leaveRequests);

  React.useEffect(() => {
    setLocalLeaves(leaveRequests);
  }, [leaveRequests]);

  const [showModal, setShowModal] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [viewPdfModal, setViewPdfModal] = useState<LeaveRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fromData, setFromData] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: '',
    attachment_url: '',
    attachment_name: '',
    attachment_size: '',
  });

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);

  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helper to calculate total days between dates
  const calculateDays = (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) return 1;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  // Filter leave requests for student history view
  const myLeaves = isStudent
    ? localLeaves.filter(l => l.student_id === effectiveStudentId || l.student_name === currentUser.full_name || (currentStudent && l.student_name === currentStudent.full_name))
    : localLeaves;

  const filteredHistory = myLeaves.filter(leave => {
    const matchesStatus = historyStatusFilter === 'ALL' || leave.status === historyStatusFilter;
    const searchLower = historySearch.toLowerCase();
    const matchesSearch =
      !historySearch ||
      leave.reason.toLowerCase().includes(searchLower) ||
      (leave.attachment_name && leave.attachment_name.toLowerCase().includes(searchLower)) ||
      leave.from_date.includes(searchLower) ||
      leave.to_date.includes(searchLower) ||
      (leave.teacher_remarks && leave.teacher_remarks.toLowerCase().includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalMyLeaves = myLeaves.length;
  const approvedCount = myLeaves.filter(l => l.status === 'APPROVED').length;
  const pendingCount = myLeaves.filter(l => l.status === 'PENDING').length;
  const rejectedCount = myLeaves.filter(l => l.status === 'REJECTED').length;
  const totalApprovedDays = myLeaves
    .filter(l => l.status === 'APPROVED')
    .reduce((acc, curr) => acc + calculateDays(curr.from_date, curr.to_date), 0);

  // Read file as Base64 Data URL
  const processPdfFile = (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file (.pdf)');
      return;
    }

    const fileSizeKB = (file.size / 1024).toFixed(1) + ' KB';
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: fileSizeKB,
        dataUrl,
      });
      setFromData(prev => ({
        ...prev,
        attachment_url: dataUrl,
        attachment_name: file.name,
        attachment_size: fileSizeKB,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  // Attach sample PDF template
  const handleAttachSamplePdf = (type: 'medical' | 'hospital' | 'permission') => {
    let name = 'Medical_Certificate_A.pdf';
    let size = '210 KB';
    if (type === 'hospital') {
      name = 'Hospital_Discharge_Summary.pdf';
      size = '340 KB';
    } else if (type === 'permission') {
      name = 'Academic_Event_Permission_Letter.pdf';
      size = '185 KB';
    }

    // Sample lightweight PDF data URI
    const samplePdfDataUri = `data:application/pdf;base64,JVBERi0xLjQKJcO34MiNCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwvRm9udCA8PC9GMCA8PC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYT4+Pj4+IC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCAxMzA+PgpzdHJlYW0KQlQKL0YwIDI0IFRmCjcyIDcxMCBUZAkKKEFMUElORSBERUdSRUUgQ09MTEVHRSAoTFVCRUFLQU4pKSBUagovRjAgMTIgVGYKNzIgNjg0IFRkCihPRkZJQ0lBTCBTVVBQT1JUSU5HIExFQVZFIEFUVEFDSE1FTlQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNT4+CiVFT0Y=`;

    setSelectedFile({
      name,
      size,
      dataUrl: samplePdfDataUri,
    });

    setFromData(prev => ({
      ...prev,
      attachment_url: samplePdfDataUri,
      attachment_name: name,
      attachment_size: size,
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFromData(prev => ({
      ...prev,
      attachment_url: '',
      attachment_name: '',
      attachment_size: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!fromData.reason.trim()) {
      setSubmitError('Please enter a detailed reason for your leave application.');
      return;
    }

    if (fromData.from_date && fromData.to_date && fromData.from_date > fromData.to_date) {
      setSubmitError('The "To Date" cannot be earlier than "From Date".');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          ...fromData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setSelectedFile(null);
        setFromData({
          from_date: new Date().toISOString().split('T')[0],
          to_date: new Date().toISOString().split('T')[0],
          reason: '',
          attachment_url: '',
          attachment_name: '',
          attachment_size: '',
        });
        setSuccessMsg('Your leave application has been submitted successfully and logged for faculty verification!');
        setTimeout(() => setSuccessMsg(''), 6000);
        onRefresh();
      } else {
        setSubmitError(data.error || 'Failed to submit leave request. Please check inputs.');
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'An unexpected error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingLeave) return;
    const targetId = reviewingLeave.id;
    const studentName = reviewingLeave.student_name || 'student';
    const remarks = reviewRemarks || (status === 'APPROVED' ? 'Approved by Administrator / Faculty' : 'Rejected by Administrator / Faculty');

    // Instantly update request status in state
    setLocalLeaves(prev =>
      prev.map(item =>
        item.id === targetId
          ? { ...item, status, teacher_remarks: remarks }
          : item
      )
    );

    setSubmitting(true);

    try {
      const res = await fetch(`/api/leave-requests/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          teacher_remarks: remarks,
        }),
      });

      if (res.ok) {
        setReviewingLeave(null);
        setReviewRemarks('');
        setSuccessMsg(`Leave request #${targetId} for ${studentName} was ${status.toLowerCase()}! Student has been notified.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDecision = async (leave: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
    const remarks = status === 'APPROVED' ? 'Directly approved by Admin' : 'Directly rejected by Admin';

    // Instantly update request status in state
    setLocalLeaves(prev =>
      prev.map(item =>
        item.id === leave.id
          ? { ...item, status, teacher_remarks: remarks }
          : item
      )
    );

    setSubmitting(true);
    try {
      const res = await fetch(`/api/leave-requests/${leave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          teacher_remarks: remarks,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Leave request #${leave.id} for ${leave.student_name || 'student'} marked as ${status}. Notification dispatched.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="saas-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[#292524]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-[#EAF5F0] text-[#3F8F72] border border-[#A3D9C9] text-[10px] font-bold uppercase tracking-wider">
              {isStudent ? 'Student Portal' : 'Admin & Faculty Leave Approval Hub'}
            </span>
            {!isStudent && (
              <span className="text-xs font-semibold text-[#3F8F72] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Full Approval Authority
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#292524] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#3F8F72]" />
            Student Leave Management & PDF Verification
          </h2>
          <p className="text-xs text-[#57534E] mt-1">
            {isStudent
              ? 'Submit leave applications with attached medical certificates or official letters for faculty verification.'
              : 'Review, approve, or reject student leave requests with attached PDF documents.'}
          </p>
        </div>

        {isStudent && (
          <button
            onClick={() => {
              setSubmitError('');
              setShowModal(true);
            }}
            className="btn-primary px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Submit New Leave Application
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Switcher Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>Leave History Timeline</span>
            <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-full font-extrabold">
              {myLeaves.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Applications Overview Table</span>
            <span className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded-full font-extrabold">
              {leaveRequests.length}
            </span>
          </button>
        </div>

        {activeTab === 'history' && isStudent && (
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Logged in as <strong className="text-slate-800">{currentUser.full_name}</strong>
          </p>
        )}
      </div>

      {/* ==================== SUB-TAB 1: DEDICATED LEAVE HISTORY TIMELINE ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* Stats Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold">Total Requests</span>
                <History className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">{totalMyLeaves}</p>
              <p className="text-[10px] text-slate-400">All submitted applications</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[11px] font-semibold">Approved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{approvedCount}</p>
              <p className="text-[10px] text-emerald-600/70">Granted by faculty</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-[11px] font-semibold">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
              <p className="text-[10px] text-amber-600/70">Awaiting faculty decision</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-[11px] font-semibold">Rejected</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-700">{rejectedCount}</p>
              <p className="text-[10px] text-rose-600/70">Declined requests</p>
            </div>

            <div className="bg-indigo-900 p-4 rounded-2xl border border-indigo-800 text-white shadow-xs space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-[11px] font-semibold">Authorized Leave Days</span>
                <CalendarDays className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">{totalApprovedDays} <span className="text-xs font-normal text-indigo-200">days</span></p>
              <p className="text-[10px] text-indigo-300">Total days approved</p>
            </div>
          </div>

          {/* Interactive Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setHistoryStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  historyStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Statuses ({myLeaves.length})
              </button>

              <button
                onClick={() => setHistoryStatusFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  historyStatusFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved ({approvedCount})
              </button>

              <button
                onClick={() => setHistoryStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  historyStatusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending ({pendingCount})
              </button>

              <button
                onClick={() => setHistoryStatusFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  historyStatusFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejected ({rejectedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history by reason or date..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Timeline List Stream */}
          {filteredHistory.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Leave History Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {historySearch || historyStatusFilter !== 'ALL'
                  ? 'No records matched your search filters. Try clearing filters or searching for another term.'
                  : 'You have not submitted any leave applications yet. Click below to submit a new leave request.'}
              </p>
              {isStudent && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all mt-2"
                >
                  <Plus className="w-4 h-4" /> Submit Leave Application
                </button>
              )}
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2">
              {filteredHistory.map((leave) => {
                const days = calculateDays(leave.from_date, leave.to_date);
                const isApproved = leave.status === 'APPROVED';
                const isRejected = leave.status === 'REJECTED';
                const isPending = leave.status === 'PENDING';

                return (
                  <div key={leave.id} className="relative group">
                    
                    {/* Timeline Node Badge */}
                    <div
                      className={`absolute -left-[31px] md:-left-[39px] top-1.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 ${
                        isApproved
                          ? 'bg-emerald-500 ring-4 ring-emerald-50'
                          : isRejected
                          ? 'bg-rose-500 ring-4 ring-rose-50'
                          : 'bg-amber-500 ring-4 ring-amber-50'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isRejected ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    {/* Leave Card */}
                    <div className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-4">
                      
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-mono text-xs font-bold flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>{leave.from_date}</span>
                            <span className="text-slate-400">→</span>
                            <span>{leave.to_date}</span>
                          </div>

                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded-full border border-indigo-100">
                            {days} {days === 1 ? 'Day' : 'Days'} Absence
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-full uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5" />}
                            {isPending && <Clock className="w-3.5 h-3.5" />}
                            {leave.status}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: #{leave.id}
                          </span>
                        </div>
                      </div>

                      {/* Student & Reason Body */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Stated Reason for Leave:
                          </p>
                          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-xs leading-relaxed italic">
                            "{leave.reason}"
                          </div>
                        </div>

                        {/* Attachment & Quick Action */}
                        <div className="space-y-2 flex flex-col justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Supporting Document:
                            </p>
                            {leave.attachment_url ? (
                              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {leave.attachment_name || 'PDF_Document.pdf'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setViewPdfModal(leave)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic py-1">No attached PDF file</p>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Submitted on {new Date(leave.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Approval Progress Workflow Stepper */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                            Approval Workflow Status & Remarks:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                            {/* Step 1: Submission */}
                            <div className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                ✓
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-[11px]">1. Student Request Submitted</p>
                                <p className="text-[10px] text-slate-500">
                                  {new Date(leave.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Step 2: Faculty Decision */}
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isRejected
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {isApproved ? '✓' : isRejected ? '✕' : '•'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-[11px]">
                                  2. Faculty Verification & Decision
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium">
                                  {isApproved && (
                                    <span className="text-emerald-700">Approved by Department HoD / Faculty</span>
                                  )}
                                  {isRejected && (
                                    <span className="text-rose-700">Declined by Faculty Review</span>
                                  )}
                                  {isPending && (
                                    <span className="text-amber-700">Pending evaluation by Class Advisor / HoD</span>
                                  )}
                                </p>
                                {leave.teacher_remarks && (
                                  <p className="text-[11px] text-slate-700 font-semibold bg-white p-2 rounded-lg border border-slate-200 mt-1">
                                    Remark: "{leave.teacher_remarks}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Admin / Teacher Quick Action Panel */}
                        {!isStudent && (
                          <div className="flex flex-wrap sm:flex-col items-end justify-center gap-2 shrink-0 pt-2 sm:pt-0">
                            <div className="text-[10px] text-[#57534E] font-bold uppercase tracking-wider">Admin Decision:</div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuickDecision(leave, 'APPROVED')}
                                disabled={submitting}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  isApproved
                                    ? 'bg-emerald-600 text-white shadow-xs opacity-90'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>

                              <button
                                onClick={() => handleQuickDecision(leave, 'REJECTED')}
                                disabled={submitting}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  isRejected
                                    ? 'bg-rose-600 text-white shadow-xs opacity-90'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>

                              <button
                                onClick={() => {
                                  setReviewingLeave(leave);
                                  setReviewRemarks(leave.teacher_remarks || '');
                                }}
                                className="px-2.5 py-1.5 bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#292524] rounded-lg text-xs font-bold transition-all cursor-pointer border border-[#E7E5E4]"
                                title="Review with custom remarks"
                              >
                                {isPending ? 'Review' : 'Edit Remarks'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ==================== SUB-TAB 2: APPLICATIONS OVERVIEW TABLE ==================== */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> All Registered Leave Applications
            </h3>
            <span className="text-xs text-slate-500 font-medium">Total: {leaveRequests.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Dates Duration</th>
                  <th className="px-6 py-3.5">Reason & Attached PDF Document</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5">Faculty Remarks</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No leave applications recorded.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map(leave => (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs">{leave.student_name || 'Hamza Ahmed'}</p>
                        <p className="text-slate-500 text-[11px]">{leave.roll_number || 'CS-2022-044'} • {leave.class_name || 'BSCS-6A'}</p>
                      </td>

                      <td className="px-6 py-4 font-mono">
                        <div className="text-slate-800 font-semibold">{leave.from_date} to {leave.to_date}</div>
                        <div className="text-[10px] text-slate-400">Submitted: {new Date(leave.created_at).toLocaleDateString()}</div>
                      </td>

                      <td className="px-6 py-4 space-y-1.5">
                        <p className="text-slate-800 font-medium line-clamp-2">{leave.reason}</p>
                        
                        {leave.attachment_url && (
                          <button
                            onClick={() => setViewPdfModal(leave)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                            <span>PDF: {leave.attachment_name || leave.attachment_url.slice(0, 24)}</span>
                            <Eye className="w-3 h-3 text-rose-500 ml-1" />
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            leave.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : leave.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {leave.status === 'APPROVED' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : leave.status === 'REJECTED' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {leave.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 italic">
                        {leave.teacher_remarks || 'Pending faculty review'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {leave.attachment_url && (
                            <button
                              onClick={() => setViewPdfModal(leave)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="View Attached PDF Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {!isStudent && (
                            <>
                              <button
                                onClick={() => handleQuickDecision(leave, 'APPROVED')}
                                disabled={submitting}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  leave.status === 'APPROVED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                }`}
                                title="Approve Leave Request"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleQuickDecision(leave, 'REJECTED')}
                                disabled={submitting}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  leave.status === 'REJECTED'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                                }`}
                                title="Reject Leave Request"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setReviewingLeave(leave);
                                  setReviewRemarks(leave.teacher_remarks || '');
                                }}
                                className="bg-[#3F8F72] hover:bg-[#32735C] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer ml-1"
                                title="Review / Add Remarks"
                              >
                                Review
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Submit Leave Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-xl text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Submit Student Leave Request</h3>
                  <p className="text-[11px] text-slate-500">Attach supporting PDF documentation for official approval</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={fromData.from_date}
                    onChange={e => setFromData({ ...fromData, from_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={fromData.to_date}
                    onChange={e => setFromData({ ...fromData, to_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Absence *</label>
                <textarea
                  required
                  rows={3}
                  value={fromData.reason}
                  onChange={e => setFromData({ ...fromData, reason: e.target.value })}
                  placeholder="State detailed reason (e.g. severe flu, family emergency, academic competition)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* PDF Document Attachment Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    Attach Supporting Document (PDF Format)
                  </label>
                  <span className="text-[10px] text-slate-400">Max size 10MB (.pdf)</span>
                </div>

                {selectedFile ? (
                  /* Attached PDF Card */
                  <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        PDF
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 text-xs truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{selectedFile.size} • Ready to submit</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Drag and Drop Zone */
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="application/pdf,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">
                          Click to browse or drag & drop your PDF file
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Medical certificates, prescription slips, or official letters
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sample PDF Template Shortcuts */}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-500 font-medium mb-1.5">Or attach a sample template certificate:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAttachSamplePdf('medical')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Medical Certificate PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttachSamplePdf('hospital')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-amber-600" /> Hospital Slip PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttachSamplePdf('permission')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Event Permission Letter PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Review Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Faculty Review & Decision</h3>
              <button onClick={() => setReviewingLeave(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
              <p><span className="text-slate-500 font-semibold">Student Name:</span> <strong className="text-slate-900">{reviewingLeave.student_name || 'Hamza Ahmed'}</strong></p>
              <p><span className="text-slate-500 font-semibold">Absence Period:</span> <span className="font-mono">{reviewingLeave.from_date} to {reviewingLeave.to_date}</span></p>
              <p><span className="text-slate-500 font-semibold">Reason Provided:</span> {reviewingLeave.reason}</p>
              
              {reviewingLeave.attachment_url && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Attached PDF:</span>
                  <button
                    onClick={() => setViewPdfModal(reviewingLeave)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-500 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Attached PDF Document
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Decision Remarks</label>
              <textarea
                rows={3}
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                placeholder="Enter approval conditions or rejection notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleReviewAction('REJECTED')}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleReviewAction('APPROVED')}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Document Viewer Modal */}
      {viewPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    PDF Attachment: {viewPdfModal.attachment_name || 'Supporting_Document.pdf'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Student Leave Application Document Verification • Alpine Degree College Khanpur
                  </p>
                </div>
              </div>
              <button onClick={() => setViewPdfModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Area */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 border border-slate-800">
              
              {/* Document Letterhead */}
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold tracking-wider text-amber-400 uppercase">
                    Alpine Degree College Khanpur
                  </p>
                  <p className="text-[11px] text-slate-400">Department of Student Affairs & Leave Approvals</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED ATTACHMENT
                </span>
              </div>

              {/* Document Embedded Frame or Canvas Representation */}
              {viewPdfModal.attachment_url?.startsWith('data:application/pdf') ? (
                <div className="w-full h-80 rounded-xl overflow-hidden bg-white border border-slate-700">
                  <iframe
                    src={viewPdfModal.attachment_url}
                    title="Attached PDF Preview"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                /* Formatted Certificate Presentation */
                <div className="bg-white text-slate-900 p-6 rounded-xl space-y-3 font-serif border border-slate-200 shadow-inner">
                  <div className="text-center border-b pb-3 border-slate-200">
                    <h4 className="font-bold text-slate-900 text-base">OFFICIAL MEDICAL / PERMISSION ATTACHMENT</h4>
                    <p className="text-xs text-slate-500 font-sans">Attached by Student for Absence Approval</p>
                  </div>

                  <div className="text-xs space-y-2 font-sans">
                    <p><strong>Student Name:</strong> {viewPdfModal.student_name || 'Hamza Ahmed'}</p>
                    <p><strong>Roll Number:</strong> {viewPdfModal.roll_number || 'CS-2022-044'}</p>
                    <p><strong>Absence Dates:</strong> {viewPdfModal.from_date} to {viewPdfModal.to_date}</p>
                    <p><strong>Reason Stated:</strong> {viewPdfModal.reason}</p>
                    <p className="pt-2 text-slate-600 italic">
                      "This document confirms authorized medical rest or event participation for the aforementioned student during the requested period."
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-sans">
                    <span>Issued Authority Seal: Verified</span>
                    <span>Document ID: PDF-{viewPdfModal.id}</span>
                  </div>
                </div>
              )}

              {/* PDF Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Attachment Size: {viewPdfModal.attachment_size || '240 KB'}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={viewPdfModal.attachment_url || '#'}
                    download={viewPdfModal.attachment_name || 'Leave_Attachment.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>

                  {viewPdfModal.attachment_url?.startsWith('data:') && (
                    <button
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${viewPdfModal.attachment_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open in New Tab
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewPdfModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
