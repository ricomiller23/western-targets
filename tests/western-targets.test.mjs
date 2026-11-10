import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/western-targets.json");

test("WESTERN TARGETS — Prebuild Assertion Test Suite v1.0 (Audited Western OTC Universe)", async (t) => {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const { metadata, targets } = raw;

  await t.test("Test 1: Full cohort of 119 Western targets verified and 100% reconciled", () => {
    assert.equal(targets.length, 119, "Targets length must be exactly 119");
    assert.equal(metadata.totalTargets, 119, "Metadata totalTargets must be 119");

    const sumTiers = metadata.criticalCount + metadata.urgentCount + metadata.moderateCount + metadata.stableCount + metadata.unratedCount;
    assert.equal(sumTiers, 119, `Tiers must reconcile to 119 (got ${sumTiers})`);
  });

  await t.test("Test 2: Western state distribution correctly maps to 6 states", () => {
    const states = targets.reduce((acc, curr) => {
      acc[curr.state] = (acc[curr.state] || 0) + 1;
      return acc;
    }, {});

    assert.equal(states["California"], 60, "California must have 60 targets");
    assert.equal(states["Nevada"], 31, "Nevada must have 31 targets");
    assert.equal(states["Arizona"], 12, "Arizona must have 12 targets");
    assert.equal(states["Colorado"], 6, "Colorado must have 6 targets");
    assert.equal(states["Wyoming"], 6, "Wyoming must have 6 targets");
    assert.equal(states["Idaho"], 4, "Idaho must have 4 targets");
  });

  await t.test("Test 3: Core verified targets have primary audit facts intact", () => {
    const dpls = targets.find(x => x.ticker === "DPLS");
    assert.ok(dpls, "DPLS must exist");
    assert.equal(dpls.cik, "0000866439");
    assert.equal(dpls.financialMetrics.cashOnHand, 83182);
    assert.equal(dpls.state, "Arizona");

    const aerg = targets.find(x => x.ticker === "AERG");
    assert.ok(aerg, "AERG must exist");
    assert.equal(aerg.cik, "0000879911");
    assert.equal(aerg.state, "Arizona");
    assert.equal(aerg.registrationStatements2Y.activeShelvesFiled, 1);

    const funn = targets.find(x => x.ticker === "FUNN");
    assert.ok(funn, "FUNN must exist");
    assert.equal(funn.secStatus, "otc_alternative_reporting");
    assert.equal(funn.contacts[0].name, "Benjamin Castanie");

    const ceti = targets.find(x => x.ticker === "CETI");
    assert.ok(ceti, "CETI must exist");
    assert.equal(ceti.cik, "0001935092");

    const lbsr = targets.find(x => x.ticker === "LBSR");
    assert.ok(lbsr, "LBSR must exist");
    assert.equal(lbsr.cik, "0001172178");

    const gstx = targets.find(x => x.ticker === "GSTX");
    assert.ok(gstx, "GSTX must exist");
    assert.equal(gstx.cik, "0001497649");
  });

  await t.test("Test 4: Every target has required market, financial, and contact telemetry", () => {
    for (const target of targets) {
      assert.ok(target.id, "Target must have id");
      assert.ok(target.ticker, "Target must have ticker");
      assert.ok(target.name, "Target must have name");
      assert.ok(target.state, "Target must have state");
      assert.ok(target.tier, "Target must have tier");
      assert.ok(target.marketData.priceDisplay, "Target must have priceDisplay");
      assert.ok(target.financialMetrics.cashOnHandDisplay, "Target must have cashOnHandDisplay");
      assert.ok(target.contacts.length >= 1, `Target ${target.ticker} must have at least 1 contact`);
    }
  });

  await t.test("Test 5: Security Assertion - Next.js unoptimized image security policy enforced", () => {
    const nextConfigContent = fs.readFileSync(path.resolve(__dirname, "../next.config.ts"), "utf8");
    assert.match(nextConfigContent, /unoptimized:\s*true/, "next.config.ts must enforce unoptimized: true");
  });
});
