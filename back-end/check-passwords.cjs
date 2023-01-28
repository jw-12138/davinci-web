const fs = require('fs')

let password_file = __dirname + '/passwords.json'

if (!fs.existsSync(password_file)) {
  fs.writeFileSync(password_file, '[]')
}

let verify_password = function (password) {
  let passwords = fs.readFileSync(password_file)
  passwords = JSON.parse(passwords.toString())

  return passwords.includes(password)
}

module.exports = verify_password