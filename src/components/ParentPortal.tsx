import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Filter,
  Search,
  Bell,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
  Send,
  Sparkles,
  Info,
  CreditCard,
  DollarSign,
  Receipt,
  ArrowRight,
  Shield,
  Layers,
  Check,
  X
} from 'lucide-react';
import { User, Student, AttendanceRecord, AttendanceStatus, FeeInvoice, FeePayment, PaymentMethod } from '../types';
import jsPDF from 'jspdf';

interface ParentPortalProps {
  currentUser: User | null;
  onNavigateTo?: (page: string) => void;
  initialTab?: 'OVERVIEW' | 'SUBJECTS' | 'HISTORY' | 'LEAVE' | 'NOTIFICATIONS' | 'FEES';
}

interface LinkedChild {
  student_id: number;
  full_name: string;
  roll_number: string;
  student_code: string;
  email: string;
  phone: string;
  avatar: string;
  class_id: number;
  class_name: string;
  program_name: string;
  department_name: string;
  semester: number;
  batch: string;
  relationship: string;
  is_primary: boolean;
  total_sessions: number;
  present_sessions: number;
  absent_sessions: number;
  late_sessions: number;
  attendance_percentage: number;
  status_today: AttendanceStatus | 'NO_CLASS';
  today_time: string | null;
}

