/* 
  Tips：unstable_batchedUpdates合并setState更新
  在react的钩子和合成函数中已经处理，但想在react环境外合并，需要使用此方法
  ReactDOM.unstable_batchedUpdates(() => {
    this.setState({x: 4})
    this.setState({x: 5})
    this.setState({x: 6})
  })
  如在setTimeout(() => {
    this.setState({ a: 1})
    this.setState({ b: 2})
    this.setState({ c: 3})
  }, 1000)
  合效果为setTimeout(() => {
    this.setState({ 
      a: 1,
      b: 2,
      c: 3
    })
  }, 1000)
*/
export { unstable_batchedUpdates } from 'react-dom'
