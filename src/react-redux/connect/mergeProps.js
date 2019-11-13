import verifyPlainObject from '../utils/verifyPlainObject'

// TIPS：默认合并方式，将三个props直接合并为一个
export function defaultMergeProps(stateProps, dispatchProps, ownProps) {
  return { ...ownProps, ...stateProps, ...dispatchProps }
}

// TIPS：包裹合并Props
export function wrapMergePropsFunc(mergeProps) {
  return function initMergePropsProxy(
    dispatch,
    { displayName, pure, areMergedPropsEqual }
  ) {
    let hasRunOnce = false
    let mergedProps

    // TIPS：在nextMergedProps和mergedProps不相等，或者不是pure的时候需要每次获取最新的mergeProps
    return function mergePropsProxy(stateProps, dispatchProps, ownProps) {
      const nextMergedProps = mergeProps(stateProps, dispatchProps, ownProps)

      if (hasRunOnce) {
        if (!pure || !areMergedPropsEqual(nextMergedProps, mergedProps))
          mergedProps = nextMergedProps
      } else {
        hasRunOnce = true
        mergedProps = nextMergedProps

        // TIPS：非生产环境判断是否是纯对象
        if (process.env.NODE_ENV !== 'production')
          verifyPlainObject(mergedProps, displayName, 'mergeProps')
      }

      return mergedProps
    }
  }
}

/* 
  TIPS：与mapStateToProps相同，判断是否mergeProps为function就使用wrapMergePropsFunc合并方式
  为空则使用默认合并方式
*/
export function whenMergePropsIsFunction(mergeProps) {
  return typeof mergeProps === 'function'
    ? wrapMergePropsFunc(mergeProps)
    : undefined
}

export function whenMergePropsIsOmitted(mergeProps) {
  return !mergeProps ? () => defaultMergeProps : undefined
}

export default [whenMergePropsIsFunction, whenMergePropsIsOmitted]
