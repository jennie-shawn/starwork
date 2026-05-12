#!/usr/bin/env node

const { run } = require("../src/cli");

run(process.argv.slice(2)).catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
