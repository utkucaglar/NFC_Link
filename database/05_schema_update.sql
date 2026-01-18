-- ============================================
-- NFCLink Schema Update
-- File: 05_schema_update.sql
-- ============================================
-- Shipping addresses tablosunu ve ek alanları ekler
-- ============================================

-- ============================================
-- 1. SHIPPING ADDRESSES TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL DEFAULT 'Ev',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Türkiye',
  
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON shipping_addresses(user_id, is_default);

-- ============================================
-- 2. ORDERS TABLOSU EK ALANLAR
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES shipping_addresses(id),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- ============================================
-- 3. RLS - SHIPPING ADDRESSES
-- ============================================
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own addresses" ON shipping_addresses;
CREATE POLICY "Users can view own addresses" 
  ON shipping_addresses FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON shipping_addresses;
CREATE POLICY "Users can insert own addresses" 
  ON shipping_addresses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON shipping_addresses;
CREATE POLICY "Users can update own addresses" 
  ON shipping_addresses FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON shipping_addresses;
CREATE POLICY "Users can delete own addresses" 
  ON shipping_addresses FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SONUÇ
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema update completed!';
  RAISE NOTICE '📝 Next: Run 06_subscriptions_payments.sql (optional)';
END $$;
