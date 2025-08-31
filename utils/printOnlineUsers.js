export function printOnlineUsers(onlineUsers) {
    const obj = {};
    for (const [userId, sockets] of onlineUsers.entries()) {
        obj[userId] = Array.from(sockets);
    }
    console.log('👉 OnlineUsers hiện tại:', obj);
    // console.log('👉 OnlineUsers hiện tại:', JSON.stringify(obj, null, 2));
}
