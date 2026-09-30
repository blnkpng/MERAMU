/* =========================================================
   MERAMU ACTUAL HARVEST
   Harvest Ready → Actual Harvest
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
       SUPABASE
    ===================================================== */

    async function waitForSupabase(){

        for(
            let attempt = 0;
            attempt < 50;
            attempt++
        ){

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


    /* =====================================================
       FORMAT DATETIME LOCAL
    ===================================================== */

    function getLocalDateTimeValue(){

        const now =
            new Date();

        const offset =
            now.getTimezoneOffset();

        const local =
            new Date(
                now.getTime() -
                offset * 60000
            );

        return local
            .toISOString()
            .slice(0,16);

    }


    /* =====================================================
       FORMAT VOLUME
    ===================================================== */

    function formatVolume(value){

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
            !Number.isFinite(number)
        ){

            return "—";

        }

        return Number.isInteger(number)
            ? String(number)
            : number.toFixed(1);

    }


    /* =====================================================
       GET BATCH
    ===================================================== */

    async function getBatch(){

        const supabase =
            await waitForSupabase();

        const batchCode =
            getBatchCode();

        const {
            data,
            error
        } = await supabase
            .from("batches")
            .select(`
                id,
                batch_code,
                current_stage,
                status,
                target_date,
                harvest_ready_at,
                actual_harvest_at,
                harvest_volume,
                harvest_operator,
                harvest_notes,
                planned_volume,
                actual_volume
            `)
            .eq(
                "batch_code",
                batchCode
            )
            .maybeSingle();

        if(error){

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
       INJECT BUTTON
    ===================================================== */

    function injectHarvestButton(batch){

        const actions =
            document.querySelector(
                ".batch-header-actions"
            );

        if(!actions){

            console.warn(
                "MERAMU Harvest: Header actions tidak ditemukan."
            );

            return;

        }


        let button =
            document.getElementById(
                "completeHarvest"
            );


        /*
           Sudah selesai panen
        */

        if(
            batch.actual_harvest_at
        ){

            if(button){

                button.remove();

            }

            return;

        }


        /*
           Hanya tampil ketika
           current_stage = harvest
        */

        const stage =
            String(
                batch.current_stage || ""
            )
            .toLowerCase()
            .trim();


        if(stage !== "harvest"){

            if(button){

                button.remove();

            }

            return;

        }


        if(button){

            return;

        }


        button =
            document.createElement(
                "button"
            );

        button.id =
            "completeHarvest";

        button.type =
            "button";

        button.className =
            "page-btn primary";

        button.innerHTML = `
            <i data-lucide="leaf"></i>
            <span>Selesaikan Panen</span>
        `;


        /*
           Letakkan sebelum Edit Batch
        */

        const editButton =
            document.getElementById(
                "editBatch"
            );

        if(editButton){

            actions.insertBefore(
                button,
                editButton
            );

        }
        else{

            actions.appendChild(
                button
            );

        }


        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function createModal(){

        if(
            document.getElementById(
                "actualHarvestModal"
            )
        ){

            return;

        }


        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "actualHarvestModal";

         modal.className =
             "fermentation-log-modal";

        modal.innerHTML = `

         <div
             class="fermentation-log-modal-backdrop"
             data-close-harvest
         ></div>
         
         
         <div
             class="fermentation-log-modal-dialog"
             role="dialog"
             aria-modal="true"
             aria-labelledby="actualHarvestModalTitle"
         >

                <div class="fermentation-log-modal-header">

                    <div>

                        <span class="section-eyebrow">
                            ACTUAL HARVEST
                        </span>

                        <h3 id="actualHarvestModalTitle">
                         Selesaikan Panen
                        </h3>

                        <p>
                            Simpan hasil panen aktual
                            untuk batch ini.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="batch-modal-close"
                        data-close-harvest
                        aria-label="Tutup"
                    >
                        <i data-lucide="x"></i>
                    </button>

                </div>


                <form
                    id="actualHarvestForm"
                    class="batch-modal-form"
                >

                    <div class="form-grid">

                        <div class="form-field">

                            <label
                                for="harvestActualAt"
                            >
                                Tanggal & Waktu Panen
                            </label>

                            <input
                                id="harvestActualAt"
                                type="datetime-local"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label
                                for="harvestVolume"
                            >
                                Volume Panen
                            </label>

                            <input
                                id="harvestVolume"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Contoh: 17.5"
                                required
                            >

                            <small>
                                Satuan: Liter (L)
                            </small>

                        </div>


                        <div class="form-field">

                            <label
                                for="harvestOperator"
                            >
                                Operator
                            </label>

                            <input
                                id="harvestOperator"
                                type="text"
                                placeholder="Nama operator"
                            >

                        </div>


                        <div class="form-field">

                            <label>
                                Target Panen
                            </label>

                            <div
                                id="harvestTargetInfo"
                                class="harvest-info-box"
                            >
                                —
                            </div>

                        </div>


                        <div
                            class="form-field form-field-full"
                        >

                            <label
                                for="harvestNotes"
                            >
                                Catatan Panen
                            </label>

                            <textarea
                                id="harvestNotes"
                                rows="4"
                                placeholder="Contoh: Panen normal, aroma baik, warna sesuai standar."
                            ></textarea>

                        </div>

                    </div>


                    <div
                        id="harvestSummary"
                        class="harvest-summary"
                    ></div>


                    <div class="fermentation-log-form-actions">

                        <button
                            type="button"
                            class="page-btn secondary"
                            data-close-harvest
                        >
                            Batal
                        </button>


                        <button
                            id="saveActualHarvest"
                            type="submit"
                            class="page-btn primary"
                        >

                            <i data-lucide="check-circle"></i>

                            Simpan Actual Harvest

                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        if(window.lucide){

            lucide.createIcons();

        }


        bindModalEvents();

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    async function openHarvestModal(){

        try{

            const batch =
                await getBatch();


            const stage =
                String(
                    batch.current_stage || ""
                )
                .toLowerCase()
                .trim();


            if(stage !== "harvest"){

                alert(
                    `Batch ${batch.batch_code} belum berada di stage Harvest.`
                );

                return;

            }


            if(batch.actual_harvest_at){

                alert(
                    `Batch ${batch.batch_code} sudah memiliki Actual Harvest.`
                );

                return;

            }


            createModal();


            const modal =
                document.getElementById(
                    "actualHarvestModal"
                );

            const dateInput =
                document.getElementById(
                    "harvestActualAt"
                );

            const volumeInput =
                document.getElementById(
                    "harvestVolume"
                );

            const operatorInput =
                document.getElementById(
                    "harvestOperator"
                );

            const notesInput =
                document.getElementById(
                    "harvestNotes"
                );

            const targetInfo =
                document.getElementById(
                    "harvestTargetInfo"
                );

            const summary =
                document.getElementById(
                    "harvestSummary"
                );


            dateInput.value =
                getLocalDateTimeValue();


            volumeInput.value =
                batch.actual_volume ||
                batch.planned_volume ||
                "";


            operatorInput.value =
                batch.harvest_operator ||
                "";


            notesInput.value =
                batch.harvest_notes ||
                "";


            targetInfo.textContent =
                batch.target_date
                    ? new Intl.DateTimeFormat(
                        "id-ID",
                        {
                            day:"2-digit",
                            month:"short",
                            year:"numeric"
                        }
                    ).format(
                        new Date(
                            batch.target_date +
                            "T00:00:00"
                        )
                    )
                    : "—";


            summary.innerHTML = `

                <div>
                    <span>Batch</span>
                    <strong>
                        ${batch.batch_code}
                    </strong>
                </div>

                <div>
                    <span>Planned</span>
                    <strong>
                        ${formatVolume(
                            batch.planned_volume
                        )} L
                    </strong>
                </div>

                <div>
                    <span>Ready</span>
                    <strong>
                        ${
                            batch.harvest_ready_at
                                ? "YES"
                                : "—"
                        }
                    </strong>
                </div>

            `;


            modal.classList.add(
                "show"
            );


            setTimeout(
                () =>
                    volumeInput.focus(),
                50
            );


        }
        catch(error){

            console.error(
                "MERAMU Harvest:",
                error
            );

            alert(
                error?.message ||
                "Gagal membuka Actual Harvest."
            );

        }

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeHarvestModal(){

        const modal =
            document.getElementById(
                "actualHarvestModal"
            );

        if(modal){

            modal.classList.remove(
                "show"
            );

        }

    }


    /* =====================================================
       SAVE HARVEST
    ===================================================== */

    async function saveActualHarvest(
        event
    ){

        event.preventDefault();


        const saveButton =
            document.getElementById(
                "saveActualHarvest"
            );


        const originalText =
            saveButton.innerHTML;


        const volume =
            Number(
                document.getElementById(
                    "harvestVolume"
                )?.value
            );


        if(
            !Number.isFinite(volume) ||
            volume <= 0
        ){

            alert(
                "Volume panen harus lebih dari 0 L."
            );

            return;

        }


        const actualAt =
            document.getElementById(
                "harvestActualAt"
            )?.value;


        if(!actualAt){

            alert(
                "Tanggal & waktu panen wajib diisi."
            );

            return;

        }


        try{

            saveButton.disabled =
                true;

            saveButton.innerHTML =
                "Menyimpan...";


            const supabase =
                await waitForSupabase();


            const batch =
                await getBatch();


            const actualAtIso =
                new Date(
                    actualAt
                ).toISOString();


            const {
                data,
                error
            } = await supabase.rpc(
                "complete_meramu_harvest",
                {

                    p_batch_id:
                        batch.id,

                    p_actual_harvest_at:
                        actualAtIso,

                    p_harvest_volume:
                        volume,

                    p_harvest_operator:
                        document.getElementById(
                            "harvestOperator"
                        )?.value?.trim() ||
                        null,

                    p_harvest_notes:
                        document.getElementById(
                            "harvestNotes"
                        )?.value?.trim() ||
                        null

                }
            );


            if(error){

                throw error;

            }


            console.log(
                "MERAMU: Actual Harvest berhasil.",
                data
            );


            closeHarvestModal();


            /*
               Refresh Batch Detail
            */

            if(
                typeof window.initBatchSupabase ===
                "function"
            ){

                await window.initBatchSupabase();

            }


            /*
               Refresh timeline
            */

            if(
                typeof window.loadBatchTimeline ===
                "function"
            ){

                await window.loadBatchTimeline();

            }


            if(
                typeof window.renderBatchDetail ===
                "function"
            ){

                window.renderBatchDetail();

            }


            /*
               Realtime
            */

            document.dispatchEvent(
                new CustomEvent(
                    "meramu:actual-harvest-complete",
                    {
                        detail:{
                            batchCode:
                                batch.batch_code,
                            batch:
                                data
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
                `Actual Harvest ${batch.batch_code} berhasil disimpan.`
            );


            /*
               Reload satu kali agar
               seluruh komponen memakai
               data terbaru.
            */

            window.location.reload();


        }
        catch(error){

            console.error(
                "MERAMU: Actual Harvest gagal.",
                error
            );


            alert(
                "Actual Harvest gagal disimpan.\n\n" +
                (
                    error?.message ||
                    "Unknown error"
                )
            );


        }
        finally{

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                originalText;

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindModalEvents(){

        document.addEventListener(
            "click",
            function(event){

                const completeButton =
                    event.target.closest(
                        "#completeHarvest"
                    );

                if(completeButton){

                    event.preventDefault();

                    openHarvestModal();

                    return;

                }


                const closeButton =
                    event.target.closest(
                        "[data-close-harvest]"
                    );

                if(closeButton){

                    event.preventDefault();

                    closeHarvestModal();

                }

            }
        );


        document.addEventListener(
            "submit",
            function(event){

                if(
                    event.target?.id ===
                    "actualHarvestForm"
                ){

                    saveActualHarvest(
                        event
                    );

                }

            }
        );


        document.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key === "Escape"
                ){

                    closeHarvestModal();

                }

            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    async function init(){

        try{

            createModal();

            const batch =
                await getBatch();

            injectHarvestButton(
                batch
            );

            console.log(
                "✅ MERAMU Actual Harvest Controller Loaded",
                batch.batch_code
            );

        }
        catch(error){

            console.error(
                "MERAMU Harvest init:",
                error
            );

        }

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    window.openHarvestModal =
        openHarvestModal;

    window.closeHarvestModal =
        closeHarvestModal;

    window.saveActualHarvest =
        saveActualHarvest;

    window.initActualHarvest =
        init;


    /*
       Jalankan setelah DOM siap.
    */

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
