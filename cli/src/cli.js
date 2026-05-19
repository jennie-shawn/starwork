const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PRODUCT_ROOT = path.resolve(__dirname, "..", "..");

const WORKSPACE_TYPES = {
  "single-light": {
    label: "轻量单项目",
    kit: "local-starter",
    defaultPack: "general",
    description: "适合放资料、写草稿、整理最终成果。"
  },
  "single-matter": {
    label: "长期单项目",
    kit: "local-matter",
    defaultPack: "general",
    description: "适合需要事项追踪、跨会话接力、长期沉淀过程的项目。"
  },
  hub: {
    label: "多项目管理中枢",
    kit: "hub",
    defaultPack: "hub-management",
    description: "适合统一管理身份、教训、知识、skills 和多个项目。"
  }
};

const SPAWN_MODES = {
  starter: {
    label: "轻量项目",
    workspaceType: "satellite-starter",
    kit: "satellite-starter",
    formalSource: "输出/确认成果/",
    businessWorkArea: "参考资料/"
  },
  matter: {
    label: "事项型项目",
    workspaceType: "satellite-matter",
    kit: "satellite-matter",
    formalSource: "输出/确认成果/",
    businessWorkArea: "事项/"
  }
};

const PACK_LABELS = {
  general: "通用工作",
  "content-creator": "自媒体内容创作",
  "hub-management": "多项目中枢管理"
};

const ADAPTERS = {
  codex: {
    label: "Codex",
    path: null
  },
  claude: {
    label: "Claude Code",
    path: "CLAUDE.md"
  },
  cursor: {
    label: "Cursor",
    path: path.join(".cursor", "rules", "starwork.mdc")
  },
  trae: {
    label: "Trae",
    path: path.join(".trae", "rules", "starwork.md")
  }
};

async function run(argv) {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    await init(argv.slice(1));
    return;
  }

  if (command === "doctor") {
    const result = doctor(argv.slice(1));
    process.exitCode = result.exitCode;
    return;
  }

  if (command === "spawn") {
    await spawnWorkspace(argv.slice(1));
    return;
  }

  if (command === "adapt") {
    await adapt(argv.slice(1));
    return;
  }

  if (command === "pack") {
    await packCommand(argv.slice(1));
    return;
  }

  throw new Error(`未知命令：${command}`);
}

async function init(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }
  const targetDir = path.resolve(options.target || process.cwd());

  if (findWorkspaceRoot(targetDir)) {
    console.log("当前目录看起来已经位于 StarWork 工作台内。");
    console.log("你可以运行 starwork doctor 检查状态；v0.1 的 init 暂不处理升级。");
    return;
  }

  const workspaceType = options.type || await chooseWorkspaceType(options);
  const workspaceConfig = WORKSPACE_TYPES[workspaceType];
  if (!workspaceConfig) {
    throw new Error(`不支持的工作区类型：${workspaceType}`);
  }

  const packId = options.pack || await choosePack(workspaceType, workspaceConfig, options);
  const language = options.language || getKitLanguage(workspaceConfig.kit);
  const pack = loadPack(packId, language);
  validatePack(pack, workspaceType);

  const workspaceName = options.name || path.basename(targetDir);
  const formalSource = options.formalSource || pack.overrides?.formal_source || getKitDefaultFormalSource(workspaceConfig.kit);

  const plan = buildInitPlan({
    targetDir,
    workspaceName,
    workspaceType,
    workspaceConfig,
    pack,
    formalSource
  });

  printPlan(plan, options.dryRun);

  if (options.dryRun) {
    return;
  }

  if (!options.yes && process.stdin.isTTY) {
    const ok = await confirm("是否执行初始化？", true);
    if (!ok) {
      console.log("已取消，没有写入任何文件。");
      return;
    }
  } else if (!options.yes && !process.stdin.isTTY) {
    throw new Error("非交互环境需要传入 --yes 或 --dry-run。");
  }

  applyPlan(plan);
  console.log("");
  console.log("StarWork 工作台已创建。");
  console.log("");
  console.log("下一步建议：");
  console.log("1. 运行 starwork doctor 检查工作区。");
  console.log("2. 打开 AGENTS.md，确认 Agent 入口规则。");
  console.log("3. 如需生成特定 Agent 适配文件，后续运行 starwork adapt。");
}

async function spawnWorkspace(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printSpawnHelp();
    return;
  }
  if (options.pack) {
    throw new Error("spawn v0.1 暂不支持 --pack。请先创建项目，再运行 starwork pack install。");
  }
  if (!options.target) {
    throw new Error("spawn 需要指定 --target <path>，避免误把新项目写进当前目录。");
  }

  const hubRoot = resolveHubRoot(options.hub || process.cwd());
  const hubState = readWorkspaceState(hubRoot);
  assertHealthyHub(hubRoot, hubState);

  const blueprint = options.blueprint ? loadSpawnBlueprint(options.blueprint) : null;
  const projectName = options.name || blueprint?.name || path.basename(path.resolve(options.target || process.cwd()));
  const targetDir = path.resolve(options.target || path.join(process.cwd(), slugifyProjectId(projectName) || "project"));
  assertSpawnTargetIsEmpty(targetDir);

  const mode = options.mode || blueprint?.base?.mode || "matter";
  const baseModeConfig = SPAWN_MODES[mode];
  if (!baseModeConfig) {
    throw new Error(`不支持的 spawn 模式：${mode}。可选值：starter、matter。`);
  }
  validateSpawnBlueprintForMode(blueprint, mode, baseModeConfig);
  const modeConfig = applySpawnBlueprintModeConfig(baseModeConfig, blueprint);

  const status = options.status || "active";
  if (!["active", "paused"].includes(status)) {
    throw new Error("--status 只支持 active 或 paused。");
  }

  const projectId = options.id || blueprint?.project_id || slugifyProjectId(projectName) || slugifyProjectId(path.basename(targetDir)) || "project";
  const plan = buildSpawnPlan({
    hubRoot,
    hubState,
    targetDir,
    projectName,
    projectId,
    status,
    mode,
    modeConfig,
    blueprint
  });

  printSpawnPlan(plan, options.dryRun);
  if (options.dryRun) return;

  await confirmOrThrow(options, "是否从中枢生成新项目工作台？");
  applyPlan(plan);
  console.log("");
  console.log("StarWork 项目工作台已生成。");
  console.log("");
  console.log("下一步建议：");
  console.log(`1. 运行 starwork doctor --target ${plan.targetDir}`);
  console.log("2. 打开 _系统/上下文/当前项目.md，补充项目目标和近期重点。");
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes" || arg === "-y") {
      options.yes = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "--agent") {
      options.agent = readValue(argv, ++i, arg);
    } else if (arg === "--hub") {
      options.hub = readValue(argv, ++i, arg);
    } else if (arg === "--blueprint") {
      options.blueprint = readValue(argv, ++i, arg);
    } else if (arg === "--mode") {
      options.mode = readValue(argv, ++i, arg);
    } else if (arg === "--id") {
      options.id = readValue(argv, ++i, arg);
    } else if (arg === "--status") {
      options.status = readValue(argv, ++i, arg);
    } else if (arg === "--type") {
      options.type = readValue(argv, ++i, arg);
    } else if (arg === "--pack") {
      options.pack = readValue(argv, ++i, arg);
    } else if (arg === "--name") {
      options.name = readValue(argv, ++i, arg);
    } else if (arg === "--formal-source") {
      options.formalSource = readValue(argv, ++i, arg);
    } else if (arg === "--language") {
      options.language = readValue(argv, ++i, arg);
    } else if (arg === "--target") {
      options.target = readValue(argv, ++i, arg);
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (!arg.startsWith("-")) {
      if (!options._) options._ = [];
      options._.push(arg);
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }
  return options;
}

async function adapt(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printAdaptHelp();
    return;
  }

  const targetDir = path.resolve(options.target || process.cwd());
  const workspaceRoot = requireWorkspaceRoot(targetDir);
  const state = readWorkspaceState(workspaceRoot);
  const agent = options.agent || options._?.[0] || "codex";
  const agents = agent === "all" ? Object.keys(ADAPTERS) : [agent];

  for (const id of agents) {
    if (!ADAPTERS[id]) {
      throw new Error(`不支持的 Agent 适配目标：${id}`);
    }
  }

  const health = doctorCollect(workspaceRoot);
  if (health.summary.fail > 0) {
    throw new Error("当前工作台未通过 doctor 检查，请先修复阻塞问题。");
  }

  const plan = buildAdaptPlan({ workspaceRoot, state, agents });
  printGenericPlan(options.dryRun ? "适配预览（dry run）：" : "适配计划：", plan.actions);

  if (options.dryRun) return;
  await confirmOrThrow(options, "是否执行适配？");
  applyPlan(plan);
  console.log("");
  console.log("StarWork Agent 适配已完成。");
  console.log("下一步建议：运行 starwork doctor 再检查一次工作台。");
}

