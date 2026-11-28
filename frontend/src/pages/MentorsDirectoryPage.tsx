import React, { useState, useMemo } from 'react'
import { Heart, Search, Star, Clock } from 'lucide-react'
import {
  useGetMentorsDirectoryQuery,
  useGetFavoriteMentorsQuery,
  useAddFavoriteMentorMutation,
  useRemoveFavoriteMentorMutation,
} from '@/store/api/directoryApi'
import { useToastStore } from '@/store/toastStore'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  cardTiltHandlers,
  lightTheme,
} from '@/design-system'
import { MentorGallery } from '@/components/preview/MentorGallery'
import { FavoriteMentorStack } from '@/components/mentors/FavoriteMentorStack'
import { TicketCreationModal } from '@/components/tickets/TicketCreationModal'
import { getMentorPrintTheme } from '@/components/preview/MentorPrints'

export const MentorsDirectoryPage: React.FC = () => {
  const { data: directoryResp, isLoading: isLoadingDirectory } = useGetMentorsDirectoryQuery(undefined, { pollingInterval: 30000 })
  const mentors = directoryResp?.data || []

  const { data: favoritesResp, isLoading: isLoadingFavorites } = useGetFavoriteMentorsQuery()
  const favoriteMentors = favoritesResp?.data || []

  const favoriteIdSet = useMemo(() => {
    return new Set(
      favoriteMentors
        .map((m) => m.id || (m as { _id?: string })._id)
        .filter((id): id is string => Boolean(id))
    )
  }, [favoriteMentors])

  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMentorMutation()
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMentorMutation()
  const showToast = useToastStore((state) => state.showToast)

  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleToggleFavorite = async (mentorId: string, isFav: boolean) => {
    if (isAdding || isRemoving) return
    try {
      if (isFav) {
        await removeFavorite(mentorId).unwrap()
        showToast('Removed from favorites', 'success')
      } else {
        await addFavorite(mentorId).unwrap()
        showToast('Added to favorites', 'success')
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      showToast(error?.data?.message || 'Failed to update favorites', 'error')
    }
  }

  // Gallery showcase mentors mapped from live directory
  const galleryMentors = useMemo(() => {
    if (mentors.length === 0) return undefined
    return mentors.slice(0, 5).map((m, index) => {
      const id = m.id || (m as { _id?: string })._id || `mentor-${index}`
      const name = m.fullName || (m as { full_name?: string }).full_name || m.email || 'Mentor'
      const specialty = m.mentorProfile?.expertise_tags?.[0] || 'Software Engineering'
      const theme = getMentorPrintTheme(id)
      return {
        id,
        name,
        specialty,
        paper: theme.paper,
        ink: theme.ink,
        imageUrl: theme.printUrl,
        isOnline: m.isOnline ?? (m as { is_online?: boolean }).is_online ?? false,
      }
    })
  }, [mentors])

  // Filter and sort mentors
  const displayedMentors = useMemo(() => {
    if (activeTab === 'FAVORITES') {
      let filtered = [...favoriteMentors]

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter((m) => {
          const name = m.fullName || m.email || ''
          return name.toLowerCase().includes(q)
        })
      }

      filtered.sort((a, b) => {
        const nameA = a.fullName || a.email || 'Unknown'
        const nameB = b.fullName || b.email || 'Unknown'
        return nameA.localeCompare(nameB)
      })

      return filtered
    }

    let filtered = [...mentors]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((m) => {
        const name = m.fullName || (m as { full_name?: string }).full_name || m.email || ''
        const nameMatch = name.toLowerCase().includes(q)
        const tagMatch = m.mentorProfile?.expertise_tags?.some((t: string) => t.toLowerCase().includes(q))
        return nameMatch || tagMatch
      })
    }

    filtered.sort((a, b) => {
      const aIsOnline = a.isOnline ?? (a as { is_online?: boolean }).is_online ?? false
      const bIsOnline = b.isOnline ?? (b as { is_online?: boolean }).is_online ?? false
      if (aIsOnline && !bIsOnline) return -1
      if (!aIsOnline && bIsOnline) return 1

      const nameA = a.fullName || (a as { full_name?: string }).full_name || a.email || 'Unknown'
      const nameB = b.fullName || (b as { full_name?: string }).full_name || b.email || 'Unknown'
      return nameA.localeCompare(nameB)
    })

    return filtered
  }, [mentors, favoriteMentors, activeTab, searchQuery])

  const isLoading = activeTab === 'FAVORITES' ? isLoadingFavorites : isLoadingDirectory

  return (
    <main className="preview-main mentor-directory-page font-body space-y-8">
      <header className="mentor-directory-header">
        <h1 className="preview-page-title">Mentors <span>Directory</span></h1>
        <div className="mentor-directory-views" role="group" aria-label="Mentor directory view">
          <Button
            variant={activeTab === 'ALL' ? 'primary' : 'secondary'}
            aria-pressed={activeTab === 'ALL'}
            onClick={() => setActiveTab('ALL')}
          >
            All Mentors
          </Button>
          <Button
            variant={activeTab === 'FAVORITES' ? 'primary' : 'secondary'}
            aria-pressed={activeTab === 'FAVORITES'}
            onClick={() => setActiveTab('FAVORITES')}
          >
            <Heart aria-hidden="true" className={activeTab === 'FAVORITES' ? 'fill-current' : undefined} />
            Favorites ({favoriteMentors.length})
          </Button>
        </div>
      </header>

      {/* Favorites Tab: Fanned 3D Tilt Stack */}
      {activeTab === 'FAVORITES' ? (
        <section aria-labelledby="favorites-title">
          <FavoriteMentorStack
            favorites={favoriteMentors}
            onRemove={(id) => handleToggleFavorite(id, true)}
            onRequest={() => setIsCreateModalOpen(true)}
            onBrowse={() => setActiveTab('ALL')}
            isRemoving={isRemoving}
          />
        </section>
      ) : (
        <>
          {/* Interactive MentorGallery Showcase Stage */}
          <section aria-label="Featured Mentors Showcase">
            <MentorGallery
              mentors={galleryMentors}
              heading="Meet the mentors"
              favorites={Array.from(favoriteIdSet)}
              onToggleFavorite={(m) => handleToggleFavorite(m.id, favoriteIdSet.has(m.id))}
              onRequestSession={() => setIsCreateModalOpen(true)}
            />
          </section>

          {/* Search Input Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-[var(--mqds-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by mentor name or expertise (e.g. React, System Design)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mqds-control pl-10 text-xs !min-h-[42px] shadow-xs w-full"
              />
            </div>
            <span className="text-xs font-mono text-[var(--mqds-muted)] self-center">
              Showing {displayedMentors.length} {displayedMentors.length === 1 ? 'mentor' : 'mentors'}
            </span>
          </div>

          {/* Directory Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="card" label="Loading mentors…" />
              ))}
            </div>
          ) : displayedMentors.length === 0 ? (
            <EmptyState
              title="No mentors match your search"
              description="Try searching with different keywords or clear your query."
              action={
                searchQuery ? (
                  <Button variant="secondary" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedMentors.map((mentor) => {
                const m = mentor as {
                  id?: string
                  _id?: string
                  fullName?: string
                  full_name?: string
                  email?: string
                  avatarUrl?: string
                  avatar_url?: string
                  isOnline?: boolean
                  is_online?: boolean
                  mentorProfile?: {
                    expertise_tags?: string[]
                    rating_avg?: number
                    operating_hours?: {
                      start?: string
                      end?: string
                    }
                  }
                }
                const mId = m.id || m._id || ''
                const isFav = favoriteIdSet.has(mId)
                const mName = m.fullName || m.full_name || m.email || 'Mentor'
                const mAvatar = m.avatarUrl || m.avatar_url
                const mIsOnline = m.isOnline ?? m.is_online ?? false
                const profile = m.mentorProfile

                return (
                  <div key={mId} className="min-w-0" {...cardTiltHandlers}>
                    <div className="mqds-tilt-surface h-full">
                      <Card
                        variant="paper"
                        data-mqds={lightTheme}
                        interactive
                        className="mentor-directory-card"
                      >
                        <div className="mentor-directory-card-name">
                          <h3>{mName}</h3>
                          <p className="mentor-directory-availability" data-online={mIsOnline}>
                            {mIsOnline ? 'Available now' : 'Offline'}
                          </p>
                        </div>

                        <div className="mentor-directory-card-tools">
                          <span aria-hidden="true"><Avatar name={mName} src={mAvatar} /></span>
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(mId, isFav)}
                            disabled={isAdding || isRemoving}
                            className="mentor-directory-favorite"
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                            aria-label={`Favorite ${mName}`}
                            aria-pressed={isFav}
                          >
                            <Heart aria-hidden="true" className={isFav ? 'fill-current' : undefined} />
                          </button>
                        </div>

                        <div className="mentor-directory-card-details">
                          {profile?.expertise_tags && profile.expertise_tags.length > 0 && (
                            <div className="mentor-directory-card-tags">
                              {profile.expertise_tags.map((tag) => (
                                <Badge key={tag} tone="neutral">#{tag}</Badge>
                              ))}
                            </div>
                          )}

                          <div className="mentor-directory-card-meta">
                            <div className="flex items-center gap-1">
                              <Star aria-hidden="true" className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{profile?.rating_avg ? profile.rating_avg.toFixed(1) : 'New'}</span>
                            </div>
                            {profile?.operating_hours?.start && profile?.operating_hours?.end && (
                              <div className="flex items-center gap-1.5">
                                <Clock aria-hidden="true" className="w-3.5 h-3.5 text-[var(--mqds-accent)]" />
                                <span>{profile.operating_hours.start} - {profile.operating_hours.end}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Ticket Creation Dialog */}
      <TicketCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  )
}
