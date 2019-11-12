import isPlainObject from './isPlainObject'
import warning from './warning'

// Tips：验证是否是一个纯粹的对象，否则抛出warning
export default function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(
      `${methodName}() in ${displayName} must return a plain object. Instead received ${value}.`
    )
  }
}
