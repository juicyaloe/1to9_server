const express = require('express');
const User = require('../models/user');
const {register, login, myInformation} = require('../modules/token_manager');

const router = express.Router();

router.route('/')
    .post( login );

module.exports = router;