import { create } from 'zustand'
import type { ToastState } from '@/types/toast.types'

const TOAST_DURATION_MS = 4000
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  removeToast: (id) => {
    const existingTimer = toastTimers.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      toastTimers.delete(id)
    }

    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  showToast: (message, type) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9)

    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))

    const timer = setTimeout(() => {
      toastTimers.delete(id)
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, TOAST_DURATION_MS)

    toastTimers.set(id, timer)
  },
}))
