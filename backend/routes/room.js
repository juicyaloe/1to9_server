const express = require('express');
const User = require('../models/user');
const {roomList, roomMember} = require('../modules/room_manager');
const {verifyToken} = require('../modules/token_manager');

const router = express.Router();

router.route('/all')
    .get( verifyToken, roomList );

router.route('/id/:roomid')
    .get( verifyToken, roomMember );

router.route('/name/:roomname')
    .get( verifyToken, roomMember );


module.exports = router;