-- KWIKAPI Recharge & Bill Payment System
-- Migration for Prepaid, Postpaid, DTH, Electricity Bill Payment

-- Create ENUM types for recharge system
CREATE TYPE recharge_service_type AS ENUM ('PREPAID', 'POSTPAID', 'DTH', 'ELECTRICITY', 'GAS', 'WATER');
CREATE TYPE recharge_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- Operators table (Prepaid, Postpaid, DTH, Electricity providers)
CREATE TABLE recharge_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_code VARCHAR(50) UNIQUE NOT NULL,
    operator_name VARCHAR(255) NOT NULL,
    service_type recharge_service_type NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    min_amount DECIMAL(10,2) DEFAULT 10.00,
    max_amount DECIMAL(10,2) DEFAULT 10000.00,
    commission_rate DECIMAL(5,2) DEFAULT 2.00, -- Commission percentage for retailers
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circles table (for mobile operators)
CREATE TABLE recharge_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_code VARCHAR(10) UNIQUE NOT NULL,
    circle_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table (Prepaid and DTH plans)
CREATE TABLE recharge_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES recharge_operators(id),
    circle_id UUID REFERENCES recharge_circles(id),
    plan_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    validity VARCHAR(50),
    plan_type VARCHAR(50), -- TOP_UP, DATA_PLAN, COMBO_PLAN, etc.
    description TEXT,
    data_benefit VARCHAR(100),
    voice_benefit VARCHAR(100),
    sms_benefit VARCHAR(100),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_plan_operator_circle UNIQUE(plan_id, operator_id, circle_id)
);

-- Recharge transactions table
CREATE TABLE recharge_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    operator_id UUID NOT NULL REFERENCES recharge_operators(id),
    circle_id UUID REFERENCES recharge_circles(id),
    
    -- Transaction details
    service_type recharge_service_type NOT NULL,
    mobile_number VARCHAR(20),
    dth_number VARCHAR(20),
    consumer_number VARCHAR(50),
    account_holder_name VARCHAR(255),
    
    -- Amount details
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Transaction status
    status recharge_status DEFAULT 'PENDING',
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    kwikapi_transaction_id VARCHAR(100),
    operator_transaction_id VARCHAR(100),
    
    -- Plan details (if applicable)
    plan_id UUID REFERENCES recharge_plans(id),
    plan_details JSONB DEFAULT '{}',
    
    -- Response data
    response_data JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Callback
    callback_received BOOLEAN DEFAULT false,
    callback_data JSONB DEFAULT '{}',
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT positive_total CHECK (total_amount > 0)
);

-- KWIKAPI wallet balance tracking
CREATE TABLE kwikapi_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    blocked_amount DECIMAL(12,2) DEFAULT 0.00,
    available_balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api_response JSONB DEFAULT '{}',
    
    CONSTRAINT single_wallet_row CHECK (id = gen_random_uuid())
);

-- Bill fetch history (for electricity, gas, water bills)
CREATE TABLE bill_fetch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    operator_id UUID NOT NULL REFERENCES recharge_operators(id),
    consumer_number VARCHAR(50) NOT NULL,
    consumer_name VARCHAR(255),
    bill_amount DECIMAL(10,2),
    due_amount DECIMAL(10,2),
    bill_month VARCHAR(20),
    bill_year VARCHAR(10),
    due_date DATE,
    bill_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operator detection cache (for mobile number to operator mapping)
CREATE TABLE operator_detection_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    operator_id UUID REFERENCES recharge_operators(id),
    circle_id UUID REFERENCES recharge_circles(id),
    operator_type VARCHAR(20), -- PREPAID or POSTPAID
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Create indexes
CREATE INDEX idx_recharge_operators_service_type ON recharge_operators(service_type);
CREATE INDEX idx_recharge_operators_is_active ON recharge_operators(is_active);
CREATE INDEX idx_recharge_plans_operator_id ON recharge_plans(operator_id);
CREATE INDEX idx_recharge_plans_is_active ON recharge_plans(is_active);
CREATE INDEX idx_recharge_transactions_user_id ON recharge_transactions(user_id);
CREATE INDEX idx_recharge_transactions_status ON recharge_transactions(status);
CREATE INDEX idx_recharge_transactions_service_type ON recharge_transactions(service_type);
CREATE INDEX idx_recharge_transactions_created_at ON recharge_transactions(created_at DESC);
CREATE INDEX idx_recharge_transactions_transaction_ref ON recharge_transactions(transaction_ref);
CREATE INDEX idx_bill_fetch_history_user_id ON bill_fetch_history(user_id);
CREATE INDEX idx_operator_detection_cache_mobile ON operator_detection_cache(mobile_number);

