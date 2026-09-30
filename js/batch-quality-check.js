/* =========================================================
   MERAMU BATCH QUALITY CHECK
   Supabase -> public.quality_checks
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       GET BATCH CODE
    ===================================================== */

    function getBatchCode(){

        const params = new URLSearchParams(
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

    function waitForSupabase(callback, attempt = 0){

        if(window.supabaseClient){

            callback(window.supabaseClient);
            return;

        }

        if(attempt >= 50){

            console.error(
                "MERAMU QC: Supabase client tidak ditemukan."
            );

            alert(
                "Supabase belum siap. Silakan refresh halaman."
            );

            return;

        }

        setTimeout(
            () => waitForSupabase(callback, attempt + 1),
            100
        );

    }


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    function getElement(id){

        return document.getElementById(id);

    }


    /* =====================================================
       DEFAULT DATE TIME
    ===================================================== */

    function setDefaultDateTime(){

        const input =
            getElement("qcCheckedAt");

        if(!input) return;

        const now = new Date();

        const local = new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        );

        input.value =
            local.toISOString().slice(0,16);

    }


    /* =====================================================
       DEFAULT DATA FROM BATCH
    ===================================================== */

    function setDefaultFromBatch(){

        const batchCode =
            getBatchCode();

        const batch =
            window.batchDetailData &&
            window.batchDetailData[batchCode];

        if(!batch) return;


        /* ================================================
           STAGE
        ================================================= */

        const stage =
            getElement("qcStage");

        if(stage && batch.stage){

            let normalized =
                String(batch.stage)
                    .toLowerCase()
                    .trim();

            normalized =
                normalized
                    .replace(" fermentasi","")
                    .replace("fermentasi","")
                    .trim();

            const validStages = [
                "production",
                "f1",
                "f2",
                "harvest",
                "bottling",
                "finished"
            ];

            if(
                validStages.includes(normalized)
            ){

                stage.value =
                    normalized;

            }

        }


        /* ================================================
           OPERATOR
        ================================================= */

        const operator =
            getElement("qcOperator");

        if(
            operator &&
            batch.operator &&
            !operator.value.trim()
        ){

            operator.value =
                batch.operator;

        }

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openQualityCheck(){

        const modal =
            getElement("qualityCheckModal");

        if(!modal) return;


        setDefaultDateTime();

        setDefaultFromBatch();


        modal.hidden = false;

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );


        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeQualityCheck(){

        const modal =
            getElement("qualityCheckModal");

        if(!modal) return;


        modal.hidden = true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       OPTIONAL NUMBER
    ===================================================== */

    function getOptionalNumber(id){

        const element =
            getElement(id);

        if(!element) return null;


        const value =
            element.value.trim();


        if(value === ""){

            return null;

        }


        const number =
            Number(value);


        if(!Number.isFinite(number)){

            return null;

        }


        return number;

    }


    /* =====================================================
       SAVE QUALITY CHECK
    ===================================================== */

    async function saveQualityCheck(event){

        event.preventDefault();


        const form =
            getElement("qualityCheckForm");

        if(!form) return;


        if(!form.checkValidity()){

            form.reportValidity();

            return;

        }


        const saveButton =
            getElement("saveQualityCheck");


        if(saveButton){

            saveButton.disabled = true;

            saveButton.dataset.originalText =
                saveButton.textContent.trim();

            saveButton.textContent =
                "Menyimpan...";

        }


        try{

            /* =============================================
               WAIT SUPABASE
            ============================================== */

            const supabase =
                await new Promise(
                    resolve => {

                        waitForSupabase(
                            resolve
                        );

                    }
                );


            if(!supabase){

                throw new Error(
                    "Supabase client belum tersedia."
                );

            }


            /* =============================================
               BATCH CODE
            ============================================== */

            const batchCode =
                getBatchCode();


            console.log(
                "MERAMU QC: Mencari batch",
                batchCode
            );


            /* =============================================
               FIND BATCH UUID
            ============================================== */

            const {
                data: batch,
                error: batchError
            } = await supabase

                .from("batches")

                .select(
                    "id,batch_code"
                )

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
                    `Batch ${batchCode} tidak ditemukan di Supabase.`
                );

            }


            console.log(
                "MERAMU QC: Batch ditemukan",
                batch
            );


            /* =============================================
               CHECKED AT
            ============================================== */

            const checkedAt =
                getElement(
                    "qcCheckedAt"
                ).value;


            let checkedAtIso;


            if(checkedAt){

                checkedAtIso =
                    new Date(
                        checkedAt
                    ).toISOString();

            }else{

                checkedAtIso =
                    new Date().toISOString();

            }


            /* =============================================
               BUILD PAYLOAD
            ============================================== */

            const payload = {

                batch_id:
                    batch.id,

                checked_at:
                    checkedAtIso,

                stage:
                    getElement(
                        "qcStage"
                    ).value,

                ph:
                    getOptionalNumber(
                        "qcPh"
                    ),

                brix:
                    getOptionalNumber(
                        "qcBrix"
                    ),

                temperature_c:
                    getOptionalNumber(
                        "qcTemperature"
                    ),

                volume:
                    getOptionalNumber(
                        "qcVolume"
                    ),

                aroma:
                    getElement(
                        "qcAroma"
                    )?.value?.trim() || null,

                taste:
                    getElement(
                        "qcTaste"
                    )?.value?.trim() || null,

                color:
                    getElement(
                        "qcColor"
                    )?.value?.trim() || null,

                carbonation:
                    getElement(
                        "qcCarbonation"
                    )?.value?.trim() || null,

                scoby_condition:
                    getElement(
                        "qcScobyCondition"
                    )?.value?.trim() || null,

                decision:
                    getElement(
                        "qcDecision"
                    ).value,

                reason:
                    getElement(
                        "qcReason"
                    )?.value?.trim() || null,

                operator_name:
                    getElement(
                        "qcOperator"
                    )?.value?.trim() || null,

                notes:
                    getElement(
                        "qcNotes"
                    )?.value?.trim() || null

            };


            console.log(
                "MERAMU QC: Payload",
                payload
            );


            /* =============================================
               INSERT TO SUPABASE
            ============================================== */

            const {
                data,
                error
            } = await supabase

                .from(
                    "quality_checks"
                )

                .insert(
                    payload
                )

                .select()

                .single();


            if(error){

                throw error;

            }


            console.log(
                "MERAMU QC: Quality Check berhasil disimpan.",
                data
            );


            /* =============================================
               CLOSE MODAL
            ============================================== */

            closeQualityCheck();


            /* =============================================
               RESET FORM
            ============================================== */

            form.reset();


            setDefaultDateTime();


            const stage =
                getElement(
                    "qcStage"
                );

            if(stage){

                stage.value = "f2";

            }


            const decision =
                getElement(
                    "qcDecision"
                );

            if(decision){

                decision.value = "pass";

            }


            const operator =
                getElement(
                    "qcOperator"
                );

            if(operator){

                operator.value =
                    "Arif";

            }


            /* =============================================
               CUSTOM EVENT
            ============================================== */

            document.dispatchEvent(
                new CustomEvent(
                    "meramu:quality-check-saved",
                    {
                        detail: {
                            batchCode,
                            data
                        }
                    }
                )
            );


            /* =============================================
               REALTIME REFRESH
            ============================================== */

            if(
                window.MERAMURealtime &&
                typeof window.MERAMURealtime.refresh ===
                    "function"
            ){

                window.MERAMURealtime.refresh();

            }


            alert(
                `QC Check ${batchCode} berhasil disimpan.`
            );


        }catch(error){

            console.error(
                "MERAMU QC: Gagal menyimpan Quality Check.",
                error
            );


            alert(
                "QC Check gagal disimpan.\n\n" +
                (
                    error?.message ||
                    "Unknown error"
                )
            );


        }finally{

            if(saveButton){

                saveButton.disabled = false;

                saveButton.textContent =
                    saveButton.dataset.originalText ||
                    "Simpan QC";

            }

        }

    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetQualityCheckForm(){

        const form =
            getElement(
                "qualityCheckForm"
            );

        if(!form) return;


        form.reset();


        setDefaultDateTime();


        const stage =
            getElement(
                "qcStage"
            );

        if(stage){

            stage.value =
                "f2";

        }


        const decision =
            getElement(
                "qcDecision"
            );

        if(decision){

            decision.value =
                "pass";

        }


        const operator =
            getElement(
                "qcOperator"
            );

        if(operator){

            operator.value =
                "Arif";

        }

    }


    /* =====================================================
       BIND EVENTS
    ===================================================== */

    function bindEvents(){


        /* ================================================
           OPEN
        ================================================= */

        const addButton =
            getElement(
                "addQualityCheck"
            );


        if(addButton){

            addButton.addEventListener(
                "click",
                function(){

                    resetQualityCheckForm();

                    setDefaultFromBatch();

                    openQualityCheck();

                }
            );

        }


        /* ================================================
           CLOSE BUTTON
        ================================================= */

        const closeButton =
            getElement(
                "closeQualityCheck"
            );


        if(closeButton){

            closeButton.addEventListener(
                "click",
                closeQualityCheck
            );

        }


        /* ================================================
           CANCEL
        ================================================= */

        const cancelButton =
            getElement(
                "cancelQualityCheck"
            );


        if(cancelButton){

            cancelButton.addEventListener(
                "click",
                closeQualityCheck
            );

        }


        /* ================================================
           BACKDROP
        ================================================= */

        const modal =
            getElement(
                "qualityCheckModal"
            );


        if(modal){

            modal.addEventListener(
                "click",
                function(event){

                    if(
                        event.target.closest(
                            "[data-close-quality-check]"
                        )
                    ){

                        closeQualityCheck();

                    }

                }
            );

        }


        /* ================================================
           FORM SUBMIT
        ================================================= */

        const form =
            getElement(
                "qualityCheckForm"
            );


        if(form){

            form.addEventListener(
                "submit",
                saveQualityCheck
            );

        }


        /* ================================================
           ESCAPE
        ================================================= */

        document.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key !== "Escape"
                ){

                    return;

                }


                const modal =
                    getElement(
                        "qualityCheckModal"
                    );


                if(
                    modal &&
                    !modal.hidden
                ){

                    closeQualityCheck();

                }

            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function init(){

        bindEvents();


        if(window.lucide){

            lucide.createIcons();

        }


        console.log(
            "MERAMU: Batch Quality Check Loaded"
        );

    }


    /* =====================================================
       GLOBAL
    ===================================================== */

    window.openQualityCheck =
        openQualityCheck;


    window.closeQualityCheck =
        closeQualityCheck;


    window.saveQualityCheck =
        saveQualityCheck;


    /* =====================================================
       START
    ===================================================== */

    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }else{

        init();

    }

})();
