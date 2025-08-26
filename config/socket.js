// socket.js
import { Server } from 'socket.io';

import UserModel from '../models/UserModel.js';
import StaffModel from '../models/StaffModel.js';

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
        const role = socket.handshake.query.role;

        console.log('User connected:', socket.id);
        onlineUsers.add(socket.id);

        console.log('Online users có socket id:', Array.from(onlineUsers));

        // ✅ Khi client gửi userId, cho socket join vào room
        socket.on('joinRoom', (userId) => {
            if (userId) {
                socket.join(userId.toString()); // Join vào room có tên là userId
                console.log(`Socket ${socket.id} joined room with userId: ${userId}`);
            }
        });
        socket.on('joinMessageRoom', async (userId) => {
            if (userId) {
                console.log('role: ', role);
                socket.join(`message-${userId}`); // Join vào room có tên là userId
                console.log(`Socket ${socket.id} có role: ${role} joined room message-${userId}`);

                // 🔥 Cập nhật trạng thái online theo role
                if (role === 'admin' || role === 'staff') {
                    await StaffModel.findByIdAndUpdate(userId, { isOnline: true }).exec();

                    console.log(`Người dùng userId ${userId} với role ${role} đang online`);

                    // Emit cho FE biết staff này online
                    io.emit('staffOnlineStatus', {
                        userId,
                        role,
                        isOnline: true,
                    });
                } else if (role === 'user') {
                    await UserModel.findByIdAndUpdate(userId, { isOnline: true }).exec();

                    console.log(`Người dùng userId ${userId} với role ${role} đang online`);

                    io.emit('userOnlineStatus', {
                        userId,
                        role,
                        isOnline: true,
                    });
                }

                // Lưu userId vào socket để dùng khi disconnect
                socket.userId = userId;
                socket.role = role;
            }
        });

        // DISCONNECTED
        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            onlineUsers.delete(socket.id);

            console.log('Online users có socket id:', Array.from(onlineUsers));

            if (socket.userId) {
                if (socket.role === 'staff' || socket.role === 'admin') {
                    await StaffModel.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        lastOnline: new Date(),
                    }).exec();

                    console.log(`Người dùng userId ${socket.userId} với role ${role} đã offline`);

                    io.emit('staffOnlineStatus', {
                        userId: socket.userId,
                        role: socket.role,
                        isOnline: false,
                        lastOnline: new Date(),
                    });
                } else if (socket.role === 'user') {
                    await UserModel.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        lastOnline: new Date(),
                    }).exec();

                    console.log(`Người dùng userId ${socket.userId} với role ${role} đã offline`);

                    io.emit('userOnlineStatus', {
                        userId: socket.userId,
                        role: socket.role,
                        isOnline: false,
                        lastOnline: new Date(),
                    });
                }
            }
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

// REVIEW FOR ADMIN
export const emitNotificationStaffNewReview = (userId, notification) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(userId.toString()).emit('notificationStaffNewReview', notification);
};
export const emitStaffNewReview = (userId, review) => {
    if (!io) throw new Error('Socket.io not initialized');
    io.to(userId.toString()).emit('staffNewReview', review);
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
