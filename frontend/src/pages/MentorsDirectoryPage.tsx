import React, { useState, useMemo } from 'react'
import { Heart, Search, Star, Clock, Sparkles } from 'lucide-react'
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
  Loader,
  cardTiltHandlers,
} from '@/design-system'

export const MentorsDirectoryPage: React.FC = () => {
  const { data: directoryResp, isLoading: isLoadingDirectory } = useGetMentorsDirectoryQuery(undefined, { pollingInterval: 30000 })
  const mentors = directoryResp?.data || []

  const { data: favoritesResp, isLoading: isLoadingFavorites } = useGetFavoriteMentorsQuery()
  const favoriteMentors = favoritesResp?.data || []

  const favoriteIdSet = useMemo(() => {
    return new Set(favoriteMentors.map((m) => m.id))
  }, [favoriteMentors])

  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMentorMutation()
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMentorMutation()
  const showToast = useToastStore((state) => state.showToast)

  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="max-w-6xl mx-auto px-4 py-8 font-body space-y-8">
      {/* Header Banner */}
      <Card
        variant="paper"
        className="p-8 sm:p-10 relative overflow-hidden border border-[var(--mqds-paper-border)] shadow-md"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--mqds-hover)] border border-[var(--mqds-border-subtle)] text-xs font-mono font-semibold text-[var(--mqds-primary)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mentor Community</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-[var(--mqds-text)] tracking-tight">
              Mentors Directory
            </h1>
            <p className="text-xs sm:text-sm text-[var(--mqds-muted)] leading-relaxed">
              Find mentors across stacks, explore domain specializations, check real-time online status, and save your favorites.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[var(--mqds-surface)] p-1.5 rounded-full border border-[var(--mqds-border-subtle)] shadow-xs">
            <Button
              variant={activeTab === 'ALL' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('ALL')}
              className="!px-4 !py-1.5 !min-h-0 text-xs font-semibold"
            >
              All Mentors
            </Button>
            <Button
              variant={activeTab === 'FAVORITES' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('FAVORITES')}
              className="!px-4 !py-1.5 !min-h-0 text-xs font-semibold flex items-center gap-1.5"
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'FAVORITES' ? 'fill-current' : ''}`} />
              <span>Favorites ({favoriteMentors.length})</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Input Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-[var(--mqds-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by mentor name or expertise (e.g. React, System Design)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mqds-control pl-10 text-xs !min-h-[42px] shadow-xs"
        />
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader />
          <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading mentors directory...</p>
        </div>
      ) : displayedMentors.length === 0 ? (
        <EmptyState
          title={activeTab === 'FAVORITES' ? 'No favorite mentors saved' : 'No mentors match your search'}
          description={
            activeTab === 'FAVORITES'
              ? 'Click the heart button on any mentor card to bookmark them for easy access.'
              : 'Try searching with different keywords or clear your query.'
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
              <Card
                key={mId}
                variant="paper"
                interactive
                {...cardTiltHandlers}
                className="p-6 border border-[var(--mqds-paper-border)] shadow-xs flex flex-col justify-between relative group"
              >
                {/* Favorite Heart Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(mId, isFav)}
                  disabled={isAdding || isRemoving}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all cursor-pointer ${
                    isFav
                      ? 'bg-rose-50 text-rose-500 shadow-xs'
                      : 'bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-muted)] hover:text-rose-500'
                  }`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                </button>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar
                        name={mName}
                        src={mAvatar}
                        size="lg"
                      />
                      {/* Online Status Dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                          mIsOnline ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--mqds-border-subtle)]'
                        }`}
                        title={mIsOnline ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base text-[var(--mqds-text)]">
                        {mName}
                      </h3>
                      <Badge tone={mIsOnline ? 'success' : 'neutral'} className="font-mono text-[10px] mt-1">
                        {mIsOnline ? 'Available Now' : 'Offline'}
                      </Badge>
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  {profile?.expertise_tags && profile.expertise_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.expertise_tags.map((tag) => (
                        <Badge key={tag} tone="neutral" className="text-[10px] font-mono">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="pt-4 mt-4 border-t border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--mqds-muted)]">
                  <div className="flex items-center gap-1 text-[var(--mqds-text)] font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{profile?.rating_avg ? profile.rating_avg.toFixed(1) : 'New'}</span>
                  </div>
                  {profile?.operating_hours?.start && profile?.operating_hours?.end && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--mqds-primary)]" />
                      <span>{profile.operating_hours.start} - {profile.operating_hours.end}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
