const app = getApp()
const api = require('../../utils/api.js');

Page({
  data: {
    currentTab: 0,
    items: [],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    isRefreshing: false,
    lastRefreshTime: 0,
    searchKeyword: '', // 添加搜索关键词
    isTransitioning: false // 添加页面切换状态
  },

  onLoad: function(options) {
    console.log('首页onLoad');
    this.setData({ currentTab: 0 });
    this.loadItems(true);
  },

  onShow() { 
    console.log('首页onShow');
    this.setData({ currentTab: 0, isTransitioning: false });
    
    if (typeof this.resetPageAnimation === 'function') {
      this.resetPageAnimation();
    }

    this.immediateRefreshCheck();
  },

  resetPageAnimation: function() {
    this.setData({ pageAnimation: null });
  },

  onPullDownRefresh: function() {
    console.log('下拉刷新');
    this.refreshItems();
  },

  onReachBottom: function() {
    console.log('上拉加载更多');
    if (!this.data.loading && this.data.hasMore) {
      this.loadItems(false);
    }
  },
  

  // 切换tab（首页）（禁止修改）
  switchTab: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      currentTab: index
    });
    
    console.log('切换到首页');
  },

  // 前往发布页面（禁止修改）
  goToPublish: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      currentTab: index
    });
    
    wx.navigateTo({
      url: '/pages/publish/publish',
      success: () => {
        console.log('跳转到发布页面成功');
      },
      fail: (err) => {
        console.error('跳转到发布页面失败:', err);
      }
    });
  },

  // 前往我的页面 - 修改跳转动画
  goToMine: function(e) {
    if (this.data.isTransitioning) return; // 防止重复点击
    
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      currentTab: index,
      isTransitioning: true // 开始切换动画
    });
    
    console.log('跳转到我的页面，开始动画');
    
    // 添加页面切换动画效果
    this.startPageTransition(() => {
      // 动画完成后执行跳转
      wx.navigateTo({
        url: '/pages/mine_mode/mine/mine',
        success: () => {
          console.log('跳转到我的页面成功');
          this.setData({ isTransitioning: false });
        },
        fail: (err) => {
          console.error('跳转到我的页面失败:', err);
          this.setData({ isTransitioning: false });
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    });
  },

  // 页面切换动画效果
  startPageTransition: function(callback) {
    // 创建动画实例
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
      delay: 0
    });
    
    // 执行淡出动画
    animation.opacity(0.7).scale(0.95).step();
    
    this.setData({
      pageAnimation: animation.export()
    });
    
    // 动画完成后执行回调
    setTimeout(() => {
      if (callback) callback();
    }, 250);
  },

  // 加载商品数据
  loadItems: function(refresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    const page = refresh ? 1 : this.data.page;
    const timestamp = Date.now();
    
    console.log('开始加载商品数据，页码:', page, '刷新:', refresh);
    
    // 构建请求参数
    const params = {
      page: page,
      limit: this.data.limit,
      sort: 'createdAt',
      order: 'desc',
      _t: timestamp
    };
    
    // 如果有搜索关键词，添加到参数中
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword;
    }
    
    api.request('/api/items', 'GET', params)
    .then((res) => {
      console.log('商品数据加载成功:', res);
      const newItems = res.data || res || []; // 兼容两种响应格式
      const items = refresh ? newItems : [...this.data.items, ...newItems];
      
      this.setData({
        items: items,
        page: page + 1,
        hasMore: newItems.length >= this.data.limit,
        loading: false,
        isRefreshing: false
      });
      
      wx.stopPullDownRefresh();
      
      if (refresh && newItems.length > 0) {
        wx.showToast({
          title: `已更新${newItems.length}条内容`,
          icon: 'success',
          duration: 1500
        });
      }
    })
    .catch((err) => {
      console.error('加载商品失败:', err);
      this.setData({ 
        loading: false,
        isRefreshing: false
      });
      wx.stopPullDownRefresh();
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 刷新商品列表
  refreshItems: function() {
    console.log('执行首页刷新');
    this.setData({ 
      isRefreshing: true, 
      page: 1,
      items: [] // 清空现有数据
    });
    this.loadItems(true);
  },

  // 立即检查刷新
  immediateRefreshCheck: function() {
    const app = getApp();
    console.log('检查刷新标志:', app.globalData.needRefreshHome);
    
    if (app.globalData.needRefreshHome) {
      console.log('检测到需要刷新，执行刷新操作');
      app.globalData.needRefreshHome = false;
      // 延迟一下确保页面渲染完成
      setTimeout(() => {
        this.refreshItems();
      }, 500);
    }
  },

  // 手动触发刷新
  manualRefresh: function() {
    this.refreshItems();
  },

  // 查看商品详情 - 修改了跳转路径
  viewItemDetail: function(e) {
    const itemId = e.currentTarget.dataset.id;
    if (itemId) {
      // 修改路径为 /pages/item_detail/detail
      wx.navigateTo({
        url: `/pages/item_detail/detail?id=${itemId}`
      });
    }
  },

  // 商品点击事件处理函数
  onItemTap: function(e) {
    // 从事件对象中获取商品ID
    const itemId = e.currentTarget.dataset.id;
    console.log('点击的商品ID:', itemId);
    
    if (itemId) {
      // 跳转到商品详情页
      wx.navigateTo({
        url: `/pages/item_detail/detail?id=${itemId}`
      });
    } else {
      console.error('商品ID不存在，无法跳转');
      wx.showToast({
        title: '商品信息有误',
        icon: 'none'
      });
    }
  },

  // 搜索输入处理
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 可以添加防抖处理，避免频繁请求
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      if (keyword) {
        this.refreshItems(); // 使用搜索关键词刷新列表
      }
    }, 500);
  },

  // 清除搜索
  clearSearch: function() {
    this.setData({
      searchKeyword: ''
    });
    this.refreshItems();
  }
})