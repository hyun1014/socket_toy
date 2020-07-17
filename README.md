# socket_toy (20.07.17)

Server: Node.js

DB: MongoDB

## 페이지 구조

/

index 페이지<br/>
유저 아이디 및 비밀번호 입력 후 로그인하거나, 회원가입 창으로 이동할 수 있다

/userInfo/sign_in

DB에 일치하는 user document가 있는지 확인하여 로그인 처리를 한다.<br/>
성공 -> /chat_room/:user_id로 리다이렉트<br/>
실패 -> 에러 메시지와 함께 index 페이지의 화면을 렌더링한다.<br/>

/userInfo/sign_up

회원가입 창이다. 아이디, 비밀번호, 비밀번호 확인, 닉네임을 입력받는다. 모든 항목은 필수이다.<br/>

/userInfo/register

회원가입 창에서 입력한 정보를 기반으로 users collection에 새로운 document를 만든 후 저장한다.<br/>
성공 -> /(index 페이지)로 리다이렉트<br/>
실패 -> 에러 메시지와 함께 /userInfo/sign_up 페이지의 화면을 렌더링한다.<br/>

/chat_room/:user_id

자신의 닉네임을 포함한 환영 메세지와 다른 유저들 목록을 가져온다. 다른 유저들의 닉네임 클릭을 하면 1대1 채팅방으로 입장한다.<br/>

/chat_room/:user_id/:target

1대1 채팅방이다. 여기서 socket.io의 socket이 서버와 연결된다.<br/>

## 디렉토리 구조
```bash
socket_toy
├── node_modules
│   └── 생략
├── routers
│   ├── chatRouter.js
│   └── userInfoRouter.js
├── static/js
│   ├── socket.io-stream.js
│   └── chat_socket.js
├── views
│   ├── chat_room.ejs
│   ├── index.ejs
│   ├── sign_up.ejs
│   └── user_list.ejs
├── app.js
├── schemas.js
├── timeFunctions.js
├── package.json
├── package-lock.json
├── Dockerfile
├── .env (보안상 git에 직접 올리지 않음)
├── .dockerignore
└── .gitignore
```

## DB collection Schema
```Javascript
userSchema: new Schema({ // User collection schema (실제 개발에서는 더 이상 사용하지 않으나 테스트용으로 남겨놓음)
        user_id: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        nickname: {type: String, required: true},
        joined_date: {type: Date, default: Date.now}
    },{versionKey: false}),
chatSchema: new Schema({ // Chatting message collection schema
        room: {type: String},
        sender: {type: mongoose.Schema.Types.ObjectId},
        receiver: {type: mongoose.Schema.Types.ObjectId},
        msg_type: {type: String}, // 파일 전송기능 구현으로 인한 필드 추가
        content: {type: String},
        created_date: {type: Date, default: Date.now} 
    },{versionKey: false})
realUserSchema: new Schema({ // 개발 DB의 user collection에서 필요한것들로만 구성된 schema (어차피 이걸로 user 새로 만들일 없음)
        uid: {type: String},
        nickname: {type: String},
        status_message: {type: String},
        img: {type: String}
    }, {versionKey: false})
```

## 현재 진행상황

- 1대1 채팅 기능
  - 다른 유저와 채팅이 가능합니다. 채팅 메시지는 자신이 보낸 메시지와 받은 메시지로 구별이 가능합니다.
  - 메시지마다 발생한 시간, 분 단위가 표시되며, 날짜가 넘어가는 경우 로그 메시지로 알려줍니다.
  - 상대가 채팅방에 들어오거나 나갈 경우 메시지를 통해 알 수 있습니다.
  - url 필드에 자신과 상대의 uid를 넣는 형태로 둘 사이의 채팅방 페이지가 만들어집니다.(예시: chat_room/uid0/uid1)
- 파일 전송 기능
  - 현재는 이미지 파일만 전송 가능하도록 구현하였습니다.
  - 채팅방에는 축소된 크기의 썸네일로 표시됩니다.
  - 한번에 여러개의 파일을 송수신 가능하며, 사진 썸네일을 클릭할 경우 원본 파일을 다운로드 가능합니다.
  - S3 버킷에 저장 및 DB에 링크 기록 후, 썸네일이 채팅방에 표시됩니다.

- DB 연결
  - 개발 DB와 연결하여 chat_msgs collection을 새로 만들고, 채팅 로그를 저장합니다.
  - S3 fanrep-test 버킷에 연결하여 테스트용 폴더를 새로 만들었고, 이미지 파일들을 저장합니다. 

- Docker
  - Dockerfile을 작성해놓은 상태로, 빌드를 통해 이미지 및 컨테이너 생성이 가능합니다.

- 기존 로그인 기능 및 chat_user collection
  - 개발 DB 연결 및 실제 user collection을 사용하면서 더 이상 사용하지 않지만, 혹시 테스트용으로 사용할 수도 있으니 코드는 남겨놓았습니다.
  
## 현재 문제점

- 파일 전송기능
  - 현재는 이미지 파일(jpg, jpeg, png, gif)들만 송수신 가능하며, 다른 확장자의 파일들은 막아놓았습니다.

## 향후 계획

- 프론트엔드 구축
  - Vue.js를 활용하여 페이지 구현
- 배포 과정 및 인프라 계획 설계
- 추가적으로 필요한 기능 있는지 확인 및 코드 최적화
  - 불필요한 부분 삭제
  - 가독성 향상
  
## 필요한 것들

- 프론트엔드 구축 (Vue.js 공부 필요)
- Docker 및 Jenkins에 대한 숙련도 향상
- Elastic Beanstalk 등 현재 사용중인 aws 기반 인프라 구조에 대한 심화적인 파악