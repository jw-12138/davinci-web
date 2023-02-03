const DB_client = require('./db.cjs')
const db_permissions = new DB_client({
  table: 'davinci_web_permissions'
})

let write_permissions = function (data) {
  return db_permissions.putItem(data)
}

module.exports = write_permissions