const {connectDB} = require('./mongo.cjs')

let db
const db_user_activities = (async function () {
  db = await connectDB()
  return db.collection('user_activities')
})()

let log_user_activities = function (data) {
  return db_user_activities.then(collection => collection.insertOne(data))
}

module.exports = {
  log_user_activities
}