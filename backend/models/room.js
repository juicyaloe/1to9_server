const Sequelize = require('sequelize');

module.exports = class Room extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      name: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Room',
      tableName: 'rooms',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) { 
    db.Room.hasMany(db.User, {foreignKey: 'myroomid', sourceKey: 'id'});
    db.Room.belongsTo(db.Gameroom, {foreignKey: 'gameroomid', targetKey: 'id', onDelete: 'CASCADE'});
  }
};