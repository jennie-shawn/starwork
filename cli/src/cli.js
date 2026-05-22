const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PRODUCT_ROOT = path.resolve(__dirname, "..", "..");
const PACKAGE_VERSION = require(path.join(PRODUCT_ROOT, "package.json")).version;

const WORKSPACE_TYPES = {
  "single-light": {
    label: "单事务项目",
    kit: "local-starter",
    defaultPack: "general",
    description: "适合一个明确事务、一个阶段目标或一次成果交付。"
  },
  "single-matter": {
    label: "多事务项目",
    kit: "local-matter",
    defaultPack: "general",
    description: "适合同一项目下有多个事项需要追踪、交接和复盘。"
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

const KIT_BUNDLED_SKILLS = {
  hub: [
    {
      id: "starworkSpawn",
      name: "StarWork Spawn",
      source: path.join("skills", "starworkSpawn"),
      sourceKind: "kit",
      type: "kit-bundled",
      distribution: "copy",
      reason: "Hub Kit 自带：用于生成和定制卫星项目。",
      install: [
        { agent: "hub", path: path.join("skills", "starworkSpawn"), mode: "copy" },
        { agent: "codex", path: path.join(".agents", "skills", "starworkSpawn"), mode: "symlink", source: path.join("skills", "starworkSpawn") },
        { agent: "claude", path: path.join(".claude", "skills", "starworkSpawn"), mode: "symlink", source: path.join("skills", "starworkSpawn") }
      ]
    }
  ],
  "local-starter": [
    {
      id: "neat-freak",
      name: "Neat Freak",
      source: path.join("skills", "neat-freak"),
      sourceKind: "kit",
      type: "kit-bundled",
      distribution: "copy",
      reason: "单项目 Kit 自带：用于阶段性清理、收尾和归档。",
      install: [
        { agent: "codex", path: path.join(".agents", "skills", "neat-freak"), mode: "copy" },
        { agent: "claude", path: path.join(".claude", "skills", "neat-freak"), mode: "copy" }
      ]
    }
  ],
  "local-matter": [
    {
      id: "neat-freak",
      name: "Neat Freak",
      source: path.join("skills", "neat-freak"),
      sourceKind: "kit",
      type: "kit-bundled",
      distribution: "copy",
      reason: "多事务项目 Kit 自带：用于事项收尾、项目记忆清理和归档。",
      install: [
        { agent: "codex", path: path.join(".agents", "skills", "neat-freak"), mode: "copy" },
        { agent: "claude", path: path.join(".claude", "skills", "neat-freak"), mode: "copy" }
      ]
    }
  ]
};

async function run(argv) {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "--version" || command === "-v" || command === "version") {
    printVersion();
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

  if (command === "upgrade") {
    await upgradeWorkspace(argv.slice(1));
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

  if (command === "multiagent") {
    await lanesCommand(argv.slice(1));
    return;
  }

  throw new Error(`未知命令：${command}`);
}

async function init(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printInitHelp();
    return;
  }
  const targetDir = path.resolve(options.target || process.cwd());

  if (findWorkspaceRoot(targetDir)) {
    console.log("当前目录看起来已经位于 StarWork 工作台内。");
    console.log("你可以运行 starwork doctor 检查状态；v0.1 的 init 暂不处理升级。");
    return;
  }

  printInitIntro(options, targetDir);
  const workspaceType = options.type || await chooseWorkspaceType(options);
  const workspaceConfig = WORKSPACE_TYPES[workspaceType];
  if (!workspaceConfig) {
    throw new Error(`不支持的工作区类型：${workspaceType}`);
  }

  const language = options.language || await chooseLanguage(options);
  validateLanguage(language);
  const packId = options.pack || await choosePack(workspaceType, workspaceConfig, options);
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
    formalSource,
    includeSkills: !options.noSkills
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
  console.log(`1. 运行 starwork doctor --target ${plan.targetDir}`);
  console.log("2. 打开 AGENTS.md，确认 Agent 入口规则。");
  console.log("3. 如需生成特定 Agent 适配文件，运行 starwork adapt。");
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
    } else if (arg === "--no-skills") {
      options.noSkills = true;
    } else if (arg === "--inventory-depth") {
      options.inventoryDepth = readValue(argv, ++i, arg);
    } else if (arg === "--inventory-limit") {
      options.inventoryLimit = readValue(argv, ++i, arg);
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
    } else if (arg === "--lanes") {
      options.lanes = readValue(argv, ++i, arg);
    } else if (arg === "--purpose") {
      options.purpose = readValue(argv, ++i, arg);
    } else if (arg === "--write") {
      options.write = readValue(argv, ++i, arg);
    } else if (arg === "--session") {
      options.session = readValue(argv, ++i, arg);
    } else if (arg === "--title") {
      options.title = readValue(argv, ++i, arg);
    } else if (arg === "--path") {
      options.path = readValue(argv, ++i, arg);
    } else if (arg === "--audience") {
      options.audience = readValue(argv, ++i, arg);
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

async function lanesCommand(argv) {
  const subcommand = argv[0];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printLanesHelp();
    return;
  }

  if (subcommand === "init") {
    await lanesInit(argv.slice(1));
    return;
  }
  if (subcommand === "add") {
    await lanesAdd(argv.slice(1));
    return;
  }
  if (subcommand === "bind") {
    await lanesBind(argv.slice(1));
    return;
  }
  if (subcommand === "release") {
    await lanesRelease(argv.slice(1));
    return;
  }
  if (subcommand === "status") {
    lanesStatus(argv.slice(1));
    return;
  }
  if (subcommand === "share") {
    await lanesShare(argv.slice(1));
    return;
  }

  throw new Error(`未知 multiagent 子命令：${subcommand}`);
}

async function lanesInit(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printLanesInitHelp();
    return;
  }
  const workspaceRoot = requireWorkspaceRoot(path.resolve(options.target || process.cwd()));
  const lanes = parseLaneList(options.lanes || "").map((id) => ({
    lane: id,
    purpose: "待补充",
    current_session: "unbound",
    write_scope: "待补充",
    worklog: path.posix.join("lanes", id, "worklog.md")
  }));
  const plan = buildLanesInitPlan({ workspaceRoot, lanes });
  printGenericPlan(options.dryRun ? "Agent Lanes 初始化预览（dry run）：" : "Agent Lanes 初始化计划：", plan.actions);
  if (options.dryRun) return;
  await confirmOrThrow(options, "是否初始化 Agent Lanes？");
  applyPlan(plan);
  console.log("");
  console.log("Agent Lanes 已初始化。");
}

async function lanesAdd(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printLanesAddHelp();
    return;
  }
  const laneId = normalizeLaneId(options._?.[0], "lane");
  if (!options.purpose) {
    throw new Error("multiagent add 需要 --purpose <text>。");
  }
  if (!options.write) {
    throw new Error("multiagent add 需要 --write <path-globs>。");
  }
  const workspaceRoot = requireWorkspaceRoot(path.resolve(options.target || process.cwd()));
  const registry = readLanesRegistry(workspaceRoot);
  if (registry.lanes.some((lane) => lane.lane === laneId)) {
    throw new Error(`Lane 已存在：${laneId}`);
  }
  const lane = {
    lane: laneId,
    purpose: normalizeMarkdownCell(options.purpose),
    current_session: "unbound",
    write_scope: normalizeMarkdownCell(options.write),
    worklog: path.posix.join("lanes", laneId, "worklog.md")
  };
  const plan = buildLanesRegistryPlan(workspaceRoot, [...registry.lanes, lane], [
    fileAction(workspaceRoot, path.join("_系统", "协作", "lanes", laneId, "worklog.md"), renderLaneWorklog(laneId))
  ]);
  printGenericPlan(options.dryRun ? "新增 Lane 预览（dry run）：" : "新增 Lane 计划：", plan.actions);
  if (options.dryRun) return;
  await confirmOrThrow(options, `是否新增 Lane ${laneId}？`);
  applyPlan(plan);
  console.log("");
  console.log(`Lane ${laneId} 已新增。`);
}

async function lanesBind(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printLanesBindHelp();
    return;
  }
  const laneId = normalizeLaneId(options._?.[0], "lane");
  const workspaceRoot = requireWorkspaceRoot(path.resolve(options.target || process.cwd()));
  const registry = readLanesRegistry(workspaceRoot);
  const lane = findLaneOrThrow(registry.lanes, laneId);
  const session = resolveLaneSession(options);
  if (lane.current_session && lane.current_session !== "unbound" && lane.current_session !== session && !options.yes) {
    throw new Error(`Lane ${laneId} 已绑定 ${lane.current_session}。如需覆盖，请传入 --yes。`);
  }
  const nextLanes = registry.lanes.map((item) => item.lane === laneId ? { ...item, current_session: session } : item);
  const plan = buildLanesRegistryPlan(workspaceRoot, nextLanes);
  printGenericPlan(options.dryRun ? "绑定 Lane 预览（dry run）：" : "绑定 Lane 计划：", plan.actions);
  if (options.dryRun) return;
  await confirmOrThrow(options, `是否将当前会话绑定到 Lane ${laneId}？`);
  applyPlan(plan);
  console.log("");
  console.log(`Lane ${laneId} 已绑定到 ${session}。`);
}

