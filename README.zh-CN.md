# Mornye Observation Skin 0.3.1

这是面向 DeepSeek Harness `0.1.0-rc.6` 的纯视觉安装包。

它包含浅色三栏观测工作台、默认收起的 Appearance 外观控制器、真实运行状态投影、克制的轨道扫光与中央遥测声纹，以及可搜索和定位的本地对话导航器。

右侧观测舞台的大圆弧只在 `RUNNING` 或 `TOOL` 时显示短光沿固定轨道扫过，中央准星两侧同步显示低透明度的对称遥测声纹；两种状态分别使用蓝色和金色。空闲、完成与错误状态均不循环闪烁。选择 `STILL`、启用系统减少动态或离线时保持静止。动画只使用当前页面已有状态，不增加联网行为。

## 隐私与范围

- 不包含人格提示词或 Agent preset；
- 不包含 API Key、Token、`.env`、`.credentials.yaml`；
- 不包含会话记录、工具参数或用户目录配置；
- 对话导航器只读取当前页面已经加载的用户发言与莫宁可见正文；工具、命令、错误行和 Think / Reasoning 不进入索引；
- 最近区只显示三条单独发言，并在浏览器内生成不超过一行的简要描述；
- 展开 `SEARCH LOADED CHAT` 后可搜索当前已加载消息；尚未载入的更早历史仍由 DSH 自己的“加载更早”功能负责；
- 摘要、搜索和定位均只在当前页面内存中执行，不调用模型、不联网，也不把消息索引写入 `localStorage`；
- 点击摘要或搜索结果只会滚动并短暂高亮原消息。

## 兼容环境

- Windows PowerShell 5.1 或 PowerShell 7；
- Node.js 22 或更高版本；
- `@deepseek-ai/dsh@0.1.0-rc.6`；
- 已初始化的 DSH Web profile。

安装脚本会严格检查 DSH 版本。其他版本的布局类名可能不同，因此脚本会拒绝安装，而不是强行修改。

## 安装

1. 完全停止 DeepSeek Harness。
2. 解压 ZIP，并在解压目录打开 PowerShell。
3. 如果 `dsh` 已在 PATH 中，运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

如果使用项目目录内的本地 DSH，指定它的项目目录：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 `
  -DshProject 'C:\path\to\DeepSeekHarness'
```

如果使用了自定义 `DSH_HOME`，可以继续添加：

```powershell
-DshHome 'C:\path\to\.dsh'
```

安装完成后重新启动 DSH，并使用浅色主题。完整三栏布局需要至少 1480px 的视口宽度；Appearance 控制面板需要至少 1640px。它默认收起，可通过顶部滑杆图标打开或再次关闭。

## 从旧版升级

同名皮肤已经存在时，安装器会停止，不会覆盖。请先使用旧包或本包的卸载脚本移除视觉扩展，再安装新版本。

本包的卸载脚本只移除视觉扩展，不删除 `mornye-ai`、`mornye` 或其他人格预设。

## 卸载

先停止 DSH，再运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\uninstall.ps1
```

如果 `dsh` 不在 PATH 中，同样添加 `-DshProject`。

卸载器只有在扩展目录存在正确的 Mornye 安全标记时才会删除目录，并且会先通过 DSH 官方 CLI 移除 Web profile 依赖。

## 文件校验

包内 `SHA256SUMS.txt` 列出每个安装文件的 SHA-256。ZIP 旁的 `.sha256` 文件用于校验整个压缩包。

该包标记为 `UNLICENSED`，适合获得作者许可后的私人复制和本地安装，不代表允许上传到 npm 或公开再发布。
