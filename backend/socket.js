const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { json } = require('sequelize');

const {roomCreater, roomVisitor, roomLeaver, getRoomname} = require('./modules/room_manager');
const {changeReady, gameStart, gameAction, getGameRoomname} = require('./modules/game_manager');
const User = require("./models/user");
const Room = require("./models/room");
const Gameroom = require('./models/gameroom');

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
        else if(json.type == "tryStartGame")
        {
          let roomname = json.body.roomname;

          let returnMessage = await gameStart(roomname);
          let mainResponseJson = {
            type: "gameStartTry",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(mainResponseJson);
          console.log(mainResponse);

          if (mainResponseJson.body.code === 201)
          { // 사용자: main, 같은 방 사람: 게임 시작
            // notice 부분
            let noticeResponseJson = {
              type: "gameStart",
              body: {
                gameroomid: mainResponseJson.body.gameroomid,
                masterid: mainResponseJson.body.masterid,
                memberid: mainResponseJson.body.memberid,
              }
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
          else if(mainResponseJson.body.code === 400)
          {
            if(mainResponseJson.body.error == "noReady")
            {
              let noticeResponseJson = {
                type: "pleaseReady",
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

              room.Users.forEach(async (user) => {

                let target_user = await User.findOne({where: {id: user.id}});

                wss.clients.forEach((client) => { // 이 방에 있는 사람들 중
                  if (client.id === user.id) {
                    if (client.readyState === client.OPEN && target_user.isready == 0) {
                      client.send(noticeResponse);
                    }
                  }
                });
              });
            }
            
            wss.clients.forEach((client) => { // 나에게
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
        else if(json.type == "doAction")
        {
          let userid = json.body.userid;
          let gameroomid = json.body.gameroomid;
          let mynumber = json.body.mynumber;

          let returnMessage = await gameAction(userid, gameroomid, mynumber);
          let mainResponseJson = {
            type: "actionDo",
            body: returnMessage,
          };

          let mainResponse = JSON.stringify(mainResponseJson);
          console.log(mainResponse);

          // 201 -> 라운드가 끝났음을 모두에게 공지, 만약 도합 9이면 게임이 끝났음을 모두에게 공지
          // 200 -> 다른 사람이 제출했다고 상대방에게 공지
          // 400, 500대 -> 본인에게만 전달 

          const gameroom = await Gameroom.findOne({where : {id: gameroomid}});
          let gameCount = gameroom.masterwin + gameroom.memberwin + gameroom.draw;

          let anotherMemberid;
          if (gameroom.masterid == userid)
          {
            anotherMemberid = gameroom.memberid;
          }
          else
          {
            anotherMemberid = gameroom.masterid;
          }

          if (mainResponseJson.body.code === 200)
          {
            let noticeResponseJson = {
              type: "pleaseAction"
            }
            let noticeResponse = JSON.stringify(noticeResponseJson);

            wss.clients.forEach((client) => { // 게임 참여자에게 전송
              if (client.readyState === client.OPEN && client.id === anotherMemberid) {
                client.send(noticeResponse);
              }
      
              if (client.readyState === client.OPEN && client.id === ws.id) {
                client.send(mainResponse);
              }
            });
          }
          else if(mainResponseJson.body.code === 201)
          {
            if(gameCount < 9)
            {
              let noticeResponseJson = {
                type: "nextRound",
                body: {
                  [gameroom.masterid]: gameroom.masternumber, 
                  [gameroom.memberid]: gameroom.membernumber, 
                  [gameroom.masterid+"win"]: gameroom.masterwin,
                  [gameroom.memberid+"win"]: gameroom.memberwin,
                  draw: gameroom.draw,
                  gamecount: gameCount,
                  winner: mainResponseJson.body.winner,
                  sender: ws.id,
                }
              }
              let noticeResponse = JSON.stringify(noticeResponseJson);

              let isGameUpdated = await Gameroom.update({
                masternumber: 0,
                membernumber: 0,
              }, {
                where: {id: gameroomid},
              });

              wss.clients.forEach((client) => { // 게임 참여자에게 전송
                if (client.readyState === client.OPEN && client.id === anotherMemberid) {
                  client.send(noticeResponse);
                }
        
                if (client.readyState === client.OPEN && client.id === ws.id) {
                  client.send(noticeResponse);
                }
              });
            }
            else
            {
              let noticeResponseJson = {
                type: "gameEnd",
                body: {
                  [gameroom.masterid]: gameroom.masternumber, 
                  [gameroom.memberid]: gameroom.membernumber, 
                  [gameroom.masterid+"win"]: gameroom.masterwin,
                  [gameroom.memberid+"win"]: gameroom.memberwin,
                  draw: gameroom.draw,
                  gamecount: gameCount,
                  winner: mainResponseJson.body.winner,
                  sender: ws.id,
                }
              }
              let noticeResponse = JSON.stringify(noticeResponseJson);

              let isDelected = await Gameroom.destroy({where: {id: gameroomid}});

              let isUserReadyUpdated = await User.update({
                isready: 0,
              }, {
                where: {id: userid},
              });

              let isAnotherUserReadyUpdated = await User.update({
                isready: 0,
              }, {
                where: {id: anotherMemberid},
              });

              wss.clients.forEach((client) => { // 게임 참여자에게 전송
                if (client.readyState === client.OPEN && client.id === anotherMemberid) {
                  client.send(noticeResponse);
                }
        
                if (client.readyState === client.OPEN && client.id === ws.id) {
                  client.send(noticeResponse);
                }
              });
            }
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


    ws.on('close', async (code) => { // 연결 종료 시
      try {
        console.log('클라이언트 접속 해제');
        
        if (code == 3000) {
          console.log('다시 접속합니다.');
          return;
        }

        let tempRoomRes = await getRoomname(ws.id);
        if (tempRoomRes.code == 200)
        {
          let tempGameRes = await getGameRoomname(tempRoomRes.message);
          if (tempGameRes.code == 200)
          {
            // 게임룸을 없애고, 게임 방에 있는 사람에게 알려주기

            let noticeResponseJson = {
              type: "gameRoomDestroyed"
            }
            let noticeResponse = JSON.stringify(noticeResponseJson);

            let gameroom = await Gameroom.findOne({where: {id: tempGameRes.message}});
            let isDelected = await Gameroom.destroy({where: {id: tempGameRes.message}});  
            
            let isUserReadyUpdated = await User.update({
              isready: 0,
            }, {
              where: {id: gameroom.masterid},
            });

            let isAnotherUserReadyUpdated = await User.update({
              isready: 0,
            }, {
              where: {id: gameroom.memberid},
            });

            wss.clients.forEach((client) => { // 나에게
              if (client.readyState === client.OPEN && client.id !== ws.id && client.id === gameroom.masterid) {
                client.send(noticeResponse);
              }

              if (client.readyState === client.OPEN && client.id !== ws.id && client.id === gameroom.memberid) {
                client.send(noticeResponse);
              }
            });
          }
          else
          {
            // 방을 나가거나, 방을 없애기

            let roomname = tempRoomRes.message;
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
        }
        console.log('클라이언트 접속 해제가 정상적으로 이루어졌습니다.');
      }
      catch {
        console.log('클라이언트 접속 해제가 정상적으로 이루어지지 않았습니다.');
      }
    });
  });
};