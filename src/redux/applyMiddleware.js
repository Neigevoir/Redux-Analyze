import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

// Tips：注册中间件，如router、api等，在执行api或router处理时，可以设置
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
