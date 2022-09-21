const express = require('express');
const User = require('../models/user');
const {roomList, roomMember} = require('../modules/room_manager');

const router = express.Router();

router.route('/all')
    .get( roomList );

router.route('/:roomid')
    .get( roomMember );


module.exports = router;