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
socket.emit('join_room', room_name);
$('form').submit(() => { // message 전송
    var message = $('#send_msg').val();
    $('#chat_log').append($('<li style="text-align:right;">')
        .text(message)); // 자기가 보낸건 오른쪽에 오도록
    $('#send_msg').val('');
    console.log("Sent message");
    socket.emit('send_msg', message, sender, receiver);
    return false;
});
socket.on('receive_msg', (rcvmsg) => {
    console.log(rcvmsg);
    $('#chat_log').append($('<li style="text-align:left;">')
        .text(rcvmsg)); // 상대한테 받은건 왼쪽에 오도록
});