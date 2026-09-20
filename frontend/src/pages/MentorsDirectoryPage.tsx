import React, { useState, useMemo } from 'react'
import { Heart, Search, Users, Star, Clock } from 'lucide-react'
import {
  useGetMentorsDirectoryQuery,
  useGetFavoriteMentorsQuery,
  useAddFavoriteMentorMutation,
  useRemoveFavoriteMentorMutation,
} from '@/store/api/directoryApi'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'
import { useToast } from '@/context/ToastContext'

export const MentorsDirectoryPage: React.FC = () => {
  const { data: directoryResp, isLoading: isLoadingDirectory } = useGetMentorsDirectoryQuery(undefined, { pollingInterval: 30000 })
  const mentors = directoryResp?.data || []

  const { data: favoritesResp, isLoading: isLoadingFavorites } = useGetFavoriteMentorsQuery()
  const favoriteMentors = favoritesResp?.data || []
  // Build a Set of favorite mentor IDs for O(1) lookups
  const favoriteIdSet = useMemo(() => {
    return new Set(favoriteMentors.map((m) => m.id))
  }, [favoriteMentors])

  const { user } = useRoleAuth()

  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMentorMutation()
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMentorMutation()
  const { showToast } = useToast()

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
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to update favorites', 'error')
    }
  }

  // Filter and sort mentors
  const displayedMentors = useMemo(() => {
    // For the FAVORITES tab, use the populated favorites data from the dedicated endpoint
    if (activeTab === 'FAVORITES') {
      let filtered = [...favoriteMentors]

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter((m) => {
          const name = m.fullName || m.email || ''
          return name.toLowerCase().includes(q)
        })
      }

      // Sort alphabetically
      filtered.sort((a, b) => {
        const nameA = a.fullName || a.email || 'Unknown'
        const nameB = b.fullName || b.email || 'Unknown'
        return nameA.localeCompare(nameB)
      })

      return filtered
    }

    // ALL tab — use directory data
    let filtered = [...mentors]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((m) => {
        const name = m.fullName || (m as any).full_name || m.email || ''
        const nameMatch = name.toLowerCase().includes(q)
        const tagMatch = m.mentorProfile?.expertise_tags?.some((t) => t.toLowerCase().includes(q))
        return nameMatch || tagMatch
      })
    }

    // Sort by online status first (online at the top), then by name
    filtered.sort((a, b) => {
      const aIsOnline = a.isOnline ?? (a as any).is_online ?? false
      const bIsOnline = b.isOnline ?? (b as any).is_online ?? false
      if (aIsOnline && !bIsOnline) return -1
      if (!aIsOnline && bIsOnline) return 1

      const nameA = a.fullName || (a as any).full_name || a.email || 'Unknown'
      const nameB = b.fullName || (b as any).full_name || b.email || 'Unknown'
      return nameA.localeCompare(nameB)
    })

    return filtered
  }, [mentors, favoriteMentors, activeTab, searchQuery])

  const isLoading = activeTab === 'FAVORITES' ? isLoadingFavorites : isLoadingDirectory

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-body space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#5948d3] rounded-full blur-[80px] opacity-30"></div>
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-[#8172fe] uppercase tracking-wider">Discover</span>
          <h1 className="text-3xl font-black font-headline">Mentors Directory</h1>
          <p className="text-sm text-slate-400 max-w-lg">Find the perfect mentor to guide you through your learning journey. Check who is online right now and save your favorites.</p>
        </div>
        <div className="relative z-10 bg-slate-800 p-2 rounded-2xl flex items-center gap-2 border border-slate-700/50 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('ALL')} 
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'ALL' ? 'bg-[#5948d3] text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            All Mentors
          </button>
          <button 
            onClick={() => setActiveTab('FAVORITES')} 
            className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'FAVORITES' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'FAVORITES' ? 'fill-white' : ''}`} />
            Favorites
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name or expertise (e.g. React)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#5948d3] focus:ring-4 focus:ring-[#5948d3]/10 transition-all shadow-sm"
        />
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500 font-semibold flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#5948d3] border-t-transparent rounded-full animate-spin"></div>
          Loading mentors...
        </div>
      ) : displayedMentors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">
            {activeTab === 'FAVORITES' ? 'No favorites yet' : 'No mentors found'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'FAVORITES'
              ? 'Click the heart icon on any mentor card to add them to your favorites.'
              : 'Try adjusting your search criteria or check back later.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMentors.map((mentor: any) => {
            const mId = mentor.id || mentor._id
            const isFav = favoriteIdSet.has(mId)
            const mName = mentor.fullName || mentor.full_name || mentor.email || 'Unknown Mentor'
            const mAvatar = mentor.avatarUrl || mentor.avatar_url
            const mIsOnline = mentor.isOnline ?? mentor.is_online ?? false
            const profile = mentor.mentorProfile
            return (
              <div key={mId} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow p-6 flex flex-col gap-4 relative group">
                <button
                  onClick={() => handleToggleFavorite(mId, isFav)}
                  disabled={isAdding || isRemoving}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all ${
                    isFav 
                      ? 'bg-pink-50 text-pink-500' 
                      : 'bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-pink-500'
                  } ${(isAdding || isRemoving) ? 'pointer-events-none opacity-50' : ''}`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    {mAvatar ? (
                      <img src={mAvatar} alt={mName} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5948d3] to-[#8172fe] text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {mName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online Indicator */}
                    <span 
                      className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                        mIsOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                      title={mIsOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      {mName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Mentor</p>
                  </div>
                </div>

                {profile && (
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {profile?.expertise_tags?.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-[#5948d3]/10 text-[#5948d3] rounded-lg text-[10px] font-bold uppercase tracking-wide">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile && (
                  <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {profile?.rating_avg ? profile.rating_avg.toFixed(1) : 'New'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {profile?.operating_hours?.start} - {profile?.operating_hours?.end}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
