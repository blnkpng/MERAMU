/* =========================================================
   MERAMU QUALITY CHECK
   Supabase Insert
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
            "KB-022"
        );

    }


    /* =====================================================
       GET MODAL
    ===================================================== */

    function getModal(){

        return document.getElementById(
            "qualityCheckModal"
        );

    }


    /* =====================================================
       WAIT SUPABASE
    ===================================================== */

    async function waitForSupabase(){

        for(let i = 0; i < 50; i++){

            if(window.supabaseClient){

                return window.supabaseClient;

            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );

        }

        throw new Error(
            "Supabase client belum siap."
        );

    }


    /* =====================================================
       NORMALIZE STAGE
    ===================================================== */

    function normalizeStage(stage){

        const value =
            String(stage || "")
                .trim()
                .toLowerCase();


        if(
            value.includes("f2")
        ){

            return "f2";

        }


        if(
            value.includes("f1")
        ){

            return "f1";

        }


        if(
            value.includes("harvest") ||
            value.includes("panen")
        ){

            return "harvest";

        }


        if(
            value.includes("bottling")
        ){

            return "bottling";

        }


        if(
            value.includes("production") ||
            value.includes("produksi")
        ){

            return "production";

        }


        return "f2";

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openQualityCheck(){

        const modal =
            getModal();


        if(!modal){

            console.warn(
                "MERAMU: Quality Check modal tidak ditemukan."
            );

            return;

        }


        /* ---------------------------------------------
           DEFAULT DATE / TIME
        --------------------------------------------- */

        const now =
            new Date();


        const localDateTime =
            new Date(
                now.getTime()
                -
                now.getTimezoneOffset() * 60000
            )
            .toISOString()
            .slice(0,16);


        const checkedAt =
            document.getElementById(
                "qcCheckedAt"
            );


        if(checkedAt){

            checkedAt.value =
                localDateTime;

        }


        /* ---------------------------------------------
           GET CURRENT BATCH
        --------------------------------------------- */

        let batch = null;


        if(
            typeof window.getCurrentBatch ===
            "function"
        ){

            batch =
                window.getCurrentBatch();

        }


        /* ---------------------------------------------
           STAGE
        --------------------------------------------- */

        const stageInput =
            document.getElementById(
                "qcStage"
            );


        if(
            stageInput &&
            batch?.stage
        ){

            stageInput.value =
                normalizeStage(
                    batch.stage
                );

        }


        /* ---------------------------------------------
           VOLUME
        --------------------------------------------- */

        const volumeInput =
            document.getElementById(
                "qcVolume"
            );


        if(
            volumeInput &&
            batch?.volume
        ){

            const match =
                String(batch.volume)
                    .replace(",",".")
                    .match(
                        /[\d.]+/
                    );


            if(match){

                volumeInput.value =
                    match[0];

            }

        }


        /* ---------------------------------------------
           OPERATOR DEFAULT
        --------------------------------------------- */

        const operatorInput =
            document.getElementById(
                "qcOperator"
            );


        if(
            operatorInput &&
            !operatorInput.value
        ){

            operatorInput.value =
                "Arif";

        }


        modal.hidden = false;

        modal.setAttribute(
            "aria-hidden",
            "false"
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
            getModal();


        if(!modal){

            return;

        }


        modal.hidden = true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetQualityCheckForm(){

        const form =
            document.getElementById(
                "qualityCheckForm"
            );


        if(form){

            form.reset();

        }

    }


    /* =====================================================
       SAVE QUALITY CHECK
    ===================================================== */

    async function saveQualityCheck(event){

        event.preventDefault();


        const form =
            document.getElementById(
                "qualityCheckForm"
            );


        if(
            !form ||
            !form.checkValidity()
        ){

            form?.reportValidity();

            return;

        }


        const saveButton =
            document.getElementById(
                "saveQualityCheck"
            );


        if(saveButton){

            saveButton.disabled = true;


            saveButton.innerHTML =
                `
                    <i data-lucide="loader-circle"></i>
                    Menyimpan...
                `;


            if(window.lucide){

                lucide.createIcons();

            }

        }


        try{

            /* -----------------------------------------
               SUPABASE
            ----------------------------------------- */

            const supabase =
                await waitForSupabase();


            /* -----------------------------------------
               BATCH CODE
            ----------------------------------------- */

            const batchCode =
                getBatchCode();


            console.log(
                "MERAMU: Mencari batch untuk QC:",
                batchCode
            );


            /* -----------------------------------------
               FIND BATCH UUID
            ----------------------------------------- */

            const {
                data: batch,
                error: batchError
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


            if(batchError){

                throw batchError;

            }


            if(!batch){

                throw new Error(
                    `Batch ${batchCode} tidak ditemukan.`
                );

            }


            console.log(
                "MERAMU: Batch UUID untuk QC:",
                batch.id
            );


            /* -----------------------------------------
               FORM VALUES
            ----------------------------------------- */

            const checkedAt =
                document.getElementById(
                    "qcCheckedAt"
                )?.value || "";


            const stage =
                document.getElementById(
                    "qcStage"
                )?.value || "f2";


            const ph =
                document.getElementById(
                    "qcPh"
                )?.value;


            const brix =
                document.getElementById(
                    "qcBrix"
                )?.value;


            const temperature =
                document.getElementById(
                    "qcTemperature"
                )?.value;


            const volume =
                document.getElementById(
                    "qcVolume"
                )?.value;


            const aroma =
                document.getElementById(
                    "qcAroma"
                )?.value
                    .trim() || null;


            const taste =
                document.getElementById(
                    "qcTaste"
                )?.value
                    .trim() || null;


            const color =
                document.getElementById(
                    "qcColor"
                )?.value
                    .trim() || null;


            const carbonation =
                document.getElementById(
                    "qcCarbonation"
                )?.value
                    .trim() || null;


            const scobyCondition =
                document.getElementById(
                    "qcScoby"
                )?.value
                    .trim() || null;


            const decision =
                document.getElementById(
                    "qcDecision"
                )?.value || "";


            const reason =
                document.getElementById(
                    "qcReason"
                )?.value
                    .trim() || null;


            const extensionDaysValue =
                document.getElementById(
                    "qcExtensionDays"
                )?.value;


            const nextTargetDate =
                document.getElementById(
                    "qcNextTargetDate"
                )?.value || null;


            const operator =
                document.getElementById(
                    "qcOperator"
                )?.value
                    .trim() || null;


            const notes =
                document.getElementById(
                    "qcNotes"
                )?.value
                    .trim() || null;


            /* -----------------------------------------
               PAYLOAD
            ----------------------------------------- */

            const payload = {

                id:
                    crypto.randomUUID(),

                batch_id:
                    batch.id,

                checked_at:
                    new Date(
                        checkedAt
                    ).toISOString(),

                stage:
                    stage,

                ph:
                    ph === ""
                        ? null
                        : Number(ph),

                brix:
                    brix === ""
                        ? null
                        : Number(brix),

                temperature_c:
                    temperature === ""
                        ? null
                        : Number(temperature),

                volume:
                    volume === ""
                        ? null
                        : Number(volume),

                aroma:
                    aroma,

                taste:
                    taste,

                color:
                    color,

                carbonation:
                    carbonation,

                scoby_condition:
                    scobyCondition,

                decision:
                    decision,

                reason:
                    reason,

                extension_days:
                    extensionDaysValue === ""
                        ? null
                        : Number(
                            extensionDaysValue
                        ),

                next_target_date:
                    nextTargetDate,

                operator_name:
                    operator,

                notes:
                    notes,

                created_at:
                    new Date().toISOString()

            };


            console.log(
                "MERAMU: QUALITY CHECK PAYLOAD:",
                payload
            );


            /* -----------------------------------------
               INSERT
            ----------------------------------------- */

            const {
                data,
                error
            } =
                await supabase
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
                "✅ MERAMU: Quality Check berhasil disimpan.",
                data
            );


            /* -----------------------------------------
               CLOSE + RESET
            ----------------------------------------- */

            closeQualityCheck();

            resetQualityCheckForm();


            alert(
                `QC ${batchCode} berhasil disimpan.`
            );


        }catch(error){

            console.error(
                "MERAMU: Gagal menyimpan Quality Check.",
                error
            );


            alert(
                "QC gagal disimpan.\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );


        }finally{

            if(saveButton){

                saveButton.disabled = false;


                saveButton.innerHTML =
                    `
                        <i data-lucide="save"></i>
                        Simpan QC
                    `;


                if(window.lucide){

                    lucide.createIcons();

                }

            }

        }

    }


    /* =====================================================
       CLICK EVENTS
    ===================================================== */

    document.addEventListener(
        "click",
        function(event){

            /* -----------------------------------------
               OPEN
            ----------------------------------------- */

            if(
                event.target.closest(
                    "#addQualityCheck"
                )
            ){

                event.preventDefault();

                openQualityCheck();

                return;

            }


            /* -----------------------------------------
               CLOSE BUTTON
            ----------------------------------------- */

            if(
                event.target.closest(
                    "#closeQualityCheck"
                )
            ){

                event.preventDefault();

                closeQualityCheck();

                return;

            }


            /* -----------------------------------------
               CANCEL
            ----------------------------------------- */

            if(
                event.target.closest(
                    "#cancelQualityCheck"
                )
            ){

                event.preventDefault();

                closeQualityCheck();

                return;

            }


            /* -----------------------------------------
               BACKDROP
            ----------------------------------------- */

            if(
                event.target.closest(
                    "[data-close-quality-check]"
                )
            ){

                closeQualityCheck();

            }

        }
    );


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    document.addEventListener(
        "submit",
        function(event){

            if(
                event.target.id !==
                "qualityCheckForm"
            ){

                return;

            }


            saveQualityCheck(
                event
            );

        }
    );


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        function(event){

            if(
                event.key !==
                "Escape"
            ){

                return;

            }


            const modal =
                getModal();


            if(
                modal &&
                !modal.hidden
            ){

                closeQualityCheck();

            }

        }
    );


    /* =====================================================
       GLOBAL
    ===================================================== */

    window.openQualityCheck =
        openQualityCheck;


    window.closeQualityCheck =
        closeQualityCheck;


    window.saveQualityCheck =
        saveQualityCheck;


    console.log(
        "✅ MERAMU Quality Check Loaded"
    );

})();
