const api = require('../../utils/api.js');

Page({
  data: { 
    title: '', 
    desc: '', 
    price: '', 
    images: [],
    isSubmitting: false
  },

  onLoad() {
    console.log('发布页面加载');
    this.checkLoginStatus();
  },

  onUnload() {
    console.log('发布页面卸载');
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '未登录',
        content: '请先登录后再发布商品',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return false;
    }
    return true;
  },

  // 删除图片
  deleteImage(e) {
    const that = this;
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这张图片吗？',
      success: function(res) {
        if (res.confirm) {
          const images = that.data.images;
          images.splice(index, 1);
          
          that.setData({
            images: images
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1000
          });
        }
      }
    });
  },

  // 图片预览
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.images;
    
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  // 输入事件处理
  onTitleInput(e) { 
    this.setData({ title: e.detail.value }); 
  },
  
  onDescInput(e) { 
    this.setData({ desc: e.detail.value }); 
  },
  
  onPriceInput(e) { 
    this.setData({ price: e.detail.value }); 
  },
  
  chooseImage() {
    if (!this.checkLoginStatus()) return;
    
    const that = this;
    const remainingCount = 6 - this.data.images.length;
    
    if (remainingCount <= 0) {
      wx.showToast({
        title: '最多上传6张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseImage({ 
      count: remainingCount, 
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const paths = res.tempFilePaths;
        let uploadCount = 0;
        const totalCount = paths.length;
        
        paths.forEach(fp => {
          const token = wx.getStorageSync('token');
          wx.uploadFile({
            url: api.BASE + '/api/upload/image',
            filePath: fp,
            name: 'image',
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: function(r) {
              uploadCount++;
              try {
                const data = JSON.parse(r.data);
                if (data.url) {
                  that.setData({ 
                    images: that.data.images.concat([data.url]) 
                  });
                  
                  if (uploadCount === totalCount) {
                    wx.showToast({
                      title: '图片上传完成',
                      icon: 'success'
                    });
                  }
                } else {
                  wx.showToast({ title: '上传失败', icon: 'none' });
                }
              } catch (e) {
                wx.showToast({ title: '解析响应失败', icon: 'none' });
              }
            },
            fail() { 
              wx.showToast({ title: '上传失败', icon: 'none' });
              uploadCount++;
            }
          });
        });
      }
    });
  },
  
  // 提交表单
  onSubmit() {
    if (!this.checkLoginStatus()) return;
    
    if (this.data.isSubmitting) return;
    
    // 表单验证
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入商品标题', icon: 'none' });
      return;
    }
    
    if (!this.data.price || parseFloat(this.data.price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }
    
    if (this.data.images.length === 0) {
      wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    const payload = {
      title: this.data.title.trim(),
      description: this.data.desc.trim(),
      price: parseFloat(this.data.price),
      images: this.data.images
    };
    
    console.log('提交数据:', payload);
    
    api.request('/api/items', 'POST', payload)
    .then((res) => {
      console.log('发布成功:', res);
      wx.showToast({ 
        title: '发布成功',
        icon: 'success',
        duration: 2000
      });
      
      // 关键修复：确保设置全局刷新标志
      const app = getApp();
      app.globalData.needRefreshHome = true;
      console.log('设置刷新标志: true');
      
      // 清空表单
      this.setData({
        title: '',
        desc: '',
        price: '',
        images: [],
        isSubmitting: false
      });
      
      // 延迟返回，确保提示信息显示完整
      setTimeout(() => {
        this.navigateBackWithRefresh();
      }, 1500);
    })
    .catch((err) => {
      console.error('发布失败:', err);
      
      if (err.statusCode === 401) {
        wx.showToast({ title: '登录已过期', icon: 'none' });
        wx.removeStorageSync('token');
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/login/login' });
        }, 1500);
      } else {
        const errorMsg = err.data && err.data.message ? err.data.message : '网络错误';
        wx.showToast({ title: '发布失败: ' + errorMsg, icon: 'none' });
      }
      
      this.setData({ isSubmitting: false });
    });
  },

  // 返回并刷新首页
  navigateBackWithRefresh() {
    const app = getApp();
    
    // 方法1: 尝试获取首页实例并直接刷新
    const pages = getCurrentPages();
    let homePageFound = false;
    
    for (let i = pages.length - 1; i >= 0; i--) {
      const page = pages[i];
      // 通过路由路径判断是否是首页
      if (page.route && page.route.includes('index/index')) {
        if (typeof page.manualRefresh === 'function') {
          page.manualRefresh();
          homePageFound = true;
          console.log('直接调用首页刷新方法');
          break;
        }
      }
    }
    
    if (homePageFound) {
      wx.navigateBack();
    } else {
      // 方法2: 使用switchTab回到首页
      console.log('使用switchTab返回首页');
      wx.switchTab({
        url: '/pages/index/index',
        success: () => {
          console.log('成功返回首页');
        },
        fail: (err) => {
          console.error('返回首页失败:', err);
          // 方法3: 备用方案 - 重新加载首页
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      });
    }
  }
});