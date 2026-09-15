-- VICKY initial schema (migrado de VICKY token1 2026-09-14, ids preservados)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE transaction_type AS ENUM ('gasto','ingreso','transferencia_interna');

CREATE TYPE payment_method AS ENUM ('transferencia','qr','debito','debito_automatico','credito','descubierto','efectivo','fiado_adrian');

CREATE TYPE traffic_light AS ENUM ('inevitable','optimizable','evitable');

CREATE TABLE categories (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      name text NOT NULL, icon_slug text, parent_id uuid REFERENCES categories(id), is_system boolean DEFAULT true);

CREATE TABLE accounts (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES auth.users(id), name text NOT NULL, type text NOT NULL
      CHECK (type IN ('banco','billetera_virtual','efectivo','tarjeta_credito','deuda_fiado')),
      balance numeric DEFAULT 0.00, created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
      closing_day integer, due_day integer, interest_rate numeric DEFAULT 0,
      last_interest_charge date, notes text);

CREATE TABLE transactions (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES auth.users(id),
      account_id uuid NOT NULL REFERENCES accounts(id),
      destination_account_id uuid REFERENCES accounts(id),
      category_id uuid REFERENCES categories(id), amount numeric NOT NULL,
      date date NOT NULL DEFAULT CURRENT_DATE, description text,
      type transaction_type NOT NULL, method payment_method NOT NULL,
      is_installment boolean DEFAULT false, current_installment integer,
      total_installments integer, tag traffic_light,
      created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
      is_recurring boolean DEFAULT false, recurring_frequency text);

CREATE TABLE budgets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id), category_id uuid REFERENCES categories(id),
      amount numeric NOT NULL, period text NOT NULL CHECK (period IN ('weekly','monthly','yearly')),
      created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE user_preferences (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
      theme text DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
      accent_color text DEFAULT 'azul', notify_daily_reminder boolean DEFAULT true,
      notify_budget_alert boolean DEFAULT true);

CREATE TABLE telegram_users (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      telegram_id bigint NOT NULL UNIQUE, user_id uuid REFERENCES auth.users(id),
      username text, first_name text, last_name text,
      created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()));

CREATE TABLE telegram_messages (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      telegram_id bigint NOT NULL, chat_id bigint NOT NULL, user_id bigint,
      username text, first_name text, message_text text, message_date bigint,
      raw_update jsonb, status text DEFAULT 'pending'
      CHECK (status IN ('pending','processed','error')),
      error_message text, processed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT timezone('utc', now()));

