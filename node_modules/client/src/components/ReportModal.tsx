import React, { useState } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { X, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment';
  targetId: string;
}

const REPORT_REASONS = [
  'Harassment or personal bullying',
  'Hate speech or discrimination',
  'Sharing personal private information (Doxing)',
  'Spam, advertising, or scamming link',
  'Academic dishonesty (cheating, exam leak)',
  'Violates campus safety policies',
  'Other (Please describe below)',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  targetId,
}) => {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const finalReason =
      selectedReason.includes('Other') && customReason.trim()
        ? `Other: ${customReason.trim()}`
        : selectedReason;

    try {
      const res = await api.post('/admin/reports', {
        contentType,
        targetId,
        reason: finalReason,
      });

      if (res.success) {
        toast('Violation reported. Moderators will audit this content.', 'success');
        onClose();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Backdrop overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md bg-[#0e1322] light-theme:bg-white border border-slate-800 light-theme:border-slate-200 rounded-2xl shadow-2xl p-6 z-10 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-850 light-theme:border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-bold text-slate-100 light-theme:text-slate-800">
              Report Content
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-450 hover:text-slate-200 light-theme:text-slate-400 light-theme:hover:text-slate-650 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Violation Reason
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'bg-brand-600/10 border-brand-500/40 text-brand-400'
                      : 'bg-slate-900/50 light-theme:bg-slate-50 border-slate-850 light-theme:border-slate-200 text-slate-300 light-theme:text-slate-655 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-brand-500 shrink-0"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Description Textarea */}
          {selectedReason.includes('Other') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Explain Details (Required)
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Briefly describe the violation..."
                required
                rows={3}
                className="input-field text-sm resize-none"
              ></textarea>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-850 light-theme:border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-800 light-theme:border-slate-200 text-slate-350 light-theme:text-slate-600 rounded-xl hover:bg-slate-900 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
export default ReportModal;
