import type React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

export const Toaster: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <>
      {/* Toast Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-indigo-50 border-[#5948d3] text-slate-900 shadow-[#5948d3]/20'
          let Icon = Info
          let iconColor = 'text-[#5948d3]'

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-emerald-500/20'
            Icon = CheckCircle2
            iconColor = 'text-emerald-500'
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-50 border-rose-500 text-slate-900 shadow-rose-500/20'
            Icon = AlertCircle
            iconColor = 'text-rose-500'
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 transform translate-y-0 ${bgClass}`}
              style={{ animation: 'slideIn 0.2s ease-out' }}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-xs font-semibold font-body leading-relaxed">
                {toast.message}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-900 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