CREATE TABLE telegram_sessions (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id bigint NOT NULL, step text NOT NULL DEFAULT 'START', amount numeric,
      description text, category_id uuid, category_name text, method text, bank text,
      installments integer, verification_code text, verification_expires_at timestamptz,
      created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE pending_telegram_messages (id uuid, telegram_id bigint, chat_id bigint,
      user_id bigint, username text, first_name text, message_text text,
      message_date bigint, raw_update jsonb, created_at timestamptz);

CREATE INDEX idx_telegram_messages_chat_id ON telegram_messages (chat_id);

CREATE INDEX idx_telegram_messages_created_at ON telegram_messages (created_at);

CREATE INDEX idx_telegram_messages_status ON telegram_messages (status);

CREATE INDEX idx_telegram_sessions_chat_id ON telegram_sessions (chat_id);

CREATE INDEX idx_telegram_sessions_updated ON telegram_sessions (updated_at DESC);

CREATE INDEX idx_telegram_sessions_verification ON telegram_sessions (verification_code) WHERE verification_code IS NOT NULL;

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus cuentas" ON accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Todos ven categorias" ON categories FOR SELECT USING (true);

CREATE POLICY "Service role can manage telegram messages" ON telegram_messages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage sessions" ON telegram_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can see their own telegram link" ON telegram_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios ven sus movimientos" ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('40897a70-0144-4b4d-871c-d9ed3a0cb160','Casa & Servicios','home',NULL,true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('00450b9e-6e7a-4cd9-b3b4-faf0745fbf17','Deudas & Bancos','credit-card',NULL,true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('203adbd5-6824-4190-91fe-9b8499cf9afb','Extras & Hormiga','coffee',NULL,true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('2619925b-062f-40a5-8d80-f10d39ce5280','Súper & Alimentos','shopping-cart',NULL,true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('19f7ebf1-0e61-4de9-823f-9dbb928b2841','Trabajo & Transporte','briefcase',NULL,true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('d41d1e69-d1d4-4356-b51e-481c804251f9','Adrián',NULL,'00450b9e-6e7a-4cd9-b3b4-faf0745fbf17',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('870fdef4-18d6-4f9c-a091-b4c17105f87f','Almacén',NULL,'2619925b-062f-40a5-8d80-f10d39ce5280',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('280fffe3-340b-45b3-9f4b-ff3c970f721a','Carnicería',NULL,'2619925b-062f-40a5-8d80-f10d39ce5280',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('d30f9ada-0fac-4161-86a9-52e7eb237583','Comida Laboral',NULL,'19f7ebf1-0e61-4de9-823f-9dbb928b2841',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('7864beae-cff5-48db-b05e-bac139e67481','Comida / Salidas',NULL,'203adbd5-6824-4190-91fe-9b8499cf9afb',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('76aa0792-5a99-47ea-9ab4-16741a25052c','Estetica',NULL,'203adbd5-6824-4190-91fe-9b8499cf9afb',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('a9064d2e-2b52-4d4e-b967-cda2d67022d4','Eventos Sociales',NULL,'203adbd5-6824-4190-91fe-9b8499cf9afb',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('d24a39ae-43d9-4cfd-84b1-32692797268a','Farmacia y Salud',NULL,'40897a70-0144-4b4d-871c-d9ed3a0cb160',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('e1bf371d-01ef-42c8-8e19-bed752e9ec19','Hogar / Deco / Blanquería',NULL,'203adbd5-6824-4190-91fe-9b8499cf9afb',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('050f4019-04e5-428c-872b-5f84590f667c','Impuestos y Servicios',NULL,'40897a70-0144-4b4d-871c-d9ed3a0cb160',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('0a835d66-ca8b-497e-83a9-e9ce10935643','Intereses / Mantenimiento',NULL,'00450b9e-6e7a-4cd9-b3b4-faf0745fbf17',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('7f3b9176-92c5-4b72-989a-1e00b3c4e677','Kiosco / Golosinas',NULL,'203adbd5-6824-4190-91fe-9b8499cf9afb',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('0388fbef-79e3-4ba7-a9ca-2687be98df14','Mascotas',NULL,'40897a70-0144-4b4d-871c-d9ed3a0cb160',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('9b40f1ff-4166-4561-8965-299a743ac685','Material Didáctico',NULL,'19f7ebf1-0e61-4de9-823f-9dbb928b2841',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('f3c88a74-9bc4-4b5a-aa79-36c59407b27f','Pago Tarjeta Crédito',NULL,'00450b9e-6e7a-4cd9-b3b4-faf0745fbf17',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('29bb4dc4-6503-4d38-99a2-12a34d7ff189','Perfumería & Limpieza',NULL,'2619925b-062f-40a5-8d80-f10d39ce5280',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('8acdb7f0-418c-4476-8970-6e618841705a','Streaming (Netflix/Disney/etc)',NULL,'40897a70-0144-4b4d-871c-d9ed3a0cb160',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('e4c5a6a5-64a8-4c59-9082-459398330f3b','Supermercado',NULL,'2619925b-062f-40a5-8d80-f10d39ce5280',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('ac441fb7-1289-4b37-ac38-6d870a52d12b','Telefonía / Internet',NULL,'40897a70-0144-4b4d-871c-d9ed3a0cb160',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('f568035b-97f3-4b72-989a-1e00b3c4e677','Verdulería',NULL,'2619925b-062f-40a5-8d80-f10d39ce5280',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('27ebcc55-98b0-40c2-ab5f-702aa6b355d1','Vestimenta y Calzado',NULL,'203adbd5-6824-4190-91fe-9b8499cf9afb',true);
INSERT INTO categories (id,name,icon_slug,parent_id,is_system) VALUES ('3ca0f928-0d6d-494e-b478-729a83b4c86c','Viáticos / SUBE',NULL,'19f7ebf1-0e61-4de9-823f-9dbb928b2841',true);
