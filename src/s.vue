<template>
  <div v-show="!pageLoading" style="display: none">
    <div class="page-title">
      <h1>🤖 DaVinci GPT-3</h1>
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
        <div v-if="item.sender === 'Human'" class="human" style="padding-right: 0">
          {{ item.text }}
        </div>
        <div v-if="item.sender === 'AI'" style="font-size: 12px; position: absolute; top: -25px; color: #999">AI</div>
        <div v-if="item.sender === 'AI'" v-html="item.displayText" style="font-family: 'JetBrains Mono', monospace"></div>
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
let baseAPI = getApiBase()

export default {
  mounted() {
    this.pageLoading = false
    this.getMessages()
  },
  methods: {
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
