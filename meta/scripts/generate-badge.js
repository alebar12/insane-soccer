const fs = require("fs");
const path = require("path");

const projectRoot = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, "../../");
const outputDir = path.join(projectRoot, "dist", "badges");

// eslint report
let reportPath = path.join(projectRoot, "dist/reports", "eslint-report.json");

if (!fs.existsSync(reportPath)) {
    console.error("eslint-report.json non trovato");
    process.exit(1);
}

let report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

let errors = 0;
let warnings = 0;

for (const file of report) {
    errors += file.errorCount;
    warnings += file.warningCount;
}

let color = "brightgreen";

if (errors > 0 && errors <= 5) {
    color = "yellow";
} else if (errors > 5) {
    color = "red";
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

let badge = {
    schemaVersion: 1,
    label: "Lint",
    message: `${errors} errors`,
    color
};

fs.writeFileSync(
    path.join(outputDir, "lint-badge.json"),
    JSON.stringify(badge, null, 2)
);

// typecheck report

badge = {
    schemaVersion: 1,
    label: "Type Check",
    message: `OK`,
    color: "brightgreen"
};

fs.writeFileSync(
    path.join(outputDir, "typecheck-badge.json"),
    JSON.stringify(badge, null, 2)
);

// semgrep report

reportPath = path.join(projectRoot, "dist/reports", "semgrep.json");

if (!fs.existsSync(reportPath)) {
    console.error("semgrep.json non trovato");
    process.exit(1);
}

report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

errors = report.results.length;
color = "brightgreen";

if (errors > 0 && errors <= 5) {
    color = "yellow";
} else if (errors > 5) {
    color = "red";
}

badge = {
    schemaVersion: 1,
    label: "Semgrep",
    message: `${errors} issues`,
    color
};

fs.writeFileSync(
    path.join(outputDir, "semgrep-badge.json"),
    JSON.stringify(badge, null, 2)
);
