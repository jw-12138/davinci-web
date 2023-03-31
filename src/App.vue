<template>
  <div
    style="opacity: 0"
    :style="{
      opacity: pageLoaded ? 1 : 0
    }"
  >
    <div class="page-title">
      <h1 class="text-center mb-4"><img src="https://emojicdn.elk.sh/%F0%9F%A4%96" alt="" style="height: 2.5rem"></h1>
      <p style="text-align: center; font-weight: bolder; margin-top: -10px; margin-bottom: 30px; font-size: 24px">
        DaVinci GPT</p>
    </div>

    <login v-show="!isLogin && !checkingLogin" @logged="loggedIn"></login>
    <div>
      <chat-mode @data-change="handleChatModeChange"
                 v-show="messages.length === 0 && apiMethodIndex !== 0 && isLogin && !checkingLogin"></chat-mode>
      <div v-show="messages.length < 1 && isLogin && !checkingLogin" style="margin-bottom: 20px; font-size: 14px">
        <p style="text-align: center">
          🙌 Try these commands
        </p>
        <div style="display: flex; justify-content: center">
          <table style="width: auto">
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
                <code>/signout</code>
              </td>
              <td>
                Sign out
              </td>
            </tr>
          </table>
        </div>
        <p class="text-xs text-center">
          🎉 DaVinci GPT 中文版本 <a href="https://zy.jw1.dev/" target="_blank">只言</a> 上线啦！快来体验吧！
        </p>
      </div>
      <div class="message-list" v-show="messages.length && isLogin && !checkingLogin">
        <div
          class="item"
          style="margin-top: 20px"
          v-for="(item, index) in display_messages"
          :class="{
            dark: item.sender === 'Human',
            sys: item.sender === 'System'
          }"
        >
          <div v-show="item.sender === 'Human'"
               style="font-size: 12px;position: absolute; top: -25px; right: 10px; color: #999;">
            Human
          </div>
          <div v-if="item.sender === 'Human'" class="human">
            <div :style="{
              opacity: editIndex === item.index ? '0' : '1',
              pointerEvents: editIndex === item.index ? 'none' : 'auto',
              height: editIndex === item.index ? '30px': 'auto'
            }">
              <pre style="padding: 0">{{ item.text }}</pre>
            </div>
            <div class="edit-tools" v-if="editIndex === item.index">
              <textarea
                v-model="editMessage"
                :id="'editingArea_' + item.index"
                :style="{
                  minHeight: '60px',
                  maxHeight: '120px'
                }"

                @input="calcEditingAreaHeight('editingArea_' + item.index)"
                @focus="inputOnFocus = true"
                @blur="inputOnFocus = false">
              </textarea>
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
          <div v-show="item.sender === 'AI'"
               style="font-size: 12px; position: absolute; top: -25px; left: 10px; color: #999">AI
          </div>
          <div v-if="item.sender === 'AI' && item.displayText" v-html="item.displayText"></div>
          <pre style="background: transparent; padding: 0; white-space: pre-wrap; font-size: 14px"
               v-show="item.sender === 'AI' && !item.displayText">{{ item.text }}</pre>
          <div class="ai-cost" v-if="item.sender === 'AI'">
            <span v-if="item.cost"
            >{{ item.tokens }} tokens, ${{ item.cost }}</span
            >
            <span v-else>{{ item.tokens }} tokens</span>
          </div>
        </div>
      </div>
      <div v-show="checkingLogin" style="padding: 20px 0 30px; text-align: center; font-size: 12px">
        <div style="text-align: center" aria-busy="true">Checking your sign in info...</div>
      </div>
      <div class="in-page-token-count" v-show="messages.length > 0 && !systemInfo && isLogin">
        In-page Tokens: {{ inPageTokens }}
      </div>
      <div style="padding: 20px 0 30px; text-align: center; font-size: 12px" v-show="systemInfo" v-html="systemInfo">

      </div>
      <div style="text-align: center" v-show="isLogin && !checkingLogin" aria-label="Settings">
        <div style="display: inline-block; position: relative">
          <Transition name="slide-up">
            <div class="page-options-box" v-show="showPageOptions" :class="{
            in: showPageOptions
          }" @click.stop>
              <div class="page-options">
                <div class="item">
                  <button @click="clearHistory" title="Reset current conversation" :disabled="messages.length === 0">
                    <i class="iconfont" style="top: 2px">&#xe66a;</i>
                    <span>Reset</span>
                  </button>
                </div>
                <div class="item" title="Regenerate the last message">
                  <button @click="reGen(null)" :disabled="streaming || messages.length < 1">
                    <i class="iconfont" style="top: 2px">&#xe67b;</i>
                    <span>Regenerate</span>
                  </button>
                </div>
                <div class="item">
                  <button :disabled="sharing || streaming || messages.length < 2" @click="share"
                          title="Publish this conversation">
                    <i class="iconfont" style="top: 2px; left: 2px">&#xe67d;</i> <span>Publish</span>
                  </button>
                </div>
                <hr>
                <div class="item">
                  <button @click="logout" title="Sign out" :disabled="loggingOut">
                    <i class="iconfont" style="top: 2px; left: 2px">&#xe680;</i> <span>Sign Out</span>
                  </button>
                </div>
              </div>
              <div style="text-align: center; margin-top: 10px" class="px-2">
                <div class="select-box" :class="{
                  focus: modelSelectFocus
                }">
                  <label for="model_select" class="for-select"></label>
                  <select id="model_select" v-model="apiMethodIndex" @focus="modelSelectFocus = true"
                          @blur="modelSelectFocus = false">
                    <optgroup v-for="(item, index) in apiMethod" :label="item.model" :disabled="item.disabled">
                      <option :value="index">{{ item.name }}</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </Transition>
          <button class="mb-0" role="menuitem" @click.stop="showPageOptions = !showPageOptions" aria-haspopup="true"
                  style="position: relative; z-index: 300">
            <i class="iconfont icon-setting" style="top: 0; margin-right: 5px" v-show="!showPageOptions"></i>
            <i class="iconfont icon-close-bold" style="top: 0; margin-right: 5px" v-show="showPageOptions"></i>Settings
          </button>
        </div>
      </div>

      <div v-show="shareLink && isLogin && !checkingLogin"
           style="padding: 10px 0; font-size: 12px; text-align: center;">
        <a :href="shareLink">{{ shareLink }}</a>
      </div>
      <div v-show="isLogin" class="page-input">
        <div class="wrap">
          <textarea class="input"
                    v-model="userInput"
                    @focus="inputOnFocus = true; showPageOptions = false; editIndex = undefined"
                    @blur="inputOnFocus = false"
                    ref="input"
                    placeholder="Type your message or command here, press CTRL/CMD + Enter to send."
                    @compositionstart="userIsComposting = true"
                    @compositionend="userIsComposting = false">
          </textarea>
          <button
            @click="composeMessage"
            :disabled="streaming"
            :style="{
              opacity: streaming ? 0.3 : 1
            }"
          >
            <i class="iconfont" style="position: relative; top: 1px;">&#xe67a;</i>
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
import Markdownit from 'markdown-it'
import ClipboardJS from 'clipboard'
import {calcToken, calcTokenCost} from './utils/price-calc.js'
import ChatMode from './components/chat-mode.vue'

