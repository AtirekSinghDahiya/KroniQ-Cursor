import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl max-w-sm w-full animate-scale-in overflow-hidden">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg bg-transparent hover:bg-white/10 text-white/90 border border-white/20 transition-all font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-all text-sm shadow-lg ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700 border border-red-500/50'
                : 'bg-blue-600 hover:bg-blue-700 border border-blue-500/50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
