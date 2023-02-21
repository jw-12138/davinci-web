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
    <div v-show="!isLogin">
      <div style="line-height: 1.9">
        <p>
          👏 Introducing AI DaVinci by OpenAI, your virtual assistant for tasks,
          questions and conversation. Open Sourced on <a href="https://github.com/jw-12138/davinci-web" target="_blank">GitHub</a>.
        </p>
      </div>
    </div>
    <login v-show="!isLogin" @logged="loggedIn"></login>
    <div v-show="isLogin">
      <div v-show="messages.length < 1" style="margin-bottom: 20px">
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
        <p>
          🙌 You can also type commands to trigger certain functions.
        </p>
        <div>
          <table>
            <tr>
              <td>
                <code>/reset</code>
              </td>
              <td>
                Reset the conversation
              </td>
            </tr>
            <tr>
              <td>
                <code>/pub</code>
              </td>
              <td>
                Publish the conversation
              </td>
            </tr>
            <tr>
              <td>
                <code>/regen</code>
              </td>
              <td>
                Regenerate the last message
              </td>
            </tr>
            <tr>
              <td>
                <code>/logout</code>
              </td>
              <td>
                Logout
              </td>
            </tr>
          </table>
        </div>

        <p>
          👻 About this project:
        </p>
        <ul>
          <li>
            Open Sourced on <a href="https://github.com/jw-12138/davinci-web" target="_blank">GitHub</a>
          </li>
        </ul>
      </div>
      <div class="message-list" v-show="messages.length">
        <div
          class="item"
          v-for="(item, index) in display_messages"
          :class="{
            dark: item.sender === 'Human',
            sys: item.sender === 'System'
          }"
        >
          <div v-if="item.sender === 'Human'" class="human">
            <span :style="{
              display: editIndex === item.index ? 'none' : 'inline'
            }">
            {{ item.text }}</span>
            <div class="edit-tools" v-if="editIndex === item.index">
              <input enterkeyhint="done" v-model="editMessage" :id="'editingArea_' + item.index"
                        @keydown="preventDefault"
                        @focus="inputOnFocus = true"
                        @blur="inputOnFocus = false">
            </div>
            <div class="tools">
              <button title="Cancel" @click="editIndex = undefined; editMessage = undefined" :style="{
                display: editIndex === item.index ? 'inline' : 'none'
              }">
                <i class="iconfont">&#xe685;</i>
              </button>
              <button title="Edit" @click="handleEdit(item.index)" :style="{
                display: editIndex === item.index ? 'none' : 'inline'
              }" :disabled="streaming">
                <i class="iconfont">&#xe66e;</i>
              </button>
              <button title="Regenerate" @click="reGen(item.index)" :disabled="streaming">
                <i class="iconfont">&#xe67b;</i>
              </button>
            </div>

          </div>
          <div v-if="item.sender === 'AI' && item.displayText" v-html="item.displayText"
               style="font-family: 'Jetbrains Mono', monospace"></div>
          <pre style="background: transparent; padding: 0; white-space: pre-wrap; font-size: 14px"
               v-show="item.sender === 'AI' && !item.displayText">{{ item.text }}</pre>
          <div class="ai-cost" v-if="item.sender === 'AI'">
            <span v-if="item.cost"
            >{{ item.bytes }} bytes, ${{ item.cost }}</span
            >
            <span v-else>{{ item.bytes }} bytes</span>
          </div>
        </div>
      </div>
      <div style="padding: 20px 0 30px; text-align: center; font-size: 12px" v-show="systemInfo" v-html="systemInfo">

      </div>
      <div style="text-align: center" aria-label="Settings">
        <div style="display: inline-block; position: relative">
          <div class="page-options" v-if="showPageOptions" style="animation: fadeIn .3s ease">
            <div class="item" v-show="messages.length > 1">
              <button @click="clearHistory" title="Reset current conversation">
                <i class="iconfont" style="top: 2px">&#xe66a;</i>
                <span>Reset</span>
              </button>
            </div>
            <div class="item" v-show="messages.length > 1" title="Regenerate the last message">
              <button @click="reGen(null)" :disabled="streaming">
                <i class="iconfont" style="top: 2px">&#xe67b;</i>
                <span>Regenerate</span>
              </button>
            </div>
            <div class="item" v-show="messages.length > 1">
              <button :disabled="sharing || streaming" @click="share" title="Publish this conversation">
                <i class="iconfont" style="top: 2px; left: 2px">&#xe67d;</i> <span>Publish</span>
              </button>
            </div>
            <hr v-show="messages.length > 1">
            <div class="item">
              <button @click="logout" title="Logout" :disabled="loggingOut">
                <i class="iconfont" style="top: 2px; left: 2px">&#xe680;</i> <span>Logout</span>
              </button>
            </div>
          </div>

          <button role="menuitem" @click.stop="showPageOptions = !showPageOptions" aria-haspopup="true">
            <i class="iconfont" style="top: 2px" v-if="!showPageOptions">&#xe67e;</i>
            <i class="iconfont" style="top: 2px" v-if="showPageOptions">&#xe685;</i> Settings
          </button>
        </div>
      </div>

      <div v-show="shareLink" style="padding: 10px 0; font-size: 12px; text-align: center;">
        <a :href="shareLink" target="_blank">{{ shareLink }}</a>
      </div>
      <div class="page-input">
        <div class="wrap">
          <input
            enterkeyhint="send"
            :disabled="editIndex"
            v-model="userInput"
            @focus="inputOnFocus = true; showPageOptions = false"
            @blur="inputOnFocus = false"
            ref="input"
            placeholder="ask something"
            @compositionstart="userIsComposting = true"
            @compositionend="userIsComposting = false"
          >
          <button
            enterkeyhint="send"
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
import xss from 'xss'
import {marked} from 'marked'

