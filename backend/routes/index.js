const express = require('express');
const User = require('../models/user');

const router = express.Router();

const {roomCreater, roomVisiter, roomLeaver} = require('../modules/room_manager');
const {changeReady, gameStart} = require('../modules/game_manager');

router.route('/')
    .get(async (req, res) => {
        console.log(await gameStart("23"));
        res.status(200).send("정상적인 요청입니다.")
    
    })

module.exports = router;