const fs = require('fs')

let permission_file = __dirname + '/permission.json'

if (!fs.existsSync(permission_file)) {
  fs.writeFileSync(permission_file, '[]')
}

let permissions = fs.readFileSync(permission_file).toString()
permissions = JSON.parse(permissions)

let write_permissions = function (data) {
  permissions.push(data)

  fs.writeFileSync(permission_file, JSON.stringify(permissions))
}

module.exports = write_permissions