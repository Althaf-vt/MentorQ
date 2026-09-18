export const playNotificationSound = () => {
  try {
    // A tiny, non-intrusive base64 encoded MP3/WAV beep.
    // Using a valid very short wav header + a small sine wave
    const beepBase64 = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'A'.repeat(100)
    
    // Create audio element
    const audio = new Audio(beepBase64)
    
    // Some browsers block autoplay unless the user has interacted with the document.
    // We catch the error to prevent console spam or app crashes.
    audio.play().catch((err) => {
      console.warn('Audio autoplay blocked by browser:', err)
    })
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}
