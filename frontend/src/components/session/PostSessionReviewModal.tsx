import React, { useState } from 'react'
import {
  Button,
  Modal,
  Textarea,
  lightTheme,
} from '@/design-system'

export interface PostSessionReviewModalProps {
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
    if (!rating) return
    onSubmit(rating, feedback.trim())
  }

  const roleDisplay =
    endedByRole === 'MENTOR'
      ? 'Mentor'
      : endedByRole === 'STUDENT'
      ? 'Student'
      : endedByRole

  const handleModalClose = (open: boolean) => {
    if (!open && !isForcedEnd && onCancel) {
      onCancel()
    }
  }

  return (
    <div data-mqds={lightTheme}>
      <Modal
        open={true}
        onOpenChange={handleModalClose}
        variant="ticket"
        ticketHeader={{
          leading: '★',
          label: 'SESSION REVIEW & RATING',
        }}
        title={
          isForcedEnd
            ? `Session Concluded${roleDisplay ? ` by ${roleDisplay}` : ''}`
            : 'Rate Your Session'
        }
        description={
          isForcedEnd
            ? 'The session has concluded. Please rate your experience and share feedback before returning to your dashboard.'
            : 'Please rate your mentorship session and share feedback before exiting.'
        }
        className="max-w-md"
      >
        <form className="session-feedback-form" onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          {/* 1–5 Tactile Rating Square Tickets */}
          <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
            <legend
              style={{
                fontSize: '0.88rem',
                fontWeight: 650,
                color: 'var(--mqds-ink)',
                marginBottom: 4,
              }}
            >
              How helpful was this session?
            </legend>
            <div className="session-rating" role="radiogroup" aria-label="Session rating from 1 to 5">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} style={{ position: 'relative', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="session-rating"
                    checked={rating === value}
                    required
                    autoFocus={rating === value}
                    onChange={() => setRating(value)}
                    aria-label={`${value} out of 5 stars`}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', margin: 0 }}
                  />
                  <span aria-hidden="true">{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Feedback Textarea with Character Counter */}
          <div style={{ marginTop: 12 }}>
            <Textarea
              id="session-review-comment"
              label="Feedback comments (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share what went well, concepts covered, or next steps to explore…"
              maxLength={500}
              rows={3}
              hint={`${feedback.length} / 500 characters`}
            />
          </div>

          {/* Actions */}
          <div
            className="session-feedback-actions"
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid #dacbe7',
            }}
          >
            {!isForcedEnd && onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Continue session
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !rating}
              className="flex items-center justify-center gap-1.5"
            >
              <span>
                {isSubmitting
                  ? 'Submitting…'
                  : isForcedEnd
                  ? 'Submit & return to dashboard'
                  : 'Submit & exit'}
              </span>
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
