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
      oneDollarTokenForPrompt: 1 / 0.02 * 1000,
      oneDollarTokenForCompletion: 1 / 0.02 * 1000,
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
    let completionTokenCount = 0

    if (!isStream) {
      let str = res.data.choices[0].text
      str = str.replace(/^\s+|\s+$/g, '')

      let completionTokens = tokenizer.encode(str).bpe.length
      let promptTokens = tokenizer.encode(options.prompt).bpe.length

      let completionCost = completionTokens / model.oneDollarTokenForCompletion
      let promptCost = promptTokens / model.oneDollarTokenForPrompt
      let cost = completionCost + promptCost

      cb && cb(str, cost)
    } else {
      res.data.on('end', function () {
        setTimeout(function () {
          let promptTokens = tokenizer.encode(options.prompt).bpe.length
          let promptCost = promptTokens / model.oneDollarTokenForPrompt
          let completionCost = completionTokenCount / model.oneDollarTokenForCompletion
          let cost = completionCost + promptCost
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
            completionTokenCount++
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
      info: 'The standard ChatGPT model',
      oneDollarTokenForPrompt: 1 / 0.002 * 1000,
      oneDollarTokenForCompletion: 1 / 0.002 * 1000
    },
    'gpt-4': {
      name: 'gpt-4',
      info: 'The GPT-4 model',
      oneDollarTokenForPrompt: 1 / 0.03 * 1000,
      oneDollarTokenForCompletion: 1 / 0.06 * 1000
    },
    'gpt-4-32k': {
      name: 'gpt-4-32k',
      info: 'The GPT-4 model',
      oneDollarTokenForPrompt: 1 / 0.06 * 1000,
      oneDollarTokenForCompletion: 1 / 0.12 * 1000
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
    let completionTokenCount = 0
    openai.createChatCompletion(options, axiosOptions).then(chatCompletion => {
      chatCompletion.data.on('end', function () {
        let promptMessages = ''
        options.messages.forEach(message => {
          promptMessages += message.content + ' '
        })
        let promptTokens = tokenizer.encode(promptMessages).bpe.length

        let promptCost = promptTokens / model.oneDollarTokenForPrompt
        let completionCost = completionTokenCount / model.oneDollarTokenForCompletion

        let cost = completionCost + promptCost
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
            completionTokenCount++
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
      let promptMessages = ''
      options.messages.forEach(message => {
        promptMessages += message.content + ' '
      })
      let completion = chatCompletion.data.choices[0].message.content
      let promptTokens = tokenizer.encode(promptMessages).bpe.length
      let completionTokens = tokenizer.encode(completion).bpe.length

      let promptCost = promptTokens / model.oneDollarTokenForPrompt
      let completionCost = completionTokens / model.oneDollarTokenForCompletion

      let cost = completionCost + promptCost
      cb && cb(completion, cost, null)
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
