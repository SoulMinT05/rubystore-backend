import UserModel from '../models/UserModel.js';
import StaffModel from '../models/StaffModel.js';

export function printOnlineUsers(onlineUsers) {
    const obj = {};
    for (const [userId, sockets] of onlineUsers.entries()) {
        obj[userId] = Array.from(sockets);
    }
    console.log('👉 OnlineUsers hiện tại:', obj);
}

export async function addUserOnline(socket) {}

export async function removeUserFromOnline(io, socket, onlineUsers) {
    console.log('❌ User disconnected có socket:', socket.id);

    if (socket.userId) {
        const sockets = onlineUsers.get(socket.userId);

        if (sockets) {
            sockets.delete(socket.id);

            if (sockets.size === 0) {
                // chỉ khi user không còn socket nào
                onlineUsers.delete(socket.userId);

                if (socket.role === 'staff' || socket.role === 'admin') {
                    await StaffModel.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        lastOnline: new Date(),
                    }).exec();

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

                    io.emit('userOnlineStatus', {
                        userId: socket.userId,
                        role: socket.role,
                        isOnline: false,
                        lastOnline: new Date(),
                    });
                }
            }
        }
    }
    printOnlineUsers(onlineUsers);
}
