const {connectDB} = require('./mongo.cjs')

let db
const db_conversations = (async function () {
  db = await connectDB()
  return db.collection('public_conversations')
})()

let write_conversations = function (data) {
  return db_conversations.then(collection => collection.insertOne(data))
}

let get_conversations = function (data) {
  return db_conversations.then(collection => collection.findOne(data))
}

module.exports = {
  write_conversations,
  get_conversations
}