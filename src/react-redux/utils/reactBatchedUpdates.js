/* eslint-disable import/no-unresolved */
/* 
  Tips：unstable_batchedUpdates合并更新
  如在setTimeout(() => {
    this.setState({ a: 1})
    this.setState({ b: 2})
    this.setState({ c: 3})
  }, 1000)
  合并成setTimeout(() => {
    this.setState({ 
      a: 1,
      b: 2,
      c: 3
    })
  }, 1000)
*/
export { unstable_batchedUpdates } from 'react-dom'
