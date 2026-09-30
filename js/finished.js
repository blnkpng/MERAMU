(function(){

    "use strict";


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
       ELEMENTS
    ===================================================== */

    function $(id){

        return document.getElementById(id);

    }


    /* =====================================================
       FORMAT
    ===================================================== */

    function formatNumber(value){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }

        return new Intl.NumberFormat(
            "id-ID",
            {
                maximumFractionDigits:2
            }
        ).format(Number(value));

    }


    function formatDate(value){

        if(!value){

            return "—";

        }

        const date =
            new Date(value);

        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return value;

        }

        return date.toLocaleDateString(
            "id-ID",
            {
                day:"2-digit",
                month:"short",
                year:"numeric"
            }
        );

    }


    function escapeHtml(value){

        if(
            value === null ||
            value === undefined
        ){

            return "";

        }

        return String(value)
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");

    }


    /* =====================================================
       LOAD FINISHED BATCHES
    ===================================================== */

    async function loadFinishedBatches(){

        const supabase =
            window.supabaseClient;

        if(!supabase){

            throw new Error(
                "Supabase client belum tersedia."
            );

        }


        const {
            data,
            error
        } = await supabase

            .from("finished_batches")

            .select(`
                id,
                finished_code,
                allocation_id,
                product_id,
                production_date,
                quantity_bottles,
                bottle_size_ml,
                output_volume,
                waste_volume,
                expiry_date,
                best_before_date,
                hpp_total,
                hpp_per_bottle,
                status,
                operator_name,
                notes,
                products (
                    id,
                    code,
                    name,
                    category
                )
            `)

            .neq(
                "status",
                "cancelled"
            )

            .order(
                "created_at",
                {
                    ascending:false
                }
            );


        if(error){

            console.error(
                "Finished batch error:",
                error
            );

            throw error;

        }


        finishedBatches =
            data || [];


        renderBatchOptions();


        if(
            finishedBatches.length > 0
        ){

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const requestedBatch =
                params.get(
                    "batch"
                );


            const found =
                finishedBatches.find(
                    item =>
                        item.id === requestedBatch ||
                        item.finished_code === requestedBatch
                );


            const batch =
                found ||
                finishedBatches[0];


            $("finishedBatchSelect")
                .value =
                batch.id;


            await selectFinishedBatch(
                batch.id
            );

        }else{

            renderEmpty();

        }

    }


    /* =====================================================
       BATCH OPTIONS
    ===================================================== */

    function renderBatchOptions(){

        const select =
            $("finishedBatchSelect");

        if(!select){

            return;

        }


        if(
            finishedBatches.length === 0
        ){

            select.innerHTML = `
                <option value="">
                    Belum ada finished batch
                </option>
            `;

            return;

        }


        select.innerHTML =
            finishedBatches.map(
                batch => {

                    const product =
                        batch.products?.name ||
                        "Product";


                    return `
                        <option
                            value="${escapeHtml(batch.id)}"
                        >
                            ${escapeHtml(
                                batch.finished_code
                            )}
                            —
                            ${escapeHtml(product)}
                        </option>
                    `;

                }
            ).join("");

    }


    /* =====================================================
       SELECT BATCH
    ===================================================== */

    async function selectFinishedBatch(
        batchId
    ){

        selectedBatch =
            finishedBatches.find(
                item =>
                    item.id === batchId
            );


        if(!selectedBatch){

            return;

        }


        renderBatchInfo();


        await loadFinishedUnits(
            selectedBatch.id
        );

    }


    /* =====================================================
       LOAD UNITS
    ===================================================== */

    async function loadFinishedUnits(
        finishedBatchId
    ){

        const supabase =
            window.supabaseClient;


        const {
            data,
            error
        } = await supabase

            .from("finished_units")

            .select(`
                id,
                finished_batch_id,
                unit_number,
                qr_token,
                trace_code,
                bottle_size_ml,
                status,
                sold_at,
                notes
            `)

            .eq(
                "finished_batch_id",
                finishedBatchId
            )

            .order(
                "unit_number",
                {
                    ascending:true
                }
            );


        if(error){

            console.error(
                "Finished units error:",
                error
            );

            renderUnitsError(
                error.message
            );

            return;

        }


        finishedUnits =
            data || [];


        renderUnits();

    }


    /* =====================================================
       BATCH INFO
    ===================================================== */

    function renderBatchInfo(){

        const el =
            $("finishedBatchInfo");


        if(!el || !selectedBatch){

            return;

        }


        const product =
            selectedBatch.products ||
            {};


        el.style.display =
            "block";


        el.innerHTML = `

            <div class="finished-batch-top">

                <div>

                    <h2 class="finished-batch-name">

                        ${escapeHtml(
                            product.name ||
                            "Finished Product"
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
                        selectedBatch.status
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
                            selectedBatch.quantity_bottles
                        )}
                    </strong>

                </div>


                <div class="finished-stat">

                    <span>
                        Bottle Size
                    </span>

                    <strong>
                        ${formatNumber(
                            selectedBatch.bottle_size_ml
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

    function renderUnits(){

        const container =
            $("finishedUnits");

        const count =
            $("finishedUnitCount");


        if(!container){

            return;

        }


        if(count){

            count.textContent =
                `${finishedUnits.length} bottle`;

        }


        if(
            finishedUnits.length === 0
        ){

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
            finishedUnits.map(
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
                                        unit.unit_number
                                    )}

                                </span>


                                <span
                                    class="finished-unit-status"
                                >

                                    ${escapeHtml(
                                        unit.status
                                    )}

                                </span>

                            </div>


                            <div
                                class="finished-qr"
                                id="qr-${unit.id}"
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
            ).join("");


        generateAllQr();


        createIcons();

    }


    /* =====================================================
       QR
    ===================================================== */

    function generateAllQr(){

        finishedUnits.forEach(
            unit => {

                generateQr(
                    unit
                );

            }
        );

    }


    function generateQr(
        unit
    ){

        const container =
            document.getElementById(
                `qr-${unit.id}`
            );


        if(!container){

            return;

        }


        container.innerHTML =
            "";


        const url =
            TRACE_BASE_URL +
            encodeURIComponent(
                unit.trace_code
            );


        new QRCode(
            container,
            {
                text:url,

                width:135,

                height:135,

                correctLevel:
                    QRCode.CorrectLevel.M
            }
        );

    }


    /* =====================================================
       COPY TRACE
    ===================================================== */

    async function copyTrace(
        traceCode
    ){

        try{

            await navigator.clipboard.writeText(
                traceCode
            );


            showToast(
                "Trace code berhasil disalin."
            );

        }catch(error){

            console.error(error);

            showToast(
                "Gagal menyalin trace code."
            );

        }

    }


    /* =====================================================
       PRINT SINGLE LABEL
    ===================================================== */

    function printUnit(
        unitId
    ){

        const unit =
            finishedUnits.find(
                item =>
                    item.id === unitId
            );


        if(!unit){

            return;

        }


        printThermalLabel(
            unit
        );

    }


    /* =====================================================
       PRINT ALL
    ===================================================== */

    function printAll(){

        if(
            finishedUnits.length === 0
        ){

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
    ){

        const items =
            Array.isArray(units)
                ? units
                : [units];


        const product =
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


        const qrJobs =
            items.map(
                unit => {

                    const url =
                        TRACE_BASE_URL +
                        encodeURIComponent(
                            unit.trace_code
                        );


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
                                    bottleSize
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
            ).join("");


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=500,height=700"
            );


        if(!printWindow){

            showToast(
                "Popup diblokir browser."
            );

            return;

        }


        printWindow.document.open();


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

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

                        background:#fff;
                    }


                    .thermal-label{
                        width:80mm;

                        min-height:55mm;

                        padding:4mm;

                        text-align:center;

                        page-break-after:always;
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

                ${qrJobs}

            </body>

            </html>

        `);


        printWindow.document.close();


        setTimeout(
            () => {

                items.forEach(
                    unit => {

                        const container =
                            printWindow.document
                                .querySelector(
                                    `[data-thermal-qr="${CSS.escape(
                                        unit.trace_code
                                    )}"]`
                                );


                        if(!container){

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
                                text:url,

                                width:113,

                                height:113,

                                correctLevel:
                                    QRCode.CorrectLevel.M
                            }
                        );

                    }
                );


                setTimeout(
                    () => {

                        printWindow.focus();

                        printWindow.print();

                    },
                    500
                );

            },
            300
        );

    }


    /* =====================================================
       EMPTY
    ===================================================== */

    function renderEmpty(){

        const container =
            $("finishedUnits");


        if(!container){

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


    function renderUnitsError(
        message
    ){

        const container =
            $("finishedUnits");


        if(!container){

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
                        message
                    )}
                </span>

            </div>

        `;


        createIcons();

    }


    /* =====================================================
       ICONS
    ===================================================== */

    function createIcons(){

        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message
    ){

        let toast =
            document.getElementById(
                "meramuToast"
            );


        if(!toast){

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "meramuToast";


            toast.style.position =
                "fixed";

            toast.style.right =
                "20px";

            toast.style.bottom =
                "20px";

            toast.style.zIndex =
                "99999";

            toast.style.padding =
                "11px 15px";

            toast.style.borderRadius =
                "12px";

            toast.style.background =
                "#17352A";

            toast.style.color =
                "#FFFFFF";

            toast.style.fontFamily =
                "Poppins,sans-serif";

            toast.style.fontSize =
                "11px";

            toast.style.boxShadow =
                "0 12px 30px rgba(0,0,0,.18)";


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
                () => {

                    toast.style.opacity =
                        "0";

                },
                2500
            );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents(){

        const select =
            $("finishedBatchSelect");


        if(select){

            select.addEventListener(
                "change",
                async event => {

                    await selectFinishedBatch(
                        event.target.value
                    );

                }
            );

        }


        const refresh =
            $("refreshFinished");


        if(refresh){

            refresh.addEventListener(
                "click",
                async () => {

                    await loadFinishedBatches();

                }
            );

        }


        const generate =
            $("generateAllQr");


        if(generate){

            generate.addEventListener(
                "click",
                () => {

                    generateAllQr();

                    showToast(
                        "QR semua botol berhasil dibuat."
                    );

                }
            );

        }


        const printAllButton =
            $("printAllLabels");


        if(printAllButton){

            printAllButton.addEventListener(
                "click",
                printAll
            );

        }


        document.addEventListener(
            "click",
            event => {

                const copyButton =
                    event.target.closest(
                        "[data-copy-trace]"
                    );


                if(copyButton){

                    copyTrace(
                        copyButton.dataset.copyTrace
                    );

                    return;

                }


                const printButton =
                    event.target.closest(
                        "[data-print-unit]"
                    );


                if(printButton){

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

    async function init(){

        try{

            bindEvents();

            createIcons();

            await loadFinishedBatches();

        }catch(error){

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


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    window.MERAMUFinished = {
        load:loadFinishedBatches,
        generateAllQr,
        printAll
    };

})();
