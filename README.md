# 莫宁 Observation Skin

面向 DeepSeek Harness 的非官方第三方“莫宁”视觉皮肤。当前公开版本为 `0.3.1`，只兼容 `@deepseek-ai/dsh@0.1.0-rc.6`。

中文名固定为“莫宁”。`Mornye` / `MORNYE` 仅是既有包名、文件名和界面字标中的兼容标识，不音译为“莫尔尼”。

它提供浅色三栏观测工作台、可收起的 Appearance 控制器、运行状态投影、克制的轨道/声纹动态，以及只在本地页面中工作的对话摘要、搜索与定位。

## 下载与安装

- [下载 Mornye Observation Skin 0.3.1](https://github.com/is-limo/Mornye-Observation-Skin/releases/download/v0.3.1/Mornye-Observation-Skin-0.3.1.zip)
- [下载 ZIP 的 SHA-256 校验文件](https://github.com/is-limo/Mornye-Observation-Skin/releases/download/v0.3.1/Mornye-Observation-Skin-0.3.1.zip.sha256)
- 完整安装、升级和卸载说明见 [README.zh-CN.md](./README.zh-CN.md)。

安装前请完全停止 DSH。安装器会严格检查 DSH 版本，不会安装人格 preset、API Key 或会话数据。

## 隐私说明

- 仓库和发行包不包含人格提示词、API Key、Token、`.env`、`.credentials.yaml`、聊天记录或本机用户路径。
- 对话导航器只读取当前页面已经加载的用户发言与助手可见正文；摘要和搜索索引只存在于当前页面内存，不写入 `localStorage`，也不发送给模型或第三方。
- `localStorage` 只保存主题、透明度、动态模式、强调色和面板是否收起。
- 皮肤没有第三方遥测、远程脚本、CDN 或分析服务。
- 界面中的 `WEB / CONNECTED` 仅表示当前 DSH Web 服务可达：运行时每 5 秒向当前页面的同源 `/` 发起一次无正文 GET 请求。它不代表互联网、DeepSeek API 或 web search 一定可用。

更完整的数据边界见 [PRIVACY.md](./PRIVACY.md)。

## 完整性

0.3.1 ZIP 的 SHA-256：

```text
e04dc03256b656134c721738e7b8c0f2ebdb526e0c9d9004d8ebe093967f28e3
```

包内 `SHA256SUMS.txt` 可继续校验每个安装文件。

## 授权与归属

本项目是非官方第三方皮肤，不隶属于 DeepSeek，也不代表 DeepSeek 官方支持或背书。

当前包标记为 `UNLICENSED`。公开可见仅用于查看、审计和作者授权范围内的下载使用，不自动授予修改、再分发、商用或 npm 发布权利。
