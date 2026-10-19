# 更新日志

本文记录面向使用者的变更。版本兼容范围与已验收能力见 [VALIDATION.md](VALIDATION.md)。

## 未发布（Unreleased）

## 0.2.1 — 2026-10-19

- 组件详情里的每条能力改成写明输入和产出，不再用一句话带过。
- README 加入两张由 `grok_generate_image` 实际生成的演示图。

## 0.2.0 — 2026-10-19

离开 alpha 发布通道。`publishConfig.tag` 与发布工作流改为 npm `latest`；版本号不再带预发布标识。

- 插件详情页顶部列出全部能力：对话、模型目录、文生图、图生图、文生视频、图生视频、视频编辑、视频延长、语音合成、任务查询、下载重试、任务列表、后台查询、侧栏播放，以及明确不提供的语音识别、实时语音和直接 OAuth。
- 新增 `grok_edit_image`、`grok_edit_video`、`grok_extend_video`。`grok_generate_video` 可带一张静帧做图生视频。
- 视频任务提交后在本进程后台查询，不重复提交；结果卡片仍是快照。
- 同一数据目录用文件锁互斥，崩溃进程留下的锁可以被接管。
- 聊天路由仍通过官方适配器的注册结果接到公开的 `registerAdapter`。`0.2.1-rc.2` 没有可独立构造的第三方路由工厂，这项没有伪装成已解除。

## 0.2.0-alpha.3 — 2026-10-19

媒体结果卡片改为快照，已保存的结果只留下打开按钮：

- 生成中、提交中的卡片标明这是本次调用记下的快照，进度文案改为「进度快照」，并说明它不会自动更新，需要再调用 `grok_media_status`。
- 状态为已保存且有文件时，卡片只显示「打开结果」按钮，不再重复状态、模型和任务号。
- 类型名称改为「图片 / 视频 / 语音」。

对齐官方基线，移除自建市场索引：

- `dsh.manifestVersion` 设为 `1`；`engines.dsh` 改为 `>=0.2.1-rc.2 <0.3.0-0`，`engines.node` 保持 `>=22.19.0`。
- 官方依赖统一到 0.2.1 基线：`@deepseek-ai/dsh-credentials`、`@deepseek-ai/dsh-llm-pi-ai`、`@deepseek-ai/dsh-tools` 的 peer 范围改为 `>=0.2.1-0 <0.3.0`；开发依赖 `@deepseek-ai/dsh-llm` 同步放宽为同一范围；`@deepseek-ai/cordis` 与 `@deepseek-ai/schemastery` 保持 `~4.0.4` / `~3.18.4`。
- 移除自建市场索引：删除 `market/index.json`、`scripts/validate-market.mjs`、`scripts/update-market.mjs`、`validate:market` 脚本、`@deepseek-ai/dsh-plugin-market-index` 开发依赖，以及发布流程里的索引刷新步骤；README 不再提供 Discover 索引安装方式。
- 发布包 `files` 移除 `PLAN.md`、`ROADMAP.md`、`VALIDATION.md`（文件仍保留在仓库），并保留 `SECURITY.md`、中英文 README、`LICENSE`、`CHANGELOG.md`、`locale` 与 `icon.svg`。
- 首轮模型发现改为后台进行：插件激活不再等待 `/models` 请求，慢网络或密钥缺失都不会拖住安装与设置修复；发现结果到达后聊天与媒体工具的描述同步重建。
- CI 改为 Node 22.19 / 24 双版本与 Linux / Windows 双平台矩阵；自动测试增至 65 项。

## 0.2.0-alpha.2 — 2026-10-18

客户端界面双语与发布工程补齐：

- 客户端设置页、工具结果卡片、媒体播放器与只读提供商页接入 dsh 官方 locale 服务（`ctx.locale.register` + 槽位 `locale` 选项）：跟随宿主语言显示英文或中文，切换语言实时生效；缺少 locale 服务的旧宿主回退中文。
- `dsh.client.inject` 增加 `@deepseek-ai/dsh-client-locale`；README 增加英文界面截图。
- 删除未被任何 dsh 版本使用的 `locale/build/*` 资源与 `./build/locale/*.json` 导出，npm 包更精简。
- devDependencies 保持 `@deepseek-ai/dsh-llm@0.2.0-rc.2`：升到 0.2.1-rc.2 会与 SDK 传递依赖的 peer 范围冲突而使 `npm ci` 失败；运行时兼容仍由 `engines.dsh` 门禁控制。
- 发布工作流在创建 Release 后自动把 `market/index.json` 更新到本次 tag 的 commit 并推送回 `main`；`npm run validate:market` 继续作为门禁。
- 自动测试由 55 项增加到 63 项（新增客户端 i18n 与打包回归测试），全部通过。

