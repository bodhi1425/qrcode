import './style.css';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
function val(sel: string): string {
  const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
  return el ? el.value : '';
}

const typeSeg = $('#typeSeg');
const typePanels = $('.type-panels');
const qrText = $<HTMLTextAreaElement>('#qrText');
const typeHint = $('#typeHint');
const wifiEncSeg = $('#wifiEnc');
const wifiPwd = $<HTMLInputElement>('#wifiPwd');
const templatesEl = $('#templates');
const swatches = $('#swatches');
const fgInput = $<HTMLInputElement>('#fg');
const fg2Input = $<HTMLInputElement>('#fg2');
const fg2Wrap = $('#fg2Wrap');
const bgInput = $<HTMLInputElement>('#bg');
const gradChk = $<HTMLInputElement>('#gradChk');
const transChk = $<HTMLInputElement>('#transChk');
const dotSeg = $('#dotSeg');
const cornerSeg = $('#cornerSeg');
const iconGroups = $('#iconGroups');
const logoInput = $<HTMLInputElement>('#logoInput');
const logoText = $('#logoText');
const logoClear = $<HTMLButtonElement>('#logoClear');
const canvasEl = $('#qrCanvas');
const dlPng = $<HTMLButtonElement>('#dlPng');
const dlSvg = $<HTMLButtonElement>('#dlSvg');
const statusEl = $('#status');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

let contentType = 'text';
let wifiEnc = 'WPA';

const state = {
  fg: '#131313',
  fg2: '#7b2ff7',
  bg: '#ffffff',
  grad: false,
  dot: 'rounded',
  corner: 'extra-rounded',
  transparent: false,
  ecc: 'Q',
};
let logoData: string | undefined;
let QR: any = null;

