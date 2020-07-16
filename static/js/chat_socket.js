var socket = io();
var sender_id = document.getElementById('sender_id').innerHTML;
var sender_uid = document.getElementById('sender_uid').innerHTML;
var sender_nick = document.getElementById('sender_nick').innerHTML;
var receiver_id = document.getElementById('receiver_id').innerHTML;
var receiver_uid = document.getElementById('receiver_uid').innerHTML;
var receiver_nick = document.getElementById('receiver_nick').innerHTML;
var last_msg_date = document.getElementById('last_msg_date').innerHTML;
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
function msg_getTime(date){
    var timeString = "";
    var hour = date.getHours();
    var minute = date.getMinutes();
    if(hour<12){
        if(hour==0)
            timeString += "오전 12";
        else
            timeString += ("오전 " + hour.toString());
    }
    else{
        if(hour==12)
            timeString += "오후 12";
        else
            timeString += ("오후 " + (hour-12).toString());
    }
    if(minute<10)
        timeString += (":" + "0" + minute.toString());
    else
        timeString += (":" + minute.toString());
    return timeString;
};
function msg_getDate(date){
    var dateString = date.getFullYear().toString() + "년 " + (date.getMonth()+1).toString() + "월 "
        + date.getDate().toString() + "일";
    return dateString;
};
console.log(room_name);
socket.emit('join_room', room_name, sender_nick);
$('#text_chat').submit(() => { // ---------------message 전송
    var message = $('#send_msg').val();
    if(message=="")
        return false; // 비어있는 메시지면 그냥 무시함
    var msg_date = new Date();
    $('#send_msg').val('');
    console.log("Sent message");
    var m_info = { // 메시지 객체 정보(db에 등록할 정보들이 전부 있음)
        room_name: room_name,
        sender: sender_id,
        receiver: receiver_id,
        msg_type: 'text',
        message: message,
        msg_time: msg_date
    };
    console.log('text: ' + m_info.message + ' / ' + m_info.msg_time);
    socket.emit('send_msg', m_info); // send_msg 이벤트 보내기 (message 보내기)
    //m_info 전달할 때 Date object가 string으로 변환되어서 emit됨
    return false;
});
var inputFile = document.getElementById('sendfile');
$('#file_chat').submit(() => { // ---------------media 파일 전송
    console.log('sendFile activated');
    var tar_files = inputFile.files;
    var msg_time = new Date();
    for(var i=0; i<tar_files.length; i++){
        var stream = ss.createStream(); // duplex stream 생성
        var tar_file = tar_files[i];
        var msg_info = { // 메시지 객체 임시 정보(db에 등록할 정보들이 전부 있음, message는 우선 파일들이 있는 리스트임)
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
        console.log(tar_file);
        ss.createBlobReadStream(tar_file).pipe(stream); // 파일을 읽는 BlobReadstream을 위에서 만든 stream에다가 연결함 (전송)
    }
    return false;
}); // Stream 여러개
socket.on('receive_msg', (new_msg) => { // ---------------receive_msg 이벤트 listen (message 받음)
    //new_msg의 created_date는 string으로 변환되어서 들어옴
    console.log("Received!");
    console.log(new_msg);
    console.log(new_msg.content);
    console.log(new_msg.created_date + ' / ' + typeof new_msg.created_date);
    var msg_date = new Date(new_msg.created_date);
    if(msg_date.getDate()!=last_msg_date){ // 날짜 넘어간경우 바뀐 날짜를 시스템 메시지로 띄워줌
        $('#chat_log').append($('<li style="text-align:center;">')
            .text("-----------" + msg_getDate(msg_date) + "-----------"));
        last_msg_date = msg_date.getDate(); // 클라이언트쪽 페이지에 있는 last_msg_date 최신화
    }
    if(new_msg.msg_type=='text'){ //text msg
        if(new_msg.sender==sender_id){ // 자기가 보낸건 오른쪽에
            $('#chat_log').append($('<li style="text-align:right;">')
                .text(new_msg.content).append($('<small>').text("(" + msg_getTime(msg_date) + ")")));
        }
        else{
            $('#chat_log').append($('<li style="text-align:left;">') //상대한테 받은건 왼쪽으로
                .text(new_msg.content).append($('<small>').text("(" + msg_getTime(msg_date) + ")")));
        }
    }
    else{ // file msg
        var chat_log = document.getElementById('chat_log');
        var temp_li = document.createElement('li');
        var downLink = document.createElement("a");
        var img_show = document.createElement('img');
        var rcv_time = document.createElement('small');
        rcv_time.appendChild(document.createTextNode("(" + msg_getTime(msg_date) + ")"));
        downLink.setAttribute('href', new_msg.content);
        downLink.setAttribute('target', 'blank');
        img_show.setAttribute('src', new_msg.content);
        img_show.setAttribute('width', '100px');
        img_show.setAttribute('height', '100px');
        if(new_msg.sender==sender_id){ // 내가 받은건 오른쪽으로
            temp_li.setAttribute('style', 'text-align:right;');
            $('#sendfile').val(''); // 파일 한번 보내고나서 전송 대상 정하는 항목 초기화
        }
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
        .text(`--${nick}님이 접속하였습니다.--`)); 
});
socket.on('left_room', (nick) => { // ---------------left 이벤트 listen
    console.log(nick + ' disconnected');
    $('#chat_log').append($('<li style="text-align:center;">')
        .text(`--${nick}님이 접속을 끊었습니다.--`)); 
});