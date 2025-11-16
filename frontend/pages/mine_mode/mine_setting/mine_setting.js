// pages/settings/settings.js
Page({
  // 显示退出确认对话框
  showLogoutConfirm: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.logout()
        }
      }
    })
  },

  // 执行退出登录操作
  logout: function() {
    // 清除用户登录信息
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('hasUserInfo')
    wx.removeStorageSync('token')
    
    // 关键修改：获取页面栈并更新"我的"页面数据
    const pages = getCurrentPages()
    if (pages.length > 1) {
      // 获取上一页（"我的"页面）实例
      const minePage = pages[pages.length - 2]
      // 直接设置"我的"页面的数据为未登录状态
      minePage.setData({
        userInfo: {},
        hasUserInfo: false
      })
    }
    
    // 显示退出成功提示
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500,
      success: () => {
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  }
})