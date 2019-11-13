import verifyPlainObject from '../utils/verifyPlainObject'

// TIPS：当没有传stateToProps的时候执行，返回一个function，function返回一个undefined
export function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options)

    function constantSelector() {
      return constant
    }
    constantSelector.dependsOnOwnProps = false
    return constantSelector
  }
}

// TIPS：判断是否要拿拥有的props中依赖的props
export function getDependsOnOwnProps(mapToProps) {
  return mapToProps.dependsOnOwnProps !== null &&
    mapToProps.dependsOnOwnProps !== undefined
    ? Boolean(mapToProps.dependsOnOwnProps)
    : mapToProps.length !== 1
}

/* 
  TIPS：假设参数mapToProps传入的是
  function getState(state){
    return {
      test: state.test
    }
  }
*/

// TIPS：主要是存储到mapToProps, methodName，返回一个initProxySelector的函数
export function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps
        ? proxy.mapToProps(stateOrDispatch, ownProps)
        : proxy.mapToProps(stateOrDispatch)
    }

    proxy.dependsOnOwnProps = true

    // Tips：该函数在首次会执行
    proxy.mapToProps = function detectFactoryAndVerify(
      stateOrDispatch,
      ownProps
    ) {
      /* TIPS：将
        function getState(state){
          return {
            test: state.test
          }
        }
        赋给proxy.mapToProps，替换当前的函数
      */
      proxy.mapToProps = mapToProps
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
      // TIPS：获取 Props { test: state.test }
      let props = proxy(stateOrDispatch, ownProps)
      // TIPS：如果 Props是function则继续执行该流程直到拿到Props Obejct
      if (typeof props === 'function') {
        proxy.mapToProps = props
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        props = proxy(stateOrDispatch, ownProps)
      }

      // TIPS：验证是不是纯object
      if (process.env.NODE_ENV !== 'production')
        verifyPlainObject(props, displayName, methodName)

      return props
    }

    return proxy
  }
}
