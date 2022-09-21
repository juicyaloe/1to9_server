const User = require('../models/user');
const Room = require('../models/room');

async function createRoom (_name) {
    try {
        let temp = await Room.findOne({where : {name: _name}})
        if(temp) {
            return 400;
        }

        const room = await Room.create({name: _name});  
        if (room) {
            return 201;
        }

        return 500;

    } catch (err) {
        return 500;
    }
};

async function enterRoom (_id, _name) {
    try {
        let targetroom = await Room.findOne({where : {name: _name}})
        if(targetroom == null) {
            console.log("방 이름 못찾음");
            return 404;      
        }

        let isUpdated = await User.update({
            myroom: targetroom.id,
        }, {
            where: {id: _id},
        });

        if(isUpdated == 0) {
            return 400;
        }

        return 200;

    } catch (err) {
        return 500;
    }
}

async function destroyRoom (_id) {
    try {
        const user = await User.findOne({where : {id: _id}});
        console.log(user);
        const roomid = user.myroom;
        console.log(roomid);
        
        if(roomid == null) {
            return 404;
        }

        Room.destroy({
            where: {
                id: roomid
            }
        });
        
        return 200;

    } catch (err) {
        return 500;
    }
}

async function leaveRoom (_id) {
    try {
        let isUpdated = await User.update({
            myroom: null,
        }, {
            where: {id: _id},
        });

        if(isUpdated == 0) {
            return 404;
        }

        return 200;

    } catch (err) {
        return 500;
    }
}

exports.roomMaker = async (req, res) => {
    try {
        // userid, roomname
        const {userid, roomname} = req.body;

        let createRoomCode = await createRoom(roomname);
        switch (createRoomCode) {
            case 201:
                break;
            case 400:
                return res.status(400).json({
                    code: 400,
                    error: 'repeatedRoomname',
                    message: '이미 존재하는 방 이름입니다.',
                });
            case 500:
                return res.status(500).send("예상치 못한 오류입니다! ");
        }

        let enterRoomCode = await enterRoom(userid, roomname);
        switch (enterRoomCode) {
            case 200:
                return res.status(201).send("방이 정상적으로 만들어지고, 방에 정상적으로 진입했습니다.");
            case 400:
                return res.status(400).json({
                    code: 400,
                    error: 'isDone',
                    message: '이미 방에 들어와 있는 상태입니다.',
                });
            case 404:
                return res.status(404).json({
                    code: 404,
                    error: 'notFoundRoom',
                    message: '존재하지 않는 방입니다.',
                });
            case 500:
                return res.status(500).send("예상치 못한 오류입니다! ");
        }

        Room.destroy({
            where: {name: roomname},
        });
        return res.status(500).send("예상치 못한 오류입니다! ");

    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}

exports.roomVisiter = async (req, res) => {
    try {
        // userid, roomname
        const {userid, roomname} = req.body;

        let enterRoomCode = await enterRoom(userid, roomname);
        switch (enterRoomCode) {
            case 200:
                return res.status(200).send("방에 정상적으로 진입했습니다.");
            case 400:
                return res.status(400).json({
                    code: 400,
                    error: 'isDone',
                    message: '이미 방에 들어와 있는 상태입니다.',
                });
            case 404:
                return res.status(404).json({
                    code: 404,
                    error: 'notFoundRoom',
                    message: '존재하지 않는 방입니다.',
                });
            case 500:
                return res.status(500).send("예상치 못한 오류입니다! ");
        }

        return res.status(500).send("예상치 못한 오류입니다! ");

    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}

exports.roomDestroyer = async (req, res) => {
    try {
        // userid
        const {userid} = req.body;

        let destroyRoomCode = await destroyRoom(userid);
        switch (destroyRoomCode) {
            case 200:
                return res.status(200).send("방을 없애고, 정상적으로 방에서 나갔습니다.");
            case 404:
                return res.status(404).json({
                    code: 404,
                    error: 'isDone',
                    message: '방에 들어가 있지 않습니다.',
                });
            case 500:
                return res.status(500).send("예상치 못한 오류입니다! ");
        }

        return res.status(500).send("예상치 못한 오류입니다! ");

    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}

exports.roomLeaver = async (req, res) => {
    try {
        // userid
        const {userid} = req.body;

        let leaveRoomCode = await leaveRoom(userid);
        switch (leaveRoomCode) {
            case 200:
                return res.status(200).send("방을 정상적으로 나갔습니다.");
            case 404:
                return res.status(404).json({
                    code: 404,
                    error: 'isDone',
                    message: '방에 들어가 있지 않습니다.',
                });
            case 500:
                return res.status(500).send("예상치 못한 오류입니다! ");
        }

        return res.status(500).send("예상치 못한 오류입니다! ");

    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}