async function lanesRelease(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printLanesReleaseHelp();
    return;
  }
  const laneId = normalizeLaneId(options._?.[0], "lane");
  const workspaceRoot = requireWorkspaceRoot(path.resolve(options.target || process.cwd()));
  const registry = readLanesRegistry(workspaceRoot);
  findLaneOrThrow(registry.lanes, laneId);
  const nextLanes = registry.lanes.map((item) => item.lane === laneId ? { ...item, current_session: "unbound" } : item);
  const plan = buildLanesRegistryPlan(workspaceRoot, nextLanes);
  printGenericPlan(options.dryRun ? "释放 Lane 预览（dry run）：" : "释放 Lane 计划：", plan.actions);
  if (options.dryRun) return;
  await confirmOrThrow(options, `是否释放 Lane ${laneId}？`);
  applyPlan(plan);
  console.log("");
  console.log(`Lane ${laneId} 已释放。请更新对应 worklog。`);
}

function lanesStatus(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printLanesStatusHelp();
    return;
  }
  const workspaceRoot = requireWorkspaceRoot(path.resolve(options.target || process.cwd()));
  const registry = readLanesRegistry(workspaceRoot);
  const shared = readSharedContext(workspaceRoot);
  if (options.json) {
    console.log(JSON.stringify({
      schema: "starwork.agent_lanes.status.v0.1",
      workspace_root: workspaceRoot,
      lanes: registry.lanes,
      shared_outputs: shared.outputs,
      cross_lane_requests: shared.requests
    }, null, 2));
    return;
  }
  console.log("");
  console.log("Agent Lanes");
  console.log("");
  if (!registry.lanes.length) {
    console.log("未登记任何 lane。");
  } else {
    for (const lane of registry.lanes) {
      console.log(`- ${lane.lane}: ${lane.purpose}`);
      console.log(`  session: ${lane.current_session || "unbound"}`);
      console.log(`  write: ${lane.write_scope}`);
      console.log(`  worklog: ${lane.worklog}`);
    }
  }
  const openRequests = shared.requests.filter((request) => request.status !== "done");
  if (openRequests.length) {
    console.log("");
    console.log("Cross-Lane Requests:");
    openRequests.forEach((request) => console.log(`- ${request.from} -> ${request.to}: ${request.request} (${request.status})`));
  }
}

async function lanesShare(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printLanesShareHelp();
    return;
  }
  const from = normalizeLaneId(options._?.[0], "lane");
  if (!options.title) {
    throw new Error("multiagent share 需要 --title <text>。");
  }
  if (!options.path) {
    throw new Error("multiagent share 需要 --path <relative-path>。");
  }
  if (!options.audience) {
    throw new Error("multiagent share 需要 --audience <lane-list>。");
  }
  const workspaceRoot = requireWorkspaceRoot(path.resolve(options.target || process.cwd()));
  const registry = readLanesRegistry(workspaceRoot);
  findLaneOrThrow(registry.lanes, from);
  const outputPath = normalizeSafeRelativePath(options.path, "multiagent share --path");
  const shared = readSharedContext(workspaceRoot);
  const row = {
    from,
    title: normalizeMarkdownCell(options.title),
    path: outputPath,
    audience: normalizeMarkdownCell(options.audience),
    status: normalizeMarkdownCell(options.status || "draft"),
    updated: todayIsoDate()
  };
  const plan = buildSharedContextPlan(workspaceRoot, {
    outputs: [...shared.outputs, row],
    requests: shared.requests,
    agreements: shared.agreements
  });
  printGenericPlan(options.dryRun ? "共享输出登记预览（dry run）：" : "共享输出登记计划：", plan.actions);
  if (options.dryRun) return;
  await confirmOrThrow(options, "是否登记共享输出？");
  applyPlan(plan);
  console.log("");
  console.log(`已登记共享输出：${row.title}`);
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

async function upgradeWorkspace(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printUpgradeHelp();
    return;
  }

  if (!options.blueprint) {
    throw new Error("upgrade v0.1 必须传入 --blueprint <upgrade-blueprint.json>。请先用 starworkDoctor skill 诊断并生成升级蓝图。");
  }

  const targetDir = path.resolve(options.target || process.cwd());
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    throw new Error(`upgrade 目标目录不存在或不是目录：${targetDir}`);
  }
  if (findWorkspaceRoot(targetDir)) {
    throw new Error("当前目录已经是 StarWork 工作台，不应使用 upgrade。后续请使用 update 或 repair。");
  }

  const blueprint = loadUpgradeBlueprint(options.blueprint);
  const plan = buildUpgradePlan({ targetDir, blueprint });

  if (options.json && options.dryRun) {
    console.log(JSON.stringify(renderUpgradePlanJson(plan, true), null, 2));
    return;
  }

  if (!options.json) {
    printUpgradePlan(plan, options.dryRun);
  }
  if (options.dryRun) return;

  await confirmOrThrow(options, "是否按 upgrade blueprint 执行升级？");
  applyPlan(plan);

  if (options.json) {
    console.log(JSON.stringify(renderUpgradeExecutionJson(plan), null, 2));
    return;
  }

  console.log("");
  console.log("StarWork 工作台升级已完成。");
  console.log("");
  console.log(`下一步建议：运行 starwork doctor --target ${plan.targetDir}`);
}

function doctor(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printDoctorHelp();
    return { exitCode: 0 };
  }

  const targetDir = path.resolve(options.target || process.cwd());
  const result = collectDoctorResult(targetDir, options);
  return finishDoctor(result, options);
}

