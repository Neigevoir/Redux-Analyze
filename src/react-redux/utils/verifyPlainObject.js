import isPlainObject from './isPlainObject'
import warning from './warning'

// Tips：判断是否是一个纯粹的对象
export default function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(
      `${methodName}() in ${displayName} must return a plain object. Instead received ${value}.`
    )
  }
}
