const api = require('../../utils/api.js');

Page({
  data: { item: {} },

  onLoad(options) {
    console.log("item.js options =", options);

    const id = options.id;
    if (!id) {
      console.error("未收到 id");
      wx.showToast({ title: "无效商品ID", icon: "none" });
      return;
    }

    api.request(`/api/items/${id}`, 'GET')
      .then(res => {
        console.log("商品详情 =", res);
        this.setData({ item: res });   // ← res 才是 item
      })
      .catch(err => {
        console.error("商品加载失败", err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  }
});