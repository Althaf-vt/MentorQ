import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { socketService } from '@/services/socket.service'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  // Hook into WebSocket status events
  useEffect(() => {
    const handleConnect = () => {
      showToast('Live system connected', 'success')
    }

    const handleDisconnect = () => {
      showToast('Live system disconnected. Attempting to reconnect...', 'error')
    }

    const handleConnectError = () => {
      showToast('Live system connection error', 'error')
    }

    // Since socketService might connect after or before, we listen to events
    const socket = socketService.getSocket()
    if (socket) {
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('connect_error', handleConnectError)
    }

    // Regularly check if we can attach listeners if socket is created late
    const interval = setInterval(() => {
      const activeSocket = socketService.getSocket()
      if (activeSocket) {
        // Remove to avoid duplicate listeners
        activeSocket.off('connect', handleConnect)
        activeSocket.off('disconnect', handleDisconnect)
        activeSocket.off('connect_error', handleConnectError)

        // Attach
        activeSocket.on('connect', handleConnect)
        activeSocket.on('disconnect', handleDisconnect)
        activeSocket.on('connect_error', handleConnectError)
        clearInterval(interval)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      const activeSocket = socketService.getSocket()
      if (activeSocket) {
        activeSocket.off('connect', handleConnect)
        activeSocket.off('disconnect', handleDisconnect)
        activeSocket.off('connect_error', handleConnectError)
      }
    }
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
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
    </ToastContext.Provider>
  )
}
