/* =========================================================
   MERAMU SUPABASE REALTIME
   Central Realtime Controller

   Tables:
   - public.batches
   - public.fermentation_logs
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CHANNEL_NAME =
        "meramu-production-realtime";


    let realtimeChannel = null;


    /* =====================================================
       WAIT FOR SUPABASE
    ===================================================== */

    function waitForSupabase(
        callback,
        attempts = 30
    ){

        if(
            window.supabaseClient &&
            typeof window.supabaseClient.channel === "function"
        ){

            callback(
                window.supabaseClient
            );

            return;
        }


        if(attempts <= 0){

            console.error(
                "❌ MERAMU Realtime: Supabase client tidak ditemukan."
            );

            return;
        }


        setTimeout(
            function(){

                waitForSupabase(
                    callback,
                    attempts - 1
                );

            },
            300
        );

    }


    /* =====================================================
       DISPATCH GLOBAL EVENT
    ===================================================== */

    function dispatchRealtimeEvent(
        table,
        eventType,
        payload
    ){

        const event =
            new CustomEvent(
                "meramu:supabase-change",
                {
                    detail: {
                        table: table,
                        eventType: eventType,
                        payload: payload,
                        timestamp: new Date().toISOString()
                    }
                }
            );


        window.dispatchEvent(
            event
        );


        console.log(
            `🔄 MERAMU Realtime: ${table} ${eventType}`,
            payload
        );

    }


    /* =====================================================
       SUBSCRIBE
    ===================================================== */

    function startRealtime(){

        waitForSupabase(
            function(supabase){

                /* -----------------------------------------
                   Jangan subscribe dua kali
                ----------------------------------------- */

                if(realtimeChannel){

                    console.warn(
                        "MERAMU Realtime: Channel sudah aktif."
                    );

                    return;
                }


                console.log(
                    "🔄 MERAMU Realtime: Connecting..."
                );


                realtimeChannel =
                    supabase.channel(
                        CHANNEL_NAME
                    );


                /* =========================================
                   BATCHES
                ========================================= */

                realtimeChannel.on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "batches"
                    },
                    function(payload){

                        dispatchRealtimeEvent(
                            "batches",
                            payload.eventType,
                            payload
                        );

                    }
                );


                /* =========================================
                   FERMENTATION LOGS
                ========================================= */

                realtimeChannel.on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "fermentation_logs"
                    },
                    function(payload){

                        dispatchRealtimeEvent(
                            "fermentation_logs",
                            payload.eventType,
                            payload
                        );

                    }
                );


                /* =========================================
                   CONNECT CHANNEL
                ========================================= */

                realtimeChannel.subscribe(
                    function(status){

                        console.log(
                            "MERAMU Realtime Status:",
                            status
                        );


                        if(
                            status === "SUBSCRIBED"
                        ){

                            console.log(
                                "✅ MERAMU Realtime Connected"
                            );

                        }


                        if(
                            status === "CHANNEL_ERROR"
                        ){

                            console.error(
                                "❌ MERAMU Realtime Channel Error"
                            );

                        }


                        if(
                            status === "TIMED_OUT"
                        ){

                            console.error(
                                "❌ MERAMU Realtime Connection Timeout"
                            );

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
       STOP REALTIME
    ===================================================== */

    async function stopRealtime(){

        if(
            !realtimeChannel ||
            !window.supabaseClient
        ){

            return;
        }


        try{

            await window.supabaseClient.removeChannel(
                realtimeChannel
            );

        }catch(error){

            console.error(
                "MERAMU Realtime: gagal menghentikan channel.",
                error
            );

        }


        realtimeChannel = null;


        console.log(
            "MERAMU Realtime: disconnected."
        );

    }


    /* =====================================================
       GET STATUS
    ===================================================== */

    function getRealtimeChannel(){

        return realtimeChannel;

    }


    /* =====================================================
       GLOBAL EXPORT
    ===================================================== */

    window.MERAMURealtime = {

        start:
            startRealtime,

        stop:
            stopRealtime,

        channel:
            getRealtimeChannel

    };


    /* =====================================================
       AUTO START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function(){

            startRealtime();

        }
    );


})();
