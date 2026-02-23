-- ============================================
-- TELEGRAM MESSAGES TABLE
-- ============================================
-- Run this SQL in Supabase to create the telegram_messages table
-- This table stores incoming Telegram messages for processing

-- Create telegram_messages table
CREATE TABLE IF NOT EXISTS telegram_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  message_text TEXT,
  message_date BIGINT,
  raw_update JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_telegram_messages_status ON telegram_messages(status);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created_at ON telegram_messages(created_at);

-- Enable RLS
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (for server-side processing)
CREATE POLICY "Service role can manage telegram messages" ON telegram_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Create a view for pending messages
CREATE OR REPLACE VIEW pending_telegram_messages AS
SELECT 
  id,
  telegram_id,
  chat_id,
  user_id,
  username,
  first_name,
  message_text,
  message_date,
  raw_update,
  created_at
FROM telegram_messages
WHERE status = 'pending'
ORDER BY created_at ASC;

-- ============================================
-- PROFILES TABLE EXTENSION (Optional)
-- ============================================
-- If you want to link Telegram users to app users

-- Add telegram_id column to a profiles table if it exists
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;

-- Or create a separate telegram_users table
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own telegram link
CREATE POLICY "Users can see their own telegram link" ON telegram_users
  FOR SELECT
  USING (auth.uid() = user_id);
