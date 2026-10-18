import React, { useEffect, useRef, useState } from 'react';

const EFFORT_ORDER = ['none', 'low', 'medium', 'high', 'xhigh'];
function defaultImageSupported(id) {
  return /^grok-4\.[34567](?:-|$)/.test(id) || /^grok-4\.20(?:-|$)/.test(id) || /^grok-build-0\.1(?:-|$)/.test(id);
}
function defaultReasoningEfforts(id) {
  if (/^grok-4\.[67](?:-|$)/.test(id)) return ['low', 'medium', 'high', 'xhigh'];
  if (/^grok-4\.5(?:-|$)/.test(id)) return ['low', 'medium', 'high'];
  if (/^grok-4\.3(?:-|$)/.test(id)) return ['none', 'low', 'medium', 'high', 'xhigh'];
  return [];
}

// 客户端 UI 字典：扁平 key → 文案，{name} 为模板参数。zh / en 的 key 集合必须完全一致。
// 与 dsh 官方 locale 服务注册为 grokByapi 命名空间；组件里的 t 由槽位 locale 声明注入。
export const zh = {
  'tool.running': 'Grok · 正在执行 {tool}',
  'tool.errorPrefix': 'Grok · ',
  'tool.callFailed': '调用失败',
  'tool.models.title': 'Grok 模型目录 · {count} 个',
  'tool.models.empty': '无',
  'tool.categoryLine': '{category}：',
  'tool.category.chat': '对话',
  'tool.category.image': '图片',
  'tool.category.video': '视频',
  'tool.category.speech': '语音',
  'tool.category.research': '研究',
  'tool.category.unknown': '未知',
  'tool.task': '任务：{id}',
  'tool.progress': '上游进度：{percent}%',
  'tool.openResult': '打开结果 · {name}',
  'tool.statusHint': '调用 grok_media_status 查询原任务；本卡片显示该次调用记录的状态。',
  'tool.state.submitting': '提交中',
  'tool.state.generating': '生成中',
  'tool.state.downloading': '正在保存',
  'tool.state.saved': '已保存',
  'tool.state.failed': '失败',
  'tool.state.submissionUnknown': '提交结果未知，请勿重复生成',
  'tool.state.downloadFailed': '生成完成，保存失败，可重试下载',
  'media.loading': '正在加载媒体文件…',
  'media.playbackFailed': '当前客户端无法播放该文件。请使用文件卡片在系统应用中打开。',
  'media.title': 'Grok 媒体播放',
  'provider.summary': 'Grok 提供商（只读）',
  'provider.title': 'Grok 提供商',
  'provider.notice': '此页只读。改地址、密钥和模型请到「插件 → {pkg} → Grok ByAPI」。',
  'provider.row.providerId': '提供商 ID',
  'provider.row.apiAddress': 'API 地址',
  'provider.row.apiKey': 'API Key',
  'provider.row.modelSource': '模型来源',
  'provider.row.configLocation': '详细配置位置',
  'provider.value.credentialStore': 'dsh 凭据库 · {ref}',
  'provider.value.modelSource': '上游 /v1/models 发现 + 本页显式配置',
  'provider.value.configLocation': '插件 → {pkg} → Grok ByAPI',
  'settings.connection': '连接',
  'settings.apiAddress': 'API 地址',
  'settings.apiProtocol': 'API 协议',
  'settings.apiKey': 'API Key',
  'settings.apiKeyPlaceholder': '留空沿用已存密钥',
  'settings.credentialHint': '填写后保存即写入 dsh 凭据库（{ref}），不会写进插件配置文件。',
  'settings.action.getModels': '获取模型',
  'settings.action.gettingModels': '获取中…',
  'settings.action.saveConnection': '保存地址和密钥',
  'settings.action.saving': '保存中…',
  'settings.chatModels': '对话模型',
  'settings.chatHint': '这里配置的模型会出现在对话右下角。模型弹窗里的本提供商只读。生成结果默认保存在 ~/.dsh/plugins/dsh-grok-byapi。',
  'settings.discoveredCount': '已获取 {count} 个模型。',
  'settings.chatEmptyHint': '已有一行空配置。先获取模型，下拉才会出现可选项。',
  'settings.table.modelId': '模型 ID',
  'settings.table.displayName': '显示名称',
  'settings.table.images': '图片',
  'settings.table.context': '上下文',
  'settings.table.maxOutput': '最大输出',
  'settings.table.effort': '思考强度',
  'settings.table.selectModel': '选择模型',
  'settings.getModelsFirst': '先获取模型',
  'settings.table.noRows': '还没有配置行。',
  'settings.table.modelIdAria': '模型 ID {index}',
  'settings.table.displayNameAria': '显示名称 {index}',
  'settings.table.imagesAria': '支持图片 {index}',
  'settings.table.contextAria': '上下文 {index}',
  'settings.table.maxOutputAria': '最大输出 {index}',
  'settings.table.deleteRowAria': '删除第 {index} 行',
  'settings.action.addRow': '添加模型行',
  'settings.action.add': '添加',
  'settings.action.delete': '删除',
  'settings.action.saveChat': '保存对话模型',
  'settings.mediaModels': '媒体模型',
  'settings.action.saveMedia': '保存媒体模型',
  'settings.media.none': '不使用',
  'settings.media.image': '生成图片',
  'settings.media.video': '生成视频',
  'settings.media.audio': '生成音频',
  'settings.effort.unset': '未设置',
  'settings.effort.aria': '思考强度 {index}',
  'settings.effort.optionsAria': '思考强度选项 {index}',
  'settings.effort.levelAria': '思考强度 {level} {index}',
  'settings.writableBlocked': '当前配置被更高优先级的配置层覆盖，不能从此页修改。',
  'settings.summary': 'Grok 连接、密钥与模型参数',
  'settings.load.missing': '没有读到已保存的 Grok ByAPI 配置，先按默认值显示。',
  'settings.load.failed': '读取已保存配置失败，先按默认值显示：{message}',
  'settings.keyFailure.blank': '不能只有空白字符；想沿用已存密钥请留空。',
  'settings.keyFailure.charset': '密钥只能是可打印 ASCII 字符，不能有空格、引号或换行；请只粘贴密钥本身。',
  'settings.credential.writeUnavailable': '当前页面保存不了密钥',
  'settings.credential.writeFailed': '凭据写入失败',
  'settings.discovery.unavailable': '当前页面没有模型发现接口，请改用 grok_models 工具。',
  'settings.discovery.missingBaseUrl': '还没有可用的 API 地址，无法获取模型。',
  'settings.discovery.invalidResponse': '获取模型失败：返回的不是模型列表。',
  'settings.discovery.found': '已从 Grok ByAPI 发现 {count} 个模型，按需添加行并保存。',
  'settings.discovery.failed': '获取模型失败：{message}',
  'settings.validation.contextWindow': '{id}：上下文大小要写成像 500K / 1M / 200000 这样的正数。',
  'settings.validation.maxTokens': '{id}：最大输出 token 要写成像 32K / 64K 这样的正数。',
  'settings.writeUnavailable': '当前页面写不了配置。',
  'settings.save.rejected': '未保存，请检查权限、配置来源或是否被其他窗口更新。',
  'settings.save.failed': '保存失败，草稿已保留，请检查配置或重新加载。',
  'settings.save.addressPending': '地址已保存，正在写入密钥。',
  'settings.save.addressDone': '地址已保存。',
  'settings.save.keyFailed': '地址已保存，但密钥未写入：{message}',
  'settings.save.credentialDone': '地址和密钥已保存。密钥在凭据库（{ref}）。',
  'settings.save.needModels': '先点「获取模型」，或先选择一条对话模型。',
  'settings.save.chatCount': '已保存 {count} 条对话模型。',
  'settings.save.mediaDone': '媒体模型已保存。',
  'error.unknown': '未知错误',
};

