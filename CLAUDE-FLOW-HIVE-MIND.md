# Claude Flow Hive Mind: AI Trading System Completion

## Agent Coordination Protocol

### Primary Directive
Complete the AI trading system using TDD methodology with GitHub issues for coordination and worktrees for parallel development. Target: Profitable cryptocurrency trading ASAP with --seriously-skip-permissions for rapid iteration.

### Agent Specialization Matrix

#### 🏗️ **Infrastructure Agent** (claude-infra)
**Primary Role**: System architecture, Docker, CI/CD, monitoring
**Current Tasks**:
- Rust-WASM build pipeline optimization
- Grafana dashboard deployment  
- Performance monitoring setup
- Docker Compose service orchestration

**Handoff Triggers**:
- Infrastructure ready → Signal Trading Agent
- Performance bottlenecks → Signal Optimization Agent
- Monitoring alerts → Signal Risk Agent

#### 🧠 **AI Research Agent** (claude-ai)
**Primary Role**: 2025 research integration, LLM multi-agents, xLSTM
**Current Tasks**:
- LLM multi-agent system implementation
- xLSTM pattern recognition deployment
- Local Ollama + Groq API optimization
- Meta-thinking agent architecture

**Handoff Triggers**:
- AI models trained → Signal Trading Agent
- Performance metrics → Signal Optimization Agent
- Learning improvements → Signal Strategy Agent

#### 💹 **Trading Strategy Agent** (claude-strategy) 
**Primary Role**: Trading algorithms, strategy optimization, backtesting
**Current Tasks**:
- Rust-WASM arbitrage scanner completion
- Momentum trading algorithm implementation
- Multi-strategy coordination system
- Risk-adjusted position sizing

**Handoff Triggers**:
- Strategy signals → Signal Execution Agent
- Risk violations → Signal Risk Agent
- Performance data → Signal Learning Agent

#### ⚖️ **Risk Management Agent** (claude-risk)
**Primary Role**: Risk controls, compliance, emergency procedures
**Current Tasks**:
- Hard stop implementation ($10/trade, $20/day)
- Portfolio risk monitoring
- Emergency shutdown procedures
- Compliance and audit trails

**Handoff Triggers**:
- Risk limits approached → Signal Trading Agent
- Emergency conditions → Signal All Agents
- Audit requirements → Signal Documentation Agent

#### 🚀 **Execution Agent** (claude-exec)
**Primary Role**: Order execution, exchange integration, real-time trading
**Current Tasks**:
- Binance.US IPv4-only API optimization
- Real-time order book analysis
- WebSocket feed optimization
- Trade execution latency minimization

**Handoff Triggers**:
- Execution complete → Signal Strategy Agent
- API errors → Signal Infrastructure Agent
- Latency issues → Signal Optimization Agent

#### 📊 **Analytics Agent** (claude-analytics)
**Primary Role**: Performance monitoring, reporting, insights
**Current Tasks**:
- Real-time dashboard development
- Trade performance analysis
- Strategy comparison metrics
- Mobile alert system

**Handoff Triggers**:
- Performance reports → Signal Strategy Agent
- Anomaly detection → Signal Risk Agent
- User insights → Signal UI Agent

### GitHub Issues Coordination Protocol

#### Issue Labeling System
```
🏷️ Priority Labels:
- `P0-critical`: System down, trading stopped
- `P1-high`: Revenue impact, performance degradation  
- `P2-medium`: Feature development, optimization
- `P3-low`: Documentation, cleanup

🏷️ Agent Labels:
- `agent:infra` - Infrastructure Agent tasks
- `agent:ai` - AI Research Agent tasks
- `agent:strategy` - Trading Strategy Agent tasks
- `agent:risk` - Risk Management Agent tasks
- `agent:exec` - Execution Agent tasks
- `agent:analytics` - Analytics Agent tasks

🏷️ Development Labels:
- `tdd-red` - Test written, needs implementation
- `tdd-green` - Implementation complete, tests passing
- `tdd-refactor` - Ready for refactoring
- `needs-review` - Code review required
- `ready-deploy` - Ready for production deployment
```

#### Issue Templates

**Feature Development Template**:
```markdown
## Feature: [Feature Name]
**Agent**: @claude-[specialization]
**Priority**: P[0-3]
**Phase**: [1-4]

### TDD Requirements
- [ ] Write failing test
- [ ] Implement minimal solution  
- [ ] Refactor for quality
- [ ] Integration tests

### Acceptance Criteria
- [ ] [Specific measurable outcome]
- [ ] Performance: <50ms response time
- [ ] Risk: Passes all safety checks
- [ ] Monitoring: Metrics available

### Handoff Conditions
- **Success**: Signal @claude-[next-agent] with results
- **Blocked**: Signal @claude-infra for infrastructure support
- **Risk**: Signal @claude-risk for safety review

### Definition of Done
- [ ] Tests passing (unit + integration)
- [ ] Code reviewed and merged
- [ ] Deployed to development environment
- [ ] Metrics showing expected performance
```

### GitHub Worktree Strategy

#### Branch Organization
```bash
# Main development branches
main                    # Production-ready code
develop                 # Integration branch
feature/*              # Feature development
hotfix/*               # Critical fixes
agent/*                # Agent-specific development

# Agent-specific worktrees
./worktrees/infra       # Infrastructure development
./worktrees/ai          # AI research implementation  
./worktrees/strategy    # Trading strategy development
./worktrees/risk        # Risk management
./worktrees/execution   # Order execution
./worktrees/analytics   # Performance analytics
```

