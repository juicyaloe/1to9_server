const express = require('express');
const User = require('../models/user');

const router = express.Router();

const {roomCreater, roomVisiter, roomLeaver} = require('../modules/room_manager');

router.route('/')
    //.post(roomCreater);

module.exports = router;