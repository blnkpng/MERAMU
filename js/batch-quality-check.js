/* =========================================================
   MERAMU BATCH QUALITY CHECK
   QC + EXTENSION
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const DEFAULT_BATCH_CODE = "KB-022";


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
            DEFAULT_BATCH_CODE
        );

    }


    /* =====================================================
       WAIT FOR SUPABASE
    ===================================================== */

    function waitForSupabase(
        maxAttempts = 100
    ){

        return new Promise(
            resolve => {

                let attempts = 0;

                const timer =
                    setInterval(
                        () => {

                            attempts++;

                            if(
                                window.supabaseClient
                            ){

                                clearInterval(timer);

                                resolve(
                                    window.supabaseClient
                                );

                                return;

                            }

                            if(
                                attempts >= maxAttempts
                            ){

                                clearInterval(timer);

                                resolve(null);

                            }

                        },
                        100
                    );

            }
        );

    }


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    function getElement(id){

        return document.getElementById(id);

    }


    /* =====================================================
       DATE TIME DEFAULT
    ===================================================== */

    function setDefaultDateTime(){

        const input =
            getElement("qcCheckedAt");

        if(!input){

            return;

        }

        const now =
            new Date();

        const offset =
            now.getTimezoneOffset();

        const local =
            new Date(
                now.getTime() -
                offset * 60000
            );

        input.value =
            local
                .toISOString()
                .slice(0,16);

    }


    /* =====================================================
       DEFAULT FORM
    ===================================================== */

    function setDefaultFormValues(){

        const stage =
            getElement("qcStage");

        const decision =
            getElement("qcDecision");

        const operator =
            getElement("qcOperator");

        const extensionSection =
            getElement(
                "qcExtensionSection"
            );

        const extensionDays =
            getElement(
                "qcExtensionDays"
            );

        const nextTarget =
            getElement(
                "qcNextTargetDate"
            );


        if(stage){

            /* -----------------------------------------
               DEFAULT QC STAGE = CURRENT BATCH STAGE
               Jangan selalu default ke F2.
               Jika batch masih F1, QC harus dibuka sebagai F1
               agar tombol transisi F1 → F2 dapat bekerja.
            ----------------------------------------- */

            const batchId =
                new URLSearchParams(
                    window.location.search
                ).get("id");

            const currentBatch =
                typeof batchDetailData !== "undefined" &&
                batchId
                    ? batchDetailData[batchId]
                    : null;

            const currentStage =
                String(
                    currentBatch?.stage ||
                    currentBatch?.current_stage ||
                    ""
                ).toLowerCase();

            if(currentStage.includes("f1")){

                stage.value = "f1";

            }else if(currentStage.includes("f2")){

                stage.value = "f2";

            }else if(currentStage.includes("harvest")){

                stage.value = "harvest";

            }else{

                stage.value = "production";

            }

        }

        if(decision){

            decision.value =
                "passed";

        }

        if(operator){

            operator.value =
                "Arif";

        }

        if(extensionSection){

            extensionSection.hidden =
                true;

        }

        if(extensionDays){

            extensionDays.value =
                "";

        }

        if(nextTarget){

            nextTarget.value =
                "";

        }

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openQualityCheck(){

        const modal =
            getElement(
                "qualityCheckModal"
            );

        if(!modal){

            console.warn(
                "MERAMU: qualityCheckModal tidak ditemukan."
            );

            return;

        }

        modal.hidden = false;

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        setDefaultDateTime();

        setDefaultFormValues();

        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeQualityCheck(){

        const modal =
            getElement(
                "qualityCheckModal"
            );

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
       SHOW / HIDE EXTENSION
    ===================================================== */

    function updateExtensionVisibility(){

        const decision =
            getElement(
                "qcDecision"
            );

        const section =
            getElement(
                "qcExtensionSection"
            );

        const extensionDays =
            getElement(
                "qcExtensionDays"
            );

        const nextTarget =
            getElement(
                "qcNextTargetDate"
            );


        if(
            !decision ||
            !section
        ){

            return;

        }


        const isNotReady =
            decision.value ===
            "not_ready";


        section.hidden =
            !isNotReady;


        if(
            extensionDays
        ){

            extensionDays.required =
                isNotReady;

            if(!isNotReady){

                extensionDays.value =
                    "";

            }

        }


        if(
            nextTarget
        ){

            nextTarget.required =
                false;

            if(!isNotReady){

                nextTarget.value =
                    "";

            }

        }

    }


    /* =====================================================
       DATE ADD DAYS
    ===================================================== */

    function addDaysToDate(
        dateString,
        days
    ){

        if(
            !dateString ||
            !Number.isFinite(days)
        ){

            return "";

        }

        const date =
            new Date(
                `${dateString}T00:00:00`
            );

        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return "";

        }

        date.setDate(
            date.getDate() + days
        );

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2,"0"),
            String(
                date.getDate()
            ).padStart(2,"0")
        ].join("-");

    }


    /* =====================================================
       GET CURRENT BATCH
    ===================================================== */

    async function getCurrentBatch(
        supabase,
        batchCode
    ){

        const {
            data,
            error
        } = await supabase
            .from("batches")
            .select(`
                id,
                batch_code,
                original_target_date,
                target_date,
                status
            `)
            .eq(
                "batch_code",
                batchCode
            )
            .maybeSingle();


        if(error){

            console.error(
                "MERAMU: Gagal mengambil batch.",
                error
            );

            throw error;

        }


        if(!data){

            throw new Error(
                `Batch ${batchCode} tidak ditemukan.`
            );

        }


        return data;

    }


    /* =====================================================
       OPTIONAL NUMBER
    ===================================================== */

    function getOptionalNumber(id){

        const element =
            getElement(id);

        if(!element){

            return null;

        }

        const value =
            element.value.trim();

        if(value === ""){

            return null;

        }

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : null;

    }


    /* =====================================================
       SAVE QUALITY CHECK
    ===================================================== */

    async function saveQualityCheck(
        event
    ){

        if(event){

            event.preventDefault();

        }


        const form =
            getElement(
                "qualityCheckForm"
            );

        const saveButton =
            getElement(
                "saveQualityCheck"
            );

        const batchCode =
            getBatchCode();


        const supabase =
            await waitForSupabase();


        if(!supabase){

            alert(
                "Supabase belum siap."
            );

            return;

        }


        /* -----------------------------------------
           FORM VALUES
        ----------------------------------------- */

        const decision =
            getElement(
                "qcDecision"
            )?.value || "";


        const stage =
            getElement(
                "qcStage"
            )?.value || "";


        const checkedAt =
            getElement(
                "qcCheckedAt"
            )?.value || "";


        const extensionDays =
            getOptionalNumber(
                "qcExtensionDays"
            );


        /* -----------------------------------------
           VALIDATION
        ----------------------------------------- */

        if(!decision){

            alert(
                "Pilih keputusan QC terlebih dahulu."
            );

            return;

        }


        if(!checkedAt){

            alert(
                "Tanggal dan waktu QC wajib diisi."
            );

            return;

        }


        if(
            decision === "not_ready" &&
            (
                extensionDays === null ||
                extensionDays <= 0
            )
        ){

            alert(
                "Untuk NOT READY, isi tambahan hari lebih dari 0."
            );

            return;

        }


        if(
            decision !== "not_ready" &&
            extensionDays !== null
        ){

            console.warn(
                "MERAMU: Extension diabaikan karena keputusan bukan NOT READY."
            );

        }


        /* -----------------------------------------
           BUTTON STATE
        ----------------------------------------- */

        if(saveButton){

            saveButton.disabled =
                true;

            saveButton.dataset.originalText =
                saveButton.innerHTML;

            saveButton.innerHTML =
                "Menyimpan...";

        }


        try{

            /* -------------------------------------
               GET BATCH
            ------------------------------------- */

            const batch =
                await getCurrentBatch(
                    supabase,
                    batchCode
                );


            /* -------------------------------------
               CALCULATE NEXT TARGET
            ------------------------------------- */

            let nextTargetDate =
                null;


            if(
                decision === "not_ready"
            ){

                nextTargetDate =
                    addDaysToDate(
                        batch.target_date,
                        extensionDays
                    );


                if(!nextTargetDate){

                    throw new Error(
                        "Target date batch tidak valid."
                    );

                }


                const nextTargetInput =
                    getElement(
                        "qcNextTargetDate"
                    );


                if(nextTargetInput){

                    nextTargetInput.value =
                        nextTargetDate;

                }

            }


            /* -------------------------------------
               CHECKED AT
            ------------------------------------- */

            const checkedAtIso =
                new Date(
                    checkedAt
                ).toISOString();


            /* -------------------------------------
               QC PAYLOAD
            ------------------------------------- */

            const payload = {

                batch_id:
                    batch.id,

                checked_at:
                    checkedAtIso,

                stage:
                    stage,

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
                    )?.value.trim() || null,

                taste:
                    getElement(
                        "qcTaste"
                    )?.value.trim() || null,

                color:
                    getElement(
                        "qcColor"
                    )?.value.trim() || null,

                carbonation:
                    getElement(
                        "qcCarbonation"
                    )?.value.trim() || null,

                scoby_condition:
                    getElement(
                        "qcScoby"
                    )?.value.trim() || null,

                decision:
                    decision,

                reason:
                    getElement(
                        "qcReason"
                    )?.value.trim() || null,

                extension_days:
                    decision === "not_ready"
                        ? extensionDays
                        : null,

                next_target_date:
                    decision === "not_ready"
                        ? nextTargetDate
                        : null,

                operator_name:
                    getElement(
                        "qcOperator"
                    )?.value.trim() || null,

                notes:
                    getElement(
                        "qcNotes"
                    )?.value.trim() || null

            };


            /* -------------------------------------
               INSERT QC
            ------------------------------------- */

            const {
                data: qualityCheck,
                error: qualityError
            } = await supabase
                .from(
                    "quality_checks"
                )
                .insert(
                    payload
                )
                .select()
                .single();


            if(qualityError){

                throw qualityError;

            }


            /* -------------------------------------
               EXTEND BATCH
            ------------------------------------- */

            if(
                decision === "not_ready"
            ){

                const {
                    data: extendedBatch,
                    error: extensionError
                } = await supabase
                    .rpc(
                        "extend_meramu_batch",
                        {
                            p_batch_id:
                                batch.id,

                            p_extension_days:
                                extensionDays
                        }
                    );


                if(extensionError){

                    console.error(
                        "MERAMU: QC tersimpan tetapi extension gagal.",
                        extensionError
                    );

                    throw new Error(
                        `QC berhasil disimpan, tetapi target batch gagal diperpanjang: ${extensionError.message}`
                    );

                }


                console.log(
                    "MERAMU: Batch berhasil diperpanjang.",
                    extendedBatch
                );

            }


            /* -------------------------------------
               EVENT
            ------------------------------------- */

            document.dispatchEvent(
                new CustomEvent(
                    "meramu:quality-check-saved",
                    {
                        detail: {
                            batchCode:
                                batchCode,

                            qualityCheck:
                                qualityCheck,

                            decision:
                                decision,

                            extensionDays:
                                extensionDays,

                            nextTargetDate:
                                nextTargetDate
                        }
                    }
                )
            );


            /* -------------------------------------
               REALTIME REFRESH
            ------------------------------------- */

            if(
                window.MERAMURealtime &&
                typeof
                window.MERAMURealtime.refresh ===
                "function"
            ){

                window.MERAMURealtime.refresh();

            }


            /* -------------------------------------
               RESET
            ------------------------------------- */

            if(form){

                form.reset();

            }


            setDefaultDateTime();

            setDefaultFormValues();


            /* -------------------------------------
               CLOSE
            ------------------------------------- */

            closeQualityCheck();


            /* -------------------------------------
               SUCCESS
            ------------------------------------- */

            if(
                decision === "not_ready"
            ){

                alert(
                    `QC ${batchCode} berhasil disimpan.\n\n` +
                    `Extension: +${extensionDays} hari\n` +
                    `Target berikutnya: ${nextTargetDate}`
                );

            }else{

                alert(
                    `QC ${batchCode} berhasil disimpan.`
                );

            }


            console.log(
                "MERAMU: QC berhasil disimpan.",
                qualityCheck
            );

        }
        catch(error){

            console.error(
                "MERAMU: QC gagal disimpan.",
                error
            );


            alert(
                `QC gagal disimpan.\n\n${error.message || error}`
            );

        }
        finally{

            if(saveButton){

                saveButton.disabled =
                    false;

                if(
                    saveButton.dataset.originalText
                ){

                    saveButton.innerHTML =
                        saveButton.dataset.originalText;

                }

            }

            if(window.lucide){

                lucide.createIcons();

            }

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const addButton =
                event.target.closest(
                    "#addQualityCheck"
                );

            if(addButton){

                event.preventDefault();

                openQualityCheck();

                return;

            }


            const closeButton =
                event.target.closest(
                    "#closeQualityCheck"
                );

            if(closeButton){

                event.preventDefault();

                closeQualityCheck();

                return;

            }


            const cancelButton =
                event.target.closest(
                    "#cancelQualityCheck"
                );

            if(cancelButton){

                event.preventDefault();

                closeQualityCheck();

                return;

            }


            const backdrop =
                event.target.closest(
                    "[data-close-quality-check]"
                );

            if(backdrop){

                closeQualityCheck();

            }

        }
    );


    /* =====================================================
       DECISION CHANGE
    ===================================================== */

    document.addEventListener(
        "change",
        event => {

            if(
                event.target.id !==
                "qcDecision"
            ){

                return;

            }

            updateExtensionVisibility();

        }
    );


    /* =====================================================
       EXTENSION CHANGE
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            if(
                event.target.id !==
                "qcExtensionDays"
            ){

                return;

            }


            const decision =
                getElement(
                    "qcDecision"
                )?.value;


            if(
                decision !==
                "not_ready"
            ){

                return;

            }


            const days =
                Number(
                    event.target.value
                );


            if(
                !Number.isFinite(days) ||
                days <= 0
            ){

                const nextTarget =
                    getElement(
                        "qcNextTargetDate"
                    );

                if(nextTarget){

                    nextTarget.value =
                        "";

                }

                return;

            }


            /*
               Ambil target aktif batch
               untuk preview tanggal.
            */

            waitForSupabase()
                .then(
                    async supabase => {

                        if(!supabase){

                            return;

                        }

                        try{

                            const batch =
                                await getCurrentBatch(
                                    supabase,
                                    getBatchCode()
                                );


                            const nextDate =
                                addDaysToDate(
                                    batch.target_date,
                                    days
                                );


                            const nextTarget =
                                getElement(
                                    "qcNextTargetDate"
                                );


                            if(nextTarget){

                                nextTarget.value =
                                    nextDate;

                            }

                        }
                        catch(error){

                            console.error(
                                "MERAMU: Gagal menghitung target extension.",
                                error
                            );

                        }

                    }
                );

        }
    );


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    document.addEventListener(
        "submit",
        event => {

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
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key !==
                "Escape"
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


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            updateExtensionVisibility();

        }
    );


    /* =====================================================
       EXPORT
    ===================================================== */

    window.openQualityCheck =
        openQualityCheck;

    window.closeQualityCheck =
        closeQualityCheck;

    window.saveQualityCheck =
        saveQualityCheck;

    window.updateExtensionVisibility =
        updateExtensionVisibility;


})();