// 内置品牌图标(Simple Icons CDN, 带品牌色), 分组
const ICON_GROUPS: Array<{ label: string; icons: string[][] }> = [
  { label: '中国 App', icons: [['wechat', '微信'], ['qq', 'QQ'], ['bilibili', 'B站'], ['tiktok', '抖音'], ['sinaweibo', '微博'], ['zhihu', '知乎'], ['xiaohongshu', '小红书'], ['alipay', '支付宝'], ['baidu', '百度'], ['kuaishou', '快手']] },
  { label: '社交 · 通讯', icons: [['x', 'X'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['threads', 'Threads'], ['telegram', 'Telegram'], ['whatsapp', 'WhatsApp'], ['snapchat', 'Snapchat'], ['discord', 'Discord'], ['reddit', 'Reddit'], ['pinterest', 'Pinterest']] },
  { label: '科技 · 创作', icons: [['github', 'GitHub'], ['gitlab', 'GitLab'], ['figma', 'Figma'], ['notion', 'Notion'], ['youtube', 'YouTube'], ['spotify', 'Spotify'], ['netflix', 'Netflix'], ['twitch', 'Twitch'], ['medium', 'Medium'], ['paypal', 'PayPal']] },
];

// 风格模板
const TEMPLATES: Array<any> = [
  { name: '经典', fg: '#131313', bg: '#ffffff', dot: 'square', corner: 'square' },
  { name: '圆润', fg: '#131313', bg: '#ffffff', dot: 'rounded', corner: 'extra-rounded' },
  { name: '品红', fg: '#fb5eff', fg2: '#7b2ff7', bg: '#ffffff', dot: 'dots', corner: 'extra-rounded', grad: true },
  { name: '落日', fg: '#ff8a3d', fg2: '#fb5eff', bg: '#fff7ed', dot: 'extra-rounded', corner: 'extra-rounded', grad: true },
  { name: '海洋', fg: '#0ea5e9', fg2: '#2563eb', bg: '#f0f9ff', dot: 'rounded', corner: 'extra-rounded', grad: true },
  { name: '森林', fg: '#15803d', fg2: '#65a30d', bg: '#f0fdf4', dot: 'classy-rounded', corner: 'extra-rounded', grad: true },
  { name: '葡萄', fg: '#7c3aed', fg2: '#db2777', bg: '#faf5ff', dot: 'extra-rounded', corner: 'extra-rounded', grad: true },
  { name: '霓虹', fg: '#22d3ee', fg2: '#a855f7', bg: '#0b1020', dot: 'rounded', corner: 'extra-rounded', grad: true },
  { name: '靛蓝', fg: '#1f3a8a', bg: '#eef2ff', dot: 'classy', corner: 'extra-rounded' },
  { name: '墨绿', fg: '#1f6b3b', bg: '#eefaf0', dot: 'dots', corner: 'dot' },
  { name: '朱砂', fg: '#b5362c', bg: '#fbeae8', dot: 'square', corner: 'square' },
  { name: '樱花', fg: '#e11d8f', bg: '#fff1f6', dot: 'dots', corner: 'dot' },
  { name: '咖啡', fg: '#6f4e37', bg: '#f5efe6', dot: 'square', corner: 'square' },
  { name: '暗夜', fg: '#e5e7eb', bg: '#111827', dot: 'rounded', corner: 'extra-rounded' },
];

function setStatus(msg: string, kind: 'ok' | 'err' | '' = '') {
  statusEl.textContent = msg;
  statusEl.className = 'statusline' + (kind ? ' ' + kind : '');
}

function lum(hex: string): number {
  const c = hex.replace('#', '');
  if (c.length < 6) return 128;
  return 0.299 * parseInt(c.slice(0, 2), 16) + 0.587 * parseInt(c.slice(2, 4), 16) + 0.114 * parseInt(c.slice(4, 6), 16);
}

// ---- 内容编码 ----
function looksLikeUrl(s: string): boolean {
  if (/\s/.test(s)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return false;
  return /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(s) || /^www\./i.test(s);
}
function encodeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  return looksLikeUrl(s) ? 'https://' + s.replace(/^\/+/, '') : s;
}
function wifiEsc(s: string): string { return s.replace(/([\\;,:"])/g, '\\$1'); }

function encodeContent(): string {
  switch (contentType) {
    case 'wifi': {
      const ssid = val('#wifiSsid').trim();
      if (!ssid) return '';
      const pwd = wifiEnc === 'nopass' ? '' : val('#wifiPwd');
      const hidden = ($('#wifiHidden') as HTMLInputElement).checked;
      return `WIFI:T:${wifiEnc};S:${wifiEsc(ssid)};P:${wifiEsc(pwd)};${hidden ? 'H:true;' : ''};`;
    }
    case 'vcard': {
      const name = val('#vcName').trim(), org = val('#vcOrg').trim(), title = val('#vcTitle').trim();
      const tel = val('#vcTel').trim(), email = val('#vcEmail').trim(), url = val('#vcUrl').trim();
      if (!name && !tel && !email) return '';
      let v = 'BEGIN:VCARD\nVERSION:3.0\n';
      if (name) v += `N:${name};;;;\nFN:${name}\n`;
      if (org) v += `ORG:${org}\n`;
      if (title) v += `TITLE:${title}\n`;
      if (tel) v += `TEL;TYPE=CELL:${tel}\n`;
      if (email) v += `EMAIL:${email}\n`;
      if (url) v += `URL:${url}\n`;
      return v + 'END:VCARD';
    }
    case 'tel': {
      const n = val('#telNum').trim();
      return n ? 'tel:' + n.replace(/\s/g, '') : '';
    }
    case 'sms': {
      const n = val('#smsNum').trim();
      if (!n) return '';
      return `SMSTO:${n.replace(/\s/g, '')}:${val('#smsMsg')}`;
    }
    case 'email': {
      const a = val('#emailAddr').trim();
      if (!a) return '';
      const s = val('#emailSub').trim(), b = val('#emailBody').trim();
      const q = [s && `subject=${encodeURIComponent(s)}`, b && `body=${encodeURIComponent(b)}`].filter(Boolean).join('&');
      return `mailto:${a}${q ? '?' + q : ''}`;
    }
    default:
      return encodeUrl(qrText.value);
  }
}

function gradient() {
  return { type: 'linear', rotation: 0.7853981634, colorStops: [{ offset: 0, color: state.fg }, { offset: 1, color: state.fg2 }] };
}

function buildOptions(data: string): any {
  const dotsColor = state.grad ? { gradient: gradient() } : { color: state.fg };
  return {
    width: 1024,
    height: 1024,
    type: 'canvas',
    data: data || 'https://bodhi.tools',
    margin: 40,
    qrOptions: { errorCorrectionLevel: state.ecc },
    image: logoData,
    dotsOptions: { type: state.dot, ...dotsColor },
    backgroundOptions: { color: state.transparent ? 'rgba(0,0,0,0)' : state.bg },
    cornersSquareOptions: { type: state.corner, color: state.fg },
    cornersDotOptions: { type: state.corner === 'dot' ? 'dot' : 'square', color: state.fg },
    imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.36, hideBackgroundDots: true },
  };
}

function syncControls() {
  fgInput.value = state.fg;
  bgInput.value = state.bg;
  fg2Input.value = state.fg2;
  gradChk.checked = state.grad;
  transChk.checked = state.transparent;
  fg2Wrap.hidden = !state.grad;
  bgInput.disabled = state.transparent;
  swatches.querySelectorAll('button').forEach((x) => {
    const el = x as HTMLElement;
    const on = !state.grad && !state.transparent && el.dataset.fg === state.fg && el.dataset.bg === state.bg;
    x.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  dotSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', (x as HTMLElement).dataset.dot === state.dot ? 'true' : 'false'));
  cornerSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', (x as HTMLElement).dataset.corner === state.corner ? 'true' : 'false'));
  canvasEl.classList.toggle('checker', state.transparent);
}

function render() {
  if (!QR) return;
  const data = encodeContent();
  dlPng.disabled = dlSvg.disabled = !data;
  if (contentType === 'text') {
    const raw = qrText.value.trim();
    typeHint.textContent = !raw ? '' : looksLikeUrl(raw) ? '已识别为网址,自动补全 https:// → 扫码可直接跳转' : '按文本编码(网址请确保可识别,如 bodhi.tools)';
  }
  if (!data) { setStatus('填入内容后生成二维码'); return; }
  QR.update(buildOptions(data));
  const a = state.grad ? Math.min(lum(state.fg), lum(state.fg2)) : lum(state.fg);
  const contrast = Math.abs(a - (state.transparent ? 255 : lum(state.bg)));
  if (contrast < 60 && !state.transparent) setStatus('⚠ 前景 / 背景对比偏低,可能不易扫描', 'err');
  else setStatus('已生成 · 内容直接编码、永不过期', 'ok');
}

function update() { syncControls(); render(); }

function renderTemplates() {
  templatesEl.innerHTML = TEMPLATES.map((t, i) => {
    const chip = t.grad ? `background:linear-gradient(135deg, ${t.fg}, ${t.fg2})` : `background:${t.fg}`;
    return `<button class="tpl" type="button" data-i="${i}"><span class="tpl-chip" style="${chip}"></span>${t.name}</button>`;
  }).join('');
}
function renderIcons() {
  iconGroups.innerHTML = ICON_GROUPS.map((g) =>
    `<div class="icon-group"><span class="icon-group-label">${g.label}</span><div class="icon-grid">` +
    g.icons.map(([slug, name]) => `<button class="icon-btn" type="button" data-slug="${slug}" title="${name}"><img src="https://cdn.simpleicons.org/${slug}" alt="${name}" loading="lazy" /></button>`).join('') +
    `</div></div>`,
  ).join('');
}

async function init() {
  renderTemplates();
  renderIcons();
  syncControls();
  try {
    const QRCodeStyling = (await import('qr-code-styling')).default as any;
    QR = new QRCodeStyling(buildOptions(encodeContent()));
    canvasEl.innerHTML = '';
    QR.append(canvasEl);
    render();
  } catch (e) {
    setStatus((e as Error).message || '初始化失败,请刷新重试', 'err');
  }
}

// ---- 事件 ----
// 内容类型切换
const panels = document.querySelectorAll('.type-panel');
typeSeg.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    typeSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    contentType = (b as HTMLElement).dataset.type || 'text';
    panels.forEach((p) => { (p as HTMLElement).hidden = (p as HTMLElement).dataset.panel !== contentType; });
    render();
  });
});
// 所有内容字段(委托)
typePanels.addEventListener('input', () => render());
typePanels.addEventListener('change', () => render());
// Wi-Fi 加密方式
wifiEncSeg.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    wifiEncSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    wifiEnc = (b as HTMLElement).dataset.enc || 'WPA';
    wifiPwd.disabled = wifiEnc === 'nopass';
    render();
  });
});

