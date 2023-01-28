<template>
  <div class="login-page">
    <div class="tips">
      Enter the password to confirm your identity.
    </div>
    <div class="password">
      <input type="password" v-model="password">
      <button @click="login">Submit</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import {getApiBase} from '../utils/common'

let baseAPI = getApiBase()

export default {
  name: 'login',
  data(){
    return {
      password: ''
    }
  },
  methods: {
    login(){
      let _ = this
      if(_.password === ''){
        alert('Password is required')
        return false
      }
      axios.post(baseAPI + '/login', {
        password: _.password
      }).then(res => {
        if(res.data.success){
          localStorage.setItem('token', res.data.token)
          _.$emit('logged')
        }else{
          alert('The password you entered is incorrect')
        }
      })
    },
  }
}
</script>