async function packCommand(argv) {
  const subcommand = argv[0];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printPackHelp();
    return;
  }
  if (subcommand !== "install") {
    throw new Error(`未知 pack 子命令：${subcommand}`);
  }
  await packInstall(argv.slice(1));
}

async function packInstall(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printPackInstallHelp();
    return;
  }

  const packId = options.pack || options._?.[0];
  if (!packId) {
    throw new Error("pack install 需要指定 Pack ID。");
  }

  const targetDir = path.resolve(options.target || process.cwd());
  const workspaceRoot = requireWorkspaceRoot(targetDir);
  const state = readWorkspaceState(workspaceRoot);

  if (state.packs?.some((pack) => pack.id === packId)) {
    console.log(`Pack ${packId} 已安装，无需重复安装。`);
    return;
  }

  const health = doctorCollect(workspaceRoot);
  if (health.summary.fail > 0) {
    throw new Error("当前工作台未通过 doctor 检查，请先修复阻塞问题。");
  }

  const pack = loadPack(packId, state.language || "zh");
  validatePack(pack, state.workspace_type);
  const plan = buildPackInstallPlan({ workspaceRoot, state, pack });

  printGenericPlan(options.dryRun ? "Pack 安装预览（dry run）：" : "Pack 安装计划：", plan.actions);
  if (options.dryRun) return;

  await confirmOrThrow(options, `是否安装 Pack ${pack.id}？`);
  applyPlan(plan);
  console.log("");
  console.log(`Pack ${pack.name || pack.id} 已安装。`);
  console.log("下一步建议：运行 starwork doctor 检查 Pack 落地结果。");
}

function doctor(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printDoctorHelp();
    return { exitCode: 0 };
  }

  const targetDir = path.resolve(options.target || process.cwd());
  const result = createDoctorResult(targetDir);

  if (!fs.existsSync(targetDir)) {
    addCheck(result, "workspace.target.exists", "fail", `目标目录不存在：${targetDir}`);
    return finishDoctor(result, options);
  }

  const workspaceRoot = findWorkspaceRoot(targetDir);
  if (!workspaceRoot) {
    const legacy = detectLegacyWorkspace(targetDir);
    if (legacy.candidate) {
      result.upgrade = buildUpgradeGuidance(targetDir, legacy);
      addCheck(result, "workspace.state.exists", "fail", "这是一个可升级的历史模板工作区，但缺少 .starwork/workspace.json。", legacy.primaryTrace);
      addLegacyChecks(result, legacy);
    } else {
      const trace = findStarWorkTrace(targetDir);
      if (trace) {
        addCheck(result, "workspace.state.exists", "fail", "疑似 StarWork 工作台，但缺少 .starwork/workspace.json。", trace);
      } else {
        addCheck(result, "workspace.state.exists", "fail", "当前目录不是 StarWork 工作台。请先运行 starwork init。");
      }
    }
    return finishDoctor(result, options);
  }

  result.workspace_root = workspaceRoot;
  const statePath = path.join(workspaceRoot, ".starwork", "workspace.json");
  addCheck(result, "workspace.state.exists", "pass", ".starwork/workspace.json exists", ".starwork/workspace.json");

  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    addCheck(result, "workspace.state.parse", "fail", `无法解析 workspace state：${error.message}`, ".starwork/workspace.json");
    return finishDoctor(result, options);
  }

  result.workspace = {
    core: state.core || null,
    workspace_type: state.workspace_type || null,
    kit: state.kit || null,
    language: state.language || null,
    packs: Array.isArray(state.packs) ? state.packs.map((pack) => pack.id).filter(Boolean) : []
  };

  checkWorkspaceState(result, state);
  checkKit(result, workspaceRoot, state);
  checkCoreRoles(result, workspaceRoot, state);
  checkPackInstallations(result, workspaceRoot, state);
  checkBlueprintCustomization(result, workspaceRoot, state);

  return finishDoctor(result, options);
}

function doctorCollect(targetDir) {
  const result = createDoctorResult(targetDir);
  const workspaceRoot = findWorkspaceRoot(targetDir);
  if (!workspaceRoot) {
    addCheck(result, "workspace.state.exists", "fail", "当前目录不是 StarWork 工作台。请先运行 starwork init。");
    return result;
  }
  result.workspace_root = workspaceRoot;
  const statePath = path.join(workspaceRoot, ".starwork", "workspace.json");
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    addCheck(result, "workspace.state.parse", "fail", `无法解析 workspace state：${error.message}`, ".starwork/workspace.json");
    return result;
  }
  result.workspace = {
    core: state.core || null,
    workspace_type: state.workspace_type || null,
    kit: state.kit || null,
    language: state.language || null,
    packs: Array.isArray(state.packs) ? state.packs.map((pack) => pack.id).filter(Boolean) : []
  };
  checkWorkspaceState(result, state);
  checkKit(result, workspaceRoot, state);
  checkCoreRoles(result, workspaceRoot, state);
  checkPackInstallations(result, workspaceRoot, state);
  checkBlueprintCustomization(result, workspaceRoot, state);
  result.ok = result.summary.fail === 0;
  result.strict_ok = result.ok;
  result.exitCode = result.ok ? 0 : 1;
  return result;
}

function createDoctorResult(targetDir) {
  return {
    schema: "starwork.doctor.result.v0.1",
    ok: false,
    strict_ok: false,
    workspace_root: null,
    target: targetDir,
    workspace: null,
    upgrade: null,
    summary: {
      pass: 0,
      info: 0,
      warn: 0,
      fail: 0
    },
    checks: [],
    exitCode: 1
  };
}

function requireWorkspaceRoot(targetDir) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`目标目录不存在：${targetDir}`);
  }
  const workspaceRoot = findWorkspaceRoot(targetDir);
  if (!workspaceRoot) {
    throw new Error("当前目录不是 StarWork 工作台。请先运行 starwork init。");
  }
  return workspaceRoot;
}

function readWorkspaceState(workspaceRoot) {
  const statePath = path.join(workspaceRoot, ".starwork", "workspace.json");
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    throw new Error(`无法读取 workspace state：${error.message}`);
  }
}

async function confirmOrThrow(options, question) {
  if (options.dryRun) return;
  if (!options.yes && process.stdin.isTTY) {
    const ok = await confirm(question, true);
    if (!ok) {
      throw new Error("已取消，没有写入任何文件。");
    }
  } else if (!options.yes && !process.stdin.isTTY) {
    throw new Error("非交互环境需要传入 --yes 或 --dry-run。");
  }
}

function buildAdaptPlan({ workspaceRoot, state, agents }) {
  const actions = [];
  for (const agent of agents) {
    const config = ADAPTERS[agent];
    if (!config.path) continue;
    actions.push(fileAction(workspaceRoot, config.path, renderAdapterContent(agent, state)));
  }

  const nextState = {
    ...state,
    adapters: mergeInstalledRecords(state.adapters, agents)
  };
  actions.push(overwriteFileAction(workspaceRoot, path.join(".starwork", "workspace.json"), `${JSON.stringify(nextState, null, 2)}\n`));

  return {
    targetDir: workspaceRoot,
    actions: dedupeActions(actions)
  };
}

function renderAdapterContent(agent, state) {
  const rolePaths = getCoreRolePaths(state);
  const adapterName = ADAPTERS[agent].label;
  if (agent === "cursor") {
    return `---\ndescription: StarWork workspace rules\nalwaysApply: true\n---\n\n# StarWork Adapter for ${adapterName}\n\nThis workspace follows StarWork Core ${state.core || "0.1"}.\n\nRead first:\n\n1. AGENTS.md\n2. ${rolePaths.projectStatus}\n3. ${rolePaths.currentWork}\n\nFollow AGENTS.md as the source of truth. Do not overwrite user content silently.\n`;
  }
  return `# StarWork Adapter for ${adapterName}\n\nThis workspace follows StarWork Core ${state.core || "0.1"}.\n\n## Read First\n\n1. AGENTS.md\n2. ${rolePaths.projectStatus}\n3. ${rolePaths.currentWork}\n\n## Rule\n\nAGENTS.md is the source of truth. This file is only an adapter entrypoint for ${adapterName}.\n\nDo not overwrite user content silently. When unsure, ask before changing identity, lessons, shared knowledge, formal outputs, or synced repository content.\n`;
}

