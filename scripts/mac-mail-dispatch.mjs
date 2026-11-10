// mac-mail-dispatch.mjs — Dispatch engine for Maxim targets via Apple Mail (ricomiller@gmail.com)
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const targets = raw.targets;

const isExecute = process.argv.includes("--execute") || process.env.LIVE_SEND === "1";
const batchArgIndex = process.argv.indexOf("--batch");
const requestedBatch = batchArgIndex !== -1 ? parseInt(process.argv[batchArgIndex + 1], 10) : parseInt(process.env.BATCH_SIZE || "5", 10);
const BATCH_SIZE = isNaN(requestedBatch) ? 5 : requestedBatch;

console.log("======================================================================");
console.log("MAXIM TARGETS — NATIVE MACOS OUTREACH DISPATCH ENGINE");
console.log("======================================================================");
console.log(`Mode: ${isExecute ? "LIVE SEND (Apple Mail ricomiller@gmail.com)" : "DRY RUN (Preview Only)"}`);
console.log(`Universe: ${targets.length} companies | Batch Size: ${BATCH_SIZE}`);
console.log("======================================================================\n");

const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical" || t.financialMetrics.capitalNeedUrgency === "urgent");
const batch = (critical.length >= BATCH_SIZE ? critical : targets).slice(0, BATCH_SIZE);

function sendEmailViaAppleMail(to, subject, body) {
  const escapedSubject = JSON.stringify(subject).slice(1, -1);
  const escapedBody = JSON.stringify(body).slice(1, -1);

  const appleScript = `tell application "Mail"
  set newMsg to make new outgoing message with properties {sender:"Eric Miller <ricomiller@gmail.com>", subject:"${escapedSubject}", content:"${escapedBody}", visible:false}
  tell newMsg
    make new to recipient at end of to recipients with properties {address:"${to}"}
    send
  end tell
end tell`;

  try {
    execSync("osascript", { input: appleScript, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch (err) {
    console.error(`❌ Transmission error for ${to}:`, err.message);
    return false;
  }
}

for (let i = 0; i < batch.length; i++) {
  const t = batch[i];
  const ceo = t.contacts.find(c => c.id.includes("ceo")) || t.contacts[0];
  const subject = t.outreach.managementSubject;
  const body = t.outreach.managementBody;

  console.log("----------------------------------------------------------------------");
  console.log(`[${i + 1}/${batch.length}] TARGET: ${t.ticker} (${t.name})`);
  console.log(`Recipient: ${ceo.name} <${ceo.email}>`);
  console.log(`Subject: ${subject}`);
  console.log("Body Snippet:");
  console.log(body.split("\n").slice(0, 4).join("\n") + "\n...");

  if (isExecute) {
    const ok = sendEmailViaAppleMail(ceo.email, subject, body);
    if (ok) {
      console.log("Status: ✓ SENT via ricomiller@gmail.com");
    } else {
      console.log("Status: ✗ FAILED");
    }
    if (i < batch.length - 1) {
      execSync("sleep 4");
    }
  } else {
    console.log("Status: [PREVIEW ONLY — Dry Run]");
  }
}

console.log("\n======================================================================");
console.log("To execute live dispatches: node scripts/mac-mail-dispatch.mjs --execute --batch 5");
console.log("======================================================================");
