import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start justify-between p-4 rounded-xl border pointer-events-auto shadow-xl transition-all duration-300 animate-slide-in ${
              t.type === 'success'
                ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 light-theme:bg-white light-theme:text-emerald-800 light-theme:border-emerald-200'
                : t.type === 'error'
                ? 'bg-slate-900 border-rose-500/30 text-rose-400 light-theme:bg-white light-theme:text-rose-800 light-theme:border-rose-200'
                : 'bg-slate-900 border-slate-800 text-indigo-400 light-theme:bg-white light-theme:text-slate-800 light-theme:border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5">
                {t.type === 'success' && <CheckCircle size={18} />}
                {t.type === 'error' && <AlertCircle size={18} />}
                {t.type === 'info' && <Info size={18} />}
              </span>
              <p className="text-sm font-medium pr-2">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-500 hover:text-slate-400 light-theme:text-slate-400 light-theme:hover:text-slate-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
