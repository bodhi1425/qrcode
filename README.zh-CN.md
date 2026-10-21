# 二维码生成器

[English](README.md) · **简体中文**

在浏览器里生成带样式的二维码：网址、Wi-Fi、名片等都支持，可以设置渐变、点阵形状，在中间放 logo。生成的是静态码，永不过期，也不依赖任何服务器。

**在线使用：** https://qrcode.bodhi.tools/

![二维码生成器截图](docs/screenshot.png)

## 功能

- 内容类型：网址或文本、Wi-Fi（WPA/WPA2、WEP、无密码、隐藏网络）、vCard 名片、电话、短信、邮件
- 14 个一键套用的样式模板
- 前景色、背景色、双色渐变和透明背景
- 6 种点阵样式和 3 种定位角样式
- 中心 logo：可从 30 个品牌图标中选择，或上传自己的图片；加 logo 后容错级别自动提高到 H
- 下载 1024 × 1024 的 PNG 或矢量 SVG
- 文本按 UTF-8 编码，中文等非拉丁文字扫码不乱码
- 中英文界面

## 实现原理

[qr-code-styling](https://github.com/kozakdenys/qr-code-styling) 在 canvas 上绘制二维码（用于 PNG），或直接生成 SVG。内容直接编码在图片里，没有跳转链接、没有追踪，也不会过期。

## 隐私说明

- 你输入的内容和上传的 logo 只留在浏览器里，应用没有任何上传接口。
- 选择品牌图标时，会从 [Simple Icons](https://simpleicons.org) 的 CDN 获取图标；字体从 Google Fonts 和 Fontshare 加载。
- qrcode.bodhi.tools 上的线上版本接入了 Cloudflare Web Analytics，只统计页面访问量，不使用 Cookie。自行部署时如不需要，删除 `index.html` 和 `en/index.html` 中的 `cloudflareinsights` 脚本标签即可。

品牌图标仅用于标识，商标归各自所有者。

## 本地运行

需要 Node.js 20.19+（或 22.12+）和 [pnpm](https://pnpm.io)。

```bash
git clone https://github.com/bodhi1425/qrcode.git
cd qrcode
pnpm install
pnpm dev     # http://localhost:5173
pnpm build   # 静态文件输出到 dist/
```

`dist/` 里只有静态文件，可以部署到 Cloudflare Pages、Netlify、GitHub Pages 或任何 Web 服务器。

## 目录结构

```
index.html       中文页 (/)
en/index.html    英文页 (/en/)
src/main.ts      界面、内容编码、模板与导出
src/style.css    样式
public/          favicon、robots.txt、sitemap.xml
```

## 依赖

| 包 | 用途 | 许可证 |
|---|---|---|
| [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 二维码绘制 | MIT |
| [Simple Icons](https://simpleicons.org)（经 CDN） | 品牌图标 | CC0-1.0 |
| [Vite](https://vite.dev)、[TypeScript](https://www.typescriptlang.org) | 构建 | MIT、Apache-2.0 |

## 更多本地处理工具

以下工具都完全在浏览器中运行：

- [local-pdf-toolbox](https://github.com/bodhi1425/local-pdf-toolbox)：PDF 合并、拆分、压缩与格式转换
- [image-compressor](https://github.com/bodhi1425/image-compressor)：把图片压缩到指定 KB
- [heic-converter](https://github.com/bodhi1425/heic-converter)：iPhone HEIC 照片转 JPG 或 PNG
- [ocr](https://github.com/bodhi1425/ocr)：图片转文字
- [cutout](https://github.com/bodhi1425/cutout)：用本地 AI 模型抠图去背景

## 参与贡献

欢迎提交问题反馈和 Pull Request。较大的改动请先开 issue 讨论。

## 许可证

[MIT](LICENSE) © 2026 bodhi1425