export const en = {
  'tool.running': 'Grok · Running {tool}',
  'tool.errorPrefix': 'Grok · ',
  'tool.callFailed': 'Call failed',
  'tool.models.title': 'Grok model catalog · {count}',
  'tool.models.empty': 'None',
  'tool.categoryLine': '{category}:',
  'tool.category.chat': 'Chat',
  'tool.category.image': 'Images',
  'tool.category.video': 'Video',
  'tool.category.speech': 'Speech',
  'tool.category.research': 'Research',
  'tool.category.unknown': 'Other',
  'tool.task': 'Task: {id}',
  'tool.progress': 'Upstream progress: {percent}%',
  'tool.openResult': 'Open result · {name}',
  'tool.statusHint': 'Call grok_media_status to check the original task; this card shows the status recorded by that call.',
  'tool.state.submitting': 'Submitting',
  'tool.state.generating': 'Generating',
  'tool.state.downloading': 'Saving',
  'tool.state.saved': 'Saved',
  'tool.state.failed': 'Failed',
  'tool.state.submissionUnknown': 'Submission status unknown; do not generate again',
  'tool.state.downloadFailed': 'Generated; saving failed. You can retry the download',
  'media.loading': 'Loading media file…',
  'media.playbackFailed': 'This client cannot play this file. Open it from the file card in a system app.',
  'media.title': 'Grok media player',
  'provider.summary': 'Grok provider (read-only)',
  'provider.title': 'Grok provider',
  'provider.notice': 'This page is read-only. To change the address, key, or models, go to "Plugins → {pkg} → Grok ByAPI".',
  'provider.row.providerId': 'Provider ID',
  'provider.row.apiAddress': 'API address',
  'provider.row.apiKey': 'API key',
  'provider.row.modelSource': 'Model source',
  'provider.row.configLocation': 'Detailed config location',
  'provider.value.credentialStore': 'dsh credential store · {ref}',
  'provider.value.modelSource': 'Upstream /v1/models discovery + explicit configuration on this page',
  'provider.value.configLocation': 'Plugins → {pkg} → Grok ByAPI',
  'settings.connection': 'Connection',
  'settings.apiAddress': 'API address',
  'settings.apiProtocol': 'API protocol',
  'settings.apiKey': 'API key',
  'settings.apiKeyPlaceholder': 'Leave blank to keep the saved key',
  'settings.credentialHint': 'Saving writes the key to the dsh credential store ({ref}); it is never written to the plugin config file.',
  'settings.action.getModels': 'Get models',
  'settings.action.gettingModels': 'Getting models…',
  'settings.action.saveConnection': 'Save address and key',
  'settings.action.saving': 'Saving…',
  'settings.chatModels': 'Chat models',
  'settings.chatHint': 'Models configured here appear in the chat model selector. This provider is read-only in the model dialog. Generated results are saved to ~/.dsh/plugins/dsh-grok-byapi by default.',
  'settings.discoveredCount': '{count} models fetched.',
  'settings.chatEmptyHint': 'There is one empty row. Fetch models first to populate the dropdown.',
  'settings.table.modelId': 'Model ID',
  'settings.table.displayName': 'Display name',
  'settings.table.images': 'Images',
  'settings.table.context': 'Context',
  'settings.table.maxOutput': 'Max output',
  'settings.table.effort': 'Reasoning effort',
  'settings.table.selectModel': 'Select model',
  'settings.getModelsFirst': 'Get models first',
  'settings.table.noRows': 'No rows configured yet.',
  'settings.table.modelIdAria': 'Model ID {index}',
  'settings.table.displayNameAria': 'Display name {index}',
  'settings.table.imagesAria': 'Supports images {index}',
  'settings.table.contextAria': 'Context {index}',
  'settings.table.maxOutputAria': 'Max output {index}',
  'settings.table.deleteRowAria': 'Delete row {index}',
  'settings.action.addRow': 'Add model row',
  'settings.action.add': 'Add',
  'settings.action.delete': 'Delete',
  'settings.action.saveChat': 'Save chat models',
  'settings.mediaModels': 'Media models',
  'settings.action.saveMedia': 'Save media models',
  'settings.media.none': 'None',
  'settings.media.image': 'Image generation',
  'settings.media.video': 'Video generation',
  'settings.media.audio': 'Audio generation',
  'settings.effort.unset': 'Not set',
  'settings.effort.aria': 'Reasoning effort {index}',
  'settings.effort.optionsAria': 'Reasoning effort options {index}',
  'settings.effort.levelAria': 'Reasoning effort {level} {index}',
  'settings.writableBlocked': 'This configuration is overridden by a higher-priority layer and cannot be modified here.',
  'settings.summary': 'Grok connection, key, and model parameters',
  'settings.load.missing': 'No saved Grok ByAPI configuration found; showing defaults.',
  'settings.load.failed': 'Failed to read the saved configuration; showing defaults: {message}',
  'settings.keyFailure.blank': 'Cannot be whitespace only; leave it blank to keep the saved key.',
  'settings.keyFailure.charset': 'The key must contain printable ASCII characters only, with no spaces, quotes, or line breaks; paste only the key itself.',
  'settings.credential.writeUnavailable': 'This page cannot save the key',
  'settings.credential.writeFailed': 'Failed to write the credential',
  'settings.discovery.unavailable': 'Model discovery is not available on this page; use the grok_models tool instead.',
  'settings.discovery.missingBaseUrl': 'No API address is available, so models cannot be fetched.',
  'settings.discovery.invalidResponse': 'Failed to fetch models: the response was not a model list.',
  'settings.discovery.found': 'Discovered {count} models from Grok ByAPI. Add the rows you need and save.',
  'settings.discovery.failed': 'Failed to fetch models: {message}',
  'settings.validation.contextWindow': '{id}: Context size must be a positive number such as 500K / 1M / 200000.',
  'settings.validation.maxTokens': '{id}: Max output tokens must be a positive number such as 32K / 64K.',
  'settings.writeUnavailable': 'This page cannot write configuration.',
  'settings.save.rejected': 'Not saved. Check permissions, the configuration source, or whether another window updated it.',
  'settings.save.failed': 'Save failed. The draft is preserved; check the configuration or reload the page.',
  'settings.save.addressPending': 'Address saved. Writing the key…',
  'settings.save.addressDone': 'Address saved.',
  'settings.save.keyFailed': 'Address saved, but the key was not written: {message}',
  'settings.save.credentialDone': 'Address and key saved. The key is in the credential store ({ref}).',
  'settings.save.needModels': 'Click "Get models" first, or select a chat model first.',
  'settings.save.chatCount': 'Saved {count} chat models.',
  'settings.save.mediaDone': 'Media models saved.',
  'error.unknown': 'Unknown error',
};

