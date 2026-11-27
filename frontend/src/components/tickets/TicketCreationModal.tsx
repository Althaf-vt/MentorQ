import React, { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { useCreateTicketMutation } from '@/store/api/ticketApi'
import { useToastStore } from '@/store/toastStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Modal,
  Button,
  Select,
} from '@/design-system'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CATS = ['React', 'System Design', 'Database', 'API Design', 'DevOps', 'Frontend', 'Backend']
const DURATIONS = [5, 10, 15, 20, 30, 45, 60]

const ticketSchema = z.object({
  topic: z.string()
    .min(5, 'Topic must be at least 5 characters.')
    .max(100, 'Topic must be less than 100 characters.')
    .regex(/^[a-zA-Z].{2,}/, 'Topic must contain meaningful alphanumeric text.'),
  description: z.string()
    .min(15, 'Description must be at least 15 characters.')
    .max(1000, 'Description must be less than 1000 characters.')
    .regex(/[a-zA-Z]{3,}/, 'Description must be coherent prose.'),
  requested_minutes: z.number().min(5, 'Duration must be at least 5 minutes.'),
  tags: z.array(z.string().min(2).max(20).regex(/^[a-zA-Z0-9]+$/))
    .min(1, 'Please select at least 1 tag.')
    .max(5, 'You can select up to 5 tags.')
})

type TicketFormValues = z.infer<typeof ticketSchema>

export const TicketCreationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const showToast = useToastStore((state) => state.showToast)
  const [createTicket, { isLoading }] = useCreateTicketMutation()
  const [globalError, setGlobalError] = useState('')

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      topic: '',
      description: '',
      requested_minutes: 15,
      tags: ['React']
    }
  })

  const selectedTags = watch('tags')

  const toggleTag = (t: string) => {
    const current = selectedTags || []
    if (current.includes(t)) {
      setValue('tags', current.filter(x => x !== t), { shouldValidate: true })
    } else {
      if (current.length < 5) {
        setValue('tags', [...current, t], { shouldValidate: true })
      }
    }
  }

  const onSubmit = async (data: TicketFormValues) => {
    setGlobalError('')
    try {
      await createTicket(data).unwrap()
      showToast('Mentorship request submitted successfully!', 'success')
      reset()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: unknown) {
      const error = err as { data?: { message?: string | string[] } }
      const errMsg = error?.data?.message || 'Failed to submit ticket.'
      setGlobalError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg)
      showToast('Validation failed. Please check your inputs.', 'error')
    }
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleModalClose}
      variant="ticket"
      className="session-request-dialog"
      ticketHeader={{
        leading: '→',
        label: 'SESSION REQUEST',
      }}
      title="Request a session"
      description="Describe your problem and enter the live mentorship queue."
    >
      {/* Global error banner uses valid design-system tokens */}
      {globalError && (
        <div
          className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
          style={{
            background: 'var(--mqds-warning-surface)',
            color: 'var(--mqds-danger)',
            border: '1px solid var(--mqds-danger-border)',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* .mqds-session-request-form 2-col grid (session-request-form.css) */}
      <form className="mqds-session-request-form" onSubmit={handleSubmit(onSubmit)}>

        {/* Topic — full-width via CSS: label:has(input[name="topic"]) { grid-column: 1 / -1 } */}
        <label>
          Topic
          <input
            {...register('topic')}
            placeholder="What are you working on?"
            autoFocus
          />
          {errors.topic && (
            <span
              className="flex items-center gap-1 text-xs font-mono"
              style={{ color: 'var(--mqds-danger)' }}
            >
              <AlertCircle className="w-3 h-3" /> {errors.topic.message}
            </span>
          )}
        </label>

        {/* Description — explicit full-width since no matching label selector */}
        <label style={{ gridColumn: '1 / -1' }}>
          Describe your problem
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe your issue, what you've tried, and any relevant code snippets…"
            style={{
              width: '100%',
              minHeight: 80,
              padding: '9px 11px',
              borderRadius: 7,
              border: '1px solid #aa95ad',
              background: '#f1e8f6',
              color: '#251644',
              fontSize: 16,
              fontFamily: 'var(--mqds-font, Inter)',
              resize: 'vertical',
              boxSizing: 'border-box',
              transition: 'border-color .18s ease',
            }}
          />
          {errors.description && (
            <span
              className="flex items-center gap-1 text-xs font-mono"
              style={{ color: 'var(--mqds-danger)' }}
            >
              <AlertCircle className="w-3 h-3" /> {errors.description.message}
            </span>
          )}
        </label>

        {/* Duration — full-width to avoid blank right column */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Select
            label="Duration"
            {...register('requested_minutes', { valueAsNumber: true })}
            error={errors.requested_minutes?.message}
          >
            {DURATIONS.map(m => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </Select>
        </div>

        {/* Tags */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#463450' }}
          >
            Tags{' '}
            <span className="font-normal normal-case" style={{ color: '#7c6680' }}>
              (select 1–5)
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => {
              const isSelected = selectedTags?.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleTag(c)}
                  className="flex items-center gap-1.5 cursor-pointer transition-colors"
                  style={{
                    padding: '5px 11px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    border: isSelected ? 'none' : '1px solid #aa95ad',
                    background: isSelected ? '#302153' : '#f1e8f6',
                    color: isSelected ? '#fff9ef' : '#463450',
                  }}
                >
                  <span>{c}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              )
            })}
          </div>
          {errors.tags && (
            <span
              className="flex items-center gap-1 text-xs font-mono"
              style={{ color: 'var(--mqds-danger)' }}
            >
              <AlertCircle className="w-3 h-3" /> {errors.tags.message}
            </span>
          )}
        </div>

        {/* Submit — .submit-request + .cta hooks into session-request-form.css: grid-column: 1 / -1 */}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="submit-request cta"
        >
          <span>{isLoading ? 'Submitting…' : 'Send request'}</span>
          <span aria-hidden="true">{isLoading ? '…' : '→'}</span>
        </Button>
      </form>
    </Modal>
  )
}
