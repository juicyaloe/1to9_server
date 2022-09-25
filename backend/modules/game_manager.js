const User = require('../models/user');
const Room = require('../models/room');

exports.changeReady = async (id) => {
    try {
        let isUpdated = await User.update({
            myroomid: room.id,
        }, {
            where: {id: id},
        });

        // 방 만들기
        const room = await Room.create({name: roomname});  
        if (room) {
            // 방 만들기 성공
            
    
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