function buildPackInstallPlan({ workspaceRoot, state, pack }) {
  const variables = {
    workspace: {
      name: path.basename(workspaceRoot),
      type: state.workspace_type
    },
    pack,
    paths: pack.paths || {},
    overrides: pack.overrides || {}
  };
  const actions = [];

  for (const rolePath of Object.values(pack.paths || {})) {
    actions.push(directoryAction(workspaceRoot, rolePath));
  }

  for (const seed of pack.seed || []) {
    const source = path.join(pack.__dir, seed.from);
    if (!fs.existsSync(source)) {
      throw new Error(`Pack seed 不存在：${pack.id}/${seed.from}`);
    }
    const content = renderText(fs.readFileSync(source, "utf8"), variables);
    actions.push(fileAction(workspaceRoot, seed.to, content));
  }

  for (const template of pack.templates || []) {
    const source = path.join(pack.__dir, template.from);
    if (!fs.existsSync(source)) {
      throw new Error(`Pack template 不存在：${pack.id}/${template.from}`);
    }
    const target = path.join(".starwork", "packs", pack.id, "templates", path.basename(template.from));
    const content = renderText(fs.readFileSync(source, "utf8"), variables);
    actions.push(fileAction(workspaceRoot, target, content));
  }

  const agentsPath = path.join(workspaceRoot, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    throw new Error("缺少 AGENTS.md，无法安装 Pack 规则。");
  }
  const agents = fs.readFileSync(agentsPath, "utf8");
  const rulesSection = renderInstalledPackRules(pack, variables);
  if (rulesSection.trim() && !agents.includes(`Pack: ${pack.id}`)) {
    actions.push(overwriteFileAction(workspaceRoot, "AGENTS.md", `${agents.trim()}\n\n${rulesSection.trim()}\n`));
  }

  const nextState = {
    ...state,
    packs: [
      ...(Array.isArray(state.packs) ? state.packs : []),
      {
        id: pack.id,
        version: pack.version || "0.1.0",
        installed_at: new Date().toISOString()
      }
    ],
    paths: {
      ...(state.paths || {}),
      formal_source: pack.overrides?.formal_source || state.paths?.formal_source,
      business_work_area: pack.overrides?.business_work_area || state.paths?.business_work_area
    }
  };
  actions.push(overwriteFileAction(workspaceRoot, path.join(".starwork", "workspace.json"), `${JSON.stringify(nextState, null, 2)}\n`));

  return {
    targetDir: workspaceRoot,
    actions: dedupeActions(actions)
  };
}

function renderInstalledPackRules(pack, variables) {
  const rules = renderPackRules(pack, variables);
  if (!rules.trim()) return "";
  return `## 场景规则\n\n<!-- StarWork Pack: ${pack.id} -->\n\n${rules.trim()}`;
}

function mergeInstalledRecords(existing, ids) {
  const current = Array.isArray(existing) ? existing.filter((item) => item?.id) : [];
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];
  for (const id of ids) {
    if (seen.has(id)) continue;
    merged.push({
      id,
      installed_at: new Date().toISOString()
    });
    seen.add(id);
  }
  return merged;
}

