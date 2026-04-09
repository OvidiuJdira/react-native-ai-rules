// Reminds the model to run test coverage, /review, and include code review
// feedback after writing source files. Skips test files, .md, and .json.

const fs = require("fs");

const hookInput = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const filePath =
  hookInput.tool_input?.file_path || hookInput.tool_response?.filePath || "";

if (!filePath) process.exit(0);
if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0);
if (/\.(md|json|sh)$/.test(filePath)) process.exit(0);
if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        "Post-write checklist: (1) Run tests with coverage for affected files. (2) Run /review skill. (3) Include Code Review Feedback section with Possible Rules and Possible Improvements.",
    },
  }),
);
