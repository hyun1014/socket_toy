// node.js 내장 모듈
const http = require('http');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
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
const ss = require('socket.io-stream');

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
        console.log(m_info);
        console.log("msgtime type is " + typeof m_info.msg_time);
        var new_msg = new Chat_msg({ // Instance 생성
            room: m_info.room_name,
            sender: m_info.sender,
            receiver: m_info.receiver,
            msg_type: m_info.msg_type,
            content: m_info.message,
            created_date: m_info.msg_time
        }); // DB 저장시에는 Date object를 string으로 바꿔서 저장해도 됨
        console.log("message time is ----------" + m_info.msg_time);
        new_msg.save((err) => { // Chat msgs Collection에 저장 
            if(err){
                console.log(err);
                res.json({result: 0});
                return;
            }
            console.log("DB save success");
            console.log("Message was " + m_info.message);
            socket.broadcast.to(socket.room).emit('receive_msg', new_msg); // 같은 room에 있는 모든 socket에게 이벤트 emit (여기서는 1대1 채팅이므로 상대에게만 emit)
        });
    });
    ss(socket).on('sendFile', (stream, dataName, dataSize, m_info) => { // duplex stream 통해 file 전송
        // 얘는 m_info 안의 Date 객체가 제대로 전달이 안되어서 걍 toUTCString으로 바꿔서 보냄
        console.log(dataName + "/ " + dataSize + 'Byte');
        var writeStream = fs.createWriteStream('./static/down_images/' + dataName); //Writestream 생성 (파일 저장 경로 및 이름 지정)
        writeStream.on('finish', function() { // 파일 전부 다 받아왔으면 함수 실행
            console.log('writestream on');
            var new_msg = new Chat_msg({ // Instance 생성
                room: m_info.room_name,
                sender: m_info.sender,
                receiver: m_info.receiver,
                msg_type: m_info.msg_type,
                content: m_info.message,
                created_date: new Date(m_info.msg_time)
            });
            new_msg.save((err) => { // Chat msgs Collection에 저장 
                if(err){
                    console.log(err.message);
                    return;
                }
                console.log("DB save success (File)");
                console.log("File name was " + m_info.message);
                io.to(socket.room).emit('receive_msg', new_msg); // sender receiver 양쪽 다에게 일단 보냄 (text msg는 sender client쪽에서 전송과 동시에 업데이트 하지만 file msg는 아님. server쪽에서 양쪽 모두 업데이트 해야함)
            });
        });
        stream.pipe(writeStream); // stream을 위에서 만든 writeStream과 연결
    });
    socket.on('disconnect', () => { // 접속 종료
        socket.broadcast.to(socket.room).emit('left_room', socket.nick)
        console.log(socket.nick + " disconnected");
    });
});

httpServer.listen(3000, '127.0.0.1', () =>{
    console.log("Listening...");
});