// backend/src/routes/items.js
const express = require('express');
const router = express.Router();
const { Item, User } = require('../models');
const auth = require('../middleware/auth');

// create item (auth)
router.post('/', auth, async (req,res)=>{
  try{
    const { title, description, price, images, category } = req.body;
    if(!title) return res.status(400).json({ error: 'title required' });
    const item = await Item.create({
      user_id: req.user.id,
      title, description, price,
      images: images ? JSON.stringify(images) : JSON.stringify([]),
      category
    });
    res.json(item);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// list items
router.get('/', async (req,res)=>{
  try{
    const items = await Item.findAll({
      order: [['created_at','DESC']],
      limit: 100
    });
    const result = items.map(i => {
      const obj = i.toJSON();
      try{ obj.images = JSON.parse(obj.images||'[]'); }catch(e){ obj.images=[]; }
      return obj;
    });
    res.json(result);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// get single item
router.get('/:id', async (req,res)=>{
  try{
    const item = await Item.findByPk(req.params.id);
    if(!item) return res.status(404).json({ error: 'not found' });
    const obj = item.toJSON();
    try{ obj.images = JSON.parse(obj.images||'[]'); }catch(e){ obj.images=[]; }
    res.json(obj);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;


// 删除一个商品
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: 'Delete failed' });
  }
});