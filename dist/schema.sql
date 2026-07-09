-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/bqwgyytwylchjcbozjml/sql)
-- This replaces any previous schema. Run the entire file.

-- ============================================================
-- 0. SECURITY DEFINER FUNCTION: checks admin status without RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles (uses SECURITY DEFINER function, no recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- 2. ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card')),
  account_number TEXT NOT NULL,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  credit_limit DECIMAL(12, 2) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own accounts
CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
  ON public.accounts FOR SELECT
  USING (public.is_admin());

-- Admins can update all accounts
CREATE POLICY "Admins can update all accounts"
  ON public.accounts FOR UPDATE
  USING (public.is_admin());

-- Admins can insert accounts
CREATE POLICY "Admins can insert accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================
-- 3. TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions on their own accounts
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = account_id AND user_id = auth.uid())
  );

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- Admins can update all transactions
CREATE POLICY "Admins can update all transactions"
  ON public.transactions FOR UPDATE
  USING (public.is_admin());

-- Admins can insert transactions
CREATE POLICY "Admins can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can delete transactions
CREATE POLICY "Admins can delete transactions"
  ON public.transactions FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger the function every time a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. SET UP INITIAL ADMIN USER
-- ============================================================
-- After creating your admin account through the signup page,
-- run this SQL to make yourself an admin:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';
