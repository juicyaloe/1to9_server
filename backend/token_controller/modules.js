const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
        const user = await User.create({
            id: req.body.id,
            email: req.body.email,
            nickname: req.body.nickname,
            password: bcrypt.hashSync(req.body.password, 8),
        });       
        if (user) {
            return res.status(201).send("회원가입이 성공했습니다.");
        }
    } catch(err) {
        return res.status(500).send("회원가입이 실패했습니다! "+err);
    }
};

exports.login = async (req, res) => {
    let user = null;
    try {
        user = await User.findOne({
            where: {
                id: req.body.id,
            },
        });
        if(!user) {
            return res.status(404).send("해당 id를 가진 유저는 없습니다.");
        }
    } catch (err) {
        return res.status(500).send("예상치 못한 오류가 발생했습니다! "+err);
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
        return res.status(401).send({
            auth: false,
            accessToken: null,
            reason: "Invalid Password",
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: 86400,
        }
    );

    return res.status(200).send({
        auth: true,
        accessToken: token,
    });
};

exports.myInformation = async (req, res) => {
    try {
        const user = await User.findOne({
            attributes: ["id", "email", "nickname"],
            where: {
                id: req.body.id,
            },
        });

        if(user) {
            return res.status(200).json({
                description: "회원정보 보기",
                content: user,
            });
        }
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
};