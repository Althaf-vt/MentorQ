export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  title?: string
  duration?: number | null
}

export interface ToastState {
  toasts: Toast[]
  showToast: (message: string, type: ToastType, title?: string, duration?: number | null) => void
  removeToast: (id: string) => void
}
