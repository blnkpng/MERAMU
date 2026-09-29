/* =========================================================
   MERAMU — BATCH DETAIL SUPABASE LOGS
========================================================= */

(function () {

    function getBatchCode() {
        const params = new URLSearchParams(
            window.location.search
        );

        return params.get("id") || "KB-022";
    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }

        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date(value));
    }


    function formatTime(value) {

        if (!value) {
            return "—";
        }

        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(new Date(value));
    }


    function renderLogs(logs) {

        const container =
            document.getElementById(
                "fermentationLogList"
            );

        const count =
            document.getElementById(
                "fermentationLogCount"
            );


        console.log(
            "MERAMU: fermentationLogList =",
            container
        );


        if (!container) {

            console.error(
                "MERAMU ERROR: #fermentationLogList tidak ditemukan."
            );

            return;
        }


        if (count) {
            count.textContent = logs.length;
        }


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

            return;
        }


        container.innerHTML = logs.map(log => {

            const qc =
                log.qc_status || "";

            const qcLabel =
                qc === "passed"
                    ? "Passed"
                    : qc === "warning"
                        ? "Warning"
                        : qc === "failed"
                            ? "Failed"
                            : "—";


            return `
                <article class="fermentation-log-item">

                    <div class="fermentation-log-top">

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


                        <span class="log-stage">
                            ${String(
                                log.stage || "—"
                            ).toUpperCase()}
                        </span>

                    </div>


                    <div class="fermentation-log-metrics">

                        <div class="log-metric">

                            <span>pH</span>

                            <strong>
                                ${
                                    log.ph !== null &&
                                    log.ph !== undefined
                                        ? Number(log.ph).toFixed(2)
                                        : "—"
                                }
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>Brix</span>

                            <strong>
                                ${
                                    log.brix !== null &&
                                    log.brix !== undefined
                                        ? Number(log.brix).toFixed(2)
                                        : "—"
                                }°
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>Suhu</span>

                            <strong>
                                ${
                                    log.temperature_c !== null &&
                                    log.temperature_c !== undefined
                                        ? Number(
                                            log.temperature_c
                                        ).toFixed(1)
                                        : "—"
                                }°C
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>Volume</span>

                            <strong>
                                ${
                                    log.volume !== null &&
                                    log.volume !== undefined
                                        ? Number(
                                            log.volume
                                        ).toFixed(2)
                                        : "—"
                                } L
                            </strong>

                        </div>

                    </div>


                    <div class="fermentation-log-bottom">

                        <div class="log-operator">

                            <i data-lucide="user-round"></i>

                            <span>
                                ${log.operator_name || "—"}
                            </span>

                        </div>


                        <span class="log-qc ${qc}">
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


    async function loadLogs() {

        if (!window.supabaseClient) {

            console.error(
                "MERAMU ERROR: Supabase client belum tersedia."
            );

            return;
        }


        const batchCode =
            getBatchCode();


        console.log(
            "MERAMU: Mengambil fermentation logs:",
            batchCode
        );


        const {
            data: batch,
            error: batchError
        } =
            await window.supabaseClient
                .from("batches")
                .select("id,batch_code")
                .eq("batch_code", batchCode)
                .maybeSingle();


        if (batchError) {

            console.error(
                "MERAMU ERROR batch:",
                batchError
            );

            return;
        }


        if (!batch) {

            console.error(
                "MERAMU ERROR: Batch tidak ditemukan:",
                batchCode
            );

            return;
        }


        console.log(
            "MERAMU: Batch ditemukan:",
            batch
        );


        const {
            data: logs,
            error: logsError
        } =
            await window.supabaseClient
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
                .order(
                    "measured_at",
                    {
                        ascending: false
                    }
                );


        if (logsError) {

            console.error(
                "MERAMU ERROR fermentation logs:",
                logsError
            );

            return;
        }


        console.log(
            "MERAMU: Fermentation logs dari Supabase:",
            logs
        );


        renderLogs(
            logs || []
        );
    }


    function init() {

        /*
         * Tunggu sebentar supaya seluruh
         * component + HTML sudah siap.
         */

        setTimeout(
            loadLogs,
            300
        );
    }


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    window.loadSupabaseFermentationLogs =
        loadLogs;

})();
