import { wrapMapToPropsConstant, wrapMapToPropsFunc } from './wrapMapToProps'

// TIPS：如果传入的是function才进行处理
export function whenMapStateToPropsIsFunction(mapStateToProps) {
  return typeof mapStateToProps === 'function'
    ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
    : undefined
}

export function whenMapStateToPropsIsMissing(mapStateToProps) {
  return !mapStateToProps ? wrapMapToPropsConstant(() => ({})) : undefined
}

/* TIPS：整个方法结合match，其实是
  () => {
    return typeof mapStateToProps === 'function'
      ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
      : !mapStateToProps 
        ? wrapMapToPropsConstant(() => ({})) 
        : 
    基本上就是function则执行wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
    没有mapStateToProps则执行wrapMapToPropsConstant(() => ({}))默认处理
    其他类型则返回undefined
  }
*/
export default [whenMapStateToPropsIsFunction, whenMapStateToPropsIsMissing]
