<template>
  <div class="login-page">
    <div class="tips">
      <div v-show="loginType === 'key'">
        <p>
          You can create or revoke your API key at <a target="_blank"
                                                      href="https://platform.openai.com/account/api-keys">platform.openai.com</a>,
          You should be well known about the
          following terms:
        </p>
        <ul style="margin-bottom: 20px">
          <li>
            Your API key is your property, please keep it safe.
          </li>
          <li>
            To authenticate with OpenAI, we will send your API key to our server for processing but it will never be
            stored there. Don't believe it? Check the <a
            href="https://github.com/jw-12138/davinci-web/blob/main/back-end/main.cjs" target="_blank">source code</a>.
          </li>
          <li>
            Make sure this device is trusted, we will store your API key in this browser. If you're using a public
            computer, remember to sign out after you're done using it.
          </li>
          <li>
            Make sure you are on a secure network to prevent potential theft of your API key.
          </li>
          <li>
            If you believe your API key has been compromised, revoke it ASAP.
          </li>
        </ul>
      </div>
    </div>
    <div class="password" v-show="loginType === 'key'" style="max-width: 400px; width: 100%; margin: 0 auto; display: flex">
      <input type="password" v-model="password" autofocus @keydown="listenForEnter" @focus="passwordFocus = true"
             @blur="passwordFocus = false" placeholder="API key" enterkeyhint="go">
      <button @click="login" :disabled="trying" :aria-busy="trying" class="ml-2 w-[10rem]">Submit</button>
    </div>
    <div style="font-size: 14px;">
      <p style="text-align: center">
        <button class="sso inline w-auto" @click="goToSSO" v-show="loginType === 'password'">
          Sign in
        </button>
        <span style="margin: 0 10px" v-show="loginType === 'password'">Or</span>
        <button v-show="loginType === 'password'" class="outline inline w-auto" @click="loginType = 'key'">Sign In with API Key</button>
      </p>
      <p v-show="loginType === 'key'" style="text-align: center">
        <button class="outline w-auto inline" @click="loginType = 'password'">Back to Sign in</button>
      </p>
    </div>

    <p class="text-xs text-center">
      🎉 DaVinci GPT 中文版本 <a href="https://zy.jw1.dev/" target="_blank">只言</a> 上线啦！快来体验吧！
    </p>

    <article class="intro px-12" v-show="loginType === 'password'">
      <p style="text-align: center; margin-top: 0; font-size: 1.2em"> 😎 Capabilities </p>
      <ul style="padding: 0; list-style: none">
        <li>Allow user to set custom instructions and message modifiers</li>
        <li>Remembers what user said earlier in the conversation</li>
        <li>Allows user to provide follow-up corrections</li>
      </ul>
      <p style="text-align: center; font-size: 1.2em"> 😟 Limitations: </p>
      <ul style="padding: 0; list-style: none">
        <li>May occasionally generate incorrect information</li>
        <li>
          May occasionally produce harmful instructions or biased content
        </li>
        <li>Limited knowledge of world and events after 2021</li>
      </ul>
    </article>

    <footer>
      <a href="https://github.com/jw-12138/davinci-web" target="_blank">Open Source</a> | <a
      href="https://github.com/jw-12138/davinci-web/issues" target="_blank">Feedback</a>
      <br>
      © 2023 | <a href="https://jw1.dev" target="_blank">jw1.dev</a> | Code with ❤️
    </footer>
  </div>
</template>

<script>
import axios from 'axios'
import {nanoid} from 'nanoid'

export default {
  name: 'login',
  mounted() {
    this.id = nanoid(32)
    if (location.hostname === 'localhost') {
      this.url = `https://sso.jw1.dev/#/sign-in?from=chat_local&id=${this.id}&client_id=${USER_POOL_CLIENT_ID}`
    } else {
      this.url = `https://sso.jw1.dev/#/sign-in?from=chat&id=${this.id}&client_id=${USER_POOL_CLIENT_ID}`
    }
  },
  data() {
    return {
      id: '',
      passwordFocus: false,
      password: '',
      trying: false,
      loginType: 'password',
      url: ''
    }
  },
  methods: {
    goToSSO() {
      location.href = this.url
    },
    listenForEnter(e) {
      if (e.key === 'Enter' && this.password !== '' && this.passwordFocus) {
        this.login()
      }
    },
    verifyKey(cb) {
      let key = this.password
      if (!key.startsWith('sk-')) {
        cb && cb(false)
        alert('The token you entered seems to be invalid 🤔')
        return false
      }

      this.trying = true

      axios({
        url: 'https://api.openai.com/v1/moderations',
        headers: {
          'Authorization': 'Bearer ' + key
        },
        method: 'POST',
        data: {
          input: `Hello World!`
        }
      }).then(res => {
        console.log(res)
        cb && cb(true)
      }).catch(err => {
        console.log(err)
        err.response.status === 401 && alert('The key you entered seems to be invalid 🤔')
        cb && cb(false)
      }).finally(() => {
        this.trying = false
        this.password = ''
      })
    },
    login() {
      let _ = this
      if (_.password === '') {
        alert('A token is required')
        return false
      }

      _.verifyKey(function (res) {
        if (res) {
          localStorage.setItem('fromID', 'key_' + _.password)
          _.$emit('logged')
        }
      })
    }
  }
}
</script>