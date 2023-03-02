require('dotenv').config()

const {Configuration, OpenAIApi} = require('openai')
const GPT3Tokenizer = require('gpt3-tokenizer').default
const tokenizer = new GPT3Tokenizer({type: 'gpt3'})
const fetch = require('node-fetch')

/**
 *
 * @param {string} m - model name ['davinci', 'curie', 'babbage', 'ada']
 * @param {object} options  - model options
 * @param {function} cb - callback function
 */
function ask(m, options, cb) {
  if (options.key) {
    process.env.OPENAI_KEY = options.key
  }
  delete options.key
  let configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY
  })
  let openai = new OpenAIApi(configuration)
  let models = {
    'davinci': {
      oneDollorToken: 1 / 0.02 * 1000,
      name: 'text-davinci-003',
      info: 'Complex intent, cause and effect, summarization for audience'
    },
    'curie': {
      oneDollorToken: 1 / 0.002 * 1000,
      name: 'text-curie-001',
      info: 'Language translation, complex classification, text sentiment, summarization'
    },
    'babbage': {
      oneDollorToken: 1 / 0.0005 * 1000,
      name: 'text-babbage-001',
      info: 'Capable of straightforward tasks, very fast, and lower cost.'
    },
    'ada': {
      oneDollorToken: 1 / 0.0004 * 1000,
      name: 'text-ada-001',
      info: 'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.'
    }
  }

  let model = models[m]
  options.model = model.name
  let promptOption = options
  let axiosOptions = {}
  let isStream = options.stream
  if (isStream) {
    axiosOptions = {
      responseType: 'stream'
    }
  }

  openai.createCompletion(promptOption, axiosOptions).then(res => {
    let tokenCount = 0

    if (!isStream) {
      let str = res.data.choices[0].text
      str = str.replace(/^\s+|\s+$/g, '')
      let tokens = res.data.usage.total_tokens
      let cost = tokens / model.oneDollorToken

      cb && cb(str, cost)
    } else {
      res.data.on('end', function () {
        let encoded = tokenizer.encode(promptOption.prompt)
        let promptTokens = encoded.bpe.length
        let cost = (tokenCount + promptTokens) / model.oneDollorToken
        setTimeout(function () {
          cb && cb(null, cost)
        }, 50)
      })
      res.data.on('data', chunk => {
        let eventData = chunk.toString()
        let s = eventData.split('\n\n')
        s.pop()
        s.forEach(el => {
          let s_arr = el.split('data: ')
          let d = s_arr[1]
          if (d.startsWith('{')) {
            tokenCount++
            let d_obj = JSON.parse(d)
            cb && cb(d_obj.choices[0].text, null)
          }
        })
      })
    }
  }).catch(err => {
    console.log(err.toJSON())
    cb && cb(null, null, err)
  })
}

function chat(m, options, cb) {
  if (options.key) {
    process.env.OPENAI_KEY = options.key
  }

  delete options.key

  let configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY
  })
  let openai = new OpenAIApi(configuration)

  let models = {
    'chat-gpt': {
      oneDollorToken: 1 / 0.002 * 1000,
      name: 'gpt-3.5-turbo',
      info: 'The standard ChatGPT model'
    }
  }

  let model = models[m]
  options.model = model.name
  let axiosOptions = {}
  let isStream = options.stream
  if (isStream) {
    axiosOptions = {
      responseType: 'stream'
    }
  }

  if (isStream) {
    let tokenCount = 0
    openai.createChatCompletion(options, axiosOptions).then(chatCompletion => {
      chatCompletion.data.on('end', function () {
        let str = ''
        options.messages.forEach((message) => {
          str += message.content + '\n'
        })
        let encoded = tokenizer.encode(str)
        let encodedPrompt = encoded.bpe
        let promptTokens = encodedPrompt.length
        let cost = (tokenCount + promptTokens) / model.oneDollorToken
        cb && cb(null, cost)
      })

      chatCompletion.data.on('data', chunk => {
        let eventData = chunk.toString()
        let s = eventData.split('\n\n')
        s.pop()
        s.forEach(el => {
          let s_arr = el.split('data: ')
          let d = s_arr[1]
          if (d.startsWith('{')) {
            let d_obj = JSON.parse(d)
            tokenCount++
            cb && cb(d_obj.choices[0].delta.content, null)
          }
        })
      })
    }).catch(err => {
      console.log(err.toJSON())
      cb && cb(null, null, err)
    })
  } else {
    openai.createChatCompletion(options).then(chatCompletion => {
      let cost = chatCompletion.data.usage.total_tokens / model.oneDollorToken
      cb && cb(chatCompletion.data.choices[0].message.content, cost, null)
    }).catch(err => {
      cb && cb(null, null, err)
    })
  }
}

module.exports = {
  ask,
  chat
}