function checkWorkspaceState(result, state) {
  if (state.schema === "starwork.workspace.v0.1") {
    addCheck(result, "workspace.state.schema", "pass", "workspace schema is starwork.workspace.v0.1", ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.schema", "fail", "workspace schema 不是 starwork.workspace.v0.1。", ".starwork/workspace.json");
  }

  if (state.core === "0.1") {
    addCheck(result, "workspace.state.core", "pass", "Core version is 0.1", ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.core", "fail", "workspace core 必须兼容 0.1。", ".starwork/workspace.json");
  }

  if (["single-light", "single-matter", "hub", "satellite-starter", "satellite-matter"].includes(state.workspace_type)) {
    addCheck(result, "workspace.state.type", "pass", `workspace_type is ${state.workspace_type}`, ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.type", "fail", "workspace_type 必须是 single-light、single-matter、hub、satellite-starter 或 satellite-matter。", ".starwork/workspace.json");
  }

  if (state.kit) {
    addCheck(result, "workspace.state.kit", "pass", `kit is ${state.kit}`, ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.kit", "fail", "workspace state 缺少 kit。", ".starwork/workspace.json");
  }

  if (state.language) {
    addCheck(result, "workspace.state.language", "pass", `language is ${state.language}`, ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.language", "fail", "workspace state 缺少 language。", ".starwork/workspace.json");
  }

  if (Array.isArray(state.packs)) {
    addCheck(result, "workspace.state.packs", "pass", `packs count is ${state.packs.length}`, ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.packs", "fail", "workspace state 的 packs 必须是数组。", ".starwork/workspace.json");
  }

  if (state.paths?.formal_source) {
    addCheck(result, "workspace.state.formal_source", "pass", `formal source is ${state.paths.formal_source}`, ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.formal_source", "fail", "workspace state 缺少 paths.formal_source。", ".starwork/workspace.json");
  }

  if (state.paths?.business_work_area) {
    addCheck(result, "workspace.state.business_work_area", "pass", `business work area is ${state.paths.business_work_area}`, ".starwork/workspace.json");
  } else {
    addCheck(result, "workspace.state.business_work_area", "fail", "workspace state 缺少 paths.business_work_area。", ".starwork/workspace.json");
  }
}

function checkKit(result, workspaceRoot, state) {
  if (!state.kit) return;

  const kitDir = path.join(PRODUCT_ROOT, "core", "kits", state.kit);
  if (!fs.existsSync(kitDir)) {
    addCheck(result, "kit.source.exists", "fail", `找不到 Kit 源目录：${state.kit}`);
    return;
  }
  addCheck(result, "kit.source.exists", "pass", `Kit source exists: ${state.kit}`);

  const allowedKits = {
    "single-light": ["local-starter"],
    "single-matter": ["local-matter"],
    hub: ["hub"],
    "satellite-starter": ["satellite-starter"],
    "satellite-matter": ["satellite-matter"]
  };
  const allowed = allowedKits[state.workspace_type];
  if (allowed && allowed.includes(state.kit)) {
    addCheck(result, "kit.workspace_type.match", "pass", `${state.kit} matches ${state.workspace_type}`);
  } else {
    addCheck(result, "kit.workspace_type.match", "fail", `Kit ${state.kit} 与工作区类型 ${state.workspace_type || "(missing)"} 不匹配。`);
  }

  const files = walkFiles(kitDir);
  const missing = [];
  for (const source of files) {
    const relativePath = path.relative(kitDir, source);
    if (!fs.existsSync(path.join(workspaceRoot, relativePath))) {
      missing.push(relativePath);
    }
  }
  if (missing.length === 0) {
    addCheck(result, "kit.files.complete", "pass", `Kit files are complete: ${state.kit}`);
  } else {
    addCheck(result, "kit.files.complete", "fail", `Kit 缺少 ${missing.length} 个文件。`, missing.slice(0, 5).join(", "));
  }
}

function checkCoreRoles(result, workspaceRoot, state) {
  checkPathExists(result, workspaceRoot, "AGENTS.md", "core.entry_rules.exists", "Agent entry rules exist", "缺少 Agent 入口规则 AGENTS.md。");

  const rolePaths = getCoreRolePaths(state);
  checkPathExists(result, workspaceRoot, rolePaths.projectStatus, "core.project_status.exists", "Project status exists", "缺少项目状态文件。");
  checkPathExists(result, workspaceRoot, rolePaths.currentWork, "core.current_work.exists", "Current work exists", "缺少当前工作入口文件。");

  if (state.paths?.formal_source) {
    checkPathExists(result, workspaceRoot, state.paths.formal_source, "core.formal_source.exists", "Formal source exists", "缺少 workspace state 声明的正式事实源。");
  }

  if (state.paths?.business_work_area) {
    checkPathExists(result, workspaceRoot, state.paths.business_work_area, "core.business_work_area.exists", "Business work area exists", "缺少 workspace state 声明的业务工作区。");
  }
}

function getCoreRolePaths(state) {
  const kit = state.kit || "";
  if (kit.startsWith("satellite-")) {
    return {
      projectStatus: "_系统/上下文/当前项目.md",
      currentWork: "_系统/任务/当前工作.md"
    };
  }
  return {
    projectStatus: "_系统/上下文/项目状态.md",
    currentWork: "_系统/任务/当前工作.md"
  };
}

function checkPackInstallations(result, workspaceRoot, state) {
  if (!Array.isArray(state.packs)) return;
  for (const installedPack of state.packs) {
    if (!installedPack?.id) {
      addCheck(result, "pack.id.exists", "fail", "已安装 Pack 缺少 id。", ".starwork/workspace.json");
      continue;
    }

    let pack;
    try {
      pack = loadPack(installedPack.id, state.language || "zh");
    } catch (error) {
      addCheck(result, "pack.source.exists", "fail", `无法读取 Pack ${installedPack.id}：${error.message}`);
      continue;
    }

    addCheck(result, "pack.source.exists", "pass", `Pack source exists: ${installedPack.id}`);

    if (pack.compatible_core === state.core) {
      addCheck(result, "pack.core.compatible", "pass", `${installedPack.id} is compatible with Core ${state.core}`);
    } else {
      addCheck(result, "pack.core.compatible", "fail", `Pack ${installedPack.id} 不兼容 Core ${state.core || "(missing)"}。`);
    }

    if (pack.supports_workspace_types?.includes(state.workspace_type)) {
      addCheck(result, "pack.workspace_type.supported", "pass", `${installedPack.id} supports ${state.workspace_type}`);
    } else {
      addCheck(result, "pack.workspace_type.supported", "fail", `Pack ${installedPack.id} 不支持工作区类型 ${state.workspace_type || "(missing)"}。`);
    }

    for (const rolePath of Object.values(pack.paths || {})) {
      checkPathExists(result, workspaceRoot, rolePath, "pack.paths.exist", `Pack path exists: ${rolePath}`, `Pack ${installedPack.id} 缺少目录：${rolePath}`);
    }

    for (const seed of pack.seed || []) {
      checkPathExists(result, workspaceRoot, seed.to, "pack.seed.installed", `Pack seed exists: ${seed.to}`, `Pack ${installedPack.id} 缺少 seed 文件：${seed.to}`);
    }

    for (const template of pack.templates || []) {
      const relativePath = path.join(".starwork", "packs", pack.id, "templates", path.basename(template.from));
      checkPathExists(result, workspaceRoot, relativePath, "pack.templates.installed", `Pack template exists: ${relativePath}`, `Pack ${installedPack.id} 缺少模板：${relativePath}`);
    }
  }
}

function checkBlueprintCustomization(result, workspaceRoot, state) {
  const customization = state.customization;
  if (!customization) return;
  if (customization.type !== "spawn_blueprint") return;

  if (customization.schema === "starwork.spawn_blueprint.v0.1") {
    addCheck(result, "blueprint.schema", "pass", "Blueprint schema is starwork.spawn_blueprint.v0.1", ".starwork/workspace.json");
  } else {
    addCheck(result, "blueprint.schema", "fail", "Blueprint customization schema 不正确。", ".starwork/workspace.json");
  }

  for (const folder of customization.folders || []) {
    checkPathExists(result, workspaceRoot, folder, "blueprint.folder.exists", `Blueprint folder exists: ${folder}`, `Blueprint 缺少定制目录：${folder}`);
  }

  for (const seed of customization.seed || []) {
    if (!seed?.to) continue;
    checkPathExists(result, workspaceRoot, seed.to, "blueprint.seed.exists", `Blueprint seed exists: ${seed.to}`, `Blueprint 缺少 seed 文件：${seed.to}`);
  }

  const agentsPath = path.join(workspaceRoot, "AGENTS.md");
  const agents = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, "utf8") : "";
  for (const rule of customization.agent_rules || []) {
    if (!rule?.slot) continue;
    if (agents.includes(`StarWork Blueprint: ${rule.slot}`)) {
      addCheck(result, "blueprint.rule.injected", "pass", `Blueprint rule injected: ${rule.slot}`, "AGENTS.md");
    } else {
      addCheck(result, "blueprint.rule.injected", "fail", `Blueprint 规则未注入 AGENTS.md：${rule.slot}`, "AGENTS.md");
    }
  }
}

function checkPathExists(result, workspaceRoot, relativePath, id, passMessage, failMessage) {
  const normalized = normalizeRelativePath(relativePath);
  if (fs.existsSync(path.join(workspaceRoot, normalized))) {
    addCheck(result, id, "pass", passMessage, normalized);
  } else {
    addCheck(result, id, "fail", failMessage, normalized);
  }
}

function normalizeRelativePath(relativePath) {
  return String(relativePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeSafeRelativePath(relativePath, label) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new Error(`${label} 必须是非空相对路径。`);
  }
  const raw = relativePath.replace(/\\/g, "/").trim();
  if (path.isAbsolute(raw) || raw.startsWith("~")) {
    throw new Error(`${label} 不能使用绝对路径或 ~：${relativePath}`);
  }
  const normalized = path.posix.normalize(raw.replace(/^\.\/+/, ""));
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`${label} 不能跳出工作区：${relativePath}`);
  }
  if (normalized === ".git" || normalized.startsWith(".git/")) {
    throw new Error(`${label} 不能写入 .git：${relativePath}`);
  }
  return normalized;
}

function normalizeSafeSourcePath(relativePath, sourceRoot, label) {
  const normalized = normalizeSafeRelativePath(relativePath, label);
  const resolvedRoot = path.resolve(sourceRoot);
  const resolved = path.resolve(resolvedRoot, normalized);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`${label} 不能跳出 blueprint 目录：${relativePath}`);
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`${label} 文件不存在：${relativePath}`);
  }
  return resolved;
}

function findStarWorkTrace(dir) {
  const traces = [
    "AGENTS.md",
    "CLAUDE.md",
    "_系统",
    "_system",
    "事项",
    "matters",
    "参考资料",
    "references",
    "输出",
    "outputs"
  ];
  return traces.find((trace) => fs.existsSync(path.join(dir, trace))) || null;
}

function detectLegacyWorkspace(dir) {
  const groups = {
    entryRules: ["AGENTS.md", "CLAUDE.md", ".cursorrules"],
    system: ["_系统", "_system", "system"],
    matters: ["事项", "matters"],
    referencesZh: ["参考资料", "资料", "素材"],
    referencesEn: ["references", "reference"],
    outputsZh: ["输出", "成果"],
    outputsEn: ["outputs", "output"],
    identityRoot: ["identity"],
    lessonsRoot: ["lessons"],
    identitySystemZh: ["_系统/身份"],
    lessonsSystemZh: ["_系统/教训"],
    identitySystemEn: ["_system/identity"],
    lessonsSystemEn: ["_system/lessons"]
  };
  const found = {};
  for (const [key, candidates] of Object.entries(groups)) {
    found[key] = existingRelativePaths(dir, candidates);
  }

  const references = [...found.referencesZh, ...found.referencesEn];
  const outputs = [...found.outputsZh, ...found.outputsEn];
  const hasSystem = found.system.length > 0;
  const hasEntry = found.entryRules.length > 0;
  const hasMatters = found.matters.length > 0;
  const hasIdentityOrLessons = [
    ...found.identityRoot,
    ...found.lessonsRoot,
    ...found.identitySystemZh,
    ...found.lessonsSystemZh,
    ...found.identitySystemEn,
    ...found.lessonsSystemEn
  ].length > 0;

  const signals = [
    hasEntry,
    hasSystem,
    hasMatters,
    references.length > 0,
    outputs.length > 0,
    hasIdentityOrLessons
  ].filter(Boolean).length;
  const candidate = signals >= 2 || (references.length > 0 && outputs.length > 0);
  const language = inferLegacyLanguage(found);
  const workspaceType = hasMatters ? "single-matter" : "single-light";
  const primaryTrace = [
    ...found.entryRules,
    ...found.system,
    ...found.matters,
    ...references,
    ...outputs
  ][0] || null;

  return {
    candidate,
    confidence: signals >= 4 ? "high" : "medium",
    language,
    workspaceType,
    pack: "general",
    primaryTrace,
    found,
    references,
    outputs
  };
}

function existingRelativePaths(root, candidates) {
  return candidates.filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
}

function inferLegacyLanguage(found) {
  const zhScore = Number(found.system.includes("_系统"))
    + Number(found.matters.includes("事项"))
    + found.referencesZh.length
    + found.outputsZh.length
    + found.identitySystemZh.length
    + found.lessonsSystemZh.length;
  const enScore = Number(found.system.includes("_system"))
    + Number(found.matters.includes("matters"))
    + found.referencesEn.length
    + found.outputsEn.length
    + found.identitySystemEn.length
    + found.lessonsSystemEn.length;
  return enScore > zhScore ? "en" : "zh";
}

function buildUpgradeGuidance(targetDir, legacy) {
  const command = [
    "starwork init",
    `--target ${shellQuote(targetDir)}`,
    `--type ${legacy.workspaceType}`,
    `--pack ${legacy.pack}`,
    `--language ${legacy.language}`
  ].join(" ");
  return {
    candidate: true,
    source: "legacy-template",
    confidence: legacy.confidence,
    inferred: {
      language: legacy.language,
      workspace_type: legacy.workspaceType,
      pack: legacy.pack,
      references: legacy.references,
      outputs: legacy.outputs
    },
    next_steps: [
      "先不要移动或删除历史文件。",
      `先运行预览：${command} --dry-run`,
      `确认后再执行：${command} --yes`,
      "执行后重新运行 starwork doctor，检查新增 state、Core 角色和目录边界。"
    ]
  };
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function addLegacyChecks(result, legacy) {
  addCheck(result, "legacy.template.detected", "info", `检测到历史模板升级候选，置信度：${legacy.confidence}。`, legacy.primaryTrace);
  addCheck(result, "legacy.language.inferred", "info", `推测语言：${legacy.language}。`);
  addCheck(result, "legacy.workspace_type.inferred", "info", `推测工作区类型：${legacy.workspaceType}。`);

  if (legacy.references.length) {
    addCheck(result, "legacy.references.detected", "info", `检测到参考资料目录：${legacy.references.join(", ")}。`, legacy.references[0]);
  } else {
    addCheck(result, "legacy.references.detected", "warn", "未检测到常见参考资料目录，升级时可能需要手动指定资料区。");
  }

  if (legacy.outputs.length) {
    addCheck(result, "legacy.outputs.detected", "info", `检测到输出目录：${legacy.outputs.join(", ")}。`, legacy.outputs[0]);
  } else {
    addCheck(result, "legacy.outputs.detected", "warn", "未检测到常见输出目录，升级时可能需要手动指定成果区。");
  }

  if (!legacy.found.entryRules.length) {
    addCheck(result, "legacy.entry_rules.detected", "warn", "未检测到 AGENTS.md、CLAUDE.md 或 Cursor 规则文件，升级后需要补齐 Agent 入口规则。");
  }
}

function addCheck(result, id, level, message, checkPath) {
  result.summary[level] += 1;
  result.checks.push({
    id,
    level,
    message,
    path: checkPath || null
  });
}

function finishDoctor(result, options) {
  result.ok = result.summary.fail === 0;
  result.strict_ok = result.ok && (!options.strict || result.summary.warn === 0);
  result.exitCode = result.strict_ok ? 0 : 1;
  if (options.json) {
    console.log(JSON.stringify(doctorPublicResult(result), null, 2));
  } else {
    printDoctorResult(result, options);
  }
  return result;
}

function doctorPublicResult(result) {
  const { exitCode, target, ...publicResult } = result;
  return publicResult;
}

function printDoctorResult(result, options) {
  console.log("StarWork Doctor");
  console.log("");
  console.log(`Workspace: ${result.workspace_root || result.target}`);
  if (result.workspace) {
    console.log(`Core: ${result.workspace.core || "(unknown)"}`);
    console.log(`Type: ${result.workspace.workspace_type || "(unknown)"}`);
    console.log(`Kit: ${result.workspace.kit || "(unknown)"}`);
    console.log(`Packs: ${result.workspace.packs.length ? result.workspace.packs.join(", ") : "(none)"}`);
  }
  console.log("");
  console.log("Summary:");
  console.log(`  pass: ${result.summary.pass}`);
  console.log(`  info: ${result.summary.info}`);
  console.log(`  warn: ${result.summary.warn}`);
  console.log(`  fail: ${result.summary.fail}`);
  console.log("");

  const visibleChecks = options.verbose
    ? result.checks
    : result.checks.filter((check) => check.level !== "pass");
  if (visibleChecks.length) {
    console.log("Checks:");
    for (const check of visibleChecks) {
      console.log(`  [${check.level}] ${check.id}`);
      console.log(`         ${check.message}`);
      if (check.path) {
        console.log(`         ${check.path}`);
      }
      console.log("");
    }
  }

  if (result.upgrade?.candidate) {
    console.log("Upgrade guidance:");
    console.log(`  检测为：历史模板升级候选（${result.upgrade.confidence} confidence）`);
    console.log(`  建议类型：${result.upgrade.inferred.workspace_type}`);
    console.log(`  建议语言：${result.upgrade.inferred.language}`);
    console.log(`  建议 Pack：${result.upgrade.inferred.pack}`);
    console.log("  下一步：");
    for (const step of result.upgrade.next_steps) {
      console.log(`  - ${step}`);
    }
    console.log("");
  }

  console.log("Result:");
  if (result.summary.fail > 0) {
    console.log("  Workspace has blocking issues.");
  } else if (result.summary.warn > 0) {
    console.log("  Workspace is usable, with warnings.");
  } else {
    console.log("  Workspace is healthy.");
  }
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} 需要一个值。`);
  }
  return value;
}

async function chooseWorkspaceType(options) {
  if (options.yes || !process.stdin.isTTY) {
    return "single-light";
  }
  return choose("你要建立哪种工作区？", [
    ["single-light", "轻量单项目：放资料、写草稿、整理最终成果"],
    ["single-matter", "长期单项目：事项追踪、跨会话接力"],
    ["hub", "多项目管理中枢：统一管理身份、教训、知识、skills 和项目联络"]
  ]);
}

async function choosePack(workspaceType, workspaceConfig, options) {
  if (workspaceType === "hub") {
    return workspaceConfig.defaultPack;
  }

  if (options.yes || !process.stdin.isTTY) {
    return workspaceConfig.defaultPack;
  }

  return choose("你准备用这个工作台做什么？", [
    ["general", "通用工作：资料整理、草稿输出、项目推进"],
    ["content-creator", "自媒体内容创作：账号定位、选题、素材、草稿、发布、复盘"]
  ]);
}

async function choose(question, choices) {
  console.log("");
  console.log(question);
  choices.forEach(([_, label], index) => {
    console.log(`${index + 1}. ${label}`);
  });

  const answer = await ask("请输入序号：");
  const index = Number(answer.trim()) - 1;
  if (!choices[index]) {
    console.log("未识别选择，使用第一项。");
    return choices[0][0];
  }
  return choices[index][0];
}

async function confirm(question, defaultValue) {
  const suffix = defaultValue ? "Y/n" : "y/N";
  const answer = await ask(`${question} (${suffix}) `);
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return normalized === "y" || normalized === "yes";
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function buildInitPlan({ targetDir, workspaceName, workspaceType, workspaceConfig, pack, formalSource }) {
  const kitDir = path.join(PRODUCT_ROOT, "core", "kits", workspaceConfig.kit);
  if (!fs.existsSync(kitDir)) {
    throw new Error(`找不到 Kit：${workspaceConfig.kit}`);
  }

  const actions = [];
  const variables = {
    workspace: {
      name: workspaceName,
      type: workspaceType
    },
    pack,
    paths: pack.paths || {},
    overrides: {
      ...(pack.overrides || {}),
      formal_source: formalSource
    }
  };
  const packRules = renderPackRules(pack, variables);

  for (const source of walkFiles(kitDir)) {
    const relativePath = path.relative(kitDir, source);
    let content = fs.readFileSync(source, "utf8");
    content = renderText(content, variables);
    if (relativePath === "AGENTS.md" && packRules.trim()) {
      content = `${content.trim()}\n\n## 场景规则\n\n${packRules.trim()}\n`;
    }
    actions.push(fileAction(targetDir, relativePath, content));
  }

  for (const rolePath of Object.values(pack.paths || {})) {
    actions.push(directoryAction(targetDir, rolePath));
  }

  for (const seed of pack.seed || []) {
    const source = path.join(pack.__dir, seed.from);
    if (!fs.existsSync(source)) {
      throw new Error(`Pack seed 不存在：${pack.id}/${seed.from}`);
    }
    const content = renderText(fs.readFileSync(source, "utf8"), variables);
    actions.push(fileAction(targetDir, seed.to, content));
  }

  for (const template of pack.templates || []) {
    const source = path.join(pack.__dir, template.from);
    if (!fs.existsSync(source)) {
      throw new Error(`Pack template 不存在：${pack.id}/${template.from}`);
    }
    const target = path.join(".starwork", "packs", pack.id, "templates", path.basename(template.from));
    const content = renderText(fs.readFileSync(source, "utf8"), variables);
    actions.push(fileAction(targetDir, target, content));
  }

  const workspaceState = {
    schema: "starwork.workspace.v0.1",
    core: "0.1",
    workspace_type: workspaceType,
    kit: workspaceConfig.kit,
    packs: [
      {
        id: pack.id,
        version: pack.version || "0.1.0",
        installed_at: new Date().toISOString()
      }
    ],
    language: pack.language || "zh",
    paths: {
      formal_source: formalSource,
      business_work_area: pack.overrides?.business_work_area || formalSource
    },
    created_by: "starwork init"
  };
  actions.push(fileAction(targetDir, path.join(".starwork", "workspace.json"), `${JSON.stringify(workspaceState, null, 2)}\n`));

  return {
    targetDir,
    workspaceName,
    workspaceType,
    workspaceLabel: workspaceConfig.label,
    kit: workspaceConfig.kit,
    pack,
    formalSource,
    actions: dedupeActions(actions)
  };
}

