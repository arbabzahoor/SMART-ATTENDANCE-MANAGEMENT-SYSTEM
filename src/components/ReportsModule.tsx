import React, { useState } from 'react';
import { FileText, Download, Printer, Eye, CheckCircle2, AlertCircle, Clock, Award, FileDown, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Department, Program, ClassSection, Subject, Student, AttendanceRecord } from '../types';
import { EmailAlertsModal } from './EmailAlertsModal';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

interface ReportsModuleProps {
  departments: Department[];
  programs: Program[];
  classes: ClassSection[];
  subjects: Subject[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  departments,
  programs,
  classes,
  subjects,
  students,
  attendanceRecords,
}) => {
  const [reportType, setReportType] = useState<string>('CLASS');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [printPreviewMode, setPrintPreviewMode] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // Filter attendance records based on criteria
  let filteredLogs = [...attendanceRecords];

  if (selectedClass) filteredLogs = filteredLogs.filter(a => a.class_id === Number(selectedClass));
  if (selectedSubject) filteredLogs = filteredLogs.filter(a => a.subject_id === Number(selectedSubject));
  if (startDate) filteredLogs = filteredLogs.filter(a => a.date >= startDate);
  if (endDate) filteredLogs = filteredLogs.filter(a => a.date <= endDate);

  if (reportType === 'LOW_ATTENDANCE') {
    filteredLogs = filteredLogs.filter(a => a.status === 'ABSENT');
  }
  const pagination = usePagination<AttendanceRecord>(
    filteredLogs,
    JSON.stringify([selectedClass, selectedSubject, startDate, endDate, reportType])
  );

  // Calculate Summary Statistics
  const totalRecords = filteredLogs.length;
  const presentCount = filteredLogs.filter(a => a.status === 'PRESENT').length;
  const lateCount = filteredLogs.filter(a => a.status === 'LATE').length;
  const absentCount = filteredLogs.filter(a => a.status === 'ABSENT').length;
  const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 100;

  // Selected names for header description
  const classObj = classes.find(c => c.id === Number(selectedClass));
  const subjectObj = subjects.find(s => s.id === Number(selectedSubject));

  const renderReportRow = (log: AttendanceRecord, index: number) => (
    <tr key={`${log.id}-${index}`} className="border border-slate-300 hover:bg-slate-50">
      <td className="p-2 border border-slate-300 text-center font-mono text-[11px]">{index + 1}</td>
      <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{log.roll_number || 'CS-2022-042'}</td>
      <td className="p-2 border border-slate-300 font-semibold text-slate-900">{log.student_name || 'Muhammad Ali Khan'}</td>
      <td className="p-2 border border-slate-300">{log.class_name || 'BSCS - 6A'}</td>
      <td className="p-2 border border-slate-300">{log.subject_name || (log.method === 'CAMERA_CHECK_IN' ? 'College Attendance' : '—')}</td>
      <td className="p-2 border border-slate-300 font-mono text-[11px]">{log.date} {log.time || ''}</td>
      <td className="p-2 border border-slate-300 text-center">
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
          log.status === 'PRESENT'
            ? 'bg-emerald-100 text-emerald-800'
            : log.status === 'LATE'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-rose-100 text-rose-800'
        }`}>
          {log.status}
        </span>
      </td>
      <td className="p-2 border border-slate-300 text-slate-600 text-[11px]">{log.remarks || '-'}</td>
    </tr>
  );

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = ['Record ID', 'Roll Number', 'Student Name', 'Class', 'Subject', 'Date', 'Time', 'Status', 'Remarks'];
    const rows = filteredLogs.map(a => [
      a.id,
      a.roll_number || 'N/A',
      a.student_name || 'N/A',
      a.class_name || 'BSCS-6A',
      a.subject_name || (a.method === 'CAMERA_CHECK_IN' ? 'College Attendance' : '—'),
      a.date,
      a.time,
      a.status,
      `"${a.remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF Document
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Document Header Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ALPINE DEGREE COLLEGE KHANPUR, PAKISTAN', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Official Academic Attendance Audit Report', 14, 21);

    // Filter Parameters Box
    doc.setFontSize(8);
    doc.text(`Category: ${reportType}  |  Class: ${classObj ? classObj.name : 'All Classes'}  |  Subject: ${subjectObj ? subjectObj.name : 'All Subjects'}`, 14, 27);
    doc.text(`Period: ${startDate} to ${endDate}  |  Generated: ${new Date().toLocaleDateString('en-PK')}  |  Rate: ${attendanceRate}%`, 14, 32);

    // Table Data Formatting
    const tableHead = [['#', 'Roll Number', 'Student Name', 'Class Section', 'Subject Module', 'Date & Time', 'Status', 'Remarks']];
    const tableData = filteredLogs.map((log, index) => [
      (index + 1).toString(),
      log.roll_number || 'CS-2022-042',
      log.student_name || 'Muhammad Ali Khan',
      log.class_name || 'BSCS - 6A',
      log.subject_name || (log.method === 'CAMERA_CHECK_IN' ? 'College Attendance' : '—'),
      `${log.date} ${log.time || ''}`,
      log.status,
      log.remarks || '-',
    ]);

    autoTable(doc, {
      startY: 36,
      head: tableHead,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        6: { halign: 'center', fontStyle: 'bold' },
      },
    });

    // Verification Signatures
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 25 : 220;
    if (finalY < 270) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('_______________________', 20, finalY);
      doc.text('Prepared By Clerk', 20, finalY + 5);

      doc.text('_______________________', 85, finalY);
      doc.text('Head of Department', 85, finalY + 5);

      doc.text('_______________________', 150, finalY);
      doc.text('Principal Signature & Stamp', 150, finalY + 5);
    }

    doc.save(`Attendance_Report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrint = () => {
    // If inside an iframe, attempt opening a print window with isolated layout
    const isIframe = window.self !== window.top;
    const printReportEl = document.querySelector('.printable-report');

    if (isIframe && printReportEl) {
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Attendance Audit Sheet - Alpine Degree College Khanpur</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @media print {
                    body { background: white !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    .print-signature-block { display: flex !important; }
                  }
                  body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
                  .printable-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
                  .printable-table th, .printable-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                  .printable-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; }
                  .print-signature-block { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 11px; }
                </style>
              </head>
              <body>
                <div style="max-width: 900px; margin: 0 auto;">
                  ${printReportEl.outerHTML}
                </div>
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                    }, 300);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          return;
        }
      } catch (e) {
        console.warn('Popup print blocked or failed, falling back to window.print()', e);
      }
    }

    // Direct browser print fallback
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls (Hidden during physical paper print) */}
      <div className="no-print bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-zinc-800 dark:text-zinc-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Institutional Reports & Analytics Generator
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Generate, preview, export, and print hard-copy attendance audit sheets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPrintPreviewMode(!printPreviewMode)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              printPreviewMode 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' 
                : 'bg-zinc-100 dark:bg-[#202023] hover:bg-zinc-200 dark:hover:bg-[#27272a] text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            {printPreviewMode ? 'Standard UI View' : 'Print Layout Preview'}
          </button>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Email Outbox Logs
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter Controls (Hidden during physical paper print) */}
      <div className="no-print bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-5 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs text-zinc-700 dark:text-zinc-300">
        
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Report Category</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="CLASS">Class Attendance Audit</option>
            <option value="SUBJECT">Subject Course Report</option>
            <option value="STUDENT">Individual Student Log</option>
            <option value="DATE_RANGE">Date Period Summary</option>
            <option value="LOW_ATTENDANCE">Absence & Low Attendance Sheet</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Class Section</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject Module</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      {/* Printable Hard-Copy Report Document */}
      <div className={`printable-report bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-slate-900 ${
        printPreviewMode ? 'ring-2 ring-indigo-500 max-w-4xl mx-auto' : ''
      }`}>
        
        {/* Institutional Letterhead Banner */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Award className="w-8 h-8 text-indigo-800" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                Alpine Degree College Khanpur, Pakistan
              </h1>
              <p className="text-xs text-slate-600 font-medium">Affiliated with The Islamia University of Bahawalpur</p>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-indigo-900 mt-2 bg-slate-100 py-1 px-4 inline-block rounded">
            Official Academic Attendance Report & Audit Sheet
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left text-[11px] text-slate-700 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div><span className="font-bold text-slate-900">Report Category:</span> {reportType}</div>
            <div><span className="font-bold text-slate-900">Target Class:</span> {classObj ? classObj.name : 'All Classes'}</div>
            <div><span className="font-bold text-slate-900">Subject:</span> {subjectObj ? subjectObj.name : 'All Subjects'}</div>
            <div><span className="font-bold text-slate-900">Period:</span> {startDate} to {endDate}</div>
            <div><span className="font-bold text-slate-900">Generated Date:</span> {new Date().toLocaleDateString('en-PK')}</div>
            <div><span className="font-bold text-slate-900">Total Records:</span> {totalRecords}</div>
            <div><span className="font-bold text-slate-900">Present Count:</span> {presentCount}</div>
            <div><span className="font-bold text-slate-900">Attendance Rate:</span> {attendanceRate}%</div>
          </div>
        </div>

        {/* Attendance Records Table formatted for Print */}
        <div className="overflow-x-auto print:hidden">
          <table className="printable-table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border border-slate-300">
                <th className="p-2 border border-slate-300 w-10 text-center">#</th>
                <th className="p-2 border border-slate-300">Roll Number</th>
                <th className="p-2 border border-slate-300">Student Name</th>
                <th className="p-2 border border-slate-300">Class Section</th>
                <th className="p-2 border border-slate-300">Subject Module</th>
                <th className="p-2 border border-slate-300">Date & Time</th>
                <th className="p-2 border border-slate-300 text-center">Status</th>
                <th className="p-2 border border-slate-300">Faculty Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-medium border border-slate-300">
                    No attendance logs match the current filter selection.
                  </td>
                </tr>
              ) : (
                pagination.items.map((log, index) =>
                  renderReportRow(log, pagination.startRecord - 1 + index)
                )
              )}
            </tbody>
          </table>
        </div>
        <div className="hidden print:block">
          <table className="printable-table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border border-slate-300">
                <th className="p-2 border border-slate-300 w-10 text-center">#</th>
                <th className="p-2 border border-slate-300">Roll Number</th>
                <th className="p-2 border border-slate-300">Student Name</th>
                <th className="p-2 border border-slate-300">Class Section</th>
                <th className="p-2 border border-slate-300">Subject Module</th>
                <th className="p-2 border border-slate-300">Date & Time</th>
                <th className="p-2 border border-slate-300 text-center">Status</th>
                <th className="p-2 border border-slate-300">Faculty Remarks</th>
              </tr>
            </thead>
            <tbody>{filteredLogs.map(renderReportRow)}</tbody>
          </table>
        </div>
        <div className="print:hidden">
          <PaginationControls pagination={pagination} label="attendance records" />
        </div>

        {/* Statistical Footer Summary */}
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Present Rate</span>
            <span className="text-base font-extrabold text-emerald-700">{presentCount} Records ({attendanceRate}%)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Late Registrations</span>
            <span className="text-base font-extrabold text-amber-700">{lateCount} Records</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Absences Marked</span>
            <span className="text-base font-extrabold text-rose-700">{absentCount} Records</span>
          </div>
        </div>

        {/* Official Signature & Verification Block for Hard Copy */}
        <div className="print-signature-block hidden print:flex mt-12 pt-8 border-t border-slate-300 justify-between text-xs text-slate-800">
          <div className="text-center w-1/3 px-2">
            <div className="h-10 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-900">Prepared By</p>
            <p className="text-[10px] text-slate-500">Data & Attendance Clerk</p>
          </div>
          <div className="text-center w-1/3 px-2">
            <div className="h-10 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-900">Head of Department</p>
            <p className="text-[10px] text-slate-500">Faculty Incharge Verification</p>
          </div>
          <div className="text-center w-1/3 px-2">
            <div className="h-10 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-900">Principal Signature & Stamp</p>
            <p className="text-[10px] text-slate-500">Alpine Degree College Khanpur</p>
          </div>
        </div>

      </div>

      <EmailAlertsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        students={students}
      />

    </div>
  );
};
