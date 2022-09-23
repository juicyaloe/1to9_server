const Sequelize = require('sequelize');
const User = require('./user');
const Room = require('./room');

const env = process.env.NODE_ENV || 'production';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = User;
db.Room = Room;

User.init(sequelize);
Room.init(sequelize);

User.associate(db);
Room.associate(db);

module.exports = db;