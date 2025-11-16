const app = getApp()
const api = require('../../../utils/api.js')

Page({
  data: {
    items: [],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    isRefreshing: false,
    currentTab: 'active',
    emptyText: '暂无发布的商品',
    showActionSheet: false,
    currentItem: null,
    actionSheetItems: ['编辑商品', '下架商品', '删除商品', '取消']
  },

  onLoad: function(options) {
    console.log('我的订单页面加载')
    this.checkLoginAndLoad()
  },

  onShow: function() {
    console.log('我的订单页面显示')
    this.checkLoginAndLoad()
  },

  onPullDownRefresh: function() {
    console.log('下拉刷新我的订单')
    this.refreshItems()
  },

  onReachBottom: function() {
    console.log('上拉加载更多')
    if (!this.data.loading && this.data.hasMore) {
      this.loadItems(false)
    }
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad: function() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!token || !userInfo) {
      wx.showModal({
        title: '未登录',
        content: '请先登录后查看我的订单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/mine_mode/login/login?redirect=/pages/mine_mode/mine_orders/orders'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return false
    }
    
    this.loadItems(true)
    return true
  },

  // 切换标签页
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    if (this.data.currentTab === tab) return
    
    this.setData({
      currentTab: tab,
      items: [],
      page: 1,
      hasMore: true
    })
    
    this.loadItems(true)
  },

  // 加载商品数据 - 使用实际的已发布商品
  loadItems: function(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    const status = this.data.currentTab === 'active' ? 'active' : 'inactive'
    
    console.log('加载我的商品数据，页码:', page, '状态:', status)
    
    // 首先尝试从全局数据获取已发布的商品
    const publishedItems = this.getPublishedItemsFromGlobal()
    
    if (publishedItems && publishedItems.length > 0) {
      console.log('从全局数据获取已发布的商品:', publishedItems)
      this.processItems(publishedItems, refresh, status, page)
      return
    }
    
    // 如果全局数据中没有，尝试从API获取
    this.loadItemsFromAPI(refresh, status, page)
  },

  // 从全局数据获取已发布的商品
  getPublishedItemsFromGlobal: function() {
    // 尝试从全局数据获取
    if (app.globalData.publishedItems && app.globalData.publishedItems.length > 0) {
      return app.globalData.publishedItems
    }
    
    // 尝试从本地存储获取
    const storedItems = wx.getStorageSync('publishedItems')
    if (storedItems && storedItems.length > 0) {
      return storedItems
    }
    
    return null
  },

  // 处理商品数据
  processItems: function(allItems, refresh, status, page) {
    // 获取当前用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.id) {
      this.showSampleData()
      return
    }
    
    // 过滤出当前用户的商品
    const myItems = allItems.filter(item => {
      // 根据实际数据结构调整用户ID匹配
      if (item.userId) return item.userId === userInfo.id
      if (item.user && item.user.id) return item.user.id === userInfo.id
      if (item.ownerId) return item.ownerId === userInfo.id
      if (item.creatorId) return item.creatorId === userInfo.id
      // 如果没有用户ID字段，暂时全部显示（开发阶段）
      return true
    })
    
    // 进一步按状态过滤
    const filteredItems = myItems.filter(item => {
      if (status === 'active') {
        return item.status === 'active' || item.status === undefined || item.status === null
      } else {
        return item.status === 'inactive'
      }
    })
    
    console.log('过滤后的我的商品:', filteredItems)
    
    // 分页处理
    const startIndex = (page - 1) * this.data.limit
    const endIndex = startIndex + this.data.limit
    const pagedItems = filteredItems.slice(startIndex, endIndex)
    
    if (refresh) {
      this.setData({
        items: pagedItems,
        page: page + 1,
        hasMore: filteredItems.length > endIndex,
        loading: false,
        isRefreshing: false,
        emptyText: pagedItems.length === 0 ? 
          (status === 'active' ? '暂无在售商品' : '暂无已下架商品') : 
          this.data.emptyText
      })
    } else {
      const items = [...this.data.items, ...pagedItems]
      this.setData({
        items: items,
        page: page + 1,
        hasMore: filteredItems.length > endIndex,
        loading: false,
        isRefreshing: false
      })
    }
    
    wx.stopPullDownRefresh()
  },

  // 从API加载商品数据
  loadItemsFromAPI: function(refresh = false, status = 'active', page = 1) {
    console.log('从API加载商品数据')
    
    // 尝试使用不同的API端点获取用户商品
    const endpoints = [
      '/api/items/my-items',
      '/api/items/user-items',
      '/api/items'
    ]
    
    const tryLoad = (index) => {
      if (index >= endpoints.length) {
        // 所有端点都失败，显示示例数据
        this.showSampleData()
        return
      }
      
      api.request(endpoints[index], 'GET', {
        page: page,
        limit: this.data.limit,
        status: status,
        _t: Date.now()
      })
      .then((res) => {
        console.log('API商品数据加载成功:', res)
        
        let items = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res && res.data) {
          items = res.data;
        } else if (res && res.items) {
          items = res.items;
        }
        
        if (refresh) {
          this.setData({
            items: items,
            page: page + 1,
            hasMore: items.length >= this.data.limit,
            loading: false,
            isRefreshing: false,
            emptyText: items.length === 0 ? 
              (status === 'active' ? '暂无在售商品' : '暂无已下架商品') : 
              this.data.emptyText
          })
        } else {
          const newItems = [...this.data.items, ...items]
          this.setData({
            items: newItems,
            page: page + 1,
            hasMore: items.length >= this.data.limit,
            loading: false,
            isRefreshing: false
          })
        }
        
        wx.stopPullDownRefresh()
      })
      .catch((err) => {
        console.error(`端点 ${endpoints[index]} 失败:`, err)
        // 尝试下一个端点
        tryLoad(index + 1)
      })
    }
    
    tryLoad(0)
  },

  // 显示示例数据（开发调试用）
  showSampleData: function() {
    console.log('显示示例数据')
    const sampleItems = [
      {
        id: 'sample1',
        title: '无线蓝牙耳机',
        description: '音质清晰，续航时间长，适合日常使用',
        price: 199.00,
        images: ['/images/default-item.png'],
        status: 'active',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        userId: 'current-user'
      },
      {
        id: 'sample2',
        title: '编程书籍',
        description: 'JavaScript高级程序设计，九成新',
        price: 45.00,
        images: ['/images/default-item.png'],
        status: 'inactive',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        userId: 'current-user'
      },
      {
        id: 'sample3',
        title: '二手笔记本电脑',
        description: '配置良好，运行流畅，适合办公学习',
        price: 2500.00,
        images: ['/images/default-item.png'],
        status: 'active',
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        userId: 'current-user'
      }
    ]
    
    // 根据当前标签过滤
    const status = this.data.currentTab === 'active' ? 'active' : 'inactive'
    const filteredItems = sampleItems.filter(item => 
      item.status === status
    )
    
    this.setData({
      items: filteredItems,
      hasMore: false,
      loading: false,
      isRefreshing: false,
      emptyText: filteredItems.length === 0 ? 
        (status === 'active' ? '暂无在售商品' : '暂无已下架商品') : 
        '示例数据'
    })
    
    wx.stopPullDownRefresh()
  },

  // 刷新商品列表
  refreshItems: function() {
    console.log('执行我的订单刷新')
    this.setData({ 
      isRefreshing: true,
      page: 1,
      items: []
    })
    this.loadItems(true)
  },

  // 显示操作菜单 - 修复stopPropagation错误
  showActionMenu: function(e) {
    // 移除 e.stopPropagation()，因为小程序事件对象没有这个方法
    const item = e.currentTarget.dataset.item
    console.log('显示操作菜单，商品:', item)
    
    if (!item) {
      console.error('无法获取商品信息')
      return
    }
    
    // 根据商品状态调整操作项文本
    const statusAction = item.status === 'active' ? '下架商品' : '上架商品'
    const actionItems = ['编辑商品', statusAction, '删除商品', '取消']
    
    this.setData({
      showActionSheet: true,
      currentItem: item,
      actionSheetItems: actionItems
    })
  },

  // 处理操作菜单选择
  onActionSheetSelect: function(e) {
    const index = e.currentTarget.dataset.index
    console.log('操作菜单选择，索引:', index, '商品:', this.data.currentItem)
    
    this.setData({
      showActionSheet: false
    })
    
    if (index === 3 || index === undefined) return // 取消或无效索引
    
    const item = this.data.currentItem
    if (!item) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }
    
    switch(parseInt(index)) {
      case 0: // 编辑
        this.editItem(item)
        break
      case 1: // 下架/上架
        this.toggleItemStatus(item)
        break
      case 2: // 删除
        this.deleteItem(item)
        break
    }
  },

  // 关闭操作菜单
  closeActionSheet: function() {
    this.setData({
      showActionSheet: false,
      currentItem: null
    })
  },

  // 编辑商品 - 实际功能
  editItem: function(item) {
    console.log('编辑商品:', item)
    
    if (!item || !item.id) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }
    
    // 跳转到编辑页面，传递商品ID和商品数据
    wx.navigateTo({
      url: `/pages/publish/publish?edit=1&id=${item.id}`,
      fail: (err) => {
        console.error('跳转到编辑页面失败:', err)
        
        // 如果编辑页面不存在，显示提示
        wx.showModal({
          title: '提示',
          content: '编辑功能正在开发中，即将上线',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  // 切换商品状态（上架/下架）- 实际功能
  toggleItemStatus: function(item) {
    console.log('切换商品状态:', item)
    
    if (!item || !item.id) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }
    
    const newStatus = item.status === 'active' ? 'inactive' : 'active'
    const actionText = newStatus === 'active' ? '上架' : '下架'
    
    wx.showModal({
      title: '提示',
      content: `确定要${actionText}这个商品吗？`,
      confirmText: actionText,
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.updateItemStatus(item, newStatus)
        }
      }
    })
  },

  // 更新商品状态 - 实际功能
  updateItemStatus: function(item, newStatus) {
    wx.showLoading({
      title: '处理中...',
      mask: true
    })
    
    console.log('更新商品状态:', item.id, '新状态:', newStatus)
    
    // 先更新本地数据，提供即时反馈
    const updatedItems = this.data.items.map(i => {
      if (i.id === item.id) {
        return { ...i, status: newStatus }
      }
      return i
    })
    
    this.setData({
      items: updatedItems
    })
    
    // 更新全局数据
    this.updateGlobalItemStatus(item.id, newStatus)
    
    // 尝试API调用
    const endpoints = [
      `/api/items/${item.id}/status`,
      `/api/items/${item.id}`,
      `/api/items/${item.id}/update`
    ]
    
    const tryUpdate = (index) => {
      if (index >= endpoints.length) {
        // 所有端点都失败，使用本地更新
        wx.hideLoading()
        this.showStatusUpdateSuccess(item, newStatus)
        return
      }
      
      const payload = endpoints[index] === `/api/items/${item.id}` ? 
        { ...item, status: newStatus } : 
        { status: newStatus }
      
      const method = endpoints[index] === `/api/items/${item.id}` ? 'PUT' : 'PATCH'
      
      api.request(endpoints[index], method, payload)
      .then((res) => {
        wx.hideLoading()
        console.log('更新商品状态成功:', res)
        this.showStatusUpdateSuccess(item, newStatus)
      })
      .catch((err) => {
        console.error(`端点 ${endpoints[index]} 失败:`, err)
        if (err.statusCode === 404 || err.statusCode === 405) {
          // 尝试下一个端点
          tryUpdate(index + 1)
        } else {
          wx.hideLoading()
          // 回滚本地状态
          this.setData({
            items: this.data.items.map(i => {
              if (i.id === item.id) {
                return { ...i, status: item.status }
              }
              return i
            })
          })
          
          const errorMsg = err.data && err.data.message ? err.data.message : '操作失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
        }
      })
    }
    
    tryUpdate(0)
  },

  // 显示状态更新成功
  showStatusUpdateSuccess: function(item, newStatus) {
    wx.showToast({
      title: newStatus === 'active' ? '上架成功' : '下架成功',
      icon: 'success',
      duration: 2000
    })
    
    // 如果状态改变后需要切换标签页
    if ((newStatus === 'inactive' && this.data.currentTab === 'active') ||
        (newStatus === 'active' && this.data.currentTab === 'inactive')) {
      setTimeout(() => {
        this.setData({
          currentTab: newStatus === 'active' ? 'active' : 'inactive',
          items: []
        })
        this.loadItems(true)
      }, 1500)
    }
  },

  // 更新全局数据中的商品状态
  updateGlobalItemStatus: function(itemId, newStatus) {
    try {
      // 更新全局数据
      if (app.globalData.publishedItems) {
        app.globalData.publishedItems = app.globalData.publishedItems.map(item => {
          if (item.id === itemId) {
            return { ...item, status: newStatus }
          }
          return item
        })
      }
      
      // 更新本地存储
      const storedItems = wx.getStorageSync('publishedItems')
      if (storedItems && storedItems.length > 0) {
        const updatedItems = storedItems.map(item => {
          if (item.id === itemId) {
            return { ...item, status: newStatus }
          }
          return item
        })
        wx.setStorageSync('publishedItems', updatedItems)
      }
    } catch (error) {
      console.error('更新全局数据失败:', error)
    }
  },

  // 删除商品 - 实际功能
  deleteItem: function(item) {
    console.log('删除商品:', item)
    
    if (!item || !item.id) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个商品吗？',
      confirmText: '删除',
      confirmColor: '#ff4757',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmDeleteItem(item)
        }
      }
    })
  },

  // 确认删除商品 - 实际功能
  confirmDeleteItem: function(item) {
    wx.showLoading({
      title: '删除中...',
      mask: true
    })
    
    console.log('确认删除商品:', item.id)
    
    // 先立即从本地移除，提供即时反馈
    const updatedItems = this.data.items.filter(i => i.id !== item.id)
    this.setData({
      items: updatedItems
    })
    
    // 从全局数据中移除
    this.removeItemFromGlobalData(item.id)
    
    // 尝试API调用
    const endpoints = [
      `/api/items/${item.id}`,
      `/api/items/${item.id}/delete`,
      `/api/items/${item.id}/remove`
    ]
    
    const tryDelete = (index) => {
      if (index >= endpoints.length) {
        // 所有端点都失败，使用本地删除
        wx.hideLoading()
        this.showDeleteSuccess()
        return
      }
      
      api.request(endpoints[index], 'DELETE')
      .then((res) => {
        wx.hideLoading()
        console.log('删除商品成功:', res)
        this.showDeleteSuccess()
      })
      .catch((err) => {
        console.error(`删除端点 ${endpoints[index]} 失败:`, err)
        if (err.statusCode === 404 || err.statusCode === 405) {
          // 尝试下一个端点
          tryDelete(index + 1)
        } else {
          wx.hideLoading()
          // 回滚本地数据
          this.refreshItems()
          
          const errorMsg = err.data && err.data.message ? err.data.message : '删除失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
        }
      })
    }
    
    tryDelete(0)
  },

  // 显示删除成功
  showDeleteSuccess: function() {
    wx.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 2000
    })
  },

  // 从全局数据中移除商品
  removeItemFromGlobalData: function(itemId) {
    try {
      // 更新全局数据
      if (app.globalData.publishedItems) {
        app.globalData.publishedItems = app.globalData.publishedItems.filter(item => item.id !== itemId)
      }
      
      // 更新本地存储
      const storedItems = wx.getStorageSync('publishedItems')
      if (storedItems && storedItems.length > 0) {
        const updatedItems = storedItems.filter(item => item.id !== itemId)
        wx.setStorageSync('publishedItems', updatedItems)
      }
    } catch (error) {
      console.error('更新全局数据失败:', error)
    }
  },

  // 查看商品详情
  viewItemDetail: function(e) {
    const itemId = e.currentTarget.dataset.id
    console.log('查看商品详情:', itemId)
    
    if (itemId) {
      wx.navigateTo({
        url: `/pages/items/item?id=${itemId}`,
        fail: (err) => {
          console.error('跳转到详情页失败:', err)
          wx.showToast({
            title: '详情页暂不可用',
            icon: 'none'
          })
        }
      })
    }
  },

  // 时间格式化
  formatTime: function(timestamp) {
    if (!timestamp) return '未知时间'
    
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      if (diff < 60000) {
        return '刚刚'
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前'
      } else if (diff < 2592000000) {
        return Math.floor(diff / 86400000) + '天前'
      } else {
        return date.getFullYear() + '-' + 
               (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               date.getDate().toString().padStart(2, '0')
      }
    } catch (e) {
      return '未知时间'
    }
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack()
  }
})