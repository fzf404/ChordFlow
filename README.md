# ChordFlow

ChordFlow 是一个开源的可视化钢琴学习与和弦练习应用。它将 MIDI 乐曲转换为落键动画、双手颜色提示和可交互键盘，适合从入门课程到完整曲目的循序练习。

[Online Demo](https://chordflow-ashen.vercel.app)

## 功能

- 17 节渐进式钢琴入门课程
- 流行歌曲与古典曲目 MIDI 可视化
- 左手、右手与旋律分色显示
- 和弦时间线、BPM、调性和音域信息
- 0.5×–2× 播放速度与进度跳转
- 钢琴采样回放与键盘跟弹
- 桌面端和移动端自适应界面

## 技术栈

- Next.js 16 / React 19 / TypeScript
- vinext / Vite / Cloudflare Workers
- Tone.js MIDI
- Tailwind CSS 4
- 可选的 Cloudflare D1 / Drizzle 扩展骨架

## 本地开发

需要 Node.js `>=22.13.0` 和 Corepack。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

打开终端中显示的本地地址。

## 质量检查

```bash
pnpm lint
pnpm test
pnpm build:vercel
```

`pnpm test` 会先执行 vinext/Cloudflare 生产构建，再验证服务端渲染与曲库文件完整性。`pnpm build:vercel` 单独验证标准 Next.js/Vercel 构建。

## 部署

### Vercel

导入此 GitHub 仓库即可。`vercel.json` 会使用 Next.js 构建。

### Cloudflare Workers

vinext 通过 `vite.config.ts` 和 `worker/index.ts` 生成 Worker 产物：

```bash
pnpm build
pnpm start
```

### OpenAI Sites

`.openai/hosting.json` 声明 Sites 项目和可选绑定，`build/sites-vite-plugin.ts` 在构建时打包相关元数据。当前应用不依赖 D1 或 R2；`db/` 与 `examples/d1/` 仅作为可选扩展入口。

## 项目结构

```text
app/                  页面、交互与样式
public/audio/piano/   钢琴采样与其许可证
public/data/          POP909 子集与古典 MIDI
worker/               Cloudflare Worker 入口
db/                   可选 D1/Drizzle 扩展
examples/d1/          D1 使用示例
tests/                构建与资源完整性测试
```

## 数据与版权

源代码使用 [MIT License](LICENSE)。钢琴采样、POP909 数据和 MIDI 素材的来源与适用条款见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

仓库中出现的歌曲名称、艺人名称和作品识别信息仅用于数据集索引和教学演示，不代表版权方对本项目的背书。使用者需根据所在地区和使用场景自行确认音乐作品及编曲的权利。

## 贡献

欢迎 Issue 和 Pull Request。提交前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 并确保 lint、测试和两种构建均通过。
