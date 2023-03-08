<template>
  <div class="chat-mode">
    <h3 style="margin-top: 0; margin-bottom: 10px">
      Custom Mode
    </h3>
    <div class="title" style="margin-top: 0">
      <label for="chat_mode">Instructions ({{ activeChatMode.instructionTokens ? activeChatMode.instructionTokens : 0 }}
        tokens):</label>
    </div>
    <div>
      <textarea id="chat_mode" v-model="activeChatMode.instructions"></textarea>
    </div>
    <div class="title">
      <label for="prefix">Message Modifier:</label>
    </div>
    <div class="message-modifier">
      <input placeholder="Prefix" id="prefix" type="text" v-model="activeChatMode.prefix"> <code>message</code> <input
      type="text" placeholder="Suffix" v-model="activeChatMode.suffix">
    </div>
    <div style="margin-top: 10px">
      <v-check-box @check-change="handleCheckChange" :checked="activeChatMode.noHistory">No History</v-check-box>
    </div>
    <div class="title">
      <label>Shortcuts:</label>
    </div>
    <div class="switches">
      <button class="plain" v-for="(item, index) in chatModeData" @click="handleModeChange(index)">{{ item.title }}
      </button>
      <button @click="addCustomShortcuts"><i class="iconfont icon-add" style="top: 2px; left: 2px"></i></button>
      <br v-if="customShortCuts.length">
      <span v-for="(item, index) in customShortCuts" style="position: relative">
        <button style="padding-right: 30px" class="plain" @click="handleCustomModeChange(index)"
                :disabled="customShortcutsDeleteFocus === index">
        {{ item.title }}
        </button>
        <button class="no_style" style="position: absolute; right: 15px; top: -2px" @click="deleteCustomShortcuts(index)">
          <i class="iconfont icon-ashbin"
             @mouseenter="customShortcutsDeleteFocus = index"
             @mouseleave="customShortcutsDeleteFocus = null"
             style="top: 0;"></i>
        </button>
      </span>
      <br>
    </div>
    <div class="info">
      <p>
        <b>Note:</b> Custom Mode only works for <code>gpt-3.5-turbo</code>
      </p>
      <p>
        You can use <code>Instructions</code> and <code>Message Modifiers</code> to create a custom tools based on
        GPT-3.
      </p>
      <p>
        DaVinci will ignore any message history when <code>No History</code> is enabled, it works great for non-conversation tasks like translation, code generation and
        writing improvement etc.
      </p>
    </div>
  </div>
</template>

<script>
import VCheckBox from './v-check-box.vue'
import {calcToken} from '../utils/price-calc.js'

export default {
  name: 'chat-mode',
  components: {VCheckBox},
  mounted() {
    if (localStorage.getItem('chatMode')) {
      this.activeChatMode = JSON.parse(localStorage.getItem('chatMode'))
    } else {
      this.activeChatMode = this.chatModeData[0]
      localStorage.setItem('chatMode', JSON.stringify(this.chatModeData))
    }

    this.readLocalCustomShortCuts()
  },
  methods: {
    addCustomShortcuts() {
      this.customShortcutsDeleteFocus = null
      let title = prompt('Please enter a title for this custom shortcut: ')
      if (!title) {
        return
      }
      this.customShortCuts.push({
        title: title,
        instructions: this.activeChatMode.instructions,
        prefix: this.activeChatMode.prefix,
        suffix: this.activeChatMode.suffix,
        noHistory: this.activeChatMode.noHistory
      })
      this.updateLocalCustomShortCuts()
    },
    deleteCustomShortcuts(index) {
      let doDelete = confirm('Are you sure to delete this custom shortcut?')
      if (!doDelete) {
        return
      }
      this.customShortCuts.splice(index, 1)
      this.updateLocalCustomShortCuts()
    },
    handleModeChange(index) {
      this.activeChatMode = this.chatModeData[index]
    },
    handleCustomModeChange(index) {
      this.activeChatMode = this.customShortCuts[index]
    },
    handleCheckChange(val) {
      this.activeChatMode.noHistory = val
    },
    readLocalCustomShortCuts() {
      if (localStorage.getItem('customShortCuts')) {
        this.customShortCuts = JSON.parse(localStorage.getItem('customShortCuts'))
      }
    },
    updateLocalCustomShortCuts() {
      localStorage.setItem('customShortCuts', JSON.stringify(this.customShortCuts))
    }
  },
  data() {
    return {
      customShortcutsDeleteFocus: null,
      noHistoryFocus: false,
      activeChatMode: {},
      customShortCuts: [],
      chatModeData: [
        {
          title: 'ChatGPT',
          instructions: `Your name is DaVinci, and you are a large language model trained by OpenAI. Your job is to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.
If the input is a question, try your best to answer it. Otherwise, provide as much information as you can.
You should use "code blocks" syntax from markdown including language name to encapsulate any part in responses that's longer-format content such as poem, code, lyrics.
Provide programming language name in code blocks if possible.
You should also use bold syntax from markdown on the relevant parts of the responses to improve readability.
If your answer contains code, make sure to provide detailed explanations.
You can understand and communicate fluently in the user's language of choice such as English,中文,日本语,Espanol,Francais or Deutsch.`,
          prefix: '',
          suffix: '',
          noHistory: false
        },
        {
          title: 'Translator ANY/CN',
          instructions: `You're a translator now, your only job is to translate the user input  into Chinese, If user input is Chinese, translate it into English.`,
          prefix: '"',
          suffix: '"',
          noHistory: true
        },
        {
          title: 'Writing Helper',
          instructions: '',
          prefix: 'Please improve this writing:"',
          suffix: '"',
          noHistory: true
        }
      ]
    }
  },
  watch: {
    activeChatMode: {
      deep: true,
      handler: function (val) {
        let _ = this
        if (val.instructions !== undefined) {
          this.activeChatMode.instructionTokens = calcToken(val.instructions)
        }
        localStorage.setItem('chatMode', JSON.stringify(val))
        this.$emit('data-change', val)
      }
    },
    customShortCuts() {
      this.updateLocalCustomShortCuts()
    }
  }
}
</script>