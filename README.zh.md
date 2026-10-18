![Grok ByAPI for DeepSeek Harness](docs/assets/banner.svg)

# dsh-grok-byapi

在 DeepSeek Harness 中通过你自己的 OpenAI 兼容 Grok 网关使用 Grok：原生聊天提供方，外加图片、视频和语音合成工具。

[![CI](https://github.com/NingYuanLee/dsh-grok-byapi/actions/workflows/ci.yml/badge.svg)](https://github.com/NingYuanLee/dsh-grok-byapi/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![Node >=22.19](https://img.shields.io/badge/node-%3E%3D22.19.0-339933.svg)](#兼容性) [![dsh 0.2.x](https://img.shields.io/badge/dsh-0.2.x-blue.svg)](#兼容性) [![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-6f42c1.svg)](https://github.com/topics/dsh-plugin) [![GitHub tag](https://img.shields.io/github/v/tag/NingYuanLee/dsh-grok-byapi?label=tag&include_prereleases)](https://github.com/NingYuanLee/dsh-grok-byapi/tags)

[English](README.md) | 中文

> **早期 alpha（`0.2.0-alpha.1`）**：npm 尚未发布，请从 git 安装（Release tarball 发布后也可用）；建议先用独立测试 profile。实际验收范围见 [VALIDATION.md](VALIDATION.md)，逐版变更见 [CHANGELOG.md](CHANGELOG.md)。

一个插件、一套网关连接。聊天模型出现在模型选择器里；图片、视频、TTS 模型不进入选择器，改由工具调用。任何聊天模型——Grok 或其他提供方——都能调用这些工具。插件只连接你已有的 Grok 网关（默认 CLIProxyAPI），把调用密钥存进 dsh 凭据服务，生成物保存在本地。它不是 OAuth 客户端，不提供账号或额度，也不读取 Grok CLI 的 OAuth 令牌。

## 演示

| 插件页 | 设置页 |
| --- | --- |
| ![插件列表中已安装 dsh-grok-byapi](docs/assets/screenshot-plugins.jpg) | ![插件设置页，两个组件运行中](docs/assets/screenshot-settings.jpg) |

通过图片工具生成的一张 Grok 示例图：

![通过插件生成的示例图](docs/assets/showcase.jpg)

## 功能

| 方面 | 当前实现范围 |
| --- | --- |
| 聊天提供方 | 注册原生 dsh LLM 提供方：路由名 `xAI-CLIProxyAPI`，显示名 **Grok**。流式文本与工具调用复用官方 pi-ai 适配器。 |
| 模型目录 | `GET /models` 自动发现，分类为聊天、图片、视频、语音、研究或未知。只有聊天模型进入选择器，未知模型不会。支持逐模型覆盖。 |
| 设置页 | 连接、密钥、验证、超时、对话模型表格（选择器名单的来源）以及媒体模型选择。 |
| 持久媒体任务 | 任务记录按会话隔离，重启后保留。下载先写 `.part`，校验后改名。存储按连接和任务隔离。 |
| 结果展示 | 工具结果卡片、文件预览，以及 MP4、MP3、WAV 侧栏播放器。 |

插件的两个组件合计注册 7 个工具：

| 工具 | 作用 |
| --- | --- |
| `grok_models` | 刷新模型目录，按能力分组返回。可选 `verify_key`，用一次 `GET /models` 检查地址与密钥。 |
| `grok_generate_image` | 生成并保存图片：`prompt`，可选 `model`、`n`（1–4，默认 1）。 |
| `grok_generate_video` | 提交视频任务：`prompt`，可选 `model`、`duration`（1–15 秒，默认 2）。用 `grok_media_status` 取回。 |
| `grok_speak` | 文字转语音并保存为 MP3：`input`，可选 `model` 和 `voice`。 |
| `grok_media_list` | 列出当前会话创建过的媒体任务。 |
| `grok_media_status` | 查询任务状态，就绪时下载保存：`task_id`。 |
| `grok_media_retry_download` | 只重试下载，不重新生成：`task_id`。 |

尚未实现：图片编辑、视频编辑/延长、后台自动轮询与完成通知、实时任务面板、语音识别、实时语音、直接 OAuth。模型分类是规则推断，不是可用性保证；模型数量取决于你的网关。

## 兼容性

| 组件 | 要求 | 已验证 |
| --- | --- | --- |
| dsh | 由 `engines.dsh` 声明 `>=0.2.0-rc.2 <0.3.0` | `0.2.0-rc.2` 端到端（聊天、图片、视频、TTS、播放）；`0.2.1-rc.1` 加载、模型发现、设置页；`0.2.1-rc.2` 加载、模型发现、图片工具调用 |
| Node.js | `>=22.19.0` | Windows + Node 24；CI 在 Linux 与 Windows 上用 Node 24 |
| 网关 | OpenAI 兼容 `/v1` 端点；推荐 CLIProxyAPI | CLIProxyAPI v8.0.30 |
| 其他 dsh 0.2.x | 在 `engines.dsh` 范围内 | 未逐版验证 |

兼容门禁看 `engines.dsh`；`peerDependencies` 只锁定源码用到的 SDK 包，不决定兼容性，升级 dsh 后应重跑集成测试。xAI 直连或其他兼容端点可以承载聊天，但图片、视频、TTS 需要网关暴露对应的 Grok 接口。

## 安装

> npm 尚未发布：`npm install dsh-grok-byapi` 和 `dsh plugin add dsh-grok-byapi` 目前都不可用。请从下面三种方式选一种。

**从 git 安装，固定 tag（推荐）：**

```powershell
dsh --profile grok-byapi-test --from-default-profile web --dump-config
dsh plugin --profile grok-byapi-test add "git+https://github.com/NingYuanLee/dsh-grok-byapi.git@v0.2.0-alpha.1"
```

`--dump-config` 会基于默认 profile 创建新 profile、打印合并后的配置，不启动服务。`dsh plugin add` 会把插件记进该 profile 的 `dsh.profile.bundles`，不需要手动改 YAML。仓库没有 `prepare` / `postinstall` 脚本，安装期不执行构建代码，也不需要 `allowBuilds`。

**GitHub Release tarball（发布后可用）：**

```powershell
dsh plugin --profile grok-byapi-test add "https://github.com/NingYuanLee/dsh-grok-byapi/releases/download/v0.2.0-alpha.1/dsh-grok-byapi-0.2.0-alpha.1.tgz"
```

**本地源码（开发调试）：**

```powershell
git clone https://github.com/NingYuanLee/dsh-grok-byapi.git
cd dsh-grok-byapi
npm install --ignore-scripts
dsh --profile grok-byapi-test --from-default-profile web --dump-config
dsh plugin --profile grok-byapi-test add "$PWD"   # bash/zsh: "$(pwd)"
```

用这个 profile 启动：

```powershell
dsh --profile grok-byapi-test --no-open
```

建议先把插件放在独立 profile 里试，满意后再进日常 profile，这样提供方、工具和设置不会混进日常环境。需要完全隔离时，把 `DSH_HOME` 指到临时目录。

**从 DSH Discover 标签页安装（实验功能）**：在 插件 → Experimental plugins 打开 **Custom plugin markets**，进入 **Discover → Add index source**，填入：

```text
https://raw.githubusercontent.com/NingYuanLee/dsh-grok-byapi/main/market/index.json
```

索引把本版本固定到一个 Git commit，从 Discover 安装与上面的 git 命令等价。DSH 官方没有插件市场；这是自发布的 [format 1](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md) 索引。

## 更新与卸载

固定 tag 的 git 安装：先移除再装新 tag；本地源码安装：`git pull` 后 `npm install --ignore-scripts`；tarball 安装：移除后装新的 `.tgz`。以上操作完成后重启 dsh。

```powershell
dsh plugin --profile grok-byapi-test remove dsh-grok-byapi
```

移除后，插件贡献的 layer 从 profile 消失：提供方、7 个工具和设置页都不再出现。生成物与任务记录不会被删除，需要的话手动清理数据目录。为插件创建的凭据也不会随卸载删除，不再需要时在 dsh 里删掉。

## 配置

日常配置请用插件设置页。也可以在 profile 的 `cordis.patch.yml` 里手动覆盖，但这是可选项：

```yaml
- id: grok-byapi
  name: dsh-grok-byapi
  config:
    connection:
      baseURL: http://127.0.0.1:8317/v1
      api: openai-responses
      apiKeyEnv: GROK_ALL_API_KEY
      timeoutMs: 60000
    media:
      imageModel: grok-imagine-image-2.0
      videoModel: grok-imagine-video-1.5
      speechModel: grok-tts
      dataDir: ''
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `connection.baseURL` | `http://127.0.0.1:8317/v1` | 网关基础地址。`127.0.0.1` 指运行 dsh 的电脑；远程网关请用你自己的 HTTPS 地址。 |
| `connection.api` | `openai-responses` | 聊天协议，可选 `openai-completions`。 |
| `connection.apiKey` | 空 | 本地测试用的直接密钥覆盖，优先于凭据；正常使用保持为空。 |
| `connection.apiKeyEnv` | `GROK_ALL_API_KEY` | dsh 凭据服务里的引用名。 |
| `connection.verify` | `true` | 保存设置时用已存密钥验证一次 `GET /models`。 |
| `connection.timeoutMs` | `60000` | 请求超时，单位毫秒（1000–600000）。 |
| `media.imageModel` | 空 | 调用未指定 `model` 时使用的图片模型。 |
| `media.videoModel` | 空 | 调用未指定 `model` 时使用的视频模型。 |
| `media.speechModel` | 空 | 调用未指定 `model` 时使用的 TTS 模型。 |
| `media.dataDir` | 空 | 媒体输出目录；为空表示 `$DSH_HOME/plugins/dsh-grok-byapi`。 |
| `modelOverrides` | `[]` | 设置页写入的逐模型覆盖：分类、显示名、是否支持图片、上下文窗口、最大输出、思考强度。下次刷新时生效。 |

设置页会把调用密钥写进 dsh 凭据服务，引用名就是上面的 `apiKeyEnv`；配置文件只保留引用名，不要把密钥手写进 YAML。示例里的媒体模型 ID 来自测试网关，请用 `grok_models` 看你的网关实际提供哪些 ID。

## 安全与隐私

- **网络**：只连你配置的网关。发现模型请求 `GET /models`，聊天走配置的 OpenAI 兼容路由，媒体工具调用同一地址下的图片、视频、TTS 接口。没有遥测。
- **凭据**：密钥保存在 dsh 凭据服务里，不写入 YAML、日志、任务记录或仓库；第三方媒体下载不携带网关密钥。
- **文件**：生成物写入 `$DSH_HOME/plugins/dsh-grok-byapi`（或 `media.dataDir`）。任务记录可能包含上游签名 URL，请当作私有数据。
- **不做的事**：不读取或复用 Grok CLI 的 OAuth 令牌，不安装或执行其他插件，不在安装期拉取运行时依赖。

安装任何 dsh 插件都等于用你的用户权限执行第三方代码，工具审批不会隔离插件代码，安装前请先看源码。安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。

## 用法

- **聊天**：在模型选择器里选 **Grok**。选择器只列聊天模型；设置页的对话模型表格就是选择器内容，删掉某行并保存后该模型消失。
- **图片**：一次调用完成生成与保存；用本地绝对路径内联结果——`![说明](<D:/路径/result-1.png>)`。dsh Web 通过 `/api/file` 读取，单文件上限 20 MiB。
- **视频**：提交任务（1–15 秒），用返回的 `task_id` 调 `grok_media_status` 直到 `saved` 或 `failed`；`submission-unknown` 表示不要重复提交。没有自动轮询，也没有完成通知。
- **语音**：`grok_speak` 生成 MP3；`grok_media_retry_download` 只重试下载，不会重新生成。
- **展示**：视频和音频由工具结果卡片的播放器呈现，不要用 Markdown 图片语法内联；聊天不渲染它们，只会显示破图。

## 常见问题

以下四项都通过，才算安装成功：

1. `dsh --profile grok-byapi-test --dump-config` 的输出里能看到 `grok-byapi` layer。
2. 插件页里本插件存在，且两个组件（提供方与 `dsh-grok-imagine`）都在运行。
3. `grok_models` 能返回分类后的模型 ID。
4. 执行 `dsh plugin --profile grok-byapi-test remove dsh-grok-byapi` 后，layer 与组件都消失。

| 现象 | 处理 |
| --- | --- |
| `dsh plugin add` 失败或报 404 | npm 尚未发布，改用上面的 git 或 tarball 方式。 |
| 插件列表里有，但加载不成功 | dsh 不在 `>=0.2.0-rc.2 <0.3.0` 范围内，升级到 0.2.x 构建。 |
| 设置页报 401 或 403 | 密钥或基础地址不对，重新保存密钥并检查 `/v1` 后缀。 |
| 连接被拒或超时 | 网关没启动或不可达；`127.0.0.1` 指运行 dsh 的电脑。 |
| 选择器里没有 Grok 模型 | `/models` 没有返回可判定为聊天的模型；刷新 `grok_models` 并添加覆盖。 |
| 模型未发现或分类不对 | 刷新 `grok_models`，再到设置页修正分类。 |
| 聊天正常，图片/视频/TTS 失败 | 网关没有暴露对应的 Grok 接口，插件无法补上。 |
| 视频一直显示生成中 | 用 `grok_media_status` 查询；`submission-unknown` 的任务不要重复提交。 |

更多实测行为与限制见 [VALIDATION.md](VALIDATION.md)。

## 开发

```bash
npm install --ignore-scripts
npm test             # 55 项自动测试
npm run check        # 源文件语法检查
npm run build        # 由 src/client.js 重新生成 lib/client.js
npm run validate:market
npm pack --dry-run
```

CI（`.github/workflows/ci.yml`）在 Linux 与 Windows 上用 Node 24 运行：安装、测试、语法检查、构建、校验 `lib/client.js` 与构建产物一致、`validate:market`、打包预演。推送 `v*` tag 会触发 `.github/workflows/release.yml`：校验 tag 与 `package.json` 版本一致、重跑检查、把打包产物附到 GitHub Release，并且只在配置了 `NPM_TOKEN` secret 时发布到 npm。npm 发布目前受阻，所以目前以 git / tarball 分发。规划见 [ROADMAP.md](ROADMAP.md)，变更见 [CHANGELOG.md](CHANGELOG.md)。

## 社区、许可与免责声明

- Bug 与功能请求：[Issues](https://github.com/NingYuanLee/dsh-grok-byapi/issues)（仓库带 bug report 与 feature request 模板）。
- 安全：[SECURITY.md](SECURITY.md)，请使用 GitHub 私有漏洞报告。
- 许可：[MIT](LICENSE)。Copyright (c) 2026 NingYuanLee。
- 仓库：<https://github.com/NingYuanLee/dsh-grok-byapi>。这是社区插件项目，不是 DeepSeek 或 xAI 官方产品。「ByAPI」表示插件通过你自己的 API 网关访问 Grok，并不代表实现了 Grok 官网的全部功能。