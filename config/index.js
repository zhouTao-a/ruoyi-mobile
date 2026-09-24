/**
 * 移动端全局配置
 * 打 APK 后手机访问后端，请改成电脑/服务器的局域网或公网地址
 * 例：http://192.168.1.8:8080
 */
export const APP_TITLE = '涵涵通知'

/** 后端接口根地址（App 必填完整 URL；H5 调试也可填本机地址） */
export const BASE_URL = 'http://192.168.20.27:8080'

/** 与 PC 端 ruoyi-ui 保持一致的客户端 ID */
export const CLIENT_ID = 'e5cd7e4891bf95d1d19206ce24a7b32e'

/** 是否启用登录请求体加密（需与后端 VITE_APP_ENCRYPT / 配置一致） */
export const ENCRYPT_ENABLED = true

/** RSA 公钥（登录请求加密 AES 密钥时使用） */
export const RSA_PUBLIC_KEY =
  'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKoR8mX0rGKLqzcWmOzbfj64K8ZIgOdHnzkXSOVOZbFu/TJhZ7rFAN+eaGkl3C4buccQd/EjEsj9ir7ijT7h96MCAwEAAQ=='

/** RSA 私钥（响应解密时使用，与 PC 端一致） */
export const RSA_PRIVATE_KEY =
  'MIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEAmc3CuPiGL/LcIIm7zryCEIbl1SPzBkr75E2VMtxegyZ1lYRD+7TZGAPkvIsBcaMs6Nsy0L78n2qh+lIZMpLH8wIDAQABAkEAk82Mhz0tlv6IVCyIcw/s3f0E+WLmtPFyR9/WtV3Y5aaejUkU60JpX4m5xNR2VaqOLTZAYjW8Wy0aXr3zYIhhQQIhAMfqR9oFdYw1J9SsNc+CrhugAvKTi0+BF6VoL6psWhvbAiEAxPPNTmrkmrXwdm/pQQu3UOQmc2vCZ5tiKpW10CgJi8kCIFGkL6utxw93Ncj4exE/gPLvKcT+1Emnoox+O9kRXss5AiAMtYLJDaLEzPrAWcZeeSgSIzbL+ecokmFKSDDcRske6QIgSMkHedwND1olF8vlKsJUGK3BcdtM8w4Xq7BpSBwsloE='

export const TOKEN_KEY = 'App-Token'
export const USER_KEY = 'App-User'
