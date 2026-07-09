/**
 * Auth logic for Wells Fargo clone
 * Handles signup, sign in, sign out, and session management
 */

// ======================== SIGN UP ========================
async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ======================== SIGN IN ========================
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ======================== SIGN OUT ========================
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  window.location.href = 'index.html';
}

// ======================== GET CURRENT USER ========================
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// ======================== GET USER PROFILE ========================
async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

// ======================== CHECK IF ADMIN ========================
async function isAdmin() {
  const profile = await getUserProfile();
  return profile?.is_admin === true;
}

// ======================== GET USER ACCOUNTS ========================
async function getUserAccounts() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('type');

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  return data || [];
}

// ======================== GET ACCOUNT TRANSACTIONS ========================
async function getAccountTransactions(accountId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

// ======================== FORMAT HELPERS ========================
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getAccountIcon(type) {
  switch (type) {
    case 'checking': return '🏦';
    case 'savings': return '💰';
    case 'credit_card': return '💳';
    default: return '📒';
  }
}

function getAccountLabel(type) {
  switch (type) {
    case 'checking': return 'Checking';
    case 'savings': return 'Savings';
    case 'credit_card': return 'Credit Card';
    default: return type;
  }
}