function resolveHubRoot(hubPath) {
  const resolved = path.resolve(hubPath);
  return requireWorkspaceRoot(resolved);
}

function assertHealthyHub(hubRoot, hubState) {
  if (hubState.workspace_type !== "hub" || hubState.kit !== "hub") {
    throw new Error("spawn 必须从多项目管理中枢工作台执行。请先运行 starwork init --type hub。");
  }
  const health = doctorCollect(hubRoot);
  if (health.summary.fail > 0) {
    throw new Error("Hub 工作台未通过 doctor 检查，请先修复阻塞问题。");
  }
  const required = [
    "项目/registry.json",
    "identity",
    "lessons",
    "skills",
    "知识"
  ];
  for (const relativePath of required) {
    if (!fs.existsSync(path.join(hubRoot, relativePath))) {
      throw new Error(`Hub 缺少必要资源：${relativePath}`);
    }
  }
}

function assertSpawnTargetIsEmpty(targetDir) {
  const existingWorkspace = fs.existsSync(targetDir) ? findWorkspaceRoot(targetDir) : null;
  if (existingWorkspace) {
    throw new Error("目标目录已经位于 StarWork 工作台内，请换一个空目录。");
  }
  if (!fs.existsSync(targetDir)) return;
  if (!fs.statSync(targetDir).isDirectory()) {
    throw new Error("spawn 目标必须是目录。");
  }
  const entries = fs.readdirSync(targetDir).filter((entry) => entry !== ".DS_Store");
  if (entries.length > 0) {
    throw new Error("spawn v0.1 只写入不存在或空目录，目标目录已有内容。");
  }
}

