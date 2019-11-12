/**
 * @param {any} obj
 * 传入一个obj
 * @returns {boolean}
 * 判断是否是一个纯粹的对象
 */
export default function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  // TIPS：主要用与判断obj的原型是否是obj，所以需要while去找到obj在null前一个的原型是否和当前的原型相等
  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
