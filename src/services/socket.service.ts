import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Client joins their home room
        socket.on('join_home', (homeId: string) => {
            socket.join(`home_${homeId}`);
            console.log(`📡 Socket ${socket.id} joined room: home_${homeId}`);
        });

        // Admin joins admin room
        socket.on('join_admin', () => {
            socket.join('admins');
            console.log(`👑 Admin socket ${socket.id} joined admin room`);
        });

        // ESP32 device connects and sends its ID
        socket.on('device_connect', (data: { deviceId: string; homeId: string }) => {
            socket.join(`device_${data.deviceId}`);
            socket.join(`home_${data.homeId}`);
            console.log(`🌡️ Device ${data.deviceId} connected to socket`);
            io?.to('admins').emit('device_status', {
                deviceId: data.deviceId,
                homeId: data.homeId,
                isOnline: true,
                timestamp: new Date(),
            });
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
        });
    });

    return io;
};

export const getIO = (): SocketIOServer | null => {
    return io;
};

/**
 * Emit a gas reading to the relevant home room and admin room.
 */
export const emitGasReading = (
    homeId: string,
    payload: {
        deviceId: string;
        ppmValue: number;
        gasStatus: string;
        isLeak: boolean;
        temperature?: number;
        humidity?: number;
        timestamp: Date;
    }
): void => {
    if (!io) return;
    io.to(`home_${homeId}`).emit('gas_reading', payload);
    io.to('admins').emit('gas_reading', { homeId, ...payload });
};
