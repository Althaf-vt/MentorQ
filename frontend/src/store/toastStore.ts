import { create } from 'zustand'
import type { ToastState } from '@/types/toast.types'

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  showToast: (message, type, title, duration) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9)

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, title, duration }],
    }))
  },
}))