function collectDoctorResult(targetDir, options = {}) {
  const result = createDoctorResult(targetDir);

  if (!fs.existsSync(targetDir)) {
    addCheck(result, "workspace.target.exists", "fail", `目标目录不存在：${targetDir}`);
    return result;
  }

  result.inventory = collectInventory(targetDir, options);
  result.signals = detectWorkspaceSignals(result.inventory);

  const workspaceRoot = findWorkspaceRoot(targetDir);
  if (!workspaceRoot) {
    const legacy = detectLegacyWorkspace(targetDir, result.signals);
    if (legacy.candidate) {
      result.upgrade = buildLegacySignals(legacy);
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
    return result;
  }

  result.workspace_root = workspaceRoot;
  const statePath = path.join(workspaceRoot, ".starwork", "workspace.json");
  addCheck(result, "workspace.state.exists", "pass", ".starwork/workspace.json exists", ".starwork/workspace.json");

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
  checkSkillInstallations(result, workspaceRoot, state);
  result.ok = result.summary.fail === 0;
  result.strict_ok = result.ok;
  result.exitCode = result.ok ? 0 : 1;
  return result;
}

function doctorCollect(targetDir) {
  return collectDoctorResult(targetDir);
}

function createDoctorResult(targetDir) {
  return {
    schema: "starwork.doctor.result.v0.1",
    ok: false,
    strict_ok: false,
    workspace_root: null,
    target: targetDir,
    workspace: null,
    skills: null,
    upgrade: null,
    inventory: null,
    signals: null,
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

function loadUpgradeBlueprint(blueprintPath) {
  const filePath = path.resolve(blueprintPath);
  let blueprint;
  try {
    blueprint = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`无法读取 upgrade blueprint：${error.message}`);
  }
  if (blueprint.schema !== "starwork.upgrade_blueprint.v0.1") {
    throw new Error("upgrade blueprint schema 必须是 starwork.upgrade_blueprint.v0.1。");
  }
  if (!blueprint.base || typeof blueprint.base !== "object") {
    throw new Error("upgrade blueprint 缺少 base 配置。");
  }
  const workspaceType = blueprint.base.workspace_type;
  const kit = blueprint.base.kit;
  const allowedKits = {
    "single-light": "local-starter",
    "single-matter": "local-matter"
  };
  if (!allowedKits[workspaceType]) {
    throw new Error("upgrade blueprint base.workspace_type 只支持 single-light 或 single-matter。");
  }
  if (kit !== allowedKits[workspaceType]) {
    throw new Error(`upgrade blueprint base.kit (${kit}) 与 ${workspaceType} 不匹配，应为 ${allowedKits[workspaceType]}。`);
  }
  if (!["zh", "en"].includes(blueprint.base.language)) {
    throw new Error("upgrade blueprint base.language 只支持 zh 或 en。");
  }
  if (!["preserve-names", "add-standard-shell", "standardize-empty-paths"].includes(blueprint.strategy)) {
    throw new Error("upgrade blueprint strategy 暂只支持 preserve-names、add-standard-shell 或 standardize-empty-paths。");
  }
  if (!blueprint.paths?.formal_source || !blueprint.paths?.business_work_area) {
    throw new Error("upgrade blueprint 缺少 paths.formal_source 或 paths.business_work_area。");
  }
  normalizeSafeRelativePath(blueprint.paths.formal_source, "upgrade paths.formal_source");
  normalizeSafeRelativePath(blueprint.paths.business_work_area, "upgrade paths.business_work_area");
  if (!Array.isArray(blueprint.actions) || blueprint.actions.length === 0) {
    throw new Error("upgrade blueprint 必须包含 actions。");
  }
  validateUpgradeBlueprintActions(blueprint, path.dirname(filePath));
  for (const preserved of blueprint.preserve || []) {
    normalizeSafeRelativePath(preserved, "upgrade preserve");
  }
  return {
    ...blueprint,
    __path: filePath,
    __dir: path.dirname(filePath)
  };
}

function validateUpgradeBlueprintActions(blueprint, blueprintDir) {
  const supported = new Set([
    "ensure_dir",
    "write_workspace_state",
    "copy_kit_missing_files",
    "inject_agent_rules",
    "write_file",
    "copy_seed"
  ]);
  for (const action of blueprint.actions) {
    if (!supported.has(action?.type)) {
      throw new Error(`upgrade blueprint 不支持 action.type：${action?.type || "(missing)"}`);
    }
    if (action.path) {
      normalizeSafeRelativePath(action.path, `upgrade action ${action.type}.path`);
    }
    if (action.target) {
      normalizeSafeRelativePath(action.target, `upgrade action ${action.type}.target`);
    }
    if (action.to) {
      normalizeSafeRelativePath(action.to, `upgrade action ${action.type}.to`);
    }
    if (action.from) {
      normalizeSafeSourcePath(action.from, blueprintDir, `upgrade action ${action.type}.from`);
    }
    if (action.type === "inject_agent_rules" && (!action.slot || typeof action.slot !== "string")) {
      throw new Error("upgrade inject_agent_rules action 必须包含 slot。");
    }
    if (action.type === "write_file" && typeof action.content !== "string") {
      throw new Error("upgrade write_file action 必须包含 content 字符串。");
    }
    if (action.type === "copy_seed") {
      const conflict = action.on_conflict || "error";
      if (!["error", "skip"].includes(conflict)) {
        throw new Error("upgrade copy_seed on_conflict 只支持 error 或 skip。");
      }
    }
  }
}

function buildUpgradePlan({ targetDir, blueprint }) {
  const kitDir = path.join(PRODUCT_ROOT, "core", "kits", blueprint.base.kit);
  if (!fs.existsSync(kitDir)) {
    throw new Error(`找不到 Kit：${blueprint.base.kit}`);
  }

  const packId = blueprint.base.pack || "general";
  const pack = packId ? loadPack(packId, blueprint.base.language) : null;
  if (pack) validatePack(pack, blueprint.base.workspace_type);

  const now = new Date().toISOString();
  const variables = buildUpgradeVariables(blueprint, { targetDir, pack });
  const actions = [];
  const injectedTargets = new Set((blueprint.actions || [])
    .filter((action) => action.type === "inject_agent_rules")
    .map((action) => normalizeSafeRelativePath(action.target || "AGENTS.md", "upgrade inject target")));

  for (const action of blueprint.actions) {
    if (action.type === "ensure_dir") {
      actions.push(directoryAction(targetDir, normalizeSafeRelativePath(action.path, "upgrade ensure_dir.path")));
    } else if (action.type === "write_workspace_state") {
      actions.push(strictFileAction(targetDir, path.join(".starwork", "workspace.json"), renderUpgradeWorkspaceState(blueprint, pack, now)));
    } else if (action.type === "copy_kit_missing_files") {
      actions.push(...buildUpgradeKitActions(targetDir, kitDir, injectedTargets));
    } else if (action.type === "inject_agent_rules") {
      actions.push(buildUpgradeAgentRuleAction(targetDir, kitDir, blueprint, action, variables));
    } else if (action.type === "write_file") {
      const target = normalizeSafeRelativePath(action.path, "upgrade write_file.path");
      actions.push(strictFileAction(targetDir, target, renderText(action.content, variables)));
    } else if (action.type === "copy_seed") {
      const source = normalizeSafeSourcePath(action.from, blueprint.__dir, "upgrade copy_seed.from");
      const target = normalizeSafeRelativePath(action.to, "upgrade copy_seed.to");
      const targetPath = path.join(targetDir, target);
      if (fs.existsSync(targetPath)) {
        if ((action.on_conflict || "error") === "skip") continue;
        throw new Error(`upgrade copy_seed 目标已存在：${target}`);
      }
      actions.push(strictFileAction(targetDir, target, renderText(fs.readFileSync(source, "utf8"), variables)));
    }
  }

  actions.push(directoryAction(targetDir, normalizeSafeRelativePath(blueprint.paths.formal_source, "paths.formal_source")));
  actions.push(directoryAction(targetDir, normalizeSafeRelativePath(blueprint.paths.business_work_area, "paths.business_work_area")));
  if (pack) {
    for (const rolePath of Object.values(pack.paths || {})) {
      actions.push(directoryAction(targetDir, normalizeSafeRelativePath(rolePath, "pack.paths")));
    }
  }

  return {
    targetDir,
    blueprint,
    strategy: blueprint.strategy,
    workspaceType: blueprint.base.workspace_type,
    kit: blueprint.base.kit,
    language: blueprint.base.language,
    pack,
    actions: dedupeActions(actions.filter(Boolean))
  };
}

function buildUpgradeKitActions(targetDir, kitDir, injectedTargets) {
  const actions = [];
  for (const source of walkFiles(kitDir)) {
    const relativePath = normalizeRelativePath(path.relative(kitDir, source));
    if (injectedTargets.has(relativePath)) continue;
    const target = path.join(targetDir, relativePath);
    if (fs.existsSync(target)) continue;
    actions.push(strictFileAction(targetDir, relativePath, fs.readFileSync(source, "utf8")));
  }
  return actions;
}

function buildUpgradeAgentRuleAction(targetDir, kitDir, blueprint, action, variables) {
  const target = normalizeSafeRelativePath(action.target || "AGENTS.md", "upgrade inject_agent_rules.target");
  const source = normalizeSafeSourcePath(action.from, blueprint.__dir, "upgrade inject_agent_rules.from");
  const slot = action.slot;
  const marker = `StarWork Upgrade: ${slot}`;
  const targetPath = path.join(targetDir, target);
  const kitDefaultPath = path.join(kitDir, target);
  const existing = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : fs.existsSync(kitDefaultPath)
      ? fs.readFileSync(kitDefaultPath, "utf8")
      : "";
  if (existing.includes(marker)) return null;

  const ruleContent = renderText(fs.readFileSync(source, "utf8"), variables).trim();
  if (!ruleContent) return null;
  const content = `${existing.trim()}\n\n## StarWork 升级规则\n\n<!-- ${marker} -->\n\n${ruleContent}\n`;
  return fs.existsSync(targetPath)
    ? overwriteFileAction(targetDir, target, content)
    : strictFileAction(targetDir, target, content);
}

function renderUpgradeWorkspaceState(blueprint, pack, now) {
  const packRecord = pack ? [{
    id: pack.id,
    version: pack.version || "0.1.0",
    installed_at: now
  }] : [];
  const state = {
    schema: "starwork.workspace.v0.1",
    core: "0.1",
    workspace_type: blueprint.base.workspace_type,
    kit: blueprint.base.kit,
    packs: packRecord,
    language: blueprint.base.language,
    paths: {
      formal_source: normalizeSafeRelativePath(blueprint.paths.formal_source, "paths.formal_source"),
      business_work_area: normalizeSafeRelativePath(blueprint.paths.business_work_area, "paths.business_work_area")
    },
    upgrade: {
      type: "upgrade_blueprint",
      schema: blueprint.schema,
      source: path.basename(blueprint.__path),
      strategy: blueprint.strategy,
      generated_by: blueprint.generated_by || "starworkDoctor",
      core_role_mapping: Array.isArray(blueprint.core_role_mapping) ? blueprint.core_role_mapping : [],
      upgraded_at: now
    },
    created_by: "starwork upgrade"
  };
  return `${JSON.stringify(state, null, 2)}\n`;
}

function buildUpgradeVariables(blueprint, { targetDir, pack }) {
  return {
    blueprint,
    workspace: {
      name: path.basename(targetDir),
      type: blueprint.base.workspace_type
    },
    paths: {
      formal_source: normalizeSafeRelativePath(blueprint.paths.formal_source, "paths.formal_source"),
      business_work_area: normalizeSafeRelativePath(blueprint.paths.business_work_area, "paths.business_work_area")
    },
    upgrade: {
      strategy: blueprint.strategy
    },
    pack: pack || null
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

function checkSkillInstallations(result, workspaceRoot, state) {
  const manifestPath = path.join(workspaceRoot, ".starwork", "skills.json");
  const skills = {
    project_manifest: {
      exists: fs.existsSync(manifestPath),
      path: ".starwork/skills.json",
      count: 0
    },
    registry: null,
    mounts: []
  };
  result.skills = skills;

  if (!skills.project_manifest.exists) {
    addCheck(result, "skills.project_manifest.exists", "warn", "缺少项目 Skill 清单 .starwork/skills.json。", ".starwork/skills.json");
  } else {
    addCheck(result, "skills.project_manifest.exists", "pass", "Project skill manifest exists", ".starwork/skills.json");
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
      addCheck(result, "skills.project_manifest.parse", "fail", `无法解析项目 Skill 清单：${error.message}`, ".starwork/skills.json");
      manifest = null;
    }
    if (manifest) {
      if (manifest.schema === "starwork.project_skills.v0.1") {
        addCheck(result, "skills.project_manifest.schema", "pass", "Project skill manifest schema is valid", ".starwork/skills.json");
      } else {
        addCheck(result, "skills.project_manifest.schema", "fail", "项目 Skill 清单 schema 不正确。", ".starwork/skills.json");
      }
      const manifestSkills = Array.isArray(manifest.skills) ? manifest.skills : [];
      skills.project_manifest.count = manifestSkills.length;
      for (const skill of manifestSkills) {
        if (!skill?.id) {
          addCheck(result, "skills.id.exists", "fail", "项目 Skill 清单中存在缺少 id 的条目。", ".starwork/skills.json");
          continue;
        }
        for (const mount of skill.mounts || []) {
          if (!mount?.path) continue;
          const normalized = normalizeRelativePath(mount.path);
          const exists = fs.existsSync(path.join(workspaceRoot, normalized));
          skills.mounts.push({
            id: skill.id,
            path: normalized,
            mode: mount.mode || null,
            status: exists ? "ok" : "missing"
          });
          if (exists) {
            addCheck(result, "skills.mount.exists", "pass", `Skill mount exists: ${skill.id}`, normalized);
          } else {
            addCheck(result, "skills.mount.exists", "fail", `Skill ${skill.id} 缺少挂载路径：${normalized}`, normalized);
          }
        }
      }
    }
  }

  if (state.workspace_type === "hub") {
    const registryPath = path.join(workspaceRoot, "skills", "registry.json");
    skills.registry = {
      exists: fs.existsSync(registryPath),
      path: "skills/registry.json",
      count: 0
    };
    if (!skills.registry.exists) {
      addCheck(result, "skills.registry.exists", "warn", "Hub 缺少托管 Skill 注册表。", "skills/registry.json");
      return;
    }
    addCheck(result, "skills.registry.exists", "pass", "Hub skill registry exists", "skills/registry.json");
    let registry;
    try {
      registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } catch (error) {
      addCheck(result, "skills.registry.parse", "fail", `无法解析 Hub Skill registry：${error.message}`, "skills/registry.json");
      return;
    }
    if (registry.schema === "starwork.skill_registry.v0.1") {
      addCheck(result, "skills.registry.schema", "pass", "Hub skill registry schema is valid", "skills/registry.json");
    } else {
      addCheck(result, "skills.registry.schema", "fail", "Hub Skill registry schema 不正确。", "skills/registry.json");
    }
    const registrySkills = Array.isArray(registry.skills) ? registry.skills : [];
    skills.registry.count = registrySkills.length;
    for (const skill of registrySkills) {
      if (!skill?.id) {
        addCheck(result, "skills.registry.id.exists", "fail", "Hub Skill registry 中存在缺少 id 的条目。", "skills/registry.json");
        continue;
      }
      checkPathExists(result, workspaceRoot, path.join("skills", skill.id), "skills.registry.source.exists", `Hub skill source exists: ${skill.id}`, `Hub 托管 Skill 缺少目录：skills/${skill.id}`);
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
  if (normalized === "node_modules" || normalized.startsWith("node_modules/")) {
    throw new Error(`${label} 不能写入 node_modules：${relativePath}`);
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

function collectInventory(root, options = {}) {
  const maxDepth = parseInventoryDepth(options.inventoryDepth);
  const maxEntries = parseInventoryLimit(options.inventoryLimit);
  const directories = [];
  const files = [];
  const omitted = {
    directories: 0,
    files: 0,
    reason: null
  };
  let totalEntries = 0;

  function walk(current, depth) {
    if (totalEntries >= maxEntries) {
      omitted.reason = "count_limit";
      return;
    }

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
        .filter((entry) => !shouldOmitInventoryEntry(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
    } catch {
      return;
    }

    for (const entry of entries) {
      if (totalEntries >= maxEntries) {
        if (entry.isDirectory()) omitted.directories += 1;
        else if (entry.isFile()) omitted.files += 1;
        omitted.reason = "count_limit";
        continue;
      }

      const absolute = path.join(current, entry.name);
      const relativePath = normalizeRelativePath(path.relative(root, absolute));
      if (!relativePath) continue;

      if (entry.isDirectory()) {
        const childCount = safeChildCount(absolute);
        directories.push({
          path: relativePath,
          depth: depth + 1,
          children_count: childCount
        });
        totalEntries += 1;
        if (depth + 1 < maxDepth) {
          walk(absolute, depth + 1);
        } else if (childCount > 0) {
          omitted.directories += 1;
          omitted.reason = omitted.reason || "depth_limit";
        }
      } else if (entry.isFile()) {
        files.push({
          path: relativePath,
          depth: depth + 1,
          size: safeFileSize(absolute)
        });
        totalEntries += 1;
      }
    }
  }

  walk(root, 0);

  return {
    root,
    max_depth: Number.isFinite(maxDepth) ? maxDepth : "all",
    max_entries: maxEntries,
    directories,
    files,
    omitted
  };
}

function parseInventoryDepth(value) {
  if (!value) return 8;
  if (String(value).toLowerCase() === "all") return Infinity;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("--inventory-depth 必须是正整数或 all。");
  }
  return parsed;
}

function parseInventoryLimit(value) {
  if (!value) return 5000;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 100) {
    throw new Error("--inventory-limit 必须是大于等于 100 的整数。");
  }
  return parsed;
}

function shouldOmitInventoryEntry(name) {
  return [
    ".git",
    "node_modules",
    ".DS_Store",
    ".cache",
    ".next",
    "dist",
    "build",
    "coverage"
  ].includes(name);
}

function safeChildCount(dir) {
  try {
    return fs.readdirSync(dir).filter((name) => !shouldOmitInventoryEntry(name)).length;
  } catch {
    return 0;
  }
}

function safeFileSize(file) {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function detectWorkspaceSignals(inventory) {
  const directories = inventory?.directories || [];
  const files = inventory?.files || [];
  const possibleReferences = directories.filter((dir) => isPossibleReferenceDirectory(dir.path)).map((dir) => dir.path);
  const possibleOutputs = directories.filter((dir) => isPossibleOutputDirectory(dir.path)).map((dir) => dir.path);
  const possibleDrafts = directories.filter((dir) => isPossibleDraftDirectory(dir.path)).map((dir) => dir.path);
  const possibleCurrentWork = directories.filter((dir) => isPossibleCurrentWorkDirectory(dir.path)).map((dir) => dir.path);
  const matterDirs = directories.filter((dir) => isMatterDirectory(dir.path)).map((dir) => dir.path);
  const systemDirs = directories.filter((dir) => isSystemDirectory(dir.path)).map((dir) => dir.path);
  const identityDirs = directories.filter((dir) => isIdentityDirectory(dir.path)).map((dir) => dir.path);
  const lessonsDirs = directories.filter((dir) => isLessonsDirectory(dir.path)).map((dir) => dir.path);
  return {
    agent_entry: files.filter((file) => isAgentEntryFile(file.path)).map((file) => file.path),
    agent_rule_files: files.filter((file) => isAgentEntryFile(file.path) || isAgentRuleFile(file.path)).map((file) => file.path),
    system_dirs: systemDirs,
    matter_dirs: matterDirs,
    possible_reference_dirs: possibleReferences,
    possible_output_dirs: possibleOutputs,
    possible_draft_dirs: possibleDrafts,
    possible_current_work_dirs: possibleCurrentWork,
    project_status_files: files.filter((file) => isProjectStatusFile(file.path)).map((file) => file.path),
    current_work_files: files.filter((file) => isCurrentWorkFile(file.path)).map((file) => file.path),
    decision_files: files.filter((file) => isDecisionFile(file.path)).map((file) => file.path),
    identity_dirs: identityDirs,
    lessons_dirs: lessonsDirs,
    skill_mount_dirs: directories.filter((dir) => isSkillMountDirectory(dir.path)).map((dir) => dir.path),
    readonly_candidate_dirs: uniqueList([...possibleReferences, ...identityDirs, ...lessonsDirs, ...systemDirs]),
    writable_candidate_dirs: uniqueList([...possibleDrafts, ...possibleCurrentWork, ...possibleOutputs, ...matterDirs]),
    readme_files: files.filter((file) => /^README(\.[a-z0-9]+)?$/i.test(path.basename(file.path))).map((file) => file.path)
  };
}

function isAgentEntryFile(relativePath) {
  return ["AGENTS.md", "CLAUDE.md", ".cursorrules"].includes(relativePath)
    || relativePath.endsWith("/AGENTS.md")
    || relativePath.endsWith("/CLAUDE.md");
}

function isAgentRuleFile(relativePath) {
  const base = path.basename(relativePath).toLowerCase();
  return [".cursorrules", ".cursorignore", "agents.md", "claude.md"].includes(base)
    || relativePath.includes(".agents/")
    || relativePath.includes(".claude/");
}

function isProjectStatusFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath).toLowerCase();
  const base = path.basename(normalized);
  return includesAny(base, ["项目状态", "当前项目", "project-status", "current-project", "current-projects"]);
}

function isCurrentWorkFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath).toLowerCase();
  const base = path.basename(normalized);
  return includesAny(base, ["当前工作", "current-work", "current_work", "todo", "tasks"]);
}

function isDecisionFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath).toLowerCase();
  const base = path.basename(normalized);
  return includesAny(base, ["decisions", "decision", "决策"]);
}

function isSkillMountDirectory(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  return normalized === "skills"
    || normalized === ".agents/skills"
    || normalized === ".claude/skills"
    || normalized.endsWith("/.agents/skills")
    || normalized.endsWith("/.claude/skills");
}

function isSystemDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return ["_系统", "_system", "system"].includes(base);
}

function isMatterDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["事项", "matter", "matters"]);
}

function isPossibleReferenceDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["参考", "资料", "素材", "知识", "reference", "references", "ref", "source", "material", "materials", "knowledge"]);
}

function isPossibleOutputDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["输出", "成果", "成稿", "终稿", "交付", "发布", "确认", "output", "outputs", "final", "deliverable", "deliverables", "published", "release"]);
}

function isPossibleDraftDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["草稿", "初稿", "脚本", "draft", "drafts", "script", "scripts"]);
}

function isPossibleCurrentWorkDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["推进", "当前", "任务", "工作台", "work", "working", "tasks", "todo"]);
}

function isIdentityDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["身份", "identity", "profile", "persona"]);
}

function isLessonsDirectory(relativePath) {
  const base = basenameLower(relativePath);
  return includesAny(base, ["教训", "经验", "复盘", "lessons", "learning", "retrospective"]);
}

function basenameLower(relativePath) {
  return path.basename(relativePath).toLowerCase();
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}

function detectLegacyWorkspace(dir, signals = null) {
  const groups = {
    entryRules: ["AGENTS.md", "CLAUDE.md", ".cursorrules"],
    system: ["_系统", "_system", "system"],
    matters: ["事项", "matters"],
    referencesZh: ["参考资料", "资料", "资料库", "素材", "素材库", "知识"],
    referencesEn: ["references", "reference"],
    outputsZh: ["输出", "成果", "成稿", "终稿", "交付物", "发布记录"],
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
  const signalReferences = signals?.possible_reference_dirs || [];
  const signalOutputs = signals?.possible_output_dirs || [];
  const signalMatters = signals?.matter_dirs || [];
  const signalEntries = signals?.agent_entry || [];
  const signalSystems = signals?.system_dirs || [];
  const signalIdentity = signals?.identity_dirs || [];
  const signalLessons = signals?.lessons_dirs || [];
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

  const signalCount = [
    hasEntry || signalEntries.length > 0,
    hasSystem || signalSystems.length > 0,
    hasMatters || signalMatters.length > 0,
    references.length > 0 || signalReferences.length > 0,
    outputs.length > 0 || signalOutputs.length > 0,
    hasIdentityOrLessons || signalIdentity.length > 0 || signalLessons.length > 0
  ].filter(Boolean).length;
  const candidate = signalCount >= 2 || ((references.length > 0 || signalReferences.length > 0) && (outputs.length > 0 || signalOutputs.length > 0));
  const language = inferLegacyLanguage(found);
  const workspaceType = hasMatters || signalMatters.length > 0 ? "single-matter" : "single-light";
  const reasons = buildLegacyReasons({
    found,
    signalReferences,
    signalOutputs,
    signalMatters,
    signalEntries,
    signalSystems,
    signalIdentity,
    signalLessons,
    language,
    workspaceType
  });
  const primaryTrace = [
    ...found.entryRules,
    ...signalEntries,
    ...found.system,
    ...signalSystems,
    ...found.matters,
    ...signalMatters,
    ...references,
    ...signalReferences,
    ...outputs,
    ...signalOutputs
  ][0] || null;

  return {
    candidate,
    confidence: signalCount >= 4 ? "high" : "medium",
    language,
    workspaceType,
    primaryTrace,
    found,
    references: uniqueList([...references, ...signalReferences]),
    outputs: uniqueList([...outputs, ...signalOutputs]),
    reasons
  };
}

function buildLegacyReasons({
  found,
  signalReferences,
  signalOutputs,
  signalMatters,
  signalEntries,
  signalSystems,
  signalIdentity,
  signalLessons,
  language,
  workspaceType
}) {
  const languageReasons = [];
  if (language === "zh") {
    for (const item of [...found.system, ...found.matters, ...found.referencesZh, ...found.outputsZh, ...found.identitySystemZh, ...found.lessonsSystemZh]) {
      languageReasons.push(`${item} 是中文工作区信号`);
    }
  } else {
    for (const item of [...found.system, ...found.matters, ...found.referencesEn, ...found.outputsEn, ...found.identitySystemEn, ...found.lessonsSystemEn]) {
      languageReasons.push(`${item} 是英文工作区信号`);
    }
  }

  const workspaceTypeReasons = workspaceType === "single-matter"
    ? [...found.matters, ...signalMatters].map((item) => `${item} 表示存在事项或多事务推进结构`)
    : ["未检测到事项目录，暂按单事务工作区候选处理"];

  return {
    language: uniqueList(languageReasons),
    workspace_type: uniqueList(workspaceTypeReasons),
    references: uniqueList([...found.referencesZh, ...found.referencesEn, ...signalReferences].map((item) => `${item} 命中参考资料候选信号`)),
    outputs: uniqueList([...found.outputsZh, ...found.outputsEn, ...signalOutputs].map((item) => `${item} 命中成果或输出候选信号`)),
    candidate: uniqueList([
      ...signalEntries.map((item) => `${item} 是 Agent 入口信号`),
      ...signalSystems.map((item) => `${item} 是系统目录信号`),
      ...signalIdentity.map((item) => `${item} 是身份记忆信号`),
      ...signalLessons.map((item) => `${item} 是经验教训信号`)
    ])
  };
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
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

function buildLegacySignals(legacy) {
  return {
    candidate: true,
    source: "legacy-template",
    confidence: legacy.confidence,
    inferred: {
      language: legacy.language,
      workspace_type: legacy.workspaceType,
      references: legacy.references,
      outputs: legacy.outputs,
      reasons: legacy.reasons
    }
  };
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
  const { exitCode, ...publicResult } = result;
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
    console.log("Legacy signals:");
    console.log(`  检测为：历史模板候选（${result.upgrade.confidence} confidence）`);
    console.log(`  推测类型：${result.upgrade.inferred.workspace_type}`);
    console.log(`  推测语言：${result.upgrade.inferred.language}`);
    console.log("  这些只是候选信号，不是迁移方案；请交给 starworkDoctor 做诊断和 blueprint 设计。");
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
  return choose("第 1 步：你要创建哪种工作台？", [
    ["single-light", "单事务项目（推荐）：一个明确目标，资料、草稿、成果分开即可"],
    ["single-matter", "多事务项目（进阶）：同一项目里有多个事项，需要推进、交接和复盘"],
    ["hub", "多项目管理中枢：统一维护身份、教训、知识、skills 和项目登记"]
  ], { defaultIndex: 0 });
}

async function choosePack(workspaceType, workspaceConfig, options) {
  if (workspaceType === "hub") {
    if (!options.yes && process.stdin.isTTY) {
      console.log("");
      console.log("第 3 步：多项目 Hub 会自动使用 hub-management Pack，不需要再选择场景 Pack。");
    }
    return workspaceConfig.defaultPack;
  }

  if (options.yes || !process.stdin.isTTY) {
    return workspaceConfig.defaultPack;
  }

  console.log("");
  console.log("第 3 步：v0.1 单项目先使用通用工作 Pack（general）。");
  console.log("内容创作者等场景 Pack 还在定稿中，暂不在交互流程里主动推荐。");
  return workspaceConfig.defaultPack;
}

function printInitIntro(options, targetDir) {
  if (options.yes || !process.stdin.isTTY) return;
  console.log("");
  console.log("StarWork 初始化向导");
  console.log("");
  console.log(`目标目录：${targetDir}`);
  console.log("我会先确认工作台类型、语言和 Pack，然后给出写入预览。");
}

async function chooseLanguage(options) {
  if (options.yes || !process.stdin.isTTY) {
    return "zh";
  }
  return choose("第 2 步：工作台使用哪种语言？", [
    ["zh", "中文（推荐）：目录、规则和 Pack 内容使用中文"],
    ["en", "English：Pack 内容使用英文；当前 Core Kit 仍以中文结构为主"]
  ], { defaultIndex: 0 });
}

function validateLanguage(language) {
  if (!["zh", "en"].includes(language)) {
    throw new Error(`不支持的语言：${language}。可选值：zh、en。`);
  }
}

async function choose(question, choices, { defaultIndex = 0 } = {}) {
  console.log("");
  console.log(question);
  choices.forEach(([_, label], index) => {
    const marker = index === defaultIndex ? "（默认）" : "";
    console.log(`${index + 1}. ${label}${marker}`);
  });

  while (true) {
    const answer = await ask("请输入序号，或直接回车使用默认项：");
    const trimmed = answer.trim();
    if (!trimmed) {
      return choices[defaultIndex][0];
    }
    const index = Number(trimmed) - 1;
    if (choices[index]) {
      return choices[index][0];
    }
    console.log("没有这个选项，请重新输入。");
  }
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

function buildInitPlan({ targetDir, workspaceName, workspaceType, workspaceConfig, pack, formalSource, includeSkills = true }) {
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

  const kitSkillPlan = includeSkills
    ? buildKitSkillPlan({ targetDir, kit: workspaceConfig.kit, installedBy: "starwork init" })
    : { actions: [], records: [] };
  actions.push(...kitSkillPlan.actions);
  if (workspaceType === "hub") {
    actions.push(fileAction(targetDir, path.join("skills", "registry.json"), renderHubSkillRegistry([])));
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
  actions.push(fileAction(targetDir, path.join(".starwork", "skills.json"), renderProjectSkillsManifest(kitSkillPlan.records)));

  return {
    targetDir,
    workspaceName,
    workspaceType,
    workspaceLabel: workspaceConfig.label,
    kit: workspaceConfig.kit,
    language: pack.language || "zh",
    pack,
    formalSource,
    skills: kitSkillPlan.records,
    actions: dedupeActions(actions)
  };
}

function buildKitSkillPlan({ targetDir, kit, installedBy }) {
  const now = new Date().toISOString();
  const actions = [];
  const records = [];
  const skills = KIT_BUNDLED_SKILLS[kit] || [];

  for (const skill of skills) {
    const sourceDir = path.join(PRODUCT_ROOT, skill.source);
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Kit ${kit} 声明的 Skill 不存在：${skill.id}`);
    }

    const mounts = [];
    for (const install of skill.install || []) {
      if (install.mode === "copy") {
        actions.push(...copyDirectoryFiles(PRODUCT_ROOT, skill.source, targetDir, install.path));
      } else if (install.mode === "symlink") {
        if (!install.source) {
          throw new Error(`Skill ${skill.id} 的 symlink 安装缺少 source。`);
        }
        actions.push(symlinkAction(targetDir, install.path, path.join(targetDir, install.source)));
      } else {
        throw new Error(`Skill ${skill.id} 不支持安装模式：${install.mode}`);
      }
      mounts.push({
        agent: install.agent,
        path: normalizeRelativePath(install.path),
        mode: install.mode
      });
    }

    records.push({
      id: skill.id,
      name: skill.name,
      type: skill.type || "kit-bundled",
      source: {
        kind: skill.sourceKind || "kit",
        kit,
        manifest_id: skill.id
      },
      distribution: skill.distribution || "copy",
      mounts,
      reason: skill.reason,
      installed_by: installedBy,
      installed_at: now
    });
  }

  return { actions, records };
}

function renderProjectSkillsManifest(records) {
  return `${JSON.stringify({
    schema: "starwork.project_skills.v0.1",
    updated_at: new Date().toISOString(),
    skills: records
  }, null, 2)}\n`;
}

function renderHubSkillRegistry(skills) {
  return `${JSON.stringify({
    schema: "starwork.skill_registry.v0.1",
    owner: "hub",
    updated_at: new Date().toISOString(),
    skills
  }, null, 2)}\n`;
}

function buildSpawnSkillPlan({ hubRoot, targetDir, blueprint, kit, installedBy }) {
  const registry = readHubSkillRegistry(hubRoot);
  const registrySkills = Array.isArray(registry.skills) ? registry.skills : [];
  const kitPlan = buildKitSkillPlan({ targetDir, kit, installedBy });
  const kitSkillIds = new Set(kitPlan.records.map((record) => record.id));
  for (const requestedSkill of blueprint?.skills || []) {
    if (requestedSkill.source === "kit" && !kitSkillIds.has(requestedSkill.id)) {
      throw new Error(`Kit ${kit} 未声明自带 Skill：${requestedSkill.id}`);
    }
  }
  const selected = selectSpawnSkills(registrySkills, blueprint);
  const now = new Date().toISOString();
  const actions = [...kitPlan.actions];
  const records = [...kitPlan.records];

  for (const selectedSkill of selected) {
    const registrySkill = registrySkills.find((skill) => skill.id === selectedSkill.id);
    if (!registrySkill) {
      throw new Error(`Hub 托管 Skill 未登记：${selectedSkill.id}`);
    }
    const distribution = selectedSkill.distribution || registrySkill.distribution?.mode || "symlink";
    if (!["symlink", "copy"].includes(distribution)) {
      throw new Error(`Hub 托管 Skill ${selectedSkill.id} 的分发模式不支持：${distribution}`);
    }
    const sourceDir = path.join(hubRoot, "skills", selectedSkill.id);
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Hub 托管 Skill 缺少目录：skills/${selectedSkill.id}`);
    }

    const mounts = [];
    for (const agent of ["codex", "claude"]) {
      const base = agent === "codex" ? path.join(".agents", "skills") : path.join(".claude", "skills");
      const target = path.join(base, selectedSkill.id);
      if (distribution === "symlink") {
        actions.push(symlinkAction(targetDir, target, sourceDir));
      } else {
        actions.push(...copyDirectoryFiles(hubRoot, path.join("skills", selectedSkill.id), targetDir, target));
      }
      mounts.push({
        agent,
        path: normalizeRelativePath(target),
        mode: distribution
      });
    }

    records.push({
      id: selectedSkill.id,
      name: registrySkill.name || selectedSkill.id,
      type: registrySkill.type || "hub-managed",
      source: {
        kind: "hub",
        hub_path: hubRoot,
        registry_id: selectedSkill.id
      },
      distribution,
      mounts,
      reason: selectedSkill.reason || registrySkill.description || "Hub 托管 Skill 按本次 spawn 选择分发。",
      installed_by: installedBy,
      installed_at: now
    });
  }

  return { actions, records };
}

function selectSpawnSkills(registrySkills, blueprint) {
  const selected = [];
  const seen = new Set();
  for (const skill of blueprint?.skills || []) {
    if (skill.source && skill.source !== "hub") continue;
    selected.push(skill);
    seen.add(skill.id);
  }
  for (const skill of registrySkills) {
    if (!skill?.id || seen.has(skill.id)) continue;
    if (skill.distribution?.default_for_spawn) {
      selected.push({
        id: skill.id,
        source: "hub",
        distribution: skill.distribution.mode,
        reason: skill.description
      });
      seen.add(skill.id);
    }
  }
  return selected;
}

function readHubSkillRegistry(hubRoot) {
  const registryPath = path.join(hubRoot, "skills", "registry.json");
  if (!fs.existsSync(registryPath)) {
    return {
      schema: "starwork.skill_registry.v0.1",
      owner: "hub",
      skills: []
    };
  }
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch (error) {
    throw new Error(`无法读取 Hub Skill registry：${error.message}`);
  }
  if (registry.schema !== "starwork.skill_registry.v0.1") {
    throw new Error("Hub Skill registry schema 必须是 starwork.skill_registry.v0.1。");
  }
  if (!Array.isArray(registry.skills)) {
    throw new Error("Hub Skill registry 的 skills 必须是数组。");
  }
  return registry;
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
  for (const skill of blueprint.skills || []) {
    if (!skill?.id || typeof skill.id !== "string") {
      throw new Error("blueprint skills 每一项都必须包含 id。");
    }
    if (skill.source && !["hub", "kit"].includes(skill.source)) {
      throw new Error("blueprint skill.source 只支持 hub 或 kit。");
    }
    if (skill.distribution && !["symlink", "copy"].includes(skill.distribution)) {
      throw new Error("blueprint skill.distribution 只支持 symlink 或 copy。");
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
  actions.push(directoryAction(targetDir, path.join(".agents", "skills")));
  actions.push(directoryAction(targetDir, path.join(".claude", "skills")));
  const skillPlan = buildSpawnSkillPlan({
    hubRoot,
    targetDir,
    blueprint,
    kit: modeConfig.kit,
    installedBy: blueprint ? "starwork spawn --blueprint" : "starwork spawn"
  });
  actions.push(...skillPlan.actions);

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
        source: "skills/registry.json",
        target: [".agents/skills/", ".claude/skills/"],
        mode: "selected",
        items: skillPlan.records.map((record) => ({
          id: record.id,
          distribution: record.distribution,
          mounts: record.mounts
        }))
      }
    }
  };

  actions.push(fileAction(targetDir, path.join(".starwork", "workspace.json"), `${JSON.stringify(workspaceState, null, 2)}\n`));
  actions.push(fileAction(targetDir, path.join(".starwork", "skills.json"), renderProjectSkillsManifest(skillPlan.records)));
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
          skills: "selected"
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
    skills: skillPlan.records,
    actions: dedupeActions(actions)
  };
}

function shouldSpawnOverrideKitFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  return normalized === ".core-sync.json"
    || normalized === "_系统/上下文/当前项目.md"
    || normalized.startsWith("_系统/身份/")
    || normalized.startsWith("_系统/教训/")
    || normalized.startsWith("知识/");
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

function buildLanesInitPlan({ workspaceRoot, lanes }) {
  const actions = [
    directoryAction(workspaceRoot, path.join("_系统", "协作")),
    fileAction(workspaceRoot, path.join("_系统", "协作", "agent-lanes.md"), renderAgentLanesRegistry(lanes)),
    fileAction(workspaceRoot, path.join("_系统", "协作", "shared.md"), renderSharedContext({ outputs: [], requests: [], agreements: [] }))
  ];
  for (const lane of lanes) {
    actions.push(fileAction(workspaceRoot, path.join("_系统", "协作", "lanes", lane.lane, "worklog.md"), renderLaneWorklog(lane.lane)));
  }
  return {
    targetDir: workspaceRoot,
    actions: dedupeActions(actions)
  };
}

function buildLanesRegistryPlan(workspaceRoot, lanes, extraActions = []) {
  return {
    targetDir: workspaceRoot,
    actions: dedupeActions([
      overwriteFileAction(workspaceRoot, path.join("_系统", "协作", "agent-lanes.md"), renderAgentLanesRegistry(lanes)),
      ...extraActions
    ])
  };
}

