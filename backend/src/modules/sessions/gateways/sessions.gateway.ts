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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard.js';
import { SessionsService } from '../services/sessions.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'sessions',
})
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly sessionsService: SessionsService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinSession')
  handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    client.join(`session_${sessionId}`);
    return { event: 'joined', data: sessionId };
  }

  @SubscribeMessage('leaveSession')
  handleLeaveSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    client.leave(`session_${sessionId}`);
    return { event: 'left', data: sessionId };
  }

  // Method to emit updates to a specific session room
  emitSessionUpdate(sessionId: string, data: any) {
    this.server.to(`session_${sessionId}`).emit('sessionUpdate', data);
  }

  // Method to emit queue updates
  emitQueueUpdate(data: any) {
    this.server.emit('queueUpdate', data);
  }
}
