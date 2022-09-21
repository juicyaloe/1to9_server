const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { json } = require('sequelize');

const {roomMaker, roomVisitor, roomDestroyer, roomLeaver} = require('./modules/room_manager');
const User = require("./models/user");
const Room = require("./models/room");

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => { // 웹소켓 연결 시

   
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('새로운 클라이언트 접속', ip);

    ws.isAuthorization = false;
    const userToken = req.url.split('/')[1];
    
    // 인증 로직
    try {
      req.decoded = jwt.verify(userToken, process.env.JWT_SECRET);
      ws.id = req.decoded.id;
      console.log("인증 완료");
    } catch (error) {
      if (error.name === 'TokenExpiredError') { // 유효기간 초과    
        ws.close(1001, 'TokenExpiredError');
      }
      ws.close(1002, 'unauthorizedToken');
    }

    ws.on('message', async (message) => {// 클라이언트로부터 메시지
      try {
        const json = JSON.parse(message.toString());
        console.log(json);
        

        if (json.type === "createRoom") {
          // db 적용 부분
          let id = json.body.id;
          let roomname = json.body.roomname;

          let returnMessage = await roomMaker(id, roomname);
          let mainResponseJson = {
            type: "roomMake",
            body: returnMessage,
          };
          let mainResponse = JSON.stringify(mainResponseJson);
          console.log(mainResponse);

          // notice 부분
          let noticeResponseJson = {
            type: "roomUpdate"
          }
          let noticeResponse = JSON.stringify(noticeResponseJson);

          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN && mainResponseJson.body.code === 201 && client.id !== id) {
              client.send(noticeResponse);
            }

            if (client.readyState === client.OPEN && client.id === id) {
              client.send(mainResponse);
            }
          });
        }
        else if (json.type == "visitRoom") {
          // db 적용 부분
          let id = json.body.id;
          let roomname = json.body.roomname;

          let returnMessage = await roomVisitor(id, roomname);
          let mainResponseJson = {
            type: "roomVisit",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(responseJson);
          console.log(mainResponse);

          // notice 부분
          let noticeResponseJson = {
            type: "roomMemberUpdate"
          }
          let noticeResponse = JSON.stringify(noticeResponseJson);

          const room = await Room.findOne({
            include: [{
              model: User,
            }],
            where: {
              name: roomname,
            },
          });
          
          room.Users.forEach((user) => {
            wss.clients.forEach((client) => { // 이 방에 있는 사람들 중
              if (client.id === user.id) {
                if (client.readyState === client.OPEN && mainResponseJson.body.code === 200 && client.id !== id) {
                  client.send(noticeResponse);
                }
      
                if (client.readyState === client.OPEN && client.id === id) {
                  client.send(mainResponse);
                }
              }
            });
          });
        }
        else if(json.type == "destroyRoom") {
          // db 적용 부분
          let id = json.body.id;

          // null 오류 있음
          const user = await User.findOne({
            where: {id: id}
          })
          const room = await Room.findOne({
            include: [{
              model: User,
            }],
            where: {
              id: user.myroom,
            },
          });

          let returnMessage = await roomDestroyer(id);
          let mainResponseJson = {
            type: "roomDestroy",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(mainResponseJson);
          console.log(mainResponse);

          // notice 부분
          let noticeResponseJson = {
            type: "roomDestroyNotice"
          }
          let noticeResponse = JSON.stringify(noticeResponseJson);
     
          room.Users.forEach((user) => {
            wss.clients.forEach((client) => { // 이 방에 있는 사람들 중
              if (client.id === user.id) {
                if (client.readyState === client.OPEN && mainResponseJson.body.code === 200 && client.id !== id) {
                  client.send(noticeResponse);
                }
      
                if (client.readyState === client.OPEN && client.id === id) {
                  client.send(mainResponse);
                }
              }
            });
          });
        }
        else if(json.type == "leaveRoom") {
          let id = json.body.id;

          // null 오류 있음
          const user = await User.findOne({
            where: {id: id}
          })
          const room = await Room.findOne({
            include: [{
              model: User,
            }],
            where: {
              id: user.myroom,
            },
          });
          console.log(room.id);

          let returnMessage = await roomLeaver(id);
          let mainResponseJson = {
            type: "roomLeave",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(mainResponseJson);
          console.log(mainResponse);

          // notice 부분
          let noticeResponseJson = {
            type: "roomLeaveNotice"
          }
          let noticeResponse = JSON.stringify(noticeResponseJson);
        
          room.Users.forEach((user) => {
            wss.clients.forEach((client) => { // 이 방에 있는 사람들 중
              if (client.id === user.id) {
                if (client.readyState === client.OPEN && mainResponseJson.body.code === 200 && client.id !== id) {
                  client.send(noticeResponse);
                }
    
                if (client.readyState === client.OPEN && client.id === id) {
                  client.send(mainResponse);
                }
              }
            });
          });
        }
      } catch (err) {
        
      }
    });


    ws.on('error', (error) => { // 에러 시
      console.error(error);
    });


    ws.on('close', () => { // 연결 종료 시
      console.log('클라이언트 접속 해제', ip);
      clearInterval(ws.interval);
    });

    ws.interval = setInterval(() => { // 3초마다 클라이언트로 메시지 전송
      if (ws.readyState === ws.OPEN) {

        let mainResponseJson = {
          type: "test",
          body: ws.user,
        };
        ws.send(JSON.stringify(mainResponseJson));
      }
    }, 3000);
  });
};