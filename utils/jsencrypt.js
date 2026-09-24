import JSEncrypt from 'jsencrypt'
import { RSA_PRIVATE_KEY, RSA_PUBLIC_KEY } from '@/config/index.js'

/** RSA 公钥加密（用于包装 AES 密钥） */
export function encrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(RSA_PUBLIC_KEY)
  return encryptor.encrypt(txt)
}

/** RSA 私钥解密 */
export function decrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(RSA_PRIVATE_KEY)
  return encryptor.decrypt(txt)
}
