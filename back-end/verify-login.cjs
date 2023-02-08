const DB_client = require('./db.cjs')
const db_permissions = new DB_client({
  table: 'davinci_web_permissions'
})

let verify_login = function (token) {
  if (token.split('_')[0] === 'key') {
    return new Promise((resolve, reject) => {
      resolve({
        Item: {
          expire: {
            N: Date.now() + 1000
          }
        }
      })
    })
  } else {
    if (token) {
      return db_permissions.getItem({
        id: token
      })
    }
  }

  return false
}

module.exports = verify_login