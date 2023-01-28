require('dotenv').config()

const {Configuration, OpenAIApi} = require('openai')
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY
})
const openai = new OpenAIApi(configuration)

/**
 *
 * @param {string} m - model name ['davinci', 'curie', 'babbage', 'ada']
 * @param {object} options  - model options
 * @param {function} cb - callback function
 */
function ask(m, options, cb) {
  let models = {
    'davinci': {
      oneDollorToken: 1 / 0.02 * 1000,
      name: 'text-davinci-003',
      goodAt: 'Complex intent, cause and effect, summarization for audience'
    },
    'curie': {
      oneDollorToken: 1 / 0.002 * 1000,
      name: 'text-curie-001',
      goodAt: 'Language translation, complex classification, text sentiment, summarization'
    },
    'babbage': {
      oneDollorToken: 1 / 0.0005 * 1000,
      name: 'text-babbage-001',
      goodAt: 'Capable of straightforward tasks, very fast, and lower cost.'
    },
    'ada': {
      oneDollorToken: 1 / 0.0004 * 1000,
      name: 'text-ada-001',
      goodAt: 'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.'
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
      res.data.on('data', chunk => {
        let s = chunk.toString()
        let s_arr = s.split('data: ')
        let d = s_arr[1]
        if (d.startsWith('{')) {
          tokenCount++
          let d_obj = JSON.parse(d)
          cb && cb(d_obj.choices[0].text, null)
        } else {
          let bytes = (new TextEncoder().encode(promptOption.prompt)).length
          let promptTokens = parseInt((bytes / 4).toFixed(0))
          let cost = (tokenCount + promptTokens) / model.oneDollorToken
          cb && cb(null, cost)
        }
      })
    }
  }).catch(err => {
    cb && cb(null, null, err)
  })
}

module.exports = {
  ask
}
