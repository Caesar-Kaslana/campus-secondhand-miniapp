// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req,file,cb)=> cb(null, UPLOAD_DIR),
  filename: (req,file,cb)=> cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/image', upload.single('image'), (req,res)=>{
  if(!req.file) return res.status(400).json({ error: 'no file' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
