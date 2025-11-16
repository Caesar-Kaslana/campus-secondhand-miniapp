// /pages/mine_mode//login/login.js
const api = require('../../../utils/api.js');

Page({
  data: {
    username: "",
    password: ""
  },

  onUser(e) {
    this.setData({ username: e.detail.value });
  },

  onPass(e) {
    this.setData({ password: e.detail.value });
  },

  doLogin() {
    api.request('/api/auth/login', 'POST', {
      username: this.data.username,
      password: this.data.password
    }).then(res => {
      console.log("登录成功：", res);

      // 关键修改：存储完整的登录状态信息
      wx.setStorageSync("token", res.token);
      
      // 假设接口返回了用户信息，如果没有需要额外调用接口获取
      if (res.userInfo) {
        wx.setStorageSync('userInfo', res.userInfo);
        wx.setStorageSync('hasUserInfo', true);
      } else {
        // 如果接口没有返回用户信息，创建基本用户信息
        const basicUserInfo = {
          nickName: this.data.username || '用户',
          avatarUrl: '/images/default-avatar.png'
        };
        wx.setStorageSync('userInfo', basicUserInfo);
        wx.setStorageSync('hasUserInfo', true);
      }

      wx.showToast({ title: "登录成功" });

      // 使用更可靠的跳转方式确保状态更新[4,7](@ref)
      setTimeout(() => {
        // 方法1：使用reLaunch重新加载页面栈
        wx.reLaunch({
          url: '/pages/mine_mode/mine/mine'
        });
        
        // 方法2：或者使用navigateBack但确保上级页面更新
        // wx.navigateBack();
      }, 800);
    }).catch(err => {
      console.error("登录失败", err);
      wx.showToast({ title: "用户名或密码错误", icon: "none" });
    });
  },

  doRegister() {
    api.request('/api/auth/register', 'POST', {
      username: this.data.username,
      password: this.data.password
    }).then(res => {
      wx.showToast({ title: "注册成功" });
    }).catch(err => {
      wx.showToast({ title: "注册失败", icon: "none" });
    });
  }
});