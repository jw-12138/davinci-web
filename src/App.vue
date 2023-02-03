<template>
  <div
    style="opacity: 0"
    :style="{
      opacity: pageLoaded ? 1 : 0
    }"
  >
    <div class="page-title">
      <h1>🤖 DaVinci GPT-3</h1>
    </div>
    <login v-show="!isLogin" @logged="loggedIn"></login>
    <div v-show="isLogin">
      <div v-show="messages.length === 0" style="line-height: 1.9">
        <p>
          👏 Introducing AI DaVinci by OpenAI, your virtual assistant for tasks,
          questions and conversation.
        </p>
        <p> 😎 Capabilities: </p>
        <ul>
          <li> Remembers what user said earlier in the conversation</li>
          <li> Allows user to provide follow-up corrections</li>
        </ul>
        <p> 😟 Limitations: </p>
        <ul>
          <li> May occasionally generate incorrect information</li>
          <li>
            May occasionally produce harmful instructions or biased content
          </li>
          <li> Limited knowledge of world and events after 2021</li>
        </ul>
      </div>
      <div class="message-list">
        <div
          class="item"
          v-for="(item, index) in messages"
          :class="{
            dark: item.sender === 'Human',
            sys: item.sender === 'System'
          }"
        >
          <div v-if="item.sender === 'Human'" class="human">
            <span :style="{
              display: editIndex === index ? 'none' : 'inline'
            }">
            {{ item.text }}</span>
            <div class="tools">
              <button title="Cancel" @click="editIndex = undefined; editMessage = undefined" :style="{
                display: editIndex === index ? 'inline' : 'none'
              }">
                <i class="iconfont">&#xe685;</i>
              </button>
              <button title="Edit" @click="handleEdit(index)" :style="{
                display: editIndex === index ? 'none' : 'inline'
              }" :disabled="streaming">
                <i class="iconfont">&#xe66e;</i>
              </button>
              <button title="Regenerate" @click="reGen(index)" :disabled="streaming">
                <i class="iconfont">&#xe67b;</i>
              </button>
            </div>
            <div class="edit-tools" v-if="editIndex === index">
              <textarea v-model="editMessage" :id="'editingArea_' + index"
                        @focus="inputOnFocus = true"
                        @blur="inputOnFocus = false"></textarea>
            </div>
          </div>
          <div v-if="item.sender === 'AI'" v-html="item.displayText"></div>
          <div class="ai-cost" v-if="item.sender === 'AI'">
            <span v-if="item.cost"
            >{{ item.bytes }} bytes, ${{ item.cost }}</span
            >
            <span v-else>{{ item.bytes }} bytes</span>
          </div>
          <span class="sys" v-if="item.sender === 'System'" v-html="item.text">
          </span>
        </div>
      </div>
      <div class="clear-message" v-show="messages.length > 1">
        <button class="plain" @click="reGen(null)" :disabled="streaming">
          <i class="iconfont" style="top: 2px">&#xe67b;</i> Regenerate
        </button>
        <button @click="clearHistory"><i class="iconfont" style="top: 2px">&#xe66a;</i> Reset</button>
      </div>
      <div class="share" v-show="messages.length > 1 && !streaming">
        <a @click="share" href="javascript:;"><i class="iconfont spin" v-show="sharing">&#xe676;</i><i class="iconfont" v-show="!sharing">&#xe67d;</i> Publish this conversation</a>
      </div>

      <div v-show="shareLink" style="padding: 10px 0; font-size: 12px; text-align: center; margin-top: -10px">
        <a :href="shareLink" target="_blank">{{shareLink}}</a>
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
            @click="composeMessage"
            :disabled="streaming"
            :style="{
              opacity: streaming ? 0.3 : 1
            }"
          >
            <i class="iconfont" style="position: relative; top: 1px;">&#xe67a;</i> Send
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
import hljs from 'highlight.js/lib/common'

let baseAPI = getApiBase()

