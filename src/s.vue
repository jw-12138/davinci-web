<template>
  <div v-show="!pageLoading" style="display: none">
    <div class="page-title">
      <h1 class="text-center mb-4"><img src="https://emojicdn.elk.sh/%F0%9F%A4%96" alt="" style="height: 2.5rem"></h1>
      <p style="text-align: center; font-weight: bolder; margin-top: -10px; margin-bottom: 30px; font-size: 24px">
        DaVinci GPT</p>
    </div>

    <div v-show="notFound">
      <p>
        Oops, the conversation you are looking for does not exist.
      </p>
    </div>

    <div style="text-align: center" v-show="messagesLoading">
      <i class="iconfont spin">&#xe676;</i> Loading messages...
    </div>

    <div class="message-list">
      <div
        class="item"
        v-for="(item) in messages"
        style="position: relative; margin-top: 20px"
        :class="{
            dark: item.sender === 'Human',
            sys: item.sender === 'System'
          }">
        <div v-show="item.sender === 'Human'" style="font-size: 12px;position: absolute; top: -25px; color: #999;">Human</div>
        <div v-if="item.sender === 'Human'" class="human" style="padding-right: 10px">
          <pre style="padding: 0">{{ item.text }}</pre>
        </div>
        <div v-if="item.sender === 'AI'" style="font-size: 12px; position: absolute; top: -25px; color: #999">AI</div>
        <div v-if="item.sender === 'AI'" v-html="item.displayText"></div>
      </div>
    </div>

    <div style="margin-top: 20px; text-align: center; font-size: 14px">
      <a href="/">Back to Chat</a>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import hljs from 'highlight.js/lib/common'
import {getApiBase} from './utils/common.js'
import ClipboardJS from 'clipboard'
let baseAPI = getApiBase()

export default {
  mounted() {
    this.pageLoading = false
    this.getMessages()
  },
  methods: {
    initClipboard() {
      let cp = new ClipboardJS('.copy-code-btn', {
        target: function (trigger) {
          return trigger.parentNode.parentNode.parentNode.querySelector('pre code')
        }
      })

      cp.on('success', function (e) {
        let btn = e.trigger
        e.clearSelection()
        if(btn.innerHTML === 'Copied!'){
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
    highlight() {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el)
      })
    },
    getMessages() {
      let _ = this
      axios.post(baseAPI + '/share/get', {
        id: location.search.split('=')[1]
      }).then((res) => {
        _.messagesLoading = false
        if(res.data.success){
          _.messages = JSON.parse(res.data.messages).reverse()
          _.$nextTick(function () {
            _.highlight()
            _.initClipboard()
          })
        }else{
          _.notFound = true
        }
      }).catch(err => {
        console.log(err)
        _.messagesLoading = false
      })
    }
  },
  data(){
    return {
      messagesLoading: true,
      pageLoading: true,
      messages: [],
      notFound: false,
    }
  }
}
</script>
