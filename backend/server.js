// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { sequelize } = require('./src/models'); // sequelize instance and model init
const authRouter = require('./src/routes/auth');
const itemsRouter = require('./src/routes/items');
const uploadRouter = require('./src/routes/upload');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/upload', uploadRouter);

app.get('/', (req, res) => res.json({ msg: 'backend up' }));

const PORT = process.env.PORT || 3000;

async function start(){
  try{
    await sequelize.sync(); // 创建表（开发时）
    app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
  }catch(err){
    console.error('Start error', err);
  }
}
start();
