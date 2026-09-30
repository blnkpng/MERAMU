/* =========================================================
   MERAMU BATCH QUALITY HISTORY
   Read quality_checks from Supabase
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
                                attempts >=
                                maxAttempts
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
       FORMAT DATE
    ===================================================== */

    function formatDateTime(value){

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

            return "—";

        }

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value){

        if(
            value === null ||
            value === undefined
        ){

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
       DECISION LABEL
    ===================================================== */

    function getDecisionLabel(
        decision
    ){

        switch(decision){

            case "passed":

                return "PASS — Siap Lanjut";

            case "not_ready":

                return "NOT READY — Perpanjang";

            case "hold":

                return "HOLD — Tahan";

            default:

                return decision || "—";

        }

    }


    /* =====================================================
       DECISION CLASS
    ===================================================== */

    function getDecisionClass(
        decision
    ){

        switch(decision){

            case "passed":

                return "quality-decision-passed";

            case "not_ready":

                return "quality-decision-not-ready";

            case "hold":

                return "quality-decision-hold";

            default:

                return "";

        }

    }


    /* =====================================================
       STAGE LABEL
    ===================================================== */

    function getStageLabel(stage){

        if(!stage){

            return "—";

        }

        const value =
            String(stage).toLowerCase();

        switch(value){

            case "f1":
                return "F1 Fermentasi";

            case "f2":
                return "F2 Fermentasi";

            case "harvest":
                return "Harvest";

            case "production":
                return "Produksi";

            default:
                return stage;

        }

    }


    /* =====================================================
       NUMBER FORMAT
    ===================================================== */

    function formatNumber(
        value,
        suffix = ""
    ){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }

        return `${value}${suffix}`;

    }


    /* =====================================================
       RENDER EMPTY
    ===================================================== */

    function renderEmpty(){

        const container =
            document.getElementById(
                "qualityCheckHistoryList"
            );

        const count =
            document.getElementById(
                "qualityCheckCount"
            );

        if(count){

            count.textContent = "0";

        }

        if(!container){

            return;

        }

        container.innerHTML = `

            <div class="quality-history-empty">

                <div class="quality-history-empty-icon">

                    <i data-lucide="clipboard-check"></i>

                </div>

                <strong>
                    Belum ada QC Check
                </strong>

                <span>
                    Hasil pemeriksaan kualitas batch
                    akan muncul di sini.
                </span>

            </div>

        `;

        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       RENDER HISTORY
    ===================================================== */

    function renderQualityHistory(
        rows
    ){

        const container =
            document.getElementById(
                "qualityCheckHistoryList"
            );

        const count =
            document.getElementById(
                "qualityCheckCount"
            );

        if(!container){

            return;

        }

        if(count){

            count.textContent =
                rows.length;

        }

        if(!rows.length){

            renderEmpty();

            return;

        }


        container.innerHTML =
            rows.map(
                (row, index) => {

                    const decisionClass =
                        getDecisionClass(
                            row.decision
                        );

                    const decisionLabel =
                        getDecisionLabel(
                            row.decision
                        );


                    return `

                        <article
                            class="quality-history-item"
                        >

                            <div class="quality-history-top">

                                <div>

                                    <div class="quality-history-number">

                                        QC #${rows.length - index}

                                    </div>

                                    <strong>
                                        ${escapeHtml(
                                            getStageLabel(
                                                row.stage
                                            )
                                        )}
                                    </strong>

                                </div>


                                <span
                                    class="quality-decision ${decisionClass}"
                                >
                                    ${escapeHtml(
                                        decisionLabel
                                    )}
                                </span>

                            </div>


                            <div class="quality-history-meta">

                                <span>
                                    <i data-lucide="calendar"></i>
                                    ${escapeHtml(
                                        formatDateTime(
                                            row.checked_at
                                        )
                                    )}
                                </span>

                                <span>
                                    <i data-lucide="user"></i>
                                    ${escapeHtml(
                                        row.operator_name ||
                                        "—"
                                    )}
                                </span>

                            </div>


                            <div class="quality-history-metrics">

                                <div>
                                    <span>pH</span>
                                    <strong>
                                        ${escapeHtml(
                                            formatNumber(
                                                row.ph
                                            )
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>Brix</span>
                                    <strong>
                                        ${escapeHtml(
                                            formatNumber(
                                                row.brix,
                                                "°"
                                            )
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>Temp</span>
                                    <strong>
                                        ${escapeHtml(
                                            formatNumber(
                                                row.temperature_c,
                                                "°C"
                                            )
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>Volume</span>
                                    <strong>
                                        ${escapeHtml(
                                            formatNumber(
                                                row.volume,
                                                " L"
                                            )
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div class="quality-history-observation">

                                <div>

                                    <span>
                                        Aroma
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            row.aroma || "—"
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Taste
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            row.taste || "—"
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Color
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            row.color || "—"
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Carbonation
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            row.carbonation || "—"
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        SCOBY
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            row.scoby_condition || "—"
                                        )}
                                    </strong>

                                </div>

                            </div>


                            ${
                                row.reason
                                ? `
                                    <div class="quality-history-note">

                                        <span>
                                            Alasan / Temuan
                                        </span>

                                        <p>
                                            ${escapeHtml(
                                                row.reason
                                            )}
                                        </p>

                                    </div>
                                `
                                : ""
                            }


                            ${
                                row.notes
                                ? `
                                    <div class="quality-history-note">

                                        <span>
                                            Catatan
                                        </span>

                                        <p>
                                            ${escapeHtml(
                                                row.notes
                                            )}
                                        </p>

                                    </div>
                                `
                                : ""
                            }


                            ${
                                row.extension_days !== null &&
                                row.extension_days !== undefined
                                ? `
                                    <div class="quality-history-extension">

                                        <i data-lucide="clock-3"></i>

                                        Extension:
                                        <strong>
                                            ${escapeHtml(
                                                row.extension_days
                                            )} hari
                                        </strong>

                                    </div>
                                `
                                : ""
                            }

                        </article>

                    `;

                }
            ).join("");


        if(window.lucide){

            lucide.createIcons();

        }

    }


    /* =====================================================
       LOAD BATCH UUID
    ===================================================== */

    async function getBatchUuid(
        supabase,
        batchCode
    ){

        const {
            data,
            error
        } = await supabase
            .from("batches")
            .select("id")
            .eq(
                "batch_code",
                batchCode
            )
            .maybeSingle();


        if(error){

            console.error(
                "MERAMU: Gagal mencari batch untuk QC history.",
                error
            );

            return null;

        }


        if(!data){

            console.warn(
                `MERAMU: Batch ${batchCode} tidak ditemukan.`
            );

            return null;

        }


        return data.id;

    }


    /* =====================================================
       LOAD QUALITY HISTORY
    ===================================================== */

    async function loadQualityHistory(){

        const supabase =
            await waitForSupabase();

        if(!supabase){

            console.warn(
                "MERAMU: Supabase belum tersedia untuk QC history."
            );

            return;

        }


        const batchCode =
            getBatchCode();


        const batchUuid =
            await getBatchUuid(
                supabase,
                batchCode
            );


        if(!batchUuid){

            renderEmpty();

            return;

        }


        const {
            data,
            error
        } = await supabase
            .from("quality_checks")
            .select(`
                id,
                batch_id,
                checked_at,
                stage,
                ph,
                brix,
                temperature_c,
                volume,
                aroma,
                taste,
                color,
                carbonation,
                scoby_condition,
                decision,
                reason,
                extension_days,
                next_target_date,
                operator_name,
                notes,
                created_at
            `)
            .eq(
                "batch_id",
                batchUuid
            )
            .order(
                "checked_at",
                {
                    ascending: false
                }
            );


        if(error){

            console.error(
                "MERAMU: Gagal mengambil QC history.",
                error
            );

            const container =
                document.getElementById(
                    "qualityCheckHistoryList"
                );

            if(container){

                container.innerHTML = `

                    <div class="quality-history-error">

                        <strong>
                            QC History gagal dimuat
                        </strong>

                        <span>
                            ${escapeHtml(
                                error.message
                            )}
                        </span>

                    </div>

                `;

            }

            return;

        }


        console.log(
            `MERAMU: ${data?.length || 0} QC history ${batchCode} berhasil diambil.`,
            data
        );


        renderQualityHistory(
            data || []
        );

    }


    /* =====================================================
       REFRESH EVENT
    ===================================================== */

    document.addEventListener(
        "meramu:quality-check-saved",
        () => {

            loadQualityHistory();

        }
    );


    document.addEventListener(
        "meramu:supabase-change",
        event => {

            const detail =
                event.detail || {};

            if(
                detail.table ===
                "quality_checks"
            ){

                loadQualityHistory();

            }

        }
    );


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            loadQualityHistory();

        }
    );


    /* =====================================================
       EXPORT
    ===================================================== */

    window.loadQualityHistory =
        loadQualityHistory;


})();
