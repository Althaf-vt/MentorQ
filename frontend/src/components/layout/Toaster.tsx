import type React from 'react'
import { Toast, type ToastTone } from '@/design-system'
import { useToastStore } from '@/store/toastStore'

export const Toaster: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full flex justify-end">
          <Toast
            notification={{
              id: t.id,
              tone: t.type as ToastTone,
              title:
                t.title ||
                (t.type === 'error'
                  ? 'Error'
                  : t.type === 'success'
                  ? 'Success'
                  : t.type === 'warning'
                  ? 'Warning'
                  : 'Notice'),
              message: t.message,
              duration: t.duration !== undefined ? t.duration : t.type === 'warning' ? null : 4500,
            }}
            onDismiss={(id) => removeToast(String(id))}
          />
        </div>
      ))}
    </div>
  )
}
