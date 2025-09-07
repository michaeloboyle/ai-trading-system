-- AI Trading System Database Schema
-- Based on Flow Nexus mastery patterns

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Market data table
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(12,4) NOT NULL,
    high DECIMAL(12,4) NOT NULL,
    low DECIMAL(12,4) NOT NULL,
    close DECIMAL(12,4) NOT NULL,
    volume BIGINT NOT NULL,
    adjusted_close DECIMAL(12,4),
    data_source VARCHAR(50) NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, timestamp, data_source)
);

-- Create index for efficient queries
CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);

-- Trading signals table
CREATE TABLE trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    strategy VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    price DECIMAL(12,4) NOT NULL,
    volume BIGINT,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    is_processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX idx_trading_signals_processed ON trading_signals(is_processed, created_at);

-- Portfolio positions table
CREATE TABLE portfolio_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(12,6) NOT NULL,
    avg_cost DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4),
    market_value DECIMAL(12,2),
    unrealized_pnl DECIMAL(12,2),
    position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('LONG', 'SHORT')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(symbol, position_type, is_active)
);

CREATE INDEX idx_portfolio_positions_active ON portfolio_positions(is_active, symbol);

-- Trades execution table
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    signal_id UUID REFERENCES trading_signals(id),
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL')),
    quantity DECIMAL(12,6) NOT NULL,
    price DECIMAL(12,4) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    fees DECIMAL(12,2) DEFAULT 0,
    execution_type VARCHAR(20) NOT NULL DEFAULT 'MARKET',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paper_trade BOOLEAN DEFAULT TRUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    broker_order_id VARCHAR(100),
    metadata JSONB
);

CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX idx_trades_signal_id ON trades(signal_id);

-- Portfolio performance tracking
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_value DECIMAL(12,2) NOT NULL,
    cash_balance DECIMAL(12,2) NOT NULL,
    invested_value DECIMAL(12,2) NOT NULL,
    unrealized_pnl DECIMAL(12,2) NOT NULL,
    realized_pnl DECIMAL(12,2) NOT NULL,
    daily_return DECIMAL(8,6),
    total_return DECIMAL(8,6),
    sharpe_ratio DECIMAL(8,6),
    max_drawdown DECIMAL(8,6),
    positions_count INTEGER NOT NULL DEFAULT 0,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(snapshot_date)
);

CREATE INDEX idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);

-- Strategy performance table
CREATE TABLE strategy_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20),
    total_signals INTEGER NOT NULL DEFAULT 0,
    buy_signals INTEGER NOT NULL DEFAULT 0,
    sell_signals INTEGER NOT NULL DEFAULT 0,
    avg_confidence DECIMAL(5,4),
    win_rate DECIMAL(5,4),
    profit_factor DECIMAL(8,4),
    total_return DECIMAL(8,6),
    sharpe_ratio DECIMAL(8,6),
    max_drawdown DECIMAL(8,6),
    last_signal_at TIMESTAMP WITH TIME ZONE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(strategy_name, symbol, period_start, period_end)
);

CREATE INDEX idx_strategy_performance_name ON strategy_performance(strategy_name);
CREATE INDEX idx_strategy_performance_period ON strategy_performance(period_end DESC);

-- Risk events table
CREATE TABLE risk_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    symbol VARCHAR(20),
    description TEXT NOT NULL,
    current_value DECIMAL(12,4),
    threshold_value DECIMAL(12,4),
    action_taken VARCHAR(100),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_risk_events_severity ON risk_events(severity, created_at DESC);
CREATE INDEX idx_risk_events_resolved ON risk_events(resolved, created_at DESC);

-- Application settings table
CREATE TABLE app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value, data_type, description) VALUES
('paper_trading', 'true', 'boolean', 'Enable paper trading mode'),
('starting_balance', '10000', 'decimal', 'Initial portfolio balance'),
('max_portfolio_risk', '0.05', 'decimal', 'Maximum portfolio risk percentage'),
('max_position_size', '0.10', 'decimal', 'Maximum position size as percentage of portfolio'),
('risk_limit', '0.02', 'decimal', 'Stop loss percentage'),
('rebalance_frequency', '24', 'integer', 'Portfolio rebalancing frequency in hours'),
('active_strategies', '["enhanced_rsi"]', 'json', 'List of active trading strategies'),
('market_hours', '{"start": 9.5, "end": 16, "timezone": "America/New_York"}', 'json', 'Market trading hours');

