import connectAdvanced from '../components/connectAdvanced'
import shallowEqual from '../utils/shallowEqual'
import defaultMapDispatchToPropsFactories from './mapDispatchToProps'
import defaultMapStateToPropsFactories from './mapStateToProps'
import defaultMergePropsFactories from './mergeProps'
import defaultSelectorFactory from './selectorFactory'

//  TIPS：将参数全部放到工厂函数中执行，拿回工厂函数的返回值
function match(arg, factories, name) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg)
    if (result) return result
  }

  return (dispatch, options) => {
    throw new Error(
      `Invalid value of type ${typeof arg} for ${name} argument when connecting component ${
        options.wrappedComponentName
      }.`
    )
  }
}

// TIPS：判断是否严格相等
function strictEqual(a, b) {
  return a === b
}

/*
  createConnect返回了一个connect，它本身主要用来将
    mapStateToPropsFactories 
    mapDispatchToPropsFactories
    mergePropsFactories
    selectorFactory
  等工厂函数设置好
 */
export function createConnect({
  connectHOC = connectAdvanced,
  mapStateToPropsFactories = defaultMapStateToPropsFactories,
  mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
  mergePropsFactories = defaultMergePropsFactories,
  selectorFactory = defaultSelectorFactory
} = {}) {
  /*
    connect主要是返回了connectHOC，一个HOC组件用来包裹用户的components
    主要作用是接收用户传递下来的
      mapStateToProps
      mapDispatchToProps
      mergeProps
      options
    并且将mapStateToProps、mapDispatchToProps、mergeProps通过工厂函数进行处理，传递给HOC
  */
  return function connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    {
      pure = true,
      areStatesEqual = strictEqual,
      areOwnPropsEqual = shallowEqual,
      areStatePropsEqual = shallowEqual,
      areMergedPropsEqual = shallowEqual,
      ...extraOptions
    } = {}
  ) {
    /* TIPS：initMapStateToProps、initMapDispatchToProps、initMergeProps
      三个方法基本相同，主要用于借助工厂函数合并props、封装actions等，具体的可以看mapStateToProps，这里不对每个都进行过一遍
      然后return 一个function
    */

    const initMapStateToProps = match(
      mapStateToProps,
      mapStateToPropsFactories,
      'mapStateToProps'
    )

    const initMapDispatchToProps = match(
      mapDispatchToProps,
      mapDispatchToPropsFactories,
      'mapDispatchToProps'
    )
    const initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps')

    /*
      
     */
    return connectHOC(selectorFactory, {
      methodName: 'connect', // 在error的时候会进行显示

      getDisplayName: name => `Connect(${name})`, // 获取组件的displayName.

      shouldHandleStateChanges: Boolean(mapStateToProps), // mapStateToProps为true，connect的组件会订阅state的改变

      // 需要用到的一些props参数和equal的参数
      initMapStateToProps,
      initMapDispatchToProps,
      initMergeProps,
      pure,
      areStatesEqual,
      areOwnPropsEqual,
      areStatePropsEqual,
      areMergedPropsEqual,

      // 其他的用户设置参数设置
      ...extraOptions
    })
  }
}

export default createConnect()