function loadSpawnBlueprint(blueprintPath) {
  const filePath = path.resolve(blueprintPath);
  let blueprint;
  try {
    blueprint = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`无法读取 blueprint：${error.message}`);
  }
  if (blueprint.schema !== "starwork.spawn_blueprint.v0.1") {
    throw new Error("blueprint schema 必须是 starwork.spawn_blueprint.v0.1。");
  }
  if (!blueprint.name || typeof blueprint.name !== "string") {
    throw new Error("blueprint 缺少项目名称 name。");
  }
  if (!blueprint.base || typeof blueprint.base !== "object") {
    throw new Error("blueprint 缺少 base 配置。");
  }
  if (blueprint.base.language && blueprint.base.language !== "zh") {
    throw new Error("spawn blueprint v0.1 只支持 language=zh。");
  }
  return {
    ...blueprint,
    __path: filePath,
    __dir: path.dirname(filePath)
  };
}

function validateSpawnBlueprintForMode(blueprint, mode, modeConfig) {
  if (!blueprint) return;
  if (blueprint.base.mode && blueprint.base.mode !== mode) {
    throw new Error(`blueprint base.mode (${blueprint.base.mode}) 与本次 spawn 模式 (${mode}) 不一致。`);
  }
  if (blueprint.base.kit && blueprint.base.kit !== modeConfig.kit) {
    throw new Error(`blueprint base.kit (${blueprint.base.kit}) 与模式 ${mode} 的 Kit (${modeConfig.kit}) 不匹配。`);
  }
  if (blueprint.renames && Object.keys(blueprint.renames).length > 0) {
    throw new Error("spawn blueprint v0.1 暂不支持 renames。");
  }
  if (blueprint.removals && blueprint.removals.length > 0) {
    throw new Error("spawn blueprint v0.1 暂不支持 removals。");
  }
  for (const relativePath of Object.values(blueprint.paths || {})) {
    normalizeSafeRelativePath(relativePath, "blueprint.paths");
  }
  for (const folder of blueprint.folders || []) {
    normalizeSafeRelativePath(folder, "blueprint.folders");
  }
  for (const rule of blueprint.agent_rules || []) {
    normalizeSafeSourcePath(rule.from, blueprint.__dir, "blueprint.agent_rules.from");
    if (!rule.slot || typeof rule.slot !== "string") {
      throw new Error("blueprint agent_rules 每一项都必须包含 slot。");
    }
  }
  for (const seed of blueprint.seed || []) {
    normalizeSafeSourcePath(seed.from, blueprint.__dir, "blueprint.seed.from");
    normalizeSafeRelativePath(seed.to, "blueprint.seed.to");
    const conflict = seed.on_conflict || "error";
    if (!["error", "skip", "create_new"].includes(conflict)) {
      throw new Error("blueprint seed.on_conflict 只支持 error、skip 或 create_new。");
    }
  }
}

function applySpawnBlueprintModeConfig(modeConfig, blueprint) {
  if (!blueprint) return modeConfig;
  return {
    ...modeConfig,
    formalSource: blueprint.paths?.formal_source || modeConfig.formalSource,
    businessWorkArea: blueprint.paths?.business_work_area || modeConfig.businessWorkArea
  };
}

function buildSpawnPlan({ hubRoot, hubState, targetDir, projectName, projectId, status, mode, modeConfig, blueprint }) {
  const kitDir = path.join(PRODUCT_ROOT, "core", "kits", modeConfig.kit);
  if (!fs.existsSync(kitDir)) {
    throw new Error(`找不到 Kit：${modeConfig.kit}`);
  }

  const registryPath = path.join(hubRoot, "项目", "registry.json");
  const registry = readProjectRegistry(registryPath);
  const targetPath = path.resolve(targetDir);
  ensureProjectCanBeRegistered(registry, projectId, targetPath);

  const now = new Date().toISOString();
  const actions = [];

  for (const source of walkFiles(kitDir)) {
    const relativePath = path.relative(kitDir, source);
    if (shouldSpawnOverrideKitFile(relativePath)) continue;
    let content = fs.readFileSync(source, "utf8");
    if (normalizeRelativePath(relativePath) === "AGENTS.md") {
      content = appendBlueprintRulesToAgents(content, blueprint, {
        projectName,
        projectId,
        mode,
        modeConfig
      });
    }
    actions.push(fileAction(targetDir, relativePath, content));
  }

  if (blueprint) {
    for (const folder of blueprint.folders || []) {
      actions.push(directoryAction(targetDir, normalizeSafeRelativePath(folder, "blueprint.folders")));
    }
    actions.push(directoryAction(targetDir, normalizeSafeRelativePath(modeConfig.formalSource, "paths.formal_source")));
    actions.push(directoryAction(targetDir, normalizeSafeRelativePath(modeConfig.businessWorkArea, "paths.business_work_area")));
    actions.push(...buildBlueprintSeedActions(targetDir, blueprint, {
      projectName,
      projectId,
      mode,
      modeConfig
    }));
  }

  actions.push(...copyDirectoryFiles(hubRoot, "identity", targetDir, path.join("_系统", "身份")));
  actions.push(...copyDirectoryFiles(hubRoot, "lessons", targetDir, path.join("_系统", "教训")));
  if (fs.existsSync(path.join(hubRoot, ".internal"))) {
    actions.push(...copyDirectoryFiles(hubRoot, ".internal", targetDir, ".internal"));
  }
  if (fs.existsSync(path.join(hubRoot, ".obsidian"))) {
    actions.push(...copyDirectoryFiles(hubRoot, ".obsidian", targetDir, ".obsidian"));
  }

  actions.push(symlinkAction(targetDir, "知识", path.join(hubRoot, "知识")));
  actions.push(symlinkAction(targetDir, path.join(".agents", "skills"), path.join(hubRoot, "skills")));
  actions.push(symlinkAction(targetDir, path.join(".claude", "skills"), path.join(hubRoot, "skills")));

  const workspaceState = {
    schema: "starwork.workspace.v0.1",
    core: "0.1",
    workspace_type: modeConfig.workspaceType,
    kit: modeConfig.kit,
    packs: [],
    language: hubState.language || "zh",
    paths: {
      formal_source: modeConfig.formalSource,
      business_work_area: modeConfig.businessWorkArea
    },
    ...(blueprint ? {
      customization: {
        type: "spawn_blueprint",
        schema: blueprint.schema,
        source: path.basename(blueprint.__path),
        folders: (blueprint.folders || []).map((folder) => normalizeSafeRelativePath(folder, "blueprint.folders")),
        agent_rules: (blueprint.agent_rules || []).map((rule) => ({
          slot: rule.slot,
          from: normalizeSafeRelativePath(rule.from, "blueprint.agent_rules.from")
        })),
        seed: (blueprint.seed || []).map((seed) => ({
          from: normalizeSafeRelativePath(seed.from, "blueprint.seed.from"),
          to: normalizeSafeRelativePath(seed.to, "blueprint.seed.to")
        }))
      }
    } : {}),
    hub: {
      path: hubRoot,
      project_id: projectId
    },
    created_by: blueprint ? "starwork spawn --blueprint" : "starwork spawn"
  };

  const coreSync = {
    schema: "starwork.core_sync.v0.1",
    hub_path: hubRoot,
    project_id: projectId,
    project_name: projectName,
    core: "0.1",
    mode,
    created_at: now,
    last_sync_at: now,
    resources: {
      identity: {
        source: "identity/",
        target: "_系统/身份/",
        mode: "snapshot"
      },
      lessons: {
        source: "lessons/",
        target: "_系统/教训/",
        mode: "snapshot"
      },
      knowledge: {
        source: "知识/",
        target: "知识/",
        mode: "readonly-link"
      },
      skills: {
        source: "skills/",
        target: [".agents/skills/", ".claude/skills/"],
        mode: "symlink"
      }
    }
  };

  actions.push(fileAction(targetDir, path.join(".starwork", "workspace.json"), `${JSON.stringify(workspaceState, null, 2)}\n`));
  actions.push(fileAction(targetDir, ".core-sync.json", `${JSON.stringify(coreSync, null, 2)}\n`));
  actions.push(fileAction(targetDir, path.join("_系统", "上下文", "当前项目.md"), renderSpawnProjectStatus({
    projectName,
    projectId,
    hubRoot,
    mode,
    modeConfig,
    blueprint
  })));

  const nextRegistry = {
    ...registry,
    schema: registry.schema || "starwork.projects.registry.v0.1",
    projects: [
      ...(Array.isArray(registry.projects) ? registry.projects : []),
      {
        id: projectId,
        name: projectName,
        path: targetPath,
        status,
        core: "0.1",
        kit: modeConfig.kit,
        mode,
        customized: Boolean(blueprint),
        created_at: now,
        last_sync_at: now,
        sync: {
          identity: "snapshot",
          lessons: "snapshot",
          knowledge: "readonly-link",
          skills: "symlink"
        }
      }
    ]
  };
  actions.push(overwriteFileAction(hubRoot, path.join("项目", "registry.json"), `${JSON.stringify(nextRegistry, null, 2)}\n`));

  return {
    hubRoot,
    targetDir,
    projectName,
    projectId,
    status,
    mode,
    modeLabel: modeConfig.label,
    kit: modeConfig.kit,
    blueprint,
    actions: dedupeActions(actions)
  };
}

function shouldSpawnOverrideKitFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  return normalized === ".core-sync.json"
    || normalized === "_系统/上下文/当前项目.md"
    || normalized.startsWith("_系统/身份/")
    || normalized.startsWith("_系统/教训/")
    || normalized.startsWith("知识/")
    || normalized.startsWith(".agents/skills/")
    || normalized.startsWith(".claude/skills/");
}

function appendBlueprintRulesToAgents(content, blueprint, variables) {
  if (!blueprint || !blueprint.agent_rules?.length) return content;
  const parts = [];
  for (const rule of blueprint.agent_rules) {
    const source = normalizeSafeSourcePath(rule.from, blueprint.__dir, "blueprint.agent_rules.from");
    const ruleContent = renderText(fs.readFileSync(source, "utf8"), buildBlueprintVariables(blueprint, variables)).trim();
    if (!ruleContent) continue;
    parts.push(`<!-- StarWork Blueprint: ${rule.slot} -->\n\n${ruleContent}`);
  }
  if (!parts.length) return content;
  return `${content.trim()}\n\n## 项目定制规则\n\n${parts.join("\n\n")}\n`;
}

function buildBlueprintSeedActions(targetDir, blueprint, variables) {
  const actions = [];
  for (const seed of blueprint.seed || []) {
    const source = normalizeSafeSourcePath(seed.from, blueprint.__dir, "blueprint.seed.from");
    const target = normalizeSafeRelativePath(seed.to, "blueprint.seed.to");
    const content = renderText(fs.readFileSync(source, "utf8"), buildBlueprintVariables(blueprint, variables));
    const targetPath = path.join(targetDir, target);
    const conflict = seed.on_conflict || "error";
    if (fs.existsSync(targetPath)) {
      if (conflict === "skip") continue;
      if (conflict === "create_new") {
        const alternate = nextAvailableSibling(targetPath);
        actions.push({ type: "file", mode: "create-new", target: alternate, originalTarget: targetPath, relativePath: path.relative(targetDir, alternate), content });
        continue;
      }
      throw new Error(`blueprint seed 目标已存在：${target}`);
    }
    actions.push(fileAction(targetDir, target, content));
  }
  return actions;
}

function buildBlueprintVariables(blueprint, { projectName, projectId, mode, modeConfig }) {
  return {
    blueprint,
    workspace: {
      name: projectName,
      type: modeConfig.workspaceType
    },
    project: {
      id: projectId,
      name: projectName
    },
    spawn: {
      mode
    },
    paths: {
      formal_source: modeConfig.formalSource,
      business_work_area: modeConfig.businessWorkArea
    }
  };
}

function copyDirectoryFiles(sourceRoot, sourceRelativeDir, targetRoot, targetRelativeDir) {
  const sourceDir = path.join(sourceRoot, sourceRelativeDir);
  if (!fs.existsSync(sourceDir)) return [];
  return walkFiles(sourceDir).map((source) => {
    const relativePath = path.relative(sourceDir, source);
    const targetRelativePath = path.join(targetRelativeDir, relativePath);
    return fileAction(targetRoot, targetRelativePath, fs.readFileSync(source, "utf8"));
  });
}

function readProjectRegistry(registryPath) {
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    if (!Array.isArray(registry.projects)) {
      throw new Error("projects 必须是数组");
    }
    return registry;
  } catch (error) {
    throw new Error(`无法读取 Hub 项目注册表：${error.message}`);
  }
}

function ensureProjectCanBeRegistered(registry, projectId, targetPath) {
  const projects = Array.isArray(registry.projects) ? registry.projects : [];
  if (projects.some((project) => project?.id === projectId)) {
    throw new Error(`Hub registry 已存在项目 ID：${projectId}`);
  }
  if (projects.some((project) => project?.path && path.resolve(project.path) === targetPath)) {
    throw new Error(`Hub registry 已存在目标路径：${targetPath}`);
  }
}

function renderSpawnProjectStatus({ projectName, projectId, hubRoot, mode, modeConfig, blueprint }) {
  const description = blueprint?.description
    ? `\n## 项目定位\n\n${blueprint.description}\n`
    : "";
  const customization = blueprint
    ? `\n## 工作区定制\n\n- Blueprint：${path.basename(blueprint.__path)}\n- 正式事实源：\`${modeConfig.formalSource}\`\n- 当前工作区：\`${modeConfig.businessWorkArea}\`\n- 定制目录：${(blueprint.folders || []).map((folder) => `\`${normalizeSafeRelativePath(folder, "blueprint.folders")}\``).join("、") || "无"}\n`
    : "";
  return `# 当前项目状态

## 项目目标

${projectName}
${description}

## 项目信息

- 项目 ID：${projectId}
- 工作区类型：${modeConfig.workspaceType}
- Kit：${modeConfig.kit}
- 模式：${mode}
- Hub：${hubRoot}
${customization}

## 当前阶段

刚由 \`starwork spawn\` 创建，等待补充项目目标、近期重点和执行边界。

## 近期重点

- 补充项目目标。
- 确认正式事实源：\`${modeConfig.formalSource}\`。
- 确认当前工作区：\`${modeConfig.businessWorkArea}\`。
- 确认当前工作入口：\`_系统/任务/当前工作.md\`。

## 主要风险

- 不要把 Hub 的项目注册表当成项目进度正文。
- 主库同步资源默认只读，项目内更新应走跨项目联络或回写流程。

## 正式事实源

\`${modeConfig.formalSource}\`

## 下一步

- 运行 \`starwork doctor\` 检查工作台。
- 根据项目实际情况更新本文件。

## 兼容说明

当前 Hub + 项目模式读取 \`_系统/上下文/当前项目.md\`。如果未来迁移到其他命名，只能保留一个状态事实源，另一个应作为别名、指针或生成副本。
`;
}

function slugifyProjectId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadPack(packIdOrPath, language = "zh") {
  const packPath = path.isAbsolute(packIdOrPath) || packIdOrPath.startsWith(".")
    ? path.resolve(packIdOrPath)
    : path.join(PRODUCT_ROOT, "packs", packIdOrPath);
  const jsonPath = path.join(packPath, "pack.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`找不到 Pack 声明：${jsonPath}`);
  }
  const basePack = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const languagePack = loadPackLanguage(packPath, language);
  const pack = mergePackLanguage(basePack, languagePack, language);
  pack.__dir = packPath;
  return pack;
}

function loadPackLanguage(packPath, language) {
  const languagesDir = path.join(packPath, "languages");
  if (!fs.existsSync(languagesDir)) {
    return null;
  }
  const languagePath = path.join(languagesDir, `${language}.json`);
  if (!fs.existsSync(languagePath)) {
    throw new Error(`Pack 缺少语言配置：${path.relative(PRODUCT_ROOT, languagePath)}`);
  }
  return JSON.parse(fs.readFileSync(languagePath, "utf8"));
}

function mergePackLanguage(basePack, languagePack, requestedLanguage) {
  if (!languagePack) {
    return {
      ...basePack,
      language: requestedLanguage
    };
  }
  return {
    ...basePack,
    language: languagePack.language || requestedLanguage,
    name: languagePack.name || basePack.name || basePack.id,
    paths: languagePack.paths || basePack.paths || {},
    overrides: {
      ...(basePack.overrides || {}),
      ...(languagePack.overrides || {})
    },
    rules: languagePack.rules || basePack.rules || [],
    templates: languagePack.templates || basePack.templates || [],
    seed: languagePack.seed || basePack.seed || []
  };
}

function validatePack(pack, workspaceType) {
  if (!pack.supports_workspace_types?.includes(workspaceType)) {
    throw new Error(`Pack ${pack.id} 不支持工作区类型 ${workspaceType}。`);
  }
  if (!pack.paths || Object.keys(pack.paths).length === 0) {
    throw new Error(`Pack ${pack.id} 缺少语言化路径配置。`);
  }
}

function renderPackRules(pack, variables) {
  const parts = [];
  for (const rule of pack.rules || []) {
    const source = path.join(pack.__dir, rule.from);
    if (!fs.existsSync(source)) {
      throw new Error(`Pack rule 不存在：${pack.id}/${rule.from}`);
    }
    parts.push(renderText(fs.readFileSync(source, "utf8"), variables).trim());
  }
  return parts.filter(Boolean).join("\n\n");
}

