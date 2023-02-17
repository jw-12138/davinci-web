const axios = require('axios')

let verify_login = function (token, userPool) {
  if(!token){
    return new Promise((resolve, reject) => {
      reject(new Error('No token provided'))
    })
  }
  if (token.split('_')[0] === 'key') {
    return new Promise((resolve, reject) => {
      resolve({
        Username: 'key_login'
      })
    })
  }

  return axios({
    url: "https://api.jw1.dev/cognito_verify",
    method: 'post',
    data: {
      AccessToken: token,
      userPool
    }
  })
}

module.exports = verify_login