const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const logsDir = path.join(process.cwd(), "logs");
const logPath = path.join(logsDir, "expo.log");
const isLinux = process.platform === "linux";

fs.mkdirSync(logsDir, { recursive: true });
fs.writeFileSync(logPath, "");

function shellArg(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function stripControl(input) {
  return input
    .replace(/\x00/g, "")
    .replace(/\x1B\][^\x07]*(?:\x07|\x1B\\)/g, "")
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r/g, "\n");
}

const port = process.env.EXPO_PORT || "8081";
const command = ["expo", "start", "--port", port, ...process.argv.slice(2)]
  .map(shellArg)
  .join(" ");
const child = isLinux
  ? spawn("script", ["-q", "-f", "-c", command, "/dev/null"], {
      env: {
        ...process.env,
        FORCE_COLOR: "0",
        NO_COLOR: "1"
      },
      stdio: ["inherit", "pipe", "pipe"]
    })
  : spawn(command, {
      env: {
        ...process.env,
        FORCE_COLOR: "0",
        NO_COLOR: "1"
      },
      shell: true,
      stdio: ["inherit", "pipe", "pipe"]
    });

function write(chunk, stream) {
  const raw = chunk.toString("utf8");
  const clean = stripControl(raw);
  fs.appendFileSync(logPath, clean);
  stream.write(raw);
}

child.stdout.on("data", (chunk) => write(chunk, process.stdout));
child.stderr.on("data", (chunk) => write(chunk, process.stderr));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
