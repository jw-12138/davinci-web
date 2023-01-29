<template>
  <div style="opacity: 0;" :style="{
    opacity: pageLoaded ? 1 : 0
  }">
    <div class="page-title">
      <h1>🤖 DaVinci GPT-3</h1>
    </div>
    <login v-show="!isLogin" @logged="loggedIn"></login>
    <div v-show="isLogin">
      <div v-show="messages.length === 0" style="line-height: 1.9">
        <p>
          👏 Introducing AI DaVinci by OpenAI, your virtual assistant for tasks, questions and conversation.
        </p>
        <p>
          😎 Capabilities:
        </p>
        <ul>
          <li>
            Remembers what user said earlier in the conversation
          </li>
          <li>
            Allows user to provide follow-up corrections
          </li>
        </ul>
        <p>
          😟 Limitations:
        </p>
        <ul>
          <li>
            May occasionally generate incorrect information
          </li>
          <li>
            May occasionally produce harmful instructions or biased content
          </li>
          <li>
            Limited knowledge of world and events after 2021
          </li>
        </ul>
      </div>
      <div class="message-list">
        <div
          class="item"
          v-for="item in messages"
          :class="{
            dark: item.sender === 'Human',
            sys: item.sender === 'System'
          }"
        >
          <pre v-if="item.sender === 'Human'">{{ item.text }}</pre>
          <pre v-if="item.sender === 'AI'">{{ item.displayText }}</pre>
          <span class="sys" v-if="item.sender === 'System'">
            {{item.text}}
          </span>
        </div>
      </div>
      <div class="clear-message" v-show="messages.length > 1">
        <button @click="clearHistory">Reset</button>
      </div>
      <div class="page-input">
        <div class="wrap">
          <textarea
            v-model="userInput"
            @focus="inputOnFocus = true"
            @blur="inputOnFocus = false"
            ref="input"
            placeholder="ask something"
            @compositionstart="userIsComposting = true"
            @compositionend="userIsComposting = false"
          ></textarea>
          <button
            @click="send"
            :disabled="streaming"
            :style="{
              opacity: streaming ? 0.3 : 1
            }"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Login from './components/login.vue'
import axios from 'axios'
import {getApiBase, trim} from './utils/common.js'

let baseAPI = getApiBase()
let introText = "Introducing AI DaVinci by OpenAI, a virtual assistant for tasks, questions and conversation. Utilize its capabilities and experience our cutting-edge technology. Reach out for assistance, we're here to help you improve productivity and efficiency."

export default {
  components: {Login},
  mounted() {
    this.listenForKeys()
    this.checkForLogin()
    this.readHistory()
  },
  data() {
    return {
      streamTimeoutCount: 0,
      streamTimeout: false,
      userIsComposting: false,
      isRenderingMarkdown: false,
      pageLoaded: false,
      scrollDebounce: false,
      historyText: '',
      streaming: false,
      password: '',
      isLogin: false,
      userInput: '',
      inputOnFocus: false,
      messages: [

      ]
    }
  },
  methods: {
    clearHistory() {
      this.messages = []
      this.historyText = ''
      this.userInput = ''
      this.streaming = false
      localStorage.setItem('history', '[]')
    },
    saveHistory() {
      let history = JSON.stringify(this.messages)
      localStorage.setItem('history', history)
    },
    readHistory() {
      let history = []
      if (localStorage.getItem('history')) {
        history = JSON.parse(localStorage.getItem('history'))
      }

      this.messages = history
      this.composeHistory()
      this.scrollDown()
    },
    scrollDown(force) {
      let _ = this
      if (_.scrollDebounce && !force) {
        return false
      }

      setTimeout(function () {
        window.scroll({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        })
      }, 80)

      _.scrollDebounce = true

      setTimeout(function () {
        _.scrollDebounce = false
      }, 150)
    },
    loggedIn() {
      this.isLogin = true
    },
    checkForLogin() {
      let _ = this
      if (!localStorage.getItem('token')) {
        _.isLogin = false
        _.pageLoaded = true
        return false
      }
      axios
        .post(baseAPI + '/checkLogin', {
          token: localStorage.getItem('token')
        })
        .then((res) => {
          _.isLogin = res.data.success
          _.pageLoaded = true
        })
    },
    listenForKeys() {
      let _ = this
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault()
        }
        if (e.key === 'Enter' && !_.userIsComposting && _.inputOnFocus) {
          _.send()
        }
      })
    },
    composeHistory() {
      let _ = this
      if (_.streaming) {
        return false
      }

      let h = ''
      _.messages.forEach((el, index) => {
        if (el.sender === 'Human') {
          h += `Human: ${el.text}\n`
        }
        if (el.sender === 'AI') {
          h += `AI: ${el.text}\n`
        }
      })

      _.historyText = h
    },
    send() {
      let _ = this
      if (trim(this.userInput) === '') {
        return false
      }

      if(trim(this.userInput) === '/reset'){
        _.clearHistory()
        return false
      }

      if (this.streaming) {
        return false
      }

      this.messages.push({
        sender: 'Human',
        text: trim(this.userInput)
      })

      let dataIndex = _.messages.length

      _.messages[dataIndex] = {
        sender: 'System',
        text: 'Thinking...'
      }

      _.saveHistory()

      _.streaming = true

      _.$nextTick(function () {
        _.scrollDown(true)
      })

      fetch(baseAPI + '/ask', {
        method: 'POST',
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          message: _.userInput,
          history: _.historyText
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        stream: true
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status)
          }
          _.messages[dataIndex] = {
            sender: "AI",
            text: ""
          }
          return response.body
        })
        .then((body) => {
          let reader = body.getReader()
          read()

          function read() {
            reader.read().then(({value, done}) => {
              if (done) {
                _.streaming = false
                _.composeHistory()
                _.scrollDown(true)
                _.saveHistory()
                _.streamTimeout = false
                if (_.streamTimeoutCount) {
                  clearTimeout(_.streamTimeoutCount)
                }
                return
              }
              let s = new TextDecoder().decode(value)
              _.scrollDown()
              _.messages[dataIndex].text += s
              _.messages[dataIndex].displayText = trim(_.messages[dataIndex].text)
              if (_.streamTimeoutCount) {
                clearTimeout(_.streamTimeoutCount)
              }
              _.streamTimeoutCount = setTimeout(function () {
                _.streamTimeout = true
              }, 5000)
              read()
            })
          }
        })
        .catch((err) => {
          console.log(err)
          _.streaming = false
          _.composeHistory()
        })

      this.userInput = ''
      setTimeout(function () {
        _.$refs.input.focus()
      }, 20)
    }
  },
  watch: {
    streamTimeout(val) {
      if (val) {
        this.streaming = false
        this.messages.push({
          sender: 'System', text: 'Stream did not end as expected, you can either ignore it or reset the conversation'
        })
      }
    }
  }
}
</script>
