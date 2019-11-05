const express = require("express")
const http = require("http")
const path = require('path')
const socketio = require("socket.io")
const Filter = require("bad-words")
const {generateMessage, generateLocation} = require("./utils/messages")
const { getUser, addUser, removeUser, getUserInRoom } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const public = path.join(__dirname,"../Public")

app.use(express.static(public))


io.on("connection",(socket)=>{
    console.log("New socket connection")


    socket.on("join",({username,room},callback)=>{

        console.log(username,room)
        const id = socket.id;
        const {error, user} = addUser({id,username,room})

        if(error)
        {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit("message",generateMessage("Admin","Welcome!!"));
        socket.broadcast.to(user.room).emit("message",generateMessage("Admin",user.username+' has joined'));
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })

    socket.on('clientMsg',(msg,callback)=>{

        const user = getUser(socket.id)

        const filter = new Filter()

        if(filter.isProfane(msg)){
            return callback('error')
        }
        io.to(user.room).emit('message',generateMessage(user.username,msg));
        callback()
        
    })

    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)

        io.to(user.room).emit("locationMsg",generateLocation(user.username,"https://google.com/maps?q="+location.latitude+","+location.longitude))
        callback()
    })

    socket.on('disconnect',()=>{

        const user = removeUser(socket.id)
        if(user)
        {
            io.to(user.room).emit("message",generateMessage("Admin",user.username+" has left"))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })

})

server.listen(port,(res)=>{
    console.log("Server is running on port "+port)
})