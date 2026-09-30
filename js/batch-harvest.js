/* =========================================================
   MERAMU ACTUAL HARVEST
   Harvest Ready → Actual Harvest

   Version:
   - Responsive
   - iOS / MERAMU style
   - Reuse existing MERAMU modal system
   - Desktop 2-column form
   - Mobile 1-column form
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const MODAL_ID = "actualHarvestModal";


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
       HELPERS
    ===================================================== */

    function getElement(id){

        return document.getElementById(id);

    }


    function escapeHtml(value){

        return String(
            value ?? ""
        )
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

    }


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

        if(!Number.isFinite(number)){

            return "—";

        }

        return Number.isInteger(number)
            ? String(number)
            : number.toFixed(1);

    }


    function formatDate(dateValue){

        if(!dateValue){

            return "—";

        }

        const date =
            new Date(
                dateValue
            );

        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return "—";

        }

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day:"2-digit",
                month:"short",
                year:"numeric"
            }
        ).format(date);

    }


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
       HARVEST MODAL CSS
    ===================================================== */

    function injectHarvestStyles(){

        if(
            document.getElementById(
                "meramuActualHarvestStyles"
            )
        ){

            return;

        }


        const style =
            document.createElement(
                "style"
            );

        style.id =
            "meramuActualHarvestStyles";


        style.textContent = `

            /* =================================================
               ACTUAL HARVEST MODAL
            ================================================= */

            #${MODAL_ID}{
                z-index:9999 !important;
            }


            #${MODAL_ID}
            .fermentation-log-modal-dialog{

                width:
                    min(
                        720px,
                        calc(100vw - 32px)
                    ) !important;

                max-width:
                    720px !important;

                max-height:
                    calc(100vh - 32px);

                overflow-y:auto;

                border-radius:24px !important;

            }


            /* =================================================
               HEADER
            ================================================= */

            #${MODAL_ID}
            .fermentation-log-modal-header{

                padding:
                    24px 26px 20px !important;

            }


            #${MODAL_ID}
            .actual-harvest-heading{

                min-width:0;

            }


            #${MODAL_ID}
            .actual-harvest-heading
            .section-eyebrow{

                display:block;

                margin-bottom:6px;

                font-size:11px;

                font-weight:700;

                letter-spacing:.12em;

                color:#046738;

            }


            #${MODAL_ID}
            .actual-harvest-heading h2{

                margin:0;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:22px;

                line-height:1.3;

                font-weight:600;

                color:#18201c;

            }


            #${MODAL_ID}
            .actual-harvest-heading p{

                margin:5px 0 0;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:12px;

                line-height:1.5;

                color:#8b9690;

            }


            /* =================================================
               FORM
            ================================================= */

            #${MODAL_ID}
            .actual-harvest-form{

                padding:
                    22px 26px 0;

            }


            #${MODAL_ID}
            .actual-harvest-grid{

                display:grid;

                grid-template-columns:
                    repeat(
                        2,
                        minmax(0,1fr)
                    );

                gap:
                    18px 20px;

            }


            #${MODAL_ID}
            .actual-harvest-field{

                min-width:0;

            }


            #${MODAL_ID}
            .actual-harvest-field.full{

                grid-column:
                    1 / -1;

            }


            #${MODAL_ID}
            .actual-harvest-field label{

                display:block;

                margin-bottom:7px;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:12px;

                line-height:1.4;

                font-weight:600;

                color:#34413a;

            }


            #${MODAL_ID}
            .actual-harvest-field input,
            #${MODAL_ID}
            .actual-harvest-field textarea{

                box-sizing:border-box;

                display:block;

                width:100%;

                border:
                    1px solid #e3e9e5;

                border-radius:12px;

                background:#ffffff;

                color:#18201c;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:13px;

                outline:none;

                transition:
                    border-color .18s ease,
                    box-shadow .18s ease,
                    background .18s ease;

            }


            #${MODAL_ID}
            .actual-harvest-field input{

                height:44px;

                padding:
                    0 13px;

            }


            #${MODAL_ID}
            .actual-harvest-field textarea{

                min-height:100px;

                resize:vertical;

                padding:
                    11px 13px;

                line-height:1.55;

            }


            #${MODAL_ID}
            .actual-harvest-field input::placeholder,
            #${MODAL_ID}
            .actual-harvest-field textarea::placeholder{

                color:#aab4ae;

            }


            #${MODAL_ID}
            .actual-harvest-field input:focus,
            #${MODAL_ID}
            .actual-harvest-field textarea:focus{

                border-color:#046738;

                box-shadow:
                    0 0 0 3px
                    rgba(
                        4,
                        103,
                        56,
                        .08
                    );

            }


            #${MODAL_ID}
            .actual-harvest-field small{

                display:block;

                margin-top:6px;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:10px;

                color:#929d97;

            }


            /* =================================================
               TARGET INFO
            ================================================= */

            #${MODAL_ID}
            .harvest-target-box{

                display:flex;

                align-items:center;

                min-height:44px;

                box-sizing:border-box;

                padding:
                    0 13px;

                border:
                    1px solid #e5ebe7;

                border-radius:12px;

                background:#f8faf9;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:13px;

                font-weight:500;

                color:#425048;

            }


            /* =================================================
               SUMMARY
            ================================================= */

            #${MODAL_ID}
            .harvest-summary{

                display:grid;

                grid-template-columns:
                    repeat(
                        3,
                        minmax(0,1fr)
                    );

                gap:10px;

                margin-top:20px;

                padding:14px;

                border:
                    1px solid #e5ebe7;

                border-radius:16px;

                background:#f8faf9;

            }


            #${MODAL_ID}
            .harvest-summary-item{

                min-width:0;

            }


            #${MODAL_ID}
            .harvest-summary-item span{

                display:block;

                margin-bottom:4px;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:10px;

                font-weight:500;

                color:#929d97;

            }


            #${MODAL_ID}
            .harvest-summary-item strong{

                display:block;

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

                font-family:
                    Poppins,
                    sans-serif;

                font-size:13px;

                font-weight:600;

                color:#243129;

            }


            #${MODAL_ID}
            .harvest-ready-value{

                color:#046738 !important;

            }


            /* =================================================
               FOOTER
            ================================================= */

            #${MODAL_ID}
            .actual-harvest-actions{

                display:flex;

                align-items:center;

                justify-content:flex-end;

                gap:10px;

                margin-top:22px;

                padding:
                    16px 26px 22px;

                border-top:
                    1px solid #edf1ee;

            }


            #${MODAL_ID}
            .actual-harvest-actions
            .page-btn{

                min-height:44px;

                white-space:nowrap;

            }


            #${MODAL_ID}
            #saveActualHarvest{

                min-width:190px;

            }


            /* =================================================
               MOBILE
            ================================================= */

            @media(max-width:768px){

                #${MODAL_ID}
                .fermentation-log-modal-dialog{

                    width:
                        calc(100vw - 24px) !important;

                    max-width:
                        calc(100vw - 24px) !important;

                    max-height:
                        calc(100vh - 24px);

                    border-radius:20px !important;

                }


                #${MODAL_ID}
                .fermentation-log-modal-header{

                    padding:
                        20px 18px 16px !important;

                }


                #${MODAL_ID}
                .actual-harvest-heading h2{

                    font-size:19px;

                }


                #${MODAL_ID}
                .actual-harvest-form{

                    padding:
                        18px 18px 0;

                }


                #${MODAL_ID}
                .actual-harvest-grid{

                    grid-template-columns:
                        minmax(0,1fr);

                    gap:15px;

                }


                #${MODAL_ID}
                .actual-harvest-field.full{

                    grid-column:auto;

                }


                #${MODAL_ID}
                .harvest-summary{

                    grid-template-columns:
                        minmax(0,1fr);

                    gap:9px;

                }


                #${MODAL_ID}
                .harvest-summary-item{

                    display:flex;

                    align-items:center;

                    justify-content:space-between;

                    gap:15px;

                }


                #${MODAL_ID}
                .harvest-summary-item span{

                    margin:0;

                }


                #${MODAL_ID}
                .harvest-summary-item strong{

                    text-align:right;

                }


                #${MODAL_ID}
                .actual-harvest-actions{

                    flex-direction:column-reverse;

                    align-items:stretch;

                    padding:
                        14px 18px 18px;

                }


                #${MODAL_ID}
                .actual-harvest-actions
                .page-btn{

                    width:100%;

                }


                #${MODAL_ID}
                #saveActualHarvest{

                    min-width:0;

                }

            }

        `;


        document.head.appendChild(
            style
        );

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
       CREATE MODAL
    ===================================================== */

    function createModal(){

        injectHarvestStyles();


        if(
            document.getElementById(
                MODAL_ID
            )
        ){

            return;

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            MODAL_ID;

        modal.className =
            "fermentation-log-modal";

        modal.hidden =
            true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );


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

                <!-- =========================================
                     HEADER
                ========================================== -->

                <div
                    class="fermentation-log-modal-header"
                >

                    <div
                        class="actual-harvest-heading"
                    >

                        <span
                            class="section-eyebrow"
                        >
                            ACTUAL HARVEST
                        </span>


                        <h2
                            id="actualHarvestModalTitle"
                        >
                            Selesaikan Panen
                        </h2>


                        <p>
                            Simpan hasil panen aktual
                            untuk batch ini.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="icon-detail-btn"
                        data-close-harvest
                        aria-label="Tutup"
                    >

                        <i
                            data-lucide="x"
                        ></i>

                    </button>

                </div>


                <!-- =========================================
                     FORM
                ========================================== -->

                <form
                    id="actualHarvestForm"
                    class="actual-harvest-form"
                >

                    <div
                        class="actual-harvest-grid"
                    >

                        <!-- DATE -->

                        <div
                            class="actual-harvest-field"
                        >

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


                        <!-- VOLUME -->

                        <div
                            class="actual-harvest-field"
                        >

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


                        <!-- OPERATOR -->

                        <div
                            class="actual-harvest-field"
                        >

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


                        <!-- TARGET -->

                        <div
                            class="actual-harvest-field"
                        >

                            <label>
                                Target Panen
                            </label>


                            <div
                                id="harvestTargetInfo"
                                class="harvest-target-box"
                            >
                                —
                            </div>

                        </div>


                        <!-- NOTES -->

                        <div
                            class="actual-harvest-field full"
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


                    <!-- SUMMARY -->

                    <div
                        id="harvestSummary"
                        class="harvest-summary"
                    ></div>


                </form>


                <!-- =========================================
                     FOOTER
                ========================================== -->

                <div
                    class="actual-harvest-actions"
                >

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
                        form="actualHarvestForm"
                        class="page-btn primary"
                    >

                        <i
                            data-lucide="check-circle"
                        ></i>

                        Simpan Actual Harvest

                    </button>

                </div>

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
       SHOW MODAL
    ===================================================== */

    function showModal(){

        const modal =
            getElement(
                MODAL_ID
            );

        if(!modal){

            return;

        }


        modal.hidden =
            false;

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        /*
           Class show mengikuti
           sistem modal MERAMU.
        */

        requestAnimationFrame(
            () => {

                modal.classList.add(
                    "show"
                );

            }
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeHarvestModal(){

        const modal =
            getElement(
                MODAL_ID
            );

        if(!modal){

            return;

        }


        modal.classList.remove(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "modal-open"
        );


        setTimeout(
            () => {

                modal.hidden =
                    true;

            },
            180
        );

    }


    /* =====================================================
       INJECT HEADER BUTTON
    ===================================================== */

    function injectHarvestButton(
        batch
    ){

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
           Jika sudah dipanen,
           tombol dihilangkan.
        */

        if(
            batch.actual_harvest_at
        ){

            if(button){

                button.remove();

            }

            return;

        }


        const stage =
            String(
                batch.current_stage || ""
            )
            .toLowerCase()
            .trim();


        /*
           Tombol hanya muncul
           ketika stage = harvest.
        */

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

            <i
                data-lucide="leaf"
            ></i>

            <span>
                Selesaikan Panen
            </span>

        `;


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
                getElement(
                    MODAL_ID
                );


            const dateInput =
                getElement(
                    "harvestActualAt"
                );


            const volumeInput =
                getElement(
                    "harvestVolume"
                );


            const operatorInput =
                getElement(
                    "harvestOperator"
                );


            const notesInput =
                getElement(
                    "harvestNotes"
                );


            const targetInfo =
                getElement(
                    "harvestTargetInfo"
                );


            const summary =
                getElement(
                    "harvestSummary"
                );


            /*
               Default values
            */

            dateInput.value =
                getLocalDateTimeValue();


            volumeInput.value =
                batch.actual_volume ??
                batch.planned_volume ??
                "";


            operatorInput.value =
                batch.harvest_operator ||
                "";


            notesInput.value =
                batch.harvest_notes ||
                "";


            targetInfo.textContent =
                formatDate(
                    batch.target_date
                );


            summary.innerHTML = `

                <div
                    class="harvest-summary-item"
                >

                    <span>
                        Batch
                    </span>

                    <strong>
                        ${escapeHtml(
                            batch.batch_code
                        )}
                    </strong>

                </div>


                <div
                    class="harvest-summary-item"
                >

                    <span>
                        Planned
                    </span>

                    <strong>
                        ${formatVolume(
                            batch.planned_volume
                        )} L
                    </strong>

                </div>


                <div
                    class="harvest-summary-item"
                >

                    <span>
                        Ready
                    </span>

                    <strong
                        class="harvest-ready-value"
                    >
                        ${
                            batch.harvest_ready_at
                                ? "READY"
                                : "—"
                        }
                    </strong>

                </div>

            `;


            showModal();


            setTimeout(
                () => {

                    volumeInput.focus();

                    volumeInput.select();

                },
                120
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
       SAVE ACTUAL HARVEST
    ===================================================== */

    async function saveActualHarvest(
        event
    ){

        event.preventDefault();


        const saveButton =
            getElement(
                "saveActualHarvest"
            );


        if(!saveButton){

            return;

        }


        const originalHtml =
            saveButton.innerHTML;


        const volume =
            Number(
                getElement(
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
            getElement(
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

            saveButton.innerHTML = `

                <i
                    data-lucide="loader-circle"
                ></i>

                Menyimpan...

            `;


            if(window.lucide){

                lucide.createIcons();

            }


            const supabase =
                await waitForSupabase();


            const batch =
                await getBatch();


            const actualAtDate =
                new Date(
                    actualAt
                );


            if(
                Number.isNaN(
                    actualAtDate.getTime()
                )
            ){

                throw new Error(
                    "Tanggal & waktu panen tidak valid."
                );

            }


            const actualAtIso =
                actualAtDate.toISOString();


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
                        getElement(
                            "harvestOperator"
                        )?.value?.trim() ||
                        null,

                    p_harvest_notes:
                        getElement(
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
               Refresh batch data
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
               Custom event
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


            /*
               Realtime refresh
            */

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
               Reload supaya seluruh
               komponen memakai data terbaru.
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
                originalHtml;


            if(window.lucide){

                lucide.createIcons();

            }

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindModalEvents(){

        /*
           Hindari event listener
           terpasang dua kali.
        */

        if(
            window.MERAMUActualHarvestEventsBound
        ){

            return;

        }


        window.MERAMUActualHarvestEventsBound =
            true;


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

                    const modal =
                        getElement(
                            MODAL_ID
                        );


                    if(
                        modal &&
                        !modal.hidden
                    ){

                        closeHarvestModal();

                    }

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
                "✅ MERAMU Actual Harvest Controller Loaded:",
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

    }
    else{

        init();

    }

})();
