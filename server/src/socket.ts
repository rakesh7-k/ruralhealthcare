import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
  role: string;
  facility?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
}

// In-memory active teleconsultation rooms and messages
const activeRooms = new Map<string, Map<string, RoomParticipant>>();
const roomChatHistory = new Map<string, any[]>();

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    let currentRoomId: string | null = null;
    let currentUser: RoomParticipant | null = null;

    // Join Teleconsultation Room
    socket.on('join-room', ({ roomId, user }: { roomId: string; user: { id: string; name: string; role: string; facility?: string } }) => {
      currentRoomId = roomId;
      socket.join(roomId);

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Map());
      }
      const roomParticipants = activeRooms.get(roomId)!;

      currentUser = {
        socketId: socket.id,
        userId: user.id,
        name: user.name,
        role: user.role,
        facility: user.facility,
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
      };

      // Get list of other participants currently in room
      const existingUsers = Array.from(roomParticipants.values());

      roomParticipants.set(socket.id, currentUser);

      console.log(`[Socket] User ${user.name} (${user.role}) joined room ${roomId}. Total: ${roomParticipants.size}`);

      // Send existing peers to newly joined user
      socket.emit('room-users', {
        users: existingUsers,
        chatHistory: roomChatHistory.get(roomId) || [],
      });

      // Notify other peers in room that a new user has joined
      socket.to(roomId).emit('user-joined', {
        user: currentUser,
      });
    });

    // WebRTC Signaling: Offer from one peer to another
    socket.on('signal-offer', ({ targetSocketId, offer }: { targetSocketId: string; offer: any }) => {
      io.to(targetSocketId).emit('signal-offer', {
        senderSocketId: socket.id,
        senderUser: currentUser,
        offer,
      });
    });

    // WebRTC Signaling: Answer back to caller
    socket.on('signal-answer', ({ targetSocketId, answer }: { targetSocketId: string; answer: any }) => {
      io.to(targetSocketId).emit('signal-answer', {
        senderSocketId: socket.id,
        answer,
      });
    });

    // WebRTC Signaling: ICE Candidate exchange
    socket.on('signal-ice-candidate', ({ targetSocketId, candidate }: { targetSocketId: string; candidate: any }) => {
      io.to(targetSocketId).emit('signal-ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    });

    // In-Call Chat Message
    socket.on('chat-message', ({ roomId, message }: { roomId: string; message: any }) => {
      const fullMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
      };

      if (!roomChatHistory.has(roomId)) {
        roomChatHistory.set(roomId, []);
      }
      const history = roomChatHistory.get(roomId)!;
      history.push(fullMessage);
      if (history.length > 100) history.shift();

      io.to(roomId).emit('chat-message', fullMessage);
    });

    // Media State Changed (mute, video toggle, screen share)
    socket.on('media-state', ({ roomId, isMuted, isVideoOff, isScreenSharing }: { roomId: string; isMuted: boolean; isVideoOff: boolean; isScreenSharing: boolean }) => {
      if (currentUser) {
        currentUser.isMuted = isMuted;
        currentUser.isVideoOff = isVideoOff;
        currentUser.isScreenSharing = isScreenSharing;
      }
      socket.to(roomId).emit('peer-media-state', {
        socketId: socket.id,
        isMuted,
        isVideoOff,
        isScreenSharing,
      });
    });

    // Real-Time Vitals Telemetry Broadcast (e.g. from PHC doctor/worker to specialist)
    socket.on('vitals-telemetry', ({ roomId, vitals }: { roomId: string; vitals: any }) => {
      socket.to(roomId).emit('vitals-telemetry-updated', {
        vitals,
        sender: currentUser?.name,
        timestamp: new Date().toISOString(),
      });
    });

    // Clean disconnect handler
    const handleLeave = () => {
      if (currentRoomId && activeRooms.has(currentRoomId)) {
        const roomParticipants = activeRooms.get(currentRoomId)!;
        roomParticipants.delete(socket.id);
        console.log(`[Socket] User ${currentUser?.name || socket.id} left room ${currentRoomId}. Remaining: ${roomParticipants.size}`);

        socket.to(currentRoomId).emit('user-left', {
          socketId: socket.id,
          user: currentUser,
        });

        if (roomParticipants.size === 0) {
          activeRooms.delete(currentRoomId);
        }
      }
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });

  return io;
}