// 生成一个带 {name} 插值的翻译函数；缺 key 时回显 key（与官方 t 行为一致）。
export function createT(dict) {
  const table = dict || {};
  return function translate(key, params) {
    const template = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
    if (typeof template !== 'string') return key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
  };
}
// 组件没有拿到框架注入的 t 时（旧宿主/测试）回退中文，保持现有界面不变。
const zhT = createT(zh);

export const inject = ['slots', 'documentPreviews', 'remote', 'remote.llm', 'remote.settings', 'remote.credentials', 'locale'];
const h = React.createElement;
const MEDIA_ID = 'dsh-grok-byapi/media-preview';
// 设置命名空间 = Grok ByAPI 这一行在 profile 里的实例 id（cordis.patch.yml 的 - id:）。
const SETTINGS_NS = 'grok-byapi';
// 包名 = 插件管理器里「插件包」那一行的标识，槽位 key 用的是它
const PKG_NAME = 'dsh-grok-byapi';
// 与 Config.connection.baseURL 的 schema 默认值一致。详情页没有表单，首屏 connection 是空的。
const DEFAULT_BASE_URL = 'http://127.0.0.1:8317/v1';
function resolveBaseURL(source) {
  const raw = source?.connection?.baseURL;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : DEFAULT_BASE_URL;
}
function readSettingsEntry(found) {
  const payload = found?.ok ? found.value : found;
  const listed = Array.isArray(payload) ? payload : payload?.namespaces;
  const entry = Array.isArray(listed) ? listed.find(row => row?.ns === SETTINGS_NS) : listed?.[SETTINGS_NS];
  const next = entry?.value || entry;
  if (!next || typeof next !== 'object' || !(next.connection || next.media || next.modelOverrides)) return null;
  return { value: next, revision: entry?.revision ?? 0 };
}
function discoveryErrorText(t, message) {
  if (typeof message === 'string' && /provider route or a baseURL/.test(message)) return t('settings.discovery.missingBaseUrl');
  return message;
}
const STATE_KEYS = {
  submitting: 'tool.state.submitting', generating: 'tool.state.generating', downloading: 'tool.state.downloading', saved: 'tool.state.saved',
  failed: 'tool.state.failed', 'submission-unknown': 'tool.state.submissionUnknown',
  'download-failed': 'tool.state.downloadFailed',
};
function stateText(t, status) {
  const key = STATE_KEYS[status];
  return key ? t(key) : status;
}
const tools = ['grok_generate_image', 'grok_generate_video', 'grok_speak', 'grok_media_status', 'grok_media_retry_download', 'grok_media_list', 'grok_models'];

