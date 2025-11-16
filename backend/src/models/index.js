// backend/src/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: false
    }
  }
);

// User model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  realname: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(100) },
  school: { type: DataTypes.STRING(100) },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
}, {
  tableName: 'users'
});

// Item model
const Item = sequelize.define('Item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10,2) },
  images: { type: DataTypes.TEXT }, // JSON string
  category: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.ENUM('available','reserved','sold'), defaultValue: 'available' },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
}, {
  tableName: 'items'
});

// Simple Chat model (optional)
const Chat = sequelize.define('Chat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  from_user: DataTypes.INTEGER,
  to_user: DataTypes.INTEGER,
  item_id: DataTypes.INTEGER,
  message: DataTypes.TEXT,
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
}, { tableName: 'chats' });

User.hasMany(Item, { foreignKey: 'user_id' });
Item.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Item, Chat };