// 模板
templatesEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button.tpl') as HTMLElement | null;
  if (!btn) return;
  const t = TEMPLATES[Number(btn.dataset.i)];
  state.fg = t.fg; state.bg = t.bg;
  if (t.fg2) state.fg2 = t.fg2;
  state.grad = !!t.grad; state.dot = t.dot; state.corner = t.corner; state.transparent = false;
  update();
});

// 配色
swatches.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    state.fg = (b as HTMLElement).dataset.fg || '#131313';
    state.bg = (b as HTMLElement).dataset.bg || '#ffffff';
    state.grad = false; state.transparent = false;
    update();
  });
});
fgInput.addEventListener('input', () => { state.fg = fgInput.value; update(); });
fg2Input.addEventListener('input', () => { state.fg2 = fg2Input.value; update(); });
bgInput.addEventListener('input', () => { state.bg = bgInput.value; update(); });
gradChk.addEventListener('change', () => { state.grad = gradChk.checked; update(); });
transChk.addEventListener('change', () => { state.transparent = transChk.checked; update(); });

// 码点 / 定位角
dotSeg.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => { state.dot = (b as HTMLElement).dataset.dot || 'rounded'; update(); });
});
cornerSeg.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => { state.corner = (b as HTMLElement).dataset.corner || 'extra-rounded'; update(); });
});

