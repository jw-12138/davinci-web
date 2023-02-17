const express = require('express')
const cors = require('cors')
const app = express()
const {nanoid} = require('nanoid')
const {ask} = require('./api.cjs')
const verify_login = require('./verify-login.cjs')
const port = 7009
const path = require('path')
const {unmarshall} = require('@aws-sdk/util-dynamodb')
const {write_conversations, get_conversations} = require('./aws_conversations.cjs')

app.use(cors())
app.use(express.static(path.join(__dirname, '../dist')))
app.use(express.json())

app.post('/api/share/get', (req, res) => {
  let id = req.body.id
  get_conversations({
    id
  }).then(r => {
    if (r.Item) {
      let item = unmarshall(r.Item)
      res.json({
        success: true,
        messages: item.history
      })
    } else {
      res.json({
        success: false,
        message: 'No such conversation'
      })
    }
  }).catch(err => {
    res.json({
      success: false,
      message: 'Failed to get conversation'
    })
  })
})

app.post('/api/share', (req, res) => {
  let history_data = req.body.history
  let id = nanoid()
  let token = req.body.token
  let userPool = req.body.userPool

  let loginValid = false

  verify_login(token, userPool).then(r => {
    if (r.data.Username) {
      loginValid = true
    }

    if (loginValid) {
      write_conversations({
        id,
        history: history_data
      }).then(r_2 => {
        console.log('Write to database successfully')
        res.json({
          success: true,
          id
        })
      }).catch(err => {
        res.json({
          success: false,
          message: 'Failed to write to database'
        })
      })
    } else {
      res.json({
        success: false,
        message: 'Login expired'
      })
    }
  }).catch(err => {
    res.json({
      success: false
    })
  })
})

app.post('/api/checkLogin', function (req, res) {
  let token = req.body.token
  let loginValid = false
  let userPool = req.body.userPool

  verify_login(token, userPool).then(r => {
    if (r.data.Username) {
      loginValid = true
    }

    res.json({
      success: loginValid
    })
  }).catch(err => {
    console.log(err)
    res.json({
      success: false
    })
  })
})

app.post('/api/ask', function (req, res) {
  res.set('Content-Type', 'application/octet-stream')
  res.set('Transfer-Encoding', 'chunked')

  let composedHistory = req.body.history || ''
  let message = req.body.message
  let token = req.body.token || ''
  let userPool = req.body.userPool || ''

  if (!message) {
    res.write(Buffer.from('The message should not be empty 🥲'))
    res.end()

    return false
  }

  let loginType = 'password'

  if (token.split('_')[0] === 'key') {
    loginType = 'key'
  }

  verify_login(token, userPool).then(r => {
    if (r.data.Username) {
      ask(
        'davinci',
        {
          prompt: `DaVinci is an AI language model developed by OpenAI, capable of performing various language-related tasks like answering questions, text generation, translation, conversational chat, summarizing, providing definitions, and more. It also remembers previous conversation context. For coding queries, the AI will always provide some sample code and a detailed text description, and the code is formatted with markdown for improved readability.
  
Below are some examples of how DaVinci would interact with human.

## Example 1

Human: In order to align an element inside a CSS flex-box to the right, what steps should I take?

AI: You can use the \`justify-content\` and \`align-self\` properties to align elements within a flex container.
To align an individual element to the right, you can set its \`align-self\` property to \`flex-end\`.

Example:

\`\`\`css
.flex-container {
  display: flex;
  justify-content: space-between; /* aligns all items along the main axis */
}

.right-aligned-item {
  align-self: flex-end; /* aligns the item along the cross axis */
}
\`\`\`

## Example 2

${composedHistory}
Human: ${message}
AI: `,
          temperature: 1,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0.6,
          stream: true,
          key: loginType === 'key' ? token.split('_')[1] : false
        },
        function (text, cost, err) {
          if (err) {
            console.log(err.response)
            if (err.response.status === 429) {
              res.status(429)
            } else {
              res.status(500)
            }
            res.end()
            return false
          }
          if (text) {
            res.write(Buffer.from(text))
          }
          if (cost) {
            res.write(Buffer.from('####[COST]:' + cost))
            res.end()
          }
        }
      )
    } else {
      res.write(Buffer.from('Seems like you are not authenticated, try refresh the page! 🥲'))
      res.end()
    }
  }).catch(err => {
    res.write(Buffer.from('Seems like you are not authenticated, try refresh the page! 🥲'))
    res.end()
  })
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
