const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const bodyparser = require('body-parser');

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer);

var usr_list = []

io.on('connect', (socket) => {
    console.log(socket.id);
    socket.on('login', (un, pw) => {
        console.log(un);
        console.log(pw);
        socket.emit('redirect', '/chat_room');
    });
    socket.on('disconnect', () => {
        console.log("disconnect: " + socket.id);
    })
});

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static('static'));

app.get('/', function(req, res){
    res.render('index.ejs');
    res.end();
});

app.post('/login', (req, res) => {
    usr_list.push(req.body.user_id);
    res.redirect('/chat_room');
});

app.get('/chat_room', function(req,res){
    res.render('chat_room.ejs', {usr_list:usr_list});
});

httpServer.listen(3000, '127.0.0.1', () =>{
    console.log("Listening...");
});