function buildSharedContextPlan(workspaceRoot, shared) {
  return {
    targetDir: workspaceRoot,
    actions: [
      overwriteFileAction(workspaceRoot, path.join("_系统", "协作", "shared.md"), renderSharedContext(shared))
    ]
  };
}

function readLanesRegistry(workspaceRoot) {
  const registryPath = path.join(workspaceRoot, "_系统", "协作", "agent-lanes.md");
  if (!fs.existsSync(registryPath)) {
    throw new Error("当前工作台尚未启用 Agent Lanes。请先运行 starwork multiagent init。");
  }
  return {
    path: registryPath,
    lanes: parseMarkdownTableSection(fs.readFileSync(registryPath, "utf8"), "## Lanes", ["lane", "purpose", "current_session", "write_scope", "worklog"])
  };
}

function readSharedContext(workspaceRoot) {
  const sharedPath = path.join(workspaceRoot, "_系统", "协作", "shared.md");
  if (!fs.existsSync(sharedPath)) {
    return { outputs: [], requests: [], agreements: [] };
  }
  const content = fs.readFileSync(sharedPath, "utf8");
  return {
    outputs: parseMarkdownTableSection(content, "## Shared Outputs", ["from", "title", "path", "audience", "status", "updated"]),
    requests: parseMarkdownTableSection(content, "## Cross-Lane Requests", ["from", "to", "request", "status", "link"]),
    agreements: parseMarkdownTableSection(content, "## Shared Agreements", ["agreement", "owner", "status", "link"])
  };
}

