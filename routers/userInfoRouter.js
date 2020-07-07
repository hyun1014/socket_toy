const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const mongSchema = require('../schemas');

var User = mongoose.model('user', mongSchema.userSchema);

router.get('/sign_up', function(req, res){ // 회원가입 페이지 (montest_list.ejs)
    res.render('sign_up.ejs');
    res.end();
});

router.post('/sign_in', function(req, res){ //로그인
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

router.post('/register', function(req, res){ // New user 등록
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

module.exports = router;