const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.route('/')
    .get( async (req, res, next) => {
            try {
                const users = await User.findAll({
                    attributes: ["id", "email", "nickname"],
                });
                res.send(users);
                console.log("aa");
                console.log("ss");
            } catch (err) {
                console.log("error");
                res.send(err);
            }});

module.exports = router;