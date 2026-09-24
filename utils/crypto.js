import CryptoJS from 'crypto-js'

/** 随机生成 32 位字符串并解析为 AES 密钥 */
export function generateAesKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return CryptoJS.enc.Utf8.parse(result)
}

export function encryptBase64(str) {
  return CryptoJS.enc.Base64.stringify(str)
}

export function decryptBase64(str) {
  return CryptoJS.enc.Base64.parse(str)
}

export function encryptWithAes(message, aesKey) {
  return CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  }).toString()
}

export function decryptWithAes(message, aesKey) {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}
