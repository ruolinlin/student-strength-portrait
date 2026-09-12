# 学生发展优势测评

一个面向高中生的双视角、发展性优势画像应用。学生完成自评后，可以邀请一位熟悉自己的人独立完成镜像题目，再分别查看“我眼中的自己”“他人眼中的我”与并列呈现的共同画像。

> 这不是心理诊断、人格类型测试或专业推荐工具。画像只用于帮助学生形成可继续验证的发展假设。

## 产品原则

- 双视角保持独立且等权，不合成所谓“真实分数”。
- 差异以中性、可对话的方式呈现，不判断谁更准确。
- 结果指向下一步探索行动，而不是替学生做升学或职业决定。
- 不要求真实姓名、学校、生日或联系方式。
- 不展示双方的逐题回答。

## 功能

- 72 道题按题库版本 `0.2` 的 `Q01–Q72` 稳定导入。
- 兴趣、优势、偏好、价值观和自我效能五类信号及其子维度计分。
- 单题单屏、自动保存、断点续答、邀请链接与观察者关系。
- 自我画像、他人画像、共同高点与双视角差异。
- 3–5 个带依据和验证行动的发展探索方向。
- 专业解读上下文、结构化 JSON、Markdown 与 Prompt 导出。
- 移动端优先界面与可选 WebMCP 答题工具。

## 技术栈

- React 19、TypeScript、Next.js App Router API
- Vinext、Vite、Tailwind CSS 4、Framer Motion
- 可选 Supabase REST 持久化
- Cloudflare Worker 兼容构建

## 快速开始

需要 Node.js 22.13+ 和 pnpm。

```bash
git clone <your-repository-url>
cd student-strength-portrait
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。不配置环境变量时，应用会自动使用浏览器本地存储。

常用命令：

```bash
pnpm typecheck   # TypeScript 检查
pnpm lint        # 静态检查
pnpm build       # 生产构建
pnpm check       # 依次运行以上三项
```

## 数据持久化

应用支持两种模式：

1. 本地模式：数据保存在 `localStorage`，适合单设备演示与原型验证。
2. Supabase 模式：设置环境变量后使用 REST API，支持跨设备邀请。

启用 Supabase：

1. 在测试项目中执行 [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql)。
2. 复制 `.env.example` 为 `.env.local`。
3. 填写 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
4. 重启开发服务器。

当前 SQL 策略只适合受控内测，不能直接用于公开生产环境。公开收集真实学生数据前，必须增加身份验证或一次性令牌，并将 RLS 收紧到记录级授权。参见 [`docs/PRIVACY.md`](./docs/PRIVACY.md)。

## 计分边界

- 非偏好维度按所属题目的 1–5 分均值计算。
- 四组偏好按左右方向校正后形成连续谱；“偏好清晰度”只表示离中点的距离。
- 共同高点要求双方同一非偏好子维度均不低于 4；偏好要求双方落在同一明显方向。
- 双视角差异阈值暂定为 0.75，它是待内测校准的产品参数，不是诊断标准。
- 探索方向仅根据学生自评画像生成，不把两个视角合成为一个结论。

完整说明见 [`docs/SCORING.md`](./docs/SCORING.md)。

## 项目结构

```text
app/                 页面与路由
components/          业务组件与基础 UI
data/                题库、维度和探索规则数据
lib/                 计分、比较、持久化与导出逻辑
types/               TypeScript 数据结构
scripts/             题库导入工具
supabase/migrations/ 内测数据库结构
docs/                架构、计分与隐私说明
```

## 题库更新

题库源文件不提交到仓库。维护者可以使用导入脚本重新生成 `data/assessment.ts`：

```bash
python3 scripts/import_workbook.py /absolute/path/to/question-bank.xlsx data/assessment.ts
```

脚本会校验恰好 72 道题以及连续稳定的 `Q01–Q72` ID。题目文本与测评模型仍需由具备相关专业能力的团队独立审查和验证。

## 部署说明

本仓库不会提交任何真实站点 ID、访问令牌或环境变量。`.openai/hosting.json` 保留了可构建的空配置；使用 OpenAI Sites 时，由站点工具在本地写入项目 ID，提交前应恢复为空值。其他平台可根据目标运行时增加适配配置。

部署前请完成 [`OPEN_SOURCE_CHECKLIST.md`](./OPEN_SOURCE_CHECKLIST.md) 中的确认项。仓库准备与远程发布是两个独立步骤。

## 参与贡献

提交代码前请阅读 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。安全问题请按 [`SECURITY.md`](./SECURITY.md) 处理，不要在公开 Issue 中粘贴真实学生数据。

## 许可证

代码与仓库内发布的题目内容采用 [MIT License](./LICENSE)。第三方框架名称仅用于描述理论维度，不代表其作者或机构为本项目背书。
