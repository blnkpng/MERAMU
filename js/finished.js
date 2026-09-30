(function () {

    "use strict";


    /* =====================================================
       MERAMU FINISHED PRODUCTS
       Finished Batch + Individual Units + QR + Thermal Label
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

    function formatNumber(value, decimals = 2) {

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


        /*
         * Normalisasi agar bagian UI tetap
         * bisa menggunakan:
         *
         * batch.products.name
         * batch.products.code
         * batch.products.category
         */

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


        el.style.display =
            "block";


        el.innerHTML = `

            <div class="finished-batch-top">

                <div>

                    <h2 class="finished-batch-name">

                        ${escapeHtml(
                            productName
                        )}

                    </h2>


                    <div class="finished-batch-code">

                        ${escapeHtml(
                            selectedBatch.finished_code
                        )}

                    </div>

                </div>


                <div class="finished-status">

                    <span class="finished-status-dot"></span>

                    ${escapeHtml(
                        selectedBatch.status ||
                        "finished"
                    )}

                </div>

            </div>


            <div class="finished-batch-grid">

                <div class="finished-stat">

                    <span>
                        Bottles
                    </span>

                    <strong>
                        ${formatNumber(
                            selectedBatch.quantity_bottles,
                            0
                        )}
                    </strong>

                </div>


                <div class="finished-stat">

                    <span>
                        Bottle Size
                    </span>

                    <strong>
                        ${formatNumber(
                            selectedBatch.bottle_size_ml,
                            0
                        )}
                        ML
                    </strong>

                </div>


                <div class="finished-stat">

                    <span>
                        Production
                    </span>

                    <strong>
                        ${formatDate(
                            selectedBatch.production_date
                        )}
                    </strong>

                </div>


                <div class="finished-stat">

                    <span>
                        Best Before
                    </span>

                    <strong>
                        ${formatDate(
                            selectedBatch.best_before_date
                        )}
                    </strong>

                </div>

            </div>

        `;

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
                                            unit.status ||
                                            "available"
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
       THERMAL LABEL
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


        const labels =
            items
                .map(
                    unit => {

                        return `

                            <div
                                class="thermal-label"
                            >

                                <div
                                    class="thermal-brand"
                                >
                                    MERAMU
                                </div>


                                <div
                                    class="thermal-product"
                                >
                                    ${escapeHtml(
                                        product
                                    )}
                                </div>


                                <div
                                    class="thermal-size"
                                >
                                    ${formatNumber(
                                        bottleSize,
                                        0
                                    )}
                                    ML
                                </div>


                                <div
                                    class="thermal-best-before"
                                >
                                    BB:
                                    ${escapeHtml(
                                        bestBefore
                                    )}
                                </div>


                                <div
                                    class="thermal-qr"
                                    data-thermal-qr="${escapeHtml(
                                        unit.trace_code
                                    )}"
                                ></div>


                                <div
                                    class="thermal-code"
                                >
                                    ${escapeHtml(
                                        unit.trace_code
                                    )}
                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=500,height=700"
            );


        if (!printWindow) {

            showToast(
                "Popup diblokir browser. Izinkan popup untuk print."
            );

            return;

        }


        printWindow.document.open();


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <meta
                    charset="UTF-8"
                >

                <title>
                    MERAMU Thermal Label
                </title>


                <style>

                    *{
                        box-sizing:border-box;
                    }


                    @page{
                        size:80mm auto;
                        margin:0;
                    }


                    html,
                    body{
                        margin:0;
                        padding:0;
                    }


                    body{
                        width:80mm;

                        font-family:
                            Arial,
                            sans-serif;

                        background:#FFFFFF;
                    }


                    .thermal-label{
                        width:80mm;

                        min-height:55mm;

                        padding:4mm;

                        text-align:center;

                        page-break-after:always;
                    }


                    .thermal-label:last-child{
                        page-break-after:auto;
                    }


                    .thermal-brand{
                        font-size:16px;

                        font-weight:700;

                        letter-spacing:1px;

                        margin-bottom:2mm;
                    }


                    .thermal-product{
                        font-size:12px;

                        font-weight:700;

                        line-height:1.3;

                        text-transform:uppercase;
                    }


                    .thermal-size{
                        margin-top:1mm;

                        font-size:10px;

                        font-weight:600;
                    }


                    .thermal-best-before{
                        margin-top:2mm;

                        font-size:9px;
                    }


                    .thermal-qr{
                        display:flex;

                        align-items:center;

                        justify-content:center;

                        margin:3mm auto 2mm;

                        width:30mm;

                        height:30mm;
                    }


                    .thermal-qr img,
                    .thermal-qr canvas{
                        width:30mm !important;

                        height:30mm !important;
                    }


                    .thermal-code{
                        font-size:8px;

                        font-weight:600;

                        word-break:break-all;
                    }

                </style>

            </head>


            <body>

                ${labels}

            </body>

            </html>

        `);


        printWindow.document.close();


        setTimeout(
            function () {

                if (
                    typeof QRCode === "undefined"
                ) {

                    printWindow.close();

                    showToast(
                        "Library QR belum tersedia."
                    );

                    return;

                }


                items.forEach(
                    unit => {

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
                            TRACE_BASE_URL +
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


                setTimeout(
                    function () {

                        printWindow.focus();

                        printWindow.print();

                    },
                    600
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

            <div class="finished-empty">

                <i data-lucide="package-open"></i>

                <strong>
                    Belum ada Finished Batch
                </strong>

                <span>
                    Belum ada produk jadi yang
                    dapat dibuatkan QR.
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

            <div class="finished-empty">

                <i data-lucide="triangle-alert"></i>

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

                    position: "fixed",

                    right: "20px",

                    bottom: "20px",

                    zIndex: "99999",

                    padding: "11px 15px",

                    borderRadius: "12px",

                    background: "#17352A",

                    color: "#FFFFFF",

                    fontFamily:
                        "Poppins,sans-serif",

                    fontSize: "11px",

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
            function (event) {

                const copyButton =
                    event.target.closest(
                        "[data-copy-trace]"
                    );


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
