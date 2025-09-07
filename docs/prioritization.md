# Exchange Prioritization Rubric

Use this rubric to triage and rank exchange integrations created via the "Exchange Integration" issue form.

## Scoring Model

- Profitability Score =
  - 0.30 × Strategy Edge (0-5)
  - + 0.20 × Liquidity (0-5)
  - + 0.10 × Fee Efficiency (inferred from maker/taker bps; lower is better)
  - + 0.10 × Data Quality (latency + historical availability)
  - + 0.10 × Market Access (paper env, API protocols, KYC)
  - − 0.10 × Regulatory Complexity (Low=0, Med=0.5, High=1)
  - − 0.10 × Engineering Effort (normalized from Fibonacci points)

- Priority Score = Profitability Score × Confidence (0.0–1.0)

Normalize as follows:
- Fee Efficiency = clamp(5 − (avg_bps/10), 0, 5)
- Data Quality = clamp(5 − (latency_ms/200), 0, 5) + (historical_full? 1 : historical_partial? 0.5 : 0); cap at 5
- Market Access = (paper? 1 : 0) + (websocket? 1 : 0) + (REST? 1 : 0) + (kyc_standard? 0.5 : kyc_enhanced? 0 : 0.25); scale to 0–5
- Engineering Effort: map {1→0,2→0.5,3→1,5→2,8→3,13→5}

Weights are starting points; adjust with experience.

## Labels

Recommended labels for triage and filtering:
- `exchange`, `feature`, `triage`, `paper-trading`, `live-trading`, `api:rest`, `api:ws`, `reg:low|med|high`, `asset:equities|crypto|event|fx|futures|options`

## Workflow

1. Create an Exchange Integration issue using the Issue Form.
2. Add labels for asset class, API types, and regulatory level.
3. Calculate Priority Score (manually or via the script below).
4. Sort backlog by Priority Score; pull highest into the next milestone.

## Optional: Local Ranking Script

If you use the GitHub CLI (`gh`), you can fetch issues and compute scores locally (set `GH_TOKEN` with repo scope).

Example command to list issues:
`gh issue list --label exchange --limit 100 --json number,title,labels,body > /tmp/exchanges.json`

Then run `node scripts/rank-exchanges.js /tmp/exchanges.json` to output a sorted table.

Note: The script parses the Issue Form fields from the body; keep the default field labels.