-- Create views for common queries
CREATE VIEW active_positions AS
SELECT 
    symbol,
    quantity,
    avg_cost,
    current_price,
    market_value,
    unrealized_pnl,
    (unrealized_pnl / (avg_cost * quantity) * 100) as pnl_percentage,
    position_type,
    opened_at
FROM portfolio_positions 
WHERE is_active = TRUE;

CREATE VIEW recent_trades AS
SELECT 
    t.symbol,
    t.action,
    t.quantity,
    t.price,
    t.total_value,
    t.executed_at,
    s.strategy,
    s.confidence
FROM trades t
LEFT JOIN trading_signals s ON t.signal_id = s.id
ORDER BY t.executed_at DESC;

CREATE VIEW daily_performance AS
SELECT 
    snapshot_date,
    total_value,
    daily_return,
    total_return,
    sharpe_ratio,
    max_drawdown,
    positions_count
FROM portfolio_snapshots
ORDER BY snapshot_date DESC;

-- Function to update position market values
CREATE OR REPLACE FUNCTION update_position_values()
RETURNS TRIGGER AS $$
BEGIN
    NEW.market_value = NEW.quantity * NEW.current_price;
    NEW.unrealized_pnl = NEW.market_value - (NEW.quantity * NEW.avg_cost);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update position values
CREATE TRIGGER update_position_values_trigger
    BEFORE UPDATE ON portfolio_positions
    FOR EACH ROW
    WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price)
    EXECUTE FUNCTION update_position_values();

-- Function to log risk events
CREATE OR REPLACE FUNCTION log_risk_event(
    p_event_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_symbol VARCHAR(20),
    p_description TEXT,
    p_current_value DECIMAL(12,4) DEFAULT NULL,
    p_threshold_value DECIMAL(12,4) DEFAULT NULL,
    p_action_taken VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO risk_events (
        event_type, severity, symbol, description, 
        current_value, threshold_value, action_taken
    ) VALUES (
        p_event_type, p_severity, p_symbol, p_description,
        p_current_value, p_threshold_value, p_action_taken
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for portfolio rebalancing
CREATE OR REPLACE FUNCTION rebalance_portfolio()
RETURNS TABLE (
    symbol VARCHAR(20),
    current_weight DECIMAL(8,6),
    target_weight DECIMAL(8,6),
    adjustment_needed DECIMAL(8,6)
) AS $$
BEGIN
    -- This is a simplified rebalancing logic
    -- In production, this would be more sophisticated
    RETURN QUERY
    SELECT 
        p.symbol,
        (p.market_value / SUM(p.market_value) OVER()) as current_weight,
        0.20::DECIMAL(8,6) as target_weight, -- Equal weight example
        (0.20 - (p.market_value / SUM(p.market_value) OVER())) as adjustment_needed
    FROM portfolio_positions p
    WHERE p.is_active = TRUE
    AND p.market_value > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE trading IS 'AI Trading System Database - Professional algorithmic trading platform';
COMMENT ON TABLE market_data IS 'Real-time and historical market data from various sources';
COMMENT ON TABLE trading_signals IS 'AI-generated trading signals from various strategies';
COMMENT ON TABLE portfolio_positions IS 'Current portfolio positions and their performance';
COMMENT ON TABLE trades IS 'Executed trades with full audit trail';
COMMENT ON TABLE portfolio_snapshots IS 'Daily portfolio performance snapshots';
COMMENT ON TABLE strategy_performance IS 'Performance metrics for each trading strategy';
COMMENT ON TABLE risk_events IS 'Risk management events and alerts';
COMMENT ON TABLE app_settings IS 'Application configuration and settings';