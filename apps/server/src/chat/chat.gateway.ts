import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AuthService } from '@server/auth/auth.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  private users = new Map<string, string>();

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth.token as string;

    const payload = await this.authService.verifyToken(token);

    if (!payload) {
      client.disconnect();
      return;
    }

    client.data.userId = payload.userId;
    this.users.set(payload.userId, client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.users.delete(userId);
    }
    client.disconnect();
  }

  @SubscribeMessage('start-call')
  handleStartCall(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log('received start call event', data);
    const fromUserId = client.data.userId;
    const { toUserId, offer, type } = data;

    const targetSocketId = this.users.get(toUserId);

    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('incoming-call', {
      fromUserId,
      offer,
      type,
    });
  }

  @SubscribeMessage('end-call')
  handleEndCall(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const { toUserId } = data;
    const targetSocketId = this.users.get(toUserId);

    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('end-call');
  }

  @SubscribeMessage('answer-call')
  handleAnswerCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const fromUserId = client.data.userId;

    const { answer, toUserId } = data;

    const targetSocketId = this.users.get(toUserId);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('call-answered', {
      fromUserId,
      answer,
    });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // console.log('receiving ice-candidate event', data);
    const fromUserId = client.data.userId;
    const { candidate, toUserId } = data;

    const targetSocketId = this.users.get(toUserId);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('webrtc-ice-candidate', {
      fromUserId,
      candidate,
    });
  }
}
