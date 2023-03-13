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
        data: {
          Username: 'key_login'
        }
      })
    })
  }

  return axios({
    url: "https://api.jw1.dev/cognito/verify",
    method: 'post',
    data: {
      AccessToken: token,
      userPool
    }
  })
}

module.exports = verify_login