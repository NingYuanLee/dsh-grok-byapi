import { mkdir, readdir, readFile, writeFile, rename, open } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { withFileLock } from './lock.js';

const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const now = () => new Date().toISOString();
const mimeTypes = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav' };
const INLINE_LIMIT = 8 * 1024 * 1024;
class HttpFailure extends Error { constructor(status) { super('上游请求失败：HTTP ' + status); this.status = status; } }
function sniff(bytes) {
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.subarray(0,3).toString() === 'GIF') return 'image/gif';
  if (bytes.subarray(0,4).toString() === 'RIFF') return bytes.subarray(8,12).toString() === 'WEBP' ? 'image/webp' : bytes.subarray(8,12).toString() === 'WAVE' ? 'audio/wav' : undefined;
  if (bytes.subarray(4,8).toString() === 'ftyp') return 'video/mp4';
  if (bytes.subarray(0,3).toString() === 'ID3' || bytes[0] === 255 && (bytes[1] & 224) === 224) return 'audio/mpeg';
}
async function bounded(response, limit, signal) {
  if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new Error('响应超过大小限制'); }
  const parts = []; let count = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('响应没有内容');
  try { for (;;) { signal?.throwIfAborted(); const { done, value } = await reader.read(); if (done) break; count += value.length; if (count > limit) throw new Error('响应超过大小限制'); parts.push(value); } }
  finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  return Buffer.concat(parts, count);
}
function sleep(ms, signal) {
  return new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolvePromise(); }, ms);
    const onAbort = () => { clearTimeout(timer); reject(signal.reason instanceof Error ? signal.reason : new Error('已取消')); };
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export class MediaManager {
  constructor({ baseURL, resolveKey, dataDir, fetchImpl = fetch, timeoutMs = 60000, maxDownloadBytes = 268435456, watchDelayMs = 2000 }) {
    this.baseURL = baseURL.replace(/\/$/, ''); this.resolveKey = resolveKey; this.root = resolve(dataDir, 'tasks');
    this.fetch = fetchImpl; this.timeoutMs = timeoutMs; this.maxBytes = maxDownloadBytes; this.watchDelayMs = watchDelayMs;
    this.tasks = new Map(); this.held = new Set(); this.watchers = new Set();
  }
  async init() {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    await withFileLock(join(this.root, '.init.lock'), async () => {
      for (const entry of await readdir(this.root, { withFileTypes: true })) {
        if (!entry.isDirectory() || !ID.test(entry.name)) continue;
        try {
          const raw = await readFile(join(this.root, entry.name, 'task.json'), 'utf8');
          if (raw.length > 48 * 1024 * 1024) continue;
          const task = JSON.parse(raw);
          if (task.id !== entry.name || typeof task.owner !== 'string' || !['image','video','speech'].includes(task.kind)) continue;
          if (!Array.isArray(task.files) || !Array.isArray(task.sources)) continue;
          // Records never authorize arbitrary saved paths after restart.
          task.files = task.files.filter(f => typeof f.name === 'string' && /^result-\d+\.(png|jpg|gif|webp|mp4|mp3|wav)$/.test(f.name));
          if (task.status === 'submitting') { task.status = 'submission-unknown'; task.error = '上次提交中断，结果未知，请勿自动重新生成'; }
          if (task.status === 'downloading') { task.status = 'download-failed'; task.error = '保存中断，可重试下载已有结果'; }
          this.tasks.set(task.id, task); await this.persist(task);
        } catch { /* Corrupt records are not adopted into another session. */ }
      }
    });
    return this;
  }
  directory(task) { return join(this.root, task.id); }
  async withTaskLock(id, operation) {
    if (this.held.has(id)) return operation();
    return withFileLock(join(this.root, id + '.lock'), async () => {
      this.held.add(id);
      try { return await operation(); }
      finally { this.held.delete(id); }
    });
  }
  async persist(task) {
    return this.withTaskLock(task.id, async () => {
      task.updatedAt = now(); await mkdir(this.directory(task), { recursive: true, mode: 0o700 });
      const file = join(this.directory(task), 'task.json'); const temp = file + '.' + randomUUID() + '.tmp';
      await writeFile(temp, JSON.stringify(task), { mode: 0o600 }); await rename(temp, file);
    });
  }
  public(task) {
    const { id, owner, kind, model, status, remoteId, progress, error, createdAt, updatedAt } = task;
    return { id, owner, kind, model, status, ...(remoteId ? { remoteId } : {}), ...(Number.isFinite(progress) ? { progress } : {}), ...(error ? { error } : {}), createdAt, updatedAt,
      files: task.files.map(f => ({ path: join(this.directory(task), f.name), mime: f.mime, size: f.size })) };
  }
  lookup(id, owner) {
    const task = this.tasks.get(id);
    if (!ID.test(id) || !task || task.owner !== owner) throw new Error('任务不存在或不属于当前会话');
    return task;
  }
  get(id, owner) { return this.public(this.lookup(id, owner)); }
  list(owner) { return [...this.tasks.values()].filter(t => t.owner === owner).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(t => this.public(t)); }
  async locked(id, operation) {
    return this.withTaskLock(id, operation);
  }
  signal(signal) { return AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(this.timeoutMs)]); }
  async api(path, payload, signal) {
    signal?.throwIfAborted(); const key = await this.resolveKey();
    return this.fetch(this.baseURL + path, { method: payload === undefined ? 'GET' : 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), redirect: 'error', signal });
  }
  async json(response, signal) {
    if (!response.ok) { await response.body?.cancel(); throw new HttpFailure(response.status); }
    return JSON.parse((await bounded(response, 32 * 1024 * 1024, signal)).toString('utf8'));
  }
  validateURL(value) {
    const url = new URL(value); const base = new URL(this.baseURL);
    if (url.username || url.password || url.hash) throw new Error('无效媒体链接');
    const local = ['127.0.0.1','localhost','[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local && url.origin === base.origin)) throw new Error('媒体链接必须使用 HTTPS');
    if (local && url.origin !== base.origin) throw new Error('拒绝跨服务本机媒体链接');
    return url;
  }
  async download(url, signal) {
    let current = this.validateURL(url);
    for (let n = 0; n <= 5; n++) {
      // Intentionally no API Authorization or cookies, even on same-origin URLs.
      const response = await this.fetch(current, { redirect: 'manual', signal, credentials: 'omit' });
      if ([301,302,303,307,308].includes(response.status)) {
        const location = response.headers.get('location'); await response.body?.cancel();
        if (!location || n === 5) throw new Error('媒体重定向失败');
        current = this.validateURL(new URL(location, current).href); continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error('媒体下载失败'); }
      return { bytes: await bounded(response, this.maxBytes, signal), declared: response.headers.get('content-type')?.split(';')[0] };
    }
  }
  async inlineFile(task, mimePrefix) {
    if (task.status !== 'saved' || !task.files.length) throw new Error('只能引用已保存的媒体任务');
    const file = task.files[0];
    if (!file.mime?.startsWith(mimePrefix)) throw new Error('引用的任务不是所需的媒体类型');
    const bytes = await readFile(join(this.directory(task), file.name));
    if (!bytes.length || bytes.length > INLINE_LIMIT) throw new Error('本地文件超过 8MB，请改用 HTTPS 地址');
    return 'data:' + file.mime + ';base64,' + bytes.toString('base64');
  }
  async imageReferences(args, owner) {
    const urls = [];
    const push = value => {
      if (typeof value !== 'string' || !value.trim()) return;
      const url = value.trim();
      if (url.startsWith('data:image/')) {
        if (url.length > INLINE_LIMIT * 2) throw new Error('参考图过大');
        urls.push(url); return;
      }
      this.validateURL(url); urls.push(url);
    };
    if (typeof args.image_url === 'string') push(args.image_url);
    if (Array.isArray(args.image_urls)) { if (args.image_urls.length > 5) throw new Error('图片编辑最多 5 张参考图'); for (const item of args.image_urls) push(item); }
    if (typeof args.source_task_id === 'string' && args.source_task_id) urls.push(await this.inlineFile(this.lookup(args.source_task_id, owner), 'image/'));
    if (urls.length < 1 || urls.length > 5) throw new Error('图片编辑需要 1 到 5 张参考图（image_url、image_urls 或已保存图片任务）');
    return urls;
  }
  async videoReference(args, owner) {
    if (typeof args.video_url === 'string' && args.video_url.trim()) {
      const url = args.video_url.trim();
      if (url.startsWith('data:video/')) {
        if (url.length > INLINE_LIMIT * 2) throw new Error('视频数据过大');
        return { url };
      }
      this.validateURL(url); return { url };
    }
    if (typeof args.source_task_id === 'string' && args.source_task_id) return { url: await this.inlineFile(this.lookup(args.source_task_id, owner), 'video/') };
    throw new Error('需要 video_url，或已保存视频任务的 source_task_id');
  }
  async saveResults(task, signal) {
    task.status = 'downloading'; delete task.error; await this.persist(task);
    try {
      if (!task.sources.length) throw new Error('没有可保存的结果');
      for (let i = task.files.length; i < task.sources.length; i++) {
        signal?.throwIfAborted(); const source = task.sources[i];
        let bytes, declared;
        if (source.b64) { if (!/^[A-Za-z0-9+/]*={0,2}$/.test(source.b64)) throw new Error('无效图片编码'); bytes = Buffer.from(source.b64, 'base64'); }
        else if (source.raw) { bytes = Buffer.from(source.raw, 'base64'); }
        else ({ bytes, declared } = await this.download(source.url, signal));
        if (!bytes.length || bytes.length > this.maxBytes) throw new Error('结果大小无效');
        const mime = sniff(bytes);
        const prefix = task.kind === 'speech' ? 'audio/' : task.kind + '/';
        if (!mime?.startsWith(prefix) || !mimeTypes[mime] || declared?.includes('text/html')) throw new Error('结果不是期望的媒体文件');
        const name = 'result-' + (i+1) + mimeTypes[mime]; const path = join(this.directory(task), name); const partial = path + '.part';
        const handle = await open(partial, 'w', 0o600);
        try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
        await rename(partial, path); task.files.push({ name, mime, size: bytes.length });
        await this.persist(task);
      }
      task.status = 'saved'; delete task.error;
      // Inline media no longer needs a duplicate payload once safely saved.
      task.sources = task.sources.map(s => s.url ? { url: s.url } : {});
    } catch {
      task.status = 'download-failed'; task.error = '结果保存失败（网络、格式或文件系统限制），可重试下载；不会重新生成';
    }
    await this.persist(task); return this.public(task);
  }
  async create(kind, args, owner, signal) {
    if (typeof owner !== 'string' || !owner || typeof args.model !== 'string' || !args.model) throw new Error('缺少任务归属或模型');
    const text = kind === 'speech' ? args.input : args.prompt;
    if (typeof text !== 'string' || !text.trim() || text.length > 60000) throw new Error('生成内容不能为空或超过 60000 字符');
    if (kind === 'image' && !args.images && (!Number.isInteger(args.n ?? 1) || (args.n ?? 1) < 1 || (args.n ?? 1) > 4)) throw new Error('图片数量必须为 1 到 4');
    if (kind === 'video' && args.operation !== 'edit' && (!Number.isInteger(args.duration ?? 2) || (args.duration ?? 2) < 1 || (args.duration ?? 2) > 15)) throw new Error('视频时长必须为 1 到 15 秒');
    signal?.throwIfAborted();
    // Resolve missing credentials before creating a potentially ambiguous task.
    await this.resolveKey();
    const task = { id: randomUUID(), owner, kind, model: args.model, status: 'submitting', files: [], sources: [], createdAt: now(), updatedAt: now() };
    this.tasks.set(task.id, task); await this.persist(task);
    return this.locked(task.id, async () => {
      const active = this.signal(signal); let accepted = false;
      try {
        const path = kind === 'image' ? (args.images ? '/images/edits' : '/images/generations') : kind === 'video' ? (args.operation === 'edit' ? '/videos/edits' : args.operation === 'extend' ? '/videos/extensions' : '/videos/generations') : '/audio/speech';
        const payload = kind === 'speech' ? { model: args.model, input: text, voice: args.voice || 'eve', response_format: 'mp3' }
          : kind === 'image' ? (args.images ? { model: args.model, prompt: text, images: args.images.map(url => ({ url })) } : { model: args.model, prompt: text, n: args.n ?? 1 })
          : args.video ? { model: args.model, prompt: text, video: args.video, ...(args.operation === 'extend' ? { duration: args.duration ?? 2 } : {}) }
          : { model: args.model, prompt: text, duration: args.duration ?? 2, ...(args.image ? { image: args.image } : {}) };
        const response = await this.api(path, payload, active);
        if (!response.ok) { await response.body?.cancel(); throw new HttpFailure(response.status); }
        accepted = true;
        if (kind === 'speech') {
          task.sources = [{ raw: (await bounded(response, Math.min(this.maxBytes, 32 * 1024 * 1024), active)).toString('base64') }];
        } else {
          const body = await this.json(response, active);
          if (kind === 'video') {
            if (typeof body.request_id !== 'string' || !body.request_id || body.request_id.length > 300) throw new Error('视频响应缺少任务 ID');
            task.remoteId = body.request_id; task.status = 'generating'; await this.persist(task);
            const published = this.public(task);
            queueMicrotask(() => this.ensureWatch(task.id));
            return published;
          }
          if (!Array.isArray(body.data) || body.data.length < 1 || body.data.length > 4) throw new Error('图片响应无结果');
          task.sources = body.data.map(x => typeof x.url === 'string' ? { url: x.url } : typeof x.b64_json === 'string' ? { b64: x.b64_json } : {});
        }
        return await this.saveResults(task, active);
      } catch (error) {
        task.status = error instanceof HttpFailure ? 'failed' : 'submission-unknown';
        task.error = error instanceof HttpFailure ? error.message : accepted ? '上游已接受请求，但未取得完整结果，请勿自动重复生成' : '提交结果未知，请检查上游记录，不要自动重新生成';
        await this.persist(task); return this.public(task);
      }
    });
  }
  image(args, owner, signal) { return this.create('image', args, owner, signal); }
  async editImage(args, owner, signal) {
    const images = await this.imageReferences(args, owner);
    return this.create('image', { ...args, images }, owner, signal);
  }
  speech(args, owner, signal) { return this.create('speech', args, owner, signal); }
  async video(args, owner, signal) {
    const still = (typeof args.image_url === 'string' && args.image_url.trim()) || (typeof args.source_task_id === 'string' && args.source_task_id);
    if (!still) return this.create('video', args, owner, signal);
    const images = await this.imageReferences({ image_url: args.image_url, source_task_id: args.source_task_id }, owner);
    if (images.length !== 1) throw new Error('图生视频只能带一张静帧');
    return this.create('video', { ...args, image: { url: images[0] } }, owner, signal);
  }
  async editVideo(args, owner, signal) {
    const video = await this.videoReference(args, owner);
    return this.create('video', { ...args, video, operation: 'edit' }, owner, signal);
  }
  async extendVideo(args, owner, signal) {
    const video = await this.videoReference(args, owner);
    return this.create('video', { ...args, video, operation: 'extend' }, owner, signal);
  }
  async poll(id, owner, signal) {
    const task = this.lookup(id, owner);
    if (task.kind !== 'video' || !task.remoteId || ['saved','failed'].includes(task.status)) return this.public(task);
    return this.locked(id, async () => {
      const active = this.signal(signal);
      try {
        const body = await this.json(await this.api('/videos/' + encodeURIComponent(task.remoteId), undefined, active), active);
        if (Number.isFinite(body.progress)) task.progress = Math.max(0, Math.min(100, body.progress));
        if (body.status === 'done' && typeof body.video?.url === 'string') { task.sources = [{ url: body.video.url }]; return await this.saveResults(task, active); }
        if (['failed', 'error', 'expired'].includes(body.status)) { task.status = 'failed'; task.error = '上游视频任务失败或已过期'; }
        else { task.status = 'generating'; delete task.error; }
      } catch { task.error = '暂时无法查询，保留原任务 ID，稍后可以继续查询'; }
      await this.persist(task); return this.public(task);
    });
  }
  async retryDownload(id, owner, signal) {
    const task = this.lookup(id, owner);
    if (task.status === 'saved') return this.public(task);
    if (task.kind === 'video' && task.remoteId && !task.sources.length) return this.poll(id, owner, signal);
    if (!task.sources.length) throw new Error('该任务没有可恢复的下载结果，不能以重试下载方式重新生成');
    return this.locked(id, () => this.saveResults(task, this.signal(signal)));
  }
  // Background polling is explicit-status compatible: it never resubmits a paid
  // request. The tool card stays a snapshot until something calls poll again.
  startWatchers(signal, onUpdate) {
    this.watchSignal = signal;
    this.onUpdate = onUpdate;
    for (const task of this.tasks.values()) this.ensureWatch(task.id);
  }
  ensureWatch(id) {
    const task = this.tasks.get(id);
    if (!this.onUpdate || !task || this.watchers.has(id)) return;
    if (task.kind !== 'video' || !task.remoteId || task.status !== 'generating') return;
    this.watchers.add(id);
    void this.follow(id, task.owner);
  }
  async follow(id, owner) {
    let delayMs = this.watchDelayMs;
    const started = Date.now();
    try {
      while (!this.watchSignal?.aborted && Date.now() - started < 15 * 60 * 1000) {
        await sleep(delayMs, this.watchSignal);
        const task = this.tasks.get(id);
        if (!task || task.owner !== owner || task.status !== 'generating') break;
        const next = await this.poll(id, owner, this.watchSignal);
        try { this.onUpdate(next); } catch { /* A broken listener must not resubmit. */ }
        if (next.status !== 'generating') break;
        delayMs = Math.min(Math.round(delayMs * 1.5), 15000);
      }
    } catch { /* Plugin dispose aborts the wait. */ }
    finally { this.watchers.delete(id); }
  }
}