-- Triggers
CREATE TRIGGER update_recharge_operators_updated_at 
    BEFORE UPDATE ON recharge_operators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recharge_plans_updated_at 
    BEFORE UPDATE ON recharge_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recharge_transactions_updated_at 
    BEFORE UPDATE ON recharge_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert popular operators
INSERT INTO recharge_operators (operator_code, operator_name, service_type, min_amount, max_amount, commission_rate) VALUES
-- Prepaid operators
('VI', 'Vodafone Idea', 'PREPAID', 10, 5000, 2.5),
('AIRTEL', 'Airtel', 'PREPAID', 10, 5000, 2.5),
('JIO', 'Jio', 'PREPAID', 10, 5000, 2.0),
('BSNL', 'BSNL', 'PREPAID', 10, 5000, 3.0),

-- Postpaid operators
('AIRTEL_POST', 'Airtel Postpaid', 'POSTPAID', 100, 10000, 1.5),
('VI_POST', 'VI Postpaid', 'POSTPAID', 100, 10000, 1.5),
('JIO_POST', 'Jio Postpaid', 'POSTPAID', 100, 10000, 1.0),

-- DTH operators
('TATASKY', 'Tata Sky', 'DTH', 100, 5000, 2.0),
('DISHD2H', 'Dish TV', 'DTH', 100, 5000, 2.0),
('SUNTV', 'Sun Direct', 'DTH', 100, 5000, 2.0),
('VIDEOCON', 'Videocon D2H', 'DTH', 100, 5000, 2.0),
('BIGTV', 'Big TV', 'DTH', 100, 5000, 2.0),

-- Electricity operators
('MSEDCL', 'Maharashtra State Electricity', 'ELECTRICITY', 100, 50000, 1.0),
('BESCOM', 'Bangalore Electricity', 'ELECTRICITY', 100, 50000, 1.0),
('TNEB', 'Tamil Nadu Electricity', 'ELECTRICITY', 100, 50000, 1.0),
('WESCO', 'Western Electricity', 'ELECTRICITY', 100, 50000, 1.0),
('KPTCL', 'Karnataka Power', 'ELECTRICITY', 100, 50000, 1.0),
('APCPDCL', 'Andhra Pradesh Electricity', 'ELECTRICITY', 100, 50000, 1.0);

-- Insert popular circles
INSERT INTO recharge_circles (circle_code, circle_name) VALUES
('AP', 'Andhra Pradesh'),
('AS', 'Assam'),
('BR', 'Bihar'),
('CH', 'Chennai'),
('DL', 'Delhi'),
('GJ', 'Gujarat'),
('HR', 'Haryana'),
('HP', 'Himachal Pradesh'),
('JK', 'Jammu & Kashmir'),
('KA', 'Karnataka'),
('KL', 'Kerala'),
('KO', 'Kolkata'),
('MP', 'Madhya Pradesh'),
('MH', 'Maharashtra'),
('MU', 'Mumbai'),
('NE', 'North East'),
('OR', 'Orissa'),
('PB', 'Punjab'),
('RJ', 'Rajasthan'),
('TN', 'Tamil Nadu'),
('TS', 'Telangana'),
('UP', 'Uttar Pradesh (East)'),
('UW', 'Uttar Pradesh (West)'),
('WB', 'West Bengal');

-- Initialize KWIKAPI wallet (single row)
INSERT INTO kwikapi_wallet (wallet_balance, blocked_amount, available_balance) 
VALUES (0.00, 0.00, 0.00);

COMMIT;