#### Worktree Setup Commands
```bash
# Create agent-specific worktrees
git worktree add ./worktrees/infra -b agent/infra
git worktree add ./worktrees/ai -b agent/ai
git worktree add ./worktrees/strategy -b agent/strategy
git worktree add ./worktrees/risk -b agent/risk
git worktree add ./worktrees/execution -b agent/execution
git worktree add ./worktrees/analytics -b agent/analytics

# Agent workflow
cd ./worktrees/strategy
git checkout -b feature/arbitrage-scanner
# TDD development cycle
npm run test:watch
# Commit when tests pass
git commit -m "feat: arbitrage scanner TDD implementation

- Red: Write failing test for stablecoin arbitrage detection
- Green: Implement WASM scanner with 10ms response time  
- Refactor: Optimize for memory usage and accuracy

Closes #123"
```

### TDD Implementation Protocol

#### Test-First Development Cycle
```typescript
// 1. RED: Write failing test first
describe('ArbitrageScanner', () => {
  it('should detect USDC/USDT/DAI arbitrage opportunities within 10ms', async () => {
    const scanner = new ArbitrageScanner();
    const start = Date.now();
    
    const opportunities = await scanner.scan({
      pairs: ['USDC/USDT', 'USDT/DAI', 'DAI/USDC'],
      minProfit: 0.001 // 0.1% minimum
    });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10);
    expect(opportunities).toHaveLength.greaterThan(0);
    expect(opportunities[0].profit).toBeGreaterThan(0.001);
  });
});

// 2. GREEN: Implement minimal solution
export class ArbitrageScanner {
  async scan(params: ScanParams): Promise<ArbitrageOpportunity[]> {
    // Rust-WASM call for performance
    return this.wasmScanner.findArbitrage(params);
  }
}

// 3. REFACTOR: Optimize and clean up
export class ArbitrageScanner {
  private wasmScanner: WasmArbitrageCore;
  private cache: LRUCache<string, ArbitrageOpportunity[]>;
  
  constructor() {
    this.wasmScanner = new WasmArbitrageCore();
    this.cache = new LRUCache({ max: 1000, ttl: 1000 }); // 1s cache
  }
  
  async scan(params: ScanParams): Promise<ArbitrageOpportunity[]> {
    const cacheKey = this.createCacheKey(params);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const opportunities = await this.wasmScanner.findArbitrage(params);
    this.cache.set(cacheKey, opportunities);
    
    return opportunities;
  }
}
```

### Agent Communication Protocol

#### Claude Flow Handoff Messages
```markdown
## Agent Handoff: [Source] → [Target]

**Context**: [Current task completion status]
**Deliverables**: [What's being handed off]
**Next Actions**: [Specific tasks for receiving agent]
**Blockers**: [Any impediments or dependencies]
**Success Metrics**: [How to measure completion]

### Code References
- **Main Implementation**: `services/[component]/src/[file].ts:123`
- **Tests**: `tests/[component]/[test].spec.ts:45`  
- **Documentation**: `docs/[component].md`

### Performance Data
- **Latency**: [Current response times]
- **Accuracy**: [Success rates/error rates]
- **Resource Usage**: [CPU/Memory consumption]

### Risk Assessment
- **Safety**: [Risk controls status]
- **Compliance**: [Audit trail status]
- **Monitoring**: [Alert configuration]

**Ready for handoff**: ✅/❌
**Assigned to**: @claude-[target-agent]
**Due**: [Specific timeline]
```

## Immediate Action Plan

### Phase 1 Completion (Next 7 Days)

#### GitHub Issues to Create:
1. **#001**: [P0] Complete Rust-WASM arbitrage scanner (@claude-strategy)
2. **#002**: [P1] IPv4-only Binance API wrapper (@claude-exec)  
3. **#003**: [P1] Basic risk management implementation (@claude-risk)
4. **#004**: [P2] Real-time dashboard deployment (@claude-analytics)
5. **#005**: [P2] Mobile alert system (@claude-analytics)

#### Worktree Deployment:
```bash
# Set up parallel development environment
./scripts/setup-hive-mind.sh

# Each agent works in parallel
claude-strategy: cd ./worktrees/strategy && npm run tdd:arbitrage
claude-exec: cd ./worktrees/execution && npm run tdd:binance-api
claude-risk: cd ./worktrees/risk && npm run tdd:position-sizing
claude-analytics: cd ./worktrees/analytics && npm run tdd:dashboard
```

#### Success Criteria:
- **24 hours**: All worktrees operational with TDD workflows
- **72 hours**: First profitable arbitrage trade executed
- **168 hours**: Complete Phase 1 with 70%+ win rate

### --seriously-skip-permissions Implementation

#### Rapid Development Mode
```bash
# Skip traditional permissions for speed
export CLAUDE_FLOW_MODE="seriously-skip-permissions"
export TDD_FAST_MODE="true"
export RISK_OVERRIDE="development"

# Automated testing and deployment
npm run hive-mind:deploy --fast --skip-checks
```

## Agent Activation Commands

Ready to activate the Claude Flow hive mind for AI trading system completion. Each agent will work in parallel using TDD methodology with GitHub issues for coordination.

**Status**: 🟢 **READY FOR HIVE MIND ACTIVATION**

**Command to proceed**:
```bash
claude-flow activate --agents=all --mode=seriously-skip-permissions --target=profitable-trading
```

This will coordinate multiple Claude instances to complete the trading system rapidly using proper software engineering practices while maintaining the "number go up" focus.