import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Link,
  Unlink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  Trash2,
  GraduationCap,
  ShieldCheck,
  Edit,
  Check,
  X
} from 'lucide-react';
import { Student } from '../types';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

interface ParentRecord {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number?: string;
  cnic?: string;
  occupation?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  children_count: number;
  children: {
    relationship_id: number;
    student_id: number;
    relationship: string;
    is_primary: boolean;
    full_name: string;
    roll_number: string;
    class_name: string;
    avatar?: string;
  }[];
}

interface ParentManagementProps {
  students: Student[];
}

export const ParentManagement: React.FC<ParentManagementProps> = ({ students }) => {
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedParentForLink, setSelectedParentForLink] = useState<ParentRecord | null>(null);
  const [selectedParentForWhatsapp, setSelectedParentForWhatsapp] = useState<ParentRecord | null>(null);
  const [editingWhatsapp, setEditingWhatsapp] = useState('');

  // New Parent Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [newCnic, setNewCnic] = useState('');
  const [newOccupation, setNewOccupation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [initialStudentId, setInitialStudentId] = useState<number | ''>('');
  const [initialRelationship, setInitialRelationship] = useState('Father');

  // Link Student Form
  const [linkStudentId, setLinkStudentId] = useState<number | ''>('');
  const [linkRelationship, setLinkRelationship] = useState('Father');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parents');
      if (res.ok) {
        const data = await res.json();
        setParents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const whatsappToSend = sameAsPhone ? newPhone : newWhatsapp;
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newName,
          email: newEmail,
          password: newPassword,
          phone: newPhone,
          whatsapp_number: whatsappToSend || undefined,
          cnic: newCnic,
          occupation: newOccupation,
          address: newAddress,
          student_id: initialStudentId ? Number(initialStudentId) : undefined,
          relationship: initialRelationship
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register parent account.');
      }

      setFeedback({ type: 'success', text: `Parent account created successfully for ${newName}!` });
      setIsAddModalOpen(false);
      // Reset
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewWhatsapp('');
      setSameAsPhone(false);
      setNewCnic('');
      setNewOccupation('');
      setNewAddress('');
      setInitialStudentId('');
      fetchParents();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error creating parent.' });
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentForWhatsapp) return;
    setFeedback(null);

    try {
      const res = await fetch(`/api/parents/${selectedParentForWhatsapp.id}/whatsapp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: editingWhatsapp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update WhatsApp number.');

      setFeedback({ type: 'success', text: `WhatsApp number updated for ${selectedParentForWhatsapp.full_name}.` });
      setIsWhatsappModalOpen(false);
      fetchParents();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating WhatsApp number.' });
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentForLink || !linkStudentId) return;

    try {
      const res = await fetch('/api/parents/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: selectedParentForLink.id,
          student_id: Number(linkStudentId),
          relationship: linkRelationship,
          is_primary: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to link student.');
      }

      setFeedback({ type: 'success', text: data.message });
      setIsLinkModalOpen(false);
      setLinkStudentId('');
      fetchParents();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error linking student.' });
    }
  };

  const handleUnlink = async (parentId: number, studentId: number) => {
    if (!window.confirm('Are you sure you want to unlink this student from the parent account?')) return;

    try {
      const res = await fetch('/api/parents/unlink-student', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, student_id: studentId })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: data.message });
        fetchParents();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to unlink.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Server error while unlinking student.' });
    }
  };

  const filtered = parents.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.children.some(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const pagination = usePagination<ParentRecord>(filtered, searchQuery);

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#292524] tracking-tight">Parent & Guardian Management</h1>
          <p className="text-xs text-[#78716C]">
            Manage authorized guardian accounts, multi-child relations, and access authorizations
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3F8F72] hover:bg-[#347A60] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Parent</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#EAF5F0] border-[#3F8F72]/30 text-[#1B4332]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#3F8F72]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#78716C] hover:text-[#292524] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-[#78716C]" />
        <input
          type="text"
          placeholder="Search parents by name, email, phone, or child roll number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent text-[#292524] placeholder-[#A8A29E] focus:outline-none"
        />
      </div>

      {/* Parents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pagination.items.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-[#E7E5E4] bg-white p-8 text-center text-sm text-[#78716C]">
            No matching parent accounts found.
          </div>
        ) : pagination.items.map(parent => (
          <div key={parent.id} className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold text-sm">
                  {parent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292524]">{parent.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#78716C] mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#A8A29E]" />
                    <span>{parent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#78716C]">
                    <Phone className="w-3.5 h-3.5 text-[#A8A29E]" />
                    <span>{parent.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    {parent.whatsapp_number ? (
                      <span className="text-[#166534] font-medium">{parent.whatsapp_number}</span>
                    ) : (
                      <span className="text-[#D97706] italic text-[11px]">WhatsApp not set — click Edit to add</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setSelectedParentForLink(parent);
                    setIsLinkModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#292524] text-xs font-semibold border border-[#E7E5E4] transition-all cursor-pointer"
                >
                  <Link className="w-3.5 h-3.5 text-[#3F8F72]" />
                  <span>Link Child</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedParentForWhatsapp(parent);
                    setEditingWhatsapp(parent.whatsapp_number || '');
                    setIsWhatsappModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0FFF4] hover:bg-[#DCFCE7] text-[#166534] text-xs font-semibold border border-[#BBF7D0] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{parent.whatsapp_number ? 'Edit WhatsApp' : 'Add WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Linked Children List */}
            <div className="pt-3 border-t border-[#E7E5E4] space-y-2">
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                Linked Children ({parent.children.length}):
              </span>
              {parent.children.length > 0 ? (
                <div className="space-y-1.5">
                  {parent.children.map(child => (
                    <div
                      key={child.relationship_id}
                      className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#292524]">{child.full_name}</span>
                        <span className="text-[#78716C] text-[11px] font-mono ml-2">({child.roll_number})</span>
                        <span className="text-[#A8A29E] text-[10px] ml-2">• {child.class_name} ({child.relationship})</span>
                      </div>
                      <button
                        onClick={() => handleUnlink(parent.id, child.student_id)}
                        title="Unlink student"
                        className="text-[#D95C5C] hover:text-[#991B1B] p-1 rounded hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A8A29E] italic">No students linked to this account yet.</p>
              )}
            </div>

          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
        <PaginationControls pagination={pagination} label="parents" />
      </div>

      {/* Modal: Register Parent Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E7E5E4] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
              <h3 className="text-sm font-bold text-[#292524]">Register New Parent Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#78716C] hover:text-[#292524] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Tariq Khan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#78716C] block mb-1">Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#78716C] block mb-1">Temporary Account Password:</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                  />
                  <p className="text-[10px] text-[#A8A29E] mt-1">Share it securely with the parent; they can change it after signing in.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#78716C] block mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={newPhone}
                    onChange={e => {
                      setNewPhone(e.target.value);
                      if (sameAsPhone) setNewWhatsapp(e.target.value);
                    }}
                    className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#78716C] flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    WhatsApp Number (for fee vouchers & notifications):
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-[#78716C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={e => {
                        setSameAsPhone(e.target.checked);
                        if (e.target.checked) setNewWhatsapp(newPhone);
                        else setNewWhatsapp('');
                      }}
                      className="w-3 h-3 cursor-pointer"
                    />
                    Same as phone number
                  </label>
                </div>
                <input
                  type="tel"
                  placeholder="+92 300 1234567 (e.g. 03001234567 or +923001234567)"
                  value={sameAsPhone ? newPhone : newWhatsapp}
                  disabled={sameAsPhone}
                  onChange={e => setNewWhatsapp(e.target.value)}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#25D366] disabled:opacity-60"
                />
                <p className="text-[10px] text-[#A8A29E] mt-1">
                  Supports Pakistan (+92) format. Used for fee voucher sharing via WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#78716C] block mb-1">CNIC (Optional):</label>
                  <input
                    type="text"
                    placeholder="31201-XXXXXXX-X"
                    value={newCnic}
                    onChange={e => setNewCnic(e.target.value)}
                    className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#78716C] block mb-1">Occupation:</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineer / Doctor"
                    value={newOccupation}
                    onChange={e => setNewOccupation(e.target.value)}
                    className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">Initial Child to Link:</label>
                <select
                  value={initialStudentId}
                  onChange={e => setInitialStudentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                >
                  <option value="">-- Optional: Link student now --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.roll_number}) - Class {s.class_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F5F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3F8F72] hover:bg-[#347A60] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Parent Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Link Student to Parent */}
      {isLinkModalOpen && selectedParentForLink && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E7E5E4] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
              <h3 className="text-sm font-bold text-[#292524]">
                Link Child to {selectedParentForLink.full_name}
              </h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-[#78716C] hover:text-[#292524] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkStudent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">Select Student:</label>
                <select
                  required
                  value={linkStudentId}
                  onChange={e => setLinkStudentId(Number(e.target.value))}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                >
                  <option value="">-- Choose student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.roll_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">Relationship:</label>
                <select
                  value={linkRelationship}
                  onChange={e => setLinkRelationship(e.target.value)}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#3F8F72]"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Brother">Brother</option>
                  <option value="Uncle">Uncle</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F5F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3F8F72] hover:bg-[#347A60] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Confirm Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update WhatsApp Number */}
      {isWhatsappModalOpen && selectedParentForWhatsapp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E7E5E4] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <h3 className="text-sm font-bold text-[#292524]">
                  {selectedParentForWhatsapp.whatsapp_number ? 'Update' : 'Add'} WhatsApp Number
                </h3>
              </div>
              <button onClick={() => setIsWhatsappModalOpen(false)} className="text-[#78716C] hover:text-[#292524] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#78716C]">
              Guardian: <strong>{selectedParentForWhatsapp.full_name}</strong>
              <br />This number will be used to send fee vouchers and notifications via WhatsApp.
            </p>

            <form onSubmit={handleUpdateWhatsapp} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">
                  WhatsApp Number (Pakistan +92 format):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 03001234567 or +923001234567"
                  value={editingWhatsapp}
                  onChange={e => setEditingWhatsapp(e.target.value)}
                  className="w-full text-xs bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl px-3 py-2 text-[#292524] focus:outline-none focus:border-[#25D366]"
                />
                <p className="text-[10px] text-[#A8A29E] mt-1">
                  Formats supported: 03001234567 · +923001234567 · 923001234567
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsWhatsappModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#78716C] hover:bg-[#F5F5F4] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Save WhatsApp Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
