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
import { UsersService } from '@server/users/users.service';
import { Server, Socket } from 'socket.io';

type TypingEvent = {
  toUserId: string;
  chatId: string;
};

type CallEvent = {
  toUserId: string;
  offer?: any;
  type?: string;
  answer?: any;
  candidate?: any;
};

type SocketWithUser = Socket & {
  data: {
    userId: string;
  };
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer()
  server: Server;

  private users = new Map<string, string>();

  getSocketId(userId: string): string | undefined {
    return this.users.get(userId);
  }

  async handleConnection(@ConnectedSocket() client: SocketWithUser) {
    const token = client.handshake.auth.token as string;

    const payload = await this.authService.verifyToken(token);

    if (!payload) {
      client.disconnect();
      return;
    }

    client.data.userId = payload.userId;
    await this.usersService.updateUserStatus(payload.userId, 'online');
    client.broadcast.emit('user-status', {
      userId: payload.userId,
      status: 'online',
    });
    this.users.set(payload.userId, client.id);
  }

  async handleDisconnect(@ConnectedSocket() client: SocketWithUser) {
    const userId = client.data.userId;
    if (userId) {
      this.users.delete(userId);
    }
    await this.usersService.updateUserStatus(userId, 'offline');
    client.broadcast.emit('user-status', {
      userId,
      status: 'offline',
    });
    client.disconnect();
  }

  @SubscribeMessage('start-call')
  handleStartCall(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: CallEvent,
  ) {
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
  handleEndCall(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: CallEvent,
  ) {
    console.log('received end call event', data);
    const { toUserId } = data;
    const targetSocketId = this.users.get(toUserId);

    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('end-call');
  }

  @SubscribeMessage('answer-call')
  handleAnswerCall(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: CallEvent,
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
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: CallEvent,
  ) {
    const fromUserId = client.data.userId;
    const { candidate, toUserId } = data;

    const targetSocketId = this.users.get(toUserId);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('webrtc-ice-candidate', {
      fromUserId,
      candidate,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: TypingEvent,
  ) {
    console.log('received typing event', data, this.users);
    const fromUserId = client.data.userId;
    const { toUserId, chatId } = data;
    const targetSocketId = this.users.get(toUserId);

    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('typing', {
      fromUserId,
      chatId,
    });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: TypingEvent,
  ) {
    const fromUserId = client.data.userId;
    const { toUserId, chatId } = data;
    const targetSocketId = this.users.get(toUserId);

    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('stop-typing', {
      fromUserId,
      chatId,
    });
  }

  @SubscribeMessage('reaction')
  handleReaction(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: { messageId: string; emoji: string; chatId: string },
  ) {
    const fromUserId = client.data.userId;
    const { messageId, emoji, chatId } = data;

    // Broadcast the reaction to all users in the chat
    this.server.emit(`chat:${chatId}:reaction`, {
      messageId,
      emoji,
      userId: fromUserId,
    });
  }
}
