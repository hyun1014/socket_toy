// node.js 내장 모듈
const http = require('http');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
// npm으로 설치한 패키지들
const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const md5 = require('md5');
const moment = require('moment');
require('dotenv').config({path: __dirname + '/.env'}); //환경변수 불러오기
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

const s3 = new AWS.S3({ // S3 객체 생성
    // accessKeyId: process.env.AWS_ACCESS_KEY,
    // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});

var User = mongoose.model('chat_user', mongSchema.userSchema, 'chat_users'); // collections 이름은 users로 됨
var Chat_msg = mongoose.model('chat_msg', mongSchema.chatSchema, 'chat_msgs'); // Model 이름, 사용 schema, collection 이름(이거 없으면 model lowercase된거에 s 붙여서 알아서 만듬)

// -------------- test code -------------

var realUser = mongoose.model('real_user', mongSchema.realUserSchema, 'user');

// -------------- test code f-------------

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
// 위에 저거 안적으면 deprecated 된거라고 warning 보여주면서 빼액댐 나중에 뭔지 찾아보자
mongoose.Promise = global.Promise; //promise 관련해서 더 알아봐야 할듯

app.set('view engine', 'ejs'); // ejs 사용
app.use(bodyparser.urlencoded({extended: true})); // express 내장이긴 한데 미들웨어 등록은 따로 해줘야 함
app.use(express.static(path.join(__dirname, 'static'))); // static files 사용 경로

app.get('/', async function(req, res){ // 처음 index 페이지 (로그인 || 회원가입)
    res.render('index.ejs', {err_msg: undefined});
    res.end();
});

app.use('/userInfo', userRouter); // 로그인, 회원가입 처리

app.use('/chat_room', chatRouter); // 로그인 이후 채팅룸 메뉴 입장

io.on('connection', (socket) => { // socket 연결
    console.log(socket.id + " connected");
    socket.on('join_room', async (room_name, sender_nick) => { // room에 join
        socket.join(room_name);
        console.log("Sender nick ---------------------------- " + sender_nick);
        console.log("Joined " + room_name);
        socket.nick = sender_nick;
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
    ss(socket).on('sendFile', (stream, dataName, dataSize, m_info) => {
        console.log(dataName + "/ " + dataSize + 'Byte');
        var file_name = dataName.substr(0, dataName.indexOf('.')); // 파일명
        var file_ext = dataName.substr(dataName.indexOf('.')); // 파일 확장자
        var msg_sentTime = new Date(m_info.msg_time);
        var s3Filename = moment(msg_sentTime).format('YYYYMMDDHHmmss') + msg_sentTime.getMilliseconds() + '_' + md5(file_name)
            + file_ext;

        var s3_param = { // s3 접근에 필요한 parameter 값들을 담고 있음
            Bucket: 'fanrep-test',
            Key: 'static_files/chat_image/' + s3Filename,
            ACL: 'public-read',
            Body: stream
        };
        s3.upload(s3_param, function(err, data){ // s3 버킷에 업로드
            if(err){
                console.log("Error...");
                console.log(err);
            }
            else{
                console.log("Done...");
                console.log(data);
                var new_msg = new Chat_msg({ // Instance 생성
                    room: m_info.room_name,
                    sender: m_info.sender,
                    receiver: m_info.receiver,
                    msg_type: m_info.msg_type,
                    content: 'https://d1s02z0ai6qb0b.cloudfront.net/' + s3_param.Key, // cloudfront 링크로, 파일 보여주기 및 다운 링크로 사용
                    created_date: msg_sentTime
                });
                new_msg.save((dbErr) => { // Chat msgs Collection에 저장 
                    if(dbErr){
                        console.log(dbErr.message);
                        return;
                    }
                    console.log("DB save success (File)");
                    console.log("File name was " + m_info.message);
                    io.to(socket.room).emit('receive_msg', new_msg); // sender receiver 양쪽 다에게 일단 보냄 (text msg는 sender client쪽에서 전송과 동시에 업데이트 하지만 file msg는 아님. server쪽에서 양쪽 모두 업데이트 해야함)
                });
            }
        });
    })
    socket.on('disconnect', () => { // 접속 종료
        socket.broadcast.to(socket.room).emit('left_room', socket.nick)
        console.log(socket.nick + " disconnected");
    });
});

httpServer.listen(3000, '127.0.0.1', () =>{
    console.log("Listening...");
});