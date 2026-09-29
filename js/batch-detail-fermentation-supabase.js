/* =========================================================
   MERAMU BATCH DETAIL → FERMENTATION LOGS SUPABASE
   Dynamic + Realtime

   Fungsi:
   - Ambil fermentation_logs berdasarkan batch_id
   - Ambil log terbaru
   - Tampilkan pH / Brix / Suhu / Volume
   - Tampilkan seluruh fermentation log
   - Mendukung batch KB-021, KB-022, dst.
   - Tidak mengubah Thermal Label
   - Tidak mengubah Print
   - Tidak mengubah Edit Batch
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       WAIT FOR SUPABASE
    ===================================================== */

    function waitForSupabase(
        callback,
        attempts = 50
    ){

        if(
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ){

            callback(
                window.supabaseClient
            );

            return;
        }


        if(attempts <= 0){

            console.error(
                "MERAMU Logs: Supabase client tidak ditemukan."
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
            100
        );

    }


    /* =====================================================
       GET CURRENT BATCH CODE
    ===================================================== */

    function getBatchCode(){

        const params =
            new URLSearchParams(
                window.location.search
            );


        return (
            params.get("id") ||
            "KB-022"
        );

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDateTime(
        value
    ){

        if(!value){

            return {
                date: "—",
                time: "—"
            };

        }


        const date =
            new Date(value);


        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return {
                date: String(value),
                time: "—"
            };

        }


        const dateText =
            new Intl.DateTimeFormat(
                "id-ID",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ).format(date);


        const timeText =
            new Intl.DateTimeFormat(
                "id-ID",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }
            ).format(date);


        return {

            date:
                dateText,

            time:
                timeText

        };

    }


    /* =====================================================
       PICK FIRST AVAILABLE VALUE
    ===================================================== */

    function pick(
        object,
        keys,
        fallback = null
    ){

        if(!object){

            return fallback;

        }


        for(
            const key of keys
        ){

            if(
                object[key] !== undefined &&
                object[key] !== null &&
                object[key] !== ""
            ){

                return object[key];

            }

        }


        return fallback;

    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(
        value,
        decimals = 2
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const number =
            Number(value);


        if(
            Number.isNaN(number)
        ){

            return String(value);

        }


        return number.toFixed(
            decimals
        );

    }


    /* =====================================================
       FORMAT PH
    ===================================================== */

    function formatPh(
        value
    ){

        return formatNumber(
            value,
            2
        );

    }


    /* =====================================================
       FORMAT BRIX
    ===================================================== */

    function formatBrix(
        value
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const number =
            Number(value);


        if(
            Number.isNaN(number)
        ){

            return String(value);

        }


        return (
            `${number.toFixed(1)}°`
        );

    }


    /* =====================================================
       FORMAT TEMPERATURE
    ===================================================== */

    function formatTemperature(
        value
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const number =
            Number(value);


        if(
            Number.isNaN(number)
        ){

            return String(value);

        }


        return (
            `${number.toFixed(1)}°C`
        );

    }


    /* =====================================================
       FORMAT VOLUME
    ===================================================== */

    function formatVolume(
        value
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const number =
            Number(value);


        if(
            Number.isNaN(number)
        ){

            return String(value);

        }


        return (
            `${number.toFixed(1)} L`
        );

    }


    /* =====================================================
       NORMALIZE QC
    ===================================================== */

    function normalizeQc(
        value
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const normalized =
            String(value)
                .trim()
                .toLowerCase();


        if(
            normalized === "passed" ||
            normalized === "pass" ||
            normalized === "ok"
        ){

            return "passed";

        }


        if(
            normalized === "warning" ||
            normalized === "warn"
        ){

            return "warning";

        }


        if(
            normalized === "failed" ||
            normalized === "fail"
        ){

            return "failed";

        }


        return normalized;

    }


    /* =====================================================
       MAP SUPABASE LOG
    ===================================================== */

    function mapLog(
        row
    ){

        const measuredAt =
            pick(
                row,
                [
                    "measured_at",
                    "created_at",
                    "logged_at",
                    "recorded_at"
                ]
            );


        const dateTime =
            formatDateTime(
                measuredAt
            );


        const ph =
            pick(
                row,
                [
                    "ph",
                    "ph_value"
                ]
            );


        const brix =
            pick(
                row,
                [
                    "brix",
                    "brix_value"
                ]
            );


        const temperature =
            pick(
                row,
                [
                    "temperature",
                    "temperature_c",
                    "temp",
                    "temp_c"
                ]
            );


        const volume =
            pick(
                row,
                [
                    "volume",
                    "measured_volume",
                    "actual_volume"
                ]
            );


        const operator =
            pick(
                row,
                [
                    "operator",
                    "operator_name",
                    "created_by_name",
                    "user_name"
                ],
                "—"
            );


        const qc =
            pick(
                row,
                [
                    "qc",
                    "qc_status",
                    "quality_status"
                ]
            );


        const note =
            pick(
                row,
                [
                    "note",
                    "notes",
                    "remark",
                    "remarks"
                ],
                ""
            );


        return {

            id:
                row.id,

            stage:
                row.stage ||
                "—",

            date:
                dateTime.date,

            time:
                dateTime.time,

            ph:
                formatPh(
                    ph
                ),

            brix:
                formatBrix(
                    brix
                ),

            temperature:
                formatTemperature(
                    temperature
                ),

            volume:
                formatVolume(
                    volume
                ),

            operator:
                operator,

            qc:
                normalizeQc(
                    qc
                ),

            note:
                note || ""

        };

    }


    /* =====================================================
       FIND BATCH UUID
    ===================================================== */

    async function getBatchUuid(
        supabase,
        batchCode
    ){

        const {
            data,
            error
        } =
            await supabase
                .from("batches")
                .select(
                    "id,batch_code"
                )
                .eq(
                    "batch_code",
                    batchCode
                )
                .maybeSingle();


        if(error){

            console.error(
                "MERAMU Logs: Gagal mencari batch.",
                error
            );

            return null;

        }


        if(!data){

            console.warn(
                `MERAMU Logs: Batch ${batchCode} tidak ditemukan.`
            );

            return null;

        }


        return data.id;

    }


    /* =====================================================
       APPLY LOGS TO BATCH
    ===================================================== */

    function applyLogsToBatch(
        batchCode,
        logs
    ){

        if(
            typeof batchDetailData ===
            "undefined"
        ){

            console.warn(
                "MERAMU Logs: batchDetailData belum tersedia."
            );

            return;

        }


        const batch =
            batchDetailData[
                batchCode
            ];


        if(!batch){

            console.warn(
                `MERAMU Logs: Data lokal ${batchCode} tidak ditemukan.`
            );

            return;

        }


        batch.fermentationLogs =
            logs;


        /* -------------------------------------------------
           LOG TERBARU
        ------------------------------------------------- */

        const latest =
            logs[0];


        if(latest){

            batch.ph =
                latest.ph;

            batch.brix =
                latest.brix;

            batch.temperature =
                latest.temperature;

            if(
                latest.volume &&
                latest.volume !== "—"
            ){

                batch.volume =
                    latest.volume;

            }

        }


        console.log(
            `✅ MERAMU: ${logs.length} fermentation log ${batchCode} berhasil diambil.`,
            logs
        );


        /* -------------------------------------------------
           RENDER BATCH DETAIL
        ------------------------------------------------- */

        if(
            typeof window.renderBatchDetail ===
            "function"
        ){

            window.renderBatchDetail();

        }

    }


    /* =====================================================
       LOAD FERMENTATION LOGS
    ===================================================== */

    async function loadFermentationLogs(){

        const batchCode =
            getBatchCode();


        waitForSupabase(
            async function(
                supabase
            ){

                console.log(
                    "MERAMU: Mengambil fermentation logs:",
                    batchCode
                );


                /* -----------------------------------------
                   GET BATCH UUID
                ----------------------------------------- */

                const batchUuid =
                    await getBatchUuid(
                        supabase,
                        batchCode
                    );


                if(!batchUuid){

                    return;

                }


                /* -----------------------------------------
                   GET LOGS

                   SELECT * digunakan supaya adapter
                   tidak bergantung pada nama kolom tambahan
                   seperti temperature/operator/qc.
                ----------------------------------------- */

                const {
                    data,
                    error
                } =
                    await supabase
                        .from(
                            "fermentation_logs"
                        )
                        .select("*")
                        .eq(
                            "batch_id",
                            batchUuid
                        )
                        .order(
                            "measured_at",
                            {
                                ascending:
                                    false
                            }
                        );


                if(error){

                    console.error(
                        "❌ MERAMU Logs: Gagal mengambil fermentation logs.",
                        error
                    );

                    return;

                }


                const logs =
                    Array.isArray(data)
                        ? data.map(
                            mapLog
                        )
                        : [];


                applyLogsToBatch(
                    batchCode,
                    logs
                );

            }
        );

    }


    /* =====================================================
       REALTIME LISTENER
    ===================================================== */

    function listenRealtime(){

        window.addEventListener(
            "meramu:supabase-change",
            function(event){

                const detail =
                    event.detail || {};


                if(
                    detail.table !==
                    "fermentation_logs"
                ){

                    return;

                }


                console.log(
                    "🔄 MERAMU Logs: Realtime change diterima."
                );


                loadFermentationLogs();

            }
        );

    }


    /* =====================================================
       GLOBAL EXPORT
    ===================================================== */

    window.initBatchFermentationLogs =
        loadFermentationLogs;


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function(){

            /*
               Jalankan setelah adapter batch
               mendapat kesempatan mengambil data.
            */

            setTimeout(
                function(){

                    loadFermentationLogs();

                },
                150
            );


            listenRealtime();

        }
    );


})();
