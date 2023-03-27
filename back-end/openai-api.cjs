require('dotenv').config()

const {Configuration, OpenAIApi} = require('openai')
const {
  calcTokenCost,
  calcToken
} = require('./price-calc.cjs')

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
      name: 'text-davinci-003',
      info: 'Complex intent, cause and effect, summarization for audience'
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
    if (!isStream) {
      let str = res.data.choices[0].text
      str = str.replace(/^\s+|\s+$/g, '')

      let completionTokens = calcToken(str)
      let promptTokens = calcToken(options.prompt)

      cb && cb(str, {
        promptTokens,
        completionTokens
      })
    } else {
      let completion = ''
      res.data.on('end', function () {
        let promptTokens = calcToken(options.prompt)
        let completionTokens = calcToken(completion)
        cb && cb(null, {
          promptTokens,
          completionTokens
        })
      })

      res.data.on('data', chunk => {
        let eventData = chunk.toString()
        let s = eventData.split('\n\n')
        s.pop()
        s.forEach(el => {
          let s_arr = el.split('data: ')
          let d = s_arr[1]
          if (d.startsWith('{')) {
            let d_obj = JSON.parse(d)
            completion += d_obj.choices[0].text
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

  let completion = ''
  openai.createChatCompletion(options, {
    responseType: 'stream'
  }).then(chatCompletion => {
    chatCompletion.data.on('end', function () {
      let promptTokens = 0
      options.messages.forEach(message => {
        promptTokens += calcToken(message.content)
      })
      console.log(completion)
      let completionTokens = calcToken(completion)
      cb && cb(null, {
        promptTokens,
        completionTokens
      })
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
          completion += d_obj.choices[0].delta.content || ''
          cb && cb(d_obj.choices[0].delta.content, null)
        }
      })
    })
  }).catch(err => {
    console.log(err.toJSON())
    cb && cb(null, null, err)
  })
}

module.exports = {
  ask,
  chat
}
