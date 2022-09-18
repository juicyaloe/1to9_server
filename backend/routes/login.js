const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.route('/')
    .post( async (req, res, next) => {
        const {id, password} = req.body;
        res.send({id, password});  
        console.log("ds");      
    });

module.exports = router;