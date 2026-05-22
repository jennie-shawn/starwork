const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..", "..");
const bin = path.join(root, "cli", "bin", "starwork.js");
const packageJson = require(path.join(root, "package.json"));

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "starwork-init-test-"));
}

function runInit(args) {
  return execFileSync(process.execPath, [bin, "init", ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

function runDoctor(args) {
  return spawnSync(process.execPath, [bin, "doctor", ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

function runCommand(args) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("prints version and product-oriented help", () => {
  const version = runCommand(["--version"]);
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), packageJson.version);

  const help = runCommand(["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, new RegExp(`StarWork CLI ${packageJson.version}`));
  assert.match(help.stdout, /常用开始/);
  assert.match(help.stdout, /starwork init --help/);
});

test("dry-run does not write files", () => {
  const dir = tempDir();
  const output = runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--dry-run"]);

  assert.match(output, /初始化预览/);
  assert.equal(fs.existsSync(path.join(dir, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "workspace.json")), false);
});

test("init dry-run shows selected language", () => {
  const dir = tempDir();
  const output = runInit(["--type", "single-light", "--pack", "general", "--language", "en", "--target", dir, "--dry-run"]);

  assert.match(output, /语言：en/);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "workspace.json")), false);
});

test("init rejects unsupported language", () => {
  const dir = tempDir();
  const result = runCommand(["init", "--type", "single-light", "--pack", "general", "--language", "fr", "--target", dir, "--dry-run"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /不支持的语言：fr/);
});

test("creates a single-light workspace with general pack", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  const skills = readJson(path.join(dir, ".starwork", "skills.json"));
  assert.equal(state.workspace_type, "single-light");
  assert.equal(state.kit, "local-starter");
  assert.equal(state.packs[0].id, "general");
  assert.equal(skills.skills[0].id, "neat-freak");
  assert.equal(skills.skills[0].source.kind, "kit");
  assert.equal(fs.existsSync(path.join(dir, ".agents", "skills", "neat-freak", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "输出", "确认成果", "README.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "_系统", "身份", "README.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "_系统", "教训", "README.md")), true);
});

test("creates a single-matter workspace with content creator pack", () => {
  const dir = tempDir();
  runInit(["--type", "single-matter", "--pack", "content-creator", "--target", dir, "--yes"]);

  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  const agents = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  assert.equal(state.workspace_type, "single-matter");
  assert.equal(state.packs[0].id, "content-creator");
  assert.equal(state.paths.formal_source, "发布记录/");
  assert.match(agents, /自媒体内容生产流/);
  assert.equal(fs.existsSync(path.join(dir, "事项", "注册表.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "发布记录", "README.md")), true);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "packs", "content-creator", "templates", "content-brief.md")), true);
});

test("creates a hub workspace with hub management pack", () => {
  const dir = tempDir();
  runInit(["--type", "hub", "--target", dir, "--yes"]);

  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  const skills = readJson(path.join(dir, ".starwork", "skills.json"));
  assert.equal(state.workspace_type, "hub");
  assert.equal(state.kit, "hub");
  assert.equal(state.packs[0].id, "hub-management");
  assert.equal(skills.skills[0].id, "starworkSpawn");
  assert.equal(skills.skills[0].source.kind, "kit");
  assert.equal(fs.existsSync(path.join(dir, "skills", "starworkSpawn", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "skills", "registry.json")), true);
  assert.equal(fs.existsSync(path.join(dir, "项目", "registry.json")), true);
  assert.equal(fs.existsSync(path.join(dir, "知识", "README.md")), true);
  assert.equal(fs.existsSync(path.join(dir, ".incoming", "README.md")), true);
});

test("does not overwrite existing user files", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "README.md"), "# Existing\n", "utf8");

  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  assert.equal(fs.readFileSync(path.join(dir, "README.md"), "utf8"), "# Existing\n");
  assert.equal(fs.existsSync(path.join(dir, "README.starwork-new.md")), true);
});

test("doctor passes on a single-light workspace with general pack", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const result = runDoctor(["--target", dir]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Workspace is healthy/);
});

test("doctor passes on a single-matter workspace with content creator pack", () => {
  const dir = tempDir();
  runInit(["--type", "single-matter", "--pack", "content-creator", "--target", dir, "--yes"]);

  const result = runDoctor(["--target", dir, "--json"]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(report.ok, true);
  assert.equal(report.workspace.workspace_type, "single-matter");
  assert.deepEqual(report.workspace.packs, ["content-creator"]);
});

test("doctor passes on a hub workspace", () => {
  const dir = tempDir();
  runInit(["--type", "hub", "--target", dir, "--yes"]);

  const result = runDoctor(["--target", dir]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Workspace is healthy/);
});

test("multiagent init creates custom agent lanes without built-in defaults", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const lanes = runCommand(["multiagent", "init", "--target", dir, "--lanes", "research,writing", "--yes"]);
  const registry = fs.readFileSync(path.join(dir, "_系统", "协作", "agent-lanes.md"), "utf8");
  const shared = fs.readFileSync(path.join(dir, "_系统", "协作", "shared.md"), "utf8");

  assert.equal(lanes.status, 0);
  assert.match(registry, /\| research \| 待补充 \| unbound \| 待补充 \| lanes\/research\/worklog\.md \|/);
  assert.match(registry, /\| writing \| 待补充 \| unbound \| 待补充 \| lanes\/writing\/worklog\.md \|/);
  assert.doesNotMatch(registry, /backend|frontend|test/);
  assert.match(shared, /# Shared Agent Context/);
  assert.equal(fs.existsSync(path.join(dir, "_系统", "协作", "lanes", "research", "worklog.md")), true);
});

test("multiagent add bind share and status update markdown state", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);
  runCommand(["multiagent", "init", "--target", dir, "--yes"]);

  const add = runCommand([
    "multiagent", "add", "review",
    "--purpose", "审校和风险检查",
    "--write", "reviews/**,product/docs/**",
    "--target", dir,
    "--yes"
  ]);
  const bind = runCommand([
    "multiagent", "bind", "review",
    "--session", "codex:manual-review-1",
    "--target", dir,
    "--yes"
  ]);
  const share = runCommand([
    "multiagent", "share", "review",
    "--title", "Review checklist",
    "--path", "product/docs/review-checklist.md",
    "--audience", "writing",
    "--status", "draft",
    "--target", dir,
    "--yes"
  ]);
  const status = runCommand(["multiagent", "status", "--target", dir, "--json"]);
  const report = JSON.parse(status.stdout);
  const registry = fs.readFileSync(path.join(dir, "_系统", "协作", "agent-lanes.md"), "utf8");
  const shared = fs.readFileSync(path.join(dir, "_系统", "协作", "shared.md"), "utf8");

  assert.equal(add.status, 0);
  assert.equal(bind.status, 0);
  assert.equal(share.status, 0);
  assert.equal(status.status, 0);
  assert.match(registry, /\| review \| 审校和风险检查 \| codex:manual-review-1 \| reviews\/\*\*,product\/docs\/\*\* \| lanes\/review\/worklog\.md \|/);
  assert.match(shared, /\| review \| Review checklist \| product\/docs\/review-checklist\.md \| writing \| draft \|/);
  assert.equal(report.schema, "starwork.agent_lanes.status.v0.1");
  assert.equal(report.lanes[0].lane, "review");
  assert.equal(report.lanes[0].current_session, "codex:manual-review-1");
  assert.equal(report.shared_outputs[0].title, "Review checklist");
});

test("spawn creates a matter project from a hub", () => {
  const hub = tempDir();
  const target = tempDir();
  runInit(["--type", "hub", "--target", hub, "--yes"]);

  const spawn = runCommand(["spawn", "--hub", hub, "--name", "Content Site", "--id", "content-site", "--target", target, "--mode", "matter", "--yes"]);
  const state = readJson(path.join(target, ".starwork", "workspace.json"));
  const sync = readJson(path.join(target, ".core-sync.json"));
  const skills = readJson(path.join(target, ".starwork", "skills.json"));
  const registry = readJson(path.join(hub, "项目", "registry.json"));
  const doctor = runDoctor(["--target", target, "--json"]);
  const report = JSON.parse(doctor.stdout);

  assert.equal(spawn.status, 0);
  assert.equal(state.workspace_type, "satellite-matter");
  assert.equal(state.kit, "satellite-matter");
  assert.equal(state.hub.project_id, "content-site");
  assert.equal(sync.project_id, "content-site");
  assert.equal(registry.projects[0].id, "content-site");
  assert.equal(registry.projects[0].path, path.resolve(target));
  assert.equal(fs.lstatSync(path.join(target, "知识")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(target, ".agents", "skills")).isDirectory(), true);
  assert.deepEqual(skills.skills, []);
  assert.equal(sync.resources.skills.mode, "selected");
  assert.equal(doctor.status, 0);
});

test("spawn creates a starter project from a hub", () => {
  const hub = tempDir();
  const target = tempDir();
  runInit(["--type", "hub", "--target", hub, "--yes"]);

  const spawn = runCommand(["spawn", "--hub", hub, "--name", "Quick Project", "--id", "quick-project", "--target", target, "--mode", "starter", "--yes"]);
  const state = readJson(path.join(target, ".starwork", "workspace.json"));
  const doctor = runDoctor(["--target", target, "--json"]);
  const report = JSON.parse(doctor.stdout);

  assert.equal(spawn.status, 0);
  assert.equal(state.workspace_type, "satellite-starter");
  assert.equal(state.kit, "satellite-starter");
  assert.equal(fs.existsSync(path.join(target, "事项")), false);
  assert.equal(doctor.status, 0);
});

test("spawn creates a customized project from a blueprint", () => {
  const hub = tempDir();
  const target = tempDir();
  const blueprintDir = tempDir();
  fs.mkdirSync(path.join(blueprintDir, "rules"), { recursive: true });
  fs.mkdirSync(path.join(blueprintDir, "seed", "会议纪要"), { recursive: true });
  fs.writeFileSync(path.join(blueprintDir, "rules", "file-boundaries.md"), "正式成果放在 {{paths.formal_source}}。\n", "utf8");
  fs.writeFileSync(path.join(blueprintDir, "rules", "workflow.md"), "当前推进放在 {{paths.business_work_area}}。\n", "utf8");
  fs.writeFileSync(path.join(blueprintDir, "seed", "会议纪要", "README.md"), "# 会议纪要\n\n项目：{{project.name}}\n", "utf8");
  fs.writeFileSync(path.join(blueprintDir, "blueprint.json"), `${JSON.stringify({
    schema: "starwork.spawn_blueprint.v0.1",
    name: "Blueprint Project",
    project_id: "blueprint-project",
    description: "用 blueprint 生成的定制项目。",
    base: {
      mode: "matter",
      kit: "satellite-matter",
      language: "zh"
    },
    paths: {
      formal_source: "交付物/确认版本/",
      business_work_area: "事项/"
    },
    folders: [
      "资料库/",
      "会议纪要/",
      "版本记录/",
      "交付物/确认版本/"
    ],
    agent_rules: [
      { slot: "project.file_boundaries", from: "rules/file-boundaries.md" },
      { slot: "project.workflow", from: "rules/workflow.md" }
    ],
    seed: [
      { from: "seed/会议纪要/README.md", to: "会议纪要/README.md", on_conflict: "error" }
    ]
  }, null, 2)}\n`, "utf8");
  runInit(["--type", "hub", "--target", hub, "--yes"]);

  const spawn = runCommand(["spawn", "--hub", hub, "--target", target, "--blueprint", path.join(blueprintDir, "blueprint.json"), "--yes"]);
  const state = readJson(path.join(target, ".starwork", "workspace.json"));
  const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
  const projectStatus = fs.readFileSync(path.join(target, "_系统", "上下文", "当前项目.md"), "utf8");
  const seed = fs.readFileSync(path.join(target, "会议纪要", "README.md"), "utf8");
  const registry = readJson(path.join(hub, "项目", "registry.json"));
  const doctor = runDoctor(["--target", target, "--json"]);
  const report = JSON.parse(doctor.stdout);

  assert.equal(spawn.status, 0);
  assert.equal(state.workspace_type, "satellite-matter");
  assert.equal(state.paths.formal_source, "交付物/确认版本/");
  assert.equal(state.customization.type, "spawn_blueprint");
  assert.equal(state.customization.agent_rules[0].slot, "project.file_boundaries");
  assert.equal(fs.existsSync(path.join(target, "资料库")), true);
  assert.equal(fs.existsSync(path.join(target, "交付物", "确认版本")), true);
  assert.match(agents, /StarWork Blueprint: project\.file_boundaries/);
  assert.match(agents, /正式成果放在 交付物\/确认版本\//);
  assert.match(projectStatus, /工作区定制/);
  assert.match(seed, /项目：Blueprint Project/);
  assert.equal(registry.projects[0].customized, true);
  assert.equal(doctor.status, 0);
  assert(report.checks.some((check) => check.id === "blueprint.folder.exists" && check.level === "pass"));
  assert(report.checks.some((check) => check.id === "blueprint.rule.injected" && check.level === "pass"));
});

test("spawn distributes selected hub-managed skills from registry", () => {
  const hub = tempDir();
  const target = tempDir();
  const blueprintDir = tempDir();
  runInit(["--type", "hub", "--target", hub, "--yes"]);
  fs.mkdirSync(path.join(hub, "skills", "meeting-summary"), { recursive: true });
  fs.writeFileSync(path.join(hub, "skills", "meeting-summary", "SKILL.md"), "# Meeting Summary\n", "utf8");
  fs.writeFileSync(path.join(hub, "skills", "registry.json"), `${JSON.stringify({
    schema: "starwork.skill_registry.v0.1",
    owner: "hub",
    updated_at: "2026-05-20T00:00:00.000Z",
    skills: [
      {
        id: "meeting-summary",
        name: "Meeting Summary",
        type: "hub-managed",
        source: { kind: "local", path: "skills/meeting-summary" },
        ownership: "hub-owned",
        distribution: { mode: "symlink", default_for_spawn: false },
        description: "会议纪要整理。"
      }
    ]
  }, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(blueprintDir, "blueprint.json"), `${JSON.stringify({
    schema: "starwork.spawn_blueprint.v0.1",
    name: "Skill Project",
    project_id: "skill-project",
    base: {
      mode: "starter",
      kit: "satellite-starter",
      language: "zh"
    },
    skills: [
      {
        id: "meeting-summary",
        source: "hub",
        distribution: "symlink",
        reason: "这个项目需要会议纪要整理。"
      }
    ]
  }, null, 2)}\n`, "utf8");

  const result = runCommand(["spawn", "--hub", hub, "--target", target, "--blueprint", path.join(blueprintDir, "blueprint.json"), "--yes"]);
  const skills = readJson(path.join(target, ".starwork", "skills.json"));
  const sync = readJson(path.join(target, ".core-sync.json"));
  const doctor = runDoctor(["--target", target, "--json"]);
  const report = JSON.parse(doctor.stdout);

  assert.equal(result.status, 0);
  assert.equal(skills.skills[0].id, "meeting-summary");
  assert.equal(skills.skills[0].source.kind, "hub");
  assert.equal(skills.skills[0].distribution, "symlink");
  assert.equal(fs.lstatSync(path.join(target, ".agents", "skills")).isDirectory(), true);
  assert.equal(fs.lstatSync(path.join(target, ".agents", "skills", "meeting-summary")).isSymbolicLink(), true);
  assert.equal(fs.existsSync(path.join(target, ".agents", "skills", "starworkSpawn")), false);
  assert.equal(sync.resources.skills.items[0].id, "meeting-summary");
  assert.equal(doctor.status, 0);
  assert(report.skills.mounts.some((mount) => mount.id === "meeting-summary" && mount.status === "ok"));
});

test("spawn blueprint dry-run does not write target or registry", () => {
  const hub = tempDir();
  const target = tempDir();
  const blueprintDir = tempDir();
  fs.writeFileSync(path.join(blueprintDir, "blueprint.json"), `${JSON.stringify({
    schema: "starwork.spawn_blueprint.v0.1",
    name: "Dry Blueprint",
    base: {
      mode: "starter",
      kit: "satellite-starter",
      language: "zh"
    },
    paths: {
      formal_source: "交付物/",
      business_work_area: "参考资料/"
    },
    folders: ["交付物/"]
  }, null, 2)}\n`, "utf8");
  runInit(["--type", "hub", "--target", hub, "--yes"]);

  const result = runCommand(["spawn", "--hub", hub, "--target", target, "--blueprint", path.join(blueprintDir, "blueprint.json"), "--dry-run"]);
  const registry = readJson(path.join(hub, "项目", "registry.json"));

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Blueprint/);
  assert.equal(fs.existsSync(path.join(target, ".starwork", "workspace.json")), false);
  assert.deepEqual(registry.projects, []);
});

test("spawn blueprint rejects unsafe paths", () => {
  const hub = tempDir();
  const target = tempDir();
  const blueprintDir = tempDir();
  fs.writeFileSync(path.join(blueprintDir, "blueprint.json"), `${JSON.stringify({
    schema: "starwork.spawn_blueprint.v0.1",
    name: "Unsafe Blueprint",
    base: {
      mode: "matter",
      kit: "satellite-matter",
      language: "zh"
    },
    paths: {
      formal_source: "../escape/",
      business_work_area: "事项/"
    }
  }, null, 2)}\n`, "utf8");
  runInit(["--type", "hub", "--target", hub, "--yes"]);

  const result = runCommand(["spawn", "--hub", hub, "--target", target, "--blueprint", path.join(blueprintDir, "blueprint.json"), "--yes"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /不能跳出工作区/);
});

test("spawn refuses duplicate registry id", () => {
  const hub = tempDir();
  const first = tempDir();
  const second = tempDir();
  runInit(["--type", "hub", "--target", hub, "--yes"]);
  runCommand(["spawn", "--hub", hub, "--name", "First", "--id", "same-id", "--target", first, "--yes"]);

  const duplicate = runCommand(["spawn", "--hub", hub, "--name", "Second", "--id", "same-id", "--target", second, "--yes"]);

  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /已存在项目 ID/);
});

test("spawn refuses non-hub workspaces", () => {
  const workspace = tempDir();
  const target = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", workspace, "--yes"]);

  const result = runCommand(["spawn", "--hub", workspace, "--name", "Nope", "--id", "nope", "--target", target, "--yes"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /多项目管理中枢/);
});

test("spawn refuses non-empty target directories", () => {
  const hub = tempDir();
  const target = tempDir();
  fs.writeFileSync(path.join(target, "existing.txt"), "user content\n", "utf8");
  runInit(["--type", "hub", "--target", hub, "--yes"]);

  const result = runCommand(["spawn", "--hub", hub, "--name", "Existing", "--id", "existing", "--target", target, "--yes"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /目标目录已有内容/);
});

test("doctor fails when AGENTS.md is missing", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);
  fs.rmSync(path.join(dir, "AGENTS.md"));

  const result = runDoctor(["--target", dir]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /core\.entry_rules\.exists/);
});

test("doctor fails when the formal source is missing", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);
  fs.rmSync(path.join(dir, "输出", "确认成果"), { recursive: true, force: true });

  const result = runDoctor(["--target", dir, "--json"]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(report.ok, false);
  assert(report.checks.some((check) => check.id === "core.formal_source.exists" && check.level === "fail"));
});

test("doctor fails when pack seed is missing", () => {
  const dir = tempDir();
  runInit(["--type", "single-matter", "--pack", "content-creator", "--target", dir, "--yes"]);
  fs.rmSync(path.join(dir, "选题池", "README.md"));

  const result = runDoctor(["--target", dir, "--json"]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert(report.checks.some((check) => check.id === "pack.seed.installed" && check.level === "fail"));
});

test("doctor fails outside a StarWork workspace", () => {
  const dir = tempDir();

  const result = runDoctor(["--target", dir]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /不是 StarWork 工作台/);
});

test("doctor reports legacy signals for an English legacy template", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Legacy Agent Rules\n", "utf8");
  fs.mkdirSync(path.join(dir, "references"), { recursive: true });
  fs.mkdirSync(path.join(dir, "outputs", "drafts"), { recursive: true });
  fs.mkdirSync(path.join(dir, "outputs", "final"), { recursive: true });

  const result = runDoctor(["--target", dir, "--json"]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(report.upgrade.candidate, true);
  assert.equal(report.upgrade.source, "legacy-template");
  assert.equal(report.upgrade.inferred.language, "en");
  assert.equal(report.upgrade.inferred.workspace_type, "single-light");
  assert.equal(Object.hasOwn(report.upgrade.inferred, "pack"), false);
  assert.equal(Object.hasOwn(report.upgrade, "next_steps"), false);
  assert.deepEqual(report.upgrade.inferred.references, ["references"]);
  assert(report.upgrade.inferred.outputs.includes("outputs"));
  assert(report.checks.some((check) => check.id === "legacy.references.detected" && check.level === "info"));
});

test("doctor exposes inventory and semantic signals for non-standard legacy folders", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "README.md"), "# Custom Workspace\n", "utf8");
  fs.mkdirSync(path.join(dir, "资料库", "文章"), { recursive: true });
  fs.mkdirSync(path.join(dir, "成稿"), { recursive: true });
  fs.mkdirSync(path.join(dir, "推进"), { recursive: true });

  const result = runDoctor(["--target", dir, "--json"]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(report.target, path.resolve(dir));
  assert(report.inventory.directories.some((item) => item.path === "资料库"));
  assert(report.inventory.directories.some((item) => item.path === "成稿"));
  assert(report.inventory.files.some((item) => item.path === "README.md"));
  assert(report.signals.possible_reference_dirs.includes("资料库"));
  assert(report.signals.possible_output_dirs.includes("成稿"));
  assert(report.signals.possible_current_work_dirs.includes("推进"));
  assert.equal(report.upgrade.candidate, true);
});

test("doctor reports legacy signals for a Chinese matter legacy template", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, "_系统", "身份"), { recursive: true });
  fs.mkdirSync(path.join(dir, "事项"), { recursive: true });
  fs.mkdirSync(path.join(dir, "参考资料"), { recursive: true });
  fs.mkdirSync(path.join(dir, "输出", "确认成果"), { recursive: true });

  const result = runDoctor(["--target", dir]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /历史模板候选/);
  assert.match(result.stdout, /推测类型：single-matter/);
  assert.match(result.stdout, /推测语言：zh/);
  assert.doesNotMatch(result.stdout, /--dry-run/);
  assert.doesNotMatch(result.stdout, /下一步/);
});

test("upgrade blueprint dry-run does not write files", () => {
  const dir = tempDir();
  const blueprintDir = tempDir();
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Existing Agent\n", "utf8");
  fs.mkdirSync(path.join(dir, "资料库"), { recursive: true });
  fs.mkdirSync(path.join(dir, "成稿"), { recursive: true });
  fs.writeFileSync(path.join(blueprintDir, "upgrade-blueprint.json"), `${JSON.stringify({
    schema: "starwork.upgrade_blueprint.v0.1",
    generated_by: "starworkUpgrade",
    source: {
      doctor_schema: "starwork.doctor.result.v0.1",
      diagnosis: "legacy-template",
      core_fit: "medium"
    },
    base: {
      workspace_type: "single-light",
      kit: "local-starter",
      language: "zh",
      pack: "general"
    },
    strategy: "preserve-names",
    paths: {
      formal_source: "成稿/",
      business_work_area: "资料库/"
    },
    core_role_mapping: [],
    actions: [
      { type: "ensure_dir", path: ".starwork/" },
      { type: "write_workspace_state" },
      { type: "copy_kit_missing_files" }
    ]
  }, null, 2)}\n`, "utf8");

  const result = runCommand(["upgrade", "--target", dir, "--blueprint", path.join(blueprintDir, "upgrade-blueprint.json"), "--dry-run"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /升级预览/);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "workspace.json")), false);
});

test("upgrade applies a blueprint and keeps existing files", () => {
  const dir = tempDir();
  const blueprintDir = tempDir();
  fs.mkdirSync(path.join(blueprintDir, "rules"), { recursive: true });
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Existing Agent\n\nKeep me.\n", "utf8");
  fs.mkdirSync(path.join(dir, "资料库"), { recursive: true });
  fs.mkdirSync(path.join(dir, "成稿"), { recursive: true });
  fs.mkdirSync(path.join(dir, "事项"), { recursive: true });
  fs.writeFileSync(path.join(blueprintDir, "rules", "core-boundaries.md"), "正式成果：{{paths.formal_source}}\n当前工作：{{paths.business_work_area}}\n", "utf8");
  fs.writeFileSync(path.join(blueprintDir, "upgrade-blueprint.json"), `${JSON.stringify({
    schema: "starwork.upgrade_blueprint.v0.1",
    target: ".",
    generated_by: "starworkUpgrade",
    source: {
      doctor_schema: "starwork.doctor.result.v0.1",
      diagnosis: "legacy-template",
      core_fit: "medium"
    },
    base: {
      workspace_type: "single-matter",
      kit: "local-matter",
      language: "zh",
      pack: "general"
    },
    strategy: "preserve-names",
    paths: {
      formal_source: "成稿/",
      business_work_area: "事项/"
    },
    core_role_mapping: [
      { role: "references", path: "资料库/", confidence: "high", reason: "用户确认" },
      { role: "formal_source", path: "成稿/", confidence: "high", reason: "用户确认" }
    ],
    actions: [
      { type: "ensure_dir", path: ".starwork/" },
      { type: "write_workspace_state" },
      { type: "copy_kit_missing_files" },
      { type: "inject_agent_rules", target: "AGENTS.md", from: "rules/core-boundaries.md", slot: "upgrade.core_boundaries" }
    ],
    preserve: ["资料库/", "成稿/", "事项/"],
    verification: {
      run_doctor_after: true,
      expected_workspace_type: "single-matter"
    }
  }, null, 2)}\n`, "utf8");

  const result = runCommand(["upgrade", "--target", dir, "--blueprint", path.join(blueprintDir, "upgrade-blueprint.json"), "--yes"]);
  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  const agents = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  const doctor = runDoctor(["--target", dir, "--json"]);
  const report = JSON.parse(doctor.stdout);

  assert.equal(result.status, 0);
  assert.equal(state.workspace_type, "single-matter");
  assert.equal(state.kit, "local-matter");
  assert.equal(state.paths.formal_source, "成稿/");
  assert.equal(state.paths.business_work_area, "事项/");
  assert.equal(state.upgrade.type, "upgrade_blueprint");
  assert.match(agents, /Keep me/);
  assert.match(agents, /StarWork Upgrade: upgrade\.core_boundaries/);
  assert.match(agents, /正式成果：成稿\//);
  assert.equal(fs.existsSync(path.join(dir, "_系统", "上下文", "项目状态.md")), true);
  assert.equal(doctor.status, 0);
  assert.equal(report.ok, true);
});

test("upgrade refuses existing StarWork workspaces", () => {
  const dir = tempDir();
  const blueprintDir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);
  fs.writeFileSync(path.join(blueprintDir, "upgrade-blueprint.json"), `${JSON.stringify({
    schema: "starwork.upgrade_blueprint.v0.1",
    base: {
      workspace_type: "single-light",
      kit: "local-starter",
      language: "zh",
      pack: "general"
    },
    strategy: "preserve-names",
    paths: {
      formal_source: "输出/确认成果/",
      business_work_area: "输出/草稿/"
    },
    actions: [
      { type: "ensure_dir", path: ".starwork/" },
      { type: "write_workspace_state" }
    ]
  }, null, 2)}\n`, "utf8");

  const result = runCommand(["upgrade", "--target", dir, "--blueprint", path.join(blueprintDir, "upgrade-blueprint.json"), "--yes"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /已经是 StarWork 工作台/);
});

test("upgrade rejects unsafe blueprint paths", () => {
  const dir = tempDir();
  const blueprintDir = tempDir();
  fs.writeFileSync(path.join(blueprintDir, "upgrade-blueprint.json"), `${JSON.stringify({
    schema: "starwork.upgrade_blueprint.v0.1",
    base: {
      workspace_type: "single-light",
      kit: "local-starter",
      language: "zh",
      pack: "general"
    },
    strategy: "preserve-names",
    paths: {
      formal_source: "../escape/",
      business_work_area: "参考资料/"
    },
    actions: [
      { type: "ensure_dir", path: ".starwork/" },
      { type: "write_workspace_state" }
    ]
  }, null, 2)}\n`, "utf8");

  const result = runCommand(["upgrade", "--target", dir, "--blueprint", path.join(blueprintDir, "upgrade-blueprint.json"), "--yes"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /不能跳出工作区/);
});

test("adapt creates a Claude adapter and records it in workspace state", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const result = runCommand(["adapt", "claude", "--target", dir, "--yes"]);
  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  const claude = fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8");

  assert.equal(result.status, 0);
  assert.match(claude, /StarWork Adapter for Claude Code/);
  assert.equal(state.adapters[0].id, "claude");
});

test("adapt creates Cursor rules", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const result = runCommand(["adapt", "--agent", "cursor", "--target", dir, "--yes"]);
  const cursorRule = fs.readFileSync(path.join(dir, ".cursor", "rules", "starwork.mdc"), "utf8");

  assert.equal(result.status, 0);
  assert.match(cursorRule, /alwaysApply: true/);
  assert.match(cursorRule, /AGENTS\.md/);
});

test("pack install adds content creator pack to an existing workspace", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const install = runCommand(["pack", "install", "content-creator", "--target", dir, "--yes"]);
  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  const agents = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  const doctor = runDoctor(["--target", dir]);

  assert.equal(install.status, 0);
  assert.deepEqual(state.packs.map((pack) => pack.id), ["general", "content-creator"]);
  assert.equal(state.paths.formal_source, "发布记录/");
  assert.equal(fs.existsSync(path.join(dir, "发布记录", "README.md")), true);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "packs", "content-creator", "templates", "content-brief.md")), true);
  assert.match(agents, /StarWork Pack: content-creator/);
  assert.equal(doctor.status, 0);
});

test("pack install refuses unsupported workspace types", () => {
  const dir = tempDir();
  runInit(["--type", "hub", "--target", dir, "--yes"]);

  const result = runCommand(["pack", "install", "content-creator", "--target", dir, "--yes"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /不支持工作区类型 hub/);
});

test("pack install skips already installed packs", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const result = runCommand(["pack", "install", "general", "--target", dir, "--yes"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /已安装/);
});
