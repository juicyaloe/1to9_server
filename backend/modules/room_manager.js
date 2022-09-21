const User = require('../models/user');
const Room = require('../models/room');

exports.roomMaker = async (id, roomname) => {
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
            console.log(room);
            let isUpdated = await User.update({
                myroom: room.id,
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

        let isUpdated = await User.update({
            myroom: room.id,
        }, {
            where: {id: id},
        });

        if(isUpdated == 1) {
            return ({
                code: 200,
                message: "방이 정상적으로 들어갔습니다."});
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

exports.roomDestroyer = async (id) => {
    try {
        const user = await User.findOne({where : {id: id}});
        const roomid = user.myroom;
        
        if(roomid == null) {
            return ({
                code: 404,
                error: 'notFoundRoom',
                message: '없는 방 이름입니다.'});  
        }

        Room.destroy({where: {id: roomid}});

        return ({
            code: 200,
            message: '방을 성공적으로 없애고, 나갔습니다.'});  

    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.roomLeaver = async (id) => {
    try {
        let isUpdated = await User.update({
            myroom: null,
        }, {
            where: {id: id},
        });

        if(isUpdated == 1) {
            return ({
                code: 200,
                message: "방에서 나갔습니다."});

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

exports.roomList = async (req, res) => {
    try {
        const rooms = await Room.findAll({})

        return res.status(200).json({
            description: "방 목록",
            content: rooms,
        });
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}

exports.roomMember = async (req, res) => {
    try {
        const roomid = req.params.roomid;

        const users = await User.findAll({
            attributes: ['id', 'email', 'nickname'],
            where: {
              myroom: Number(roomid),
            },
        });

        return res.status(200).json({
            description: "방 참여자",
            content: users,
        });
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}