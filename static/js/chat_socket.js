var socket = io();
var sender = document.getElementById('msender').innerHTML;
var receiver = document.getElementById('mreceiver').innerHTML;
var room_name = "default room";
console.log("sender: " + sender);
console.log("receiver: " + receiver);
if (sender<receiver){
    room_name = sender + receiver;
}
else{
    room_name = receiver + sender;
}
/*
    room_name은 유저 2명의 id를 붙여서 만든다.
    사전순으로 앞에 오는 user_id가 앞쪽으로, 뒤에 오는게 뒤쪽으로 해서 concat함
*/
console.log(room_name);
socket.emit('join_room', room_name, sender);
$('form').submit(() => { // message 전송
    var message = $('#send_msg').val();
    var msg_time = new Date();
    $('#chat_log').append($('<li style="text-align:right;">')
        .text(message + `(${msg_time.getHours()}:${msg_time.getMinutes()})`)); // 자기가 보낸건 오른쪽에 오도록
    $('#send_msg').val('');
    console.log("Sent message");
    var m_info = { // 메시지 객체 정보(db에 등록할 정보들이 전부 있음)
        room_name: room_name,
        sender: sender,
        receiver: receiver,
        message: message,
        msg_time: msg_time
    };
    socket.emit('send_msg', m_info); // send_msg 이벤트 보내기 (message 보내기)
    return false;
});
socket.on('receive_msg', (rcvmsg, msg_time) => { // receive_msg 이벤트 listen (message 받음)
    console.log(rcvmsg);
    console.log(msg_time);
    var msg_dateTime = new Date(msg_time);
    $('#chat_log').append($('<li style="text-align:left;">')
        .text(rcvmsg + `(${msg_dateTime.getHours()}:${msg_dateTime.getMinutes()})`)); // 상대한테 받은건 왼쪽에 오도록
});
socket.on('joined_room', (nick) => { // join 이벤트 listen
    $('#chat_log').append($('<li style="text-align:center;">')
        .text(`----${nick}님이 접속하였습니다.----`)); 
});
socket.on('left_room', (nick) => { // left 이벤트 listen
    $('#chat_log').append($('<li style="text-align:center;">')
        .text(`----${nick}님이 접속을 끊었습니다.----`)); 
});