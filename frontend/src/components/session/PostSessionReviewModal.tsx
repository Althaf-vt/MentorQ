import React, { useState } from 'react'
import { Star } from 'lucide-react'

interface PostSessionReviewModalProps {
  onSubmit: (rating: number, feedbackText: string) => void
  isSubmitting: boolean
}

export const PostSessionReviewModal: React.FC<PostSessionReviewModalProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(rating, feedback)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900 font-headline">Rate Your Experience</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Please rate the session and leave your feedback</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1 transition-transform active:scale-90"
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
              className="w-full p-2 border rounded-xl bg-white resize-none text-slate-700"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold rounded-full disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Exit'}
          </button>
        </form>
      </div>
    </div>
  )
}
