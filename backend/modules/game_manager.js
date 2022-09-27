const User = require('../models/user');
const Room = require('../models/room');
const Gameroom = require('../models/gameroom');

exports.changeReady = async (id) => {
    try {
        const user = await User.findOne({where : {id: id}});
        
        if (user.isready == 0)
        { // 준비 완료 누르기
            let isUpdated = await User.update({
                isready: 1,
            }, {
                where: {id: id},
            });

            if (isUpdated == 1)
            {
                return ({
                    code: 201,
                    isready: 'TRUE',
                    message: "준비 완료를 눌렸습니다."});
            }
            else
            {
                return ({
                    code: 500,
                    message: "예상치 못한 오류입니다! "});
            }
        }
        else
        { // 준비 취소하기
            let isUpdated = await User.update({
                isready: 0,
            }, {
                where: {id: id},
            });

            if (isUpdated == 1)
            {
                return ({
                    code: 201,
                    isready: 'FALSE',
                    message: "준비를 취소했습니다."});
            }
            else
            {
                return ({
                    code: 500,
                    message: "예상치 못한 오류입니다! "});
            }
        }
    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.gameStart = async (roomname) => {
    try {
        const room = await Room.findOne({where : {name: roomname}});
        if(room == null) {
            return ({
                code: 404,
                error: 'notFoundRoom',
                message: '없는 방 이름입니다.'});      
        }

        let users = await room.getUsers()
        if (users.length < 2)
        {
            return ({
                code: 400,
                error: 'roomNotFull',
                message: '방이 꽉 차지 않았습니다.'});  
        }

        let canStart = true;
        users.forEach(user => {
            if (user.isready == 0)
            {
                canStart = false;
            }
        });

        if (canStart)
        {
            let masterid = users[0].id;
            let memberid = users[1].id;

            let temp = await Gameroom.findOne({where : {roomname: roomname}});
            if(temp) {
                return ({
                    code: 400,
                    error: 'gameIsStart',
                    message: '게임이 이미 시작했습니다.',
                });
            }

            const gameroom = await Gameroom.create({
                roomname: roomname,
                masterid: masterid,
                memberid: memberid,
            })

            if(gameroom)
            {
                let isUpdated = await Room.update({
                    gameroomid: gameroom.id,
                }, {
                    where: {name: roomname},
                });
    
                return ({
                    code: 201,
                    gameroomid: gameroom.id,
                    masterid: masterid,
                    memberid: memberid,
                    message: "게임을 시작했습니다."});
            };

            return ({
                code: 500,
                message: "예상치 못한 오류입니다! "});
        }
        else
        {
            return ({
                code: 400,
                error: 'noReady',
                message: "전부 준비완료 하지 않았습니다."});
        }
        
    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.gameAction = async (userid, gameroomid, mynumber) => {
    try {
        const gameroom = await Gameroom.findOne({where : {id: gameroomid}});

        if (gameroom == null)
        {
            return ({
                code: 404,
                error: 'notGame',
                message: "현재 게임중이 아닙니다."});
        }
        
        if (gameroom.masterid == userid)
        {
            if (gameroom.masternumber != 0)
            {
                return ({
                    code: 400,
                    error: 'isDone',
                    message: "이미 액션을 진행했습니다."});
            }

            if(mynumber == 0 )
            {
                return ({
                    code: 400,
                    error: 'wrongNumber',
                    message: "잘못된 숫자입니다."});
            }

            let isActionUpdated = await Gameroom.update({
                masternumber: mynumber,
            }, {
                where: {id: gameroomid},
            });

            if (isActionUpdated == 0)
            {
                return ({
                    code: 500,
                    message: "예상치 못한 오류입니다! "});
            }

            if(gameroom.membernumber != 0)
            {
                if (mynumber > gameroom.membernumber)
                {
                    let isGameUpdated = await Gameroom.update({
                        masterwin: gameroom.masterwin+1,
                    }, {
                        where: {id: gameroomid},
                    });
                    
                    return ({
                        code: 201,
                        winner: gameroom.masterid,
                        message: "라운드가 끝났습니다."});
                }
                else if (mynumber < gameroom.membernumber)
                {
                    let isGameUpdated = await Gameroom.update({
                        memberwin: gameroom.memberwin+1,
                    }, {
                        where: {id: gameroomid},
                    });

                    return ({
                        code: 201,
                        winner: gameroom.memberid,
                        message: "라운드가 끝났습니다."});
                }
                else
                {
                    let isGameUpdated = await Gameroom.update({
                        draw: gameroom.draw+1,
                    }, {
                        where: {id: gameroomid},
                    });

                    return ({
                        code: 201,
                        winner: "draw",
                        message: "라운드가 끝났습니다."});
                }
            }

            return ({
                code: 200,
                mynum: mynumber,
                message: "숫자가 정상적으로 제출되었습니다."});

        }
        else if (gameroom.memberid == userid)
        {
            if (gameroom.membernumber != 0)
            {
                return ({
                    code: 400,
                    error: 'isDone',
                    message: "이미 액션을 진행했습니다."});
            }

            if(mynumber == 0 )
            {
                return ({
                    code: 400,
                    error: 'wrongNumber',
                    message: "잘못된 숫자입니다."});
            }

            let isActionUpdated = await Gameroom.update({
                membernumber: mynumber,
            }, {
                where: {id: gameroomid},
            });

            if (isActionUpdated == 0)
            {
                return ({
                    code: 500,
                    message: "예상치 못한 오류입니다! "});
            }

            if(gameroom.masternumber != 0)
            {
                if (mynumber > gameroom.masternumber)
                {
                    let isGameUpdated = await Gameroom.update({
                        memberwin: gameroom.memberwin+1,
                    }, {
                        where: {id: gameroomid},
                    });

                    return ({
                        code: 201,
                        winner: gameroom.memberid,
                        message: "라운드가 끝났습니다."});
                }
                else if (mynumber < gameroom.masternumber)
                {
                    let isGameUpdated = await Gameroom.update({
                        masterwin: gameroom.masterwin+1,
                    }, {
                        where: {id: gameroomid},
                    });
                    
                    return ({
                        code: 201,
                        winner: gameroom.masterid,
                        message: "라운드가 끝났습니다."});   
                }
                else
                {
                    let isGameUpdated = await Gameroom.update({
                        draw: gameroom.draw+1,
                    }, {
                        where: {id: gameroomid},
                    });

                    return ({
                        code: 201,
                        winner: "draw",
                        message: "라운드가 끝났습니다."});
                }
            }

            return ({
                code: 200,
                mynum: mynumber,
                message: "숫자가 정상적으로 제출되었습니다."});

        }
        else
        {
            return ({
                code: 400,
                error: 'notGameMember',
                message: "이 게임의 멤버가 아닙니다."});
        }
        
        
    } catch (err) {
        return ({
            code: 500,
            error: err,
            message: "예상치 못한 오류입니다! "});
    }
}

exports.getGameRoomname = async (roomname) => {
    try {
        const room = await Room.findOne({where : {name: roomname}});
        const gameroom = await Gameroom.findOne({where : {id: room.gameroomid}});
        

        if (gameroom)
        {
            return ({
                code: 200,
                message: gameroom.id});
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
