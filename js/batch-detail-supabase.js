/* =========================================================
   MERAMU BATCH DETAIL → SUPABASE
   Step 3.7
   Batch + Timeline Sync

   Fungsi:
   - Ambil batch berdasarkan ?id=KB-022
   - Ambil product
   - Ambil recipe + recipe version
   - Mapping data Supabase ke Batch Detail
   - Sinkronisasi tanggal Production + Harvest
   - Mempertahankan timeline lama sebagai fallback
   - Tidak mengubah Add Log / Edit / Print / Thermal Label
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       WAIT FOR SUPABASE CLIENT
    ===================================================== */

    function waitForSupabaseClient(
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
                "MERAMU: Supabase client tidak ditemukan."
            );

            console.error(
                "Pastikan js/supabase.js sudah dimuat sebelum batch-detail-supabase.js."
            );

            return;

        }


        setTimeout(
            () => {

                waitForSupabaseClient(
                    callback,
                    attempts - 1
                );

            },
            100
        );

    }


    /* =====================================================
       GET BATCH ID
    ===================================================== */

    function getSupabaseBatchId(){

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
       YYYY-MM-DD → DD Mon YYYY
    ===================================================== */

    function formatDate(
        value
    ){

        if(!value){

            return "—";

        }


        const parts =
            String(value).split("-");


        if(parts.length !== 3){

            return value;

        }


        const monthNames = [

            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des"

        ];


        const year =
            parts[0];

        const month =
            Number(parts[1]);

        const day =
            Number(parts[2]);


        return (
            `${day} ${monthNames[month - 1]} ${year}`
        );

    }


    /* =====================================================
       NORMALIZE STAGE
    ===================================================== */

    function normalizeStage(
        stage
    ){

        const value =
            String(
                stage || ""
            )
            .trim()
            .toLowerCase();


        if(
            value === "f1" ||
            value.includes("f1")
        ){

            return "F1 Fermentasi";

        }


        if(
            value === "f2" ||
            value.includes("f2")
        ){

            return "F2 Fermentasi";

        }


        if(
            value === "harvest" ||
            value === "panen"
        ){

            return "Harvest";

        }


        if(
            value === "bottling" ||
            value === "bottle" ||
            value === "pembotolan"
        ){

            return "Bottling";

        }


        if(
            value === "label" ||
            value.includes("qr")
        ){

            return "Label / QR";

        }


        if(
            value === "finished" ||
            value === "selesai"
        ){

            return "Finished";

        }


        return "Production";

    }


    /* =====================================================
       STATUS LABEL
    ===================================================== */

    function getStatusLabel(
        stage,
        status
    ){

        const normalizedStage =
            String(
                stage || ""
            )
            .toLowerCase();


        const normalizedStatus =
            String(
                status || ""
            )
            .toLowerCase();


        if(
            normalizedStage === "harvest" ||
            normalizedStatus === "ready" ||
            normalizedStatus === "harvest"
        ){

            return "READY HARVEST";

        }


        if(
            normalizedStage === "finished" ||
            normalizedStatus === "finished"
        ){

            return "FINISHED";

        }


        if(
            normalizedStage === "production"
        ){

            return "PRODUCTION ACTIVE";

        }


        if(
            normalizedStage === "f1"
        ){

            return "F1 ACTIVE";

        }


        if(
            normalizedStage === "f2"
        ){

            return "F2 ACTIVE";

        }


        if(
            normalizedStage === "bottling"
        ){

            return "BOTTLING ACTIVE";

        }


        if(
            normalizedStage === "label"
        ){

            return "LABEL / QR";

        }


        return (
            String(
                status || "ACTIVE"
            ).toUpperCase()
        );

    }


    /* =====================================================
       CALCULATE PROGRESS
    ===================================================== */

    function calculateProgress(
        productionDate,
        targetDate,
        stage
    ){

        const normalizedStage =
            String(
                stage || ""
            )
            .toLowerCase();


        if(
            normalizedStage === "harvest" ||
            normalizedStage === "finished"
        ){

            return 100;

        }


        if(
            !productionDate ||
            !targetDate
        ){

            return 0;

        }


        const start =
            new Date(
                `${productionDate}T00:00:00`
            );

        const target =
            new Date(
                `${targetDate}T00:00:00`
            );

        const now =
            new Date();


        const total =
            target - start;

        const elapsed =
            now - start;


        if(total <= 0){

            return 0;

        }


        let progress =
            Math.round(
                (elapsed / total) * 100
            );


        progress =
            Math.max(
                0,
                Math.min(
                    100,
                    progress
                )
            );


        return progress;

    }


    /* =====================================================
       CALCULATE DAY
    ===================================================== */

    function calculateDay(
        productionDate
    ){

        if(!productionDate){

            return 1;

        }


        const start =
            new Date(
                `${productionDate}T00:00:00`
            );

        const now =
            new Date();


        const diff =
            now - start;


        const day =
            Math.floor(
                diff /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            ) + 1;


        return Math.max(
            1,
            day
        );

    }


    /* =====================================================
       CALCULATE DURATION
    ===================================================== */

    function calculateDuration(
        productionDate
    ){

        return (
            `${calculateDay(productionDate)} Hari`
        );

    }


    /* =====================================================
       FORMAT CURRENCY
    ===================================================== */

    function formatRupiah(
        value
    ){

        const number =
            Number(value || 0);


        return (
            "Rp " +
            new Intl.NumberFormat(
                "id-ID"
            ).format(
                number
            )
        );

    }


    /* =====================================================
       FORMAT VOLUME
    ===================================================== */

    function formatVolume(
        value,
        unit
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const numeric =
            Number(value);


        const formatted =
            Number.isInteger(numeric)
                ? String(numeric)
                : numeric.toFixed(1);


        return (
            `${formatted} ${unit || "L"}`
        );

    }


    /* =====================================================
       TIMELINE SYNC
    ===================================================== */

    function syncTimeline(
        row,
        oldBatch
    ){

        const oldTimeline =
            Array.isArray(
                oldBatch?.timeline
            )
                ? oldBatch.timeline
                : [];


        const timelineMap = {};


        oldTimeline.forEach(
            event => {

                if(
                    event &&
                    event.stage
                ){

                    timelineMap[
                        event.stage
                    ] = {
                        ...event
                    };

                }

            }
        );


        /* ---------------------------------------------
           PRODUCTION
        --------------------------------------------- */

        timelineMap.production = {

            ...(timelineMap.production || {}),

            stage:
                "production",

            date:
                row.production_date
                    ? formatDate(
                        row.production_date
                    )
                    : (
                        timelineMap.production?.date ||
                        null
                    ),

            status:
                timelineMap.production?.status ||
                "completed",

            note:
                timelineMap.production?.note ||
                "Batch dibuat dan proses produksi dimulai."

        };


        /* ---------------------------------------------
           HARVEST
           target_date menjadi tanggal target harvest
        --------------------------------------------- */

        if(row.target_date){

            timelineMap.harvest = {

                ...(timelineMap.harvest || {}),

                stage:
                    "harvest",

                date:
                    formatDate(
                        row.target_date
                    ),

                status:
                    (
                        String(
                            row.current_stage || ""
                        )
                        .toLowerCase() === "harvest"
                    )
                        ? "active"
                        : (
                            timelineMap.harvest?.status ||
                            "upcoming"
                        ),

                note:
                    timelineMap.harvest?.note ||
                    "Target panen batch."

            };

        }


        /* ---------------------------------------------
           CURRENT STAGE
           Jika stage sudah memiliki tanggal dari
           timeline lama, pertahankan.
        --------------------------------------------- */

        const currentStage =
            String(
                row.current_stage || ""
            )
            .trim()
            .toLowerCase();


        if(
            [
                "production",
                "f1",
                "f2",
                "harvest",
                "bottling",
                "label",
                "finished"
            ].includes(
                currentStage
            )
        ){

            if(
                timelineMap[currentStage]
            ){

                timelineMap[
                    currentStage
                ].status =
                    "active";

            }

        }


        /* ---------------------------------------------
           URUTAN TIMELINE
        --------------------------------------------- */

        const stageOrder = [

            "production",
            "f1",
            "f2",
            "harvest",
            "bottling",
            "label",
            "finished"

        ];


        return stageOrder.map(
            stage => {

                return (
                    timelineMap[stage] || {

                        stage:
                            stage,

                        date:
                            null,

                        time:
                            null,

                        status:
                            "upcoming",

                        note:
                            ""

                    }
                );

            }
        );

    }


    /* =====================================================
       MAP SUPABASE BATCH
    ===================================================== */

    function mapSupabaseBatch(
        row,
        oldBatch
    ){

        const stage =
            normalizeStage(
                row.current_stage
            );


        const normalizedStage =
            String(
                row.current_stage || ""
            )
            .toLowerCase();


        const product =
            row.products || {};


        const recipe =
            row.recipes || {};


        const recipeVersion =
            row.recipe_versions || null;


        const targetDays =
            normalizedStage === "f1"

                ? (
                    recipeVersion?.f1_target_days ||
                    7
                )

                : normalizedStage === "f2"

                    ? (
                        recipeVersion?.f2_target_days ||
                        5
                    )

                    : (
                        recipeVersion?.f1_target_days ||
                        7
                    );


        const progress =
            calculateProgress(
                row.production_date,
                row.target_date,
                row.current_stage
            );


        const day =
            calculateDay(
                row.production_date
            );


        const timeline =
            syncTimeline(
                row,
                oldBatch
            );


        const batch = {

            code:
                row.batch_code,

            product:
                product.name ||
                "—",

            type:
                product.product_type ||
                "kombucha",

            status:
                getStatusLabel(
                    row.current_stage,
                    row.status
                ),

            stage:
                stage,

            progress:
                progress,

            day:
                day,

            targetDays:
                targetDays,

            startDate:
                formatDate(
                    row.production_date
                ),

            targetDate:
                formatDate(
                    row.target_date
                ),

            expiryDate:
                formatDate(
                    row.expiry_date
                ),

            bestBefore:
                formatDate(
                    row.best_before_date
                ),

            volume:
                formatVolume(
                    row.actual_volume ||
                    row.planned_volume,
                    row.units?.code ||
                    "L"
                ),

            hpp:
                formatRupiah(
                    row.hpp_per_unit
                ),

            /*
               Jangan timpa data metric lama
               jika Supabase batch belum mempunyai
               metric fermentasi.
            */

            ph:
                oldBatch?.ph ||
                "—",

            brix:
                oldBatch?.brix ||
                "—",

            temperature:
                oldBatch?.temperature ||
                "—",

            duration:
                calculateDuration(
                    row.production_date
                ),

            note:
                row.notes ||
                oldBatch?.note ||
                "",

            recipe:
                recipe.name ||
                oldBatch?.recipe ||
                "—",

            recipeVersion:
                recipeVersion?.version_number ||
                oldBatch?.recipeVersion ||
                null,

            timeline:
                timeline

        };


        return batch;

    }


    /* =====================================================
       LOAD BATCH FROM SUPABASE
    ===================================================== */

    async function loadBatchFromSupabase(){

        const batchId =
            getSupabaseBatchId();


        waitForSupabaseClient(
            async (
                supabase
            ) => {

                console.log(
                    "MERAMU: Mengambil batch dari Supabase:",
                    batchId
                );


const {
    data,
    error
} = await supabase
    .from("batches")
    .select(`
        id,
        batch_code,
        product_id,
        recipe_id,
        recipe_version_id,
        production_date,
        target_date,
        expiry_date,
        best_before_date,
        planned_volume,
        actual_volume,
        volume_unit_id,
        current_stage,
        status,
        hpp_total,
        hpp_per_unit,
        notes,

        products (
            id,
            code,
            name,
            product_type,
            category
        ),

        recipes (
            id,
            code,
            name,
            recipe_type
        ),

        recipe_versions (
            id,
            version_number,
            yield_quantity,
            fermentation_required,
            f1_target_days,
            f2_target_days,
            shelf_life_days
        )
    `)
    .eq("batch_code", batchId)
    .maybeSingle();


                if(error){

                    console.error(
                        "MERAMU: Gagal mengambil batch dari Supabase.",
                        error
                    );

                    return;

                }


                if(!data){

                    console.warn(
                        `MERAMU: Batch ${batchId} tidak ditemukan di Supabase.`
                    );

                    return;

                }


                const oldBatch =
                    typeof batchDetailData !==
                    "undefined"

                        ? (
                            batchDetailData[
                                batchId
                            ] || {}
                        )

                        : {};


                const supabaseBatch =
                    mapSupabaseBatch(
                        data,
                        oldBatch
                    );


                /* -----------------------------------------
                   MERGE DATA
                ----------------------------------------- */

                if(
                    typeof batchDetailData !==
                    "undefined"
                ){

                    batchDetailData[
                        batchId
                    ] = {

                        ...oldBatch,

                        ...supabaseBatch

                    };

                }


                console.log(
                    "✅ MERAMU Batch berhasil diambil dari Supabase.",
                    batchDetailData?.[batchId]
                );


                /* -----------------------------------------
                   RENDER ULANG
                ----------------------------------------- */

                if(
                    window.renderBatchDetail
                ){

                    window.renderBatchDetail();

                }

            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function initBatchSupabase(){

        loadBatchFromSupabase();

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    window.initBatchSupabase =
        initBatchSupabase;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initBatchSupabase
    );

})();
