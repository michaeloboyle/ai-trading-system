#!/usr/bin/env node
/**
 * Rank exchanges from a JSON file exported via GitHub CLI:
 * gh issue list --label exchange --limit 100 --json number,title,labels,body > exchanges.json
 */

const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: node scripts/rank-exchanges.js <issues.json>');
  process.exit(1);
}

const path = process.argv[2];
const raw = fs.readFileSync(path, 'utf8');
const issues = JSON.parse(raw);

function extract(field, body) {
  // Match the field label followed by its value, until a blank line
  const re = new RegExp(String.raw`^${field}\s*\n\s*([\s\S]*?)\n\n`, 'm');
  const m = body.match(re);
  return m ? m[1].trim() : '';
}

function num(val, def = 0) {
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : def;
}

function mapEffort(points) {
  const p = num(points, 5);
  if (p <= 1) return 0;
  if (p <= 2) return 0.5;
  if (p <= 3) return 1;
  if (p <= 5) return 2;
  if (p <= 8) return 3;
  return 5; // 13 or more
}

function regPenalty(level) {
  const v = (level || '').toLowerCase();
  if (v.includes('low')) return 0;
  if (v.includes('med')) return 0.5;
  if (v.includes('high')) return 1;
  return 0.5;
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function score(issue) {
  const b = issue.body || '';
  const edge = num(extract('Expected strategy edge', b), 0); // 0-5
  const liq = num(extract('Estimated liquidity score', b), 0); // 0-5
  const taker = num(extract('Taker fee', b), 10);
  const maker = num(extract('Maker fee', b), taker);
  const avgBps = (taker + maker) / 2;
  const feeEff = clamp(5 - avgBps / 10, 0, 5);
  const latency = num(extract('Data latency', b), 200);
  const histVal = extract('Historical data availability', b);
  const hasHistFull = /Full/i.test(histVal);
  const hasHistPartial = /Partial/i.test(histVal);
  const dataQ = clamp(5 - latency / 200, 0, 5) + (hasHistFull ? 1 : hasHistPartial ? 0.5 : 0);
  const protos = extract('API protocols', b);
  const rest = /REST/i.test(protos) ? 1 : 0;
  const ws = /WebSocket/i.test(protos) ? 1 : 0;
  const paper = /Paper\/sandbox environment available\?\s*\n\s*Yes/m.test(b) ? 1 : 0;
  const kycBlock = extract('KYC\/Account requirements', b);
  const kyc = /Standard/i.test(kycBlock) ? 0.5 : (/Enhanced/i.test(kycBlock) ? 0 : 0.25);
  const marketAccess = clamp(rest + ws + paper + kyc, 0, 5);
  const reg = extract('Regulatory complexity', b);
  const regC = regPenalty(reg);
  const effort = extract('Estimated engineering effort', b);
  const effortN = mapEffort(effort);
  const conf = num(extract('Confidence', b), 0.5);

  const profitability =
    0.30 * edge +
    0.20 * liq +
    0.10 * feeEff +
    0.10 * Math.min(dataQ, 5) +
    0.10 * marketAccess -
    0.10 * regC -
    0.10 * effortN;

  const priority = profitability * conf;

  return { edge, liq, feeEff, dataQ: Math.min(dataQ, 5), marketAccess, regC, effortN, conf, profitability, priority };
}

const rows = issues.map((i) => ({
  number: i.number,
  title: i.title,
  ...score(i),
}));

rows.sort((a, b) => b.priority - a.priority);

function fmt(n, d = 2) { return Number.isFinite(n) ? n.toFixed(d) : '-'; }

console.log('No.  Priority  Profit  Conf  Edge  Liq  Fee  Data  Access  Reg  Eff  Title');
for (const r of rows) {
  console.log(
    String(r.number).padEnd(4),
    fmt(r.priority).padEnd(8),
    fmt(r.profitability).padEnd(7),
    fmt(r.conf).padEnd(5),
    fmt(r.edge).padEnd(5),
    fmt(r.liq).padEnd(4),
    fmt(r.feeEff).padEnd(4),
    fmt(r.dataQ).padEnd(5),
    fmt(r.marketAccess).padEnd(6),
    fmt(r.regC).padEnd(4),
    fmt(r.effortN).padEnd(4),
    r.title
  );
}

