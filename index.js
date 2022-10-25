const io = require("socket.io")(8900, {
    cors: {
        origin: 'http://localhost:3000'
    }
}); 

let users = []; 
let anonPool = [];

const addUser = (userId, socketId) => {
    if(!users.some(user => user.userId === userId)) {
        users.push({userId, socketId})
    }
     
}

const addToAnonPool = (user, socketId) => {
    if(!anonPool.some(el => el.id === user.id)) {
        anonPool.push({...user, socketId})
    }
     
}

const removeFromAnonPool = (socketId) => {
    anonPool = anonPool.filter(el => el.socketId !== socketId);
}


const removeFromAnonPoolByUserId = (userId) => {
    anonPool = anonPool.filter(el => el.id !== userId);
}

const removeUser = (socketId) => {
    users = users.filter(el => el.socketId !== socketId);
}

const getUser = (userId) => {
        return users.find(el => el.userId === userId)
    }
    
io.on("connection", (socket) => {
    
    // take user id and socket id
    socket.on("addUser", userId => {
        console.log("User connected")
        addUser(userId, socket.id)
        io.emit("getUsers", users);
    })

    socket.on("addToAnonPool", user => {
        addToAnonPool(user, socket.id);
        io.emit("getAnonPool", anonPool);
    })    

    socket.on("sendMessage", ({recieverId, userId, userInfo, text, conversationId}) => {
        const user = getUser(recieverId)
        io.to(user?.socketId).emit("getMessage", {
            conversationId,
            sender: userId,
            userInfo: userInfo,
            text,
            isRead: false
        })
    })

    socket.on("sendAnonMessage", ({recieverId, userId, userInfo, text, conversationId}) => {
        const user = getUser(recieverId)
        io.to(user?.socketId).emit("getAnonMessage", {
            conversationId,
            sender: userId,
            userInfo: userInfo,
            text,
            isRead: false
        })
    })

    socket.on('createdAnonChat', ({recieverId, conversationId}) => {
        const user = getUser(recieverId);
        io.to(user?.socketId).emit("getAnonChat", {
            conversationId
        })
    })

    socket.on("newSymphaty", ({recieverId, photo, theme, message}) => {
        const user = getUser(recieverId)
        io.to(user?.socketId).emit("getSymphaty", {
            photo, theme, message
        })
    })

    socket.on("userBlocked", ({recieverId, photo, theme, message}) => {
        const user = getUser(recieverId)
        io.to(user?.socketId).emit("youAreBlocked", {
            photo, theme, message
        })
    })

    socket.on("anonSkip", (id) => {
        const user = getUser(id);
        io.to(user?.socketId).emit("youWereSkipped")
    })

    socket.on("anonLike", (id) => {
        const user = getUser(id);
        io.to(user?.socketId).emit("youWereLiked")
    })



    socket.on("disconnect", () => {
        removeUser(socket.id);
        removeFromAnonPool(socket.id);
        io.emit("getUsers", users);
    })

    socket.on("leaveFromAnonPool", (userId) => {
        removeFromAnonPoolByUserId(userId);
        io.emit("getAnonPool", anonPool);
    })
})