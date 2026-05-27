# M2.6 Project Init Feedback SPEC Index

本目录集中存放 A 测单项目初始化反馈的 5 个专项 SPEC，便于一次性索引给其他 AI 或实现 Agent。

## 实施状态

- 状态：已完成第一轮落地
- 验证：`npm test` 53/53 通过；`npm --cache /private/tmp/starwork-npm-cache pack --dry-run` 通过
- 核心结果：独立 Project 不再默认暴露 Hub 同步目录；System 文件改为可填写模板；AGENTS 和 current-project 增加污染防线；Satellite 由 `spawn` 单独叠加 Hub 同步说明。

建议处理顺序：

1. [01 Identity 模板口径](m2.6-project-init-feedback-01-identity-spec.md)
2. [02 Hub Sync 可见边界](m2.6-project-init-feedback-02-hub-sync-boundary-spec.md)
3. [03 Current Project 事实源纯度](m2.6-project-init-feedback-03-current-project-purity-spec.md)
4. [04 System 占位模板](m2.6-project-init-feedback-04-system-placeholder-templates-spec.md)
5. [05 AGENTS 入口规则与 Skill 防污染](m2.6-project-init-feedback-05-agents-guardrails-spec.md)

## 处理边界

- 01、02、04 偏 Core / Kit / 模板架构问题，优先检查是否还有独立 Project 与 Hub / Satellite 口径混用。
- 03、05 偏 Skill / Blueprint / Agent 输出约束问题，优先检查是否还有初始化过程、推理过程、dry-run 解释或临时约束污染正式工作区文件。
- 每份 SPEC 都包含独立验收标准和防复发验收；实现时不应只修截图暴露的单点问题，而要按对应 SPEC 的“举一反三排查”补齐同类检查。

## 完成标准

这 5 份 SPEC 的验收标准全部通过后，单项目初始化反馈专项才视为完成。
