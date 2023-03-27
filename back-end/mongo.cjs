require('dotenv').config()
const {MongoClient, ServerApiVersion} = require('mongodb')

let connectDB = async function() {
  const url = process.env.MONGO_URL
  const MDB_CLIENT = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
  })

  console.log('Connecting to MongoDB...')
  await MDB_CLIENT.connect()
  console.log('Connected')

  return MDB_CLIENT.db('davinci-web')
}

module.exports = {
  connectDB
}