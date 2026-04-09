// Auto-runs pnpm install when package.json or pnpm-lock.yaml is modified.

const fs = require("fs");
const { execSync } = require("child_process");

const hookInput = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const filePath =
  hookInput.tool_input?.file_path || hookInput.tool_response?.filePath || "";

if (!filePath) process.exit(0);
if (!/(package\.json|pnpm-lock\.yaml)$/.test(filePath)) process.exit(0);

try {
  execSync("pnpm install --silent", { stdio: "pipe" });
} catch (_) {
  // Silent failure — dependency install is best-effort
}
