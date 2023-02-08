<template>
  <div class="login-page">
    <div class="tips">
      <p v-show="loginType === 'password'">Enter the password to confirm your identity.</p>
      <div v-show="loginType === 'key'">
        <p>
          You can create your API key at <a target="_blank" href="https://platform.openai.com/account/api-keys"><i class="iconfont">&#xe67d;</i> platform.openai.com/account/api-keys</a>, You should be well known about the following terms:
        </p>
        <ul style="margin-bottom: 20px">
          <li>
            Your API key is your property, please keep it safe.
          </li>
          <li>
            To authenticate with OpenAI, we will send your API key to our server for processing but it will never be stored there. Don't believe it? Check the <a href="https://github.com/jw-12138/davinci-web/blob/main/back-end/main.cjs#L158" target="_blank"><i class="iconfont">&#xe67d;</i> source code</a>.
          </li>
          <li>
            Make sure this device is trusted, we will store your API key in this browser. If you're using a public computer, remember to log out after you're done using it.
          </li>
          <li>
            Make sure you are on a secure network to prevent potential theft of your API key.
          </li>
        </ul>
      </div>

    </div>
    <div class="password">
      <input type="password" v-model="password" autofocus @keydown="listenForEnter" @focus="passwordFocus = true"
             @blur="passwordFocus = false">
      <button @click="login">Submit</button>
    </div>
    <div style="font-size: 14px;">
      <br>
      <p v-show="loginType === 'password'">
        Or if you have OpenAI API key, you can switch to <button class="plain" @click="loginType = 'key'">API Key Login</button>
      </p>
      <p v-show="loginType === 'key'">
        <button class="plain" @click="loginType = 'password'">Password Login</button>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import {getApiBase} from '../utils/common'

let baseAPI = getApiBase()

export default {
  name: 'login',
  data() {
    return {
      passwordFocus: false,
      password: '',
      loginType: 'password'
    }
  },
  methods: {
    listenForEnter(e) {
      if (e.key === 'Enter' && this.password !== '' && this.passwordFocus) {
        this.login()
      }
    },
    login() {
      let _ = this
      if (_.password === '') {
        alert('Password is required')
        return false
      }

      if(_.loginType === 'key'){
        localStorage.setItem('token', 'key_' + _.password)
        _.$emit('logged')
        return false
      }
      axios.post(baseAPI + '/login', {
        password: _.password
      }).then(res => {
        if (res.data.success) {
          localStorage.setItem('token', res.data.token)
          _.$emit('logged')
        } else {
          alert('The password you entered is incorrect')
        }
      })
    }
  }
}
</script>