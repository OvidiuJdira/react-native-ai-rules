// Sets a sentinel file when a .ts/.tsx file is written/edited.
// Used by the Stop hook to know whether tests need to run before stopping.

const fs = require("fs");

const hookInput = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const filePath =
  hookInput.tool_input?.file_path || hookInput.tool_response?.filePath || "";

if (!filePath) process.exit(0);
if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);

fs.writeFileSync("/tmp/claude-code-generated", "");
