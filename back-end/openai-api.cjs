require('dotenv').config()

const {Configuration, OpenAIApi} = require('openai')
const GPT3Tokenizer = require('gpt3-tokenizer').default
const tokenizer = new GPT3Tokenizer({type: 'gpt3'})

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
      oneDollarToken: 1 / 0.02 * 1000,
      name: 'text-davinci-003',
      info: 'Complex intent, cause and effect, summarization for audience'
    },
    'curie': {
      oneDollarToken: 1 / 0.002 * 1000,
      name: 'text-curie-001',
      info: 'Language translation, complex classification, text sentiment, summarization'
    },
    'babbage': {
      oneDollarToken: 1 / 0.0005 * 1000,
      name: 'text-babbage-001',
      info: 'Capable of straightforward tasks, very fast, and lower cost.'
    },
    'ada': {
      oneDollarToken: 1 / 0.0004 * 1000,
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

      cb && cb(str, 0)
    } else {
      res.data.on('end', function () {
        setTimeout(function () {
          cb && cb(null, 1)
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
      name: 'gpt-3.5-turbo',
      info: 'The standard ChatGPT model'
    },
    'gpt-4': {
      name: 'gpt-4',
      info: 'The GPT-4 model'
    },
    'gpt-4-32k': {
      name: 'gpt-4-32k',
      info: 'The GPT-4 model'
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
        cb && cb(null, 1)
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
      cb && cb(chatCompletion.data.choices[0].message.content, 1, null)
    }).catch(err => {
      console.log(err.toJSON())
      cb && cb(null, null, err)
    })
  }
}

module.exports = {
  ask,
  chat
}
