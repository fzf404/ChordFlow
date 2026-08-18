# Contributing

感谢你帮助改进 ChordFlow。

## 开发流程

1. Fork 仓库并从 `main` 创建短期分支。
2. 使用 `pnpm install --frozen-lockfile` 安装依赖。
3. 保持改动聚焦，同步更新相关文档和测试。
4. 提交前运行：

   ```bash
   pnpm lint
   pnpm test
   pnpm build:vercel
   ```

5. 在 Pull Request 中说明问题、解决方案和验证结果。

## 音乐数据

新增 MIDI、音频或曲目元数据时，必须同时提供来源、许可证和必要的归属信息。不要提交无法确认分发权利的素材。

## 代码风格

- 使用明确、一致的英文命名。
- 避免遗留死代码、未使用资源和无说明的兼容分支。
- 不要提交密钥、凭据、个人数据或本地环境文件。
