// TIPS：默认batch为直接执行callback
function defaultNoopBatch(callback) {
  callback()
}

let batch = defaultNoopBatch

// TIPS：设置batch，主要用来设置react的state合并
export const setBatch = newBatch => (batch = newBatch)

// TIPS：返回batch方法
export const getBatch = () => batch
