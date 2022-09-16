const express = require('express');
const path = require('path');
const morgan = require('morgan');

const { sequelize } = require('./models');
const User = require('./models/user');

const webSocket = require('./socket');

const app = express();
app.set('port', process.env.PORT || 8000);

sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  }
);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  console.log(app.get('port'), '번 포트에서 대기중');
});

webSocket(server);