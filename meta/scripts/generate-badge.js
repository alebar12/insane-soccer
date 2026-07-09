const fs = require("fs");
const path = require("path");

const projectRoot = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, "../../");
const reportPath = path.join(projectRoot, "dist/reports", "eslint-report.json");

if (!fs.existsSync(reportPath)) {
    console.error("eslint-report.json non trovato");
    process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

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

const outputDir = path.join(projectRoot, "dist", "badges");

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


badge = {
    schemaVersion: 1,
    label: "Type Check",
    message: `OK`,
    "brightgreen"
};

fs.writeFileSync(
    path.join(outputDir, "typecheck-badge.json"),
    JSON.stringify(badge, null, 2)
);