## 0.2.0-alpha.1 — 2026-10-18

首个可从公开仓库安装的预览版。设置页交互与配置调整，含一处配置键废弃；本轮同时补齐插件展示元数据、双语文档、GitHub Release 与社区收录所需文件：

- 插件展示元数据：`locale/en.json` 与 `package.json` 改为英文标题与描述；新增 `assets/imagine.svg` 并导出 `./imagine/icon`，`dsh-grok-imagine` 组件行不再缺图。
- 打包修正：`files` 由 `locale/*.json` 改为 `locale`，npm/Git 安装包含子路径的 `locale/imagine/*.json`；补入 `docs/assets`、`screenshots.json`、`SECURITY.md` 相关文件。
- README 重写为中英双语（英文主文档 + `README.zh.md`），加入 banner、截图、兼容矩阵、安装/更新/卸载、配置、安全与隐私、常见故障与安装成功判定。
- 新增 `SECURITY.md`、Issue/PR 模板、`screenshots.json`、`market/index.json` 市场索引（format 1）与 `npm run validate:market` 校验脚本。
- 新增 tag 发布工作流：校验 tag 与版本一致、跑测试与构建、生成 GitHub Release 并附加 `npm pack` 产物；配置 `NPM_TOKEN` 后同时发布 npm。
- CI 增加市场索引校验；仓库 topic 补充 `cordis`、`llm-provider`、`image-generation`、`video-generation`、`text-to-speech`。
- 设置页交互与配置调整：

- 对话模型表格就是聊天选择器名单：删掉的行保存后不再被加回；「添加」移到表格下方，与「保存对话模型」同排。
- 移除每行的「默认模型」单选列与 `media.defaultModel` 配置键。旧配置里残留的该键启动时被忽略，保存时自动 `unset`/删除。
- 媒体模型去掉独立的「启用」勾选框：选中模型 ID 即启用，选「不使用」即清空。
- 删除按钮移到每行首列，红字红边，高度与「添加」一致；上下文/最大输出输入框收窄，思考强度摘要改为紧凑单行。
- API 地址为空时回显默认地址，保存时写入同一地址；已保存地址原样回显。
- 依赖声明：peer 依赖由固定 `0.2.0-rc.2` 放宽为 `>=0.2.0-rc.2 <0.3.0`，新增 `engines.dsh`（dsh 的兼容门禁，预发布版本参与比较）；已在 dsh `0.2.1-rc.1` 桌面 profile 实际加载并调用工具。
- 修复插件详情页保存后把设置 RPC 的 namespace view 当成配置节的问题：媒体模型不再回退成「不使用」，连续保存不再因旧 revision 被拒。
- 自动测试由 11 项扩展到 51 项，覆盖上述设置页行为与配置清理。

## 0.1.0-alpha.1 — 2026-10-16（未发布）

- 首个开发版：模型目录发现与分类、`grok-all` 原生聊天提供方、图片/视频/TTS 工具、持久任务与本地保存、Web 侧栏音视频播放、插件设置页。
- 补充 MIT 许可证：新增 `LICENSE`、`package.json` 的 `license`/`author`/`homepage`。
- 新增 `.gitattributes` 固定 LF 行尾，避免 Windows 检出后 `lib/client.js` 产物比对出现假差异。
- CI 改为 Linux 与 Windows 双矩阵，并新增 `prepublishOnly` 门禁，发布前必须通过测试与语法检查。
- 官方适配器注册失败时保留原始错误（不再被通用提示覆盖）并写入 `warn` 日志，便于定位 dsh 版本不兼容。
- 测试补全：断言捕获到的适配器是 `@deepseek-ai/dsh-llm` 的 `LlmAdapter` 实例，并校验 `providerInfo` 与 `listModels`。
- `@deepseek-ai/dsh-llm` 由隐式依赖改为显式 `devDependencies`。
- `publishConfig` 固定发布到官方 registry 并使用 `alpha` 标签。
- npm 账号注册受阻，本版不发 npm：分发走仓库安装（`dsh plugin add git+https://…`）或 `npm pack` 产物（`dsh plugin add <tgz>` 实测可安装）。