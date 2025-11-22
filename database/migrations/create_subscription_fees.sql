-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('CUSTOMER', 'RETAILER')),
  billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY')),
  amount DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'WALLET',
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id UUID REFERENCES transactions(id),
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_user_type ON subscription_plans(user_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_billing ON user_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Subscription plans for customers and retailers';
COMMENT ON TABLE user_subscriptions IS 'Active subscriptions for users';
COMMENT ON TABLE subscription_payments IS 'Payment history for subscriptions';

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, user_type, billing_period, amount, is_active) VALUES
('Customer Monthly', 'Monthly platform fee for customers', 'CUSTOMER', 'MONTHLY', 50.00, true),
('Customer Quarterly', 'Quarterly platform fee for customers', 'CUSTOMER', 'QUARTERLY', 140.00, true),
('Customer Half Yearly', 'Half yearly platform fee for customers', 'CUSTOMER', 'HALF_YEARLY', 270.00, true),
('Customer Yearly', 'Yearly platform fee for customers', 'CUSTOMER', 'YEARLY', 500.00, true),
('Retailer Monthly', 'Monthly platform fee for retailers', 'RETAILER', 'MONTHLY', 100.00, true),
('Retailer Quarterly', 'Quarterly platform fee for retailers', 'RETAILER', 'QUARTERLY', 280.00, true),
('Retailer Half Yearly', 'Half yearly platform fee for retailers', 'RETAILER', 'HALF_YEARLY', 540.00, true),
('Retailer Yearly', 'Yearly platform fee for retailers', 'RETAILER', 'YEARLY', 1000.00, true)
ON CONFLICT DO NOTHING;
