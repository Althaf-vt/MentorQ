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
import { SessionsRepository } from '../repositories/sessions.repository.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/schemas/notification.schema.js';
import { UsersService } from '../../users/services/users.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly sessionsRepository: SessionsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

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
            await this.usersService.updateOnlineStatus(uid, true);
          }
        }
      }
    } catch (err) {
      console.warn(`WebSocket auth warning for ${client.id}:`, err);
    }
  }

  async handleDisconnect(client: Socket) {
    const sessionId = client.data?.activeSessionId;
    if (sessionId && this.server) {
      try {
        const sockets = await this.server.in(`session_${sessionId}`).fetchSockets();
        if (sockets.length === 0) {
          await this.sessionsRepository.update(sessionId, { last_empty_at: new Date() });
        }
      } catch (err) {
        console.error('Error handling disconnect for session:', err);
      }
    }
    const uid = client.data?.user?.id || client.data?.user?._id;
    if (uid) {
      try {
        await this.usersService.updateOnlineStatus(uid, false);
      } catch (err) {
        console.warn('Failed to update offline status', err);
      }
    }
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
  async handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    if (sessionId) {
      client.join(`session_${sessionId}`);
      client.data.activeSessionId = sessionId;
      // Notify peers in the room so they can renegotiate WebRTC if needed
      client.to(`session_${sessionId}`).emit('peer_rejoined', { userId: client.data?.user?.id || client.data?.user?._id });
      // Unset last_empty_at since someone joined
      try {
        await this.sessionsRepository.update(sessionId, { $unset: { last_empty_at: 1 } });
      } catch (err) {}
    }
    return { event: 'joined', data: sessionId };
  }

  @SubscribeMessage('leaveSession')
  async handleLeaveSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    if (sessionId) {
      client.leave(`session_${sessionId}`);
      if (client.data?.activeSessionId === sessionId) {
        delete client.data.activeSessionId;
      }
      try {
        const sockets = await this.server.in(`session_${sessionId}`).fetchSockets();
        if (sockets.length === 0) {
          await this.sessionsRepository.update(sessionId, { last_empty_at: new Date() });
        }
      } catch (err) {}
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
    @MessageBody() payload: { sessionId?: string; ticketId?: string; data: any },
  ) {
    if (payload?.sessionId) {
      client.to(`session_${payload.sessionId}`).emit('webrtc_signal', {
        senderId: client.id,
        data: payload.data,
      });
    } else if (payload?.ticketId) {
      client.to(`ticket_${payload.ticketId}`).emit('webrtc_signal', {
        senderId: client.id,
        data: payload.data,
      });
    }
  }

  @SubscribeMessage('student_refused_session')
  handleStudentRefusedSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId: string; sessionId?: string },
  ) {
    if (payload?.sessionId) {
      client.to(`session_${payload.sessionId}`).emit('student_refused_session', payload);
    } else if (payload?.ticketId) {
      client.to(`ticket_${payload.ticketId}`).emit('student_refused_session', payload);
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

    // Save Notifications to DB
    this.notificationsService.createNotification(
      payload.mentorId,
      'MENTOR',
      'Focus Mode Started',
      'Your focus mode session has started.',
      NotificationType.SESSION
    ).catch(console.error);

    this.notificationsService.createNotification(
      payload.studentId,
      'STUDENT',
      'Focus Mode Started',
      'Your focus mode session has started.',
      NotificationType.SESSION
    ).catch(console.error);
  }

  emitStudentRequestedMentorship(ticketId: string) {
    if (!this.server) return;
    this.server.emit('student_requested_mentorship', { ticketId });

    // Broadcast notification (recipientId null)
    this.notificationsService.createNotification(
      null as any,
      'MENTOR',
      'New Mentorship Request',
      'A new mentorship request is available.',
      NotificationType.TICKET
    ).catch(console.error);
  }

  emitMentorClaimedTicket(studentId: string, ticketId: string) {
    if (!this.server) return;
    this.server.to(`student_${studentId}`).emit('mentor_claimed_ticket', { ticketId });
    this.server.to(`user_${studentId}`).emit('mentor_claimed_ticket', { ticketId });

    this.notificationsService.createNotification(
      studentId,
      'STUDENT',
      'Ticket Claimed',
      'A mentor has claimed your ticket.',
      NotificationType.TICKET
    ).catch(console.error);
  }

  emitTicketResolvedWithGuidance(ticketId: string, studentId: string, mentorId: string) {
    if (!this.server) return;
    const data = { ticketId, mentorId };
    
    this.server.to(`ticket_${ticketId}`).emit('ticket_resolved_guidance', data);
    this.server.to(`student_${studentId}`).emit('ticket_resolved_guidance', data);
    this.server.to(`user_${studentId}`).emit('ticket_resolved_guidance', data);

    this.emitQueueUpdate({ type: 'TICKET_COMPLETED', ticketId });

    this.notificationsService.createNotification(
      studentId,
      'STUDENT',
      'Ticket Resolved',
      'Your mentor has resolved your request with guidance.',
      NotificationType.TICKET
    ).catch(console.error);
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
  emitSessionEnded(sessionId: string, resolutionNotes?: string, endedByUserId?: string, endedByRole?: string) {
    if (!this.server) return;
    const endData = { sessionId, resolutionNotes, endedByUserId, endedByRole };
    this.server.to(`session_${sessionId}`).emit('session_ended', endData);
    this.server.to(`session_${sessionId}`).emit('session_ended_by_peer', endData);
    this.emitSessionUpdate(sessionId, { type: 'SESSION_COMPLETED', ...endData });
  }

  // Method to emit queue updates
  emitQueueUpdate(data: any) {
    if (!this.server) return;
    this.server.emit('queueUpdate', data);
  }
}
