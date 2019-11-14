module.exports = {
  proxy: {
    '/app/*': {
      target: 'http://www.baidu.com',
      changeOrigin: true,
      secure: false
    }
  }
}
