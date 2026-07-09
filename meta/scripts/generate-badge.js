const fs = require("fs");
const path = require("path");

const reportPath = path.join(__dirname, "../../", "eslint-report.json");

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

const badge = {
    schemaVersion: 1,
    label: "Lint",
    message: `${errors} errors`,
    color
};

const outputDir = path.join(__dirname, "..", "badges");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

fs.writeFileSync(
    path.join(outputDir, "badge.json"),
    JSON.stringify(badge, null, 2)
);

console.log(`Badge created (${errors} errors, ${warnings} warnings)`);