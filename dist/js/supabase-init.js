/**
 * Supabase Client Initialization
 * Loaded via CDN in auth.html, dashboard.html, and edit.html
 */
var SUPABASE_URL = 'https://bqwgyytwylchjcbozjml.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxd2d5eXR3eWxjaGpjYm96am1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODAxMjEsImV4cCI6MjA5OTE1NjEyMX0.omvg_NjNkYKUlrqKzzriu8xRbG13aFRHrI_ZFu5uMDc';
var SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxd2d5eXR3eWxjaGpjYm96am1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU4MDEyMSwiZXhwIjoyMDk5MTU2MTIxfQ.6rUtjrbdAyeyB2dQ0kEfBRv9TaewMRipXBV2zlAWiN4';

// The Supabase CDN script creates global 'supabase' with createClient method
// Save the CDN reference before overwriting it
var _supabaseCdn = window.supabase;

var supabase = _supabaseCdn.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin client with service_role key for user creation
var supabaseAdmin = _supabaseCdn.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'sb-admin-auth-token'
  }
});
