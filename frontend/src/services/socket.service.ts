import { io, Socket } from 'socket.io-client'
import { getToken } from '@/lib/roleContext'

const WS_URL = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:3133'

class SocketService {
  private static instance: SocketService
  private socket: Socket | null = null

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  public connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    const authToken = token || getToken()

    this.socket = io(WS_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: {
        token: authToken ? `Bearer ${authToken}` : '',
      },
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    return this.socket
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  public getSocket(): Socket | null {
    return this.socket
  }

  public emit(event: string, data?: unknown): void {
    if (this.socket) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket is not connected. Event not emitted:', event)
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

export const socketService = SocketService.getInstance()
