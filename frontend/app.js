App({
  onLaunch: function () {
    console.log('应用启动');
    // 初始化全局数据
    this.globalData = {
      userInfo: null,
      needRefreshHome: false, // 首页需要刷新
      lastPublishTime: 0
    };
  },
  
  onShow: function(options) {
    console.log('应用显示', options);
  },
  
  onHide: function() {
    console.log('应用隐藏');
  },

  globalData: {
    userInfo: null,
    needRefreshHome: false,
    lastPublishTime: 0
  },

  // 设置需要刷新首页的标志
  setNeedRefresh: function(needRefresh) {
    this.globalData.needRefreshHome = needRefresh;
    if (needRefresh) {
      this.globalData.lastPublishTime = Date.now();
    }
    console.log('设置刷新标志:', needRefresh);
  }
});