// 内置品牌图标
iconGroups.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest('button.icon-btn') as HTMLElement | null;
  if (!btn) return;
  const slug = btn.dataset.slug || '';
  setStatus('加载品牌图标…');
  try {
    const res = await fetch(`https://cdn.simpleicons.org/${slug}`);
    if (!res.ok) throw new Error('not ok');
    let svg = await res.text();
    if (!/\swidth=/.test(svg)) svg = svg.replace('<svg', '<svg width="512" height="512"');
    logoData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    state.ecc = 'H';
    logoClear.hidden = false;
    logoText.textContent = '+ 上传自定义';
    iconGroups.querySelectorAll('.icon-btn').forEach((x) => x.classList.remove('on'));
    btn.classList.add('on');
    render();
  } catch {
    setStatus('图标加载失败(检查网络),可改用上传 logo', 'err');
  }
});

// 上传自定义 logo
logoInput.addEventListener('change', () => {
  const f = logoInput.files?.[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) { setStatus('请选择图片作为 logo', 'err'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    logoData = reader.result as string;
    state.ecc = 'H';
    logoText.textContent = '✓ 已添加';
    logoClear.hidden = false;
    iconGroups.querySelectorAll('.icon-btn').forEach((x) => x.classList.remove('on'));
    render();
  };
  reader.readAsDataURL(f);
  logoInput.value = '';
});
logoClear.addEventListener('click', () => {
  logoData = undefined;
  state.ecc = 'Q';
  logoText.textContent = '+ 上传自定义';
  logoClear.hidden = true;
  iconGroups.querySelectorAll('.icon-btn').forEach((x) => x.classList.remove('on'));
  render();
});

// 下载
async function downloadAs(ext: 'png' | 'svg') {
  const data = encodeContent();
  if (!QR || !data) return;
  try {
    let raw: any;
    if (ext === 'svg') {
      const QRCodeStyling = (await import('qr-code-styling')).default as any;
      const tmp = new QRCodeStyling({ ...buildOptions(data), type: 'svg' });
      raw = await tmp.getRawData('svg');
    } else {
      raw = await QR.getRawData('png');
    }
    if (!raw) { setStatus('生成失败,请重试', 'err'); return; }
    const blob = raw instanceof Blob ? raw : new Blob([raw], { type: ext === 'svg' ? 'image/svg+xml' : 'image/png' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode-bodhi.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    setStatus(`已下载 ${ext.toUpperCase()}`, 'ok');
  } catch (e) {
    setStatus((e as Error).message || '下载失败,请重试', 'err');
  }
}
dlPng.addEventListener('click', () => downloadAs('png'));
dlSvg.addEventListener('click', () => downloadAs('svg'));

init();
