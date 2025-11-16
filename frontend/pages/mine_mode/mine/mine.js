const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    currentTab: 2 // 我的页面对应第三个tab，索引为2
  },

  onLoad: function(options) {
    this.checkLoginStatus()
  },

  onShow: function() {
    // 确保每次页面显示时都重新检查登录状态
    this.checkLoginStatus(true)
    // 设置当前tab为我的页面
    this.setData({ currentTab: 2 })
  },

  // 增强的检查登录状态函数
  checkLoginStatus: function(forceRefresh = false) {
    if (forceRefresh) {
      // 强制清空data中的数据，重新从存储读取
      this.setData({
        userInfo: {},
        hasUserInfo: false
      })
    }
    
    const userInfo = wx.getStorageSync('userInfo')
    const hasUserInfo = wx.getStorageSync('hasUserInfo')
    
    console.log('检查登录状态:', {userInfo, hasUserInfo})
    
    if (userInfo && hasUserInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    } else {
      // 明确设置为未登录状态
      this.setData({
        userInfo: {},
        hasUserInfo: false
      })
    }
  },

  // 底部导航栏切换 - 修复版本
  switchTab: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    console.log('点击底部导航栏，索引:', index);
    
    this.setData({
      currentTab: index
    });
    
    // 根据索引跳转到不同页面
    switch(index) {
      case 0: // 首页
        this.goToHomePage();
        break;
      case 1: // 发布
        this.goToPublishPage();
        break;
      case 2: // 我的（当前页面）
        // 已经在我的页面，不需要跳转
        console.log('已在我的页面');
        break;
    }
  },

  // 跳转到首页 - 修复版本
  goToHomePage: function() {
    console.log('跳转到首页');
    
    // 先尝试获取当前页面栈信息
    const pages = getCurrentPages();
    console.log('当前页面栈:', pages.map(p => p.route));
    
    // 多种跳转方式尝试，确保能跳转到首页
    try {
      // 方式1：尝试使用 switchTab（如果首页是tabBar页面）
      wx.switchTab({
        url: '/pages/index/index1',
        success: (res) => {
          console.log('switchTab跳转首页成功');
        },
        fail: (err) => {
          console.error('switchTab跳转失败:', err);
          // 方式2：如果switchTab失败，使用reLaunch
          wx.reLaunch({
            url: '/pages/index/index1',
            success: (res) => {
              console.log('reLaunch跳转首页成功');
            },
            fail: (err2) => {
              console.error('reLaunch跳转失败:', err2);
              // 方式3：如果都失败，使用navigateBack到首页
              this.tryNavigateBackToHome();
            }
          });
        }
      });
    } catch (error) {
      console.error('跳转首页异常:', error);
      // 最终尝试：直接使用navigateTo
      wx.navigateTo({
        url: '/pages/index/index'
      });
    }
  },

  // 尝试返回首页
  tryNavigateBackToHome: function() {
    const pages = getCurrentPages();
    // 查找页面栈中是否有首页
    const homePageIndex = pages.findIndex(p => p.route.includes('index/index'));
    
    if (homePageIndex > -1) {
      // 如果页面栈中有首页，计算需要返回的步数
      const delta = pages.length - 1 - homePageIndex;
      wx.navigateBack({
        delta: delta
      });
    } else {
      // 如果页面栈中没有首页，重新启动到首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  // 跳转到发布页面
  goToPublishPage: function() {
    console.log('跳转到发布页面');
    wx.navigateTo({
      url: '/pages/publish/publish',
      success: (res) => {
        console.log('跳转到发布页面成功');
      },
      fail: (err) => {
        console.error('跳转到发布页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 页面跳转函数（原有功能保持不变）
  navigateTo: function(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    
    console.log('跳转路径:', url)
    
    // 需要登录的页面检查
    const needLoginPages = [
      '/pages/mine_mode/mine_orders/orders', 
      '/pages/favorite/favorite', 
      '/pages/address/address'
    ]
    const needLogin = needLoginPages.some(page => url.includes(page))
    
    if (needLogin && !this.data.hasUserInfo) {
      wx.showModal({
        title: '提示',
        content: '此功能需要登录后使用',
        confirmText: '去登录',
        cancelText: '再逛逛',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ 
              url: `/pages/mine_mode/login/login?redirect=${encodeURIComponent(url)}`
            });
          }
        }
      });
      return;
    }
    
    // 特殊处理订单页面跳转
    if (url.includes('/pages/mine_mode/mine_orders/orders')) {
      this.navigateToOrderList(url);
      return;
    }
    
    // 如果是登录页面，直接跳转
    if (url.includes('/pages/mine_mode/login/login')) {
      wx.navigateTo({
        url: url
      });
      return;
    }
    
    // 其他页面正常跳转
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('跳转成功:', url);
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 专门处理跳转到我的订单页面
  navigateToOrderList: function(url) {
    if (!this.data.hasUserInfo) {
      wx.showModal({
        title: '提示',
        content: '查看订单需要先登录',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/mine_mode/login/login?redirect=${encodeURIComponent(url)}`
            });
          }
        }
      });
      return;
    }
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('成功跳转到订单页面');
      },
      fail: (err) => {
        console.error('跳转到订单页面失败:', err);
        wx.redirectTo({
          url: url
        });
      }
    });
  },

  // 跳转到登录页面
  navigateToLogin: function() {
    wx.navigateTo({
      url: '/pages/mine_mode/login/login'
    });
  },

  // 跳转到设置页面
  navigateToSettings: function(e) {
    console.log('设置事件被触发', e);
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url: url
      });
    } else {
      wx.navigateTo({
        url: '/pages/mine_mode/mine_setting/mine_setting'
      });
    }
  },

  // 联系客服
  contactCustomerService: function() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      success: () => {
        console.log('拨打客服电话成功');
      },
      fail: (err) => {
        console.error('拨打客服电话失败:', err);
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        });
      }
    })
  }
})
