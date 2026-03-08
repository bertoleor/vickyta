-- 1. Habilitar UUIDs
create extension if not exists "uuid-ossp";

-- 2. ENUMS (Para restringir valores y evitar errores)
create type payment_method as enum ('transferencia', 'qr', 'debito', 'debito_automatico', 'credito', 'descubierto', 'efectivo', 'fiado_adrian');
create type transaction_type as enum ('gasto', 'ingreso', 'transferencia_interna');
create type traffic_light as enum ('inevitable', 'optimizable', 'evitable');

-- 3. TABLA DE CUENTAS (Bancos, Efectivo y Deudas)
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  type text check (type in ('banco', 'billetera_virtual', 'efectivo', 'tarjeta_credito', 'deuda_fiado')) not null,
  balance decimal(12,2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA DE CATEGORÍAS (Padres e Hijos)
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon_slug text, -- Para mapear con lucide-react
  parent_id uuid references categories(id), -- Si es null, es categoría Macro
  is_system boolean default true -- Para proteger las categorías base
);

-- 5. TABLA DE TRANSACCIONES (El corazón del sistema)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts(id) not null, -- De dónde sale la plata
  destination_account_id uuid references accounts(id), -- Solo para transferencias (ej: Banco a Efectivo)
  category_id uuid references categories(id),
  amount decimal(12,2) not null,
  date date not null default current_date,
  description text,
  type transaction_type not null,
  method payment_method not null,
  
  -- Campos para Cuotas
  is_installment boolean default false,
  current_installment int,
  total_installments int,
  
  -- Semáforo de Gastos (Economía de Guerra)
  tag traffic_light,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. POLÍTICAS DE SEGURIDAD (RLS)
-- Esto asegura que cada usuario solo vea sus propios datos
alter table accounts enable row level security;
alter table transactions enable row level security;
-- (Categories es pública para lectura, pero solo admin edita)
alter table categories enable row level security;

create policy "Usuarios ven sus cuentas" on accounts for all using (auth.uid() = user_id);
create policy "Usuarios ven sus movimientos" on transactions for all using (auth.uid() = user_id);
create policy "Todos ven categorias" on categories for select using (true);

-- 7. INSERTAR LAS CATEGORÍAS AUTOMÁTICAMENTE
DO $$
DECLARE
  -- Variables para guardar los IDs de las categorías padre
  super_id uuid;
  trabajo_id uuid;
  casa_id uuid;
  extras_id uuid;
  deudas_id uuid;
BEGIN
  -- 🛒 Súper & Alimentos
  INSERT INTO categories (name, icon_slug, parent_id) VALUES ('Súper & Alimentos', 'shopping-cart', NULL) RETURNING id INTO super_id;
  INSERT INTO categories (name, parent_id) VALUES 
    ('Supermercado (Grande)', super_id),
    ('Almacén (Barrio)', super_id),
    ('Carnicería', super_id),
    ('Verdulería', super_id),
    ('Perfumería & Limpieza', super_id);

  -- 💼 Trabajo & Transporte
  INSERT INTO categories (name, icon_slug, parent_id) VALUES ('Trabajo & Transporte', 'briefcase', NULL) RETURNING id INTO trabajo_id;
  INSERT INTO categories (name, parent_id) VALUES 
    ('Viáticos / SUBE', trabajo_id),
    ('Material Didáctico', trabajo_id),
    ('Comida Laboral (Salud/Necesidad)', trabajo_id);

  -- 🏠 Casa & Servicios
  INSERT INTO categories (name, icon_slug, parent_id) VALUES ('Casa & Servicios', 'home', NULL) RETURNING id INTO casa_id;
  INSERT INTO categories (name, parent_id) VALUES 
    ('Impuestos y Servicios', casa_id),
    ('Telefonía / Internet', casa_id),
    ('Farmacia y Salud', casa_id),
    ('Mascotas', casa_id),
    ('Streaming (Netflix/Disney/etc)', casa_id);

  -- 🐜 Extras & Hormiga
  INSERT INTO categories (name, icon_slug, parent_id) VALUES ('Extras & Hormiga', 'coffee', NULL) RETURNING id INTO extras_id;
  INSERT INTO categories (name, parent_id) VALUES 
    ('Kiosco / Golosinas', extras_id),
    ('Comida / Salidas (Placer)', extras_id),
    ('Vestimenta y Calzado', extras_id),
    ('Eventos Sociales', extras_id),
    ('Hogar / Deco / Blanquería', extras_id),
    ('Belleza (Peluquería/Uñas/Pies)', extras_id); -- AGREGADO NUEVO

  -- 💳 Deudas & Bancos
  INSERT INTO categories (name, icon_slug, parent_id) VALUES ('Deudas & Bancos', 'credit-card', NULL) RETURNING id INTO deudas_id;
  INSERT INTO categories (name, parent_id) VALUES 
    ('Pago a Adrián (Saldo Mensual)', deudas_id),
    ('Pago Tarjeta Crédito', deudas_id),
    ('Intereses / Mantenimiento', deudas_id);
END $$;

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

CREATE POLICY "upload_avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "read_avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT;
