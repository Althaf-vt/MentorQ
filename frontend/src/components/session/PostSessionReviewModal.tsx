import React, { useState } from 'react'
import { Star, X } from 'lucide-react'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
        {!isForcedEnd && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center pr-6 pl-6">
          <h3 className="text-base font-bold text-slate-900 font-headline">
            {isForcedEnd ? `Session Concluded${roleDisplay ? ` by ${roleDisplay}` : ''}` : 'Rate Your Experience'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isForcedEnd
              ? 'The session has been completed. Please rate your experience and provide feedback before returning to your dashboard.'
              : 'Please rate the session and leave your feedback before exiting'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1 transition-transform active:scale-90 cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
              </button>
            ))}
          </div>

          <div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add any feedback comments..."
              className="w-full p-2.5 border rounded-xl bg-white resize-none text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#5948d3]"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold rounded-full disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting
                ? 'Submitting...'
                : isForcedEnd
                ? 'Submit & Go to Dashboard'
                : 'Submit & Exit'}
            </button>
            {!isForcedEnd && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full disabled:opacity-50 transition-colors cursor-pointer text-[11px]"
              >
                Continue Session
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
