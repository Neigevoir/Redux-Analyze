import verifySubselectors from './verifySubselectors'

// TIPS：不开启pure处理的props工厂函数，将connect的三个参数合并起来成为一个props传递下去
export function impureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch
) {
  return function impureFinalPropsSelector(state, ownProps) {
    return mergeProps(
      mapStateToProps(state, ownProps),
      mapDispatchToProps(dispatch, ownProps),
      ownProps
    )
  }
}

/* 
  TIPS：pure处理的props工厂函数，相对于没有pure的会复杂点，我们按它本身流程来看
*/

export function pureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch,
  { areStatesEqual, areOwnPropsEqual, areStatePropsEqual }
) {
  // Tips：流程1-初始化各种参数
  let hasRunAtLeastOnce = false //TIPS：是否有跑至少一次整个函数
  let state
  let ownProps
  let stateProps
  let dispatchProps
  let mergedProps

  // Tips：流程3-处理第一次调用pureFinalPropsSelector时，各种参数，后续不再执行
  function handleFirstCall(firstState, firstOwnProps) {
    state = firstState
    ownProps = firstOwnProps
    stateProps = mapStateToProps(state, ownProps)
    dispatchProps = mapDispatchToProps(dispatch, ownProps)
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    hasRunAtLeastOnce = true
    return mergedProps
  }

  function handleNewPropsAndNewState() {
    stateProps = mapStateToProps(state, ownProps)

    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps)

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    return mergedProps
  }

  function handleNewProps() {
    if (mapStateToProps.dependsOnOwnProps)
      stateProps = mapStateToProps(state, ownProps)

    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps)

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    return mergedProps
  }

  function handleNewState() {
    const nextStateProps = mapStateToProps(state, ownProps)
    const statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps)
    stateProps = nextStateProps

    if (statePropsChanged)
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps)

    return mergedProps
  }

  /* 
    Tips：流程4-对state和props的最新和当前进行相等判断，根据相对的进行return
    分为三种情况：
      1、props和state都change，handleNewPropsAndNewState
      2、props是change，state不变，handleNewProps
      3、state是change，props不变，handleNewState
    handleSubsequentCalls其实可以和三个处理state和props的方法合并起来，都属于对state和props的处理
    分离开只是结构上更清晰
  */
  function handleSubsequentCalls(nextState, nextOwnProps) {
    const propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps)
    const stateChanged = !areStatesEqual(nextState, state)
    state = nextState
    ownProps = nextOwnProps

    if (propsChanged && stateChanged) return handleNewPropsAndNewState()
    if (propsChanged) return handleNewProps()
    if (stateChanged) return handleNewState()
    return mergedProps
  }

  /* 
    Tips：流程2-第一次的时候return handleFirstCall(nextState, nextOwnProps)
                第二次的时候return handleSubsequentCalls(nextState, nextOwnProps)
  */
  return function pureFinalPropsSelector(nextState, nextOwnProps) {
    return hasRunAtLeastOnce
      ? handleSubsequentCalls(nextState, nextOwnProps)
      : handleFirstCall(nextState, nextOwnProps)
  }
}

/*
  selectorFactory也即是finalPropsSelectorFactory，主要用来处理props
  通过options的pure来决定使用的合并props的处理方式
  pure的时候，可以直接拿结果，如果props没有改变，connectAdvanced shouldComponentUpdate可以返回false，不更新
  非pure的时候，直接拿新的props对象，进行更新
*/

export default function finalPropsSelectorFactory(
  dispatch,
  { initMapStateToProps, initMapDispatchToProps, initMergeProps, ...options }
) {
  const mapStateToProps = initMapStateToProps(dispatch, options)
  const mapDispatchToProps = initMapDispatchToProps(dispatch, options)
  const mergeProps = initMergeProps(dispatch, options)

  // Tips：非生产环境判断
  if (process.env.NODE_ENV !== 'production') {
    verifySubselectors(
      mapStateToProps,
      mapDispatchToProps,
      mergeProps,
      options.displayName
    )
  }

  // TIPS：用户是否选择开启pure
  const selectorFactory = options.pure
    ? pureFinalPropsSelectorFactory
    : impureFinalPropsSelectorFactory

  return selectorFactory(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    dispatch,
    options
  )
}
