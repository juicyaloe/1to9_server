// import package
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const morgan = require('morgan');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config();

// import db
const { sequelize } = require('./models');
const User = require('./models/user');

// import socket
const webSocket = require('./socket');

// app start
const app = express();
app.set('port', process.env.PORT || 8000);

// db connect
sequelize.sync({ force: false })
  .then(() => {
    console.log('db connect ok');
  })
  .catch((err) => {
    console.log('db connect error');
    console.error(err);
  }
);

// initialize setting
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser(process.env.COOKIE_SECRET));
// app.use(session({
//   resave: false,
//   saveUninitialized: false,
//   secret: process.env.COOKIE_SECRET,
//   cookie: {
//     httpOnly: true,
//     secure: false,
//   },
// }));

// routes
app.use('/api/', async (req, res) => {
    try {
        const users = await User.findAll({});
        res.send(users);
      }
    catch (err) {
        res.send("에러");
    }
});

app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.send('error');
});

const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), 'port waiting...');
});

webSocket(server);