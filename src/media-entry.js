import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'Grok Imagine';
export const packageName = 'dsh-grok-byapi';
export const inject = ['grok-byapi', 'tools'];

const ownerOf = exec => {
  const owner = exec.agent?.session?.id;
  if (typeof owner !== 'string' || !owner) throw new Error('媒体工具需要有归属的 dsh 会话');
  return owner;
};
const jsonOutput = { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }] };

export async function apply(ctx) {
  const runtime = ctx['grok-byapi']?.runtime || ctx.get('grok-byapi')?.runtime;
  if (!runtime) throw new Error('Grok Imagine 需要先启用 Grok ByAPI');
  const signalOf = exec => AbortSignal.any([exec.signal, runtime.abort?.signal].filter(Boolean));
  const disposers = [];
  const factories = [];
  // 描述里的"当前可选模型"来自最新清单，而 defineTool 会把它拍平成字符串，
  // 所以工具定义每次注册时重建；清单更新后整体换一遍。
  const tool = (toolName, description, parameters, run) => {
    factories.push(() => {
      const definition = { name: toolName, parameters, output: jsonOutput, async execute(args, exec) { return run(args, exec); } };
      Object.defineProperty(definition, 'description', { enumerable: true, get: () => (typeof description === 'function' ? description() : description) });
      return ctx.tools.register(defineTool(definition));
    });
  };
  const registerTools = () => {
    for (const dispose of disposers.splice(0)) { try { dispose(); } catch { /* 已注销 */ } }
    for (const build of factories) disposers.push(build());
  };
  const idParam = { task_id: { type: 'string', required: true, description: '任务 ID：由生成、编辑或延长工具返回的 id 字段（UUID）' } };

  tool('grok_generate_image', () => '用 Grok Imagine 生成图片并保存到本地。任何聊天模型都可以调用，不要求当前对话模型是 Grok。用户说“画一张/生成图片/出图/做个海报/给我一张…”这类请求时用这个工具。'
    + '参数：prompt（必填）= 画面描述，最长 60000 字符；model（可选）= 图片模型 ID，当前可选：' + runtime.describeModels('image') + '，省略则用插件设置里的默认图片模型；n（可选）= 一次生成几张，取值 1–4，默认 1。'
    + '一次调用同步完成生成与保存。返回的 files[].path 是本地文件路径。status 不是 saved 时先用 grok_media_status 查原任务，不要重新生成。'
    + '图片可在回复里用绝对路径内联：![说明](<files[].path>)。',
  { prompt: { type: 'string', required: true, description: '画面描述（主体、风格、构图、比例等），最长 60000 字符' },
    model: { type: 'string', description: '图片模型 ID，来自 grok_models 的 image 类；省略用插件默认' },
    n: { type: 'integer', description: '生成张数，1–4，默认 1' } },
  async (args, exec) => (await runtime.manager()).image({ ...args, model: runtime.requireModel(args.model || runtime.mediaConfig().imageModel, 'image') }, ownerOf(exec), signalOf(exec)));

  tool('grok_edit_image', () => '按文字说明编辑已有图片并保存。参考图用 image_url、image_urls（1–5 个 HTTPS 地址）或已保存图片任务的 source_task_id，至少给一种。'
    + 'model 可选，当前图片模型：' + runtime.describeModels('image') + '。一次调用完成编辑与保存。失败且 status 不是 saved 时，先查 grok_media_status，不要重新编辑。',
  { prompt: { type: 'string', required: true, description: '要做的修改，最长 60000 字符' },
    model: { type: 'string', description: '图片模型 ID；省略用插件默认' },
    image_url: { type: 'string', description: '一张参考图的 HTTPS 地址' },
    image_urls: { type: 'array', items: { type: 'string' }, description: '最多 5 张参考图的 HTTPS 地址' },
    source_task_id: { type: 'string', description: '已保存图片任务的 id；本地文件超过 8MB 时请改用 HTTPS 地址' } },
  async (args, exec) => (await runtime.manager()).editImage({ ...args, model: runtime.requireModel(args.model || runtime.mediaConfig().imageModel, 'image') }, ownerOf(exec), signalOf(exec)));

  tool('grok_generate_video', () => '提交 Grok 视频生成任务。任何聊天模型都可以调用。用户说“生成视频/做个视频”时用这个工具。带 image_url 或已保存图片任务的 source_task_id 时，是让这一张静帧动起来的图生视频，只能一张。'
    + '参数：prompt（必填）最长 60000 字符；model（可选）当前可选：' + runtime.describeModels('video') + '；duration（可选）= 时长秒数，取值 1–15，默认 2。'
    + '提交后插件会在后台查询，但结果卡片是快照，不会自动刷新。用 grok_media_status(task_id) 取回，直到 saved 或 failed。status=submission-unknown 时不要重新提交。'
    + '视频不要用 Markdown 图片语法内联，由结果卡片播放器呈现。',
  { prompt: { type: 'string', required: true, description: '视频内容描述（画面、运动、镜头），最长 60000 字符' },
    model: { type: 'string', description: '视频模型 ID，来自 grok_models 的 video 类；省略用插件默认' },
    duration: { type: 'integer', description: '时长秒数，1–15，默认 2' },
    image_url: { type: 'string', description: '可选。一张静帧的 HTTPS 地址，用来做图生视频' },
    source_task_id: { type: 'string', description: '可选。已保存图片任务的 id，用来做图生视频；超过 8MB 请改用 HTTPS 地址' } },
  async (args, exec) => (await runtime.manager()).video({ ...args, model: runtime.requireModel(args.model || runtime.mediaConfig().videoModel, 'video') }, ownerOf(exec), signalOf(exec)));

  tool('grok_edit_video', () => '按文字说明编辑已有视频。视频用 video_url（HTTPS）或已保存视频任务的 source_task_id。model 可选，当前视频模型：' + runtime.describeModels('video')
    + '。接口是异步的：返回 generating 后插件会后台查询，卡片仍是快照。用 grok_media_status(task_id) 取回。status=submission-unknown 时不要重新提交。',
  { prompt: { type: 'string', required: true, description: '要做的修改，最长 60000 字符' },
    model: { type: 'string', description: '视频模型 ID；省略用插件默认' },
    video_url: { type: 'string', description: '待编辑视频的 HTTPS 地址' },
    source_task_id: { type: 'string', description: '已保存视频任务的 id；本地文件超过 8MB 时请改用 HTTPS 地址' } },
  async (args, exec) => (await runtime.manager()).editVideo({ ...args, model: runtime.requireModel(args.model || runtime.mediaConfig().videoModel, 'video') }, ownerOf(exec), signalOf(exec)));

  tool('grok_extend_video', () => '从已有视频最后一帧继续生成。视频用 video_url 或已保存视频任务的 source_task_id。duration 为延长秒数，1–15，默认 2。model 可选，当前视频模型：' + runtime.describeModels('video')
    + '。返回 generating 后插件会后台查询；用 grok_media_status 取回。不要在 submission-unknown 时重新提交。',
  { prompt: { type: 'string', required: true, description: '接下来画面里发生什么，最长 60000 字符' },
    model: { type: 'string', description: '视频模型 ID；省略用插件默认' },
    video_url: { type: 'string', description: '待延长视频的 HTTPS 地址' },
    source_task_id: { type: 'string', description: '已保存视频任务的 id；本地文件超过 8MB 时请改用 HTTPS 地址' },
    duration: { type: 'integer', description: '延长秒数，1–15，默认 2' } },
  async (args, exec) => (await runtime.manager()).extendVideo({ ...args, model: runtime.requireModel(args.model || runtime.mediaConfig().videoModel, 'video') }, ownerOf(exec), signalOf(exec)));

  tool('grok_speak', () => '用 Grok TTS 把文字转成语音并保存为 mp3。任何聊天模型都可以调用。用户说“念一下/读出来/配音”时用这个工具。'
    + '参数：input（必填）最长 60000 字符；model（可选）当前可选：' + runtime.describeModels('speech') + '；voice（可选）= 音色名。'
    + '一次调用同步完成合成与保存，files[].path 是本地 mp3 路径。本工具不做语音转文字。'
    + '音频不要用 Markdown 图片语法内联，由结果卡片播放器呈现。',
  { input: { type: 'string', required: true, description: '要朗读的文本，最长 60000 字符' },
    model: { type: 'string', description: '语音模型 ID，来自 grok_models 的 speech 类；省略用插件默认' },
    voice: { type: 'string', description: '音色名；省略用服务端默认' } },
  async (args, exec) => (await runtime.manager()).speech({ ...args, model: runtime.requireModel(args.model || runtime.mediaConfig().speechModel, 'speech') }, ownerOf(exec), signalOf(exec)));

  tool('grok_media_status', '查询某个媒体任务的状态，并在结果已生成时把它下载保存到本地。视频生成后必须用这个工具取回结果。返回 status：generating、saved、failed、submission-unknown、download-failed。不会发起新的生成、不计费。',
    idParam, async (args, exec) => (await runtime.manager()).poll(args.task_id, ownerOf(exec), signalOf(exec)));
  tool('grok_media_retry_download', '重试下载并保存已生成的结果（status=download-failed）。不会重新生成、不计费。',
    idParam, async (args, exec) => (await runtime.manager()).retryDownload(args.task_id, ownerOf(exec), signalOf(exec)));
  tool('grok_media_list', '列出本轮会话创建过的所有媒体任务。无参数。',
    {}, async (_args, exec) => (await runtime.manager()).list(ownerOf(exec)));

  registerTools();
  // 聊天行可能还没做完首轮发现就挂上了本行：清单一到就重建描述。
  const stopRefreshHook = runtime.onRefreshed?.(registerTools);
  ctx.on('dispose', () => {
    stopRefreshHook?.();
    for (const dispose of disposers.splice(0)) { try { dispose(); } catch { /* 已注销 */ } }
  });
}
