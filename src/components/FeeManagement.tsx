import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Send,
  Building2,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Receipt,
  X,
  Edit,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import {
  FeeInvoice,
  FeePayment,
  FeeStructure,
  FeeSummaryStats,
  FeeCategory,
  FeeDiscountRule,
  ClassSection,
  Student,
  User,
  PaymentMethod
} from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

interface FeeManagementProps {
  currentUser: User | null;
  onNavigateTo?: (tab: string) => void;
}

export const FeeManagement: React.FC<FeeManagementProps> = ({ currentUser, onNavigateTo }) => {
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'STRUCTURES' | 'PAYMENTS' | 'ANALYTICS'>('INVOICES');

  // Core Data States
  const [summary, setSummary] = useState<FeeSummaryStats | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [discounts, setDiscounts] = useState<FeeDiscountRule[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Selected Entities
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);

  // Form States for Generation Modal
  const [genMode, setGenMode] = useState<'CLASS' | 'SINGLE'>('CLASS');
  const [genClassId, setGenClassId] = useState<number>(1);
  const [genStudentId, setGenStudentId] = useState<number>(1);
  const [genStructureId, setGenStructureId] = useState<number>(1);
  const [genTitle, setGenTitle] = useState('');
  const [genDueDate, setGenDueDate] = useState('');
  const [genDiscountRuleId, setGenDiscountRuleId] = useState<string>('');

  // Form States for Payment Modal (Admin Manual Collection)
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH_CHALLAN');
  const [payChannel, setPayChannel] = useState('Allied Bank Counter Deposit');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Form States for Adjustment Modal
  const [adjDiscountAmount, setAdjDiscountAmount] = useState<number>(0);
  const [adjDiscountReason, setAdjDiscountReason] = useState('');
  const [adjLateFine, setAdjLateFine] = useState<number>(0);
  const [adjNotes, setAdjNotes] = useState('');

  // Fetch All Core Data
  const fetchAllFeeData = async () => {
    setLoading(true);
    try {
      const [sumRes, invRes, strucRes, catRes, discRes, payRes, clsRes, stuRes] = await Promise.all([
        fetch('/api/fees/summary'),
        fetch('/api/fees/invoices'),
        fetch('/api/fees/structures'),
        fetch('/api/fees/categories'),
        fetch('/api/fees/discounts'),
        fetch('/api/fees/payments'),
        fetch('/api/classes'),
        fetch('/api/students'),
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      if (strucRes.ok) setStructures(await strucRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (discRes.ok) setDiscounts(await discRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (clsRes.ok) setClasses(await clsRes.json());
      if (stuRes.ok) setStudents(await stuRes.json());
    } catch (err) {
      console.error('Failed to load fee management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFeeData();
  }, []);

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchClass = classFilter === 'ALL' || inv.class_id === Number(classFilter);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      inv.challan_number.toLowerCase().includes(q) ||
      (inv.student_name && inv.student_name.toLowerCase().includes(q)) ||
      (inv.roll_number && inv.roll_number.toLowerCase().includes(q)) ||
      inv.title.toLowerCase().includes(q);
    return matchStatus && matchClass && matchSearch;
  });
  const invoicePagination = usePagination<FeeInvoice>(
    filteredInvoices,
    JSON.stringify([statusFilter, classFilter, searchQuery])
  );
  const paymentPagination = usePagination<FeePayment>(payments, 'payments');

  // Handle Invoice Generation
  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fees/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: genMode,
          class_id: genClassId,
          student_id: genStudentId,
          fee_structure_id: genStructureId,
          title: genTitle.trim() || undefined,
          due_date: genDueDate || undefined,
          discount_rule_id: genDiscountRuleId ? Number(genDiscountRuleId) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate challans');

      setActionMessage({ type: 'success', text: data.message || `Successfully generated ${data.count} challans!` });
      setShowGenerateModal(false);
      fetchAllFeeData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error generating fee challans' });
    }
  };

  // Handle Manual Payment Processing
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmittingPay(true);
    try {
      const res = await fetch('/api/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          amount_paid: Number(payAmount),
          payment_method: payMethod,
          payment_channel: payChannel,
          bank_account_reference: payReference || `MANUAL-REC-${Date.now().toString().slice(-4)}`,
          notes: payNotes || 'Manual payment entered by college administration.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setActionMessage({ type: 'success', text: `Payment of Rs. ${Number(payAmount).toLocaleString()} recorded. Receipt: ${data.receipt_number}` });
      setShowPayModal(false);
      fetchAllFeeData();
      if (data.payment) {
        setSelectedPayment(data.payment);
        setShowReceiptModal(true);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Payment recording failed.' });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Handle Invoice Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await fetch(`/api/fees/invoices/${selectedInvoice.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_amount: adjDiscountAmount,
          discount_reason: adjDiscountReason,
          late_fine: adjLateFine,
          notes: adjNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update invoice');

      setActionMessage({ type: 'success', text: `Challan ${selectedInvoice.challan_number} adjusted successfully.` });
      setShowAdjustModal(false);
      fetchAllFeeData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to adjust invoice' });
    }
  };

  // Send Fee Payment Reminder
  const handleSendReminder = async (invoice: FeeInvoice) => {
    try {
      const res = await fetch('/api/fees/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reminder');
      setActionMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleShareWhatsApp = async (invoice: FeeInvoice) => {
    const doc = createOfficialChallanPDF(invoice);
    const file = new File(
      [doc.output('blob')],
      `Alpine_College_Challan_${invoice.challan_number}.pdf`,
      { type: 'application/pdf' },
    );
    const canShareFile = typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] });
    const popup = canShareFile ? null : window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    if (!canShareFile && !popup) {
      setActionMessage({ type: 'error', text: 'WhatsApp could not be opened. Allow pop-ups and try again.' });
      return;
    }

    try {
      const response = await fetch(`/api/fees/invoices/${invoice.id}/whatsapp-share`);
      const data = await response.json();
      if (!response.ok || !data.whatsapp_url) {
        throw new Error(data.error || 'Could not create a WhatsApp message for this voucher.');
      }

      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: `Fee voucher ${invoice.challan_number}`,
          text: `Please share this fee voucher for ${invoice.student_name} with ${data.parent_name} (${data.whatsapp_number}).`,
        });
        setActionMessage({
          type: 'success',
          text: `Voucher PDF opened in the share sheet. Choose WhatsApp and send it to ${data.parent_name} at ${data.whatsapp_number}.`,
        });
        return;
      }

      const whatsappUrl = new URL(data.whatsapp_url);
      if (whatsappUrl.protocol !== 'https:' || whatsappUrl.hostname !== 'wa.me') {
        throw new Error('The server returned an invalid WhatsApp link.');
      }
      doc.save(file.name);
      popup.location.replace(whatsappUrl.toString());
      setActionMessage({
        type: 'success',
        text: `Voucher PDF downloaded and WhatsApp opened for ${data.parent_name}. Attach the downloaded PDF and send the message.`,
      });
    } catch (err: any) {
      popup?.close();
      if (err.name === 'AbortError') {
        setActionMessage({ type: 'error', text: 'Voucher sharing was cancelled.' });
      } else {
        setActionMessage({ type: 'error', text: err.message || 'Failed to share the voucher.' });
      }
    }
  };

  // Generate the 3-copy bank challan for download or file sharing.
  const createOfficialChallanPDF = (invoice: FeeInvoice) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const copies = ['BANK COPY', 'COLLEGE ACCOUNTS COPY', 'STUDENT COPY'];
    const copyWidth = 88; // 3 columns on A4 landscape (297mm width)

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
      doc.text('Authorized Bank: Meezan Bank / Allied Bank', startX + 4, 34);
      doc.text(`Challan No: ${invoice.challan_number}`, startX + 4, 39);
      doc.setFont('helvetica', 'normal');
      doc.text(`Issue Date: ${invoice.issue_date}`, startX + 4, 44);
      doc.text(`Due Date: ${invoice.due_date}`, startX + 50, 44);

      // Student Meta Table
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

    return doc;
  };

  const downloadOfficialChallanPDF = (invoice: FeeInvoice) => {
    createOfficialChallanPDF(invoice).save(`Alpine_College_Challan_${invoice.challan_number}.pdf`);
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = ['Challan Number', 'Student Name', 'Roll Number', 'Class', 'Title', 'Issue Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status'];
    const rows = filteredInvoices.map(i => [
      i.challan_number,
      i.student_name,
      i.roll_number,
      i.class_name,
      `"${i.title}"`,
      i.issue_date,
      i.due_date,
      i.total_amount,
      i.paid_amount,
      i.balance_due,
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Alpine_Fee_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              Institutional Accounts & Bursar Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Fee Management & Online Payments
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Alpine Degree College Khanpur official fee collection system. Manage semester structures, issue automated challans, record online and counter payments, and generate authoritative 3-copy bank receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setGenTitle('Fall 2026 Semester Regular Fee Challan');
                setGenDueDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
                setShowGenerateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Issue Fee Challans
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-all cursor-pointer backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-indigo-800/40">
            <div className="bg-white/5 rounded-xl p-3.5 border border-white/5 backdrop-blur-sm">
              <span className="text-xs text-slate-400 block font-medium">Total Billed Volume</span>
              <span className="text-lg font-bold text-white mt-0.5 block">
                Rs. {summary.total_billed.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">{summary.total_invoices_count} Challans Issued</span>
            </div>

            <div className="bg-emerald-500/10 rounded-xl p-3.5 border border-emerald-500/20 backdrop-blur-sm">
              <span className="text-xs text-emerald-300 block font-medium">Total Collected</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                Rs. {summary.total_collected.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-300/80">{summary.paid_invoices_count} Paid in Full</span>
            </div>

            <div className="bg-amber-500/10 rounded-xl p-3.5 border border-amber-500/20 backdrop-blur-sm">
              <span className="text-xs text-amber-300 block font-medium">Pending Collection</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                Rs. {summary.total_outstanding.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-300/80">{summary.unpaid_invoices_count} Unpaid Challans</span>
            </div>

            <div className="bg-rose-500/10 rounded-xl p-3.5 border border-rose-500/20 backdrop-blur-sm">
              <span className="text-xs text-rose-300 block font-medium">Overdue Dues</span>
              <span className="text-lg font-bold text-rose-400 mt-0.5 block">
                Rs. {summary.total_overdue.toLocaleString()}
              </span>
              <span className="text-[11px] text-rose-300/80">{summary.overdue_invoices_count} Invoices Overdue</span>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-indigo-500/10 rounded-xl p-3.5 border border-indigo-500/20 backdrop-blur-sm">
              <span className="text-xs text-indigo-300 block font-medium">Collection Recovery Rate</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-indigo-400">{summary.collection_rate_pct}%</span>
                <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full transition-all" style={{ width: `${summary.collection_rate_pct}%` }} />
                </div>
              </div>
              <span className="text-[11px] text-indigo-300/80">Target: 90%+ Recovery</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'INVOICES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Fee Invoices & Challans ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('STRUCTURES')}
          className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'STRUCTURES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Fee Structures & Rates ({structures.length})
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PAYMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Transaction Audit Trail ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Departmental Analytics
        </button>
      </div>

      {/* TAB 1: INVOICES & CHALLANS TABLE */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-b-xl rounded-t-none shadow-sm border border-slate-200 border-t-0 p-6 space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Challan #, Student name, Roll #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Classes & Sections</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="OVERDUE">Overdue Dues</option>
                <option value="PAID">Paid in Full</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Challan #</th>
                  <th className="py-3.5 px-4">Student & Roll No</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Subtotal</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Late Fine</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No fee invoices match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  invoicePagination.items.map((inv, idx) => (
                    <tr key={`admin-inv-${inv.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 text-xs">
                        {inv.challan_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.student_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{inv.roll_number}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {inv.class_name}
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <span className={inv.status === 'OVERDUE' ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {inv.due_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        Rs. {inv.subtotal.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-emerald-600 font-medium">
                        {inv.discount_amount > 0 ? `- Rs. ${inv.discount_amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-rose-600 font-medium">
                        {inv.late_fine > 0 ? `+ Rs. ${inv.late_fine.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-900">
                        Rs. {inv.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold">
                        {inv.balance_due === 0 ? (
                          <span className="text-emerald-600">Cleared</span>
                        ) : (
                          <span className="text-rose-600">Rs. {inv.balance_due.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inv.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        )}
                        {inv.status === 'PARTIALLY_PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Partial
                          </span>
                        )}
                        {inv.status === 'OVERDUE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                        {inv.status === 'UNPAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Share the fee voucher PDF via WhatsApp"
                            aria-label={`Share PDF voucher ${inv.challan_number} via WhatsApp`}
                            onClick={() => handleShareWhatsApp(inv)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            Send PDF
                          </button>

                          {/* Print 3-Copy Bank Challan */}
                          <button
                            title="Download 3-Copy Bank Challan / Receipt"
                            onClick={() => downloadOfficialChallanPDF(inv)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Record Payment (if balance remains) */}
                          {inv.balance_due > 0 && (
                            <button
                              title="Record Offline / Counter Payment"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPayAmount(inv.balance_due);
                                setShowPayModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                            >
                              Receive Fee
                            </button>
                          )}

                          {/* Adjust / Scholarship */}
                          <button
                            title="Adjust Scholarship or Fine"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setAdjDiscountAmount(inv.discount_amount);
                              setAdjDiscountReason(inv.discount_reason || '');
                              setAdjLateFine(inv.late_fine);
                              setAdjNotes(inv.notes || '');
                              setShowAdjustModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Reminder button */}
                          {inv.balance_due > 0 && (
                            <button
                              title="Dispatch Fee Reminder to Student & Parent"
                              onClick={() => handleSendReminder(inv)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={invoicePagination} label="fee challans" />
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === 'STRUCTURES' && (
        <div className="bg-white rounded-b-xl rounded-t-none shadow-sm border border-slate-200 border-t-0 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic Fee Structures & Category Rates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard semester fee schedules applicable across BS Computer Science, BS IT, and BS AI programs.
              </p>
            </div>
            <button
              onClick={() => setShowStructureModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {structures.map((struc, idx) => (
              <div
                key={`struc-card-${struc.id}-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Session {struc.academic_session}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{struc.name}</h3>
                    <p className="text-xs text-slate-500">{struc.class_name || 'Standard Curriculum'}</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    Rs. {struc.total_amount.toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">Itemized Heads:</span>
                  {struc.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-600">
                      <span>• {it.category_name}</span>
                      <span className="font-medium text-slate-800">Rs. {it.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Grace Period: {struc.due_days_limit} Days</span>
                  <span>Late Fine: Rs. {struc.late_fine_amount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Fee Categories Directory */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Institutional Fee Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat, idx) => (
                <div key={`cat-card-${cat.id}-${idx}`} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {cat.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION AUDIT TRAIL */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-b-xl rounded-t-none shadow-sm border border-slate-200 border-t-0 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Official Payment Audit Trail & Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every verified transaction completed through online payment gateway or bank teller deposit.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Method & Channel</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentPagination.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No payment history is available.
                    </td>
                  </tr>
                ) : paymentPagination.items.map((pay, idx) => (
                  <tr key={`pay-row-${pay.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                      {pay.transaction_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">
                      {pay.receipt_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pay.student_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{pay.roll_number}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      Rs. {pay.amount_paid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-slate-800 block">{pay.payment_channel}</span>
                      <span className="text-[11px] text-slate-400 font-mono">Ref: {pay.transaction_reference}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-medium text-slate-800">{pay.paid_by_name}</div>
                      <div className="text-[11px] text-slate-400">{pay.paid_by_role}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(pay.payment_date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPayment(pay);
                          setShowReceiptModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={paymentPagination} label="payments" />
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'ANALYTICS' && summary && (
        <div className="bg-white rounded-b-xl rounded-t-none shadow-sm border border-slate-200 border-t-0 p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900">Class-Wise Fee Recovery & Outstanding Aging</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.class_breakdown.map((cb, idx) => (
              <div key={`cb-card-${cb.class_id}-${idx}`} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{cb.class_name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {cb.collection_rate_pct}% Collected
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${cb.collection_rate_pct}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Total Billed</span>
                    <span className="font-bold text-slate-800">Rs. {cb.total_billed.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-emerald-200">
                    <span className="text-emerald-600 block text-[10px]">Collected</span>
                    <span className="font-bold text-emerald-700">Rs. {cb.total_collected.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-rose-200">
                    <span className="text-rose-600 block text-[10px]">Outstanding</span>
                    <span className="font-bold text-rose-700">Rs. {cb.total_outstanding.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE FEE CHALLANS */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Issue Fee Challans</h3>
                <p className="text-xs text-slate-500">Generate semester fee vouchers for classes or individual students.</p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoices} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGenMode('CLASS')}
                  className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                    genMode === 'CLASS'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Bulk Class Batch
                </button>
                <button
                  type="button"
                  onClick={() => setGenMode('SINGLE')}
                  className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                    genMode === 'SINGLE'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Individual Student
                </button>
              </div>

              {genMode === 'CLASS' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Class & Section</label>
                  <select
                    value={genClassId}
                    onChange={e => setGenClassId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Batch: {cls.batch})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Student</label>
                  <select
                    value={genStudentId}
                    onChange={e => setGenStudentId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.roll_number} - {s.student_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fee Structure Template</label>
                <select
                  value={genStructureId}
                  onChange={e => setGenStructureId(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  {structures.map(struc => (
                    <option key={struc.id} value={struc.id}>
                      {struc.name} — Rs. {struc.total_amount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Challan Title / Description</label>
                  <input
                    type="text"
                    required
                    value={genTitle}
                    onChange={e => setGenTitle(e.target.value)}
                    placeholder="e.g. Fall 2026 Semester Regular Fee"
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={genDueDate}
                    onChange={e => setGenDueDate(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Apply Scholarship / Concession Rule (Optional)
                </label>
                <select
                  value={genDiscountRuleId}
                  onChange={e => setGenDiscountRuleId(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No automatic discount</option>
                  {discounts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.value}{d.type === 'PERCENTAGE' ? '%' : ' PKR'} off)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md cursor-pointer"
                >
                  Generate & Notify Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT (ADMIN WALK-IN / CASH COUNTER) */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Receive & Record Fee Payment</h3>
                <p className="text-xs text-slate-500">Challan: {selectedInvoice.challan_number}</p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 block">Student</span>
                <span className="font-bold text-slate-800">{selectedInvoice.student_name}</span>
                <span className="text-slate-500 font-mono block">({selectedInvoice.roll_number})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Outstanding Balance</span>
                <span className="font-bold text-rose-600 text-sm">
                  Rs. {selectedInvoice.balance_due.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Amount Received (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedInvoice.balance_due}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full text-sm font-bold border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CASH_CHALLAN">Cash Counter / Bank Scroll</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer (1Link)</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="WALLET">Mobile Wallet (JazzCash/Easypaisa)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Deposit Channel</label>
                  <input
                    type="text"
                    required
                    value={payChannel}
                    onChange={e => setPayChannel(e.target.value)}
                    placeholder="e.g. Allied Bank Counter Deposit"
                    className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Scroll / Teller Ref #
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={e => setPayReference(e.target.value)}
                  placeholder="e.g. ABL-KHP-889412"
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="Enter remarks, cashier notes, or scroll book page..."
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPay ? 'Confirming...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST INVOICE (SCHOLARSHIP / WAIVER / LATE FINE) */}
      {showAdjustModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Fee Challan</h3>
                <p className="text-xs text-slate-500">{selectedInvoice.challan_number}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Concession / Scholarship (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjDiscountAmount}
                  onChange={e => setAdjDiscountAmount(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Concession Reason</label>
                <input
                  type="text"
                  value={adjDiscountReason}
                  onChange={e => setAdjDiscountReason(e.target.value)}
                  placeholder="e.g. Merit Concession SGPA 3.9"
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Late Fine Surcharge (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjLateFine}
                  onChange={e => setAdjLateFine(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Audit Remarks</label>
                <textarea
                  rows={2}
                  value={adjNotes}
                  onChange={e => setAdjNotes(e.target.value)}
                  placeholder="Reason for adjustment approved by Principal..."
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md cursor-pointer"
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: OFFICIAL RECEIPT PREVIEW */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Payment Receipt</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedPayment.receipt_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="text-sm font-bold text-indigo-950">ALPINE DEGREE COLLEGE KHANPUR</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Official Academic Accounts Voucher
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <span className="font-bold text-slate-800">{selectedPayment.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPayment.roll_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transaction ID:</span>
                  <span className="font-mono text-slate-800 text-[11px]">{selectedPayment.transaction_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{selectedPayment.payment_channel}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700">Total Amount Cleared:</span>
                <span className="text-base font-bold text-emerald-600">
                  Rs. {selectedPayment.amount_paid.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800">
                ✓ Confirmed in College General Accounts Ledger
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
