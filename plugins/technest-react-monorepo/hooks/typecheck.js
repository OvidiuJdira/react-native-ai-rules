// Runs TypeScript type checking on written/edited .ts/.tsx files.
// Reports up to 5 type errors back to the model as additional context.

const fs = require("fs");
const { execSync } = require("child_process");

const hookInput = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const filePath =
  hookInput.tool_input?.file_path || hookInput.tool_response?.filePath || "";

if (!filePath) process.exit(0);
if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);

try {
  execSync("npx tsc --noEmit --pretty false", {
    stdio: "pipe",
    encoding: "utf8",
  });
  console.log(JSON.stringify({ continue: true }));
} catch (error) {
  const output = (error.stdout || "") + (error.stderr || "");
  const errors = output
    .split("\n")
    .filter((line) => line.includes(filePath))
    .slice(0, 5)
    .join("; ");

  if (errors) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: `TypeScript errors in ${filePath}: ${errors}`,
        },
      }),
    );
  } else {
    console.log(JSON.stringify({ continue: true }));
  }
}