function parseMarkdownTableSection(content, heading, fields) {
  const lines = content.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) return [];
  const rows = [];
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("## ")) break;
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (!cells.length || cells.every((cell) => /^-+$/.test(cell.replace(/\s/g, "")))) continue;
    if (cells[0] === fields[0]) continue;
    const row = {};
    fields.forEach((field, index) => {
      row[field] = cells[index] || "";
    });
    rows.push(row);
  }
  return rows;
}

function renderAgentLanesRegistry(lanes) {
  return `# Agent Lanes

## Lanes

| lane | purpose | current_session | write_scope | worklog |
|---|---|---|---|---|
${lanes.map((lane) => `| ${escapeMarkdownCell(lane.lane)} | ${escapeMarkdownCell(lane.purpose)} | ${escapeMarkdownCell(lane.current_session || "unbound")} | ${escapeMarkdownCell(lane.write_scope)} | ${escapeMarkdownCell(lane.worklog)} |`).join("\n")}
`;
}

function renderSharedContext(shared) {
  return `# Shared Agent Context

## Shared Outputs

| from | title | path | audience | status | updated |
|---|---|---|---|---|---|
${shared.outputs.map((row) => `| ${escapeMarkdownCell(row.from)} | ${escapeMarkdownCell(row.title)} | ${escapeMarkdownCell(row.path)} | ${escapeMarkdownCell(row.audience)} | ${escapeMarkdownCell(row.status)} | ${escapeMarkdownCell(row.updated)} |`).join("\n")}

## Cross-Lane Requests

| from | to | request | status | link |
|---|---|---|---|---|
${shared.requests.map((row) => `| ${escapeMarkdownCell(row.from)} | ${escapeMarkdownCell(row.to)} | ${escapeMarkdownCell(row.request)} | ${escapeMarkdownCell(row.status)} | ${escapeMarkdownCell(row.link)} |`).join("\n")}

## Shared Agreements

| agreement | owner | status | link |
|---|---|---|---|
${shared.agreements.map((row) => `| ${escapeMarkdownCell(row.agreement)} | ${escapeMarkdownCell(row.owner)} | ${escapeMarkdownCell(row.status)} | ${escapeMarkdownCell(row.link)} |`).join("\n")}
`;
}

function renderLaneWorklog(laneId) {
  const title = laneId.split(/[-_]/).filter(Boolean).map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ") || "Lane";
  return `# ${title} Worklog

## Current

待补充。

## Outputs

| title | path | audience | status |
|---|---|---|---|

## Requests

| to | request | status | link |
|---|---|---|---|

## Notes

待补充。

## Next

待补充。
`;
}

function parseLaneList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeLaneId(item, "lanes"));
}

