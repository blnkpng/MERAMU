/* =========================================================
   MERAMU — BATCH DETAIL SUPABASE LOGS
   Read-only fermentation logs
========================================================= */

(function () {

    function getBatchCode() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || "KB-022";
    }

    function formatDate(value) {
        if (!value) return "—";

        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date(value));
    }

    function formatTime(value) {
        if (!value) return "—";

        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(new Date(value));
    }

    function formatNumber(value, decimals = 2) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        return Number(value).toFixed(decimals);
    }

    function getQcClass(qc) {

        if (qc === "passed") {
            return "passed";
        }

        if (qc === "warning") {
            return "warning";
        }

        if (qc === "failed") {
            return "failed";
        }

        return "";
    }

    function getQcLabel(qc) {

        if (qc === "passed") {
            return "Passed";
        }

        if (qc === "warning") {
            return "Warning";
        }

        if (qc === "failed") {
            return "Failed";
        }

        return "—";
    }

    function renderSupabaseLogs(logs) {

        /* ================================================
           CONTAINER ASLI DARI BATCH DETAIL
        ================================================ */

        const container =
            document.getElementById(
                "fermentationLogList"
            );

        const count =
            document.getElementById(
                "fermentationLogCount"
            );


        if (!container) {

            console.warn(
                "MERAMU: #fermentationLogList tidak ditemukan."
            );

            return;
        }


        /* ================================================
           UPDATE COUNT
        ================================================ */

        if (count) {
            count.textContent = logs.length;
        }


        /* ================================================
           EMPTY STATE
        ================================================ */

        if (!logs.length) {

            container.innerHTML = `
                <div class="fermentation-log-empty">

                    <i data-lucide="clipboard-list"></i>

                    <strong>
                        Belum ada fermentation log
                    </strong>

                    <span>
                        Belum ada pengukuran yang tercatat
                        untuk batch ini.
                    </span>

                </div>
            `;

            if (window.lucide) {
                lucide.createIcons();
            }

            console.log(
                "MERAMU: Tidak ada fermentation log."
            );

            return;
        }


        /* ================================================
           RENDER LOG
        ================================================ */

        container.innerHTML = logs.map(log => {

            const stage =
                log.stage
                    ? String(log.stage).toUpperCase()
                    : "—";

            const qcClass =
                getQcClass(log.qc_status);

            const qcLabel =
                getQcLabel(log.qc_status);


            return `

                <article
                    class="fermentation-log-item"
                >

                    <div
                        class="fermentation-log-top"
                    >

                        <div
                            class="fermentation-log-date"
                        >

                            <div
                                class="fermentation-log-icon"
                            >
                                <i
                                    data-lucide="activity"
                                ></i>
                            </div>


                            <div>

                                <strong>
                                    ${formatDate(
                                        log.measured_at
                                    )}
                                </strong>

                                <span>
                                    ${formatTime(
                                        log.measured_at
                                    )}
                                </span>

                            </div>

                        </div>


                        <span
                            class="log-stage"
                        >
                            ${stage}
                        </span>

                    </div>


                    <div
                        class="fermentation-log-metrics"
                    >

                        <div class="log-metric">

                            <span>
                                pH
                            </span>

                            <strong>
                                ${formatNumber(
                                    log.ph,
                                    2
                                )}
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>
                                Brix
                            </span>

                            <strong>
                                ${formatNumber(
                                    log.brix,
                                    2
                                )}°
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>
                                Suhu
                            </span>

                            <strong>
                                ${formatNumber(
                                    log.temperature_c,
                                    1
                                )}°C
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>
                                Volume
                            </span>

                            <strong>
                                ${formatNumber(
                                    log.volume,
                                    2
                                )} L
                            </strong>

                        </div>

                    </div>


                    <div
                        class="fermentation-log-bottom"
                    >

                        <div
                            class="log-operator"
                        >

                            <i
                                data-lucide="user-round"
                            ></i>

                            <span>
                                ${log.operator_name || "—"}
                            </span>

                        </div>


                        <span
                            class="
                                log-qc
                                ${qcClass}
                            "
                        >
                            ${qcLabel}
                        </span>

                    </div>


                    ${
                        log.notes
                            ? `

                                <div
                                    class="fermentation-log-note"
                                >

                                    <i
                                        data-lucide="message-square"
                                    ></i>

                                    <span>
                                        ${log.notes}
                                    </span>

                                </div>

                              `
                            : ""
                    }

                </article>

            `;

        }).join("");


        if (window.lucide) {
            lucide.createIcons();
        }


        console.log(
            `MERAMU: ${logs.length} fermentation log berhasil ditampilkan.`
        );
    }


    async function loadFermentationLogs() {

        if (!window.supabaseClient) {

            console.error(
                "MERAMU: Supabase client belum tersedia."
            );

            return;
        }


        const batchCode =
            getBatchCode();


        console.log(
            `MERAMU: Mengambil fermentation logs: ${batchCode}`
        );


        try {

            /* ============================================
               1. CARI BATCH
            ============================================ */

            const {
                data: batch,
                error: batchError
            } = await window.supabaseClient

                .from("batches")

                .select(
                    "id,batch_code"
                )

                .eq(
                    "batch_code",
                    batchCode
                )

                .maybeSingle();


            if (batchError) {
                throw batchError;
            }


            if (!batch) {

                console.warn(
                    `MERAMU: Batch ${batchCode} tidak ditemukan.`
                );

                return;
            }


            console.log(
                "MERAMU: Batch ID untuk log:",
                batch.id
            );


            /* ============================================
               2. AMBIL LOG
            ============================================ */

            const {
                data: logs,
                error: logsError
            } = await window.supabaseClient

                .from("fermentation_logs")

                .select(`
                    id,
                    batch_id,
                    stage,
                    measured_at,
                    ph,
                    brix,
                    temperature_c,
                    volume,
                    operator_name,
                    qc_status,
                    notes
                `)

                .eq(
                    "batch_id",
                    batch.id
                )

                .order(
                    "measured_at",
                    {
                        ascending: false
                    }
                );


            if (logsError) {
                throw logsError;
            }


            console.log(
                "MERAMU: Data fermentation logs dari Supabase:",
                logs
            );


            renderSupabaseLogs(
                logs || []
            );

        } catch (error) {

            console.error(
                "MERAMU: Gagal mengambil fermentation logs.",
                error
            );

        }
    }


    function initSupabaseLogs() {

        if (window.supabaseClient) {

            loadFermentationLogs();

            return;
        }


        let attempts = 0;


        const timer =
            setInterval(() => {

                attempts++;


                if (window.supabaseClient) {

                    clearInterval(timer);

                    loadFermentationLogs();

                    return;
                }


                if (attempts >= 50) {

                    clearInterval(timer);

                    console.error(
                        "MERAMU: Supabase client tidak tersedia."
                    );

                }

            }, 100);

    }


    window.loadFermentationLogs =
        loadFermentationLogs;

    window.initSupabaseLogs =
        initSupabaseLogs;


    document.addEventListener(
        "DOMContentLoaded",
        initSupabaseLogs
    );

})();