export function resultValue(block) {
  try { return JSON.parse((block?.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n')); }
  catch { return undefined; }
}

export function GrokToolCard({ toolName, phase, block, openFile, t = zhT }) {
  if (phase !== 'result') return h('div', { role: 'status', style: { padding: 10 } }, t('tool.running', { tool: toolName }));
  const value = resultValue(block);
  const tasks = Array.isArray(value) ? value : value?.id ? [value] : [];
  if (!value || block?.isError) return h('div', { role: 'alert', style: { padding: 10 } }, t('tool.errorPrefix') + (block?.content?.filter(x => x.type === 'text').map(x => x.text).join('\n') || t('tool.callFailed')));
  if (value.models) return h('details', { style: { padding: 10 } }, h('summary', null, t('tool.models.title', { count: value.models.length })),
    value.error ? h('p', { role: 'alert' }, value.error) : null,
    ...['chat', 'image', 'video', 'speech', 'research', 'unknown'].map(category => h('div', { key: category }, h('strong', null, t('tool.categoryLine', { category: t('tool.category.' + category) })), value.models.filter(x => x.category === category).map(x => x.id).join('、') || t('tool.models.empty'))));
  return h('div', { style: { padding: 12, border: '1px solid var(--border-color, #8885)', borderRadius: 8 } },
    ...tasks.map(task => h('div', { key: task.id, style: { marginBottom: 8 } },
      h('strong', null, 'Grok ' + (task.kind || '') + ' · ' + stateText(t, task.status)),
      h('div', null, task.model),
      h('div', null, t('tool.task', { id: task.id })),
      Number.isFinite(task.progress) ? h('div', null, t('tool.progress', { percent: task.progress })) : null,
      task.error ? h('p', { role: 'alert' }, typeof task.error === 'string' ? task.error : JSON.stringify(task.error)) : null,
      ...(task.files || []).map(file => h('button', { key: file.path, type: 'button', onClick: () => openFile?.(file.path), disabled: !openFile, style: { display: 'block', marginTop: 6 } }, t('tool.openResult', { name: file.path.split(/[\\/]/).pop() }))),
      ['generating', 'submitting'].includes(task.status) ? h('small', null, t('tool.statusHint')) : null,
    )), tasks.length ? null : h('pre', { style: { whiteSpace: 'pre-wrap' } }, JSON.stringify(value, null, 2)));
}

export function MediaPreview({ content, t = zhT }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const data = content?.kind === 'bytes' ? content.data : undefined;
  useEffect(() => {
    if (!data) { setUrl(null); return; }
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const audio = bytes.length >= 3 && ((bytes[0] === 0x49 && bytes[1] === 0x44) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) || (bytes[0] === 0x52 && bytes[1] === 0x49));
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: audio ? (bytes[0] === 0x52 ? 'audio/wav' : 'audio/mpeg') : 'video/mp4' }));
    setUrl({ value: objectUrl, audio }); setFailed(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [data]);
  if (!url) return h('p', { role: 'status' }, t('media.loading'));
  return h('div', { style: { padding: 16 } },
    failed ? h('p', { role: 'alert' }, t('media.playbackFailed')) : null,
    h(url.audio ? 'audio' : 'video', { src: url.value, controls: true, preload: 'metadata', onError: () => setFailed(true), style: { width: '100%', maxHeight: '75vh' } }));
}

const KEY_REF = 'GROK_ALL_API_KEY';
const ui = {
  page: { maxWidth: 860, display: 'grid', gap: 16, color: 'var(--dsw-alias-label-primary)' },
  card: { border: '0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))', background: 'var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))', borderRadius: 'var(--dsw-radius-xl, 20px)', padding: 16, display: 'grid', gap: 12 },
  title: { margin: 0, fontSize: 14, fontWeight: 600 },
  hint: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: 1.5 },
  label: { display: 'grid', gap: 6, color: 'var(--dsw-alias-label-secondary)', fontSize: 12 },
  control: { height: 36, boxSizing: 'border-box', font: 'inherit', fontSize: 13, padding: '0 12px', color: 'var(--dsw-alias-label-primary)', background: 'var(--dsw-alias-bg-layer-1)', border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-md, 12px)' },
  button: { height: 32, padding: '0 14px', font: 'inherit', fontSize: 13, color: 'var(--dsw-alias-label-primary)', background: 'var(--dsw-alias-bg-layer-1)', border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-sm, 8px)', cursor: 'pointer' },
  danger: { height: 32, padding: '0 14px', font: 'inherit', fontSize: 13, color: 'var(--dsw-alias-state-error-primary, #c62828)', background: 'var(--dsw-alias-bg-layer-1)', border: '0.5px solid var(--dsw-alias-state-error-primary, #c62828)', borderRadius: 'var(--dsw-radius-sm, 8px)', cursor: 'pointer' },
  primary: { height: 32, padding: '0 14px', font: 'inherit', fontSize: 13, color: 'var(--dsw-alias-bg-base, #fff)', background: 'var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary))', border: 0, borderRadius: 'var(--dsw-radius-sm, 8px)', cursor: 'pointer' },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 },
  head: { textAlign: 'left', padding: '8px 6px', color: 'var(--dsw-alias-label-tertiary)', fontWeight: 500, borderBottom: '0.5px solid var(--dsw-alias-border-l3)' },
  status: { margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: 12 },
  alert: { margin: 0, color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 },
};
// 与官方模型配置同一套写法：密钥写进 dsh 凭据库（credentials/set），
// 配置里只保留引用名 apiKeyEnv；输入框 type=password，草稿留空表示沿用已存密钥。
const LEGAL_API_KEY = /^[\x21-\x7E]+$/;
function keyFailureOf(draft, t) {
  if (draft.length === 0) return undefined;
  const value = draft.trim();
  if (value.length === 0) return t('settings.keyFailure.blank');
  if (!LEGAL_API_KEY.test(value)) return t('settings.keyFailure.charset');
  return undefined;
}

