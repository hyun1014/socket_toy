const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const mongSchema = require('../schemas');

var User = mongoose.model('user', mongSchema.userSchema);

router.get('/sign_up', function(req, res){ // 회원가입 페이지 (montest_list.ejs)
    res.render('sign_up.ejs', {err_msg: undefined});
    res.end();
});

router.post('/sign_in', function(req, res){ //로그인
    var user_id = req.body.user_id;
    var user_pw = req.body.user_pw;
    console.log(user_id + " / " + user_pw);
    // users collections에서 맞는 document가 있는가 검색
    User.find({$and: [{user_id: user_id}, {password: user_pw}]}, (err, tar) => {
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
            res.redirect(`/chat_room/${tar[0].user_id}`);
    });
});

router.post('/register', function(req, res){ // New user 등록
    var user_id = req.body.user_id;
    var user_pw = req.body.user_pw;
    var user_pw_check = req.body.user_pw_check;
    var user_nick = req.body.user_nick;
    console.log(user_id + " / " + user_pw + ' / ' + user_pw_check + ' / ' + user_nick);

    var new_user = new User({ // Instance 생성
        user_id: user_id,
        password: user_pw,
        nickname: user_nick
    });

    new_user.pw_check = user_pw_check;
    console.log('BP0');
    new_user.save((err) => { // users collection에 저장
        if(err){
            if(err.code==11000){ // ID 중복
                console.log(err);
                res.render('sign_up.ejs', {err_msg: '이미 존재하는 아이디입니다'});
                res.end();
            }
            else if(err.message.indexOf('required')!=-1 && err.message.indexOf('pw')!=-1){ 
                console.log(err);
                res.render('sign_up.ejs', {err_msg: '비밀번호 확인 입력이 필요합니다.'}); // ejs 템플릿에 들어갈 자리가 있으면 값이 없다고 해도 undefined 이렇게라도 넣어야함.
                res.end();
            }
            else if (err.message.indexOf('different')!=-1){
                console.log(err);
                res.render('sign_up.ejs', {err_msg: '비밀번호 확인이 다릅니다.'});
                res.end();
            }
            else if(err.message.indexOf('required')!=-1 && err.message.indexOf('nickname')!=-1){
                console.log(err);
                res.render('sign_up.ejs', {err_msg: '닉네임 입력이 필요합니다.'});
                res.end();
            }
            else{
                console.log(err);
                res.json(err);
                res.end();
            }
            return;
        }
        console.log("Registration done.");
        res.redirect(`/`); // 다시 초기 화면으로
    });
});

module.exports = router;