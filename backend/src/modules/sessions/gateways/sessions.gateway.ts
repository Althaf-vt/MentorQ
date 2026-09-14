import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../auth/services/auth.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake?.auth?.token || client.handshake?.headers?.authorization;
      if (authToken) {
        const token = authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
        const user = await this.authService.validateToken(token);
        if (user) {
          client.data.user = user;
          const uid = ((user as any)._id || (user as any).id)?.toString();
          if (uid) {
            client.join(`user_${uid}`);
            client.join(`student_${uid}`);
            client.join(`mentor_${uid}`);
          }
        }
      }
    } catch (err) {
      console.warn(`WebSocket auth warning for ${client.id}:`, err);
    }
  }

  async handleDisconnect(client: Socket) {
    // Client cleanup handled automatically by Socket.IO
  }

  @SubscribeMessage('joinUser')
  handleJoinUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    if (userId) {
      client.join(`user_${userId}`);
      client.join(`student_${userId}`);
      client.join(`mentor_${userId}`);
    }
    return { event: 'joinedUser', data: userId };
  }

  @SubscribeMessage('joinTicket')
  handleJoinTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: string) {
    if (ticketId) {
      client.join(`ticket_${ticketId}`);
    }
    return { event: 'joinedTicket', data: ticketId };
  }

  @SubscribeMessage('leaveTicket')
  handleLeaveTicket(@ConnectedSocket() client: Socket, @MessageBody() ticketId: string) {
    if (ticketId) {
      client.leave(`ticket_${ticketId}`);
    }
    return { event: 'leftTicket', data: ticketId };
  }

  @SubscribeMessage('joinSession')
  handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    if (sessionId) {
      client.join(`session_${sessionId}`);
    }
    return { event: 'joined', data: sessionId };
  }

  @SubscribeMessage('leaveSession')
  handleLeaveSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    if (sessionId) {
      client.leave(`session_${sessionId}`);
    }
    return { event: 'left', data: sessionId };
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; message: any },
  ) {
    if (payload?.sessionId && payload?.message) {
      client.to(`session_${payload.sessionId}`).emit('receiveMessage', payload.message);
    }
    return { event: 'messageSent' };
  }

  @SubscribeMessage('webrtc_signal')
  handleWebRtcSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; data: any },
  ) {
    if (payload?.sessionId) {
      client.to(`session_${payload.sessionId}`).emit('webrtc_signal', {
        senderId: client.id,
        data: payload.data,
      });
    }
  }

  // Method to broadcast focus mode launch to student and ticket rooms
  emitFocusModeStarted(payload: {
    sessionId: string;
    ticketId: string;
    studentId: string;
    mentorId: string;
    startedAt: Date;
    allocatedMinutes: number;
  }) {
    if (!this.server) return;
    const eventData = {
      event: 'focus_mode_started',
      ...payload,
    };

    // Emit to ticket room and student targeted rooms
    this.server.to(`ticket_${payload.ticketId}`).emit('focus_mode_started', eventData);
    this.server.to(`student_${payload.studentId}`).emit('focus_mode_started', eventData);
    this.server.to(`user_${payload.studentId}`).emit('focus_mode_started', eventData);
    this.server.to(`session_${payload.sessionId}`).emit('focus_mode_started', eventData);

    // Also notify queue and session listeners
    this.emitQueueUpdate({ type: 'TICKET_ACTIVE', ticketId: payload.ticketId });
    this.emitSessionUpdate(payload.sessionId, { type: 'SESSION_STARTED', ...eventData });
  }

  // Method to emit updates to a specific session room
  emitSessionUpdate(sessionId: string, data: any) {
    if (!this.server) return;
    this.server.to(`session_${sessionId}`).emit('sessionUpdate', data);
  }

  // Method to emit chat message to session room
  emitNewMessage(sessionId: string, message: any) {
    if (!this.server) return;
    this.server.to(`session_${sessionId}`).emit('receiveMessage', message);
  }

  // Method to emit timer sync tick
  emitTimerSync(sessionId: string, remainingSeconds: number, startedAt: Date) {
    if (!this.server) return;
    this.server.to(`session_${sessionId}`).emit('timer_sync', { remainingSeconds, startedAt });
  }

  // Method to emit session completion
  emitSessionEnded(sessionId: string, resolutionNotes?: string) {
    if (!this.server) return;
    this.server.to(`session_${sessionId}`).emit('session_ended', { sessionId, resolutionNotes });
    this.emitSessionUpdate(sessionId, { type: 'SESSION_COMPLETED', sessionId, resolutionNotes });
  }

  // Method to emit queue updates
  emitQueueUpdate(data: any) {
    if (!this.server) return;
    this.server.emit('queueUpdate', data);
  }
}
