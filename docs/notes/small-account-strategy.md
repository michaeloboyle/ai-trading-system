# $1000 Small Account Trading Strategy

## Capital Allocation & Risk Management

### Account Structure
- **Total Capital**: $1000
- **Trading Capital**: $800 (80%)
- **Reserve Fund**: $200 (20% - emergency buffer)
- **Maximum Daily Risk**: $20 (2% of total account)
- **Maximum Per-Trade Risk**: $10 (1% of total account)

## Strategy Priority Ranking (by Risk-Adjusted Returns)

### Tier 1: Stablecoin Triangular Arbitrage (Days 1-7)
**Why First**: Lowest risk, consistent profits, capital preservation
- **Capital Per Trade**: $50-200
- **Expected Daily**: $20-40 profit (2-4% return)
- **Risk Level**: Ultra-low (0.05-0.1% per trade)
- **Trade Duration**: 1-5 minutes
- **Success Rate**: 85-95%

**Implementation**:
```
Position Sizing Formula:
- Max position = min($200, available_capital * 0.20)
- Stop loss = 0.1% (for slippage protection)
- Target spread = 0.15-0.30% minimum
```

### Tier 2: Small-Cap Momentum (Week 2+)
**Why Second**: Higher returns but needs Tier 1 profits as buffer
- **Capital Per Trade**: $100-300  
- **Expected Daily**: $30-60 profit (3-6% return)
- **Risk Level**: Medium (0.5-1% per trade)
- **Trade Duration**: 5-30 minutes
- **Success Rate**: 60-75%

**Implementation**:
```
Entry Criteria:
- Market cap: $10M-100M
- Volume spike: >300% of 24h average
- RSI < 30 (oversold) or RSI > 70 (overbought breakout)
- Clear support/resistance levels
```

### Tier 3: Futures Scalping (Week 3+)
**Why Last**: Highest returns but requires significant capital buffer
- **Capital Per Trade**: $200-400 (leveraged to $600-2000)
- **Expected Daily**: $50-100 profit (5-10% return)
- **Risk Level**: High (1-2% per trade with leverage)
- **Trade Duration**: 30 seconds - 2 minutes
- **Success Rate**: 55-70%

**Implementation**:
```
Leverage Rules:
- Start with 3x leverage maximum
- Increase to 5x only after 2 weeks of consistent profits
- Never risk more than $10 actual capital per trade
- Use Binance Futures with isolated margin
```

## Daily Trading Plan

### Morning Routine (9 AM UTC)
1. Check overnight market movements
2. Identify stablecoin spread opportunities
3. Set up arbitrage scanners
4. Review small-cap altcoin watchlist

### Active Trading Hours (10 AM - 8 PM UTC)
- **10-12 PM**: Focus on stablecoin arbitrage (high volume period)
- **12-4 PM**: Small-cap momentum trades (US market overlap)
- **4-6 PM**: BTC/ETH futures scalping (high volatility)
- **6-8 PM**: Review and close positions

### Evening Routine (8 PM UTC)
1. Close all positions (no overnight holds for small accounts)
2. Calculate daily P&L
3. Update strategy performance metrics
4. Plan next day's trades

## Risk Management Rules (Non-Negotiable)

### Position Sizing
- **Never risk more than 1% on single trade** ($10 max loss)
- **Never have more than 50% capital in trades simultaneously**
- **Always keep $200 emergency reserve untouched**

### Stop Loss Rules
- **Stablecoin arbitrage**: 0.1% stop (slippage protection only)
- **Altcoin momentum**: 1.0% stop (strict risk control)
- **Futures scalping**: 0.5% stop on leveraged amount (= 1.5-2.5% on capital)

### Profit Taking
- **Take 50% profit** at first target
- **Move stop to breakeven** after taking partial profit
- **Never let winning trade become losing trade**

## Growth Trajectory

### Month 1: Capital Preservation & Learning
- **Goal**: Don't lose money, learn systems
- **Target**: 10-20% monthly return ($100-200 profit)
- **Focus**: Master stablecoin arbitrage + basic momentum

### Month 2: Consistent Profitability  
- **Goal**: Prove strategy repeatability
- **Target**: 20-35% monthly return ($240-420 profit on $1200 capital)
- **Focus**: Add small-cap momentum + refine systems

### Month 3: Scaling Up
- **Goal**: Maximize returns with proven strategies
- **Target**: 30-50% monthly return ($390-750 profit on $1500+ capital)
- **Focus**: Add futures scalping + consider capital injection

## Capital Scaling Milestones

### $1000 → $1500 (Month 1)
- Unlock small-cap momentum trading (larger position sizes)
- Better spread capture with bigger positions

### $1500 → $2500 (Month 2)
- Begin futures scalping with meaningful size
- Diversify across more currency pairs

### $2500 → $5000 (Month 3)
- Consider increasing daily risk to 3% ($75-150/day)
- Add more sophisticated strategies (options, DeFi arbitrage)

## Technology Requirements for $1000 Account

### Essential Tools (Free/Low Cost)
- **Binance API** (free tier sufficient for <100 trades/day)
- **TradingView** (basic plan $15/month - essential for charting)
- **Python/Node.js** (free - for automation)
- **Basic VPS** ($5-10/month for 24/7 operation)

### Rust-WASM Priority for Small Accounts
1. **Stablecoin spread scanner** (most critical - captures fleeting opportunities)
2. **Position sizing calculator** (prevents over-risking)
3. **Profit/loss tracker** (essential for small account management)
4. **Risk monitor** (automatic position closure if limits exceeded)

## Success Metrics & KPIs

### Daily Metrics
- **Daily P&L**: Target $20-100 depending on strategy tier
- **Win Rate**: Maintain >70% across all strategies
- **Risk Compliance**: Never exceed daily loss limit of $20
- **Trade Frequency**: 5-25 trades depending on opportunities

### Weekly Metrics  
- **Weekly Return**: Target 5-15% of account value
- **Maximum Drawdown**: Keep under 5% of account
- **Strategy Performance**: Track each tier separately
- **Account Growth Rate**: Compound weekly gains

### Monthly Review
- **Monthly Return**: Target 20-50% depending on experience level
- **Sharpe Ratio**: Aim for >1.5 (risk-adjusted returns)
- **Account Health**: Maintain emergency reserve
- **Strategy Evolution**: Phase in new strategies as capital grows

## Failure Modes & Contingencies

### If Daily Loss Limit Hit ($20)
- **Stop all trading immediately**
- **Review what went wrong**
- **Don't trade next day (emotional reset)**
- **Reduce position sizes for 3 days after returning**

### If Weekly Loss Exceeds 5% ($50+)
- **Stop all trading for 48 hours**
- **Full strategy review and adjustment**
- **Consider reducing risk per trade to 0.5%**
- **Focus only on Tier 1 (stablecoin arbitrage) until recovered**

### If Monthly Loss Exceeds 10% ($100+)
- **Stop trading for 1 week**
- **Paper trade to rebuild confidence**
- **Consider adding more capital or reducing strategies**
- **Get external strategy review**

**The key with $1000: Protect capital first, profits second. Small accounts die from big losses, not small gains.**