import {Auth} from 'aws-amplify'

Auth.configure({
  userPoolId: 'ap-northeast-2_mFkRRvlLv',
  userPoolWebClientId: '4h2ob6g9i5gm80kabjmcu49e0s'
})

export {
  Auth
}