/* =========================================================
   MERAMU SUPABASE CLIENT
========================================================= */

const SUPABASE_URL = "https://bgllborppxhbvmzsetjh.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_g0Kl_e3HewgdaavLEMDkSQ_xe1LMbNl";

if (!window.supabase) {
    console.error("❌ Supabase library belum dimuat.");
} else {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("✅ MERAMU Supabase client siap.");
}
