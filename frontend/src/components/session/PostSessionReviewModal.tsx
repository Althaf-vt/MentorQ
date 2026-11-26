import React, { useState } from 'react'
import { Star } from 'lucide-react'
import {
  Button,
  Modal,
  Textarea,
} from '@/design-system'

interface PostSessionReviewModalProps {
  onSubmit: (rating: number, feedbackText: string) => void
  onCancel?: () => void
  isSubmitting: boolean
  isForcedEnd?: boolean
  endedByRole?: string
}

export const PostSessionReviewModal: React.FC<PostSessionReviewModalProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
  isForcedEnd = false,
  endedByRole,
}) => {
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(rating, feedback)
  }

  const roleDisplay = endedByRole === 'MENTOR' ? 'Mentor' : endedByRole === 'STUDENT' ? 'Student' : endedByRole

  const handleModalClose = (open: boolean) => {
    if (!open && !isForcedEnd && onCancel) {
      onCancel()
    }
  }

  return (
    <Modal
      open={true}
      onOpenChange={handleModalClose}
      variant="ticket"
      ticketHeader={{
        leading: '★',
        label: 'SESSION REVIEW & RATING',
      }}
      title={isForcedEnd ? `Session Concluded${roleDisplay ? ` by ${roleDisplay}` : ''}` : 'Rate Your Session'}
      description={
        isForcedEnd
          ? 'The session has concluded. Please rate your experience and provide feedback before returning to your dashboard.'
          : 'Please rate your mentorship session and share feedback before exiting.'
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {/* Rating Stars Selection */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--mqds-muted)] font-semibold">
            Select Rating ({rating} of 5 Stars)
          </span>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer rounded-lg hover:bg-[var(--mqds-hover)]"
                aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    s <= rating
                      ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                      : 'text-[var(--mqds-border-subtle)]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Textarea */}
        <Textarea
          label="Feedback Comments (Optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share what went well, what could be improved, or next steps discussed..."
          rows={3}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[var(--mqds-border-subtle)] justify-end">
          {!isForcedEnd && onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Continue Session
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2"
          >
            <span>
              {isSubmitting
                ? 'Submitting...'
                : isForcedEnd
                ? 'Submit & Go to Dashboard'
                : 'Submit & Exit'}
            </span>
            <span aria-hidden="true">&rarr;</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
