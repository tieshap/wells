/**
 * Admin Functions
 * Requires admin privileges (profile.is_admin === true)
 */

// ======================== GET ALL USERS ========================
async function adminGetAllProfiles() {
  var { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// ======================== GET ALL ACCOUNTS ========================
async function adminGetAllAccounts() {
  var { data, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .order('type');

  if (error) throw new Error(error.message);
  return data || [];
}

// ======================== GET ALL TRANSACTIONS ========================
async function adminGetAllTransactions() {
  var { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data || [];
}

// ======================== UPDATE ACCOUNT BALANCE ========================
async function adminUpdateAccount(accountId, updates) {
  var { data, error } = await supabaseAdmin
    .from('accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ======================== CREATE USER (with accounts) ========================
async function adminCreateUser(email, password, fullName, accounts) {
  // 1. Create auth user via admin API
  var { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) throw new Error('Auth error: ' + authError.message);

  var userId = authData.user.id;

  // 2. Update profile with full name
  var { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId);

  if (profileError) throw new Error('Profile error: ' + profileError.message);

  // 3. Create accounts
  if (accounts && accounts.length > 0) {
    var accountRows = accounts.map(function(a) {
      return {
        user_id: userId,
        type: a.type,
        account_number: a.accountNumber || generateAccountNumber(),
        balance: a.balance || 0,
        credit_limit: a.type === 'credit_card' ? (a.creditLimit || 0) : null
      };
    });

    var { error: accountsError } = await supabaseAdmin
      .from('accounts')
      .insert(accountRows);

    if (accountsError) throw new Error('Accounts error: ' + accountsError.message);
  }

  return userId;
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// ======================== ADD ACCOUNT TO EXISTING USER ========================
async function adminAddAccount(userId, type, accountNumber, balance, creditLimit) {
  var row = {
    user_id: userId,
    type: type,
    account_number: accountNumber || generateAccountNumber(),
    balance: balance || 0,
    credit_limit: type === 'credit_card' ? (creditLimit || 0) : null
  };

  var { data, error } = await supabaseAdmin
    .from('accounts')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ======================== ADD TRANSACTION ========================
async function adminAddTransaction(txData) {
  var { data, error } = await supabaseAdmin
    .from('transactions')
    .insert(txData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update account balance (logic differs by account type)
  var account = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('id', txData.account_id)
    .single();

  if (account.data) {
    var currentBalance = Number(account.data.balance);
    var amount = Number(txData.amount);
    var newBalance;

    if (account.data.type === 'credit_card') {
      // Credit card: debit (charge) increases balance owed, credit (payment) decreases it
      newBalance = txData.type === 'credit'
        ? currentBalance - amount
        : currentBalance + amount;
    } else {
      // Checking/Savings: credit (deposit) increases balance, debit (withdrawal) decreases it
      newBalance = txData.type === 'credit'
        ? currentBalance + amount
        : currentBalance - amount;
    }

    await supabaseAdmin
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', txData.account_id);
  }

  return data;
}

// ======================== UPDATE TRANSACTION ========================
async function adminUpdateTransaction(txId, updates) {
  var { data, error } = await supabaseAdmin
    .from('transactions')
    .update(updates)
    .eq('id', txId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ======================== DELETE TRANSACTION ========================
async function adminDeleteTransaction(txId) {
  var { error } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('id', txId);

  if (error) throw new Error(error.message);
  return true;
}

// ======================== DELETE ACCOUNT ========================
async function adminDeleteAccount(accountId) {
  // Delete account — CASCADE deletes its transactions automatically
  var { error } = await supabaseAdmin
    .from('accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw new Error(error.message);
  return true;
}

// ======================== DELETE USER ========================
async function adminDeleteUser(userId) {
  var { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  return true;
}

// ======================== GET ACCOUNTS FOR USER ========================
async function adminGetUserAccounts(userId) {
  var { data, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('type');

  if (error) throw new Error(error.message);
  return data || [];
}

// ======================== GET TRANSACTIONS FOR ACCOUNT ========================
async function adminGetAccountTransactions(accountId) {
  var { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data || [];
}
