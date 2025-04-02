import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth.token as string;
    console.log('Client connected:', client.id, token);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Client disconnected:', client.id);
  }
}
