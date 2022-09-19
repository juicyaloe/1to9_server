const express = require('express');
const User = require('../models/user');
const {register, login, verifyToken, getMyProfile} = require('../modules/token_manager');

const router = express.Router();

router.route('/login')
    .post( login );

router.route('/register')
    .post( register );

router.route('/token')
    .get( verifyToken, getMyProfile );

module.exports = router;