let baseAPI = getApiBase()
let busBaseApi = 'https://api.jw1.dev'

export default {
  components: {Login},
  mounted() {
    let _ = this
    let search = new URLSearchParams(location.search)
    let loadedTime = Date.now()
    if (search.get('id')){
      this.getLoginInfo(search.get('id'))
    } else {
      this.checkForLogin()
    }
    this.listenForKeys()
    this.readHistory()
    this.updateDisplayMessages()
    this.getShareLink()
    window.addEventListener('click', function () {
      _.showPageOptions = false
    })

    this.systemCheck = setInterval(function () {
      let nowTime = Date.now()
      let offset = Math.floor((nowTime - loadedTime) / 1000)

      if(offset > 7200){
        _.checkForLogin()
        clearInterval(_.systemCheck)
      }
    }, 60 * 1000)
  },
  data() {
    return {
      systemCheck: null,
      systemInfo: '',
      showPageOptions: false,
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
      display_messages: [],
      sharing: false,
      shareLink: null,
      loggingOut: false
    }
  },
  methods: {
    getLoginInfo(id){
      axios({
        url: busBaseApi + '/davinci/get_info',
        method: 'post',
        data: {
          id
        }
      }).then(res => {
        if(res.data.status === 0){
          let d = JSON.parse(res.data.data.login_info)
          Object.keys(d).forEach(key => {
            localStorage.setItem(key, d[key])
          })

          location.href = location.href.split('?')[0]
        }
      }).catch(err => {
        console.log(err)
      })
    },
    updateDisplayMessages() {
      let temp = []
      temp = this.messages.map((el, index) => {
        el.index = index
        return el
      })
      this.display_messages = temp.reverse()
    },
    preventDefault(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        return false
      }
    },
    logout() {
      let c = confirm('Are you sure you want to logout?')

      if(!c){
        return
      }

      this.isLogin = false
      axios({
        url: 'https://cpo9n0zgj6.execute-api.ap-northeast-2.amazonaws.com/prod/davinci/revoke',
        method: 'post',
        data: {
          Token: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.jw1dev.refreshToken`),
          ClientId: USER_POOL_CLIENT_ID,
        }
      }).then(res => {
        localStorage.clear()
      }).catch(err => {
        console.log(err)
        localStorage.clear()
      })
    },
    getShareLink() {
      if (localStorage.getItem('shareLink')) {
        this.shareLink = localStorage.getItem('shareLink')
      }
    },
    share() {
      if (this.messages.length < 1) {
        alert('Please ask something first.')
        return false
      }
      if (this.sharing) {
        return
      }
      let c = confirm('Please make sure that this conversation does not contain any sensitive information. Are you sure you want to publish this conversation?')
      if (!c) return

      this.shareLink = ''
      localStorage.removeItem('shareLink')

      axios.post(baseAPI + '/share', {
        history: JSON.stringify(this.messages),
        token: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.jw1dev.accessToken`),
        userPool: USER_POOL_CLIENT_ID,
      }).then(res => {
        this.sharing = false
        this.shareLink = window.location.origin + '/s.html?id=' + res.data.id
        localStorage.setItem('shareLink', this.shareLink)
        this.scrollDown()
      })
    },
    clearHistory() {
      let _ = this
      this.messages = []
      this.historyText = ''
      this.userInput = ''
      this.streaming = false
      this.systemInfo = ''
      localStorage.removeItem('history')
      localStorage.removeItem('shareLink')
      this.shareLink = ''
      clearTimeout(_.streamTimeoutCount)
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

      let frame = document.querySelector('html')

      setTimeout(function () {
        frame.scroll({
          top: frame.scrollHeight - frame.clientHeight + 270,
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
      this.$refs.input.focus()
    },
    checkForLogin() {
      let _ = this

      if (!localStorage.getItem('fromID')) {
        _.isLogin = false
        _.pageLoaded = true

        return false
      }

      if (localStorage.getItem('fromID').split('_')[0] === 'key') {
        _.isLogin = true
        _.pageLoaded = true

        return false
      }

      axios({
        method: 'post',
        url: 'https://api.jw1.dev/cognito/renew',
        data: {
          refreshToken: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.jw1dev.refreshToken`),
          userPool: USER_POOL_CLIENT_ID
        }
      }).then(res => {
        if(!res.data.AuthenticationResult){
          throw new Error('oops')
        }
        localStorage.setItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.jw1dev.accessToken`, res.data.AuthenticationResult.AccessToken)
        localStorage.setItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.jw1dev.idToken`, res.data.AuthenticationResult.IdToken)
        _.isLogin = true
        _.pageLoaded = true
      }).catch(err => {
        console.log(err)
        _.isLogin = false
        _.pageLoaded = true
      })
    },
    listenForKeys() {
      let _ = this
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !_.userIsComposting && _.inputOnFocus) {
          if (_.editIndex !== undefined) {
            _.reGen(_.editIndex)
          } else {
            _.composeMessage()
          }
        }

        if (e.key === 'Escape') {
          _.showPageOptions = false
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

      if (_.messages.length < 1) {
        return false
      }

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
    composeMessage() {
      let _ = this
      if (trim(this.userInput) === '') {
        return false
      }

      _.systemInfo = ''

      if (trim(this.userInput) === '/reset') {
        setTimeout(() => {
          _.userInput = ''
        }, 30)
        _.clearHistory()
        return false
      }

      if (trim(this.userInput) === '/logout') {
        _.logout()
        setTimeout(() => {
          _.userInput = ''
        }, 30)
        return false
      }

      if (trim(this.userInput) === '/regen') {
        _.reGen(null)
        setTimeout(() => {
          _.userInput = ''
        }, 30)
        return false
      }

      if (trim(this.userInput) === '/pub') {
        _.share()
        setTimeout(() => {
          _.userInput = ''
        }, 30)
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

      _.systemInfo = '<div style="text-align: center"><i class="iconfont spin">&#xe676;</i> Thinking...</div>'

      _.shareLink = ''
      localStorage.removeItem('shareLink')

      _.streaming = true

      _.$nextTick(function () {
        _.scrollDown(true)
      })

      let userInput = _.userInput
      setTimeout(() => {
        _.userInput = ''
      }, 30)

      this.updateDisplayMessages()

      fetch(baseAPI + '/ask', {
        method: 'POST',
        body: JSON.stringify({
          token: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.jw1dev.accessToken`) || localStorage.getItem('fromID'),
          userPool: USER_POOL_CLIENT_ID,
          message: userInput,
          history: _.historyText
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        stream: true
      })
        .then((response) => {
          _.systemInfo = ''
          _.messages[dataIndex] = {
            sender: 'AI',
            text: ''
          }
          if (!response.ok) {
            if (response.status === 429) {
              _.systemInfo = 'Too many requests, please try again later'
            }
            throw new Error('HTTP error ' + response.status)
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
                _.messages[dataIndex].displayText = marked(_.messages[dataIndex].text)
                _.messages[dataIndex].displayText = xss(_.messages[dataIndex].displayText, {
                  whiteList: {
                    p: [],
                    pre: [],
                    code: [],
                    br: [],
                    ol: [],
                    li: [],
                    ul: [],
                    blockquote: [],
                    strong: [],
                    b: []
                  }
                })

                _.composeHistory()
                _.scrollDown(true)
                _.saveHistory()
                _.updateDisplayMessages()
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

              _.messages[dataIndex].text = trim(_.messages[dataIndex].text)

              _.saveHistory()
              _.updateDisplayMessages()
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
          _.systemInfo = 'Something went wrong, please try again later'
        })
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
        this.systemInfo = 'Seems like the text stream did not end as expected, you can either ignore it or reset the conversation'
        this.scrollDown(true)
        this.composeHistory()
        this.saveHistory()
      }
    }
  }
}
</script>
