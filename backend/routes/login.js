const express = require('express');
const User = require('../models/user');
const {registerm, login, myInformation} = require('../token_controller/modules');

const router = express.Router();

router.route('/')
    .post( myInformation );

module.exports = router;