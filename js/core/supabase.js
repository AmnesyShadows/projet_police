const SUPABASE_URL = "https://sjbmrfrygmzqahjyiwxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hSqbG9wx7gD8jmmoAVv2xw_SSQIawp1";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);