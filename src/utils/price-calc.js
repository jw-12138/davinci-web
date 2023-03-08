import GPT3Tokenizer from 'gpt3-tokenizer'

let tokenizer = new GPT3Tokenizer({type: 'gpt3'})

let models = {
  'davinci': {
    oneDollorToken: 1 / 0.02 * 1000,
    name: 'text-davinci-003',
    info: 'Complex intent, cause and effect, summarization for audience'
  },
  'chat-gpt': {
    oneDollorToken: 1 / 0.002 * 1000,
    name: 'gpt-3.5-turbo',
    info: 'The standard ChatGPT model'
  }
}

let modelName = function (index) {
  let name = ''
  switch (index) {
    case 0:
      name = 'davinci'
      break
    case 1:
      name = 'chat-gpt'
      break
  }
  return name
}

export function calcTokenCost(messages, model, instructionTokenCount) {
  let tokenCount = 0
  if (instructionTokenCount === undefined) {
    instructionTokenCount = 0
  }
  let m = modelName(model)

  tokenCount += instructionTokenCount

  messages.forEach(message => {
    let tokens = calcToken(message.text)
    tokenCount += tokens
  })

  return tokenCount / models[m].oneDollorToken
}

export function calcToken(text) {
  let encoded = tokenizer.encode(text)
  return encoded.bpe.length
}