const SIZE_UNITS = { '': 1, k: 1000, m: 1000000 };
// 官方支持的思考强度：4.7/4.6 含 xhigh，4.5 三档，4.3 另有 none；这里列出全部可选值，勾选即声明。
const ALL_EFFORTS = EFFORT_ORDER;
const MEDIA_FIELDS = [
  ['imageModel', 'settings.media.image', ['grok-imagine-image']],
  ['videoModel', 'settings.media.video', ['grok-imagine-video']],
  ['speechModel', 'settings.media.audio', ['grok-tts', 'grok-voice-tts']],
];
function blankChatRow() {
  return { id: '', displayName: '', contextWindow: '', maxTokens: '', image: false, efforts: [] };
}
function EffortPicker({ index, efforts, disabled, onChange, t = zhT }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const selected = Array.isArray(efforts) ? efforts : [];
  const summary = selected.length ? selected.join('|') : t('settings.effort.unset');
  useEffect(() => {
    if (!open) return undefined;
    const close = event => {
      if (root.current && root.current.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return h('div', { ref: root, style: { position: 'relative' } },
    h('button', {
      type: 'button', disabled, 'aria-label': t('settings.effort.aria', { index }), 'aria-expanded': open ? 'true' : 'false',
      onClick: () => setOpen(value => !value),
      style: { ...ui.control, height: 32, width: 'auto', padding: '0 6px', fontSize: 11, whiteSpace: 'nowrap', textAlign: 'left', cursor: disabled ? 'default' : 'pointer' },
    }, summary),
    open ? h('div', {
      role: 'group', 'aria-label': t('settings.effort.optionsAria', { index }),
      style: { position: 'absolute', zIndex: 20, top: 36, left: 0, minWidth: 148, display: 'grid', gap: 6, padding: 8,
        background: 'var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1))', border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-md, 12px)' },
    }, ...ALL_EFFORTS.map(level => h('label', { key: level, style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 } },
      h('input', {
        type: 'checkbox', checked: selected.includes(level), 'aria-label': t('settings.effort.levelAria', { level, index }),
        onChange: event => {
          const next = event.target.checked ? [...selected, level] : selected.filter(item => item !== level);
          onChange(ALL_EFFORTS.filter(item => next.includes(item)));
        },
      }),
      level))) : null);
}

// 尺寸输入：支持 500K / 1M 这类写法，也接受纯数字。
function parseSize(text) {
  const value = String(text ?? '').trim();
  if (!value) return undefined;
  const matched = /^(\d+(?:\.\d+)?)\s*([kKmM]?)$/.exec(value);
  if (!matched) return undefined;
  const amount = Number(matched[1]) * SIZE_UNITS[matched[2].toLowerCase()];
  return Number.isSafeInteger(amount) && amount > 0 ? amount : undefined;
}
function formatSize(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) return '';
  if (n % SIZE_UNITS.m === 0) return n / SIZE_UNITS.m + 'M';
  if (n % SIZE_UNITS.k === 0) return n / SIZE_UNITS.k + 'K';
  return String(n);
}
// 只读的提供商信息：模型配置弹窗里的「编辑」按钮打开的就是这里。
export function GrokProviderNotice({ view, form, t = zhT }) {
  const value = form?.state?.value;
  if (view === 'summary') return h('span', null, t('provider.summary'));
  const connection = value?.connection || {};
  const baseURL = resolveBaseURL(value);
  const rows = [
    [t('provider.row.providerId'), 'xAI-CLIProxyAPI'],
    [t('provider.row.apiAddress'), baseURL],
    [t('provider.row.apiKey'), t('provider.value.credentialStore', { ref: KEY_REF })],
    [t('provider.row.modelSource'), t('provider.value.modelSource')],
    [t('provider.row.configLocation'), t('provider.value.configLocation', { pkg: PKG_NAME })],
  ];
  return h('section', { style: { maxWidth: 680, padding: '16px 0' } },
    h('h3', null, t('provider.title')),
    h('p', { style: { opacity: 0.8, fontSize: 12, marginBottom: 12 } }, t('provider.notice', { pkg: PKG_NAME })),
    h('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 12 } },
      h('tbody', null, ...rows.map(([k, v]) => h('tr', { key: k },
        h('td', { style: { padding: '4px 8px 4px 0', opacity: 0.75, whiteSpace: 'nowrap' } }, k),
        h('td', { style: { padding: '4px 0' } }, h('code', null, String(v))))))));
}

export function GrokSettings(props) {
  const t = typeof props?.t === 'function' ? props.t : zhT;
  const view = props?.view;
  // 插件管理器只在「组件 grok-byapi」这一行注入 { state, mutate }。
  // 包详情页没有表单，也不能从这里自己去读设置。
  const form = props?.form?.state ? props.form : null;
  const remote = props?.remote;
  const [draft, setDraft] = useState(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [message, setMessage] = useState('');
  const [discoverNotice, setDiscoverNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState(null);
  const [categoryOf, setCategoryOf] = useState({});
  const [nameOf, setNameOf] = useState({});
  const [specOf, setSpecOf] = useState({});
  const [rows, setRows] = useState(null);
  const [loaded, setLoaded] = useState(form?.state?.value ? null : { connection: {}, media: {}, modelOverrides: [] });
  const [revision, setRevision] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const accepted = form?.state?.value || loaded;
  const value = draft || accepted;
  // 详情页不带表单。自动获取必须等这份配置回来，否则首屏空地址会被宿主拒绝。
  // 每次 effect 换一个 promise：严格模式先卸载再挂载时，不能让第一次的空结果关掉下一次。
  const settingsGate = useRef({ generation: 0, ready: Promise.resolve(null) });
  useEffect(() => {
    const generation = ++settingsGate.current.generation;
    let resolveGate = () => {};
    const ready = new Promise(resolve => { resolveGate = resolve; });
    settingsGate.current.ready = ready;
    const finish = next => { if (generation === settingsGate.current.generation) resolveGate(next); };
    if (form?.state?.value || !remote?.settings?.describe) {
      finish(form?.state?.value || null);
      return () => { finish(null); };
    }
    let live = true;
    remote.settings.describe().then(found => {
      const entry = readSettingsEntry(found);
      if (!live || generation !== settingsGate.current.generation) return;
      if (!entry) {
        setMessage(t('settings.load.missing'));
        finish(null);
        return;
      }
      setLoaded(entry.value);
      setRevision(entry.revision);
      finish(entry.value);
    }).catch(error => {
      if (generation !== settingsGate.current.generation) return;
      if (live) setMessage(t('settings.load.failed', { message: error?.message || t('error.unknown') }));
      finish(null);
    });
    return () => { live = false; finish(null); };
  }, []);
  useEffect(() => { setDraft(null); }, [form?.state?.revision, revision]);
  const autoRan = useRef(false);
  const media = value?.media || {};
  const ids = discovered || [];
  // 已配置的模型即使还没点「获取模型」也要能显示和编辑。
  const savedRows = (value?.modelOverrides || []).map(o => ({
    id: o.id, displayName: o.displayName || o.id,
    contextWindow: formatSize(o.contextWindow), maxTokens: formatSize(o.maxTokens),
    image: o.imageSupported === true, efforts: Array.isArray(o.reasoningEfforts) ? o.reasoningEfforts : [],
  }));
  const rowList = rows || (savedRows.length ? savedRows : [blankChatRow()]);

  const setCredential = async (ref, secret) => {
    const response = await remote?.credentials?.set(ref, secret);
    if (response === undefined) throw new Error(t('settings.credential.writeUnavailable'));
    return response.ok ? undefined : response.error?.message || t('settings.credential.writeFailed');
  };
  const field = (section, key, label) => h('label', { key: section + key, style: ui.label }, label,
    h('input', { type: 'text', 'aria-label': label,
      value: section === 'connection' && key === 'baseURL' ? resolveBaseURL(value) : (value[section]?.[key] ?? ''),
      disabled: busy,
      onChange: event => setDraft({ ...value, [section]: { ...value[section], [key]: event.target.value } }),
      style: ui.control }));
  const setMedia = (key, patch) => setDraft({ ...value, media: { ...media, ...patch } });

  const mediaOptions = (prefixes, key) => {
    const saved = (value.modelOverrides || []).map(row => row.id).filter(id => prefixes.some(prefix => id === prefix || id.startsWith(prefix)));
    const listed = discovered ? ids.filter(id => prefixes.some(prefix => id === prefix || id.startsWith(prefix))) : [];
    const current = typeof media[key] === 'string' ? media[key] : '';
    return [...new Set([...(current ? [current] : []), ...saved, ...listed])];
  };
  // 能不能用只看有没有配上模型：选了 ID 即可用，选「不使用」即清空。
  const mediaPicker = (key, label, prefixes) => {
    const options = mediaOptions(prefixes, key);
    const current = options.includes(media[key]) ? media[key] : '';
    return h('label', { key: 'media' + key, style: ui.label }, label,
      h('select', { value: current, disabled: busy, 'aria-label': label,
        onChange: event => setMedia(key, { [key]: event.target.value }),
        style: ui.control },
        h('option', { value: '' }, options.length || discovered ? t('settings.media.none') : t('settings.getModelsFirst')),
        ...options.map(id => h('option', { key: id, value: id }, id))));
  };

  const chatIdOptions = exclude => {
    const excluded = ['image', 'video', 'speech'];
    const saved = (value.modelOverrides || []).map(row => row.id).filter(id => id && !excluded.includes(categoryOf[id]));
    const listed = discovered ? ids.filter(id => !excluded.includes(categoryOf[id])) : [];
    const list = [...new Set([...saved, ...listed])];
    const taken = new Set(rowList.filter(r => r.id !== exclude).map(r => r.id).filter(Boolean));
    return list.filter(id => !taken.has(id) || id === exclude);
  };

  async function discover(source) {
    const current = source === undefined ? value : source;
    const baseURL = resolveBaseURL(current);
    setDiscovering(true); setMessage(''); setDiscoverNotice(null);
    try {
      const api = remote?.llm;
      if (!api?.discoverModels) { setDiscoverNotice({ ok: false, text: t('settings.discovery.unavailable') }); return; }
      const request = { baseURL, api: current?.connection?.api === 'openai-completions' ? 'openai-completions' : 'openai-responses' };
      if (keyDraft.trim()) request.apiKey = keyDraft.trim();
      const found = await api.discoverModels(SETTINGS_NS, request);
      // 远程调用返回 { ok, value }；测试和宿主直连则直接给数组。
      const listed = Array.isArray(found) ? found : (found?.ok ? found.value : undefined);
      if (!Array.isArray(listed)) {
        const raw = found?.error?.message;
        setDiscoverNotice({ ok: false, text: discoveryErrorText(t, raw) || t('settings.discovery.invalidResponse') });
        return;
      }
      const models = listed.map(m => ({
        id: m.id, name: m.name, category: m.category || (String(m.id).toLowerCase().includes('image') ? 'image' : String(m.id).toLowerCase().includes('video') ? 'video' : String(m.id).toLowerCase().includes('tts') ? 'speech' : 'chat'),
        contextWindow: m.contextWindow, maxTokens: m.maxTokens,
        input: Array.isArray(m.inputModalities) ? m.inputModalities : ['text'],
      }));
      const byCategory = new Map();
      const names = new Map();
      const specs = new Map();
      for (const m of models) {
        byCategory.set(m.id, m.category || '');
        names.set(m.id, m.name || m.id);
        specs.set(m.id, {
          contextWindow: m.contextWindow,
          maxTokens: m.maxTokens,
          image: defaultImageSupported(m.id) || (Array.isArray(m.input) && m.input.includes('image')),
          efforts: defaultReasoningEfforts(m.id),
        });
      }
      setDiscovered(models.map(m => m.id));
      setCategoryOf(Object.fromEntries(byCategory));
      setNameOf(Object.fromEntries(names));
      setSpecOf(Object.fromEntries(specs));
      const nextRows = (current?.modelOverrides || []).map(o => ({
        id: o.id, displayName: o.displayName || names.get(o.id) || o.id,
        contextWindow: formatSize(o.contextWindow), maxTokens: formatSize(o.maxTokens),
        image: o.imageSupported !== false && (o.imageSupported === true || defaultImageSupported(o.id)), efforts: Array.isArray(o.reasoningEfforts) && o.reasoningEfforts.length ? o.reasoningEfforts : defaultReasoningEfforts(o.id),
      }));
      setRows(nextRows.length ? nextRows : [blankChatRow()]);
      setDiscoverNotice({ ok: models.length > 0, text: t('settings.discovery.found', { count: models.length }) });
      if (models.length) setChatOpen(true);
    } catch (error) {
      setDiscoverNotice({ ok: false, text: t('settings.discovery.failed', { message: discoveryErrorText(t, error?.message) || t('error.unknown') }) });
    } finally { setDiscovering(false); }
  }

  const updateRow = (index, patch) => setRows(rowList.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  function addRow() {
    const used = new Set(rowList.map(r => r.id));
    const candidate = chatIdOptions().find(id => !used.has(id)) || '';
    const spec = specOf[candidate] || {};
    setRows([...rowList, {
      id: candidate, displayName: nameOf[candidate] || candidate,
      contextWindow: spec.contextWindow ? formatSize(spec.contextWindow) : '',
      maxTokens: spec.maxTokens ? formatSize(spec.maxTokens) : '',
      image: spec.image !== false && (spec.image === true || defaultImageSupported(candidate)), efforts: Array.isArray(spec.efforts) ? spec.efforts : defaultReasoningEfforts(candidate),
    }]);
  }
  const removeRow = index => setRows(rowList.filter((_, i) => i !== index));
  function pickRowModel(index, id) {
    const spec = specOf[id] || {};
    updateRow(index, {
      id, displayName: nameOf[id] || id,
      contextWindow: spec.contextWindow ? formatSize(spec.contextWindow) : '',
      maxTokens: spec.maxTokens ? formatSize(spec.maxTokens) : '',
      image: spec.image !== false && (spec.image === true || defaultImageSupported(id)),
      efforts: Array.isArray(spec.efforts) ? spec.efforts : defaultReasoningEfforts(id),
    });
  }

  // 进入页面后只自动获取一次。先等已保存地址，再确认凭据库里已有密钥。
  // 详情页首屏没有表单，空 baseURL 会被宿主拒绝成 “provider route or a baseURL”。
  useEffect(() => {
    if (autoRan.current || !remote?.credentials?.describe) return undefined;
    let live = true;
    (async () => {
      const source = await settingsGate.current.ready;
      if (!live || autoRan.current) return;
      let found;
      try { found = await remote.credentials.describe([KEY_REF]); }
      catch { return; }
      if (!live || autoRan.current) return;
      const payload = found?.ok ? found.value : found;
      const info = payload?.[KEY_REF] || payload;
      if (info?.configured !== true) return;
      autoRan.current = true;
      return discover(source || {});
    })().catch(() => {});
    return () => { live = false; };
  }, []);

  const keyFailure = keyFailureOf(keyDraft, t);
  if (view === 'summary') return h('span', null, t('settings.summary'));
  function configuredRows() { return rowList.filter(row => row.id); }
  function overrideOps() {
    const ops = [];
    for (const row of configuredRows()) {
      const contextWindow = parseSize(row.contextWindow);
      const maxTokens = parseSize(row.maxTokens);
      if (contextWindow === undefined) { setMessage(t('settings.validation.contextWindow', { id: row.id })); return undefined; }
      if (maxTokens === undefined) { setMessage(t('settings.validation.maxTokens', { id: row.id })); return undefined; }
      const previous = (value.modelOverrides || []).find(x => x.id === row.id) || {};
      const next = { ...previous, id: row.id, displayName: row.displayName || row.id, imageSupported: !!row.image, contextWindow, maxTokens, reasoningEfforts: row.efforts };
      if (previous.displayName !== next.displayName || (previous.imageSupported === true) !== next.imageSupported
        || previous.contextWindow !== contextWindow || previous.maxTokens !== maxTokens
        || JSON.stringify(previous.reasoningEfforts || []) !== JSON.stringify(row.efforts)) ops.push(next);
    }
    return ops;
  }

  async function commit(ops, note) {
    const writer = form?.mutate || remote?.settings?.mutate;
    const expected = form?.state?.revision ?? revision;
    if (typeof writer !== 'function') { setMessage(t('settings.writeUnavailable')); return false; }
    setBusy(true); setMessage('');
    try {
      const landed = form ? await form.mutate(ops, expected) : await remote.settings.mutate(SETTINGS_NS, ops, expected);
      if (form ? landed === false : landed?.ok === false) { setMessage(t('settings.save.rejected')); return false; }
      if (!form) {
        // 详情页的远程调用返回 { ok, value: { value: 配置节, revision, … } } 这一层 namespace view。
        // 把 view 当配置节会让媒体模型回退成「不使用」，并让下一次保存继续用旧 revision 撞冲突。
        const view = landed?.value;
        if (view?.value) { setLoaded(view.value); setRevision(view.revision ?? revision); }
      }
      setDraft(null);
      setMessage(note);
      return true;
    } catch { setMessage(t('settings.save.failed')); return false; }
    finally { setBusy(false); }
  }
  async function saveConnection() {
    if (keyFailure) { setMessage(keyFailure); return; }
    const connection = { ...(value.connection || {}), baseURL: resolveBaseURL(value), apiKeyEnv: KEY_REF, apiKey: '' };
    const saved = await commit([{ op: 'set', path: ['connection'], value: connection }], t(keyDraft.trim() ? 'settings.save.addressPending' : 'settings.save.addressDone'));
    if (!saved) return;
    if (keyDraft.trim()) {
      const failure = await setCredential(KEY_REF, keyDraft.trim());
      if (failure) { setMessage(t('settings.save.keyFailed', { message: failure })); return; }
      setKeyDraft('');
      setMessage(t('settings.save.credentialDone', { ref: KEY_REF }));
    }
  }
  async function saveChat() {
    if (!discovered && !configuredRows().length) { setMessage(t('settings.save.needModels')); return; }
    const pending = overrideOps();
    if (pending === undefined) return;
    const savingRows = configuredRows();
    // 表格就是对话模型名单。删掉的行不能再并回，否则选择器和再次进入详情仍是全部模型。
    const nextRows = savingRows.map(row => {
      const previous = (value.modelOverrides || []).find(x => x.id === row.id) || {};
      return { ...previous, id: row.id, displayName: row.displayName || row.id, imageSupported: !!row.image,
        contextWindow: parseSize(row.contextWindow), maxTokens: parseSize(row.maxTokens), reasoningEfforts: row.efforts };
    });
    await commit([
      { op: 'set', path: ['modelOverrides'], value: nextRows },
      { op: 'unset', path: ['media', 'defaultModel'] },
    ], t('settings.save.chatCount', { count: savingRows.length }));
  }
  async function saveMedia() {
    const nextMedia = { ...media };
    delete nextMedia.defaultModel;
    for (const [key, , prefixes] of MEDIA_FIELDS) {
      const options = mediaOptions(prefixes, key);
      const chosen = typeof media[key] === 'string' ? media[key] : '';
      nextMedia[key] = chosen && options.includes(chosen) ? chosen : '';
    }
    await commit([{ op: 'set', path: ['media'], value: nextMedia }], t('settings.save.mediaDone'));
  }

  const cellInput = { ...ui.control, height: 32, padding: '0 8px' };
  const cell = { padding: '8px 6px', borderBottom: '0.5px solid var(--dsw-alias-border-l4)', verticalAlign: 'middle' };
  const chatOptions = id => chatIdOptions(id);

  return h('section', { style: ui.page },
    h('section', { style: ui.card },
      h('h3', { style: ui.title }, t('settings.connection')),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 12 } },
        field('connection', 'baseURL', t('settings.apiAddress')),
        h('label', { style: ui.label }, t('settings.apiProtocol'),
          h('select', {
            value: value.connection?.api === 'openai-completions' ? 'openai-completions' : 'openai-responses',
            disabled: busy, 'aria-label': t('settings.apiProtocol'),
            onChange: event => setDraft({ ...value, connection: { ...value.connection, api: event.target.value } }),
            style: ui.control,
          },
          h('option', { value: 'openai-completions' }, 'Chat Completions'),
          h('option', { value: 'openai-responses' }, 'Responses')))),
      h('label', { style: ui.label }, t('settings.apiKey'),
        h('input', { type: 'password', autoComplete: 'new-password', value: keyDraft, disabled: busy, placeholder: t('settings.apiKeyPlaceholder'),
          'aria-label': t('settings.apiKey'), onChange: event => setKeyDraft(event.target.value), style: ui.control })),
      keyFailure ? h('p', { role: 'alert', style: ui.alert }, keyFailure) : null,
      h('p', { style: ui.hint }, t('settings.credentialHint', { ref: KEY_REF })),
      h('div', { style: ui.row },
        h('button', { type: 'button', disabled: busy || discovering, onClick: () => discover(), style: ui.button }, discovering ? t('settings.action.gettingModels') : t('settings.action.getModels')),
        discoverNotice ? h('span', { role: 'status', style: { color: discoverNotice.ok ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-error-primary)', fontSize: 13 } }, discoverNotice.text) : null,
        h('button', { type: 'button', disabled: busy || form?.state?.writable === false, onClick: saveConnection, style: { ...ui.primary, marginLeft: 'auto' } }, busy ? t('settings.action.saving') : t('settings.action.saveConnection')))),
    h('section', { style: ui.card },
      h('button', { type: 'button', 'aria-expanded': chatOpen ? 'true' : 'false', onClick: () => setChatOpen(open => !open), style: { ...ui.row, width: '100%', background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 } },
        h('h3', { style: ui.title }, (chatOpen ? '▾ ' : '▸ ') + t('settings.chatModels'))),
      chatOpen ? h('p', { style: ui.hint }, t('settings.chatHint')) : null,
      chatOpen ? h('p', { style: ui.hint }, discovered ? t('settings.discoveredCount', { count: ids.length }) : t('settings.chatEmptyHint')) : null,
      chatOpen ? h('div', { style: { overflow: 'visible' } },
        h('table', { style: ui.table },
          h('thead', null, h('tr', null, ...['', 'settings.table.modelId', 'settings.table.displayName', 'settings.table.images', 'settings.table.context', 'settings.table.maxOutput', 'settings.table.effort'].map(label => h('th', { key: label || 'actions', style: ui.head }, label ? t(label) : '')))),
          h('tbody', null, ...rowList.map((row, index) => h('tr', { key: index },
            h('td', { style: cell }, h('button', {
              type: 'button', disabled: busy,
              'aria-label': t('settings.table.deleteRowAria', { index: index + 1 }), onClick: () => removeRow(index), style: ui.danger,
            }, t('settings.action.delete'))),
            h('td', { style: cell }, h('select', { value: row.id, disabled: busy, 'aria-label': t('settings.table.modelIdAria', { index }), onChange: event => pickRowModel(index, event.target.value), style: cellInput },
              h('option', { value: '' }, chatOptions(row.id).length ? t('settings.table.selectModel') : t('settings.getModelsFirst')),
              ...chatOptions(row.id).map(id => h('option', { key: id, value: id }, id)))),
            h('td', { style: cell }, h('input', { type: 'text', value: row.displayName ?? '', disabled: busy, 'aria-label': t('settings.table.displayNameAria', { index }), onChange: event => updateRow(index, { displayName: event.target.value }), style: { ...cellInput, width: 120 } })),
            h('td', { style: cell }, h('input', { type: 'checkbox', checked: !!row.image, disabled: busy, 'aria-label': t('settings.table.imagesAria', { index }), onChange: event => updateRow(index, { image: event.target.checked }) })),
            h('td', { style: cell }, h('input', { type: 'text', value: row.contextWindow ?? '', disabled: busy, placeholder: '500K', 'aria-label': t('settings.table.contextAria', { index }), onChange: event => updateRow(index, { contextWindow: event.target.value }), style: { ...cellInput, width: 64 } })),
            h('td', { style: cell }, h('input', { type: 'text', value: row.maxTokens ?? '', disabled: busy, placeholder: '32K', 'aria-label': t('settings.table.maxOutputAria', { index }), onChange: event => updateRow(index, { maxTokens: event.target.value }), style: { ...cellInput, width: 64 } })),
            h('td', { style: cell }, h(EffortPicker, { index, efforts: row.efforts, disabled: busy, onChange: efforts => updateRow(index, { efforts }), t }))))),
          rowList.length ? null : h('tfoot', null, h('tr', null, h('td', { colSpan: 7, style: { ...cell, color: 'var(--dsw-alias-label-tertiary)' } }, t('settings.table.noRows')))))) : null,
      chatOpen ? h('div', { style: ui.row },
        h('button', { type: 'button', disabled: busy || !discovered, 'aria-label': t('settings.action.addRow'), onClick: addRow, style: ui.button }, t('settings.action.add')),
        h('button', { type: 'button', disabled: busy || form?.state?.writable === false, onClick: saveChat, style: { ...ui.primary, marginLeft: 'auto' } }, busy ? t('settings.action.saving') : t('settings.action.saveChat'))) : null),
    h('section', { style: ui.card },
      h('button', { type: 'button', 'aria-expanded': mediaOpen ? 'true' : 'false', onClick: () => setMediaOpen(open => !open), style: { ...ui.row, width: '100%', background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 } },
        h('h3', { style: ui.title }, (mediaOpen ? '▾ ' : '▸ ') + t('settings.mediaModels'))),
      mediaOpen ? h(React.Fragment, null, ...MEDIA_FIELDS.map(entry => mediaPicker(entry[0], t(entry[1]), entry[2])),
        h('div', { style: { ...ui.row, justifyContent: 'flex-end' } },
          h('button', { type: 'button', disabled: busy || form?.state?.writable === false, onClick: saveMedia, style: ui.primary }, busy ? t('settings.action.saving') : t('settings.action.saveMedia')))) : null),
    form?.state?.writable === false ? h('p', { role: 'alert', style: ui.alert }, t('settings.writableBlocked')) : null,
    message ? h('p', { role: 'status', style: ui.status }, message) : null);
}
export function apply(ctx) {
  // 字典命名空间：官方 locale 服务可用时注册 zh/en，语言切换后槽位组件自动重渲染。
  if (typeof ctx.locale?.register === 'function') {
    ctx.effect(() => ctx.locale.register('grokByapi', { zh, en }), 'grok-byapi: dictionaries');
  }
  // 非 React 场景（documentPreview 标题）用绑定的翻译函数；旧宿主没有 locale 时回退中文。
  const t = typeof ctx.locale?.bind === 'function' ? ctx.locale.bind('grokByapi') : zhT;
  // 槽位声明 locale: 'grokByapi' 才会注入 t；旧宿主不支持时省略该字段。
  const locale = typeof ctx.locale?.register === 'function' ? 'grokByapi' : undefined;
  const slotOptions = options => (locale ? { ...options, locale } : options);
  const page = props => GrokSettings({ ...props, remote: ctx.remote });
  // 配置只放插件详情页。组件行不再挂第二份。
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register(slotOptions({ name: 'plugins.bundle.config', key: PKG_NAME }), page));
  for (const key of tools) ctx.slots.inject('tool.call.toolview', () => ctx.slots.register(slotOptions({ name: 'tool.call.toolview', key }), GrokToolCard));
  ctx.effect(() => ctx.documentPreviews.register({ id: MEDIA_ID, extensions: ['mp4', 'mp3', 'wav'], binaryExtensions: ['mp4', 'mp3', 'wav'], priority: 'extension', title: () => t('media.title'), loading: 'bytes-complete', wrap: false }));
  ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register(slotOptions({ name: 'sidebar.right.tab.document', key: MEDIA_ID }), MediaPreview));
}
