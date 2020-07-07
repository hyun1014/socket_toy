const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const bodyparser = require('body-parser');
const path = require('path');
const chatRouter = require('./routers/chatRouter');
const mongSchema = require('./schemas');
const mongoose = require('mongoose');

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer);

var User = mongoose.model('user', mongSchema.userSchema);
var Chat_msg = mongoose.model('chat_msgs', mongSchema.chatSchema, 'Chat_msgs'); // Model 이름, 사용 schema, collection 이름(이거 없으면 model lowercase된거에 s 붙여서 알아서 만듬)

mongoose.connect('mongodb://localhost:27017/prac', {useNewUrlParser: true, useUnifiedTopology: true});
// 위에 저거 안적으면 deprecated 된거라고 warning 보여주면서 빼액댐 나중에 뭔지 찾아보자
mongoose.Promise = global.Promise; //promise 관련해서 더 알아봐야 할듯

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true})); // express 내장이긴 한데 미들웨어 등록은 따로 해줘야 함
app.use(express.static(path.join(__dirname, 'static'))); // static files 사용 경로

app.get('/', function(req, res){ // 처음 index 페이지 (로그인 || 회원가입)
    res.render('index.ejs', {err_msg: undefined});
    res.end();
});

app.get('/sign_up', function(req, res){ // 회원가입 페이지 (montest_list.ejs)
    res.render('sign_up.ejs');
    res.end();
});

app.post('/sign_in', function(req, res){ //로그인
    var user_id = req.body.user_id;
    var user_pw = req.body.user_pw;
    console.log(user_id + " / " + user_pw);
    // users collections에서 맞는 document가 있는가 검색
    User.find({$and: [{name: user_id}, {password: user_pw}]}, (err, tar) => {
        console.log(tar); //find()의 결과값(tar) array 형태로 나옴
        if(err){ //db 에러
            console.log('db error');
            res.redirect('/');
            res.end();
        }
        else if(tar.length==0){ // users collection에 맞는 정보가 없음
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
    var new_user = new User({ // Instance 생성
        name: user_id,
        password: user_pw
    });
    new_user.save((err) => { // users collection에 저장
        if(err){
            console.log(err);
            res.json({result: 0});
            return;
        }
        console.log("Registration done.");
        res.redirect(`/`); // 다시 초기 화면으로
    });
});

app.use('/chat_room', chatRouter);

io.on('connection', (socket) => { // socket 연결
    console.log(socket.id + " connected");
    socket.on('join_room', (room_name) => { // room에 join
        socket.join(room_name);
        console.log("Joined " + room_name);
        socket.room = room_name; // Attrubute? 아 뭐였지 암튼 속성 추가
    });
    socket.on('send_msg', (message, msender, mreceiver) => { // socket에서 msg를 보냄
        console.log("Message is sent!");
        console.log(message + " / " + msender + " / " + mreceiver);
        var new_msg = new Chat_msg({ // Instance 생성
            sender: msender,
            receiver: mreceiver,
            content: message
        });
        new_msg.save((err) => { // Chat msgs Collection에 저장 
            if(err){
                console.log(err);
                res.json({result: 0});
                return;
            }
            console.log("DB save success");
            console.log("Message was " + message);
            socket.broadcast.to(socket.room).emit('receive_msg', message); // 같은 room에 있는 모든 socket에게 이벤트 emit (여기서는 1대1 채팅이므로 상대에게만 emit)
        });
    });
    socket.on('disconnect', (socket) => { // undefined로 뜬다. socket이 disconnect됨과 동시에 정보가 전부 삭제되는듯?
        console.log(socket.id + " disconnected");
    });
});

httpServer.listen(3000, '127.0.0.1', () =>{
    console.log("Listening...");
});