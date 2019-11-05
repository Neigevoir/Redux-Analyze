// Tips：生成随机字符串
/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')

/*Tips：Redux的基本Types
  INIT: 整个Redux初始化时使用
  REPLACE：用户使用另一个Reducer去替换当前Reducer时使用
  PROBE_UNKNOWN_ACTION：用户没有在Reducer里面定义对应的Types,使用了无法识别的types时会使用
*/
const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
