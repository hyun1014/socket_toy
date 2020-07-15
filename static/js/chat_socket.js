var socket = io();
var sender_id = document.getElementById('sender_id').innerHTML;
var sender_uid = document.getElementById('sender_uid').innerHTML;
var sender_nick = document.getElementById('sender_nick').innerHTML;
var receiver_id = document.getElementById('receiver_id').innerHTML;
var receiver_uid = document.getElementById('receiver_uid').innerHTML;
var receiver_nick = document.getElementById('receiver_nick').innerHTML;
var room_name = "default room";
console.log("sender: " + sender_uid);
console.log("receiver: " + receiver_uid);
if (sender_uid<receiver_uid){
    room_name = sender_uid + receiver_uid;
}
else{
    room_name = receiver_uid + sender_uid;
}
/*
    room_name은 유저 2명의 id를 붙여서 만든다.
    사전순으로 앞에 오는 user_id가 앞쪽으로, 뒤에 오는게 뒤쪽으로 해서 concat함
*/
console.log(room_name);
socket.emit('join_room', room_name, sender_nick);
$('form').submit(() => { // ---------------message 전송
    var message = $('#send_msg').val();
    var msg_date = new Date();
    // $('#chat_log').append($('<li style="text-align:right;">')
    //     .text(message + `(${msg_time.getHours()}:${msg_time.getMinutes()})`)); // 자기가 보낸건 오른쪽에 오도록
    $('#chat_log').append($('<li style="text-align:right;">')
        .text(message).append($('<small>').text(`(${msg_date.getHours()}:${msg_date.getMinutes()})`)));
    $('#send_msg').val('');
    console.log("Sent message");
    var m_info = { // 메시지 객체 정보(db에 등록할 정보들이 전부 있음)
        room_name: room_name,
        sender: sender_id,
        receiver: receiver_id, // 보류
        msg_type: 'text',
        message: message,
        msg_time: msg_date
    };
    console.log('text: ' + m_info.message + ' / ' + m_info.msg_time);
    socket.emit('send_msg', m_info); // send_msg 이벤트 보내기 (message 보내기)
    //m_info 전달할 때 Date object가 string으로 변환되어서 emit됨
    return false;
});
var inputFile = document.getElementById('sendfile'); // ---------------media 파일 전송
inputFile.addEventListener('change', function(event) {
    console.log('sendFile activated');
    var stream = ss.createStream(); // duplex stream 생성
    console.log(inputFile.files);
    var tar_file = inputFile.files[0];
    var msg_time = new Date();
    var msg_info = { // 메시지 객체 정보(db에 등록할 정보들이 전부 있음)
        room_name: room_name,
        sender: sender_id,
        receiver: receiver_id,
        msg_type: 'media',
        message: tar_file.name,
        msg_time: msg_time.toUTCString()
    };
    console.log('media: ' + msg_info.msg_time + ' / ' + typeof msg_info.msg_time);
    ss(socket).emit('sendFile', stream, tar_file.name, tar_file.size, msg_info);
    console.log("sendFile emitted");
    ss.createBlobReadStream(tar_file).pipe(stream); // 파일을 읽는 BlobReadstream을 위에서 만든 stream에다가 연결함 (전송)
});
socket.on('receive_msg', (new_msg) => { // ---------------receive_msg 이벤트 listen (message 받음)
    //new_msg의 created_date는 string으로 변환되어서 들어옴
    console.log("Received!");
    console.log(new_msg);
    console.log(new_msg.content);
    console.log(new_msg.created_date + ' / ' + typeof new_msg.created_date);
    var msg_date = new Date(new_msg.created_date);
    if(new_msg.msg_type=='text'){ //text msg
        $('#chat_log').append($('<li style="text-align:left;">') //상대한테 받은건 왼쪽으로
        .text(new_msg.content).append($('<small>').text(`(${msg_date.getHours()}:${msg_date.getMinutes()})`)));
    }
    else{ // file msg
        var chat_log = document.getElementById('chat_log');
        var temp_li = document.createElement('li');
        var downLink = document.createElement("a");
        var img_show = document.createElement('img');
        var rcv_time = document.createElement('small');
        rcv_time.appendChild(document.createTextNode(`(${msg_date.getHours()}:${msg_date.getMinutes()})`));
        downLink.setAttribute('href', new_msg.content);
        downLink.setAttribute('target', 'blank');
        img_show.setAttribute('src', new_msg.content);
        img_show.setAttribute('width', '100px');
        img_show.setAttribute('height', '100px');
        if(new_msg.sender==sender_id)
            temp_li.setAttribute('style', 'text-align:right;');
        else
            temp_li.setAttribute('style', 'text-align:left;');
        downLink.appendChild(img_show);
        temp_li.appendChild(downLink);
        temp_li.appendChild(rcv_time);
        chat_log.appendChild(temp_li);
    }
});
socket.on('joined_room', (nick) => { // ---------------join 이벤트 listen
    $('#chat_log').append($('<li style="text-align:center;">')
        .text(`----${nick}님이 접속하였습니다.----`)); 
});
socket.on('left_room', (nick) => { // ---------------left 이벤트 listen
    console.log(nick + ' disconnected');
    $('#chat_log').append($('<li style="text-align:center;">')
        .text(`----${nick}님이 접속을 끊었습니다.----`)); 
});