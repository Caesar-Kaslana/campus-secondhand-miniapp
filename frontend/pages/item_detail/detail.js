const app = getApp()
const api = require('../../utils/api.js')

Page({
  data: {
    itemId: null,
    itemDetail: null,
    loading: true,
    recommendItems: [],
    isFavorite: false,
    currentImageIndex: 0,
    hasRecommendItems: false // 添加是否有推荐商品的标志
  },

  onLoad: function(options) {
    console.log('商品详情页onLoad，接收参数:', options)
    
    if (options.id) {
      this.setData({ 
        itemId: options.id,
        loading: true
      })
      this.loadItemDetail(options.id)
      this.loadRecommendItems(options.id)
    } else {
      wx.showToast({
        title: '商品信息有误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShow: function() {
    console.log('商品详情页onShow')
  },

  onReady: function() {
    console.log('商品详情页onReady')
  },

  onShareAppMessage: function() {
    return {
      title: this.data.itemDetail ? this.data.itemDetail.title || this.data.itemDetail.name : '商品详情',
      path: `/pages/item_detail/detail?id=${this.data.itemId}`,
      imageUrl: this.data.itemDetail && this.data.itemDetail.images ? 
               this.data.itemDetail.images[0] : ''
    }
  },

  onShareTimeline: function() {
    return {
      title: this.data.itemDetail ? this.data.itemDetail.title || this.data.itemDetail.name : '商品详情',
      imageUrl: this.data.itemDetail && this.data.itemDetail.images ? 
               this.data.itemDetail.images[0] : ''
    }
  },

  // 加载商品详情
  loadItemDetail: function(itemId) {
    wx.showLoading({
      title: '加载中...',
    })
    
    api.request(`/api/items/${itemId}`, 'GET')
      .then((res) => {
        console.log('商品详情加载成功:', res)
        const itemDetail = res.data || res
        
        this.setData({
          itemDetail: itemDetail,
          loading: false,
          isFavorite: itemDetail.isFavorite || false
        })
        
        wx.hideLoading()
        
        // 设置页面标题
        if (itemDetail.title || itemDetail.name) {
          wx.setNavigationBarTitle({
            title: itemDetail.title || itemDetail.name
          })
        }
      })
      .catch((err) => {
        console.error('加载商品详情失败:', err)
        this.setData({ loading: false })
        wx.hideLoading()
        wx.showToast({
          title: '加载商品信息失败',
          icon: 'none'
        })
        
        // 3秒后返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 3000)
      })
  },

  // 加载推荐商品
  loadRecommendItems: function(itemId) {
    api.request('/api/items/recommend', 'GET', { 
      itemId: itemId,
      limit: 4 
    })
      .then((res) => {
        console.log('推荐商品加载成功:', res)
        const recommendItems = res.data || res || []
        this.setData({
          recommendItems: recommendItems,
          hasRecommendItems: recommendItems.length > 0 // 设置是否有推荐商品的标志
        })
      })
      .catch((err) => {
        console.error('加载推荐商品失败:', err)
        this.setData({
          hasRecommendItems: false // 加载失败也设置为无推荐商品
        })
      })
  },

  // 预览图片
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url
    const images = this.data.itemDetail.images
    
    if (images && images.length > 0) {
      wx.previewImage({
        urls: images,
        current: url
      })
    }
  },

  // 切换图片
  switchImage: function(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentImageIndex: index
    })
  },

  // 查看推荐商品
  viewRecommendItem: function(e) {
    const itemId = e.currentTarget.dataset.id
    if (itemId) {
      wx.redirectTo({
        url: `/pages/item_detail/detail?id=${itemId}`
      })
    }
  },

  // 联系卖家
  contactSeller: function() {
    if (!this.data.itemDetail) return
    
    const sellerId = this.data.itemDetail.sellerId
    if (sellerId) {
      // 这里可以跳转到聊天页面或者直接打开客服对话
      wx.showToast({
        title: '即将联系卖家',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '无法联系卖家',
        icon: 'none'
      })
    }
  },

  // 加入购物车
  addToCart: function() {
    if (!this.data.itemDetail) return
    
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    // 调用加入购物车API
    api.request('/api/cart/add', 'POST', {
      itemId: this.data.itemId,
      quantity: 1
    })
      .then((res) => {
        wx.showToast({
          title: '已加入购物车',
          icon: 'success'
        })
      })
      .catch((err) => {
        console.error('加入购物车失败:', err)
        wx.showToast({
          title: '加入购物车失败',
          icon: 'none'
        })
      })
  },

  // 立即购买
  buyNow: function() {
    if (!this.data.itemDetail) return
    
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    // 跳转到确认订单页面
    wx.navigateTo({
      url: `/pages/order/confirm?itemId=${this.data.itemId}&quantity=1`
    })
  },

  // 添加到收藏
  toggleFavorite: function() {
    if (!this.data.itemDetail) return
    
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    const method = this.data.isFavorite ? 'DELETE' : 'POST'
    const url = this.data.isFavorite ? 
      `/api/favorites/remove?itemId=${this.data.itemId}` : 
      '/api/favorites/add'
    
    api.request(url, method, {
      itemId: this.data.itemId
    })
      .then((res) => {
        const newStatus = !this.data.isFavorite
        this.setData({
          isFavorite: newStatus
        })
        
        wx.showToast({
          title: newStatus ? '已添加收藏' : '已取消收藏',
          icon: 'success'
        })
      })
      .catch((err) => {
        console.error('收藏操作失败:', err)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      })
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  },

  // 分享
  onShare: function() {
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})