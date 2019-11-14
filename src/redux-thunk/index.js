/**
 * TIPS：thunk的源码只有这一些
 * @param {object} extraArgument 主要是用户需要传递的参数
 * return 一个curry的函数
 */
function createThunkMiddleware(extraArgument) {
  /**
   * Tips：结合redux的applyMiddleware来看
   * @param {({ dispatch, getState })} middlewareAPI { getState: store.getState, dispatch: (...args) => dispatch(...args) }
   * @param { next } store.dispatch
   * @param { action } any 可以是object或者function，由用户传入 
   * 
   * applyMiddleware将api的设置处理好，然后将store.dispatch传入
   * 再return action => {
      if (typeof action === 'function') {
        return action(dispatch, getState, extraArgument)
      }
      return next(action)
    }
    用户的action如果传入的是function则将dispatch, getState, extraArgument传递并执行该方法，所以需要在该方法上去dispatch
    如果传入的不是function则直接dispatch
  */
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument)
    }

    return next(action)
  }
}

// Tips：默认的不使用extraArgument，需要增加参数的的直接使用thunk.withExtraArgument
const thunk = createThunkMiddleware()
thunk.withExtraArgument = createThunkMiddleware

export default thunk
