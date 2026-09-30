/* =========================================================
   MERAMU PUBLIC TRACE
   QR / Traceability Page
========================================================= */

(function(){

    const SUPABASE_URL = "https://bgllborppxhbvmzsetjh.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_g0Kl_e3HewgdaavLEMDkSQ_xe1LMbNl";

    let supabaseClient = null;

    function getTraceCode(){

        const path = window.location.pathname
            .replaceAll("\\","/")
            .split("/")
            .filter(Boolean);

        const traceIndex = path.findIndex(
            item => item.toLowerCase() === "trace"
        );

        if(traceIndex >= 0 && path[traceIndex + 1]){
            return decodeURIComponent(
                path[traceIndex + 1]
            );
        }

        const params = new URLSearchParams(
            window.location.search
        );

        return params.get("code");
    }


    function escapeHtml(value){

        if(value === null || value === undefined){
            return "";
        }

        return String(value)
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");
    }


    function formatDate(value){

        if(!value) return "—";

        const date = new Date(value);

        if(Number.isNaN(date.getTime())){
            return escapeHtml(value);
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


    function formatDateTime(value){

        if(!value) return "—";

        const date = new Date(value);

        if(Number.isNaN(date.getTime())){
            return escapeHtml(value);
        }

        return date.toLocaleString(
            "id-ID",
            {
                day:"2-digit",
                month:"short",
                year:"numeric",
                hour:"2-digit",
                minute:"2-digit"
            }
        );
    }


    function formatNumber(value){

        if(value === null || value === undefined){
            return "—";
        }

        return Number(value).toLocaleString(
            "id-ID",
            {
                maximumFractionDigits:2
            }
        );
    }


    function renderError(title,message){

        const app =
            document.getElementById("traceApp");

        if(!app) return;

        app.innerHTML = `
            <div class="trace-error">

                <div class="trace-error-icon">
                    <i data-lucide="search-x"></i>
                </div>

                <h2>
                    ${escapeHtml(title)}
                </h2>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>
        `;

        if(window.lucide){
            lucide.createIcons();
        }
    }


    function renderTrace(data){

        const app =
            document.getElementById("traceApp");

        if(!app) return;

        const product =
            data.product || {};

        const finished =
            data.finished || {};

        const bottle =
            data.bottle || {};

        const bottling =
            data.bottling || {};

        const allocation =
            data.allocation || {};

        const harvest =
            data.harvest || {};

        const components =
            Array.isArray(data.components)
                ? data.components
                : [];


        const componentHtml =
            components.length

            ? components.map(component => {

                const recipeName =
                    component.recipe_name ||
                    component.recipe_code ||
                    "Component";

                const quantity =
                    formatNumber(component.quantity);

                const unit =
                    component.unit || "";

                return `
                    <div class="trace-component">

                        <div>
                            <div class="trace-component-name">
                                ${escapeHtml(recipeName)}
                            </div>

                            <div class="trace-component-meta">
                                ${
                                    component.version_number
                                        ? `Recipe v${escapeHtml(component.version_number)}`
                                        : ""
                                }
                            </div>
                        </div>

                        <div class="trace-component-qty">
                            ${quantity} ${escapeHtml(unit)}
                        </div>

                    </div>
                `;

            }).join("")

            : `
                <div class="trace-item">
                    <div class="trace-value">
                        Tidak ada component tambahan.
                    </div>
                </div>
            `;


        app.innerHTML = `

            <div class="trace-hero">

                <div class="trace-status">
                    <span class="trace-status-dot"></span>
                    Produk Terverifikasi
                </div>

                <h1 class="trace-product">
                    ${escapeHtml(product.name || "Produk MERAMU")}
                </h1>

                <div class="trace-volume">
                    ${formatNumber(product.bottle_size_ml)} ML
                </div>

                <div class="trace-code">
                    ${escapeHtml(
                        bottle.trace_code || "—"
                    )}
                </div>

            </div>


            <div class="trace-body">

                <!-- PRODUCT -->

                <section class="trace-section">

                    <div class="trace-section-title">
                        <i data-lucide="package-check"></i>
                        Informasi Produk
                    </div>

                    <div class="trace-grid">

                        <div class="trace-item">
                            <div class="trace-label">
                                Produk
                            </div>

                            <div class="trace-value">
                                ${escapeHtml(product.name)}
                            </div>
                        </div>

                        <div class="trace-item">
                            <div class="trace-label">
                                Ukuran
                            </div>

                            <div class="trace-value">
                                ${formatNumber(product.bottle_size_ml)} ML
                            </div>
                        </div>

                        <div class="trace-item">
                            <div class="trace-label">
                                Production Date
                            </div>

                            <div class="trace-value">
                                ${formatDate(
                                    finished.production_date
                                )}
                            </div>
                        </div>

                        <div class="trace-item">
                            <div class="trace-label">
                                Best Before
                            </div>

                            <div class="trace-value">
                                ${formatDate(
                                    finished.best_before_date
                                )}
                            </div>
                        </div>

                    </div>

                </section>


                <!-- BOTTLE -->

                <section class="trace-section">

                    <div class="trace-section-title">
                        <i data-lucide="barcode"></i>
                        Identitas Botol
                    </div>

                    <div class="trace-grid">

                        <div class="trace-item">
                            <div class="trace-label">
                                Trace Code
                            </div>

                            <div class="trace-value">
                                ${escapeHtml(
                                    bottle.trace_code
                                )}
                            </div>
                        </div>

                        <div class="trace-item">
                            <div class="trace-label">
                                Bottle Number
                            </div>

                            <div class="trace-value">
                                #${escapeHtml(
                                    bottle.unit_number
                                )}
                            </div>
                        </div>

                    </div>

                </section>


                <!-- JOURNEY -->

                <section class="trace-section">

                    <div class="trace-section-title">
                        <i data-lucide="route"></i>
                        Perjalanan Produk
                    </div>

                    <div class="trace-timeline">

                        <div class="trace-step">

                            <div class="trace-step-title">
                                Harvest
                            </div>

                            <div class="trace-step-meta">
                                Batch ${escapeHtml(
                                    harvest.batch_code
                                )}
                                •
                                ${formatNumber(
                                    harvest.harvest_volume
                                )} L
                                •
                                ${formatDateTime(
                                    harvest.harvest_date
                                )}
                            </div>

                        </div>


                        <div class="trace-step">

                            <div class="trace-step-title">
                                Allocation
                            </div>

                            <div class="trace-step-meta">
                                ${escapeHtml(
                                    allocation.allocation_code
                                )}
                                •
                                ${formatNumber(
                                    allocation.allocated_volume
                                )} L
                            </div>

                        </div>


                        <div class="trace-step">

                            <div class="trace-step-title">
                                Formulation
                            </div>

                            <div class="trace-step-meta">
                                Component recipe tercatat
                            </div>

                        </div>


                        <div class="trace-step">

                            <div class="trace-step-title">
                                Bottling
                            </div>

                            <div class="trace-step-meta">
                                ${formatNumber(
                                    bottling.bottle_size_ml
                                )} ML
                                •
                                ${formatNumber(
                                    bottling.actual_bottles
                                )} botol
                            </div>

                        </div>


                        <div class="trace-step">

                            <div class="trace-step-title">
                                Finished Product
                            </div>

                            <div class="trace-step-meta">
                                ${escapeHtml(
                                    finished.finished_code
                                )}
                            </div>

                        </div>

                    </div>

                </section>


                <!-- COMPONENTS -->

                <section class="trace-section">

                    <div class="trace-section-title">
                        <i data-lucide="flask-conical"></i>
                        Formulasi
                    </div>

                    ${componentHtml}

                </section>

            </div>
        `;

        if(window.lucide){
            lucide.createIcons();
        }
    }


    async function loadTrace(){

        const traceCode =
            getTraceCode();

        if(!traceCode){

            renderError(
                "Trace Code tidak ditemukan",
                "QR atau alamat halaman tidak memiliki kode trace produk."
            );

            return;
        }


        try{

            if(
                !window.supabase &&
                !window.supabaseClient
            ){

                await loadSupabaseLibrary();

            }


            supabaseClient =
                window.supabaseClient ||
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );


            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "get_meramu_public_trace",
                    {
                        p_trace_code: traceCode
                    }
                );


            if(error){

                console.error(
                    "MERAMU Trace RPC Error:",
                    error
                );

                throw error;

            }


            renderTrace(data);

        }catch(error){

            console.error(
                "MERAMU Trace Error:",
                error
            );

            renderError(
                "Produk tidak ditemukan",
                "Trace code tidak dapat ditemukan atau data produk belum tersedia."
            );

        }

    }


    function loadSupabaseLibrary(){

        return new Promise(
            (resolve,reject)=>{

                const script =
                    document.createElement("script");

                script.src =
                    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

                script.onload = resolve;

                script.onerror = reject;

                document.head.appendChild(script);

            }
        );

    }


    document.addEventListener(
        "DOMContentLoaded",
        loadTrace
    );


})();
