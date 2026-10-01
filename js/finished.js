(function () {

    "use strict";


    /* =====================================================
       MERAMU FINISHED PRODUCTS
       QR + THERMAL LABEL 58MM
       ===================================================== */


    /* =====================================================
       CONFIG
    ===================================================== */

    const TRACE_BASE_URL =
        window.location.origin +
        "/pages/trace.html?code=";


    let finishedBatches = [];

    let selectedBatch = null;

    let finishedUnits = [];


    /* =====================================================
       DOM HELPER
    ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(
        value,
        decimals = 2
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";

        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return "—";

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimals
            }
        ).format(number);

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(value) {

        if (!value) {

            return "—";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);

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
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* =====================================================
       CREATE ICONS
    ===================================================== */

    function createIcons() {

        if (window.lucide) {

            lucide.createIcons();

        }

    }


    /* =====================================================
       SUPABASE CLIENT
    ===================================================== */

    function getSupabaseClient() {

        const supabase =
            window.supabaseClient;


        if (!supabase) {

            throw new Error(
                "Supabase client belum tersedia."
            );

        }


        return supabase;

    }


    /* =====================================================
       LOAD FINISHED BATCHES
       VIA RPC
    ===================================================== */

    async function loadFinishedBatches() {

        const supabase =
            getSupabaseClient();


        console.log(
            "MERAMU: mengambil finished batches..."
        );


        const {
            data,
            error
        } = await supabase.rpc(
            "get_meramu_finished_batches"
        );


        if (error) {

            console.error(
                "MERAMU Finished Batch RPC Error:",
                error
            );

            throw new Error(
                error.message ||
                "Gagal mengambil finished batch."
            );

        }


        finishedBatches =
            Array.isArray(data)
                ? data
                : [];


        finishedBatches =
            finishedBatches.map(
                batch => ({

                    ...batch,

                    products: {

                        id:
                            batch.product_id,

                        code:
                            batch.product_code,

                        name:
                            batch.product_name,

                        category:
                            batch.product_category

                    }

                })
            );


        console.log(
            `MERAMU: ${finishedBatches.length} finished batch ditemukan.`
        );


        renderBatchOptions();


        if (
            finishedBatches.length === 0
        ) {

            selectedBatch = null;

            finishedUnits = [];

            renderEmpty();

            return;

        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const requestedBatch =
            params.get("batch");


        const requested =
            finishedBatches.find(
                batch =>
                    batch.id === requestedBatch ||
                    batch.finished_code === requestedBatch
            );


        const batch =
            requested ||
            finishedBatches[0];


        const select =
            $("finishedBatchSelect");


        if (select) {

            select.value =
                batch.id;

        }


        await selectFinishedBatch(
            batch.id
        );

    }


    /* =====================================================
       RENDER BATCH OPTIONS
    ===================================================== */

    function renderBatchOptions() {

        const select =
            $("finishedBatchSelect");


        if (!select) {

            return;

        }


        if (
            finishedBatches.length === 0
        ) {

            select.innerHTML = `
                <option value="">
                    Belum ada finished batch
                </option>
            `;

            return;

        }


        select.innerHTML =
            finishedBatches
                .map(
                    batch => {

                        const productName =
                            batch.product_name ||
                            batch.products?.name ||
                            "Product";


                        return `
                            <option
                                value="${escapeHtml(
                                    batch.id
                                )}"
                            >
                                ${escapeHtml(
                                    batch.finished_code
                                )}
                                —
                                ${escapeHtml(
                                    productName
                                )}
                            </option>
                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       SELECT FINISHED BATCH
    ===================================================== */

    async function selectFinishedBatch(
        batchId
    ) {

        if (!batchId) {

            return;

        }


        selectedBatch =
            finishedBatches.find(
                batch =>
                    batch.id === batchId
            );


        if (!selectedBatch) {

            console.warn(
                "MERAMU: finished batch tidak ditemukan:",
                batchId
            );

            return;

        }


        console.log(
            "MERAMU: selected finished batch:",
            selectedBatch.finished_code
        );


        renderBatchInfo();


        await loadFinishedUnits(
            selectedBatch.id
        );

    }


    /* =====================================================
       LOAD FINISHED UNITS
       VIA RPC
    ===================================================== */

    async function loadFinishedUnits(
        finishedBatchId
    ) {

        const supabase =
            getSupabaseClient();


        console.log(
            "MERAMU: mengambil finished units:",
            finishedBatchId
        );


        const {
            data,
            error
        } = await supabase.rpc(
            "get_meramu_finished_units",
            {
                p_finished_batch_id:
                    finishedBatchId
            }
        );


        if (error) {

            console.error(
                "MERAMU Finished Units RPC Error:",
                error
            );


            renderUnitsError(
                error.message ||
                "Gagal mengambil finished unit."
            );


            return;

        }


        finishedUnits =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            `MERAMU: ${finishedUnits.length} finished units ditemukan.`
        );


        renderUnits();

    }

    /* =====================================================
   UPDATE FINISHED BATCH STATUS
===================================================== */

async function updateFinishedStatus(
    newStatus,
    reason = null
) {

    if (!selectedBatch) {

        showToast(
            "Finished Batch belum dipilih."
        );

        return;

    }


    const supabase =
        getSupabaseClient();


    const statusLabel =
        String(newStatus || "")
            .toUpperCase();


    try {

        const {
            data,
            error
        } = await supabase.rpc(
            "update_meramu_finished_status",
            {
                p_finished_batch_id:
                    selectedBatch.id,

                p_new_status:
                    newStatus,

                p_reason:
                    reason
            }
        );


        if (error) {

            console.error(
                "MERAMU Finished Status RPC Error:",
                error
            );

            throw new Error(
                error.message ||
                "Gagal mengubah status Finished Batch."
            );

        }


        /*
         * RPC mengembalikan row
         * finished_batches terbaru.
         */

        const updatedBatch =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!updatedBatch) {

            throw new Error(
                "Status berhasil diproses, tetapi data batch terbaru tidak diterima."
            );

        }


        /*
         * Update data lokal
         */

        const index =
            finishedBatches.findIndex(
                batch =>
                    batch.id ===
                    selectedBatch.id
            );


        if (index !== -1) {

            finishedBatches[index] = {

                ...finishedBatches[index],

                ...updatedBatch

            };

        }


        selectedBatch = {

            ...selectedBatch,

            ...updatedBatch

        };


        /*
         * Update dropdown
         */

        const select =
            $("finishedBatchSelect");


        if (select) {

            select.value =
                selectedBatch.id;

        }


        /*
         * Render ulang kartu batch
         */

        renderBatchInfo();


        /*
         * Jangan reload QR/unit.
         * Data unit tidak berubah hanya
         * karena status finished batch berubah.
         */

        showToast(
            `Status batch menjadi ${statusLabel}.`
        );


        console.log(
            "MERAMU: Finished Batch status updated:",
            selectedBatch.finished_code,
            selectedBatch.status
        );


    } catch (error) {

        console.error(
            "MERAMU update finished status error:",
            error
        );


        showToast(
            error.message ||
            "Gagal mengubah status batch."
        );

    }

}
    /* =====================================================
   UPDATE FINISHED UNIT STATUS
===================================================== */

async function updateFinishedUnitStatus(
    unitId,
    newStatus,
    reason = null
) {

    if (!unitId) {

        showToast(
            "Finished unit tidak ditemukan."
        );

        return;

    }


    const status =
        String(newStatus || "")
            .toLowerCase()
            .trim();


    const allowedStatuses = [
        "done",
        "damaged",
        "expired"
    ];


    if (!allowedStatuses.includes(status)) {

        showToast(
            "Status bottle tidak valid."
        );

        return;

    }


    const unit =
        finishedUnits.find(
            item =>
                String(item.id) ===
                String(unitId)
        );


    if (!unit) {

        showToast(
            "Finished unit tidak ditemukan."
        );

        return;

    }


    const currentStatus =
        String(
            unit.status || ""
        )
            .toLowerCase()
            .trim();


    /*
     * Hanya bottle AVAILABLE
     * yang boleh diubah.
     */

    if (
        currentStatus !==
        "available"
    ) {

        showToast(
            `Bottle ${unit.trace_code} sudah ${currentStatus.toUpperCase()} dan terkunci.`
        );

        return;

    }


    const supabase =
        getSupabaseClient();


    try {

        console.log(
            "MERAMU: mengubah status bottle:",
            {
                unitId,
                traceCode: unit.trace_code,
                from: currentStatus,
                to: status,
                reason
            }
        );


        const {
            data,
            error
        } = await supabase.rpc(
            "update_meramu_finished_unit_status",
            {
                p_finished_unit_id:
                    unitId,

                p_new_status:
                    status,

                p_reason:
                    reason
            }
        );


        if (error) {

            console.error(
                "MERAMU Finished Unit Status RPC Error:",
                error
            );


            throw new Error(
                error.message ||
                "Gagal mengubah status bottle."
            );

        }


        /*
         * RPC mengembalikan
         * row finished_units terbaru.
         */

        const updatedUnit =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!updatedUnit) {

            throw new Error(
                "Status berhasil diproses, tetapi data bottle terbaru tidak diterima."
            );

        }


        /*
         * Update data lokal.
         */

        const index =
            finishedUnits.findIndex(
                item =>
                    String(item.id) ===
                    String(unitId)
            );


        if (index !== -1) {

            finishedUnits[index] = {

                ...finishedUnits[index],

                ...updatedUnit

            };

        }


        /*
         * Render ulang kartu bottle.
         *
         * Setelah status menjadi:
         * DONE / DAMAGED / EXPIRED
         *
         * tombol status akan hilang
         * dan berubah menjadi
         * "Status terkunci".
         */

        renderUnits();


        showToast(
            `Bottle #${unit.unit_number} menjadi ${status.toUpperCase()}.`
        );


        console.log(
            "MERAMU: Finished Unit status updated:",
            updatedUnit.trace_code,
            updatedUnit.status
        );


    } catch (error) {

        console.error(
            "MERAMU update finished unit status error:",
            error
        );


        showToast(
            error.message ||
            "Gagal mengubah status bottle."
        );

    }

}

/* =====================================================
   RENDER BATCH INFO
===================================================== */

function renderBatchInfo() {

    const el =
        $("finishedBatchInfo");


    if (
        !el ||
        !selectedBatch
    ) {

        return;

    }


    const product =
        selectedBatch.products ||
        {};


    const productName =
        selectedBatch.product_name ||
        product.name ||
        "Finished Product";


    const status =
        String(
            selectedBatch.status ||
            "finished"
        ).toLowerCase();


    const statusLabel =
        status.toUpperCase();


    const quantity =
        formatNumber(
            selectedBatch.quantity_bottles,
            0
        );


    const bottleSize =
        formatNumber(
            selectedBatch.bottle_size_ml,
            0
        );


    const outputVolume =
        formatNumber(
            selectedBatch.output_volume,
            2
        );


    const wasteVolume =
        formatNumber(
            selectedBatch.waste_volume,
            2
        );


    const productionDate =
        formatDate(
            selectedBatch.production_date
        );


    const bestBeforeDate =
        formatDate(
            selectedBatch.best_before_date
        );


    const expiryDate =
        formatDate(
            selectedBatch.expiry_date
        );


    const operatorName =
        selectedBatch.operator_name ||
        "—";


    /*
     * STATUS ACTIONS
     */

    let statusActions = "";


    if (status === "finished") {

        statusActions = `

            <div
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-top:16px;
                    padding-top:14px;
                    border-top:1px solid rgba(4,103,56,.10);
                "
            >

                <button
                    type="button"
                    class="finished-status-action"
                    data-status-action="released"
                    style="
                        border:0;
                        border-radius:11px;
                        padding:9px 14px;
                        background:#046738;
                        color:#FFFFFF;
                        font-family:Poppins,sans-serif;
                        font-size:11px;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    <i
                        data-lucide="badge-check"
                        style="
                            width:14px;
                            height:14px;
                            vertical-align:-2px;
                            margin-right:5px;
                        "
                    ></i>

                    Release
                </button>


                <button
                    type="button"
                    class="finished-status-action"
                    data-status-action="hold"
                    style="
                        border:1px solid #E5B94E;
                        border-radius:11px;
                        padding:9px 14px;
                        background:#FFF9E8;
                        color:#8A6500;
                        font-family:Poppins,sans-serif;
                        font-size:11px;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    <i
                        data-lucide="pause-circle"
                        style="
                            width:14px;
                            height:14px;
                            vertical-align:-2px;
                            margin-right:5px;
                        "
                    ></i>

                    Hold
                </button>


                <button
                    type="button"
                    class="finished-status-action"
                    data-status-action="cancelled"
                    style="
                        border:1px solid #E5B7B7;
                        border-radius:11px;
                        padding:9px 14px;
                        background:#FFF5F5;
                        color:#A33A3A;
                        font-family:Poppins,sans-serif;
                        font-size:11px;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    <i
                        data-lucide="x-circle"
                        style="
                            width:14px;
                            height:14px;
                            vertical-align:-2px;
                            margin-right:5px;
                        "
                    ></i>

                    Cancel
                </button>

            </div>

        `;

    }


    else if (status === "hold") {

        statusActions = `

            <div
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-top:16px;
                    padding-top:14px;
                    border-top:1px solid rgba(4,103,56,.10);
                "
            >

                <button
                    type="button"
                    class="finished-status-action"
                    data-status-action="released"
                    style="
                        border:0;
                        border-radius:11px;
                        padding:9px 14px;
                        background:#046738;
                        color:#FFFFFF;
                        font-family:Poppins,sans-serif;
                        font-size:11px;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    <i
                        data-lucide="badge-check"
                        style="
                            width:14px;
                            height:14px;
                            vertical-align:-2px;
                            margin-right:5px;
                        "
                    ></i>

                    Release
                </button>


                <button
                    type="button"
                    class="finished-status-action"
                    data-status-action="cancelled"
                    style="
                        border:1px solid #E5B7B7;
                        border-radius:11px;
                        padding:9px 14px;
                        background:#FFF5F5;
                        color:#A33A3A;
                        font-family:Poppins,sans-serif;
                        font-size:11px;
                        font-weight:600;
                        cursor:pointer;
                    "
                >
                    <i
                        data-lucide="x-circle"
                        style="
                            width:14px;
                            height:14px;
                            vertical-align:-2px;
                            margin-right:5px;
                        "
                    ></i>

                    Cancel
                </button>

            </div>

        `;

    }


    else if (
        status === "released"
    ) {

        statusActions = `

            <div
                style="
                    margin-top:16px;
                    padding-top:14px;
                    border-top:1px solid rgba(4,103,56,.10);
                    font-family:Poppins,sans-serif;
                    font-size:11px;
                    color:#668078;
                "
            >

                <i
                    data-lucide="lock-keyhole"
                    style="
                        width:14px;
                        height:14px;
                        vertical-align:-3px;
                        margin-right:5px;
                    "
                ></i>

                Batch sudah released dan
                dikunci untuk perubahan status.

            </div>

        `;

    }


    else if (
        status === "cancelled"
    ) {

        statusActions = `

            <div
                style="
                    margin-top:16px;
                    padding-top:14px;
                    border-top:1px solid rgba(163,58,58,.10);
                    font-family:Poppins,sans-serif;
                    font-size:11px;
                    color:#9A5C5C;
                "
            >

                <i
                    data-lucide="ban"
                    style="
                        width:14px;
                        height:14px;
                        vertical-align:-3px;
                        margin-right:5px;
                    "
                ></i>

                Batch sudah cancelled dan
                dikunci untuk perubahan status.

            </div>

        `;

    }


    el.style.display =
        "block";


    el.innerHTML = `

        <!-- =================================================
             BATCH HEADER
        ================================================== -->

        <div class="finished-batch-top">

            <div>

                <h2 class="finished-batch-name">

                    ${escapeHtml(
                        productName
                    )}

                </h2>


                <div class="finished-batch-code">

                    ${escapeHtml(
                        selectedBatch.finished_code ||
                        "—"
                    )}

                </div>

            </div>


            <div class="finished-status">

                <span
                    class="finished-status-dot"
                ></span>

                ${escapeHtml(
                    statusLabel
                )}

            </div>

        </div>


        <!-- =================================================
             PRIMARY STATS
        ================================================== -->

        <div class="finished-batch-grid">

            <div class="finished-stat">

                <span>
                    Quantity
                </span>

                <strong>

                    ${quantity}

                    <small
                        style="
                            font-size:10px;
                            font-weight:500;
                            margin-left:3px;
                        "
                    >
                        BOTOL
                    </small>

                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Bottle Size
                </span>

                <strong>

                    ${bottleSize}

                    <small
                        style="
                            font-size:10px;
                            font-weight:500;
                            margin-left:3px;
                        "
                    >
                        ML
                    </small>

                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Output
                </span>

                <strong>

                    ${outputVolume}

                    <small
                        style="
                            font-size:10px;
                            font-weight:500;
                            margin-left:3px;
                        "
                    >
                        L
                    </small>

                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Waste
                </span>

                <strong>

                    ${wasteVolume}

                    <small
                        style="
                            font-size:10px;
                            font-weight:500;
                            margin-left:3px;
                        "
                    >
                        L
                    </small>

                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Production
                </span>

                <strong>
                    ${escapeHtml(
                        productionDate
                    )}
                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Best Before
                </span>

                <strong>
                    ${escapeHtml(
                        bestBeforeDate
                    )}
                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Expiry
                </span>

                <strong>
                    ${escapeHtml(
                        expiryDate
                    )}
                </strong>

            </div>


            <div class="finished-stat">

                <span>
                    Operator
                </span>

                <strong>
                    ${escapeHtml(
                        operatorName
                    )}
                </strong>

            </div>

        </div>


        <!-- =================================================
             STATUS ACTIONS
        ================================================== -->

        ${statusActions}

    `;


    /*
     * Render Lucide icons
     */

    createIcons();

}

    /* =====================================================
       RENDER UNITS
    ===================================================== */

function renderUnits() {

    const container =
        $("finishedUnits");


    const count =
        $("finishedUnitCount");


    if (!container) {

        return;

    }


    if (count) {

        count.textContent =
            `${finishedUnits.length} bottle${
                finishedUnits.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (
        finishedUnits.length === 0
    ) {

        container.innerHTML = `

            <div class="finished-empty">

                <i data-lucide="package-open"></i>

                <strong>
                    Belum ada individual bottle
                </strong>

                <span>
                    Finished batch belum memiliki
                    finished unit.
                </span>

            </div>

        `;


        createIcons();

        return;

    }


    container.innerHTML =
        finishedUnits
            .map(
                unit => {

                    const status =
                        String(
                            unit.status ||
                            "available"
                        )
                            .toLowerCase()
                            .trim();


                    const isAvailable =
                        status === "available";


                    const isLocked =
                        [
                            "done",
                            "damaged",
                            "expired"
                        ].includes(status);


                    const statusLabel =
                        status === "available"
                            ? "Available"
                            : status === "done"
                                ? "Done"
                                : status === "damaged"
                                    ? "Damaged"
                                    : status === "expired"
                                        ? "Expired"
                                        : status;


                    return `

                        <article
                            class="finished-unit"
                        >

                            <div
                                class="finished-unit-top"
                            >

                                <span
                                    class="finished-unit-number"
                                >

                                    Bottle #${formatNumber(
                                        unit.unit_number,
                                        0
                                    )}

                                </span>


                                <span
                                    class="finished-unit-status"
                                >

                                    ${escapeHtml(
                                        statusLabel
                                    )}

                                </span>

                            </div>


                            <div
                                class="finished-qr"
                                id="qr-${escapeHtml(
                                    unit.id
                                )}"
                            >
                            </div>


                            <div
                                class="finished-trace-code"
                            >

                                ${escapeHtml(
                                    unit.trace_code
                                )}

                            </div>


                            <div
                                class="finished-unit-actions"
                            >

                                <button
                                    class="finished-unit-btn"
                                    type="button"
                                    data-copy-trace="${escapeHtml(
                                        unit.trace_code
                                    )}"
                                >

                                    <i
                                        data-lucide="copy"
                                    ></i>

                                    Copy

                                </button>


                                <button
                                    class="finished-unit-btn primary"
                                    type="button"
                                    data-print-unit="${escapeHtml(
                                        unit.id
                                    )}"
                                >

                                    <i
                                        data-lucide="printer"
                                    ></i>

                                    Print

                                </button>

                            </div>


                            ${
                                isAvailable
                                    ? `

                                        <div
                                            class="finished-unit-status-actions"
                                            style="
                                                display:grid;
                                                grid-template-columns:repeat(3,1fr);
                                                gap:6px;
                                                margin-top:8px;
                                            "
                                        >

                                            <button
                                                class="finished-unit-btn"
                                                type="button"
                                                data-unit-status="done"
                                                data-unit-id="${escapeHtml(
                                                    unit.id
                                                )}"
                                                style="
                                                    font-size:10px;
                                                    padding:8px 6px;
                                                "
                                            >

                                                <i
                                                    data-lucide="check"
                                                ></i>

                                                DONE

                                            </button>


                                            <button
                                                class="finished-unit-btn"
                                                type="button"
                                                data-unit-status="damaged"
                                                data-unit-id="${escapeHtml(
                                                    unit.id
                                                )}"
                                                style="
                                                    font-size:10px;
                                                    padding:8px 6px;
                                                "
                                            >

                                                <i
                                                    data-lucide="triangle-alert"
                                                ></i>

                                                DAMAGED

                                            </button>


                                            <button
                                                class="finished-unit-btn"
                                                type="button"
                                                data-unit-status="expired"
                                                data-unit-id="${escapeHtml(
                                                    unit.id
                                                )}"
                                                style="
                                                    font-size:10px;
                                                    padding:8px 6px;
                                                "
                                            >

                                                <i
                                                    data-lucide="calendar-x"
                                                ></i>

                                                EXPIRED

                                            </button>

                                        </div>

                                    `
                                    : isLocked
                                        ? `

                                            <div
                                                style="
                                                    display:flex;
                                                    align-items:center;
                                                    justify-content:center;
                                                    gap:5px;
                                                    margin-top:8px;
                                                    padding:7px 8px;
                                                    border-radius:10px;
                                                    background:#F6F8F6;
                                                    color:#6B7B72;
                                                    font-size:10px;
                                                    font-weight:500;
                                                "
                                            >

                                                <i
                                                    data-lucide="lock"
                                                    style="
                                                        width:13px;
                                                        height:13px;
                                                    "
                                                ></i>

                                                Status terkunci

                                            </div>

                                        `
                                        : ""

                            }

                        </article>

                    `;

                }
            )
            .join("");


    createIcons();


    generateAllQr();

}
    /* =====================================================
       GENERATE ALL QR
    ===================================================== */

    function generateAllQr() {

        if (
            typeof QRCode === "undefined"
        ) {

            console.error(
                "MERAMU: QRCode library belum tersedia."
            );


            showToast(
                "Library QR belum tersedia."
            );


            return;

        }


        finishedUnits.forEach(
            unit => {

                generateQr(
                    unit
                );

            }
        );

    }


    /* =====================================================
       GENERATE SINGLE QR
    ===================================================== */

    function generateQr(
        unit
    ) {

        const container =
            document.getElementById(
                `qr-${unit.id}`
            );


        if (!container) {

            return;

        }


        if (
            !unit.trace_code
        ) {

            container.innerHTML = `
                <span
                    style="
                        font-size:10px;
                        color:#8A9991;
                    "
                >
                    Trace code tidak tersedia
                </span>
            `;

            return;

        }


        container.innerHTML =
            "";


        const url =
            TRACE_BASE_URL +
            encodeURIComponent(
                unit.trace_code
            );


        try {

            new QRCode(
                container,
                {

                    text: url,

                    width: 135,

                    height: 135,

                    correctLevel:
                        QRCode.CorrectLevel.M

                }
            );

        } catch (error) {

            console.error(
                "MERAMU QR Error:",
                error
            );

        }

    }


    /* =====================================================
       COPY TRACE CODE
    ===================================================== */

    async function copyTrace(
        traceCode
    ) {

        if (!traceCode) {

            showToast(
                "Trace code tidak tersedia."
            );

            return;

        }


        try {

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(
                    traceCode
                );

            } else {

                const textarea =
                    document.createElement(
                        "textarea"
                    );


                textarea.value =
                    traceCode;


                textarea.style.position =
                    "fixed";

                textarea.style.opacity =
                    "0";


                document.body.appendChild(
                    textarea
                );


                textarea.select();


                document.execCommand(
                    "copy"
                );


                textarea.remove();

            }


            showToast(
                "Trace code berhasil disalin."
            );


        } catch (error) {

            console.error(
                "Copy trace error:",
                error
            );


            showToast(
                "Gagal menyalin trace code."
            );

        }

    }


    /* =====================================================
       PRINT SINGLE UNIT
    ===================================================== */

    function printUnit(
        unitId
    ) {

        const unit =
            finishedUnits.find(
                item =>
                    item.id === unitId
            );


        if (!unit) {

            showToast(
                "Finished unit tidak ditemukan."
            );

            return;

        }


        printThermalLabel(
            unit
        );

    }


    /* =====================================================
       PRINT ALL UNITS
    ===================================================== */

    function printAll() {

        if (
            finishedUnits.length === 0
        ) {

            showToast(
                "Tidak ada bottle untuk dicetak."
            );

            return;

        }


        printThermalLabel(
            finishedUnits
        );

    }


    /* =====================================================
       THERMAL LABEL 58MM
       DESAIN MINIMAL SESUAI REFERENSI
    ===================================================== */

    function printThermalLabel(
        units
    ) {

        const items =
            Array.isArray(units)
                ? units
                : [units];


        if (
            items.length === 0
        ) {

            return;

        }


        const product =
            selectedBatch?.product_name ||
            selectedBatch?.products?.name ||
            "MERAMU";


        const bottleSize =
            selectedBatch?.bottle_size_ml ||
            items[0]?.bottle_size_ml ||
            250;


        const bestBefore =
            formatDate(
                selectedBatch?.best_before_date
            );


        /*
         * TRACE URL
         */

        const traceBaseUrl =
            window.location.origin +
            "/pages/trace.html?code=";


        /*
         * BRAND ASSETS
         */

        const logoIconUrl =
            window.location.origin +
            "/assets/branding/logo-icon.png";


        const logoTextUrl =
            window.location.origin +
            "/assets/branding/logo-text.png";


        /*
         * LABEL
         */

        const labels =
            items
                .map(
                    unit => {

                        const traceCode =
                            unit.trace_code ||
                            "";


                        return `

                            <div
                                class="thermal-label"
                            >

                                <!-- ==========================
                                     BRAND
                                =========================== -->

                                <div
                                    class="thermal-brand"
                                >

                                    <img
                                        class="thermal-logo-icon"
                                        src="${logoIconUrl}"
                                        alt="MERAMU"
                                    >


                                    <img
                                        class="thermal-logo-text"
                                        src="${logoTextUrl}"
                                        alt="MERAMU"
                                    >

                                </div>


                                <!-- ==========================
                                     PRODUCT
                                =========================== -->

                                <div
                                    class="thermal-product"
                                >

                                    ${escapeHtml(
                                        product
                                    )}

                                </div>


                                <!-- ==========================
                                     SIZE
                                =========================== -->

                                <div
                                    class="thermal-size-row"
                                >

                                    <div
                                        class="thermal-bottle-icon"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="M9 2h6"
                                            />

                                            <path
                                                d="M10 2v3l-1 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7l-1-2V2"
                                            />

                                            <path
                                                d="M9 9h6"
                                            />

                                        </svg>

                                    </div>


                                    <strong>

                                        ${formatNumber(
                                            bottleSize,
                                            0
                                        )}
                                        ML

                                    </strong>

                                </div>


                                <!-- ==========================
                                     BEST BEFORE
                                =========================== -->

                                <div
                                    class="thermal-best-before"
                                >

                                    <div
                                        class="thermal-calendar-icon"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="16"
                                                rx="2"
                                            />

                                            <path
                                                d="M16 3v4"
                                            />

                                            <path
                                                d="M8 3v4"
                                            />

                                            <path
                                                d="M3 10h18"
                                            />

                                            <path
                                                d="M8 14h.01"
                                            />

                                            <path
                                                d="M12 14h.01"
                                            />

                                            <path
                                                d="M16 14h.01"
                                            />

                                            <path
                                                d="M8 17h.01"
                                            />

                                            <path
                                                d="M12 17h.01"
                                            />

                                            <path
                                                d="M16 17h.01"
                                            />

                                        </svg>

                                    </div>


                                    <span>
                                        BB:
                                    </span>


                                    <strong>
                                        ${escapeHtml(
                                            bestBefore
                                        )}
                                    </strong>

                                </div>


                                <!-- ==========================
                                     QR
                                =========================== -->

                                <div
                                    class="thermal-qr"
                                    data-thermal-qr="${escapeHtml(
                                        traceCode
                                    )}"
                                ></div>


                                <!-- ==========================
                                     TRACE CODE
                                =========================== -->

                                <div
                                    class="thermal-code"
                                >

                                    ${escapeHtml(
                                        traceCode
                                    )}

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        /*
         * OPEN PRINT WINDOW
         */

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=420,height=700"
            );


        if (!printWindow) {

            showToast(
                "Popup diblokir browser. Izinkan popup untuk print."
            );

            return;

        }


        /*
         * PRINT HTML
         */

        printWindow.document.open();


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <meta
                    charset="UTF-8"
                >


                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >


                <title>
                    MERAMU Thermal 58mm
                </title>


                <style>

                    /* =================================================
                       RESET
                    ================================================== */

                    *{
                        box-sizing:border-box;
                    }


                    html,
                    body{

                        width:58mm;

                        margin:0;

                        padding:0;

                        background:#FFFFFF;

                    }


                    body{

                        font-family:

                            Arial,
                            Helvetica,
                            sans-serif;

                        color:#000000;

                    }


                    /* =================================================
                       PRINT PAGE
                    ================================================== */

                    @page{

                        size:58mm auto;

                        margin:0;

                    }


                    /* =================================================
                       LABEL
                    ================================================== */

                    .thermal-label{

                        position:relative;

                        width:58mm;

                        min-height:70mm;

                        padding:

                            3mm
                            3mm
                            3mm
                            3mm;

                        background:#FFFFFF;

                        color:#000000;

                        display:flex;

                        flex-direction:column;

                        align-items:center;

                        text-align:center;

                        overflow:hidden;

                        page-break-after:always;

                    }


                    .thermal-label:last-child{

                        page-break-after:auto;

                    }


                    /* =================================================
                       BRAND
                    ================================================== */

                    .thermal-brand{

                        width:100%;

                        display:flex;

                        flex-direction:column;

                        align-items:center;

                        justify-content:center;

                        margin-bottom:2.8mm;

                    }


                    .thermal-logo-icon{

                        display:block;

                        width:5mm;

                        height:5mm;

                        object-fit:contain;

                        margin-bottom:.5mm;

                        filter:

                            grayscale(1)
                            brightness(0);

                    }


                    .thermal-logo-text{

                        display:block;

                        width:21mm;

                        height:auto;

                        max-height:5mm;

                        object-fit:contain;

                        filter:

                            grayscale(1)
                            brightness(0);

                    }


                    /* =================================================
                       PRODUCT
                    ================================================== */

                    .thermal-product{

                        width:100%;

                        margin-bottom:3.4mm;

                        font-size:9px;

                        line-height:1.05;

                        font-weight:800;

                        letter-spacing:-.2px;

                        text-transform:uppercase;

                        color:#000000;

                    }


                    /* =================================================
                       SIZE
                    ================================================== */

                    .thermal-size-row{

                        display:flex;

                        align-items:center;

                        justify-content:center;

                        gap:2mm;

                        margin-bottom:2.5mm;

                        color:#000000;

                    }


                    .thermal-size-row strong{

                        font-size:12px;

                        line-height:1;

                        font-weight:700;

                    }


                    .thermal-bottle-icon{

                        display:flex;

                        align-items:center;

                        justify-content:center;

                    }


                    .thermal-bottle-icon svg{

                        width:5.5mm;

                        height:5.5mm;

                        fill:none;

                        stroke:#000000;

                        stroke-width:1.6;

                        stroke-linecap:round;

                        stroke-linejoin:round;

                    }


                    /* =================================================
                       BEST BEFORE
                    ================================================== */

                    .thermal-best-before{

                        display:flex;

                        align-items:center;

                        justify-content:center;

                        gap:1.7mm;

                        margin-bottom:2.8mm;

                        color:#000000;

                    }


                    .thermal-calendar-icon{

                        display:flex;

                        align-items:center;

                        justify-content:center;

                    }


                    .thermal-calendar-icon svg{

                        width:5mm;

                        height:5mm;

                        fill:none;

                        stroke:#000000;

                        stroke-width:1.6;

                        stroke-linecap:round;

                        stroke-linejoin:round;

                    }


                    .thermal-best-before span{

                        font-size:10px;

                        line-height:1;

                        font-weight:700;

                    }


                    .thermal-best-before strong{

                        font-size:10px;

                        line-height:1;

                        font-weight:500;

                    }


                    /* =================================================
                       QR
                    ================================================== */

                    .thermal-qr{

                        display:flex;

                        align-items:center;

                        justify-content:center;

                        width:30mm;

                        height:30mm;

                        margin:

                            0 auto
                            2.2mm;

                    }


                    .thermal-qr img,

                    .thermal-qr canvas{

                        display:block;

                        width:30mm !important;

                        height:30mm !important;

                        max-width:30mm !important;

                        max-height:30mm !important;

                    }


                    /* =================================================
                       TRACE CODE
                    ================================================== */

                    .thermal-code{

                        width:100%;

                        font-size:7.8px;

                        line-height:1.1;

                        font-weight:500;

                        letter-spacing:.1px;

                        color:#000000;

                        white-space:nowrap;

                        text-align:center;

                    }


                    /* =================================================
                       PRINT
                    ================================================== */

                    @media print{

                        html,
                        body{

                            width:58mm;

                            margin:0;

                            padding:0;

                        }


                        .thermal-label{

                            width:58mm;

                        }

                    }

                </style>

            </head>


            <body>

                ${labels}

            </body>

            </html>

        `);


        printWindow.document.close();


        /*
         * GENERATE QR
         */

        setTimeout(
            function () {

                if (
                    typeof QRCode ===
                    "undefined"
                ) {

                    printWindow.close();

                    showToast(
                        "Library QR belum tersedia."
                    );

                    return;

                }


                items.forEach(
                    unit => {

                        if (
                            !unit.trace_code
                        ) {

                            return;

                        }


                        const selector =
                            `[data-thermal-qr="${CSS.escape(
                                unit.trace_code
                            )}"]`;


                        const container =
                            printWindow.document
                                .querySelector(
                                    selector
                                );


                        if (!container) {

                            return;

                        }


                        const url =
                            traceBaseUrl +
                            encodeURIComponent(
                                unit.trace_code
                            );


                        new QRCode(
                            container,
                            {

                                text: url,

                                width: 113,

                                height: 113,

                                correctLevel:
                                    QRCode.CorrectLevel.M

                            }
                        );

                    }
                );


                /*
                 * PRINT
                 */

                setTimeout(
                    function () {

                        printWindow.focus();

                        printWindow.print();

                    },
                    800
                );


            },
            500
        );

    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    function renderEmpty() {

        const container =
            $("finishedUnits");


        const count =
            $("finishedUnitCount");


        const batchInfo =
            $("finishedBatchInfo");


        if (count) {

            count.textContent =
                "0 bottles";

        }


        if (batchInfo) {

            batchInfo.style.display =
                "none";

            batchInfo.innerHTML =
                "";

        }


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div
                class="finished-empty"
            >

                <i
                    data-lucide="package-open"
                ></i>


                <strong>
                    Belum ada Finished Batch
                </strong>


                <span>
                    Belum ada produk jadi
                    yang dapat dibuatkan QR.
                </span>

            </div>

        `;


        createIcons();

    }


    /* =====================================================
       ERROR STATE
    ===================================================== */

    function renderUnitsError(
        message
    ) {

        const container =
            $("finishedUnits");


        const count =
            $("finishedUnitCount");


        if (count) {

            count.textContent =
                "Error";

        }


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div
                class="finished-empty"
            >

                <i
                    data-lucide="triangle-alert"
                ></i>


                <strong>
                    Gagal mengambil finished unit
                </strong>


                <span>
                    ${escapeHtml(
                        message ||
                        "Terjadi kesalahan."
                    )}
                </span>

            </div>

        `;


        createIcons();

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message
    ) {

        let toast =
            document.getElementById(
                "meramuToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "meramuToast";


            Object.assign(
                toast.style,
                {

                    position:
                        "fixed",

                    right:
                        "20px",

                    bottom:
                        "20px",

                    zIndex:
                        "99999",

                    padding:
                        "11px 15px",

                    borderRadius:
                        "12px",

                    background:
                        "#17352A",

                    color:
                        "#FFFFFF",

                    fontFamily:
                        "Poppins,sans-serif",

                    fontSize:
                        "11px",

                    boxShadow:
                        "0 12px 30px rgba(0,0,0,.18)",

                    transition:
                        "opacity .2s ease"

                }
            );


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.style.opacity =
            "1";


        clearTimeout(
            toast._timer
        );


        toast._timer =
            setTimeout(
                function () {

                    toast.style.opacity =
                        "0";

                },
                2500
            );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        const select =
            $("finishedBatchSelect");


        if (select) {

            select.addEventListener(
                "change",
                async function (event) {

                    try {

                        await selectFinishedBatch(
                            event.target.value
                        );

                    } catch (error) {

                        console.error(
                            "Select batch error:",
                            error
                        );


                        renderUnitsError(
                            error.message
                        );

                    }

                }
            );

        }


        const refresh =
            $("refreshFinished");


        if (refresh) {

            refresh.addEventListener(
                "click",
                async function () {

                    try {

                        refresh.disabled =
                            true;


                        await loadFinishedBatches();


                        showToast(
                            "Data Produk Jadi diperbarui."
                        );


                    } catch (error) {

                        console.error(
                            "Refresh finished error:",
                            error
                        );


                        renderUnitsError(
                            error.message
                        );


                    } finally {

                        refresh.disabled =
                            false;

                    }

                }
            );

        }


        const generate =
            $("generateAllQr");


        if (generate) {

            generate.addEventListener(
                "click",
                function () {

                    generateAllQr();


                    showToast(
                        "QR semua botol berhasil dibuat."
                    );

                }
            );

        }


        const printAllButton =
            $("printAllLabels");


        if (printAllButton) {

            printAllButton.addEventListener(
                "click",
                printAll
            );

        }


       document.addEventListener(
            "click",
            async function (event) {

                const copyButton =
                    event.target.closest(
                        "[data-copy-trace]"
                    );
const statusButton =
    event.target.closest(
        "[data-status-action]"
    );


if (statusButton) {

    const newStatus =
        statusButton.dataset.statusAction;


    if (!selectedBatch) {

        showToast(
            "Finished Batch belum dipilih."
        );

        return;

    }


    const productName =
        selectedBatch.product_name ||
        selectedBatch.products?.name ||
        "Finished Product";


    const batchCode =
        selectedBatch.finished_code ||
        "Finished Batch";


    /*
     * RELEASE
     */

    if (
        newStatus ===
        "released"
    ) {

        const confirmed =
            window.confirm(
                `Release ${batchCode}?\n\n` +
                `${productName}\n\n` +
                `Setelah RELEASED, status batch ` +
                `tidak dapat diubah lagi.`
            );


        if (!confirmed) {

            return;

        }


        await updateFinishedStatus(
            "released",
            "QC selesai dan produk siap dijual"
        );


        return;

    }


    /*
     * HOLD
     */

    if (
        newStatus ===
        "hold"
    ) {

        const reason =
            window.prompt(
                `Alasan HOLD untuk ${batchCode}:`,
                "Menunggu pemeriksaan QC"
            );


        if (
            reason === null
        ) {

            return;

        }


        const cleanReason =
            reason.trim();


        if (!cleanReason) {

            showToast(
                "Alasan HOLD wajib diisi."
            );

            return;

        }


        await updateFinishedStatus(
            "hold",
            cleanReason
        );


        return;

    }


    /*
     * CANCEL
     */

    if (
        newStatus ===
        "cancelled"
    ) {

        const reason =
            window.prompt(
                `Alasan CANCEL untuk ${batchCode}:`
            );


        if (
            reason === null
        ) {

            return;

        }


        const cleanReason =
            reason.trim();


        if (!cleanReason) {

            showToast(
                "Alasan CANCEL wajib diisi."
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Cancel ${batchCode}?\n\n` +
                `Batch yang sudah CANCELLED ` +
                `tidak dapat diaktifkan kembali.`
            );


        if (!confirmed) {

            return;

        }


        await updateFinishedStatus(
            "cancelled",
            cleanReason
        );


        return;

    }

}

                if (copyButton) {

                    copyTrace(
                        copyButton.dataset.copyTrace
                    );

                    return;

                }


                const printButton =
                    event.target.closest(
                        "[data-print-unit]"
                    );


                if (printButton) {

                    printUnit(
                        printButton.dataset.printUnit
                    );

                }

            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    async function init() {

        try {

            createIcons();

            bindEvents();

            await loadFinishedBatches();

        } catch (error) {

            console.error(
                "MERAMU Finished Error:",
                error
            );


            renderUnitsError(
                error.message ||
                "Terjadi kesalahan."
            );

        }

    }


    /* =====================================================
       DOM READY
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.MERAMUFinished = {

        load:
            loadFinishedBatches,

        generateAllQr:
            generateAllQr,

        printAll:
            printAll

    };


})();
