import React, { useState } from 'react'
import { AlertCircle, Clock, Tag, Check, Send } from 'lucide-react'
import { useCreateTicketMutation } from '@/store/api/ticketApi'
import { useToastStore } from '@/store/toastStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Modal,
  Input,
  Textarea,
  Button,
} from '@/design-system'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CATS = ['React', 'System Design', 'Database', 'API Design', 'DevOps', 'Frontend', 'Backend']

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
      ticketHeader={{
        leading: 'MQ',
        label: 'MENTORQ TICKET',
      }}
      title="Request Mentorship"
      description="Submit your problem to enter the live queue"
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {globalError && (
          <div className="p-3 bg-[var(--mqds-warning-surface,#fff5f5)] border border-[var(--mqds-danger-border,#f5c6cb)] rounded-xl text-[var(--mqds-danger,#a8364b)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <Input
          label="Topic"
          placeholder="e.g. Debugging React useEffect infinite loop"
          {...register('topic')}
          error={errors.topic?.message}
        />

        <Textarea
          label="Problem Description"
          placeholder="Describe your issue, what you've tried so far, and code snippets if relevant..."
          rows={3}
          {...register('description')}
          error={errors.description?.message}
        />

        <div>
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--mqds-primary)]" />
                <span>Duration (Minutes)</span>
              </span>
            }
            type="number"
            min={5}
            step={1}
            {...register('requested_minutes', { valueAsNumber: true })}
            error={errors.requested_minutes?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mqds-text)] mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[var(--mqds-primary)]" />
            <span>Tags (Select 1-5)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => {
              const isSelected = selectedTags?.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleTag(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                      : 'bg-[var(--mqds-border-subtle)] text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)]'
                  }`}
                >
                  <span>{c}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              )
            })}
          </div>
          {errors.tags && (
            <p className="text-[var(--mqds-danger)] text-xs mt-1.5 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.tags.message}</span>
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--mqds-border-subtle)] flex justify-end items-center gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <span>{isLoading ? 'Submitting...' : 'Submit Ticket'}</span>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Modal>
  )
}
