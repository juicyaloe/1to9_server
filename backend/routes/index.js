const express = require('express');
const User = require('../models/user');

const router = express.Router();

const {roomCreater, roomVisiter, roomLeaver} = require('../modules/room_manager');

router.route('/')
    .get((req, res) => res.status(200).send("정상적인 요청입니다."))

module.exports = router;