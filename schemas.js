const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var mongSchema = {
    userSchema: new Schema({ // User collection schema
        name: {type: String},
        password: {type: String},
        joined_date: {type: Date, default: Date.now}
    },{versionKey: false}),
    chatSchema: new Schema({ // Chatting message collection schema
        sender: {type: String},
        receiver: {type: String},
        content: {type: String},
        created_date: {type: Date, default: Date.now}
    },{versionKey: false})
};

module.exports = mongSchema;