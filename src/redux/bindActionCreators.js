// TIPS：将action和dispatch进行封装，方便用户直接定义变量使用
function bindActionCreator(actionCreator, dispatch) {
  return function() {
    return dispatch(actionCreator.apply(this, arguments))
  }
}

/**
 * TIPS：主要用绑定action，可以减少dispatch，直接将this.props.dispatch(action)简化，用户可以直接通过变量使用
 *
 * @param {Function|Object} actionCreators
 * 传入一个action或者一个action对象进行封装
 *
 * @param {Function} dispatch
 * Redux里面的sipactch方法
 *
 * @returns {Function|Object}
 * return一个经过处理的action或者actions对象
 */

export default function bindActionCreators(actionCreators, dispatch) {
  // TIPS：如果已经是一个function，那就直接返回简化的function
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  // TIPS：如果actionCreators不是对象也不是function，需要抛出异常
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  /* 
    TIPS：如果是object，则进行遍历，对action里面的value为function的进行处理，主要是做actions的处理
    {
      userAction: () => { type, data },
      homeAction: () => { type, data }
    }
  */
  const boundActionCreators = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
