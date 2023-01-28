<template>
  <div class="page-title">
    <h1>
      DaVinci GPT-3
    </h1>
  </div>
  <login v-show="!isLogin" @logged="loggedIn"></login>
  <div v-show="isLogin">
    <div class="message-list">
      <div class="item" v-for="item in messages" :class="{
      dark: item.sender === 'Human'
    }">
        <pre>{{ item.sender === 'Human' ? item.text : item.displayText}}</pre>
      </div>
    </div>
    <div class="clear-message" v-show="messages.length > 1">
      <button @click="clearHistory">Clear History</button>
    </div>
    <div class="page-input">
      <div class="wrap">
        <input type="text" v-model="userInput" @focus="inputOnFocus = true" @blur="inputOnFocus = false"
               ref="input" placeholder="nicely ask something">
        <button @click="send" :disabled="streaming" :style="{
          opacity: streaming ? 0.3 : 1
        }">Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Login from './components/login.vue'
import axios from 'axios'
import {marked} from 'marked'
import {getApiBase, trim} from './utils/common.js'

let baseAPI = getApiBase()

export default {
  components: {Login},
  mounted() {
    this.listenForKeys()
    this.checkForLogin()
    this.readHistory()
  },
  data() {
    return {
      scrollDebounce: false,
      historyText: '',
      streaming: false,
      password: '',
      isLogin: false,
      userInput: '',
      inputOnFocus: false,
      messages: []
    }
  },
  methods: {
    clearHistory(){
      this.messages = []
      localStorage.setItem('history', '[]')
    },
    saveHistory() {
      let history = JSON.stringify(this.messages)
      localStorage.setItem('history', history)
    },
    readHistory() {
      let history = []
      if(localStorage.getItem('history')){
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
      }, 50)

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
        return false
      }
      axios.post(baseAPI + '/checkLogin', {
        token: localStorage.getItem('token')
      }).then(res => {
        _.isLogin = !!res.data.success
      })
    },
    listenForKeys() {
      let _ = this
      window.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' && _.inputOnFocus) {
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
        } else {
          h += `AI: ${el.text}\n`
        }
      })

      _.historyText = h
    },
    send() {
      let _ = this
      if (this.userInput === '') {
        return false
      }

      if (this.streaming) {
        return false
      }

      this.messages.push({
        sender: 'Human',
        text: this.userInput
      })

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
      }).then(response => {
        if (!response.ok) {
          throw new Error('HTTP error ' + response.status)
        }
        return response.body
      }).then(body => {
        let dataIndex = _.messages.length

        _.messages.push({
          sender: 'AI',
          text: ''
        })

        let reader = body.getReader()
        read()

        function read() {
          reader.read().then(({value, done}) => {
            if (done) {
              _.streaming = false
              _.composeHistory()
              _.scrollDown(true)
              _.saveHistory()
              return
            }
            let s = new TextDecoder().decode(value)
            _.scrollDown()
            _.messages[dataIndex].text += s
            _.messages[dataIndex].displayText = trim(_.messages[dataIndex].text)
            read()
          })
        }
      }).catch(err => {
        console.log(err)
        _.streaming = false
        _.composeHistory()
      })

      this.userInput = ''
      setTimeout(function () {
        _.$refs.input.focus()
      }, 20)
    }
  }
}
</script>