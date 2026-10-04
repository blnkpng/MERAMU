/* =========================================================
   MERAMU F1 → F2 TRANSITION
   Intercepts QC F1 = PASS and completes the transition
   through the atomic Supabase RPC.
========================================================= */

(function(){

    "use strict";

    // Prevent duplicate F1 → F2 submissions while the atomic RPC is running.
    let f1TransitionBusy = false;


    /* =====================================================
       WAIT FOR SUPABASE
    ===================================================== */

    function waitForSupabase(callback, attempts = 40){

        if(window.supabaseClient){

            callback(window.supabaseClient);

            return;
        }


        if(attempts <= 0){

            console.error(
                "MERAMU F1→F2: Supabase client tidak ditemukan."
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
       GET VALUE
    ===================================================== */

    function getValue(id){

        const el =
            document.getElementById(id);


        return el
            ? String(
                el.value || ""
            ).trim()
            : "";

    }


    /* =====================================================
       GET OPTIONAL NUMBER
    ===================================================== */

    function getOptionalNumber(id){

        const value =
            getValue(id);


        if(value === ""){

            return null;

        }


        const number =
            Number(
                value.replace(",", ".")
            );


        return Number.isFinite(number)
            ? number
            : null;

    }


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
       GET SAVE BUTTON
    ===================================================== */

    function getButton(){

        return document.getElementById(
            "saveQualityCheck"
        );

    }


    /* =====================================================
       UPDATE F1 PASS BUTTON
    ===================================================== */

    function updateF1PassButton(){

        const stage =
            getValue("qcStage")
                .toLowerCase();


        const decision =
            getValue("qcDecision")
                .toLowerCase();


        const button =
            getButton();


        if(!button){

            return;

        }


        if(
            stage === "f1" &&
            decision === "passed"
        ){

            button.dataset.f1Transition =
                "true";


            button.innerHTML = `
                <i data-lucide="arrow-right-circle"></i>
                Simpan QC & Mulai F2
            `;

        }else{

            button.dataset.f1Transition =
                "false";


            button.innerHTML = `
                <i data-lucide="save"></i>
                Simpan QC
            `;

        }


        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       SAVE F1 PASS + START F2
    ===================================================== */

    async function saveF1PassAndStartF2(event){

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        const button =
            getButton();


        if(button?.disabled || f1TransitionBusy){

            return;

        }


        const stage =
            getValue("qcStage")
                .toLowerCase();


        const decision =
            getValue("qcDecision")
                .toLowerCase();


        if(
            stage !== "f1" ||
            decision !== "passed"
        ){

            return;

        }


        const checkedAt =
            getValue("qcCheckedAt");


        if(!checkedAt){

            alert(
                "Tanggal & waktu QC wajib diisi."
            );

            return;

        }


        const operatorName =
            getValue("qcOperator");


        const reason =
            getValue("qcReason");


        const notes =
            getValue("qcNotes");


        if(!operatorName){

            alert(
                "Operator wajib diisi."
            );

            return;

        }


        const batchCode =
            getBatchCode();


        /* -------------------------------------------------
           BUTTON LOADING
        ------------------------------------------------- */

        if(button){

            button.disabled = true;


            button.dataset.originalText =
                button.textContent.trim();


            button.innerHTML = `
                <i data-lucide="loader-circle"></i>
                Memproses F1 → F2...
            `;


            if(window.lucide){

                lucide.createIcons();

            }

        }


        f1TransitionBusy = true;

        try{

            /* ---------------------------------------------
               WAIT SUPABASE
            --------------------------------------------- */

            await new Promise(
                resolve =>
                    waitForSupabase(resolve)
            );


            const supabase =
                window.supabaseClient;


            if(!supabase){

                throw new Error(
                    "Supabase client belum siap."
                );

            }


            /* ---------------------------------------------
               GET BATCH UUID
            --------------------------------------------- */

            const {
                data: batch,
                error: batchError
            } = await supabase

                .from("batches")

                .select(`
                    id,
                    batch_code,
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

                throw new Error(
                    `Batch ${batchCode} tidak ditemukan.`
                );

            }


            /* ---------------------------------------------
               VALIDATE CURRENT STAGE
            --------------------------------------------- */

            if(
                String(
                    batch.current_stage || ""
                ).toLowerCase() !== "f1"
            ){

                throw new Error(
                    `Batch ${batchCode} sudah bukan F1. Current stage: ${
                        batch.current_stage || "—"
                    }.`
                );

            }


            /* ---------------------------------------------
               ATOMIC RPC
            --------------------------------------------- */

            const {
                data,
                error
            } = await supabase.rpc(
                "complete_meramu_f1_to_f2",
                {

                    p_batch_id:
                        batch.id,

                    p_checked_at:
                        new Date(
                            checkedAt
                        ).toISOString(),

                    p_ph:
                        getOptionalNumber(
                            "qcPh"
                        ),

                    p_brix:
                        getOptionalNumber(
                            "qcBrix"
                        ),

                    p_temperature_c:
                        getOptionalNumber(
                            "qcTemperature"
                        ),

                    p_volume:
                        getOptionalNumber(
                            "qcVolume"
                        ),

                    p_aroma:
                        getValue("qcAroma")
                        || null,

                    p_taste:
                        getValue("qcTaste")
                        || null,

                    p_color:
                        getValue("qcColor")
                        || null,

                    p_carbonation:
                        getValue("qcCarbonation")
                        || null,

                    p_scoby_condition:
                        getValue("qcScoby")
                        || null,

                    p_operator_name:
                        operatorName,

                    p_reason:
                        reason || null,

                    p_notes:
                        notes || null

                }
            );


            if(error){

                throw error;

            }


            /* ---------------------------------------------
               CATAT F2 STARTED AT
               Stage transition dilakukan oleh RPC.
            --------------------------------------------- */

            const {
                error: f2StartMetaError
            } = await supabase
                .from("batches")
                .update({
                    f2_started_at: new Date().toISOString(),
                    f2_completed_at: null
                })
                .eq("id", batch.id);

            if(f2StartMetaError){
                throw f2StartMetaError;
            }


            /* ---------------------------------------------
               CATAT F1 COMPLETED AT
               Kolom ini hanya metadata lifecycle batch;
               perpindahan stage tetap dilakukan oleh RPC.
            --------------------------------------------- */

            const {
                error: completionMetaError
            } = await supabase
                .from("batches")
                .update({
                    f1_completed_at:
                        new Date().toISOString()
                })
                .eq("id", batch.id);

            if(completionMetaError){
                throw completionMetaError;
            }


            console.log(
                "✅ MERAMU: F1 → F2 berhasil.",
                data
            );


            /* ---------------------------------------------
               CUSTOM EVENT
            --------------------------------------------- */

            document.dispatchEvent(
                new CustomEvent(
                    "meramu:f1-to-f2-complete",
                    {
                        detail: {
                            batchCode,
                            batch: data
                        }
                    }
                )
            );


            /* ---------------------------------------------
               REALTIME REFRESH
            --------------------------------------------- */

            if(
                window.MERAMURealtime?.refresh
            ){

                window.MERAMURealtime.refresh();

            }


            /* ---------------------------------------------
               REFRESH BATCH DETAIL
            --------------------------------------------- */

            if(
                window.initBatchSupabase
            ){

                window.initBatchSupabase();

            }


            /* ---------------------------------------------
               REFRESH FERMENTATION LOG
            --------------------------------------------- */

            if(
                window.initBatchFermentationLogs
            ){

                window.initBatchFermentationLogs();

            }


            /* ---------------------------------------------
               REFRESH QC HISTORY
            --------------------------------------------- */

            if(
                window.loadQualityCheckHistory
            ){

                window.loadQualityCheckHistory();

            }


            /* ---------------------------------------------
               RENDER BATCH DETAIL
            --------------------------------------------- */

            if(
                window.renderBatchDetail
            ){

                setTimeout(
                    function(){

                        window.renderBatchDetail();

                    },
                    300
                );

            }


            /* ---------------------------------------------
               CLOSE QC MODAL
            --------------------------------------------- */

            if(
                typeof window.closeQualityCheck ===
                "function"
            ){

                window.closeQualityCheck();

            }else{

                const modal =
                    document.getElementById(
                        "qualityCheckModal"
                    );


                if(modal){

                    modal.hidden = true;

                    modal.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }

            }


            /* ---------------------------------------------
               SUCCESS MESSAGE
            --------------------------------------------- */

            alert(
                `QC F1 PASS. ${batchCode} berhasil masuk F2.\nTarget F2 dihitung otomatis dari recipe.`
            );

            f1TransitionBusy = false;


        }catch(error){

            console.error(
                "❌ MERAMU F1 → F2 gagal:",
                error
            );


            alert(
                "F1 → F2 gagal.\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );


            if(button){

                button.disabled = false;

                updateF1PassButton();

            }

            f1TransitionBusy = false;

        }

    }


    /* =====================================================
       CAPTURE SUBMIT
       
       Dipasang di capture phase agar QC handler lama
       tidak ikut melakukan INSERT kedua saat F1 PASS.
    ===================================================== */

    document.addEventListener(
        "submit",
        function(event){

            if(
                event.target?.id !==
                "qualityCheckForm"
            ){

                return;

            }


            const stage =
                getValue("qcStage")
                    .toLowerCase();


            const decision =
                getValue("qcDecision")
                    .toLowerCase();


            if(
                stage === "f1" &&
                decision === "passed"
            ){

                saveF1PassAndStartF2(
                    event
                );

            }

        },
        true
    );


    /* =====================================================
       DECISION / STAGE CHANGES
    ===================================================== */

    document.addEventListener(
        "change",
        function(event){

            if(
                event.target?.id ===
                    "qcDecision" ||

                event.target?.id ===
                    "qcStage"
            ){

                updateF1PassButton();

            }

        }
    );


    /* =====================================================
       OPEN QC MODAL
    ===================================================== */

    document.addEventListener(
        "click",
        function(event){

            const openButton =
                event.target.closest(
                    "#addQualityCheck"
                );


            if(!openButton){

                return;

            }


            setTimeout(
                updateF1PassButton,
                50
            );

        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function(){

            updateF1PassButton();

        }
    );


    /* =====================================================
       EXPORT
    ===================================================== */

    window.updateF1PassButton =
        updateF1PassButton;


})();
