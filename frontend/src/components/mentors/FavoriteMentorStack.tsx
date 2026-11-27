import React, { useState, useRef, useMemo } from 'react'
import { Button, EmptyState, Modal, darkTheme, cardTiltHandlers } from '@/design-system'
import { getMentorPrintTheme } from '@/components/preview/MentorPrints'

const TILTS = [-12, 7, -4, -8, 11, -9, 6, -5, 10, -7]

export interface FavoriteMentorItem {
  id?: string
  _id?: string
  fullName?: string
  full_name?: string
  email?: string
  avatarUrl?: string
  avatar_url?: string
  mentorProfile?: {
    expertise_tags?: string[]
    rating_avg?: number
  }
}

export interface FavoriteMentorStackProps {
  favorites: FavoriteMentorItem[]
  onRemove: (mentorId: string) => Promise<void> | void
  onRequest?: (mentorId: string) => void
  onBrowse?: () => void
  isRemoving?: boolean
  className?: string
}

export const FavoriteMentorStack: React.FC<FavoriteMentorStackProps> = ({
  favorites,
  onRemove,
  onRequest,
  onBrowse,
  isRemoving = false,
  className = '',
}) => {
  const stackRef = useRef<HTMLDivElement | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pointedId, setPointedId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<FavoriteMentorItem | null>(null)

  // Map favorites to deterministic theme specs
  const saved = useMemo(() => {
    return favorites.map((mentor, index) => {
      const id = mentor.id || mentor._id || `mentor-${index}`
      const name = mentor.fullName || mentor.full_name || mentor.email || 'Mentor'
      const topic = mentor.mentorProfile?.expertise_tags?.[0] || 'General Guidance'
      const theme = getMentorPrintTheme(id)
      return {
        id,
        name,
        topic,
        mentor,
        index,
        paper: theme.paper,
        ink: theme.ink,
        printUrl: theme.printUrl,
      }
    })
  }, [favorites])

  const validSelectedId = selectedId && saved.some((item) => item.id === selectedId) ? selectedId : null
  const activeId = focusedId ?? pointedId ?? validSelectedId
  const activeSlot = saved.findIndex((item) => item.id === activeId)
  const currentItem = saved.find((item) => item.id === validSelectedId)

  const handleConfirmRemoval = async () => {
    if (!pendingRemoval) return
    const targetId = pendingRemoval.id || pendingRemoval._id
    if (targetId) {
      if (selectedId === targetId) setSelectedId(null)
      if (pointedId === targetId) setPointedId(null)
      if (focusedId === targetId) setFocusedId(null)
      await onRemove(targetId)
    }
    setPendingRemoval(null)
  }

  return (
    <div
      className={`favorites-container ${className}`}
      data-mqds={darkTheme}
      style={{
        background: 'var(--mqds-navy)',
        border: '1px solid #c8aff74d',
        borderRadius: 20,
        color: '#f4f7f2',
      }}
    >
      <div className="favorites-content">
        <div className="favorites-header">
          <h2 id="favorites-title">Favorite mentors</h2>
          <span style={{ fontSize: '0.85rem', color: '#cbc6df', fontVariantNumeric: 'tabular-nums' }}>
            {saved.length} saved
          </span>
        </div>

        {saved.length > 0 ? (
          <>
            <div
              className="favorite-stack"
              ref={stackRef}
              aria-label="Saved mentor cards"
              role="group"
              onPointerMove={(event) => {
                if (event.pointerType !== 'mouse' || event.buttons || (event.target as HTMLElement).closest('.favorite-card-remove')) return
                const card = (event.target as HTMLElement).closest('[data-favorite-mentor]') as HTMLElement | null
                if (card && card.dataset.favoriteMentor) {
                  setPointedId(card.dataset.favoriteMentor)
                }
              }}
              onPointerLeave={() => setPointedId(null)}
            >
              {saved.map((item, slot) => {
                const isActive = activeId === item.id
                const tilt = TILTS[slot % TILTS.length] + 'deg'
                const slotOffset = slot - (saved.length - 1) / 2
                const pushDirection = activeSlot < 0 ? 0 : Math.sign(slot - activeSlot)

                return (
                  <div
                    key={item.id}
                    className="favorite-card"
                    {...cardTiltHandlers}
                    data-favorite-mentor={item.id}
                    data-active={isActive}
                    onPointerMove={(event) => {
                      if (!event.buttons && !(event.target as HTMLElement).closest('.favorite-card-remove')) {
                        cardTiltHandlers.onPointerMove(event)
                      }
                    }}
                    style={
                      {
                        '--slot': slotOffset,
                        '--push': pushDirection,
                        '--tilt': tilt,
                        '--entry': slot,
                        '--paper-color': item.paper,
                        '--ink-color': item.ink,
                        zIndex: isActive ? saved.length + 1 : slot + 1,
                      } as React.CSSProperties
                    }
                    onFocus={(event) => {
                      if (event.target.matches(':focus-visible')) setFocusedId(item.id)
                    }}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocusedId(null)
                    }}
                  >
                    <div className="mqds-tilt-surface favorite-card-tilt">
                      <div className="favorite-card-entry">
                        <button
                          className="favorite-card-face"
                          type="button"
                          aria-label={`${item.name}, ${item.topic}`}
                          aria-pressed={selectedId === item.id}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <img src={item.printUrl} alt="" draggable={false} />
                          <span className="favorite-card-copy">
                            <strong>{item.name}</strong>
                            <small>{item.topic}</small>
                          </span>
                        </button>

                        <button
                          className="favorite-card-remove"
                          type="button"
                          aria-label={`Remove ${item.name} from favorites`}
                          title={`Remove ${item.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPendingRemoval(item.mentor)
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                            <path d="M12 21.2 3.6 13C-1.3 8.3 5.8 1 10.6 5.7L12 7l1.4-1.3C18.2 1 25.3 8.3 20.4 13Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="favorite-details">
              {currentItem ? (
                <>
                  <p>
                    <strong>{currentItem.name}</strong>
                    <span>{currentItem.topic}</span>
                  </p>
                  <div className="favorite-actions">
                    {onRequest && (
                      <button
                        type="button"
                        className="cta"
                        onClick={() => onRequest(currentItem.id)}
                      >
                        Request a session &rarr;
                      </button>
                    )}
                    <button
                      type="button"
                      className="favorite-remove"
                      onClick={() => setPendingRemoval(currentItem.mentor)}
                    >
                      Remove favorite
                    </button>
                  </div>
                </>
              ) : (
                <p className="favorite-hint">
                  Select a mentor to request a session, or use the heart to remove them.
                </p>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            title="No favorite mentors saved"
            description="Bookmark mentors you would like to work with again for quick 1-click access."
            action={
              onBrowse ? (
                <Button variant="secondary" onClick={onBrowse}>
                  Browse mentors
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {/* Danger Confirmation Modal */}
      <Modal
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null)
        }}
        variant="danger"
        title="Remove Favorite Mentor"
        description={`Are you sure you want to remove ${
          pendingRemoval?.fullName || pendingRemoval?.full_name || 'this mentor'
        } from your saved favorites?`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setPendingRemoval(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmRemoval}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </>
        }
      />
    </div>
  )
}
