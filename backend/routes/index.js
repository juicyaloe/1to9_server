const express = require('express');
const User = require('../models/user');

const router = express.Router();

const {roomMaker, roomVisiter, roomLeaver, roomDestroyer} = require('../modules/room_manager');

router.route('/')
    .post( roomDestroyer );

module.exports = router;