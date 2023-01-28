let getApiBase = function () {
  if (location.hostname === 'localhost') {
    return 'http://localhost:7009/api'
  } else {
    return 'https://chat.jw1.dev/api'
  }
}

function trim(str) {
  return str.replace(/^\s+/, '')
}

export {
  getApiBase,
  trim
}