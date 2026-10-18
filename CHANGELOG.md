# 更新日志

本文记录面向使用者的变更。版本兼容范围与已验收能力见 [VALIDATION.md](VALIDATION.md)。

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