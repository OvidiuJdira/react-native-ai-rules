// Audits written/edited source files for common CLAUDE.md rule violations.
// Checks: Paper imports, router.push in hooks, require(), hardcoded colors,
// window. usage. Reports violations as additional context.

const fs = require("fs");

const hookInput = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const filePath =
  hookInput.tool_input?.file_path || hookInput.tool_response?.filePath || "";

if (!filePath) process.exit(0);
if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0);
if (/\.(md|json|sh)$/.test(filePath)) process.exit(0);
if (/\.config\.(ts|js|mjs)$/.test(filePath)) process.exit(0);
if (/\.claude\//.test(filePath)) process.exit(0);
if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0);
if (!fs.existsSync(filePath)) process.exit(0);

const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");
const violations = [];

// 1. Direct react-native-paper imports in page/feature files (not in components/)
if (
  !/\/components\//.test(filePath) &&
  /from\s+['"]react-native-paper['"]/.test(content)
) {
  lines.forEach((line, index) => {
    if (/from\s+['"]react-native-paper['"]/.test(line)) {
      violations.push(
        `Line ${index + 1}: Direct react-native-paper import (use custom components from @/components)`,
      );
    }
  });
}

// 2. router.push/replace in hooks (not in NavigationHandler files)
if (/use.*\.ts$/.test(filePath) && !/NavigationHandler/.test(filePath)) {
  lines.forEach((line, index) => {
    if (/router\.(push|replace)\(/.test(line)) {
      violations.push(
        `Line ${index + 1}: router.push/replace in hook (use navigationTarget pattern)`,
      );
    }
  });
}

// 3. require() imports (excluding jest patterns and this hooks directory)
if (!/\.claude\/hooks\//.test(filePath)) {
  lines.forEach((line, index) => {
    if (/require\(/.test(line) && !/jest\.requireActual/.test(line)) {
      violations.push(`Line ${index + 1}: require() used (use ES import)`);
    }
  });
}

// 4. Hardcoded hex colors in non-theme/non-style config files
if (!/(?:colors|theme|Colors)\.(ts|tsx)$/.test(filePath)) {
  lines.forEach((line, index) => {
    if (/['"]#[0-9a-fA-F]{3,8}['"]/.test(line)) {
      violations.push(
        `Line ${index + 1}: Hardcoded hex color (use theme tokens)`,
      );
    }
  });
}

// 5. window. usage (should use globalThis, except typeof window checks)
lines.forEach((line, index) => {
  if (/window\./.test(line) && !/typeof window/.test(line)) {
    violations.push(`Line ${index + 1}: window. used (use globalThis instead)`);
  }
});

if (violations.length > 0) {
  const details = violations.slice(0, 8).join("; ");
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `Rule violations in ${filePath}: ${details}`,
      },
    }),
  );
} else {
  console.log(JSON.stringify({ continue: true }));
}
