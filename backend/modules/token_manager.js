const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const e = require('express');

exports.register = async (req, res) => { 
    try {
        let temp = await User.findOne({where : {id: req.body.id}})
        if(temp) {
            return res.status(400).json({
                code: 400,
                error: 'repeatedId',
                message: '이미 존재하는 아이디입니다.',
            });
        }

        temp = await User.findOne({where : {email: req.body.email}})
        if(temp) {
            return res.status(400).json({
                code: 400,
                error: 'repeatedEmail',
                message: '이미 존재하는 이메일입니다.',
            });
        }

        temp = await User.findOne({where : {nickname: req.body.nickname}})
        if(temp) {
            return res.status(400).json({
                code: 400,
                error: 'repeatedNickname',
                message: '이미 존재하는 닉네임입니다.',
            });
        }

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
        return res.status(500).send("예상치 못한 오류입니다! "+err);
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
            return res.status(404).json({
                code: 404,
                error: 'notFoundId',
                message: '등록되지 않은 ID입니다.'
            })
        }
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
        return res.status(401).send({
            code: 401,
            error: 'errorPassword',
            message: "틀린 비밀번호입니다.",
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

    return res.status(200).json({
        code: 200,
        accessToken: token,
    });
};

exports.verifyToken = (req, res, next) => {
    try {
      req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
      return next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') { // 유효기간 초과
        return res.status(419).json({
          code: 419,
          error: 'tokenExpiredError',
          message: '토큰이 만료되었습니다',
        });
      }
      return res.status(401).json({
        code: 401,
        error: 'unauthorizedToken',
        message: '유효하지 않은 토큰입니다',
      });
    }
  };

exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            attributes: ["id", "email", "nickname"],
            where: {
                id: req.decoded.id,
            },
        });

        if(user) {
            return res.status(200).json({
                description: "회원정보",
                content: user,
            });
        }
    } catch (err) {
        return res.status(500).send("예상치 못한 오류입니다! "+err);
    }
}