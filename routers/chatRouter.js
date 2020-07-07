const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const mongSchema = require('../schemas');

var User = mongoose.model('user', mongSchema.userSchema);
var Chat_msg = mongoose.model('chat_msgs', mongSchema.chatSchema, 'Chat_msgs'); // Model 이름, 사용 schema, collection 이름(이거 없으면 model lowercase된거에 s 붙여서 알아서 만듬)

router.get('/:user_id', (req, res) => { // 로그인 이후 채팅 가능한 유저 목록 (현재는 그냥 db에 있는 다른 유저들 전부 추가)
    User.find({name: {$ne: req.params.user_id}}, function(err, data){ // 로그인 유저 자신은 목록에서 제외
        if(err){
            return res.status.send({error: 'db failed'});
        }
        res.render('montest_list.ejs', {usr_list: data, usr_self: req.params.user_id});
    });
});

router.get('/:user_id/:target', (req, res) => { // 채팅방 입장
    var msg_sender = req.params.user_id;
    var msg_receiver = req.params.target;
    Chat_msg.find({$or: [{sender: msg_sender}, {receiver: msg_sender}]}, // 자신이 보냈거나 받은 메시지 로그 전부 조회
        function(err, msg_log){
            if(err){
                return res.status.send({error: 'db failed'});
            }
            res.render('chat_room.ejs', {sender: msg_sender, receiver: msg_receiver, msg_log: msg_log});
        });
});

module.exports = router;