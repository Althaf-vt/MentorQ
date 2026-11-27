export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface ToastState {
  toasts: Toast[]
  showToast: (message: string, type: ToastType) => void
  removeToast: (id: string) => void
}
