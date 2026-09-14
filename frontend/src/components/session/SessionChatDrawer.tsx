import React, { useState } from 'react'
import { Send, X } from 'lucide-react'
import type { Message } from '@/types/operational.types'

interface SessionChatDrawerProps {
  messages: Message[]
  currentUserId?: string
  onClose: () => void
  onSendMessage: (text: string) => void
}

export const SessionChatDrawer: React.FC<SessionChatDrawerProps> = ({
  messages,
  currentUserId,
  onClose,
  onSendMessage,
}) => {
  const [msg, setMsg] = useState('')

  const handleSend = (e?: React.FormEvent, txt?: string) => {
    if (e) e.preventDefault()
    const content = txt || msg
    if (!content.trim()) return
    onSendMessage(content)
    if (!txt) setMsg('')
  }

  const QUICK_CHIPS = ['Try this approach', 'Great progress!', 'Let me check', 'Review this link']

  return (
    <div className="w-full md:w-80 bg-white border-l flex flex-col justify-between h-[50vh] md:h-auto shadow-lg">
      <div className="p-3 border-b flex items-center justify-between bg-[#faf9f7]">
        <span className="text-xs font-bold text-slate-700 uppercase">Live Chat</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#faf9f7]/50 text-xs text-slate-700">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No messages yet.</div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId
            return (
              <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] ${
                    isMe ? 'bg-[#5948d3] text-white' : 'bg-white text-slate-800 border'
                  }`}
                >
                  {m.message_text}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-2 border-t bg-[#faf9f7] flex gap-1 overflow-x-auto text-[10px]">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(undefined, chip)}
            className="px-2 py-0.5 rounded-full bg-[#5948d3]/10 text-[#5948d3] hover:bg-[#5948d3]/20 whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => handleSend(e)} className="p-2 border-t flex gap-1.5 bg-white">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Send message..."
          className="flex-1 px-3 py-1.5 border rounded-full text-xs focus:outline-none bg-white text-slate-700"
        />
        <button
          type="submit"
          disabled={!msg.trim()}
          className="p-1.5 bg-[#5948d3] text-white rounded-full disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
