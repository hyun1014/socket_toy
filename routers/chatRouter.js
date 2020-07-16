const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const mongSchema = require('../schemas');
const moment = require('moment'); // 채팅방 메시지 시간 표시
const timeFunc = require('../timeFunctions');

var User = mongoose.model('chat_user', mongSchema.userSchema, 'chat_users');
var Chat_msg = mongoose.model('chat_msg', mongSchema.chatSchema, 'chat_msgs'); // Model 이름, 사용 schema, collection 이름(이거 없으면 model lowercase된거에 s 붙여서 알아서 만듬)
var realUser = mongoose.model('real_user', mongSchema.realUserSchema, 'user');

router.get('/:user_id', async (req, res) => { // 로그인 이후 채팅 가능한 유저 목록 (현재는 그냥 db에 있는 다른 유저들 전부 추가)
    var self_nick = null;
    await User.findOne({user_id: req.params.user_id})
        .then(function(doc){self_nick = doc.nickname;}); //자기 nickname 찾기
    User.find({user_id: {$ne: req.params.user_id}}, function(err, data){ // 로그인 유저 자신은 목록에서 제외
        if(err){
            return res.status.send({error: 'db failed'});
        }
        res.render('user_list.ejs', {usr_list: data, usr_selfid: req.params.user_id, usr_selfnick: self_nick});
        res.end();
    });
});

router.get('/:user_id/:target', async (req, res) => { // 채팅방 입장
    var msg_sender = null
    var msg_receiver = null;
    await realUser.findOne({uid: req.params.user_id})
        .then(function(doc){msg_sender = doc;}); // sender 찾기
    await realUser.findOne({uid: req.params.target})
        .then(function(doc){msg_receiver = doc;}); // receiver 찾기
    /*
    room_name은 유저 2명의 id를 붙여서 만든다.
    사전순으로 앞에 오는 user_id가 앞쪽으로, 뒤에 오는게 뒤쪽으로 해서 concat함
    */
    if (msg_sender.uid < msg_receiver.uid)
        var room_name = msg_sender.uid + msg_receiver.uid;
    else
        var room_name = msg_receiver.uid + msg_sender.uid;
    console.log("Room name is " + room_name);
    console.log("Sender\n-------------------\n" + msg_sender);
    console.log("Receiver\n-------------------\n" + msg_receiver);
    Chat_msg.find({room: room_name}).sort({created_date:1}).exec(function(err, msg_log){ // room_name에서 발생한 Chat_msg 전부 조회 및 날짜순 정렬
        if(err){
            return res.status.send({error: 'db failed'});
        }
        // sender, receiver는 각각 user collection에서 나온 doc임
        res.render('chat_room.ejs', {sender: msg_sender, receiver: msg_receiver, msg_log: msg_log, timeFunc: timeFunc});
        res.end();
    });
});

module.exports = router;