<template>
  <div class="chat-mode" ref="chat_mode_box">
    <h3 style="margin-top: 0; margin-bottom: 10px; cursor:pointer;" >
      <button @click="customModeExpand = !customModeExpand">
        <i class="iconfont icon-arrow-right" :style="{
        display: 'inline-block',
        transition: 'transform .3s ease',
        transform: customModeExpand ? 'rotate(90deg)' : 'rotate(0deg)'
      }"></i> Custom Mode
      </button>
    </h3>
    <Transition duration="300">
      <div v-show="customModeExpand">
        <div class="title" style="margin-top: 0">
          <label for="chat_mode">Instructions ({{ activeChatMode.instructionTokens ? activeChatMode.instructionTokens : 0 }}
            tokens):</label>
        </div>
        <div>
          <textarea id="chat_mode" v-model="activeChatMode.instructions"></textarea>
        </div>
        <div class="title">
          <label for="prefix">Message Modifiers:</label>
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
            - You can use <code>Instructions</code> and <code>Message Modifiers</code> to create a custom tools based on
            GPT-3.
          </p>
          <p>
            - <code>No History</code> option works great for non-conversation tasks like translation, code generation and
            writing improvement, etc.
          </p>
          <p>
            - To add a new custom shortcut, edit the <code>Instructions</code>, <code>Message Modifiers</code> and <code>No History</code> first, then hit the button with the plus sign.
          </p>
        </div>
      </div>
    </Transition>
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
    window.addEventListener('resize', this.calcHeight)

    if(localStorage.getItem('customModeExpand') && localStorage.getItem('customModeExpand') === 'true'){
      this.customModeExpand = true
    }
  },
  methods: {
    calcHeight(){
      this.$refs.chat_mode_box.style.maxHeight = this.customModeExpand ? '810px' : '45px'
    },
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
      this.activeChatMode = JSON.parse(JSON.stringify(this.chatModeData[index]))
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
      this.calcHeight()
      localStorage.setItem('customShortCuts', JSON.stringify(this.customShortCuts))
    }
  },
  data() {
    return {
      customModeExpand: false,
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
          title: 'Translator',
          instructions: `You're a translator now, your only job is to translate the user input into Chinese, If user input is Chinese, translate it into English.`,
          prefix: '"',
          suffix: '"',
          noHistory: true
        },
        {
          title: 'Writing Helper',
          instructions: `You're a writing helper, your only job is to improve the user input.`,
          prefix: 'Please improve this:"',
          suffix: '"',
          noHistory: true
        },
        {
          title: 'Python Helper',
          instructions: `The user is about to ask you some questions about Python and Flask, you should use "code blocks" syntax from markdown including language name to encapsulate any part in responses that's code. You should also use bold syntax from markdown on the relevant parts of the responses to improve readability. And make sure to provide detailed explanations.`,
          prefix: '',
          suffix: '',
          noHistory: false
        }
      ]
    }
  },
  watch: {
    customModeExpand(val){
      this.calcHeight()
      localStorage.setItem('customModeExpand', val)
    },
    activeChatMode: {
      deep: true,
      handler: function (val) {
        let _ = this
        if (val.instructions !== undefined) {
          this.activeChatMode.instructionTokens = calcToken(val.instructions)
        }
        localStorage.setItem('chatMode', JSON.stringify(val))
        this.$emit('data-change', val)
        this.calcHeight()
      }
    },
    customShortCuts() {
      this.updateLocalCustomShortCuts()
    }
  }
}
</script>