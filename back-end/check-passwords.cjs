const DB_client = require('./db.cjs')
const db_passwords = new DB_client({
  table: 'davinci_web_passwords'
})

let verify_password = function (password) {
  return db_passwords.getItem({
    id: password
  })
}

module.exports = verify_password