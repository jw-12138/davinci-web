const express = require('express')
const cors = require('cors')
const app = express()
const { nanoid } = require('nanoid')

const { ask } = require('./api.cjs')
const check_password = require('./check-passwords.cjs')
const write_permissions = require('./write-permissions.cjs')
const verify_login = require('./verify-login.cjs')
const buffer = require('buffer')
const port = 7009
const path = require('path')

app.use(cors())
app.use(express.static(path.join(__dirname, '../dist')))
app.use(express.json())

app.post('/api/login', function (req, res) {
  let password = req.body.password
  let passwordCorrect = check_password(password)
  if (passwordCorrect) {
    let token = nanoid(32)
    res.json({
      success: true,
      token: token
    })

    write_permissions({
      token: token,
      expire: Date.now() + 1000 * 60 * 60 * 24 * 30
    })
  } else {
    res.json({
      success: false
    })
  }
})

app.post('/api/checkLogin', function (req, res) {
  let token = req.body.token

  let loginValid = verify_login(token)

  if (loginValid) {
    res.json({
      success: true
    })
  } else {
    res.json({
      success: false
    })
  }
})

app.post('/api/ask', function (req, res) {
  res.set('Content-Type', 'application/octet-stream')
  res.set('Transfer-Encoding', 'chunked')

  let composedHistory = req.body.history || ''
  let message = req.body.message
  let token = req.body.token || ''

  if (!message) {
    res.write(Buffer.from('The message should not be empty 🥲'))
    res.end()

    return false
  }

  if (!verify_login(token)) {
    res.write(Buffer.from('Seems like you are not authenticated, try refresh the page! 🥲'))
    res.end()

    return false
  }

  ask(
    'davinci',
    {
      prompt: `DaVinci is an AI language model developed by OpenAI that can perform a variety of language tasks, such as answering questions, generating text, translating, holding conversations, summarizing, providing definitions, and more. It also retains context from previous conversations. When asked about coding, DaVinci will provide both sample code and a descriptive text, with multi-line code wrapped in <pre><code></code></pre> HTML tags and inline code wrapped in <code></code> HTML tags for better readability.
${composedHistory}
Human: ${message}
AI: `,
      temperature: 1,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stream: true
    },
    function (text, cost, err) {
      if (err) {
        console.log(err)
        res.write(Buffer.from('Seems like there is a problem with OpenAI, please try again. 🥲'))
        res.end()
        return false
      }
      if (text) {
        res.write(Buffer.from(text))
      }
      if (cost) {
        setTimeout(function () {
          res.write(Buffer.from('####[COST]:' + cost))
          res.end()
        }, 60)
      }
    }
  )
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
