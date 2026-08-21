# Privacy Boundary

## 会读取什么

运行时会读取当前 DSH 页面中已经加载的以下可见信息：

- 用户发言与 steering 发言；
- 助手可见正文；
- 当前轮数、步骤数、工具耗时、缓存命中率和运行状态；
- 用于把摘要定位回原消息的页面内消息键。

工具、命令、错误行和 Think / Reasoning 不进入对话索引。代码块、按钮、脚本、样式和 `aria-hidden="true"` 内容会在生成摘要前排除。

## 会保存什么

浏览器 `localStorage` 只保存：

- 主题 preset；
- 面板透明度；
- 动态 preset；
- 强调色；
- Appearance 面板是否收起。

消息正文、摘要、搜索词和搜索索引不会写入持久化存储。它们只存在于当前页面的内存与可见 DOM 中，刷新或关闭页面后消失。

## 网络行为

皮肤不访问第三方域名，也没有遥测、分析 SDK、远程字体或远程脚本。

为显示 DSH Web 服务可达状态，运行时每 5 秒对 `new URL('/', window.location.href)` 发起一次同源 GET 请求，使用 `credentials: 'same-origin'`，不附带聊天正文、搜索词或工具参数。这个状态不能证明外网、模型 API 或 web search 可用。

## 安装器边界

安装器只复制发行包内的视觉文件，并调用 DSH 官方 CLI 把本地插件加入 Web profile。卸载器只移除同名视觉扩展；它不会删除人格 preset、API Key、会话或其他 DSH 设置。
