const Sequelize = require('sequelize');

module.exports = class Gameroom extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        roomname: {
            type: Sequelize.STRING(40),
            allowNull: false,
            unique: true,
        },
        masterid: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true,
        },
        memberid: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true,
        },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Gameroom',
      tableName: 'gamerooms',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Gameroom.hasOne(db.Room, {foreignKey: 'gameroomid', sourceKey: 'id'});
  }
};