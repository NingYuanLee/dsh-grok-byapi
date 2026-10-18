# Security

[English](#english) | [中文](#中文)

## English

### What this plugin can access

- **Network**: it talks only to the Grok gateway you configure (`connection.baseURL`). Model discovery calls `GET /models`; chat uses the configured OpenAI-compatible route; media tools call the image, video, and TTS endpoints on the same base URL. There is no telemetry and no call to a third party other than that gateway.
- **Credentials**: the API key is stored through the DeepSeek Harness credential service under the reference name `GROK_ALL_API_KEY` (or the reference you configure). It is never written to YAML, logs, task records, or the repository. Media downloads from third-party URLs are requested without the gateway key.
- **Files**: generated media is written under `$DSH_HOME/plugins/dsh-grok-byapi` (or `media.dataDir`) with process-local isolation. Task records may contain signed upstream URLs and are private data.
- **What this plugin does not do**: it does not read or reuse the Grok CLI OAuth refresh token, does not install or run other plugins, and does not add runtime dependencies at install time. It has no `prepare`/`postinstall` script, so `dsh plugin add` does not execute build code.

### Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private vulnerability reporting on this repository (**Security → Report a vulnerability**) and include the affected version, a reproduction, and the impact. Expect an initial reply within a few days.

## 中文

### 这个插件能访问什么

- **网络**：只连接你配置的 Grok 网关（`connection.baseURL`）。模型发现请求 `GET /models`，对话走配置的 OpenAI 兼容路由，媒体工具调用同一地址下的图片、视频、TTS 接口。没有遥测，也不会请求除该网关外的第三方。
- **凭据**：调用密钥通过 dsh 凭据服务保存，引用名为 `GROK_ALL_API_KEY`（或你配置的引用名），不会写入 YAML、日志、任务记录或仓库。第三方媒体下载不携带网关密钥。
- **文件**：生成物保存在 `$DSH_HOME/plugins/dsh-grok-byapi`（或 `media.dataDir`），按连接和任务隔离。任务记录可能含上游签名 URL，属于私有数据。
- **不做的事**：不读取或复用 Grok CLI 的 OAuth 刷新令牌，不安装或执行其他插件，不在安装期拉取运行时依赖；没有 `prepare`/`postinstall` 脚本，`dsh plugin add` 不会执行构建代码。

### 报告漏洞

安全问题请不要开公开 issue，请使用本仓库的 GitHub 私有漏洞报告（**Security → Report a vulnerability**），附版本、复现步骤和影响。会在几天内回复。
