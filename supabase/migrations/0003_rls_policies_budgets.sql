-- ============================================
-- 0003_rls_policies_budgets.sql
-- Fix: budgets table had ENABLE ROW LEVEL SECURITY but no policy,
-- which made it silently unreadable/writable by nobody (except
-- service_role). Detected by __tests__/db/rls-coverage.test.ts
-- (ORN-107 F1 DB desde cero + RLS + types).
-- ============================================

-- Idempotent guard: only create when the table exists without a policy.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'budgets' AND relkind = 'r') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Usuarios gestionan sus presupuestos' AND polrelid = 'budgets'::regclass) THEN
      CREATE POLICY "Usuarios gestionan sus presupuestos" ON budgets
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
  END IF;
END
$$;
