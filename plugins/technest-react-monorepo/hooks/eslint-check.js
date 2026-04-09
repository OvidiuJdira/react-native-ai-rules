// Runs ESLint on written/edited .ts/.tsx/.js/.jsx files.
// Reports up to 5 errors/warnings back to the model as additional context.

const fs = require("fs");
const { execSync } = require("child_process");

const hookInput = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const filePath =
  hookInput.tool_input?.file_path || hookInput.tool_response?.filePath || "";

if (!filePath) process.exit(0);
if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0);

try {
  execSync(`npx eslint --no-error-on-unmatched-pattern "${filePath}"`, {
    stdio: "pipe",
    encoding: "utf8",
  });
  console.log(JSON.stringify({ continue: true }));
} catch (error) {
  const output = (error.stdout || "") + (error.stderr || "");
  const errors = output
    .split("\n")
    .filter((line) => /\d+:\d+\s+(error|warning)/.test(line))
    .slice(0, 5)
    .join("; ");

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `ESLint errors in ${filePath}: ${errors}`,
      },
    }),
  );
}
