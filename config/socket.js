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

        // ✅ Khi client gửi userId, cho socket join vào room
        socket.on('joinRoom', (userId) => {
            if (userId) {
                socket.join(userId.toString()); // Join vào room có tên là userId
                console.log(`Socket ${socket.id} joined room ${userId}`);
            }
        });
        socket.on('joinMessageRoom', (userId) => {
            if (userId) {
                socket.join(`message-${userId}`); // Join vào room có tên là userId
                console.log(`Socket ${socket.id} joined room message-${userId}`);
            }
        });

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

// ORDER FOR USER
export const emitOrderStatusUpdated = (orderId, newStatus) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('updateOrderStatus', { orderId, newStatus });
};

export const emitNotificationOrder = (userId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(userId.toString()).emit('notificationOrder', notification);
};

// ORDER FOR STAFF / ADMIN
// New order
export const emitNotificationStaffNewOrder = (userId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(userId.toString()).emit('notificationStaffNewOrder', notification);
};
export const emitStaffNewOrder = (userId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(userId.toString()).emit('staffNewOrder', notification);
};
// Cancel order
export const emitNotificationStaffCancelOrder = (userId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(userId.toString()).emit('notificationStaffCancelOrder', notification);
};

export const emitNewReview = (reviewData) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('newReview', reviewData);
};

export const emitDeleteReview = (reviewData) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('deletedReview', reviewData);
};

export const emitDeleteReply = (replyData) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('deletedReply', replyData);
};

// REPLY FOR REVIEW
export const emitNewReply = (replyData) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('newReply', replyData);
};

export const emitReplyToReview = (receiverUserId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(receiverUserId.toString()).emit('notificationReplyToReview', notification);
};

// SEND MESSAGE
export const emitSendMessage = (receiverUserId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(`message-${receiverUserId.toString()}`).emit('newMessage', notification);
};
export const emitNotificationSendMessage = (userId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(`message-${userId.toString()}`).emit('notificationNewMessage', notification);
};

export const emitUpdateOrder = (orderData) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.emit('updatedOrder', orderData);
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};
