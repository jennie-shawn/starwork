const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..", "..");
const bin = path.join(root, "cli", "bin", "starwork.js");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "starwork-init-test-"));
}

function runInit(args) {
  return execFileSync(process.execPath, [bin, "init", ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("dry-run does not write files", () => {
  const dir = tempDir();
  const output = runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--dry-run"]);

  assert.match(output, /初始化预览/);
  assert.equal(fs.existsSync(path.join(dir, "AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "workspace.json")), false);
});

test("creates a single-light workspace with general pack", () => {
  const dir = tempDir();
  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  assert.equal(state.workspace_type, "single-light");
  assert.equal(state.kit, "zh-local-starter");
  assert.equal(state.packs[0].id, "general");
  assert.equal(fs.existsSync(path.join(dir, "AGENTS.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "outputs", "final", "README.md")), true);
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
  assert.equal(fs.existsSync(path.join(dir, "发布记录", "README.md")), true);
  assert.equal(fs.existsSync(path.join(dir, ".starwork", "packs", "content-creator", "templates", "content-brief.md")), true);
});

test("creates a hub workspace with hub management pack", () => {
  const dir = tempDir();
  runInit(["--type", "hub", "--target", dir, "--yes"]);

  const state = readJson(path.join(dir, ".starwork", "workspace.json"));
  assert.equal(state.workspace_type, "hub");
  assert.equal(state.kit, "zh-hub");
  assert.equal(state.packs[0].id, "hub-management");
  assert.equal(fs.existsSync(path.join(dir, "projects", "registry.json")), true);
  assert.equal(fs.existsSync(path.join(dir, ".incoming", "README.md")), true);
});

test("does not overwrite existing user files", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "README.md"), "# Existing\n", "utf8");

  runInit(["--type", "single-light", "--pack", "general", "--target", dir, "--yes"]);

  assert.equal(fs.readFileSync(path.join(dir, "README.md"), "utf8"), "# Existing\n");
  assert.equal(fs.existsSync(path.join(dir, "README.starwork-new.md")), true);
});
