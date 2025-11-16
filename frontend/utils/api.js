const BASE = 'http://localhost:3000';

function request(url, method, data) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    console.log(`API请求: ${method} ${url}`, data);
    
    wx.request({
      url: BASE + url,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        console.log(`API响应: ${res.statusCode}`, res.data);
        if (res.statusCode === 401) {
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          wx.removeStorageSync('token');
          wx.navigateTo({
            url: '/pages/login/login'
          });
          reject(res);
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        console.error('API请求失败:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  BASE,
  request
};