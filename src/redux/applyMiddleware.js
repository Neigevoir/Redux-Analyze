import compose from './compose'

/**
 * Tips：注册中间件，如router、api等，在执行api或router处理时，可以做一些处理
 * 例如正常你dispatch一个action，但是所有api都需要一个SUCCESS，和ERROR这情况下，如果在要写多个action就不方便
 * @param {...Function} middlewares
 * 一些中间件
 * @returns {Function}
 * 返回一个加入了store的中间件，包含了store的基本功能，因部分中间件需要处理或者使用到store的信息
 */

export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    let dispatch = () => {
      throw new Error(
        '在初始化中间件时，不能执行dispatch，容易影响别的中间件执行！'
      )
    }

    // Tips：中间件的Api，目前只要能拿到store的状态和将dispatch传递下去即可
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    // Tips：给每个中间件拿到Store
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    // Tips：将所有中间件合并起来，从右往左处理，执行完的作为参数传给下一个中间件
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
