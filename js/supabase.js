/* =========================================================
   MERAMU SUPABASE CLIENT
========================================================= */

(function(){

    if(!window.MERAMU_CONFIG){
        console.error("❌ MERAMU_CONFIG belum tersedia.");
        return;
    }

    if(!window.supabase){
        console.error("❌ Supabase JS belum dimuat.");
        return;
    }

    const {
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    } = window.MERAMU_CONFIG;

    window.meramuSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("✅ MERAMU Supabase client connected.");

})();
