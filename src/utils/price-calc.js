import GPT3Tokenizer from 'gpt3-tokenizer'

let tokenizer = new GPT3Tokenizer({type: 'gpt3'})

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
  let promptTokenCount = 0
  let completionTokenCount = 0
  if (instructionTokenCount === undefined) {
    instructionTokenCount = 0
  }
  let m = modelName(model)

  promptTokenCount += instructionTokenCount

  messages.forEach(message => {
    let tokens = calcToken(message.text)
    if (message.sender === 'AI') {
      completionTokenCount += tokens
    } else {
      promptTokenCount += tokens
    }
  })

  let promptCost = promptTokenCount / models[m].oneDollarTokenForPrompt
  let completionCost = completionTokenCount / models[m].oneDollarTokenForCompletion
  let totalCost = (promptCost + completionCost).toFixed(6)

  return totalCost
}

export function calcToken(text) {
  let encoded = tokenizer.encode(text)
  return encoded.bpe.length
}