function renderText(text, variables) {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
    const value = getPath(variables, expression.trim());
    return value == null ? "" : String(value);
  });
}

function getPath(object, expression) {
  return expression.split(".").reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, object);
}

function fileAction(targetDir, relativePath, content) {
  const target = path.join(targetDir, relativePath);
  if (!fs.existsSync(target)) {
    return { type: "file", mode: "create", target, relativePath, content };
  }
  const existing = fs.readFileSync(target, "utf8");
  if (!existing.trim()) {
    return { type: "file", mode: "overwrite-empty", target, relativePath, content };
  }
  const alternate = nextAvailableSibling(target);
  return { type: "file", mode: "create-new", target: alternate, originalTarget: target, relativePath: path.relative(targetDir, alternate), content };
}

function overwriteFileAction(targetDir, relativePath, content) {
  const target = path.join(targetDir, relativePath);
  return { type: "file", mode: "overwrite", target, relativePath, content };
}

function directoryAction(targetDir, relativePath) {
  const target = path.join(targetDir, relativePath);
  return { type: "directory", mode: fs.existsSync(target) ? "exists" : "create", target, relativePath };
}

function symlinkAction(targetDir, relativePath, sourcePath) {
  const target = path.join(targetDir, relativePath);
  return { type: "symlink", mode: "create", target, relativePath, sourcePath };
}

function nextAvailableSibling(target) {
  const ext = path.extname(target);
  const base = target.slice(0, target.length - ext.length);
  let candidate = `${base}.starwork-new${ext}`;
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = `${base}.starwork-new-${index}${ext}`;
    index += 1;
  }
  return candidate;
}

function dedupeActions(actions) {
  const seen = new Set();
  const result = [];
  for (const action of actions) {
    const key = `${action.type}:${action.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(action);
  }
  return result;
}

function applyPlan(plan) {
  for (const action of plan.actions) {
    if (action.mode === "exists") continue;
    if (action.type === "directory") {
      fs.mkdirSync(action.target, { recursive: true });
      continue;
    }
    if (action.type === "symlink") {
      fs.mkdirSync(path.dirname(action.target), { recursive: true });
      if (!fs.existsSync(action.target)) {
        fs.symlinkSync(action.sourcePath, action.target, "dir");
      }
      continue;
    }
    fs.mkdirSync(path.dirname(action.target), { recursive: true });
    fs.writeFileSync(action.target, action.content, "utf8");
  }
}

function printGenericPlan(title, actions) {
  const creates = actions.filter((action) => action.mode === "create");
  const overwrites = actions.filter((action) => action.mode === "overwrite" || action.mode === "overwrite-empty");
  const createNew = actions.filter((action) => action.mode === "create-new");
  const dirs = actions.filter((action) => action.type === "directory" && action.mode === "create");

  console.log("");
  console.log(title);
  console.log("");
  if (dirs.length) {
    console.log("将创建目录：");
    dirs.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (creates.length) {
    console.log("将创建文件：");
    creates.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (overwrites.length) {
    console.log("将更新文件：");
    overwrites.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (createNew.length) {
    console.log("不会覆盖已有内容，将生成旁路文件：");
    createNew.forEach((action) => console.log(`- ${path.relative(path.dirname(action.originalTarget), action.originalTarget)} -> ${action.relativePath}`));
    console.log("");
  }
}

function printPlan(plan, dryRun) {
  const creates = plan.actions.filter((action) => action.mode === "create");
  const emptyUpdates = plan.actions.filter((action) => action.mode === "overwrite-empty");
  const createNew = plan.actions.filter((action) => action.mode === "create-new");

  console.log("");
  console.log(dryRun ? "初始化预览（dry run）：" : "初始化计划：");
  console.log("");
  console.log(`工作区类型：${plan.workspaceLabel} (${plan.workspaceType})`);
  console.log(`Kit：${plan.kit}`);
  console.log(`Pack：${plan.pack.name || PACK_LABELS[plan.pack.id] || plan.pack.id} (${plan.pack.id})`);
  console.log(`工作台名称：${plan.workspaceName}`);
  console.log(`正式成果位置：${plan.formalSource}`);
  console.log("");

  if (creates.length) {
    console.log("将创建：");
    creates.slice(0, 40).forEach((action) => console.log(`- ${action.relativePath}`));
    if (creates.length > 40) console.log(`- ... 另有 ${creates.length - 40} 项`);
    console.log("");
  }
  if (emptyUpdates.length) {
    console.log("将写入空文件：");
    emptyUpdates.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (createNew.length) {
    console.log("不会覆盖已有内容，将生成旁路文件：");
    createNew.forEach((action) => console.log(`- ${path.relative(plan.targetDir, action.originalTarget)} -> ${action.relativePath}`));
    console.log("");
  }
}

function printSpawnPlan(plan, dryRun) {
  const creates = plan.actions.filter((action) => action.type === "file" && action.mode === "create");
  const overwrites = plan.actions.filter((action) => action.type === "file" && action.mode === "overwrite");
  const links = plan.actions.filter((action) => action.type === "symlink");
  const dirs = plan.actions.filter((action) => action.type === "directory" && action.mode === "create");

  console.log("");
  console.log(dryRun ? "生成项目预览（dry run）：" : "生成项目计划：");
  console.log("");
  console.log(`Hub：${plan.hubRoot}`);
  console.log(`项目名称：${plan.projectName}`);
  console.log(`项目 ID：${plan.projectId}`);
  console.log(`目标目录：${plan.targetDir}`);
  console.log(`模式：${plan.modeLabel} (${plan.mode})`);
  console.log(`Kit：${plan.kit}`);
  if (plan.blueprint) {
    console.log(`Blueprint：${plan.blueprint.__path}`);
    console.log(`正式事实源：${plan.blueprint.paths?.formal_source || "(默认)"}`);
    console.log(`当前工作区：${plan.blueprint.paths?.business_work_area || "(默认)"}`);
  }
  console.log("");

  if (creates.length) {
    console.log("将在新项目中创建：");
    creates.slice(0, 40).forEach((action) => console.log(`- ${action.relativePath}`));
    if (creates.length > 40) console.log(`- ... 另有 ${creates.length - 40} 项`);
    console.log("");
  }
  if (dirs.length) {
    console.log("将在新项目中创建目录：");
    dirs.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (links.length) {
    console.log("将挂载 Hub 共享资源：");
    links.forEach((action) => console.log(`- ${action.relativePath} -> ${action.sourcePath}`));
    console.log("");
  }
  if (overwrites.length) {
    console.log("将在 Hub 中更新：");
    overwrites.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }
  return result;
}

function findWorkspaceRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(current, ".starwork", "workspace.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function getKitDefaultFormalSource(kit) {
  if (kit === "hub") return "项目/";
  return "输出/确认成果/";
}

function getKitLanguage(kit) {
  return "zh";
}

function printHelp() {
  console.log(`StarWork CLI

Usage:
  starwork init [options]
  starwork spawn [options]
  starwork doctor [options]
  starwork adapt [agent] [options]
  starwork pack install <pack> [options]

Options:
  --type <single-light|single-matter|hub>
  --hub <path>
  --blueprint <path>
  --mode <starter|matter>
  --id <project-id>
  --status <active|paused>
  --pack <general|content-creator|hub-management|path>
  --name <name>
  --formal-source <path>
  --language <zh|en>
  --target <path>
  --dry-run
  --json
  --strict
  --verbose
  --agent <codex|claude|cursor|trae|all>
  --yes, -y
`);
}

function printSpawnHelp() {
  console.log(`StarWork Spawn

Usage:
  starwork spawn --hub <hub-path> --name <project-name> --target <path> [options]
  starwork spawn --hub <hub-path> --target <path> --blueprint <blueprint.json> [options]

Options:
  --hub <path>
  --blueprint <path>
  --name <name>
  --target <path>
  --mode <starter|matter>
  --id <project-id>
  --status <active|paused>
  --dry-run
  --yes, -y
`);
}

function printDoctorHelp() {
  console.log(`StarWork Doctor

Usage:
  starwork doctor [options]

Options:
  --target <path>
  --json
  --strict
  --verbose
`);
}

function printAdaptHelp() {
  console.log(`StarWork Adapt

Usage:
  starwork adapt [codex|claude|cursor|trae|all] [options]

Options:
  --agent <codex|claude|cursor|trae|all>
  --target <path>
  --dry-run
  --yes, -y
`);
}

function printPackHelp() {
  console.log(`StarWork Pack

Usage:
  starwork pack install <pack> [options]
`);
}

function printPackInstallHelp() {
  console.log(`StarWork Pack Install

Usage:
  starwork pack install <general|content-creator|hub-management> [options]

Options:
  --target <path>
  --dry-run
  --yes, -y
`);
}

module.exports = { run };