function normalizeLaneId(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} 必须是非空 lane ID。`);
  }
  const laneId = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(laneId)) {
    throw new Error(`${label} 只能包含字母、数字、短横线和下划线：${value}`);
  }
  return laneId;
}

function findLaneOrThrow(lanes, laneId) {
  const lane = lanes.find((item) => item.lane === laneId);
  if (!lane) {
    throw new Error(`找不到 Lane：${laneId}`);
  }
  return lane;
}

function resolveLaneSession(options) {
  if (options.session) {
    return normalizeMarkdownCell(options.session);
  }
  const agent = options.agent || "codex";
  if (agent === "codex" && process.env.CODEX_THREAD_ID) {
    return `codex:${process.env.CODEX_THREAD_ID}`;
  }
  throw new Error("无法自动识别当前会话。请传入 --session <agent:session-id>。");
}

function normalizeMarkdownCell(value) {
  return String(value || "").replace(/\r?\n/g, " ").trim();
}

function escapeMarkdownCell(value) {
  return normalizeMarkdownCell(value).replace(/\|/g, "\\|");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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

function strictFileAction(targetDir, relativePath, content) {
  const target = path.join(targetDir, relativePath);
  if (fs.existsSync(target)) {
    throw new Error(`目标文件已存在，upgrade 不会覆盖：${relativePath}`);
  }
  return { type: "file", mode: "create", target, relativePath, content };
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
    if (action.mode === "exists" || action.mode === "skip") continue;
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
  console.log(`语言：${plan.language}`);
  console.log(`Pack：${plan.pack.name || PACK_LABELS[plan.pack.id] || plan.pack.id} (${plan.pack.id})`);
  console.log(`工作台名称：${plan.workspaceName}`);
  console.log(`正式成果位置：${plan.formalSource}`);
  if (plan.skills?.length) {
    console.log(`Kit 自带 Skill：${plan.skills.map((skill) => skill.id).join(", ")}`);
  }
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
  if (plan.skills?.length) {
    console.log(`分发 Skill：${plan.skills.map((skill) => skill.id).join(", ")}`);
  }
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

function printUpgradePlan(plan, dryRun) {
  const creates = plan.actions.filter((action) => action.type === "file" && action.mode === "create");
  const overwrites = plan.actions.filter((action) => action.type === "file" && action.mode === "overwrite");
  const dirs = plan.actions.filter((action) => action.type === "directory" && action.mode === "create");
  const existingDirs = plan.actions.filter((action) => action.type === "directory" && action.mode === "exists");

  console.log("");
  console.log(dryRun ? "升级预览（dry run）：" : "升级计划：");
  console.log("");
  console.log(`目标目录：${plan.targetDir}`);
  console.log(`Blueprint：${plan.blueprint.__path}`);
  console.log(`策略：${plan.strategy}`);
  console.log(`工作区类型：${plan.workspaceType}`);
  console.log(`Kit：${plan.kit}`);
  console.log(`语言：${plan.language}`);
  console.log(`Pack：${plan.pack ? `${plan.pack.name || plan.pack.id} (${plan.pack.id})` : "(none)"}`);
  console.log(`正式事实源：${plan.blueprint.paths.formal_source}`);
  console.log(`当前工作区：${plan.blueprint.paths.business_work_area}`);
  console.log("");

  if (dirs.length) {
    console.log("将创建目录：");
    dirs.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (creates.length) {
    console.log("将创建文件：");
    creates.slice(0, 60).forEach((action) => console.log(`- ${action.relativePath}`));
    if (creates.length > 60) console.log(`- ... 另有 ${creates.length - 60} 项`);
    console.log("");
  }
  if (overwrites.length) {
    console.log("将注入或更新文件：");
    overwrites.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (existingDirs.length) {
    console.log("会保留并复用已有目录：");
    existingDirs.forEach((action) => console.log(`- ${action.relativePath}`));
    console.log("");
  }
  if (plan.blueprint.preserve?.length) {
    console.log("明确保留不移动：");
    plan.blueprint.preserve.forEach((item) => console.log(`- ${item}`));
    console.log("");
  }
}

function renderUpgradePlanJson(plan, dryRun) {
  return {
    schema: "starwork.upgrade.plan_result.v0.1",
    target: plan.targetDir,
    dry_run: Boolean(dryRun),
    ok: true,
    strategy: plan.strategy,
    workspace_type: plan.workspaceType,
    kit: plan.kit,
    language: plan.language,
    pack: plan.pack?.id || null,
    actions: plan.actions.map((action) => ({
      type: action.type,
      mode: action.mode,
      path: action.relativePath,
      status: action.mode === "exists" ? "exists" : "planned"
    })),
    blocked: [],
    warnings: []
  };
}

function renderUpgradeExecutionJson(plan) {
  return {
    schema: "starwork.upgrade.execution_result.v0.1",
    target: plan.targetDir,
    ok: true,
    executed: plan.actions
      .filter((action) => action.mode !== "exists" && action.mode !== "skip")
      .map((action) => ({
        type: action.type,
        mode: action.mode,
        path: action.relativePath,
        status: "done"
      })),
    skipped: plan.actions
      .filter((action) => action.mode === "exists" || action.mode === "skip")
      .map((action) => ({
        type: action.type,
        mode: action.mode,
        path: action.relativePath,
        status: "skipped"
      })),
    next_check: `starwork doctor --target ${plan.targetDir}`
  };
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
  console.log(`StarWork CLI ${PACKAGE_VERSION}

Usage:
  starwork <command> [options]

Commands:
  init             创建单项目工作台或多项目 Hub。
  doctor           检查工作台或历史模板目录，并输出事实。
  spawn            从健康 Hub 生成新的项目工作台。
  upgrade          执行由 skill 生成的升级 blueprint。
  adapt            生成轻量 Agent 适配入口。
  pack install     向健康工作台安装兼容 Pack。
  multiagent       管理多 Agent 职责位、会话绑定和共享索引。

常用开始：
  starwork init --type single-light --pack general --language zh --target ./my-workspace --yes
  starwork init --type hub --language zh --target ./my-hub --yes
  starwork doctor --target ./my-workspace
  starwork multiagent init --lanes research,writing,review --target ./my-workspace --yes
  starwork spawn --hub ./my-hub --name "New Project" --target ./new-project --mode matter --yes

全局选项：
  --help, -h       查看帮助。
  --version, -v    查看 CLI 版本。

查看命令帮助：
  starwork init --help
  starwork doctor --help
  starwork spawn --help
  starwork upgrade --help
  starwork adapt --help
  starwork pack install --help
  starwork multiagent --help
`);
}

function printVersion() {
  console.log(PACKAGE_VERSION);
}

function printInitHelp() {
  console.log(`StarWork Init

Usage:
  starwork init [options]

用 Kit + Pack 创建 StarWork 工作台。v0.1 中，单项目默认使用 general Pack，
Hub 工作台使用 hub-management Pack。

Options:
  --type <single-light|single-matter|hub>
  --pack <general|content-creator|hub-management|path>
  --language <zh|en>
  --name <name>
  --formal-source <path>
  --target <path>
  --dry-run
  --no-skills
  --yes, -y

示例：
  starwork init --type single-light --pack general --language zh --target ./my-workspace --yes
  starwork init --type hub --language zh --target ./my-hub --yes
  starwork init --type single-matter --pack general --target ./complex-project --dry-run
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

示例：
  starwork spawn --hub ./my-hub --name "New Project" --target ./new-project --mode matter --yes
  starwork spawn --hub ./my-hub --target ./new-project --blueprint ./blueprint.json --dry-run
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
  --inventory-depth <number|all>
  --inventory-limit <number>

示例：
  starwork doctor --target ./my-workspace
  starwork doctor --target ./old-workspace --json --inventory-depth all
`);
}

function printUpgradeHelp() {
  console.log(`StarWork Upgrade

Usage:
  starwork upgrade --target <path> --blueprint <upgrade-blueprint.json> --dry-run
  starwork upgrade --target <path> --blueprint <upgrade-blueprint.json> --yes

Options:
  --target <path>
  --blueprint <upgrade-blueprint.json>
  --dry-run
  --json
  --yes, -y

示例：
  starwork upgrade --target ./old-workspace --blueprint ./upgrade-blueprint.json --dry-run
  starwork upgrade --target ./old-workspace --blueprint ./upgrade-blueprint.json --yes
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

示例：
  starwork adapt claude --target ./my-workspace --yes
  starwork adapt all --target ./my-workspace --dry-run
`);
}

function printPackHelp() {
  console.log(`StarWork Pack

Usage:
  starwork pack install <pack> [options]

示例：
  starwork pack install general --target ./my-workspace --dry-run
  starwork pack install content-creator --target ./my-workspace --yes
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

示例：
  starwork pack install general --target ./my-workspace --dry-run
  starwork pack install content-creator --target ./my-workspace --yes
`);
}

function printLanesHelp() {
  console.log(`StarWork Multiagent

Usage:
  starwork multiagent <init|add|bind|release|status|share> [options]

Agent Lanes 用于同一项目内多个 Agent 会话按项目自定义职责位协作。

Subcommands:
  init       创建 Agent Lanes 协作文件。
  add        新增一个 lane。
  bind       将当前会话绑定到 lane。
  release    释放 lane 的当前会话绑定。
  status     查看 lane 分工和共享请求。
  share      登记一个跨 lane 可读输出。

示例：
  starwork multiagent init --lanes research,writing,review --target ./my-workspace --yes
  starwork multiagent add review --purpose "审校和风险检查" --write "reviews/**,product/docs/**" --target ./my-workspace --yes
  starwork multiagent bind research --session codex:manual-research-1 --target ./my-workspace --yes
`);
}

function printLanesInitHelp() {
  console.log(`StarWork Multiagent Init

Usage:
  starwork multiagent init [options]

Options:
  --target <path>
  --lanes <lane1,lane2>
  --dry-run
  --yes, -y

示例：
  starwork multiagent init --lanes research,writing,review --target ./my-workspace --yes
`);
}

function printLanesAddHelp() {
  console.log(`StarWork Multiagent Add

Usage:
  starwork multiagent add <lane-id> --purpose <text> --write <path-globs> [options]

Options:
  --target <path>
  --purpose <text>
  --write <path-globs>
  --dry-run
  --yes, -y
`);
}

function printLanesBindHelp() {
  console.log(`StarWork Multiagent Bind

Usage:
  starwork multiagent bind <lane-id> [options]

Options:
  --target <path>
  --agent <codex|claude|cursor|trae|manual>
  --session <agent:session-id>
  --dry-run
  --yes, -y
`);
}

function printLanesReleaseHelp() {
  console.log(`StarWork Multiagent Release

Usage:
  starwork multiagent release <lane-id> [options]

Options:
  --target <path>
  --dry-run
  --yes, -y
`);
}

function printLanesStatusHelp() {
  console.log(`StarWork Multiagent Status

Usage:
  starwork multiagent status [options]

Options:
  --target <path>
  --json
`);
}

function printLanesShareHelp() {
  console.log(`StarWork Multiagent Share

Usage:
  starwork multiagent share <from-lane> --title <title> --path <relative-path> --audience <lanes> [options]

Options:
  --target <path>
  --title <title>
  --path <relative-path>
  --audience <lane-list>
  --status <draft|ready|confirmed>
  --dry-run
  --yes, -y
`);
}

module.exports = { run };
