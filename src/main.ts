import './style.css';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

const qrText = $<HTMLTextAreaElement>('#qrText');
const swatches = $('#swatches');
const fgInput = $<HTMLInputElement>('#fg');
const bgInput = $<HTMLInputElement>('#bg');
const dotSeg = $('#dotSeg');
const logoInput = $<HTMLInputElement>('#logoInput');
const logoText = $('#logoText');
const logoClear = $<HTMLButtonElement>('#logoClear');
const canvasEl = $('#qrCanvas');
const dlPng = $<HTMLButtonElement>('#dlPng');
const dlSvg = $<HTMLButtonElement>('#dlSvg');
const statusEl = $('#status');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const state = {
  data: 'https://bodhi.tools',
  fg: '#131313',
  bg: '#ffffff',
  dot: 'rounded',
  ecc: 'Q',
};
let logoData: string | undefined;
let QR: any = null;

function setStatus(msg: string, kind: 'ok' | 'err' | '' = '') {
  statusEl.textContent = msg;
  statusEl.className = 'statusline' + (kind ? ' ' + kind : '');
}

function lum(hex: string): number {
  const c = hex.replace('#', '');
  if (c.length < 6) return 128;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function buildOptions(): any {
  const corner = state.dot === 'dots' ? 'dot' : state.dot === 'square' ? 'square' : 'extra-rounded';
  return {
    width: 1024,
    height: 1024,
    type: 'canvas',
    data: state.data.trim() || 'https://bodhi.tools',
    margin: 24,
    qrOptions: { errorCorrectionLevel: state.ecc },
    image: logoData,
    dotsOptions: { color: state.fg, type: state.dot },
    backgroundOptions: { color: state.bg },
    cornersSquareOptions: { color: state.fg, type: corner },
    cornersDotOptions: { color: state.fg, type: state.dot === 'dots' ? 'dot' : 'square' },
    imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.36, hideBackgroundDots: true },
  };
}

function render() {
  if (!QR) return;
  const data = state.data.trim();
  dlPng.disabled = dlSvg.disabled = !data;
  if (!data) { setStatus('输入网址或文字后生成二维码'); return; }
  QR.update(buildOptions());
  const contrast = Math.abs(lum(state.fg) - lum(state.bg));
  if (contrast < 60) setStatus('⚠ 前景 / 背景对比偏低,可能不易扫描', 'err');
  else setStatus('已生成 · 内容直接编码、永不过期', 'ok');
}

async function init() {
  try {
    const QRCodeStyling = (await import('qr-code-styling')).default as any;
    QR = new QRCodeStyling(buildOptions());
    canvasEl.innerHTML = '';
    QR.append(canvasEl);
    render();
  } catch (e) {
    setStatus((e as Error).message || '初始化失败,请刷新重试', 'err');
  }
}

qrText.addEventListener('input', () => { state.data = qrText.value; render(); });

function clearSwatch() {
  swatches.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
}

swatches.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    clearSwatch();
    b.setAttribute('aria-pressed', 'true');
    state.fg = (b as HTMLElement).dataset.fg || '#131313';
    state.bg = (b as HTMLElement).dataset.bg || '#ffffff';
    fgInput.value = state.fg;
    bgInput.value = state.bg;
    render();
  });
});

fgInput.addEventListener('input', () => { state.fg = fgInput.value; clearSwatch(); render(); });
bgInput.addEventListener('input', () => { state.bg = bgInput.value; clearSwatch(); render(); });

dotSeg.querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    dotSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    state.dot = (b as HTMLElement).dataset.dot || 'rounded';
    render();
  });
});

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
    render();
  };
  reader.readAsDataURL(f);
  logoInput.value = '';
});

logoClear.addEventListener('click', () => {
  logoData = undefined;
  state.ecc = 'Q';
  logoText.textContent = '+ 上传 logo';
  logoClear.hidden = true;
  render();
});

async function downloadAs(ext: 'png' | 'svg') {
  if (!QR || !state.data.trim()) return;
  try {
    let raw: any;
    if (ext === 'svg') {
      const QRCodeStyling = (await import('qr-code-styling')).default as any;
      const tmp = new QRCodeStyling({ ...buildOptions(), type: 'svg' });
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
