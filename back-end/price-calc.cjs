const GPT3Tokenizer = require('gpt3-tokenizer').default
let tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

let models = {
  'davinci': {
    oneDollarTokenForPrompt: 1 / 0.02 * 1000,
    oneDollarTokenForCompletion: 1 / 0.02 * 1000,
    name: 'text-davinci-003',
    info: 'Complex intent, cause and effect, summarization for audience'
  },
  'chat-gpt': {
    oneDollarTokenForPrompt: 1 / 0.002 * 1000,
    oneDollarTokenForCompletion: 1 / 0.002 * 1000,
    name: 'gpt-3.5-turbo',
    info: 'The standard ChatGPT model'
  },
  'gpt-4': {
    oneDollarTokenForPrompt: 1 / 0.03 * 1000,
    oneDollarTokenForCompletion: 1 / 0.06 * 1000,
    name: 'gpt-4',
    info: 'The GPT-4 8k model'
  },
  'gpt-4-32k': {
    oneDollarTokenForPrompt: 1 / 0.06 * 1000,
    oneDollarTokenForCompletion: 1 / 0.12 * 1000,
    name: 'gpt-4-32k',
    info: 'The GPT-4 32k model'
  }
}

function calcTokenCost(model, tokenLength, tokenType) {
  let modelInfo = models[model]
  let cost = 0
  if (modelInfo) {
    if (tokenType === 'prompt') {
      cost = tokenLength / modelInfo.oneDollarTokenForPrompt
    } else {
      cost = tokenLength / modelInfo.oneDollarTokenForCompletion
    }
  }
  return cost
}

function calcToken(text) {
  let encoded = tokenizer.encode(text)
  return encoded.bpe.length
}

module.exports = {
  calcTokenCost,
  calcToken
}