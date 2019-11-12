// TIPS：该方法主要是实现函数Curry化，并且通过reduce，将全部参数(function)从右到左执行，并且将执行后的return作为下一个的参数传入

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  /*
    Tips：reduce就是数组叠加，主要将funcs处理好
    假设a、b、c都为function
    compose则会处理成arg => a(b(c(arg)))，这样一个function，compose(args)即可得到最终结果
  */
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
