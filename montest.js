const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const bodyparser = require('body-parser');

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {type: String},
    password: {type: String},
    joined_date: {type: Date, default: Date.now}
},{versionKey: false});

var chatSchema = new Schema({
    sender: {type: String},
    receiver: {type: String},
    content: {type: String},
    created_date: {type: Date, default: Date.now}
},{versionKey: false});

var User = mongoose.model('user', userSchema);
var Chat_msg = mongoose.model('chat_msgs', chatSchema, 'Chat_msgs');

mongoose.connect('mongodb://localhost:27017/prac', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = global.Promise; //promise 관련해서 더 알아봐야 할듯

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static('static'));

app.get('/', function(req, res){
    res.render('index.ejs', {err_msg: undefined});
    res.end();
});

app.get('/sign_up', function(req, res){
    res.render('sign_up.ejs');
    res.end();
});

app.post('/sign_in', function(req, res){ //로그인
    var user_id = req.body.user_id;
    var user_pw = req.body.user_pw;
    console.log(user_id + " / " + user_pw);
    var cur_user = new User({
        name: user_id,
        password: user_pw
    });
    User.find({$and: [{name: user_id}, {password: user_pw}]}, (err, tar) => {
        console.log(tar); //tar는 array 형태로 나옴
        if(err){
            console.log('db error');
            res.redirect('/');
            res.end();
        }
        else if(tar.length==0){ // user collection에 맞는 정보가 없음
            console.log('Not matched found');
            res.render('index.ejs', {err_msg: "Not matched found"});
            res.end();
        }
        else
            res.redirect(`/chat_room/${tar[0].name}`);
    });
});

app.post('/register', function(req, res){ // New user 등록
    var user_id = req.body.user_id;
    var user_pw = req.body.user_pw;
    console.log(user_id + " / " + user_pw);
    var new_user = new User({
        name: user_id,
        password: user_pw
    });
    new_user.save((err) => {
        if(err){
            console.log(err);
            res.json({result: 0});
            return;
        }
        console.log("Registration done.");
        res.redirect(`/`);
    });
});

io.on('connection', (socket) => {
    console.log(socket.id + " connected");
    socket.on('join_room', (room_name) => {
        socket.join(room_name);
        console.log("Joined " + room_name);
        socket.room = room_name;
    });
    socket.on('send_msg', (message, msender, mreceiver) => {
        console.log("Message is sent!");
        console.log(message + " / " + msender + " / " + mreceiver);
        console.log('socket room: ' + socket.room);
        var new_msg = new Chat_msg({
            sender: msender,
            receiver: mreceiver,
            content: message
        });
        new_msg.save((err) => {
            if(err){
                console.log(err);
                res.json({result: 0});
                return;
            }
            console.log("DB save success");
            console.log("Message was " + message);
            socket.broadcast.to(socket.room).emit('receive_msg', message);
        });
    });
    socket.on('disconnect', (socket) => { // undefined로 뜨네
        console.log(socket.id + " disconnected");
    });
});

app.get('/chat_room/:user_id', (req, res) => { 
    User.find({name: {$ne: req.params.user_id}}, function(err, data){
        if(err){
            return res.status.send({error: 'db failed'});
        }
        res.render('montest_list.ejs', {usr_list: data, usr_self: req.params.user_id});
    });
});

app.get('/chat_room/:user_id/:target', (req, res) => {
    var msg_sender = req.params.user_id;
    var msg_receiver = req.params.target;
    Chat_msg.find({$or: [{sender: msg_sender}, {receiver: msg_sender}]},
        function(err, msg_log){
            if(err){
                return res.status.send({error: 'db failed'});
            }
            res.render('chat_room.ejs', {sender: msg_sender, receiver: msg_receiver, msg_log: msg_log});
        });
});
httpServer.listen(3000, '127.0.0.1', () =>{
    console.log("Listening...");
});