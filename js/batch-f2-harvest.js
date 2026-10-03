/* =========================================================
   MERAMU F2 → HARVEST
   QC F2 PASS → READY HARVEST
========================================================= */

(function(){

    "use strict";


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


    function getElement(id){

        return document.getElementById(id);

    }


    function getOptionalNumber(id){

        const value =
            getElement(id)?.value?.trim();

        if(value === ""){

            return null;

        }

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : null;

    }


    function normalizeDecision(value){

        const decision =
            String(value || "")
                .toLowerCase()
                .trim();

        /*
           Support dua versi UI:

           pass   → passed
           passed → passed
        */

        if(
            decision === "pass" ||
            decision === "passed"
        ){

            return "passed";

        }

        return decision;

    }


    function normalizeStage(value){

        return String(value || "")
            .toLowerCase()
            .replace(" fermentasi","")
            .trim();

    }


    async function waitForSupabase(){

        for(let attempt = 0; attempt < 50; attempt++){

            if(window.supabaseClient){

                return window.supabaseClient;

            }

            await new Promise(
                resolve =>
                    setTimeout(resolve,100)
            );

        }

        throw new Error(
            "Supabase belum siap."
        );

    }


    async function handleF2Pass(event){

        const form =
            getElement("qualityCheckForm");

        if(!form){

            return;

        }


        const stage =
            normalizeStage(
                getElement("qcStage")?.value
            );


        const decision =
            normalizeDecision(
                getElement("qcDecision")?.value
            );


        /*
           Hanya intercept:

           F2 + PASS

           Selain itu biarkan
           batch-quality-check.js
           menangani sendiri.
        */

        if(
            stage !== "f2" ||
            decision !== "passed"
        ){

            return;

        }


        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();


        if(!form.checkValidity()){

            form.reportValidity();

            return;

        }


        const saveButton =
            getElement("saveQualityCheck");


        const originalText =
            saveButton
                ?.textContent
                ?.trim() ||
            "Simpan QC";


        if(saveButton){

            saveButton.disabled = true;

            saveButton.textContent =
                "Memproses F2...";

        }


        try{

            const supabase =
                await waitForSupabase();


            const batchCode =
                getBatchCode();


            /* =========================================
               FIND BATCH
            ========================================== */

            const {
                data: batch,
                error: batchError
            } = await supabase
                .from("batches")
                .select("id,batch_code,current_stage,status")
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


            /* =========================================
               VALIDATE F2
            ========================================== */

            if(
                String(batch.current_stage || "")
                    .toLowerCase()
                    .trim() !== "f2"
            ){

                throw new Error(
                    `Batch ${batchCode} sudah bukan F2.`
                );

            }


            /* =========================================
               DATETIME
            ========================================== */

            const checkedAt =
                getElement("qcCheckedAt")?.value;


            const checkedAtIso =
                checkedAt
                    ? new Date(
                        checkedAt
                    ).toISOString()
                    : new Date().toISOString();


            /* =========================================
               RPC
            ========================================== */

            const {
                data: updatedBatch,
                error: rpcError
            } = await supabase.rpc(
                "complete_meramu_f2_qc",
                {

                    p_batch_id:
                        batch.id,

                    p_checked_at:
                        checkedAtIso,

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
                        getElement(
                            "qcAroma"
                        )?.value?.trim() ||
                        null,

                    p_taste:
                        getElement(
                            "qcTaste"
                        )?.value?.trim() ||
                        null,

                    p_color:
                        getElement(
                            "qcColor"
                        )?.value?.trim() ||
                        null,

                    p_carbonation:
                        getElement(
                            "qcCarbonation"
                        )?.value?.trim() ||
                        null,

                    p_scoby_condition:
                        getElement(
                            "qcScobyCondition"
                        )?.value?.trim() ||
                        null,

                    p_operator_name:
                        getElement(
                            "qcOperator"
                        )?.value?.trim() ||
                        null,

                    p_reason:
                        getElement(
                            "qcReason"
                        )?.value?.trim() ||
                        null,

                    p_notes:
                        getElement(
                            "qcNotes"
                        )?.value?.trim() ||
                        null

                }
            );


            if(rpcError){

                throw rpcError;

            }


            /* =========================================
               CATAT F2 COMPLETED AT
               RPC tetap menjadi sumber transisi stage.
            ========================================== */

            const {
                error: completionMetaError
            } = await supabase
                .from("batches")
                .update({
                    f2_completed_at: new Date().toISOString()
                })
                .eq("id", batch.id);

            if(completionMetaError){
                throw completionMetaError;
            }


            console.log(
                "MERAMU: F2 QC PASS berhasil.",
                updatedBatch
            );


            /* =========================================
               LOCAL DATA
            ========================================== */

            if(
                window.batchDetailData &&
                window.batchDetailData[
                    batchCode
                ]
            ){

                const localBatch =
                    window.batchDetailData[
                        batchCode
                    ];

                localBatch.stage =
                    "harvest";

                localBatch.currentStage =
                    "harvest";

                localBatch.status =
                    "READY HARVEST";

                localBatch.progress =
                    100;

                localBatch.harvestReadyAt =
                    updatedBatch
                        ?.harvest_ready_at ||
                    checkedAtIso;

            }


            /* =========================================
               CLOSE MODAL
            ========================================== */

            if(
                typeof window.closeQualityCheck ===
                "function"
            ){

                window.closeQualityCheck();

            }


            form.reset();


            /* =========================================
               REFRESH BATCH DETAIL
            ========================================== */

            if(
                typeof window.initBatchSupabase ===
                "function"
            ){

                await window.initBatchSupabase();

            }


            if(
                typeof window.renderBatchDetail ===
                "function"
            ){

                window.renderBatchDetail();

            }


            /*
               Trigger event agar timeline,
               history dan komponen lain
               ikut refresh.
            */

            document.dispatchEvent(
                new CustomEvent(
                    "meramu:f2-to-harvest-complete",
                    {
                        detail:{
                            batchCode,
                            batch:
                                updatedBatch
                        }
                    }
                )
            );


            if(
                window.MERAMURealtime &&
                typeof window.MERAMURealtime.refresh ===
                "function"
            ){

                window.MERAMURealtime.refresh();

            }


            alert(
                `QC F2 ${batchCode} PASS.\n\n` +
                `Batch sekarang READY HARVEST.`
            );


        }
        catch(error){

            console.error(
                "MERAMU: F2 → Harvest gagal.",
                error
            );


            alert(
                "QC F2 gagal diproses.\n\n" +
                (
                    error?.message ||
                    "Unknown error"
                )
            );

        }
        finally{

            if(saveButton){

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    originalText;

            }

        }

    }


    function init(){

        /*
           Capture phase sengaja digunakan
           supaya F2 PASS ditangani di sini
           sebelum handler QC umum.
        */

        document.addEventListener(
            "submit",
            handleF2Pass,
            true
        );


        console.log(
            "✅ MERAMU F2 → Harvest Controller Loaded"
        );

    }


    window.MERAMUF2Harvest = {

        handle:
            handleF2Pass

    };


    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }
    else{

        init();

    }

})();
