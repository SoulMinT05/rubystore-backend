// socket.js
import { Server } from 'socket.io';

let io = null;

const onlineUsers = new Set();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL, process.env.FRONTEND_ADMIN_URL],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        // CONNECTED
        console.log('User connected:', socket.id);
        onlineUsers.add(socket.id);

        // DISCONNECTED
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            onlineUsers.delete(socket.id);
        });
    });
};

export const getOnlineUsers = () => {
    return onlineUsers.size;
};

export const emitOrderStatusUpdated = (orderId, newStatus) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('updateOrderStatus', { orderId, newStatus });
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};
