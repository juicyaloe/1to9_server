const User = require('../models/user');
const Room = require('../models/room');

exports.roomCreater = async (id, roomname) => {
    try {
        // 방이 이미 있는지 검사
        let temp = await Room.findOne({where : {name: roomname}});
        if(temp) {
            return ({
                code: 400,
                error: 'repeatedRoomname',
                message: '이미 존재하는 방 이름입니다.'});
        }

        // 방 만들기
        const room = await Room.create({name: roomname});  
        if (room) {
            // 방 만들기 성공
            let isUpdated = await User.update({
                myroomid: room.id,
            }, {
                where: {id: id},
            });
    
            return ({
                code: 201,
                message: "방이 정상적으로 잘 만들어졌고, 들어갔습니다."});
            
        }  

        return ({
            code: 500,
            error: "failCreateRoom",
            message: "방 만들기에 실패했습니다"});

    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.roomVisitor = async (id, roomname) => {
    try {
        let room = await Room.findOne({where : {name: roomname}})
        if(room == null) {
            return ({
                code: 404,
                error: 'notFoundRoom',
                message: '없는 방 이름입니다.'});      
        }

        let users = await room.getUsers()
        if (users.length >= 2)
        {
            return ({
                code: 403,
                error: 'RoomFull',
                message: '방이 꽉 찼습니다.'});  
        }

        let isUpdated = await User.update({
            myroomid: room.id,
        }, {
            where: {id: id},
        });

        if(isUpdated == 1) {
            return ({
                code: 200,
                message: "방에 정상적으로 들어갔습니다."});
        } else {
            return ({
                code: 400,
                error: 'isDone',
                message: '이미 방에 들어와 있는 상태입니다.'});
        }

    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.roomLeaver = async (id, roomname) => {
    try {
        const user = await User.findOne({where : {id: id}});
        const room = await Room.findOne({
            include: [{
            model: User,
          }],
          where : {name: roomname}
        });

        if(room == null) {
            return ({
                code: 404,
                error: 'notFoundRoom',
                message: '없는 방 이름입니다.'});  
        }

        if(room.id !== user.myroomid) {
            return ({
                code: 400,
                error: 'noAccess',
                message: '그 유저는 해당 방에 없습니다.'});  
        }

        const roomMember = room.Users.length;
        
        let isUpdated = await User.update({
            myroomid: null,
        }, {
            where: {id: id},
        });

        if(isUpdated == 1) {

            if (roomMember == 1) {
                let isDelected = await Room.destroy({where: {name: roomname}});

                if (isDelected == 1) {
                    return ({
                        code: 204,
                        message: "방에서 나갔고, 방에 아무도 없어 방이 삭제되었습니다."});
                } else {
                    return ({
                        code: 202,
                        message: "방에서 나갔지만, 오류로 방이 삭제되지 않았습니다."});
                }

            } else {
                return ({
                    code: 200,
                    message: "방에서 나갔습니다."});
            }

        } else {
            return ({
                code: 400,
                error: 'isDone',
                message: '이미 방에 나왔습니다.'});
        }

    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.getRoomname = async (id) => {
    try {
        const user = await User.findOne({where : {id: id}});
        const room = await Room.findOne({where : {id: user.myroomid}});

        if (room)
        {
            return ({
                code: 200,
                message: room.name});
        }
        else
        {
            return ({
                code: 404,
                message: ""});
        }

    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.roomList = async (req, res) => {
    try {
        const rooms = await Room.findAll({})

        return res.status(200).json({
            description: "방 목록",
            contents: rooms,
        });
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}

exports.roomMember = async (req, res) => {
    try {
        const type = req.url.split('/')[1];
        
        let roomid = "";
        let roomname = "";
        let room;

        if (type === "id") {
            roomid = req.params.roomid;
            room = await Room.findOne({where : {id: Number(roomid)}});
            
            if(room === null) {
                return res.status(404).json({
                    code: 404,
                    error: 'notFoundRoom',
                    message: '해당 아이디의 방은 없습니다.',
                  });
            }
        }
        else {
            roomname = req.params.roomname;
            room = await Room.findOne({where : {name: roomname}});

            if(room === null) {
                return res.status(404).json({
                    code: 404,
                    error: 'notFoundRoom',
                    message: '해당 이름의 방은 없습니다.',
                  });
            }
        }

        let users = await User.findAll({
            attributes: ['id', 'email', 'nickname'],
            where: {
              myroomid: room.id,
            },
        });

        return res.status(200).json({
            description: "방 참여자",
            contents: users,
        });
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}