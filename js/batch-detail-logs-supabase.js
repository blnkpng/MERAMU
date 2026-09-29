/* =========================================================
   MERAMU — BATCH DETAIL SUPABASE LOGS
   Read-only fermentation logs
   F1 / F2
========================================================= */

(function () {

    function getBatchCode() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || "KB-022";
    }

    function formatDate(dateValue) {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    function formatTime(dateValue) {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(date);
    }

    function formatNumber(value, decimals = 2) {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        return Number(value).toFixed(decimals);
    }

    function getStageLabel(stage) {
        return stage === "f1" ? "F1" : "F2";
    }

    function getQcLabel(status) {
        switch (status) {
            case "passed":
                return "Passed";

            case "warning":
                return "Warning";

            case "failed":
                return "Failed";

            default:
                return "—";
        }
    }

    function getQcClass(status) {
        switch (status) {
            case "passed":
                return "passed";

            case "warning":
                return "warning";

            case "failed":
                return "failed";

            default:
                return "";
        }
    }

    function renderSupabaseLogs(logs) {

        const container =
            document.getElementById("fermentationLogsList") ||
            document.querySelector(".fermentation-logs-list") ||
            document.querySelector("[data-fermentation-logs]");

        if (!container) {
            console.warn(
                "MERAMU: container fermentation log tidak ditemukan."
            );
            return;
        }

        if (!logs.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="clipboard-list"></i>
                    <strong>Belum ada log fermentasi</strong>
                    <span>Belum ada pencatatan F1/F2 untuk batch ini.</span>
                </div>
            `;

            if (window.lucide) {
                lucide.createIcons();
            }

            return;
        }

        container.innerHTML = logs.map(log => {

            const stage = getStageLabel(log.stage);
            const qcClass = getQcClass(log.qc_status);
            const qcLabel = getQcLabel(log.qc_status);

            return `
                <article class="fermentation-log-card">

                    <div class="fermentation-log-header">

                        <div class="fermentation-log-date">

                            <div class="fermentation-log-icon">
                                <i data-lucide="activity"></i>
                            </div>

                            <div>
                                <strong>
                                    ${formatDate(log.measured_at)}
                                </strong>

                                <span>
                                    ${formatTime(log.measured_at)}
                                </span>
                            </div>

                        </div>

                        <span class="fermentation-stage-badge">
                            ${stage}
                        </span>

                    </div>


                    <div class="fermentation-log-metrics">

                        <div class="fermentation-log-metric">
                            <span>pH</span>
                            <strong>
                                ${formatNumber(log.ph, 2)}
                            </strong>
                        </div>

                        <div class="fermentation-log-metric">
                            <span>Brix</span>
                            <strong>
                                ${formatNumber(log.brix, 2)}°
                            </strong>
                        </div>

                        <div class="fermentation-log-metric">
                            <span>Suhu</span>
                            <strong>
                                ${formatNumber(log.temperature_c, 1)}°C
                            </strong>
                        </div>

                        <div class="fermentation-log-metric">
                            <span>Volume</span>
                            <strong>
                                ${formatNumber(log.volume, 2)} L
                            </strong>
                        </div>

                    </div>


                    <div class="fermentation-log-footer">

                        <div class="fermentation-log-operator">
                            <i data-lucide="user"></i>
                            <span>
                                ${log.operator_name || "—"}
                            </span>
                        </div>

                        <span class="fermentation-log-qc ${qcClass}">
                            ${qcLabel}
                        </span>

                    </div>


                    ${
                        log.notes
                            ? `
                                <div class="fermentation-log-note">
                                    <i data-lucide="message-square"></i>
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

        const batchCode = getBatchCode();

        console.log(
            `MERAMU: Mengambil fermentation logs: ${batchCode}`
        );

        try {

            /*
             * Ambil batch ID berdasarkan batch_code
             */
            const {
                data: batch,
                error: batchError
            } = await window.supabaseClient
                .from("batches")
                .select("id,batch_code")
                .eq("batch_code", batchCode)
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


            /*
             * Ambil fermentation logs
             */
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
                .eq("batch_id", batch.id)
                .order("measured_at", {
                    ascending: false
                });

            if (logsError) {
                throw logsError;
            }


            renderSupabaseLogs(logs || []);

            console.log(
                "MERAMU: Fermentation logs berhasil diambil.",
                logs
            );

        } catch (error) {

            console.error(
                "MERAMU: Gagal mengambil fermentation logs.",
                error
            );

        }
    }


    function initSupabaseLogs() {

        /*
         * Supabase client dibuat oleh supabase.js.
         * Tunggu sebentar jika script client belum selesai.
         */
        if (window.supabaseClient) {
            loadFermentationLogs();
            return;
        }

        let attempts = 0;

        const timer = setInterval(() => {

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
