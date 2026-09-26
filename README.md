# 莫宁 Observation Skin

DeepSeek Harness 的非官方莫宁视觉皮肤：浅蓝灰观测工作台、细线轨道、外观控制器与本地聊天导航。

**桌面适配版 0.4.1 已开源，支持 Windows 桌面预览版 `0.1.7-rc.2`。** 使用原生客户端插件接口，不修改官方程序文件。

- [下载桌面版 ZIP](https://github.com/is-limo/Mornye-Observation-Skin/releases/download/v0.4.1/Mornye-Observation-Skin-Desktop-0.4.1.zip)
- [安装、使用、卸载与源码构建](README.desktop.zh-CN.md)
- [发行版本与校验文件](https://github.com/is-limo/Mornye-Observation-Skin/releases)

![莫宁桌面观测台布局预览，使用合成示例内容](docs/desktop-preview.png)

| 发行版 | 适用程序 | 安装入口 |
| --- | --- | --- |
| **0.4.1 Desktop** | Windows DSH Desktop `0.1.7-rc.2` | `install-desktop.ps1` |
| 0.3.1 Legacy Web | `@deepseek-ai/dsh@0.1.0-rc.6` | `install.ps1`，见[旧版说明](README.zh-CN.md) |

旧版 Web 插件保留在仓库根目录；桌面插件源码在 `desktop/`。请按对应说明安装，两个版本的安装入口和配置 profile 不同。

桌面版在浅色主题下提供完整视觉效果；窄窗口收起观测栏，原生工具面板打开时优先显示官方面板，深色主题回退到官方呈现。外观选项保存在本机；聊天摘要只在页面内存中处理，没有第三方遥测、CDN 或远程脚本。完整数据边界见 [PRIVACY.md](PRIVACY.md)。

中文名为「莫宁」；Mornye / MORNYE 为包名、文件名与界面字标。

原始代码、样式和文档采用 [MIT 许可](LICENSE)。角色美术及第三方标识不在 MIT 授权范围内，见 [素材归属说明](ASSETS-NOTICE.md)。本项目不隶属于 DeepSeek 或库洛游戏。
