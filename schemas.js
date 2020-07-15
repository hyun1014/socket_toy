const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var mongSchema = {
    userSchema: new Schema({ // User collection schema
        user_id: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        nickname: {type: String, required: true, unique: true},
        joined_date: {type: Date, default: Date.now}
    },{versionKey: false}),
    chatSchema: new Schema({ // Chatting message collection schema
        room: {type: String},
        sender: {type: mongoose.Schema.Types.ObjectId},
        receiver: {type: mongoose.Schema.Types.ObjectId},
        msg_type: {type: String},
        content: {type: String},
        created_date: {type: Date, default: Date.now}
    },{versionKey: false}),
    realUserSchema: new Schema({ // user collection에서 필요한것들로만 구성된 schema (어차피 이걸로 user 새로 만들일 없음)
        uid: {type: String},
        nickname: {type: String},
        status_message: {type: String},
        img: {type: String}
    }, {versionKey: false})
};
// virtual attirubute -> 실제 document에 저장되는건 아님
mongSchema.userSchema.virtual('pw_check').get(function(){return this._pw_check})
    .set(function(v){this._pw_check = v});
mongSchema.userSchema.virtual('pw_origin').get(function(){return this._pw_origin})
    .set(function(v){this._pw_origin = v});
mongSchema.userSchema.virtual('pw_new').get(function(){return this._pw_new})
    .set(function(v){this._pw_new = v});

mongSchema.userSchema.path('password').validate(function(value){
    var cur_user = this; // 현재 유저
    if(cur_user.isNew){
        if(!cur_user.pw_check){ // 비밀번호 확인 입력 안함
            cur_user.invalidate('pw_check', 'Password confirm required.');
        }
        if(cur_user.password!=cur_user.pw_check){ //비번 확인이랑 비번이랑 다름
            cur_user.invalidate('pw_check', 'Password confirm different.');
        }
    }
});

module.exports = mongSchema;