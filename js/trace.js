(function () {
    "use strict";

    /* =========================================================
       MERAMU PUBLIC TRACE
       QR / Trace Code
       ========================================================= */

    function getTraceCode(){

    const params =
        new URLSearchParams(
            window.location.search
        );


    /*
     * =====================================================
     * BATCH TRACE
     * Contoh:
     * /pages/trace.html?batch=KB-027
     * =====================================================
     */

    const queryBatch =
        params.get("batch");

    if(queryBatch){

        return {
            type: "batch",
            value: queryBatch.trim()
        };

    }


    /*
     * =====================================================
     * BOTTLE TRACE
     * Contoh:
     * /pages/trace.html?code=FG-20260930-0001-001
     * =====================================================
     */

    const queryCode =
        params.get("code");

    if(queryCode){

        return {
            type: "code",
            value: queryCode.trim()
        };

    }


    /*
     * =====================================================
     * LEGACY /TRACE/...
     *
     * Dipertahankan supaya URL lama
     * tidak langsung rusak.
     * =====================================================
     */

    const parts =
        window.location.pathname
            .split("/")
            .filter(Boolean);


    const traceIndex =
        parts.indexOf("trace");


    if(
        traceIndex !== -1 &&
        parts[traceIndex + 1]
    ){

        return {
            type: "code",
            value: decodeURIComponent(
                parts[traceIndex + 1]
            ).trim()
        };

    }


    return null;

}


    /* =========================================================
       HELPERS
       ========================================================= */

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function formatNumber(value, decimals = 2) {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            Number.isNaN(Number(value))
        ) {
            return "—";
        }

        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        }).format(Number(value));
    }


    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return escapeHtml(value);
        }

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function formatDateTime(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return escapeHtml(value);
        }

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    function safeValue(value, fallback = "—") {
        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {
            return fallback;
        }

        return escapeHtml(value);
    }


    /* =========================================================
       STATUS
       ========================================================= */

    function getStatusLabel(status) {
        const normalized = String(status || "")
            .toLowerCase()
            .trim();

        const map = {
            finished: "Finished",
            released: "Released",
            available: "Available",
            sold: "Sold",
            returned: "Returned",
            damaged: "Damaged",
            expired: "Expired",
            hold: "Hold",
            cancelled: "Cancelled"
        };

        return map[normalized] || (
            status
                ? String(status)
                : "Trace Available"
        );
    }


    function getStatusClass(status) {
        const normalized = String(status || "")
            .toLowerCase()
            .trim();

        if (
            normalized === "expired" ||
            normalized === "cancelled" ||
            normalized === "damaged"
        ) {
            return "danger";
        }

        if (
            normalized === "hold" ||
            normalized === "returned"
        ) {
            return "warning";
        }

        if (
            normalized === "released" ||
            normalized === "available" ||
            normalized === "finished"
        ) {
            return "success";
        }

        return "neutral";
    }


    /* =========================================================
       ERROR
       ========================================================= */

    function renderError(title, message) {
        const app = document.getElementById("traceApp");

        if (!app) {
            return;
        }

        app.innerHTML = `
            <div class="trace-error">
                <div class="trace-error-icon">
                    <i data-lucide="circle-alert"></i>
                </div>

                <h1>${escapeHtml(title)}</h1>

                <p>
                    ${escapeHtml(message)}
                </p>

                <div class="trace-error-code">
                    Trace: ${escapeHtml(getTraceCode() || "—")}
                </div>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }


    /* =========================================================
       COMPONENT
       ========================================================= */

    function renderComponents(components) {
        if (!Array.isArray(components) || components.length === 0) {
            return `
                <div class="trace-empty">
                    Tidak ada detail formulasi yang ditampilkan.
                </div>
            `;
        }

        return components.map((item, index) => {

            const componentName =
                item.recipe_name ||
                item.ingredient_name ||
                item.source_batch_code ||
                item.component_name ||
                "Component";

            let typeLabel = "Component";

            if (item.component_type === "recipe") {
                typeLabel = "Recipe";
            } else if (item.component_type === "ingredient") {
                typeLabel = "Ingredient";
            } else if (item.component_type === "batch") {
                typeLabel = "Source Batch";
            }

            return `
                <div class="trace-component">

                    <div class="trace-component-number">
                        ${index + 1}
                    </div>

                    <div class="trace-component-main">

                        <div class="trace-component-title">
                            ${safeValue(componentName)}
                        </div>

                        <div class="trace-component-meta">
                            ${safeValue(typeLabel)}
                        </div>

                    </div>

                    <div class="trace-component-qty">

                        <strong>
                            ${formatNumber(item.quantity)}
                        </strong>

                        <span>
                            ${safeValue(
                                item.unit_name ||
                                item.unit ||
                                ""
                            )}
                        </span>

                    </div>

                </div>
            `;
        }).join("");
    }


    /* =========================================================
       RENDER TRACE
       ========================================================= */

    function renderTrace(data) {
        const app = document.getElementById("traceApp");

        if (!app) {
            return;
        }

        if (!data) {
            renderError(
                "Produk tidak ditemukan",
                "Trace code tidak ditemukan atau sudah tidak tersedia."
            );

            return;
        }

        /* =========================================================
   BATCH TRACE RENDERER
   ========================================================= */

if (data.type === "batch") {

    const batch =
        data.batch || {};

    const product =
        data.product || {};


    const batchStatus =
        batch.status || "active";


    const currentStage =
        batch.current_stage || "—";


    const statusClass =
        getStatusClass(batchStatus);


    app.innerHTML = `

        <!-- HERO -->

        <section class="trace-hero">

            <div class="trace-brand">

                <img
                    src="../assets/branding/logo-icon.png"
                    alt="MERAMU"
                    class="trace-logo-icon"
                >

                <img
                    src="../assets/branding/logo-text.png"
                    alt="MERAMU"
                    class="trace-logo-text"
                >

            </div>


            <div class="trace-hero-copy">

                <span class="trace-eyebrow">
                    BATCH TRACE
                </span>

                <h1>
                    ${safeValue(
                        product.name
                    )}
                </h1>

                <p>
                    Informasi perjalanan
                    dan status produksi batch.
                </p>

            </div>


            <div class="trace-status ${statusClass}">

                <span class="trace-status-dot"></span>

                ${escapeHtml(
                    getStatusLabel(batchStatus)
                )}

            </div>

        </section>


        <!-- BATCH IDENTITY -->

        <section class="trace-section">

            <div class="trace-section-header">

                <div>

                    <span class="trace-section-kicker">
                        BATCH
                    </span>

                    <h2>
                        Identitas Batch
                    </h2>

                </div>

                <i data-lucide="package"></i>

            </div>


            <div class="trace-code-box">

                <span>
                    Batch Code
                </span>

                <strong>
                    ${safeValue(
                        batch.batch_code
                    )}
                </strong>

            </div>


            <div class="trace-mini-grid">

                <div class="trace-info-item">

                    <span>
                        Product
                    </span>

                    <strong>
                        ${safeValue(
                            product.name
                        )}
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Product Code
                    </span>

                    <strong>
                        ${safeValue(
                            product.code
                        )}
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Stage
                    </span>

                    <strong>
                        ${safeValue(
                            currentStage
                        )}
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHtml(
                            getStatusLabel(
                                batchStatus
                            )
                        )}
                    </strong>

                </div>

            </div>

        </section>


        <!-- PRODUCTION -->

        <section class="trace-section">

            <div class="trace-section-header">

                <div>

                    <span class="trace-section-kicker">
                        PRODUCTION
                    </span>

                    <h2>
                        Informasi Produksi
                    </h2>

                </div>

                <i data-lucide="factory"></i>

            </div>


            <div class="trace-mini-grid">

                <div class="trace-info-item">

                    <span>
                        Production
                    </span>

                    <strong>
                        ${formatDate(
                            batch.production_date
                        )}
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Planned Volume
                    </span>

                    <strong>
                        ${
                            batch.planned_volume
                                ? formatNumber(
                                    batch.planned_volume
                                ) + " L"
                                : "—"
                        }
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Actual Volume
                    </span>

                    <strong>
                        ${
                            batch.actual_volume
                                ? formatNumber(
                                    batch.actual_volume
                                ) + " L"
                                : "—"
                        }
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Target
                    </span>

                    <strong>
                        ${formatDate(
                            batch.target_date
                        )}
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Best Before
                    </span>

                    <strong>
                        ${formatDate(
                            batch.best_before_date
                        )}
                    </strong>

                </div>


                <div class="trace-info-item">

                    <span>
                        Expiry
                    </span>

                    <strong>
                        ${formatDate(
                            batch.expiry_date
                        )}
                    </strong>

                </div>

            </div>

        </section>


        <!-- JOURNEY -->

        <section class="trace-section">

            <div class="trace-section-header">

                <div>

                    <span class="trace-section-kicker">
                        JOURNEY
                    </span>

                    <h2>
                        Batch Journey
                    </h2>

                </div>

                <i data-lucide="route"></i>

            </div>


            <div class="trace-timeline">


                <div class="trace-step completed">

                    <div class="trace-step-icon">
                        <i data-lucide="factory"></i>
                    </div>

                    <div class="trace-step-content">

                        <span>
                            Production
                        </span>

                        <strong>
                            ${safeValue(
                                batch.batch_code
                            )}
                        </strong>

                        <small>
                            ${formatDate(
                                batch.production_date
                            )}
                        </small>

                    </div>

                </div>


                <div class="trace-step ${
                    String(currentStage).toLowerCase() === "f1"
                        ? "current"
                        : "completed"
                }">

                    <div class="trace-step-icon">
                        <i data-lucide="beaker"></i>
                    </div>

                    <div class="trace-step-content">

                        <span>
                            F1 Fermentasi
                        </span>

                        <strong>
                            ${
                                String(currentStage).toLowerCase() === "f1"
                                    ? "ACTIVE"
                                    : "F1"
                            }
                        </strong>

                    </div>

                </div>


                <div class="trace-step ${
                    String(currentStage).toLowerCase() === "f2"
                        ? "current"
                        : ""
                }">

                    <div class="trace-step-icon">
                        <i data-lucide="wine"></i>
                    </div>

                    <div class="trace-step-content">

                        <span>
                            F2 Fermentasi
                        </span>

                        <strong>
                            ${
                                String(currentStage).toLowerCase() === "f2"
                                    ? "ACTIVE"
                                    : "F2"
                            }
                        </strong>

                    </div>

                </div>


                <div class="trace-step ${
                    String(currentStage).toLowerCase() === "harvest"
                        ? "current"
                        : ""
                }">

                    <div class="trace-step-icon">
                        <i data-lucide="leaf"></i>
                    </div>

                    <div class="trace-step-content">

                        <span>
                            Harvest
                        </span>

                        <strong>
                            ${
                                String(currentStage).toLowerCase() === "harvest"
                                    ? "ACTIVE"
                                    : "Harvest"
                            }
                        </strong>

                    </div>

                </div>


            </div>

        </section>


        <!-- FOOTER -->

        <section class="trace-footer">

            <div class="trace-footer-icon">
                <i data-lucide="shield-check"></i>
            </div>

            <div>

                <strong>
                    MERAMU Batch Trace
                </strong>

                <p>
                    Informasi publik mengenai
                    perjalanan batch produksi.
                    Data internal seperti HPP,
                    biaya bahan, dan informasi
                    operasional tidak ditampilkan.
                </p>

            </div>

        </section>

    `;


    if (window.lucide) {

        lucide.createIcons();

    }


    return;

}

        const product =
            data.product ||
            {};

        const finished =
            data.finished ||
            {};

        const bottle =
            data.bottle ||
            {};

        const bottling =
            data.bottling ||
            {};

        const allocation =
            data.allocation ||
            {};

        const harvest =
            data.harvest ||
            {};

        const components =
            data.components ||
            [];


        const bottleStatus =
            bottle.status ||
            finished.status ||
            "available";


        const statusClass =
            getStatusClass(bottleStatus);


        app.innerHTML = `

            <!-- HERO -->

            <section class="trace-hero">

                <div class="trace-brand">

                    <img
                        src="../assets/branding/logo-icon.png"
                        alt="MERAMU"
                        class="trace-logo-icon"
                    >

                    <img
                        src="../assets/branding/logo-text.png"
                        alt="MERAMU"
                        class="trace-logo-text"
                    >

                </div>


                <div class="trace-hero-copy">

                    <span class="trace-eyebrow">
                        PRODUCT TRACE
                    </span>

                    <h1>
                        ${safeValue(product.name)}
                    </h1>

                    <p>
                        Informasi perjalanan produk
                        dari bahan hingga produk jadi.
                    </p>

                </div>


                <div class="trace-status ${statusClass}">
                    <span class="trace-status-dot"></span>
                    ${escapeHtml(
                        getStatusLabel(bottleStatus)
                    )}
                </div>

            </section>


            <!-- PRODUCT -->

            <section class="trace-section">

                <div class="trace-section-header">

                    <div>
                        <span class="trace-section-kicker">
                            PRODUCT
                        </span>

                        <h2>
                            Identitas Produk
                        </h2>
                    </div>

                    <i data-lucide="package-check"></i>

                </div>


                <div class="trace-product-grid">

                    <div class="trace-product-main">

                        <div class="trace-product-name">
                            ${safeValue(product.name)}
                        </div>

                        <div class="trace-product-code">
                            ${safeValue(product.code)}
                        </div>

                    </div>


                    <div class="trace-info-item">

                        <span>
                            Category
                        </span>

                        <strong>
                            ${safeValue(product.category)}
                        </strong>

                    </div>


                    <div class="trace-info-item">

                        <span>
                            Bottle Size
                        </span>

                        <strong>
                            ${
                                product.bottle_size_ml
                                    ? formatNumber(
                                        product.bottle_size_ml,
                                        0
                                    ) + " ML"
                                    : "—"
                            }
                        </strong>

                    </div>

                </div>

            </section>


            <!-- BOTTLE ID -->

            <section class="trace-section trace-highlight">

                <div class="trace-section-header">

                    <div>
                        <span class="trace-section-kicker">
                            TRACE ID
                        </span>

                        <h2>
                            Identitas Botol
                        </h2>
                    </div>

                    <i data-lucide="qr-code"></i>

                </div>


                <div class="trace-code-box">

                    <span>
                        Trace Code
                    </span>

                    <strong>
                        ${safeValue(
                            bottle.trace_code ||
                            getTraceCode()
                        )}
                    </strong>

                </div>


                <div class="trace-mini-grid">

                    <div class="trace-info-item">

                        <span>
                            Finished Batch
                        </span>

                        <strong>
                            ${safeValue(
                                finished.finished_code
                            )}
                        </strong>

                    </div>


                    <div class="trace-info-item">

                        <span>
                            Unit
                        </span>

                        <strong>
                            #${safeValue(
                                bottle.unit_number
                            )}
                        </strong>

                    </div>


                    <div class="trace-info-item">

                        <span>
                            Production
                        </span>

                        <strong>
                            ${formatDate(
                                finished.production_date
                            )}
                        </strong>

                    </div>


                    <div class="trace-info-item">

                        <span>
                            Best Before
                        </span>

                        <strong>
                            ${formatDate(
                                finished.best_before_date
                            )}
                        </strong>

                    </div>

                </div>

            </section>


            <!-- JOURNEY -->

            <section class="trace-section">

                <div class="trace-section-header">

                    <div>
                        <span class="trace-section-kicker">
                            JOURNEY
                        </span>

                        <h2>
                            Product Journey
                        </h2>
                    </div>

                    <i data-lucide="route"></i>

                </div>


                <div class="trace-timeline">


                    <div class="trace-step completed">

                        <div class="trace-step-icon">
                            <i data-lucide="leaf"></i>
                        </div>

                        <div class="trace-step-content">

                            <span>
                                Harvest
                            </span>

                            <strong>
                                ${safeValue(
                                    harvest.batch_code
                                )}
                            </strong>

                            <small>
                                ${formatDateTime(
                                    harvest.actual_harvest_at
                                )}
                            </small>

                        </div>

                    </div>


                    <div class="trace-step completed">

                        <div class="trace-step-icon">
                            <i data-lucide="split"></i>
                        </div>

                        <div class="trace-step-content">

                            <span>
                                Allocation
                            </span>

                            <strong>
                                ${safeValue(
                                    allocation.allocation_code
                                )}
                            </strong>

                            <small>
                                ${
                                    allocation.allocated_volume
                                        ? formatNumber(
                                            allocation.allocated_volume
                                        ) + " L"
                                        : "—"
                                }
                            </small>

                        </div>

                    </div>


                    <div class="trace-step completed">

                        <div class="trace-step-icon">
                            <i data-lucide="beaker"></i>
                        </div>

                        <div class="trace-step-content">

                            <span>
                                Formulation
                            </span>

                            <strong>
                                Recipe & Components
                            </strong>

                            <small>
                                ${components.length}
                                component
                                ${
                                    components.length === 1
                                        ? ""
                                        : "s"
                                }
                            </small>

                        </div>

                    </div>


                    <div class="trace-step completed">

                        <div class="trace-step-icon">
                            <i data-lucide="bottle-wine"></i>
                        </div>

                        <div class="trace-step-content">

                            <span>
                                Bottling
                            </span>

                            <strong>
                                ${safeValue(
                                    bottling.bottle_size_ml
                                        ? formatNumber(
                                            bottling.bottle_size_ml,
                                            0
                                        ) + " ML"
                                        : "—"
                                )}
                            </strong>

                            <small>
                                ${
                                    bottling.actual_bottles
                                        ? formatNumber(
                                            bottling.actual_bottles,
                                            0
                                        ) + " bottles"
                                        : "—"
                                }
                            </small>

                        </div>

                    </div>


                    <div class="trace-step current">

                        <div class="trace-step-icon">
                            <i data-lucide="badge-check"></i>
                        </div>

                        <div class="trace-step-content">

                            <span>
                                Finished
                            </span>

                            <strong>
                                ${safeValue(
                                    finished.finished_code
                                )}
                            </strong>

                            <small>
                                ${formatDate(
                                    finished.production_date
                                )}
                            </small>

                        </div>

                    </div>

                </div>

            </section>


            <!-- FORMULATION -->

            <section class="trace-section">

                <div class="trace-section-header">

                    <div>
                        <span class="trace-section-kicker">
                            FORMULATION
                        </span>

                        <h2>
                            Components
                        </h2>
                    </div>

                    <i data-lucide="layers-3"></i>

                </div>


                <div class="trace-components">

                    ${renderComponents(components)}

                </div>

            </section>


            <!-- FOOTER -->

            <section class="trace-footer">

                <div class="trace-footer-icon">
                    <i data-lucide="shield-check"></i>
                </div>

                <div>

                    <strong>
                        MERAMU Product Trace
                    </strong>

                    <p>
                        Informasi traceability produk.
                        Data internal seperti HPP,
                        biaya bahan, dan informasi
                        operasional tidak ditampilkan.
                    </p>

                </div>

            </section>

        `;


        if (window.lucide) {
            lucide.createIcons();
        }
    }


    /* =========================================================
       SUPABASE
       ========================================================= */

    async function waitForSupabaseClient(timeout = 10000) {

        const startedAt = Date.now();

        while (
            !window.supabaseClient &&
            Date.now() - startedAt < timeout
        ) {
            await new Promise(resolve =>
                setTimeout(resolve, 100)
            );
        }

        if (!window.supabaseClient) {
            throw new Error(
                "Supabase client MERAMU belum tersedia."
            );
        }

        return window.supabaseClient;
    }


    /* =========================================================
   LOAD TRACE
   ========================================================= */

async function loadTrace() {

    const traceRequest =
        getTraceCode();


    /*
     * Tidak ada parameter trace
     */
    if (!traceRequest) {

        renderError(
            "Trace Code Tidak Ada",
            "Halaman ini membutuhkan trace code atau batch code."
        );

        return;
    }


    try {

        const supabase =
            await waitForSupabaseClient();


        let data = null;
        let error = null;


        /* =====================================================
           BATCH TRACE
           ?batch=KB-027
        ===================================================== */

        if (
            traceRequest.type ===
            "batch"
        ) {

            console.log(
                "MERAMU Batch Trace:",
                traceRequest.value
            );


            const response =
                await supabase.rpc(
                    "get_meramu_public_batch_trace",
                    {
                        p_batch_code:
                            traceRequest.value
                    }
                );


            data =
                response.data;

            error =
                response.error;

        }


        /* =====================================================
           BOTTLE TRACE
           ?code=FG-20260930-0001-001
        ===================================================== */

        else if (
            traceRequest.type ===
            "code"
        ) {

            console.log(
                "MERAMU Bottle Trace:",
                traceRequest.value
            );


            const response =
                await supabase.rpc(
                    "get_meramu_public_trace",
                    {
                        p_trace_code:
                            traceRequest.value
                    }
                );


            data =
                response.data;

            error =
                response.error;

        }


        /* =====================================================
           UNKNOWN TRACE TYPE
        ===================================================== */

        else {

            renderError(
                "Trace Tidak Valid",
                "Jenis trace tidak dikenali."
            );

            return;

        }


        /* =====================================================
           RPC ERROR
        ===================================================== */

        if (error) {

            console.error(
                "MERAMU Trace RPC Error:",
                error
            );

            throw error;

        }


        /* =====================================================
           DATA TIDAK DITEMUKAN
        ===================================================== */

        if (!data) {

            if (
                traceRequest.type ===
                "batch"
            ) {

                renderError(
                    "Batch Tidak Ditemukan",
                    `Batch ${traceRequest.value} tidak ditemukan.`
                );

            } else {

                renderError(
                    "Produk Tidak Ditemukan",
                    `Trace code ${traceRequest.value} tidak ditemukan.`
                );

            }

            return;

        }


        /* =====================================================
           LOG
        ===================================================== */

        console.log(
            "MERAMU Trace Loaded:",
            traceRequest,
            data
        );


        /* =====================================================
           RENDER
        ===================================================== */

        renderTrace(data);

    } catch (error) {

        console.error(
            "MERAMU Trace Error:",
            error
        );


        renderError(
            "Trace Tidak Dapat Dibuka",
            "Terjadi masalah saat mengambil informasi trace."
        );

    }

}
    /* =========================================================
       INIT
       ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        loadTrace
    );


    window.MERAMUTrace = {
        load: loadTrace,
        getTraceCode,
        renderTrace
    };

})();
