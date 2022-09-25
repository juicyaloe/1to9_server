const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { json } = require('sequelize');

const {roomCreater, roomVisitor, roomLeaver, getRoomname} = require('./modules/room_manager');
const {changeReady, gameStart} = require('./modules/game_manager');
const User = require("./models/user");
const Room = require("./models/room");

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => { // 웹소켓 연결 시

   
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('새로운 클라이언트 접속', ip);

    ws.isAuthorization = false;
    const userToken = req.url.split('/')[2];
    
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

          let returnMessage = await roomCreater(id, roomname);
          let mainResponseJson = {
            type: "roomCreate",
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
            if (client.readyState === client.OPEN && mainResponseJson.body.code === 201 && client.id !== ws.id) {
              client.send(noticeResponse);
            }

            if (client.readyState === client.OPEN && client.id === ws.id) {
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

          let mainResponse = JSON.stringify(mainResponseJson);
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
          
          wss.clients.forEach((client) => {
            room.Users.forEach((user) => {  // 이 방에 있는 사람들
              if (client.id === user.id) {
                if (client.readyState === client.OPEN && mainResponseJson.body.code === 200 && client.id !== ws.id) {
                  client.send(noticeResponse);
                }   
              }
            });

            if (client.readyState === client.OPEN && client.id === ws.id) {
              client.send(mainResponse);
            }
          }); 
        }
        else if(json.type == "leaveRoom") {
          let id = json.body.id;
          let roomname = json.body.roomname;

          let returnMessage = await roomLeaver(id, roomname);
          let mainResponseJson = {
            type: "roomLeave",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(mainResponseJson);
          console.log(mainResponse);
   
          if (mainResponseJson.body.code === 200 || mainResponseJson.body.code === 202)
          {
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

            wss.clients.forEach((client) => { // 나에게
              if (client.readyState === client.OPEN && client.id === ws.id) {
                client.send(mainResponse);
              }
            });

            room.Users.forEach((user) => {
              wss.clients.forEach((client) => { // 이 방에 있는 사람들 중
                if (client.id === user.id) {
                  if (client.readyState === client.OPEN && client.id !== ws.id) {
                    client.send(noticeResponse);
                  }
                }
              });
            });
          }
          else if (mainResponseJson.body.code === 204)
          {
            // notice 부분
            let noticeResponseJson = {
              type: "roomUpdate"
            }
            let noticeResponse = JSON.stringify(noticeResponseJson);

            wss.clients.forEach((client) => { // 모든 사람에게
              if (client.readyState === client.OPEN && client.id !== ws.id) {
                client.send(noticeResponse);
              }
      
              if (client.readyState === client.OPEN && client.id === ws.id) {
                client.send(mainResponse);
              }
            });
          }
          else
          {
            wss.clients.forEach((client) => { // 나에게
              if (client.readyState === client.OPEN && client.id === ws.id) {
                client.send(mainResponse);
              }
            });
          }       
        }
        else if (json.type == "changeReady")
        {
          let id = json.body.id;
          let roomname = json.body.roomname;

          let returnMessage = await changeReady(id);
          let mainResponseJson = {
            type: "readyChange",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(mainResponseJson);
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

          wss.clients.forEach((client) => { // 나에게
            if (client.readyState === client.OPEN && client.id === ws.id) {
              client.send(mainResponse);
            }
          });

          room.Users.forEach((user) => {
            wss.clients.forEach((client) => { // 이 방에 있는 사람들 중
              if (client.id === user.id) {
                if (client.readyState === client.OPEN && client.id !== ws.id) {
                  client.send(noticeResponse);
                }
              }
            });
          });
        }

      } catch (err) {
        let mainResponseJson = {
          type: "messageError",
          body: err
        };
        let mainResponse = JSON.stringify(mainResponseJson);

        wss.clients.forEach((client) => { // 나에게
          if (client.readyState === client.OPEN && client.id === ws.id) {
            client.send(mainResponse);
          }
        });
      }
    });


    ws.on('error', (error) => { // 에러 시
      console.error(error);
    });


    ws.on('close', async () => { // 연결 종료 시
      console.log('클라이언트 접속 해제');

      let tempRes = await getRoomname(ws.id);
      if (tempRes.code == 200)
      {
        let roomname = tempRes.message;

        let returnMessage = await roomLeaver(ws.id, roomname);

        if (returnMessage.code === 200 || returnMessage.code === 202)
        {
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
                if (client.readyState === client.OPEN) {
                  client.send(noticeResponse);
                }
              }
            });
          });
        }
        else if (returnMessage.code === 204)
        {
          // notice 부분
          let noticeResponseJson = {
            type: "roomUpdate"
          }
          let noticeResponse = JSON.stringify(noticeResponseJson);

          wss.clients.forEach((client) => { // 모든 사람에게
            if (client.readyState === client.OPEN) {
              client.send(noticeResponse);
            }
          });
        }
      }
    });
  });
};