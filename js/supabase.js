/* =========================================================
   MERAMU SUPABASE CLIENT
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       SUPABASE CONFIG
    ===================================================== */

    const SUPABASE_URL =
        "https://bgllborppxhbvmzsetjh.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_g0Kl_e3HewgdaavLEMDkSQ_xe1LMbNl";


    /* =====================================================
       CHECK SUPABASE LIBRARY
    ===================================================== */

    if(
        typeof window.supabase === "undefined"
    ){

        console.error(
            "❌ Supabase library belum dimuat."
        );

        return;

    }


    /* =====================================================
       CREATE CLIENT
    ===================================================== */

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    console.log(
        "✅ MERAMU: Supabase client siap."
    );

})();
