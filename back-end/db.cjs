require('dotenv').config()

const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand
} = require('@aws-sdk/client-dynamodb')

const {marshall} = require('@aws-sdk/util-dynamodb')

const REGION = 'ap-northeast-2'

let client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

function DB_client(options) {
  let table = options.table

  this.getItem = function (data) {
    let params = {
      TableName: table,
      Key: marshall(data)
    }
    return client.send(new GetItemCommand(params))
  }

  this.deleteItem = function (data) {
    let params = {
      TableName: table,
      Key: marshall(data)
    }
    return client.send(new DeleteItemCommand(params))
  }

  this.updateItem = function (id, data) {
    let {UpdateExpression, ExpressionAttributeValues} = generateUpdateParams(data)
    let params = {
      TableName: table,
      Key: marshall({
        id: id
      }),
      UpdateExpression: 'set ' + UpdateExpression,
      ExpressionAttributeValues: marshall(ExpressionAttributeValues),
      ReturnValues: 'ALL_NEW'
    }
    return client.send(new UpdateItemCommand(params))
  }

  this.putItem = function (data) {
    let params = {
      TableName: table,
      Item: marshall(data)
    }
    return client.send(new PutItemCommand(params))
  }
}

function generateUpdateParams(data) {
  const UpdateExpression = Object.keys(data)
    .map((attribute, index) => `${attribute} = :val${index + 1}`)
    .join(', ')
  const ExpressionAttributeValues = Object.keys(data).reduce((acc, attribute, index) => {
    acc[`:val${index + 1}`] = data[attribute]
    return acc
  }, {})

  return {
    UpdateExpression,
    ExpressionAttributeValues
  }
}

module.exports = DB_client