let md = new Markdownit({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs" data-lang="${lang}"><code>${hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true
        }).value}</code></pre>`
      } catch (__) {
      }
    }

    return ''
  }
})

let fence = md.renderer.rules.fence

md.renderer.rules.fence = function (...args) {
  const [tokens, idx] = args
  const token = tokens[idx]
  const rawCode = fence(...args)
  return `<div class="code-wrapper"><div class="language-tools">
<div class="language-name">${token.info.trim()}</div>
<div class="copy-code" role="button"><button class="copy-code-btn">Copy Code</button></div>
</div>${rawCode}</div>`
}

let baseAPI = getApiBase()

export default {
  components: {ChatMode, Login},
  mounted() {
    let _ = this
    let search = new URLSearchParams(location.search)
    if (search.get('id')) {
      this.getLoginInfo(search.get('id'))
    } else {
      this.checkForLogin()
    }
    this.listenForKeys()
    this.readHistory()
    this.updateDisplayMessages()
    this.getShareLink()
    _.pageLoaded = true

    window.addEventListener('click', function () {
      _.showPageOptions = false
    })

    this.handleUserInteract()

    window.addEventListener('paste', this.handleUserPaste)

    setInterval(function () {
      _.systemCheck()
    }, 5)
  },
  data() {
    return {
      inPageTokens: 0,
      userScrolled: false,
      userInteracted: false,
      editInstructionWindow: '',
      modelSelectFocus: false,
      apiMethodIndex: 1,
      apiMethod: [
        {
          name: 'DaVinci',
          model: 'text-davinci-003',
          url: '/ask'
        },
        {
          name: 'ChatGPT',
          model: 'gpt-3.5-turbo',
          url: '/chat/chat-gpt'
        }
        // {
        //   name: 'GPT-4 8k',
        //   model: 'gpt-4',
        //   url: '/chat/gpt-4',
        //   disabled: true
        // },
        // {
        //   name: 'GPT-4 32k',
        //   model: 'gpt-4-32k',
        //   url: '/chat/gpt-4',
        //   disabled: true
        // }
      ],
      checkingLogin: false,
      systemStartTime: Date.now(),
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
      loggingOut: false,
      chatMode: {}
    }
  },
  methods: {
    calcInPageTokens() {
      let _ = this
      _.inPageTokens = 0
      let instructionTokenCount = _.chatMode.instructionTokens || 0
      _.inPageTokens += instructionTokenCount
      _.messages.forEach((message) => {
        if (message.sender === 'Human') {
          let messageWithPrefixAndSuffix = (_.chatMode.prefix || '') + message.text + (_.chatMode.suffix || '')
          let tokenCountForMessage = calcToken(messageWithPrefixAndSuffix)
          _.inPageTokens += tokenCountForMessage
        } else {
          _.inPageTokens += calcToken(message.text)
        }
      })
    },
    calcEditingAreaHeight(id) {
      let el = document.getElementById(id)
      el.rows = el.value.split('\n').length
    },
    handleUserInteract() {
      let touchDown = false
      let _ = this

      window.addEventListener('wheel', () => {
        _.userInteracted = true
      })

      window.addEventListener('mousemove', (event) => {
        if (event.buttons === 1) {
          _.userInteracted = true
        }
      })

      window.addEventListener('touchstart', () => {
        touchDown = true
      })

      window.addEventListener('touchmove', () => {
        if (touchDown) {
          _.userInteracted = true
        }
      })

      window.addEventListener('touchend', () => {
        touchDown = false
      })

      let checkScroll = function () {
        let target = document.querySelector('html')
        let scrollTop = target.scrollTop
        let scrollHeight = target.scrollHeight
        let height = target.clientHeight

        if (scrollTop + height > scrollHeight - 3) {
          _.userInteracted = false
        }

        requestAnimationFrame(checkScroll)
      }

      requestAnimationFrame(checkScroll)
    },
    handleUserPaste(e) {

    },
    handleChatModeChange(chatMode) {
      let defaultChatMode = {
        instructionTokens: 0,
        title: '',
        instructions: '',
        prefix: '',
        suffix: '"',
        noHistory: false
      }
      this.chatMode = {...defaultChatMode, ...chatMode}
      this.calcInPageTokens()
    },
    initClipboard() {
      let cp = new ClipboardJS('.copy-code-btn', {
        target: function (trigger) {
          return trigger.parentNode.parentNode.parentNode.querySelector('pre code')
        }
      })

      cp.on('success', function (e) {
        let btn = e.trigger
        e.clearSelection()
        if (btn.innerHTML === 'Copied!') {
          return false
        }
        btn.innerHTML = 'Copied!'

        setTimeout(function () {
          btn.innerHTML = 'Copy Code'
        }, 1500)
      })

      cp.on('error', function (e) {
        console.error('Action:', e.action)
        console.error('Trigger:', e.trigger)
      })
    },
    systemCheck() {
      let _ = this
      let nowTime = Date.now()
      let offset = Math.floor((nowTime - _.systemStartTime) / 1000)

      if (offset > 3600) {
        _.checkForLogin(true)
        _.systemStartTime = Date.now()
      }
    },
    getLoginInfo(id) {
      this.checkingLogin = true
      axios({
        url: 'https://api.jw1.dev/cognito/get_login_info',
        method: 'post',
        data: {
          id
        }
      }).then(res => {
        if (res.data.status === 0) {
          let loginInfo = JSON.parse(res.data.data.login_info)
          let token = loginInfo.refreshToken
          let username = loginInfo.username
          console.log(loginInfo)
          localStorage.setItem('username_from_sso', username)
          localStorage.setItem('CognitoIdentityServiceProvider.' + USER_POOL_CLIENT_ID + '.' + username + '.refreshToken', token)
          location.href = location.href.split('?')[0]
        }
      }).catch(err => {
        throw err
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
      let c = confirm('Are you sure you want to sign out?')

      if (!c) {
        return
      }

      this.showPageOptions = false

      this.systemInfo = '<div style="text-align: center" aria-busy="true">Signing you out ...</div>'
      this.scrollDown()

      axios({
        url: 'https://api.jw1.dev/cognito/revoke',
        method: 'post',
        data: {
          token: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.refreshToken`) || localStorage.getItem('fromID'),
          userPool: USER_POOL_ID,
          clientId: USER_POOL_CLIENT_ID
        }
      }).then(res => {
        this.isLogin = false
        localStorage.clear()
        this.systemInfo = ''
      }).catch(err => {
        console.log(err)
        this.systemInfo = '<div style="text-align: center">Error occurred while signing out, please refresh this page and try again.</div>'
      })
    },
    getShareLink() {
      if (localStorage.getItem('shareLink')) {
        this.shareLink = localStorage.getItem('shareLink')
      }
    },
    share() {
      let _ = this
      if (this.messages.length < 1) {
        alert('Please ask something first.')
        return false
      }
      if (this.sharing) {
        return
      }
      let c = confirm('Please make sure that this conversation does not contain any sensitive information. Are you sure you want to publish this conversation?')
      if (!c) return

      this.showPageOptions = false

      this.shareLink = ''
      localStorage.removeItem('shareLink')

      axios.post(baseAPI + '/share', {
        history: JSON.stringify(this.messages),
        token: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.accessToken`) || localStorage.getItem('fromID'),
        userPool: USER_POOL_ID,
        clientId: USER_POOL_CLIENT_ID
      }).then(res => {
        this.sharing = false
        this.shareLink = window.location.origin + '/s.html?id=' + res.data.id
        localStorage.setItem('shareLink', this.shareLink)
        this.scrollDown()
      }).catch(e => {
        console.log(e)
        _.systemInfo = '<div style="text-align: center">Error occurred while sharing, please refresh this page and try again.</div>'
        _.scrollDown()
        return false
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
      _.showPageOptions = false
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
      _.calcInPageTokens()
      if (this.messages.length) {
        this.scrollDown()
        this.initClipboard()
        this.composeHistory()
      }
    },
    scrollDown(force) {
      let _ = this
      if (_.scrollDebounce && !force) {
        return false
      }

      if (_.userInteracted) {
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
    checkForLogin(renewToken) {
      let _ = this

      _.checkingLogin = true

      if (localStorage.getItem('fromID') && localStorage.getItem('fromID').startsWith('key_sk') && !renewToken) {
        _.isLogin = true
        _.checkingLogin = false
        return false
      }

      if (!localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.refreshToken`) && !renewToken) {
        _.checkingLogin = false
        return false
      }

      axios({
        method: 'post',
        url: 'https://api.jw1.dev/cognito/renew',
        data: {
          refreshToken: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.refreshToken`),
          userPool: USER_POOL_ID,
          clientId: USER_POOL_CLIENT_ID
        }
      }).then(res => {
        if (!res.data.AuthenticationResult) {
          throw new Error('oops')
        }
        localStorage.setItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.accessToken`, res.data.AuthenticationResult.AccessToken)
        localStorage.setItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.idToken`, res.data.AuthenticationResult.IdToken)
        _.isLogin = true
        _.checkingLogin = false
      }).catch(err => {
        console.log(err)
        if (!renewToken) {
          _.isLogin = false
        }
        _.checkingLogin = false
      })
    },
    listenForKeys() {
      let _ = this
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          _.showPageOptions = false
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          if (_.editIndex !== undefined) {
            _.reGen(_.editIndex)
          } else {
            _.composeMessage()
          }
        }

        if (e.key === 'Escape') {
          _.showPageOptions = false
          _.editIndex = undefined
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

      if (_.messages.length === 1) {
        position = 0
      }

      let length = _.messages.length

      _.userInput = _.editMessage || _.messages[position].text
      _.showPageOptions = false
      _.messages.splice(position, length - position)

      _.editIndex = undefined
      _.editMessage = undefined

      _.composeMessage(true)
    },
    renderText(index, originalText) {
      let _ = this
      _.messages[index].displayText = md.render(originalText)
      _.messages[index].displayText = xss(_.messages[index].displayText, {
        whiteList: {
          p: [],
          i: ['class'],
          button: ['class'],
          div: ['class', 'data-lang'],
          span: ['class', 'data-lang'],
          pre: ['class', 'data-lang'],
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
    },
    composeMessage() {
      let _ = this
      _.userInteracted = false
      if (trim(this.userInput) === '') {
        return false
      }

      _.systemInfo = ''

      if (trim(this.userInput) === '/reset') {
        setTimeout(() => {
          _.userInput = ''
          _.$refs.input.innerText = ''
        }, 30)
        _.clearHistory()
        _.calcInPageTokens()
        return false
      }

      if (trim(this.userInput) === '/signout') {
        _.logout()
        setTimeout(() => {
          _.userInput = ''
          _.$refs.input.innerText = ''
        }, 30)
        return false
      }

      if (trim(this.userInput) === '/regen') {
        _.reGen(null)
        setTimeout(() => {
          _.userInput = ''
          _.$refs.input.innerText = ''
        }, 30)
        _.showPageOptions = false
        return false
      }

      if (trim(this.userInput) === '/pub') {
        _.share()
        setTimeout(() => {
          _.userInput = ''
          _.$refs.input.innerText = ''
        }, 30)
        return false
      }

      if (this.streaming) {
        return false
      }

      if (_.apiMethodIndex === 1 && _.chatMode.noHistory) {
        this.messages = []
      }

      this.messages.push({
        sender: 'Human',
        text: trim(this.userInput)
      })

      let dataIndex = _.messages.length

      _.saveHistory()

      _.systemInfo = '<div style="text-align: center" aria-busy="true">Processing...</div>'

      _.shareLink = ''
      localStorage.removeItem('shareLink')

      _.streaming = true

      _.$nextTick(function () {
        _.scrollDown(true)
      })

      let userInput = _.userInput
      setTimeout(() => {
        _.userInput = ''
        _.$refs.input.innerText = ''
      }, 30)

      this.updateDisplayMessages()
      this.calcInPageTokens()

      let tempHistory = JSON.parse(JSON.stringify(_.messages))
      tempHistory.splice(-1, 1)

      let axiosBody = {
        token: localStorage.getItem(`CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${localStorage.getItem('username_from_sso')}.accessToken`) || localStorage.getItem('fromID'),
        userPool: USER_POOL_ID,
        clientID: USER_POOL_CLIENT_ID,
        message: (_.chatMode.prefix || '') + userInput + (_.chatMode.suffix || ''),
        history: _.chatMode.noHistory ? [] : tempHistory,
        instructions: _.chatMode.instructions
      }

      if (_.apiMethodIndex === 0) {
        axiosBody.history = tempHistory
        axiosBody.instructions = ''
        axiosBody.message = userInput
        _.chatMode.instructionTokens = 208
      }

      fetch(baseAPI + _.apiMethod[_.apiMethodIndex].url, {
        method: 'POST',
        body: JSON.stringify(axiosBody),
        headers: {
          'Content-Type': 'application/json'
        },
        stream: true
      })
        .then((response) => {
          _.systemInfo = ''
          if (!response.ok) {
            switch (response.status) {
              case 429:
                _.systemInfo = 'Too many requests, please try again later'
                break
              case 401:
                _.systemInfo = 'Seems like you\'re not authorized, please refresh this page and try again.'
                break
              case 403:
                _.systemInfo = 'Your account is perfectly fine, but you\'re not allowed to use this service at the moment. 🥹 Sorry about that.'
                break
              default:
                _.systemInfo = response.status + ': We encountered an error, please refresh this page and try again.'
                break
            }

            _.streaming = false
          } else {
            _.messages[dataIndex] = {
              sender: 'AI',
              text: ''
            }
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
                _.messages[dataIndex].cost = calcTokenCost(_.messages, _.apiMethodIndex, _.chatMode.instructionTokens)
                _.renderText(dataIndex, _.messages[dataIndex].text)
                _.composeHistory()
                _.scrollDown(true)
                _.saveHistory()
                _.updateDisplayMessages()
                _.calcInPageTokens()
                _.streamTimeout = false
                _.$refs.input.focus()
                if (_.streamTimeoutCount) {
                  clearTimeout(_.streamTimeoutCount)
                }
                return
              }
              let s = new TextDecoder().decode(value)
              _.scrollDown()
              _.messages[dataIndex].text += s
              _.messages[dataIndex].bytes = new TextEncoder().encode(
                _.messages[dataIndex].text
              ).length

              _.messages[dataIndex].tokens = calcToken(_.messages[dataIndex].text)

              _.messages[dataIndex].text = trim(_.messages[dataIndex].text)
              _.renderText(dataIndex, _.messages[dataIndex].text)
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
          if (err.response) {
            _.systemInfo = err.response.status + ': Something went wrong, please try again later'
          } else {
            _.systemInfo = err.message
          }
        })
    }
  },
  watch: {
    userInput: function (val) {
      this.$refs.input.innerText = val
    },
    streaming: function (val) {
      if (!val) {
        this.initClipboard()
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
