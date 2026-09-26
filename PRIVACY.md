# Privacy Boundary

本文同时说明 0.4.2 Desktop 与 0.3.1 Legacy Web 的数据边界；差异单独标注。

## 会读取什么

运行时会读取当前 DSH 页面中已经加载的以下可见信息：

- 用户发言与 steering 发言；
- 助手可见正文；
- 当前轮数、步骤数、工具耗时、缓存命中率和运行状态；
- 用于把摘要定位回原消息的页面内消息键。

工具、命令、错误行和 Think / Reasoning 不进入对话索引。代码块、按钮、脚本、样式和 `aria-hidden="true"` 内容会在生成摘要前排除。

0.4.2 Desktop 还会排除 `hidden`、CSS `display:none`／`visibility:hidden`／透明度为 0 的内容及未展开的 details 正文；完整 URL 不进入摘要或搜索。原生消息时间仅用于导航标记，工具耗时仅在原生统计弹窗可见时读取，不主动打开弹窗或查询后台。

## 会保存什么

浏览器 `localStorage` 只保存：

- 主题 preset；
- 面板透明度；
- 动态 preset；
- 强调色；
- Appearance 面板是否收起（仅旧版 Web）。桌面版每次打开页面默认收起。

消息正文、摘要、搜索词和搜索索引不会写入持久化存储。它们只存在于当前页面的内存与可见 DOM 中，刷新或关闭页面后消失。

## 网络行为

皮肤不访问第三方域名，也没有遥测、分析 SDK、远程字体或远程脚本。

**0.4.2 Desktop：**皮肤不发起网络请求。客户端 JS 通过 DSH 自身的本地插件加载机制提供；`DESKTOP / LOCAL` 仅说明它在本地界面中运行。

**0.3.1 Legacy Web：**为显示 DSH Web 服务可达状态，每 5 秒对 `new URL('/', window.location.href)` 发起一次同源 GET 请求，使用 `credentials: 'same-origin'`，不附带聊天正文、搜索词或工具参数。这个状态不能证明外网、模型 API 或 web search 可用。

## 安装器边界

桌面安装器把无依赖的视觉插件复制到 DSH Home 内，向 `desktop` profile 的 package.json 添加本地依赖和 bundle，并保存可恢复的原始 package.json。卸载时恢复原文件或仅移除本插件条目。它不读取凭据和会话，不修改官方 app.asar、用户 patch、模型配置或人格 preset。

旧版 Web 安装器复制视觉文件，并调用 DSH 官方 CLI 把本地插件加入 Web profile。

两种卸载器均只移除本皮肤，不删除 API Key、会话或其他插件。发行包不包含在个人电脑上产生的安装状态文件、用户路径或聊天截图。
