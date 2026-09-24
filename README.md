# 涵涵通知移动端（ruoyi-mobile）

uni-app Vue3 工程，复用现有后端接口。用 **HBuilderX 云打包** 生成可直装 APK。

## 一、打包前必做

### 1. 改后端地址

编辑 `config/index.js` 里的 `BASE_URL`：

- 手机和电脑同一 WiFi 时：填电脑局域网 IP，例如 `http://192.168.1.8:8080`
- 不要用 `127.0.0.1`（装到手机后访问的是手机自己，不是电脑）
- 后端需已启动（默认端口 8080）

### 2. 安装依赖

在本目录执行：

```bash
npm install
```

需要：`crypto-js`、`jsencrypt`、`lunar-javascript`（登录加密与日历农历）。

### 3. 安装 HBuilderX

1. 打开 https://www.dcloud.io/hbuilderx.html 下载 **App 开发版**
2. 安装并注册 / 登录 DCloud 账号

---

## 二、用 HBuilderX 打开项目

1. 打开 HBuilderX → **文件 → 导入 → 从本地目录导入**
2. 选择本目录：`d:\Idea\Zhout\ruoyi-mobile`
3. 确认是 uni-app 项目（能看到 `pages.json`、`manifest.json`）

建议先 **运行 → 运行到浏览器 → Chrome** 验证登录是否通。

---

## 三、云打包出 APK（新手按此做）

1. 菜单：**发行 → 原生 App-云打包**
2. 勾选 **Android**
3. 包名可先用默认，或改成如 `com.hanhan.msg`
4. 证书选 **使用 DCloud 公用证书**（仅内部测试用；正式发布再换自己的证书）
5. 点击打包，等待几分钟
6. 打包成功后下载 `.apk` 到电脑

---

## 四、安装到手机

1. 把 apk 传到手机（微信 / QQ / U 盘均可）
2. 手机设置里允许「安装未知应用」
3. 点开 apk 安装
4. 打开 App → 登录（账号密码与 PC 端相同）

若提示网络错误：

- 检查 `BASE_URL` 是否为电脑局域网 IP
- 检查电脑防火墙是否放行 8080
- 确认手机与电脑同一 WiFi

---

## 五、首版功能

| 模块 | 内容 |
|------|------|
| 登录 / 我的 | 账号密码登录、退出 |
| 首页 | 月历 + 事件提醒 |
| 记录 | 任务、报告、感想、目标、自省 |
| 通知 | 用户、事件 |

PC 端 `ruoyi-ui` 与后端代码未改动。

---

## 六、manifest 说明

- `appid` 当前为占位 `__UNI__HANHANMSG`
- 正式云打包时，建议在 HBuilderX 里：**manifest.json → App 模块配置 → 重新获取 uni-app 应用标识**
