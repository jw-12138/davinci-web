const fs = require('fs')

let permission_file = __dirname + '/permission.json'

if (!fs.existsSync(permission_file)) {
  fs.writeFileSync(permission_file, '[]')
}

let verify_login = function (token) {
  let permissions = fs.readFileSync(permission_file)
  permissions = JSON.parse(permissions.toString())

  for (let i = 0; i < permissions.length; i++) {
    let item = permissions[i]
    let isNotExpired = item.expire < Date.now() + (1000 * 60 * 60 * 24 * 30)

    if (item.token === token) {
      if (isNotExpired) {
        return true
      }
    } else {
      continue
    }
  }

  return false
}

module.exports = verify_login