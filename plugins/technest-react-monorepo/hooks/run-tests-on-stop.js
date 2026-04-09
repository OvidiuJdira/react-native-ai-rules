// Runs unit tests before allowing the session to stop.
// Only triggers if .ts/.tsx files were written during the session
// (detected via /tmp/claude-code-generated sentinel file).
// Blocks the stop if any test suite fails.

const fs = require("fs");
const { execSync } = require("child_process");

const SENTINEL = "/tmp/claude-code-generated";

if (!fs.existsSync(SENTINEL)) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

fs.unlinkSync(SENTINEL);

try {
  execSync("npx jest --no-coverage --passWithNoTests", {
    cwd: "apps/mobile",
    stdio: "pipe",
    encoding: "utf8",
  });
  console.log(JSON.stringify({ continue: true }));
} catch (error) {
  const output = (error.stdout || "") + (error.stderr || "");

  if (/Test Suites:.*failed/.test(output)) {
    const summary = output
      .split("\n")
      .filter((line) => /FAIL|Test Suites:|Tests:/.test(line))
      .join(" ");

    console.log(
      JSON.stringify({
        decision: "block",
        reason: `Tests failed — fix them before stopping: ${summary}`,
      }),
    );
  } else {
    console.log(JSON.stringify({ continue: true }));
  }
}
