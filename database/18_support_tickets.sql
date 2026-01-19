-- =================================================
-- Esdodesign Support Tickets (Destek Talepleri)
-- =================================================

-- Support Tickets tablosu
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'order', 'technical', 'billing', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Support Messages tablosu (ticket içindeki mesajlar)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  attachments TEXT[], -- URL array for attachments
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- RLS Enable
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- =================================================
-- RLS Policies - Support Tickets
-- =================================================

-- Önce mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view messages in their tickets" ON support_messages;
DROP POLICY IF EXISTS "Users can add messages to their tickets" ON support_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can add messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON support_messages;

-- Kullanıcılar kendi ticketlarını görebilir
CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcılar ticket oluşturabilir
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Adminler tüm ticketları görebilir
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adminler ticketları güncelleyebilir
CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =================================================
-- RLS Policies - Support Messages
-- =================================================

-- Kullanıcılar kendi ticketlarındaki mesajları görebilir
CREATE POLICY "Users can view messages in their tickets"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
  );

-- Kullanıcılar kendi ticketlarına mesaj ekleyebilir
CREATE POLICY "Users can add messages to their tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
    AND sender_type = 'customer'
  );

-- Adminler tüm mesajları görebilir
CREATE POLICY "Admins can view all messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adminler mesaj ekleyebilir
CREATE POLICY "Admins can add messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adminler mesajları güncelleyebilir (okundu işaretleme için)
CREATE POLICY "Admins can update messages"
  ON support_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =================================================
-- Helper Functions
-- =================================================

-- Ticket numarası için sequence oluştur
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Eğer mevcut ticketlar varsa, sequence'i mevcut ticket sayısına göre ayarla
DO $$
DECLARE
  ticket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ticket_count FROM support_tickets;
  IF ticket_count > 0 THEN
    -- Mevcut ticket sayısından sonraki sayıdan başlat
    PERFORM setval('ticket_number_seq', ticket_count + 1, false);
  END IF;
END $$;

-- Ticket numarası oluştur (race condition'ı önlemek için sequence kullan)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Sequence kullanarak benzersiz sayı al (race condition güvenli)
  counter := NEXTVAL('ticket_number_seq');
  new_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Ticket oluşturulduğunda otomatik numara ata
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_number_trigger ON support_tickets;
CREATE TRIGGER ticket_number_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_updated_at ON support_tickets;
CREATE TRIGGER ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Mesaj eklendiğinde ticket'ı güncelle
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  
  -- Eğer admin yanıt verdiyse ve ticket açıksa, durumu "in_progress" yap
  IF NEW.sender_type = 'admin' THEN
    UPDATE support_tickets
    SET status = 'waiting_customer'
    WHERE id = NEW.ticket_id AND status = 'open';
  END IF;
  
  -- Eğer müşteri yanıt verdiyse ve bekliyorsa, durumu "in_progress" yap
  IF NEW.sender_type = 'customer' THEN
    UPDATE support_tickets
    SET status = 'in_progress'
    WHERE id = NEW.ticket_id AND status = 'waiting_customer';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_update_ticket ON support_messages;
CREATE TRIGGER message_update_ticket
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_message();

-- =================================================
-- Admin RPC Function (RLS bypass for admins)
-- =================================================

-- Admin için tüm ticketları getir
CREATE OR REPLACE FUNCTION get_all_support_tickets()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  ticket_number TEXT,
  subject TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT
) AS $$
BEGIN
  -- Admin kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    st.id,
    st.user_id,
    st.ticket_number,
    st.subject,
    st.category,
    st.status,
    st.priority,
    st.created_at,
    st.updated_at,
    st.closed_at,
    up.email as user_email,
    up.first_name as user_first_name,
    up.last_name as user_last_name
  FROM support_tickets st
  LEFT JOIN user_profiles up ON up.id = st.user_id
  ORDER BY st.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- Success Message
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ Support Tickets tabloları oluşturuldu!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Özellikler:';
  RAISE NOTICE '   - Kullanıcılar destek talebi oluşturabilir';
  RAISE NOTICE '   - Sohbet şeklinde mesajlaşma';
  RAISE NOTICE '   - Adminler tüm talepleri yönetebilir';
  RAISE NOTICE '   - Otomatik ticket numarası';
  RAISE NOTICE '   - Durum takibi (açık, işlemde, çözüldü, kapatıldı)';
  RAISE NOTICE '';
END $$;
