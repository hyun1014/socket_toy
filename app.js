// node.js 내장 모듈
const http = require('http');
const bodyparser = require('body-parser');
const path = require('path');
// npm으로 설치한 패키지들
const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
// Routers 불러오기
const chatRouter = require('./routers/chatRouter'); 
const userRouter = require('./routers/userInfoRouter');
// 외부 파일에서 정의해놓은 schema 불러오기 (Schema들은 여기에 한번에 정의해둠)
const mongSchema = require('./schemas');
// express 객체 생성
const app = express();
// http server 생성
const httpServer = http.createServer(app);
// socket.io에 바인딩
const io = socketio(httpServer);

var User = mongoose.model('user', mongSchema.userSchema);
var Chat_msg = mongoose.model('chat_msgs', mongSchema.chatSchema, 'Chat_msgs'); // Model 이름, 사용 schema, collection 이름(이거 없으면 model lowercase된거에 s 붙여서 알아서 만듬)

mongoose.connect('mongodb://localhost:27017/chat_toy', {useNewUrlParser: true, useUnifiedTopology: true});
// 위에 저거 안적으면 deprecated 된거라고 warning 보여주면서 빼액댐 나중에 뭔지 찾아보자
mongoose.Promise = global.Promise; //promise 관련해서 더 알아봐야 할듯

app.set('view engine', 'ejs'); // ejs 사용
app.use(bodyparser.urlencoded({extended: true})); // express 내장이긴 한데 미들웨어 등록은 따로 해줘야 함
app.use(express.static(path.join(__dirname, 'static'))); // static files 사용 경로

app.get('/', function(req, res){ // 처음 index 페이지 (로그인 || 회원가입)
    res.render('index.ejs', {err_msg: undefined});
    res.end();
});

app.use('/userInfo', userRouter); // 로그인, 회원가입 처리

app.use('/chat_room', chatRouter); // 로그인 이후 채팅룸 메뉴 입장

io.on('connection', (socket) => { // socket 연결
    console.log(socket.id + " connected");
    socket.on('join_room', async (room_name, sender) => { // room에 join
        socket.join(room_name);
        console.log("Joined " + room_name);
        var joined_nick = null;
        await User.findOne({user_id: sender}).then(function(doc){ joined_nick = doc.nickname; }); //User collection에서 맞는 user document를 찾아냄
        socket.nick = joined_nick;
        socket.room = room_name;
        io.to(room_name).emit('joined_room', socket.nick);
    });
    socket.on('send_msg', (m_info) => { // socket에서 msg를 보냄
        console.log("Message is sent!");
        console.log(m_info.message + " / " + m_info.sender + " / " + m_info.receiver);
        var new_msg = new Chat_msg({ // Instance 생성
            room: m_info.room_name,
            sender: m_info.sender,
            receiver: m_info.receiver,
            content: m_info.message,
            created_date: m_info.msg_time
        });
        console.log("message time is ----------" + m_info.msg_time);
        new_msg.save((err) => { // Chat msgs Collection에 저장 
            if(err){
                console.log(err);
                res.json({result: 0});
                return;
            }
            console.log("DB save success");
            console.log("Message was " + m_info.message);
            socket.broadcast.to(socket.room).emit('receive_msg', m_info.message, m_info.msg_time); // 같은 room에 있는 모든 socket에게 이벤트 emit (여기서는 1대1 채팅이므로 상대에게만 emit)
        });
    });
    socket.on('disconnect', () => {
        socket.broadcast.to(socket.room).emit('left_room', socket.nick)
        console.log(socket.nick + " disconnected");
    });
});

httpServer.listen(3000, '127.0.0.1', () =>{
    console.log("Listening...");
});