const DB_client = require('./db.cjs')
const db_conversations = new DB_client({
  table: 'davinci_conversations'
})

let write_conversations = function (data) {
  return db_conversations.putItem(data)
}

let get_conversations = function (data) {
  return db_conversations.getItem(data)
}

module.exports = {
  write_conversations,
  get_conversations
}