interface ChildDetailedStats {
  student: Student & { class_name?: string; program_name?: string; department_name?: string };
  relationship: string;
  min_threshold: number;
  total_sessions: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  attended_days: number;
  attendance_percentage: number;
  status_today: AttendanceStatus | 'NO_CLASS';
  today_time: string | null;
  today_subject: string | null;
  subject_wise: {
    subject_id: number;
    subject_name: string;
    subject_code: string;
    credit_hours: number;
    teacher_name: string;
    total_classes: number;
    attended_classes: number;
    present_classes: number;
    absent_classes: number;
    late_classes: number;
    percentage: number;
    is_low: boolean;
  }[];
  recent_records: (AttendanceRecord & { subject_code?: string })[];
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ currentUser, onNavigateTo, initialTab }) => {
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [childStats, setChildStats] = useState<ChildDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters for attendance history
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');

  // Notifications for Parent
  const [parentNotifications, setParentNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBJECTS' | 'HISTORY' | 'LEAVE' | 'NOTIFICATIONS' | 'FEES' | 'PROFILE'>(initialTab || 'OVERVIEW');

  // Parent Profile (WhatsApp management)
  const [parentProfile, setParentProfile] = useState<any>(null);
  const [editingWhatsapp, setEditingWhatsapp] = useState('');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [linkRelationship, setLinkRelationship] = useState<'Father' | 'Mother' | 'Guardian'>('Guardian');
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [linkStudentMessage, setLinkStudentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fees and Payments State
  const [parentFeesData, setParentFeesData] = useState<any>(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<FeeInvoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<FeePayment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('921');
  const [cardHolder, setCardHolder] = useState(currentUser?.full_name || 'Mr. Tariq Khan');
  const [walletProvider, setWalletProvider] = useState<'JazzCash' | 'Easypaisa' | 'SadaPay'>('JazzCash');
  const [walletPhone, setWalletPhone] = useState('0300 4567891');
  const [walletPin, setWalletPin] = useState('••••');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  // Keep activeTab in sync if parent passed initialTab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch Parent Fees
  const fetchParentFees = async () => {
    setFeesLoading(true);
    try {
      const res = await fetch('/api/parent/fees');
      if (res.ok) {
        const data = await res.json();
        setParentFeesData(data);
      }
    } catch (err) {
      console.error('Failed to load parent fee records:', err);
    } finally {
      setFeesLoading(false);
    }
  };

  // Fetch Parent Profile (for WhatsApp management)
  const fetchParentProfile = async () => {
    try {
      const res = await fetch('/api/parent/profile');
      if (res.ok) {
        const data = await res.json();
        setParentProfile(data);
        setEditingWhatsapp(data.whatsapp_number || '');
      }
    } catch (err) {
      console.error('Failed to load parent profile:', err);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentProfile) return;
    setWhatsappSaving(true);
    setWhatsappMessage(null);
    try {
      const res = await fetch(`/api/parents/${parentProfile.id}/whatsapp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: editingWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update WhatsApp number.');
      setWhatsappMessage({ type: 'success', text: 'WhatsApp number updated successfully.' });
      setParentProfile((prev: any) => ({ ...prev, whatsapp_number: data.whatsapp_number }));
    } catch (err: any) {
      setWhatsappMessage({ type: 'error', text: err.message || 'Error saving WhatsApp number.' });
    } finally {
      setWhatsappSaving(false);
    }
  };

  // 3-Copy Bank Challan / Receipt PDF Generator
  const downloadOfficialChallanPDF = (invoice: FeeInvoice) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const copies = ['BANK COPY', 'COLLEGE ACCOUNTS COPY', 'STUDENT / PARENT COPY'];
    const copyWidth = 88;

    copies.forEach((copyTitle, idx) => {
      const startX = 10 + idx * 95;

      // Outer Border
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.3);
      doc.rect(startX, 10, copyWidth, 190);

      // Header Banner
      doc.setFillColor(30, 27, 75);
      doc.rect(startX, 10, copyWidth, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ALPINE DEGREE COLLEGE', startX + copyWidth / 2, 16, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('KHANPUR, PAKISTAN', startX + copyWidth / 2, 21, { align: 'center' });
      doc.text(`[ ${copyTitle} ]`, startX + copyWidth / 2, 26, { align: 'center' });

      // Bank & Challan Meta
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Bank: Meezan Bank Ltd (A/C: 0001002345678901)', startX + 4, 34);
      doc.text(`Challan No: ${invoice.challan_number}`, startX + 4, 39);
      doc.setFont('helvetica', 'normal');
      doc.text(`Issue: ${invoice.issue_date}`, startX + 4, 44);
      doc.text(`Due: ${invoice.due_date}`, startX + 50, 44);

      // Student Meta
      doc.setDrawColor(203, 213, 225);
      doc.line(startX + 4, 47, startX + copyWidth - 4, 47);

      doc.setFont('helvetica', 'bold');
      doc.text(`Student:`, startX + 4, 52);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.student_name || 'N/A', startX + 22, 52);

      doc.setFont('helvetica', 'bold');
      doc.text(`Roll No:`, startX + 4, 57);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.roll_number || 'N/A', startX + 22, 57);

      doc.setFont('helvetica', 'bold');
      doc.text(`Class/Sem:`, startX + 4, 62);
      doc.setFont('helvetica', 'normal');
      doc.text(`${invoice.class_name} (Sem ${invoice.semester})`, startX + 22, 62);

      // Itemized Heads
      let tableY = 67;
      doc.setFillColor(241, 245, 249);
      doc.rect(startX + 4, tableY, copyWidth - 8, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Fee Description', startX + 6, tableY + 4);
      doc.text('Amount (PKR)', startX + copyWidth - 6, tableY + 4, { align: 'right' });

      tableY += 8;
      doc.setFont('helvetica', 'normal');
      invoice.items.forEach(item => {
        doc.text(item.name.slice(0, 24), startX + 6, tableY);
        doc.text(Number(item.amount).toLocaleString(), startX + copyWidth - 6, tableY, { align: 'right' });
        tableY += 5;
      });

      // Subtotal, Discount, Fine
      doc.line(startX + 4, tableY, startX + copyWidth - 4, tableY);
      tableY += 4;
      doc.text('Subtotal:', startX + 6, tableY);
      doc.text(`Rs. ${invoice.subtotal.toLocaleString()}`, startX + copyWidth - 6, tableY, { align: 'right' });

      if (invoice.discount_amount > 0) {
        tableY += 5;
        doc.setTextColor(22, 101, 52);
        doc.text('Concession/Scholarship:', startX + 6, tableY);
        doc.text(`- Rs. ${invoice.discount_amount.toLocaleString()}`, startX + copyWidth - 6, tableY, { align: 'right' });
        doc.setTextColor(30, 41, 59);
      }

      if (invoice.late_fine > 0) {
        tableY += 5;
        doc.setTextColor(185, 28, 28);
        doc.text('Late Payment Fine:', startX + 6, tableY);
        doc.text(`+ Rs. ${invoice.late_fine.toLocaleString()}`, startX + copyWidth - 6, tableY, { align: 'right' });
        doc.setTextColor(30, 41, 59);
      }

      tableY += 6;
      doc.setFillColor(238, 242, 255);
      doc.rect(startX + 4, tableY, copyWidth - 8, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Net Total Payable:', startX + 6, tableY + 5);
      doc.text(`Rs. ${invoice.total_amount.toLocaleString()}`, startX + copyWidth - 6, tableY + 5, { align: 'right' });

      tableY += 12;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Paid: Rs. ${invoice.paid_amount.toLocaleString()}`, startX + 6, tableY);
      doc.text(`Balance Due: Rs. ${invoice.balance_due.toLocaleString()}`, startX + copyWidth - 6, tableY, { align: 'right' });

      // Status Stamp Box
      tableY += 8;
      const isPaid = invoice.status === 'PAID';
      doc.setDrawColor(isPaid ? 22 : 185, isPaid ? 101 : 28, isPaid ? 52 : 28);
      doc.setLineWidth(0.4);
      doc.rect(startX + 8, tableY, copyWidth - 16, 12);
      doc.setTextColor(isPaid ? 22 : 185, isPaid ? 101 : 28, isPaid ? 52 : 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(isPaid ? 'PAID & VERIFIED' : `STATUS: ${invoice.status}`, startX + copyWidth / 2, tableY + 7.5, { align: 'center' });

      // Signatures
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6);
      doc.text('Bank Teller Signature & Stamp', startX + 6, 192);
      doc.text('College Accounts Officer', startX + copyWidth - 6, 192, { align: 'right' });
    });

    doc.save(`Alpine_College_Challan_${invoice.challan_number}.pdf`);
  };

  // Leave submission state
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch linked children for logged-in parent
  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parent/children');
      if (res.ok) {
        const data: LinkedChild[] = await res.json();
        setChildren(data);
        if (data.length > 0 && !selectedChildId) {
          setSelectedChildId(data[0].student_id);
        }
      }
    } catch (err) {
      console.error('Failed to load linked children:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdentifier.trim()) {
      setLinkStudentMessage({ type: 'error', text: 'Enter a Student ID or Registration Number.' });
      return;
    }

    setLinkingStudent(true);
    setLinkStudentMessage(null);
    try {
      const response = await fetch('/api/parent/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_identifier: studentIdentifier.trim(), relationship: linkRelationship }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not verify and link this student.');

      setLinkStudentMessage({ type: 'success', text: data.message || 'Student verified and linked successfully.' });
      setStudentIdentifier('');
      if (data.student_id) setSelectedChildId(data.student_id);
      await Promise.all([fetchChildren(), fetchParentFees()]);
    } catch (error) {
      setLinkStudentMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not verify and link this student.',
      });
    } finally {
      setLinkingStudent(false);
    }
  };

  // Fetch detailed child attendance stats
  const fetchChildDetails = async (studentId: number) => {
    setStatsLoading(true);
    try {
      let query = `/api/parent/child/${studentId}/attendance`;
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedSubjectFilter) params.append('subject_id', selectedSubjectFilter);
      if (params.toString()) query += `?${params.toString()}`;

      const res = await fetch(query);
      if (res.ok) {
        const data: ChildDetailedStats = await res.json();
        setChildStats(data);
      }
    } catch (err) {
      console.error('Failed to load child attendance stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch parent notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/parent/notifications');
      if (res.ok) {
        const data = await res.json();
        setParentNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load parent notifications:', err);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchNotifications();
    fetchParentFees();
  }, [currentUser]);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildDetails(selectedChildId);
      fetchParentFees();
    }
  }, [selectedChildId, startDate, endDate, selectedSubjectFilter]);

  // Handle Parent Leave Request Submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !leaveFrom || !leaveTo || !leaveReason.trim()) {
      setLeaveMessage({ type: 'error', text: 'Please fill in all leave request details.' });
      return;
    }

    setLeaveSubmitting(true);
    setLeaveMessage(null);

    try {
      const res = await fetch('/api/parent/request-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedChildId,
          from_date: leaveFrom,
          to_date: leaveTo,
          reason: leaveReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit leave application.');
      }

      setLeaveMessage({
        type: 'success',
        text: 'Leave application submitted successfully! Department faculty will review and update attendance records accordingly.'
      });
      setLeaveReason('');
      setLeaveFrom('');
      setLeaveTo('');
    } catch (err: any) {
      setLeaveMessage({ type: 'error', text: err.message || 'Error submitting leave.' });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const selectedChild = children.find(c => c.student_id === selectedChildId);

  return (
    <div className="space-y-6">
      
      {/* Printable Institutional Header (Hidden on screen, visible in print) */}
      <div className="hidden print:block text-center border-b-2 border-stone-800 pb-4 mb-6">
        <h1 className="text-xl font-bold tracking-tight text-stone-900 uppercase">ALPINE DEGREE COLLEGE KHANPUR</h1>
        <p className="text-xs text-stone-600 font-semibold">PARENT & GUARDIAN OFFICIAL ATTENDANCE TRANSCRIPT</p>
        <p className="text-[11px] text-stone-500">Affiliated with IUB • District Rahim Yar Khan, Punjab, Pakistan</p>
        <div className="mt-2 text-xs text-stone-700">
          Student: <strong>{childStats?.student.full_name}</strong> | Roll Number: <code>{childStats?.student.roll_number}</code> | Class: <strong>{childStats?.student.class_name}</strong>
        </div>
      </div>

      {/* Top Welcome & Parent Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
              alt={currentUser?.full_name || 'Parent'}
              className="w-14 h-14 rounded-2xl object-cover border border-[#E7E5E4] shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#3F8F72] bg-[#EAF5F0] px-2.5 py-0.5 rounded-full border border-[#3F8F72]/20">
                  Verified Parent Portal
                </span>
                <span className="text-xs text-[#78716C]">• {children.length} Linked Child(ren)</span>
              </div>
              <h1 className="text-xl font-bold text-[#292524] tracking-tight mt-0.5">
                {currentUser?.full_name || 'Guardian Account'}
              </h1>
              <p className="text-xs text-[#78716C]">
                Official institutional attendance monitoring, real-time absence alerts & academic reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#292524] text-xs font-bold transition-all border border-[#E7E5E4] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#78716C]" />
              <span>Print Official Slip</span>
            </button>
            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className="relative p-2 rounded-xl bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#78716C] transition-all border border-[#E7E5E4] cursor-pointer"
              title="Parent Notifications"
            >
              <Bell className="w-4 h-4" />
              {parentNotifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D95C5C] rounded-full ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleLinkStudent} className="mt-5 pt-5 border-t border-[#E7E5E4]">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-[#3F8F72]" />
            <h2 className="text-xs font-bold text-[#292524]">Link Another Child</h2>
            <span className="text-[10px] text-[#78716C]">Verified against your registered WhatsApp number</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px_auto] gap-2">
            <input
              type="text"
              required
              value={studentIdentifier}
              onChange={event => setStudentIdentifier(event.target.value)}
              placeholder="Student ID / Registration Number"
              aria-label="Student ID or Registration Number"
              className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3 py-2 text-xs text-[#292524] focus:outline-none focus:border-[#3F8F72]"
            />
            <select
              value={linkRelationship}
              onChange={event => setLinkRelationship(event.target.value as 'Father' | 'Mother' | 'Guardian')}
              aria-label="Relationship with student"
              className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3 py-2 text-xs text-[#292524] focus:outline-none focus:border-[#3F8F72]"
            >
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </select>
            <button
              type="submit"
              disabled={linkingStudent}
              className="px-4 py-2 rounded-xl bg-[#3F8F72] hover:bg-[#34785f] disabled:opacity-60 text-white text-xs font-bold transition-colors"
            >
              {linkingStudent ? 'Verifying…' : 'Verify & Link'}
            </button>
          </div>
          {linkStudentMessage && (
            <p role="status" className={`mt-2 text-xs font-medium ${linkStudentMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {linkStudentMessage.text}
            </p>
          )}
        </form>

        {/* Multi-Child Selector Tabs */}
        {children.length > 1 && (
          <div className="mt-6 pt-5 border-t border-[#E7E5E4]">
            <label className="text-xs font-bold text-[#78716C] uppercase tracking-wider block mb-2.5">
              Select Linked Child:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {children.map((child, idx) => {
                const isSelected = selectedChildId === child.student_id;
                return (
                  <div
                    key={`child-sel-${child.student_id}-${idx}`}
                    onClick={() => setSelectedChildId(child.student_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#3F8F72] bg-[#EAF5F0] shadow-xs'
                        : 'border-[#E7E5E4] bg-[#FAFAF9] hover:bg-[#F5F5F4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={child.avatar}
                        alt={child.full_name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#E7E5E4]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#292524]">{child.full_name}</h4>
                        <p className="text-[11px] font-mono text-[#78716C]">{child.roll_number}</p>
                        <span className="text-[10px] text-[#A8A29E]">{child.class_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${
                        child.attendance_percentage >= 75 ? 'text-[#3F8F72]' : 'text-[#D95C5C]'
                      }`}>
                        {child.attendance_percentage}%
                      </span>
                      <p className="text-[10px] text-[#78716C]">{child.relationship}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Child Information & Today's Attendance Real-Time Status Card */}
      {selectedChild && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Child Details Card (8 Cols) */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedChild.avatar}
                  alt={selectedChild.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E7E5E4]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#292524]">{selectedChild.full_name}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5F5F4] border border-[#E7E5E4] text-[#78716C]">
                      {selectedChild.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] font-mono">
                    Roll No: <strong>{selectedChild.roll_number}</strong> • Code: {selectedChild.student_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#78716C]">
                <GraduationCap className="w-4 h-4 text-[#3F8F72]" />
                <span>{selectedChild.program_name} (Semester {selectedChild.semester})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E7E5E4] text-xs">
              <div>
                <span className="text-[10px] text-[#A8A29E] block">Class Section:</span>
                <span className="font-semibold text-[#292524]">{selectedChild.class_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A29E] block">Department:</span>
                <span className="font-semibold text-[#292524]">{selectedChild.department_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A29E] block">Academic Batch:</span>
                <span className="font-semibold text-[#292524]">{selectedChild.batch}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A29E] block">Institutional Standing:</span>
                <span className={`font-bold ${selectedChild.attendance_percentage >= 75 ? 'text-[#3F8F72]' : 'text-[#D95C5C]'}`}>
                  {selectedChild.attendance_percentage >= 75 ? 'Regular (≥ 75%)' : 'Warning (< 75%)'}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Attendance Real-Time Status Card (4 Cols) */}
          <div className="md:col-span-4 bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                <span>Today's Attendance</span>
                <Calendar className="w-4 h-4 text-[#78716C]" />
              </div>

              <div className="mt-2">
                {selectedChild.status_today === 'PRESENT' && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#EAF5F0] border border-[#3F8F72]/30 text-[#1B4332]">
                    <CheckCircle2 className="w-5 h-5 text-[#3F8F72]" />
                    <div>
                      <h4 className="text-xs font-bold">Present in College</h4>
                      <p className="text-[11px] text-[#2D6A4F]">Marked at {selectedChild.today_time || '09:00 AM'}</p>
                    </div>
                  </div>
                )}

                {selectedChild.status_today === 'LATE' && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FEF9C3] border border-[#FDE047] text-[#854D0E]">
                    <Clock className="w-5 h-5 text-[#CA8A04]" />
                    <div>
                      <h4 className="text-xs font-bold">Late Arrival</h4>
                      <p className="text-[11px]">Recorded at {selectedChild.today_time || '09:15 AM'}</p>
                    </div>
                  </div>
                )}

                {selectedChild.status_today === 'ABSENT' && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                    <XCircle className="w-5 h-5 text-[#DC2626]" />
                    <div>
                      <h4 className="text-xs font-bold">Marked Absent</h4>
                      <p className="text-[11px] text-[#7F1D1D]">Not present for today's session</p>
                    </div>
                  </div>
                )}

                {selectedChild.status_today === 'NO_CLASS' && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4] text-[#57534E]">
                    <Clock className="w-5 h-5 text-[#A8A29E]" />
                    <div>
                      <h4 className="text-xs font-bold">No Records Today</h4>
                      <p className="text-[11px] text-[#78716C]">Session scheduled according to timetable</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-[#A8A29E] mt-3">
              Authoritative server timestamps updated in real time by faculty.
            </p>
          </div>

        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center bg-white p-1.5 rounded-xl border border-[#E7E5E4] overflow-x-auto shadow-xs print:hidden">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border border-[#3F8F72]/30'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Attendance Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBJECTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'SUBJECTS'
              ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border border-[#3F8F72]/30'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subject Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border border-[#3F8F72]/30'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance Log History</span>
        </button>

        <button
          onClick={() => setActiveTab('LEAVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'LEAVE'
              ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border border-[#3F8F72]/30'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Submit Parent Leave Note</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border border-[#3F8F72]/30'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts & Notifications ({parentNotifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FEES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'FEES'
              ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border border-[#3F8F72]/30'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fee Challans & Online Payment</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRIC CARDS */}
      {activeTab === 'OVERVIEW' && childStats && (
        <div className="space-y-6">
          
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Overall Attendance Percentage Card */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block mb-1">
                Cumulative Attendance
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${
                  childStats.attendance_percentage >= 75 ? 'text-[#3F8F72]' : 'text-[#D95C5C]'
                }`}>
                  {childStats.attendance_percentage}%
                </span>
                <span className="text-xs text-[#78716C]">
                  / {childStats.min_threshold}% min
                </span>
              </div>
              <div className="w-full bg-[#E7E5E4] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    childStats.attendance_percentage >= 75 ? 'bg-[#3F8F72]' : 'bg-[#D95C5C]'
                  }`}
                  style={{ width: `${Math.min(100, childStats.attendance_percentage)}%` }}
                />
              </div>
            </div>

            {/* Total Sessions Evaluated */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm">
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block mb-1">
                Total Classes
              </span>
              <span className="text-2xl font-bold text-[#292524]">{childStats.total_sessions}</span>
              <p className="text-[11px] text-[#78716C] mt-2">Held to date</p>
            </div>

            {/* Present Days */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm">
              <span className="text-[10px] font-bold text-[#3F8F72] uppercase tracking-wider block mb-1">
                Present Days
              </span>
              <span className="text-2xl font-bold text-[#1B4332]">{childStats.present_days}</span>
              <p className="text-[11px] text-[#2D6A4F] mt-2">On-time attendances</p>
            </div>

            {/* Late Days */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm">
              <span className="text-[10px] font-bold text-[#CA8A04] uppercase tracking-wider block mb-1">
                Late Arrivals
              </span>
              <span className="text-2xl font-bold text-[#854D0E]">{childStats.late_days}</span>
              <p className="text-[11px] text-[#A16207] mt-2">Permitted entry</p>
            </div>

            {/* Absent Days */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm">
              <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider block mb-1">
                Absent Days
              </span>
              <span className="text-2xl font-bold text-[#991B1B]">{childStats.absent_days}</span>
              <p className="text-[11px] text-[#B91C1C] mt-2">Requires justification</p>
            </div>

          </div>

          {/* Low Attendance Warning Notice if below 75% */}
          {childStats.attendance_percentage < childStats.min_threshold && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5 flex items-start gap-4 text-[#991B1B]">
              <AlertTriangle className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Academic Low Attendance Warning</h4>
                <p className="text-xs text-[#7F1D1D] leading-relaxed">
                  Your child's attendance ({childStats.attendance_percentage}%) is currently below the mandatory institutional requirement of {childStats.min_threshold}%. Per Alpine Degree College Khanpur policies, students below {childStats.min_threshold}% may be restricted from sitting in final examinations. Please ensure regular attendance in upcoming sessions.
                </p>
              </div>
            </div>
          )}

          {/* Quick Subject Summary Cards */}
          <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#292524]">Subject-Wise Standing Overview</h3>
                <p className="text-xs text-[#78716C]">Current attendance percentages across enrolled courses</p>
              </div>
              <button
                onClick={() => setActiveTab('SUBJECTS')}
                className="text-xs text-[#3F8F72] hover:underline font-semibold cursor-pointer"
              >
                View Full Breakdown →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {childStats.subject_wise.map((sub, idx) => (
                <div key={`sub-card-${sub.subject_id}-${idx}`} className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E7E5E4]">
                      {sub.subject_code}
                    </span>
                    <span className={`text-xs font-bold ${sub.percentage >= 75 ? 'text-[#3F8F72]' : 'text-[#D95C5C]'}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#292524] truncate">{sub.subject_name}</h4>
                  <p className="text-[11px] text-[#78716C] truncate">{sub.teacher_name}</p>
                  <div className="text-[10px] text-[#A8A29E] pt-1 border-t border-[#E7E5E4] flex justify-between">
                    <span>{sub.attended_classes} of {sub.total_classes} attended</span>
                    <span>{sub.absent_classes} absent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Child Fee & Outstanding Dues Summary Banner (Overview) */}
          {(() => {
            const currentChildFees = parentFeesData?.children_fees?.find(
              (cf: any) => cf.student_id === selectedChildId
            );
            const childOutstanding = currentChildFees ? currentChildFees.total_outstanding : 0;
            const childOverdueCount = currentChildFees ? currentChildFees.overdue_count : 0;
            const latestUnpaidInvoice = currentChildFees?.invoices?.find(
              (inv: FeeInvoice) => inv.balance_due > 0
            );

            return (
              <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      childOverdueCount > 0
                        ? 'bg-rose-50 text-rose-600'
                        : childOutstanding > 0
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#292524]">College Fee & Financial Status</h3>
                        {childOverdueCount > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            Overdue Dues
                          </span>
                        ) : childOutstanding > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            Payment Pending
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            All Dues Cleared
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        {childOutstanding > 0
                          ? `Outstanding balance for ${selectedChild?.full_name}: Rs. ${childOutstanding.toLocaleString()}`
                          : `All tuition and departmental semester fees are cleared for ${selectedChild?.full_name}.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {childOutstanding > 0 && latestUnpaidInvoice && (
                      <button
                        onClick={() => {
                          setSelectedInvoiceForPay(latestUnpaidInvoice);
                          setPayAmount(latestUnpaidInvoice.balance_due);
                          setPaymentSuccessData(null);
                          setShowPayModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#3F8F72] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Online (Rs. {latestUnpaidInvoice.balance_due.toLocaleString()})
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('FEES')}
                      className="px-4 py-2 rounded-xl border border-[#E7E5E4] hover:bg-[#F5F5F4] text-[#292524] text-xs font-semibold transition-all cursor-pointer"
                    >
                      View All Challans & Receipts →
                    </button>
                  </div>
                </div>

                {childOverdueCount > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Notice:</strong> One or more fee challans have exceeded their due date. A late payment fine has been applied. Please pay via online gateway or bank counter to avoid student portal suspension.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}

      {/* TAB 2: SUBJECTS BREAKDOWN TABLE */}
      {activeTab === 'SUBJECTS' && childStats && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#292524]">Detailed Subject Attendance Breakdown</h3>
            <p className="text-xs text-[#78716C]">Classes held, sessions attended, absences, and percentages calculated per course</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#292524]">
              <thead className="bg-[#F5F5F4] text-[#78716C] font-semibold uppercase text-[10px] tracking-wider border-y border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4 text-center">Classes Held</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Late</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {childStats.subject_wise.map((sub, idx) => (
                  <tr key={`sub-row-${sub.subject_id}-${idx}`} className="hover:bg-[#FAFAF9]">
                    <td className="py-3.5 px-4 font-bold text-[#292524]">{sub.subject_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[#78716C]">{sub.subject_code}</td>
                    <td className="py-3.5 px-4 text-[#57534E]">{sub.teacher_name}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{sub.total_classes}</td>
                    <td className="py-3.5 px-4 text-center text-[#3F8F72] font-semibold">{sub.present_classes}</td>
                    <td className="py-3.5 px-4 text-center text-[#CA8A04] font-medium">{sub.late_classes}</td>
                    <td className="py-3.5 px-4 text-center text-[#DC2626] font-semibold">{sub.absent_classes}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                        sub.percentage >= 75 ? 'bg-[#EAF5F0] text-[#3F8F72]' : 'bg-[#FEF2F2] text-[#991B1B]'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {sub.percentage >= 75 ? (
                        <span className="text-[11px] font-semibold text-[#3F8F72]">Eligible</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#DC2626]">At Risk</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE HISTORY LOGS */}
      {activeTab === 'HISTORY' && childStats && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E5E4] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#292524]">Official Attendance Session Records</h3>
              <p className="text-xs text-[#78716C]">Session-by-session records including verification method & timestamps</p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-[#292524] focus:outline-none"
              />
              <span className="text-xs text-[#78716C]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-[#292524] focus:outline-none"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-[#78716C] hover:text-[#292524] px-2 py-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#292524]">
              <thead className="bg-[#F5F5F4] text-[#78716C] font-semibold uppercase text-[10px] tracking-wider border-y border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Verification Method</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {childStats.recent_records.length > 0 ? (
                  childStats.recent_records.map((rec, idx) => (
                    <tr key={`rec-row-${rec.id}-${idx}`} className="hover:bg-[#FAFAF9]">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#292524]">{rec.date}</td>
                      <td className="py-3.5 px-4 font-mono text-[#78716C]">{rec.time}</td>
                      <td className="py-3.5 px-4 font-bold text-[#292524]">{rec.subject_name}</td>
                      <td className="py-3.5 px-4 text-[#57534E]">{rec.teacher_name}</td>
                      <td className="py-3.5 px-4">
                        {rec.method === 'FACE_RECOGNITION' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF5F0] text-[#3F8F72] border border-[#3F8F72]/30">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Face Recognition</span>
                          </span>
                        ) : rec.method === 'CAMERA_CHECK_IN' ? (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            Live Camera Check-In
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]">
                            Manual Roll Call
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'PRESENT'
                            ? 'bg-[#EAF5F0] text-[#3F8F72]'
                            : rec.status === 'LATE'
                            ? 'bg-[#FEF9C3] text-[#854D0E]'
                            : 'bg-[#FEF2F2] text-[#DC2626]'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#78716C] text-[11px]">{rec.remarks || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#78716C]">
                      No attendance sessions recorded for the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: LEAVE REQUEST SUBMISSION BY PARENT */}
      {activeTab === 'LEAVE' && selectedChild && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#292524]">Submit Official Parent Leave Application</h3>
            <p className="text-xs text-[#78716C]">
              Notify course teachers regarding your child's medical or personal absence directly from the portal
            </p>
          </div>

          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            
            <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#A8A29E] block">Student:</span>
                <span className="text-xs font-bold text-[#292524]">{selectedChild.full_name} ({selectedChild.roll_number})</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A29E] block">Authorized Guardian:</span>
                <span className="text-xs font-semibold text-[#57534E]">{currentUser?.full_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">From Date:</label>
                <input
                  type="date"
                  required
                  value={leaveFrom}
                  onChange={e => setLeaveFrom(e.target.value)}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">To Date:</label>
                <input
                  type="date"
                  required
                  value={leaveTo}
                  onChange={e => setLeaveTo(e.target.value)}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#78716C] block mb-1">Reason for Absence:</label>
              <textarea
                required
                rows={4}
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                placeholder="Please state clearly the reason for absence (e.g., severe fever, family emergency, doctor consultation)..."
                className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl p-3 text-[#292524] placeholder-[#A8A29E] focus:outline-none focus:border-[#3F8F72]"
              />
            </div>

            {leaveMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  leaveMessage.type === 'success'
                    ? 'bg-[#EAF5F0] border-[#3F8F72]/30 text-[#1B4332]'
                    : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                }`}
              >
                {leaveMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3F8F72] shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                )}
                <span>{leaveMessage.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={leaveSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3F8F72] hover:bg-[#347A60] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{leaveSubmitting ? 'Submitting...' : 'Submit Leave Application'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS & ABSENCE ALERTS */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#292524]">Attendance Notifications & Absence Notices</h3>
            <p className="text-xs text-[#78716C]">Automated notifications regarding linked student absence events and monthly reports</p>
          </div>

          <div className="space-y-3">
            {parentNotifications.length > 0 ? (
              parentNotifications.map((notif: any, idx) => (
                <div
                  key={`parent-notif-${notif.id}-${idx}`}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                    notif.type === 'WARNING'
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      : 'bg-[#FAFAF9] border-[#E7E5E4] text-[#292524]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notif.type === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                    ) : (
                      <Bell className="w-5 h-5 text-[#3F8F72] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold">{notif.title}</h4>
                      <p className="text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-[#78716C] mt-2 block">{notif.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#78716C]">
                No pending attendance alerts for your linked children.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FEES & ONLINE PAYMENT PORTAL */}
      {activeTab === 'FEES' && (() => {
        const currentChildFees = parentFeesData?.children_fees?.find(
          (cf: any) => cf.student_id === selectedChildId
        );
        const childInvoices: FeeInvoice[] = currentChildFees ? currentChildFees.invoices : [];
        const childOutstanding = currentChildFees ? currentChildFees.total_outstanding : 0;
        const childTotalPaid = currentChildFees ? currentChildFees.total_paid : 0;
        const childTotalBilled = currentChildFees ? currentChildFees.total_billed : 0;
        const childOverdueCount = currentChildFees ? currentChildFees.overdue_count : 0;

        return (
          <div className="space-y-6">
            {/* Top Financial Overview Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-indigo-900/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Receipt className="w-3.5 h-3.5" />
                    Official Fee Portal • {selectedChild?.full_name}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Semester Fee Challans & Online Payment
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Roll No: <span className="font-mono font-semibold text-white">{selectedChild?.roll_number}</span> • Class: {selectedChild?.class_name} • Academic Session: 2025-2026
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {childOutstanding > 0 && childInvoices.find(i => i.balance_due > 0) && (
                    <button
                      onClick={() => {
                        const inv = childInvoices.find(i => i.balance_due > 0)!;
                        setSelectedInvoiceForPay(inv);
                        setPayAmount(inv.balance_due);
                        setPaymentSuccessData(null);
                        setShowPayModal(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay Outstanding Fees (Rs. {childOutstanding.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Dues Breakdown Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/40 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Total Billed Volume</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    Rs. {childTotalBilled.toLocaleString()}
                  </span>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <span className="text-emerald-300 block text-[10px]">Total Cleared</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                    Rs. {childTotalPaid.toLocaleString()}
                  </span>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <span className="text-amber-300 block text-[10px]">Current Dues</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">
                    Rs. {childOutstanding.toLocaleString()}
                  </span>
                </div>
                <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <span className="text-rose-300 block text-[10px]">Overdue Invoices</span>
                  <span className="text-base font-bold text-rose-400 mt-0.5 block">
                    {childOverdueCount} Overdue
                  </span>
                </div>
              </div>
            </div>

            {/* Overdue Warning Alert */}
            {childOverdueCount > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-bold">Overdue Payment Alert</h4>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">
                    A late payment surcharge has been applied to overdue challans. You can clear the balance immediately via Debit/Credit Card, 1Link Bank Transfer, or JazzCash to restore unhindered student exam clearance.
                  </p>
                </div>
              </div>
            )}

            {/* Invoices List */}
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292524]">Issued Fee Challans & Vouchers</h3>
                  <p className="text-xs text-[#78716C]">Itemized fee heads, concession/scholarship adjustments, and payment receipts</p>
                </div>
                <span className="text-xs font-semibold text-[#78716C]">
                  {childInvoices.length} Challans Found
                </span>
              </div>

              {childInvoices.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#78716C]">
                  No fee challans found for {selectedChild?.full_name}.
                </div>
              ) : (
                <div className="space-y-4">
                  {childInvoices.map((inv, idx) => {
                    const isPaid = inv.status === 'PAID';
                    const isOverdue = inv.status === 'OVERDUE';
                    const isPartial = inv.status === 'PARTIALLY_PAID';

                    return (
                      <div
                        key={`child-inv-${inv.id}-${idx}`}
                        className={`rounded-xl border p-5 transition-all ${
                          isOverdue
                            ? 'border-rose-200 bg-rose-50/20'
                            : isPaid
                            ? 'border-emerald-200 bg-emerald-50/10'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {inv.challan_number}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">{inv.title}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Issued: {inv.issue_date} • Due Date:{' '}
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'font-semibold text-slate-700'}>
                                {inv.due_date}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Cleared in Full
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" /> 1st Installment Paid
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5" /> Overdue Dues
                              </span>
                            )}
                            {inv.status === 'UNPAID' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Awaiting Payment
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Itemized Table */}
                        <div className="py-3">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                            Itemized Fee Heads:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {inv.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between p-2 rounded bg-slate-50 text-xs border border-slate-100">
                                <span className="text-slate-600">{it.name}</span>
                                <span className="font-semibold text-slate-800">Rs. {it.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Totals & Discounts Summary Row */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-4 text-slate-600">
                              <span>Subtotal: <strong>Rs. {inv.subtotal.toLocaleString()}</strong></span>
                              {inv.discount_amount > 0 && (
                                <span className="text-emerald-700 font-medium">
                                  Concession: -Rs. {inv.discount_amount.toLocaleString()}
                                </span>
                              )}
                              {inv.late_fine > 0 && (
                                <span className="text-rose-700 font-medium">
                                  Late Fine: +Rs. {inv.late_fine.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {inv.discount_reason && (
                              <p className="text-[11px] text-emerald-700 font-medium italic">
                                * Applied: {inv.discount_reason}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Balance Payable</span>
                              <span className={`text-base font-bold ${inv.balance_due === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {inv.balance_due === 0 ? 'Rs. 0' : `Rs. ${inv.balance_due.toLocaleString()}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* 3-Copy Bank Challan / Receipt PDF Download */}
                              <button
                                onClick={() => downloadOfficialChallanPDF(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-all"
                                title="Download official 3-Copy Bank Challan"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>3-Copy Challan</span>
                              </button>

                              {/* Pay Online Now Button */}
                              {inv.balance_due > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoiceForPay(inv);
                                    setPayAmount(inv.balance_due);
                                    setPaymentSuccessData(null);
                                    setShowPayModal(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pay Now</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verified Payment Receipts History */}
            {parentFeesData?.all_invoices && (
              <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#292524]">Official Payment Receipts Archive</h3>
                    <p className="text-xs text-[#78716C]">Verified bank and online payment receipts for your records</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {childInvoices.filter(i => i.paid_amount > 0).map((inv, idx) => (
                    <div key={`paid-receipt-${inv.id}-${idx}`} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-xs text-slate-900">{inv.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Challan: {inv.challan_number} • Paid: Rs. {inv.paid_amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          Cleared on {inv.payment_date ? new Date(inv.payment_date).toLocaleDateString() : 'August 2026'}
                        </p>
                      </div>

                      <button
                        onClick={() => downloadOfficialChallanPDF(inv)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition-all cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ONLINE PAYMENT MODAL (MULTI-CHANNEL CHECKOUT) */}
      {showPayModal && selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {paymentSuccessData ? (
              /* Success Confirmation View */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Payment Successfully Confirmed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your transaction has been processed and verified by Alpine Degree College accounts desk.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-900">{paymentSuccessData.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Official Receipt #:</span>
                    <span className="font-mono font-bold text-indigo-700">{paymentSuccessData.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">Rs. {Number(payAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Challan:</span>
                    <span className="font-mono text-slate-700">{selectedInvoiceForPay.challan_number}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowPayModal(false);
                      setPaymentSuccessData(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => downloadOfficialChallanPDF(selectedInvoiceForPay)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Official Receipt
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form View */
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Online Fee Payment Checkout</h3>
                    <p className="text-xs text-slate-500">Challan: {selectedInvoiceForPay.challan_number} • {selectedInvoiceForPay.title}</p>
                  </div>
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Amount Selection */}
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">
                      Total Outstanding Balance
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                      Rs. {selectedInvoiceForPay.balance_due.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-40 text-right">
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Paying Amount (PKR):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedInvoiceForPay.balance_due}
                      value={payAmount}
                      onChange={e => setPayAmount(Number(e.target.value))}
                      className="w-full text-sm font-bold text-right border border-indigo-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Payment Channel Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Choose Payment Method:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-xs font-bold block">Credit/Debit Card</span>
                      <span className="text-[10px] text-slate-400">Visa / Master</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-xs font-bold block">1Link / IBFT</span>
                      <span className="text-[10px] text-slate-400">Direct Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('WALLET')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'WALLET'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Phone className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-xs font-bold block">Mobile Wallet</span>
                      <span className="text-[10px] text-slate-400">JazzCash / Easy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH_CHALLAN')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'CASH_CHALLAN'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <FileText className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-xs font-bold block">Bank Challan</span>
                      <span className="text-[10px] text-slate-400">Counter Cash</span>
                    </button>
                  </div>
                </div>

                {/* Method Specific Fields */}
                {paymentMethod === 'CARD' && (
                  <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">CVV Security Code</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          placeholder="921"
                          maxLength={4}
                          className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 text-xs space-y-2">
                    <h4 className="font-bold text-indigo-900">Official College 1Link Account Details:</h4>
                    <p className="text-slate-600">• Bank: <strong>Meezan Bank Ltd, Khanpur City Branch</strong></p>
                    <p className="text-slate-600">• Title: <strong>Alpine Degree College Fee Account</strong></p>
                    <p className="text-slate-600 font-mono">• IBAN: <strong>PK36MEZN0001002345678901</strong></p>
                    <p className="text-slate-600 font-mono">• 1Link Consumer No: <strong>9920{selectedInvoiceForPay.id.toString().padStart(6, '0')}</strong></p>
                    <p className="text-[11px] text-indigo-800 mt-2">
                      Transfer through your mobile banking app. The transaction will be verified instantly upon confirmation.
                    </p>
                  </div>
                )}

                {paymentMethod === 'WALLET' && (
                  <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex gap-2">
                      {(['JazzCash', 'Easypaisa', 'SadaPay'] as const).map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWalletProvider(w)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                            walletProvider === w
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Mobile Account Number</label>
                      <input
                        type="text"
                        value={walletPhone}
                        onChange={e => setWalletPhone(e.target.value)}
                        placeholder="0300 1234567"
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Wallet MPIN</label>
                      <input
                        type="password"
                        value={walletPin}
                        onChange={e => setWalletPin(e.target.value)}
                        placeholder="••••"
                        maxLength={4}
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'CASH_CHALLAN' && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                    <h4 className="font-bold text-slate-900">Over-the-Counter Bank Branches in Khanpur:</h4>
                    <p className="text-slate-600">• Allied Bank Limited, Model Town Branch Khanpur</p>
                    <p className="text-slate-600">• Meezan Bank Limited, Katchery Road Branch Khanpur</p>
                    <p className="text-slate-600">• College Bursar / Accounts Office Counter (Room 102)</p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => downloadOfficialChallanPDF(selectedInvoiceForPay)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download 3-Copy Bank Challan First
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={async () => {
                      setIsProcessingPayment(true);
                      try {
                        const channelName =
                          paymentMethod === 'CARD'
                            ? 'Visa / MasterCard Online Gateway'
                            : paymentMethod === 'WALLET'
                            ? walletProvider + ' Mobile Wallet'
                            : paymentMethod === 'BANK_TRANSFER'
                            ? '1Link Interbank Funds Transfer'
                            : 'Allied Bank Counter Deposit';

                        const res = await fetch('/api/fees/pay', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            invoice_id: selectedInvoiceForPay.id,
                            amount_paid: Number(payAmount),
                            payment_method: paymentMethod,
                            payment_channel: channelName,
                            card_number: cardNumber,
                            wallet_number: walletPhone,
                            notes: `Parent payment cleared for ${selectedChild?.full_name || 'student'}.`,
                          }),
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Payment failed');

                        setPaymentSuccessData(data);
                        fetchParentFees();
                      } catch (err: any) {
                        alert(err.message || 'Payment processing failed');
                      } finally {
                        setIsProcessingPayment(false);
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? 'Processing Cleared...' : `Confirm & Pay Rs. ${Number(payAmount).toLocaleString()}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Printable Verification Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t border-stone-400 text-xs">
        <div className="grid grid-cols-3 gap-8 text-center text-stone-700">
          <div>
            <div className="border-b border-stone-500 pb-8 mb-1" />
            <span>Guardian's Signature</span>
          </div>
          <div>
            <div className="border-b border-stone-500 pb-8 mb-1" />
            <span>Department Incharge / HoD</span>
          </div>
          <div>
            <div className="border-b border-stone-500 pb-8 mb-1" />
            <span>Principal's Official Seal</span>
          </div>
        </div>
      </div>

    </div>
  );
};
