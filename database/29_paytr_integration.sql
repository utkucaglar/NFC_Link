-- ============================================
-- PayTR Payment Integration Schema Update
-- File: 29_paytr_integration.sql
-- ============================================
-- Bu dosya PayTR ödeme entegrasyonu için gerekli kolonları ekler
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. PAYMENTS TABLE - PayTR Kolonları Ekle
-- ============================================

-- PayTR bilgileri için kolonlar ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paytr_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS paytr_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paytr_order_id TEXT,
ADD COLUMN IF NOT EXISTS paytr_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paytr_hash TEXT;

-- Payment method'a 'paytr' ekle
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('card', 'bank_transfer', 'paytr', 'other'));

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_payments_paytr_token ON payments(paytr_token);
CREATE INDEX IF NOT EXISTS idx_payments_paytr_order_id ON payments(paytr_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_paytr_transaction_id ON payments(paytr_transaction_id);

-- ============================================
-- 2. ORDERS TABLE - PayTR Kolonları Ekle (eğer yoksa)
-- ============================================

-- Orders tablosuna payment_id referansı ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
  END IF;
END $$;

-- ============================================
-- 3. PAYTR CONFIGURATION TABLE (Opsiyonel - API bilgilerini saklamak için)
-- ============================================

CREATE TABLE IF NOT EXISTS paytr_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id TEXT NOT NULL,
  merchant_key TEXT NOT NULL, -- Encrypted olarak saklanmalı
  merchant_salt TEXT NOT NULL, -- Encrypted olarak saklanmalı
  is_test_mode BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy (sadece admin'ler görebilir)
ALTER TABLE paytr_config ENABLE ROW LEVEL SECURITY;

-- is_admin() fonksiyonunun var olduğundan emin ol (09_admin_policies.sql'de tanımlı)
-- Eğer yoksa oluştur
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Only admins can view paytr config" ON paytr_config;
CREATE POLICY "Only admins can view paytr config" 
  ON paytr_config FOR SELECT 
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Only admins can insert paytr config" ON paytr_config;
CREATE POLICY "Only admins can insert paytr config" 
  ON paytr_config FOR INSERT 
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Only admins can update paytr config" ON paytr_config;
CREATE POLICY "Only admins can update paytr config" 
  ON paytr_config FOR UPDATE 
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ PayTR integration schema updated successfully!';
  RAISE NOTICE '📝 Updated tables:';
  RAISE NOTICE '  - payments (added PayTR columns)';
  RAISE NOTICE '  - orders (added payment_id if not exists)';
  RAISE NOTICE '  - paytr_config (created for API credentials)';
END $$;
