/* =========================================================
   MERAMU BATCH TIMELINE → SUPABASE
   Builds real timeline from batch + quality_checks
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       GET BATCH CODE
    ===================================================== */

    function getBatchCode(){

        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get("id") ||
            params.get("batch") ||
            "KB-022"
        ).trim();

    }


    /* =====================================================
       WAIT FOR SUPABASE
    ===================================================== */

    function waitForSupabase(
        callback,
        attempts = 40
    ){

        if(window.supabaseClient){

            callback(
                window.supabaseClient
            );

            return;

        }


        if(attempts <= 0){

            console.error(
                "MERAMU Timeline: Supabase client tidak ditemukan."
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
            250
        );

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(
        value
    ){

        if(!value){

            return null;

        }


        const date =
            new Date(value);


        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return null;

        }


        return date.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       FORMAT DATE + TIME
    ===================================================== */

    function formatDateTime(
        value
    ){

        if(!value){

            return {
                date: null,
                time: null
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
                date: null,
                time: null
            };

        }


        return {

            date:
                date.toLocaleDateString(
                    "id-ID",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ),

            time:
                date.toLocaleTimeString(
                    "id-ID",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

        };

    }


    /* =====================================================
       NORMALIZE STAGE
    ===================================================== */

    function normalizeStage(
        value
    ){

        const stage =
            String(
                value || ""
            )
            .trim()
            .toLowerCase();


        if(
            stage === "f1" ||
            stage.includes("f1")
        ){

            return "f1";

        }


        if(
            stage === "f2" ||
            stage.includes("f2")
        ){

            return "f2";

        }


        if(
            stage === "harvest" ||
            stage === "panen"
        ){

            return "harvest";

        }


        return stage;

    }


    /* =====================================================
       BUILD TIMELINE
    ===================================================== */

    function buildTimeline(
        batch,
        qualityChecks
    ){

        const currentStage =
            normalizeStage(
                batch.current_stage ||
                batch.stage
            );


        const productionDate =
            batch.production_date ||
            batch.startDate ||
            null;


        /* -------------------------------------------------
           FIND F1 PASS
        ------------------------------------------------- */

        const f1Pass =
            qualityChecks.find(
                qc => {

                    return (
                        normalizeStage(
                            qc.stage
                        ) === "f1" &&

                        String(
                            qc.decision || ""
                        ).toLowerCase()
                        === "passed"
                    );

                }
            );


        /* -------------------------------------------------
           F1 → F2 TRANSITION DATE
        ------------------------------------------------- */

        const f2Start =
            f1Pass?.checked_at ||
            null;


        const f2Date =
            formatDateTime(
                f2Start
            );


        /* -------------------------------------------------
           STAGE ORDER
        ------------------------------------------------- */

        const stageOrder = {

            production: 0,
            f1: 1,
            f2: 2,
            harvest: 3,
            bottling: 4,
            label: 5,
            finished: 6

        };


        const currentIndex =
            stageOrder[currentStage] ?? 0;


        /* -------------------------------------------------
           STATUS HELPER
        ------------------------------------------------- */

        function getStatus(
            stage,
            index
        ){

            if(
                index < currentIndex
            ){

                return "completed";

            }


            if(
                index === currentIndex
            ){

                return "active";

            }


            return "upcoming";

        }


        /* -------------------------------------------------
           F1 NOTE
        ------------------------------------------------- */

        let f1Note =
            "Fermentasi primer.";


        if(f1Pass){

            const operator =
                f1Pass.operator_name
                ? ` • ${f1Pass.operator_name}`
                : "";


            f1Note =
                `QC F1 PASS${operator}`;

        }


        /* -------------------------------------------------
           F2 NOTE
        ------------------------------------------------- */

        let f2Note =
            "Fermentasi sekunder dan pengembangan rasa.";


        if(f1Pass){

            f2Note =
                "Dimulai setelah QC F1 PASS.";

        }


        /* -------------------------------------------------
           EVENTS
        ------------------------------------------------- */

        const events = [

            {
                stage: "production",

                date:
                    formatDate(
                        productionDate
                    ),

                time: null,

                status:
                    getStatus(
                        "production",
                        0
                    ),

                note:
                    "Batch dibuat dan proses produksi dimulai."

            },


            {
                stage: "f1",

                date:
                    formatDate(
                        productionDate
                    ),

                time: null,

                status:
                    getStatus(
                        "f1",
                        1
                    ),

                note:
                    f1Note

            },


            {
                stage: "f2",

                date:
                    f2Date.date,

                time:
                    f2Date.time,

                status:
                    getStatus(
                        "f2",
                        2
                    ),

                note:
                    f2Note

            },


            {
                stage: "harvest",

                date:
                    formatDate(
                        batch.target_date
                    ),

                time: null,

                status:
                    getStatus(
                        "harvest",
                        3
                    ),

                note:
                    batch.actual_harvest_date
                    ? "Actual harvest."
                    : "Target panen batch."

            },


            {
                stage: "bottling",

                date: null,

                time: null,

                status:
                    getStatus(
                        "bottling",
                        4
                    ),

                note:
                    "Produk masuk proses pembotolan."

            },


            {
                stage: "label",

                date: null,

                time: null,

                status:
                    getStatus(
                        "label",
                        5
                    ),

                note:
                    "Label dan QR traceability."

            },


            {
                stage: "finished",

                date: null,

                time: null,

                status:
                    getStatus(
                        "finished",
                        6
                    ),

                note:
                    "Batch selesai dan siap masuk inventory."

            }

        ];


        /* -------------------------------------------------
           DIRECT PRODUCTION
        ------------------------------------------------- */

        if(
            String(
                batch.type || ""
            ).toLowerCase()
            === "direct"
        ){

            return events.filter(
                event => {

                    return ![
                        "f1",
                        "f2",
                        "harvest"
                    ].includes(
                        event.stage
                    );

                }
            );

        }


        return events;

    }


    /* =====================================================
       LOAD TIMELINE
    ===================================================== */

    async function loadBatchTimeline(){

        waitForSupabase(
            async function(
                supabase
            ){

                const batchCode =
                    getBatchCode();


                try{

                    /* -------------------------------------
                       GET BATCH
                    ------------------------------------- */

                    const {
                        data: batch,
                        error: batchError
                    } =
                        await supabase

                            .from("batches")

                            .select(`
                                id,
                                batch_code,
                                production_date,
                                target_date,
                                current_stage,
                                status
                            `)

                            .eq(
                                "batch_code",
                                batchCode
                            )

                            .maybeSingle();


                    if(batchError){

                        throw batchError;

                    }


                    if(!batch){

                        console.warn(
                            `MERAMU Timeline: Batch ${batchCode} tidak ditemukan.`
                        );

                        return;

                    }


                    /* -------------------------------------
                       GET QUALITY CHECKS
                    ------------------------------------- */

                    const {
                        data: qualityChecks,
                        error: qcError
                    } =
                        await supabase

                            .from("quality_checks")

                            .select(`
                                id,
                                batch_id,
                                checked_at,
                                stage,
                                decision,
                                operator_name,
                                reason,
                                notes
                            `)

                            .eq(
                                "batch_id",
                                batch.id
                            )

                            .order(
                                "checked_at",
                                {
                                    ascending: true
                                }
                            );


                    if(qcError){

                        throw qcError;

                    }


                    const timeline =
                        buildTimeline(
                            batch,
                            qualityChecks || []
                        );


                    /* -------------------------------------
                       MERGE WITH EXISTING BATCH DATA
                    ------------------------------------- */

                    if(
                        typeof batchDetailData
                        !== "undefined"
                    ){

                        const oldBatch =
                            batchDetailData[
                                batchCode
                            ] || {};


                        batchDetailData[
                            batchCode
                        ] = {

                            ...oldBatch,

                            production_date:
                                batch.production_date,

                            target_date:
                                batch.target_date,

                            current_stage:
                                batch.current_stage,

                            status:
                                batch.status,

                            timeline:
                                timeline

                        };


                        /* -------------------------------
                           RENDER
                        ------------------------------- */

                        if(
                            window.renderBatchTimeline
                        ){

                            window.renderBatchTimeline(
                                batchDetailData[
                                    batchCode
                                ]
                            );

                        }

                    }


                    console.log(
                        "✅ MERAMU Timeline berhasil diperbarui.",
                        timeline
                    );

                }
                catch(error){

                    console.error(
                        "❌ MERAMU Timeline gagal:",
                        error
                    );

                }

            }
        );

    }


    /* =====================================================
       REALTIME REFRESH
    ===================================================== */

    document.addEventListener(
        "meramu:supabase-change",
        function(event){

            const table =
                event.detail?.table;


            if(
                table === "quality_checks" ||
                table === "batches"
            ){

                loadBatchTimeline();

            }

        }
    );


    /* =====================================================
       CUSTOM REFRESH
    ===================================================== */

    document.addEventListener(
        "meramu:f1-to-f2-complete",
        function(){

            setTimeout(
                function(){

                    loadBatchTimeline();

                },
                300
            );

        }
    );


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function(){

            setTimeout(
                loadBatchTimeline,
                800
            );

        }
    );


    /* =====================================================
       EXPORT
    ===================================================== */

    window.loadBatchTimeline =
        loadBatchTimeline;


})();
