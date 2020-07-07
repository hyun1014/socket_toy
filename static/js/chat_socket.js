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
console.log(room_name);
socket.emit('join_room', room_name);
$('form').submit(() => { // message 전송
    var message = $('#send_msg').val();
    $('#chat_log').append($('<li style="text-align:right;">')
        .text(message));
    $('#send_msg').val('');
    console.log("Sent message");
    socket.emit('send_msg', message, sender, receiver);
    return false;
});
socket.on('receive_msg', (rcvmsg) => {
    console.log(rcvmsg);
    $('#chat_log').append($('<li style="text-align:left;">')
        .text(rcvmsg));
});