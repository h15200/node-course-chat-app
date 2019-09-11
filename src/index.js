const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require ('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/user')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public') //path must be required from node module

app.use(express.static(publicDirectoryPath))


//io.on('connection') will run every time a new client is connected. the arg is that particular user, and attached are various methods like emit
//io.on is ONLY for connections
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({ username, room }, callback) => {
      const { error, user } = addUser({ id: socket.id, username, room })

      if (error) {
       return callback(error)
      }

      socket.join(user.room)

      socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
    })
    callback()
    })


    socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id)
      //initialize bad-words npm
      const filter = new Filter()
      if (filter.isProfane(message)){
        return callback('Profanity is not allowed!') //send back callback with arg
      }
      io.to(user.room).emit('message', generateMessage(user.username, message))
      callback()
    })

  socket.on('sendLocation', ({latitude, longitude}, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${latitude},${longitude}`))
    callback()
  })

// this will detect disconnect
  socket.on('disconnect', () => {

    const user = removeUser(socket.id)

    if (user){
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
      io.to(user.room).emit('roomData', {
          room: user.room,
          users: getUsersInRoom(user.room)
      })
    }
  })
})




app.get('/', async (req, res) => {
  res.render('index')
})

server.listen(port, ()=>{
  console.log(`Listening on port ${port}`)
})