export default {
  components: {Login},
  mounted() {
    this.listenForKeys()
    this.checkForLogin()
    this.readHistory()
    this.getShareLink()
  },
  data() {
    return {
      editIndex: undefined,
      editMessage: undefined,
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
      messages: [],
      sharing: false,
      shareLink: null
    }
  },
  methods: {
    getShareLink(){
      if (localStorage.getItem('shareLink')) {
        this.shareLink = localStorage.getItem('shareLink')
      }
    },
    share() {
      if (this.sharing) {
        return
      }
      let c = confirm('Please make sure that this conversation does not contain any sensitive information. Are you sure you want to publish this conversation?')
      if (!c) return

      let token = localStorage.getItem('token')

      axios.post(baseAPI + '/share', {
        history: JSON.stringify(this.messages),
        token: token
      }).then(res => {
        this.sharing = false
        this.shareLink = window.location.origin + '/s.html?id=' + res.data.id
        localStorage.setItem('shareLink', this.shareLink)
        this.scrollDown()
      })
    },
    clearHistory() {
      this.messages = []
      this.historyText = ''
      this.userInput = ''
      this.streaming = false
      localStorage.removeItem('history')
      localStorage.removeItem('shareLink')
      this.shareLink = ''
    },
    saveHistory() {
      let history = JSON.stringify(this.messages)
      localStorage.setItem('history', history)
    },
    handleEdit(index) {
      this.editIndex = index
      this.editMessage = this.messages[index].text
      this.$nextTick(function () {
        document.getElementById('editingArea_' + index).focus()
      })
    },
    readHistory() {
      let history = []
      let _ = this
      if (localStorage.getItem('history')) {
        history = JSON.parse(localStorage.getItem('history'))
      }

      for (let i = 0; i < history.length; i++) {
        let el = history[i]
        if (el === null) {
          _.clearHistory()
          break
        }
      }

      this.messages = history
      this.$nextTick(function () {
        _.highlight()
      })
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
          if (_.editIndex !== undefined) {
            _.reGen(_.editIndex)
          } else {
            _.composeMessage()
          }
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
    reGen(position) {
      let _ = this
      if (position === null) {
        position = _.messages.length - 2
      }

      let length = _.messages.length

      _.userInput = _.editMessage || _.messages[position].text
      _.messages.splice(position, length - position)

      _.editIndex = undefined
      _.editMessage = undefined

      _.composeHistory()
      _.composeMessage(true)
    },
    composeMessage(repost) {
      let _ = this
      if (trim(this.userInput) === '') {
        return false
      }

      if (trim(this.userInput) === '/reset') {
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

      _.saveHistory()

      _.messages[dataIndex] = {
        sender: 'System',
        text: '<i class="iconfont spin">&#xe676;</i> Thinking...'
      }

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
            sender: 'AI',
            text: ''
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
              if (s.includes('####[COST]:')) {
                _.messages[dataIndex].cost = s.replace('####[COST]:', '')
                read()
                return false
              }
              _.scrollDown()
              _.messages[dataIndex].text += s
              _.messages[dataIndex].bytes = new TextEncoder().encode(
                _.messages[dataIndex].text
              ).length
              _.messages[dataIndex].displayText = trim(
                _.messages[dataIndex].text
              )
              _.saveHistory()
              if (_.streamTimeoutCount) {
                clearTimeout(_.streamTimeoutCount)
              }
              _.streamTimeoutCount = setTimeout(function () {
                _.streamTimeout = true
              }, 3000)
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
    },
    highlight() {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el)
      })
    }
  },
  watch: {
    streaming(val) {
      let _ = this
      if (!val) {
        _.$nextTick(() => {
          _.highlight()
        })
      }
    },
    streamTimeout(val) {
      let _ = this
      if (val) {
        this.streaming = false
        this.messages.push({
          sender: 'System',
          text: 'seems like the text stream did not end as expected, you can either ignore it or reset the conversation'
        })
        this.scrollDown(true)
        this.composeHistory()
        this.saveHistory()
      }
    }
  }
}
</script>
