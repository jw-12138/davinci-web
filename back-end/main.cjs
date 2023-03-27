const express = require('express')
const cors = require('cors')
const app = express()
const {nanoid} = require('nanoid')
const {ask, chat} = require('./openai-api.cjs')
const verify_login = require('./verify-login.cjs')
const port = 7009
const path = require('path')
const {write_conversations, get_conversations} = require('./write-conversations.cjs')
const {log_user_activities} = require('./log-user-activity.cjs')
const {
  calcTokenCost,
  calcToken
} = require('./price-calc.cjs')
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.static(path.join(__dirname, '../dist')))
app.use(express.json())

function prependArray(value, array) {
  let newArray = array.slice()
  newArray.unshift(value)
  return newArray
}

function logUserActivity(data) {
  console.log(data)
  log_user_activities(data).then(res => {
    console.log('Log user activity successfully')
  }).catch(err => {
    console.log(err)
  })
}

const instruction = `Your name is DaVinci, and you are a large language model trained by OpenAI. Your job is to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.
If the input is a question, try your best to answer it. Otherwise, provide as much information as you can.
You should use "code blocks" syntax from markdown including language name to encapsulate any part in responses that's longer-format content such as poem, code, lyrics.
Provide programming language name in code blocks if possible.
You should also use bold syntax from markdown on the relevant parts of the responses to improve readability.
If your answer contains code, make sure to provide detailed explanations.
You can understand and communicate fluently in the user's language of choice such as English,中文,日本语,Espanol,Francais or Deutsch.`

app.post('/api/share/get', (req, res) => {
  let id = req.body.id
  get_conversations({
    id
  }).then(r => {
    if (r.history) {
      res.json({
        success: true,
        messages: r.history
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
        created: Date.now(),
        userName: r.data.Username,
        history: history_data
      }).then(r_2 => {
        console.log('Write to database successfully')
        res.json({
          success: true,
          id
        })
      }).catch(err => {
        console.log(err)
        res.status(500).json({
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

app.post('/api/ask', function (req, res) {
  res.set('Content-Type', 'application/octet-stream')
  res.set('Transfer-Encoding', 'chunked')

  let composedHistory = ''
  let history = req.body.history || ''
  let message = req.body.message
  let token = req.body.token || ''
  let userPool = req.body.userPool || ''

  history.forEach(el => {
    composedHistory += `${el.sender}: ${el.text}\n`
  })

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
          prompt: instruction + `
Here is a conversation between a human and you:

${composedHistory}
Human: ${message}
AI: `,
          max_tokens: 1024,
          temperature: 0.5,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0.6,
          stream: true,
          key: loginType === 'key' ? token.split('_')[1] : false
        },
        function (text, cost, err) {
          if (text) {
            res.write(Buffer.from(text))
          }
          if (cost) {
            res.end()
            if (loginType === 'password') {
              let userData = jwt.decode(token)
              let logData = {
                username: userData.username,
                'cognito:groups': userData['cognito:groups'] || [],
                site: 'chat.jw1.dev',
                type: 'chat/davinci',
                ...cost,
                created: Date.now()
              }
              logUserActivity(logData)
            }
            return false
          }
          if (err) {
            console.log(err)
            if (err.response && err.response.status === 429) {
              res.status(429)
            } else {
              res.status(500)
            }
            res.end()
            return false
          }
        }
      )
    } else {
      res.write(Buffer.from('Seems like you are not authenticated, try refresh the page! 🥲'))
      res.end()
    }
  }).catch(err => {
    console.log(err)
    res.status(401)
    res.end()
  })
})

app.post('/api/chat/:model', function (req, res) {
  res.set('Content-Type', 'application/octet-stream')
  res.set('Transfer-Encoding', 'chunked')

  let composedHistory = []
  let history = req.body.history || ''
  let message = req.body.message
  let token = req.body.token || ''
  let userPool = req.body.userPool || ''
  let userInstruction = req.body.instructions || ''

  let model = req.params.model || ''

  if (!model) {
    res.status(404).end()
    return false
  }

  history.forEach(el => {
    composedHistory.push({
      role: el.sender === 'Human' ? 'user' : 'assistant',
      content: el.text
    })
  })

  if (!message) {
    res.write(Buffer.from('The message should not be empty 🥲'))
    res.end()

    return false
  }

  let loginType = 'password'

  if (token.split('_')[0] === 'key') {
    loginType = 'key'
  }

  console.log('Login Type: ' + loginType)

  if (userInstruction) {
    composedHistory = prependArray({
      role: 'system',
      content: userInstruction
    }, composedHistory)
  }

  verify_login(token, userPool).then(r => {
    if (r.data.Username) {
      chat(
        model,
        {
          messages: [
            ...composedHistory,
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.6,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0.6,
          stream: true,
          key: loginType === 'key' ? token.split('_')[1] : false
        },
        function (text, cost, err) {

          if (text) {
            res.write(Buffer.from(text))
          }

          if (cost) {
            res.end()
            if (loginType === 'password') {
              let userData = jwt.decode(token)
              let logData = {
                username: userData.username,
                'cognito:groups': userData['cognito:groups'] || [],
                site: 'chat.jw1.dev',
                type: 'chat/' + model,
                ...cost,
                created: Date.now()
              }
              logUserActivity(logData)
            }
            return false
          }

          if (err) {
            console.log(err)
            if (err.response && err.response.status === 429) {
              res.status(429)
            } else {
              res.status(500)
            }
            res.end()
            return false
          }
        }
      )
    } else {
      res.status(401)
      res.end()
    }
  }).catch(err => {
    console.log(err)
    res.status(err.response.status)
    res.end()
  })
})

app.listen(port, () => {
  console.log(`DaVinci GPT-3 is now listening on port ${port}`)
})
