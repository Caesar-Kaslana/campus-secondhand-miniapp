// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', async (req,res)=>{
  try{
    const { username, password, realname, email, school } = req.body;
    if(!username || !password) return res.status(400).json({ error: 'username and password required' });
    const exist = await User.findOne({ where: { username } });
    if(exist) return res.status(400).json({ error: 'username exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, realname, email, school });
    res.json({ id: user.id, username: user.username });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req,res)=>{
  try{
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await User.findOne({ where: { username }});
    if(!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
