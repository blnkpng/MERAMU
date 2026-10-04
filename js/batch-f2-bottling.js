/* =========================================================
   MERAMU P5 — F2 / BOTTLING
   CLEAN LIFECYCLE
   ---------------------------------------------------------
   Rules:
   1. Bottling hanya aktif ketika batch.current_stage = f2.
   2. Bottling TIDAK mengubah stage batch.
   3. Source volume diambil dari log F2 terbaru.
      Fallback: batches.actual_volume -> planned_volume.
   4. Output = actual_bottles × bottle_size_ml / 1000.
   5. Waste = source_volume - output.
   6. Output tidak boleh melebihi source volume.
   7. Satu record bottling per batch (upsert batch_id).
   8. QC F2 PASS adalah gerbang terpisah menuju Harvest.
========================================================= */

(function(){
    "use strict";

    const STYLE_ID = "meramuF2BottlingStyles";

    const el = id => document.getElementById(id);

    function escapeHtml(value){
        return String(value ?? "")
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");
    }

    function number(value, fallback = 0){
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function formatNumber(value, decimals = 3){
        const n = Number(value);
        if(!Number.isFinite(n)) return "—";

        return new Intl.NumberFormat("id-ID",{
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        }).format(n);
    }

    function getLocalDateTimeValue(value){
        const date = value ? new Date(value) : new Date();

        if(Number.isNaN(date.getTime())){
            return "";
        }

        const offset = date.getTimezoneOffset();
        const local = new Date(
            date.getTime() - offset * 60000
        );

        return local.toISOString().slice(0,16);
    }

    async function waitForSupabase(){
        for(let i = 0; i < 100; i++){

            if(
                window.supabaseClient &&
                typeof window.supabaseClient.from === "function"
            ){
                return window.supabaseClient;
            }

            if(
                window.meramuSupabase &&
                typeof window.meramuSupabase.from === "function"
            ){
                return window.meramuSupabase;
            }

            await new Promise(resolve => setTimeout(resolve,100));
        }

        throw new Error("Supabase belum siap.");
    }

    function getBatchCode(){
        const params = new URLSearchParams(
            window.location.search
        );

        return (
            params.get("id") ||
            params.get("batch") ||
            ""
        ).trim();
    }

    function isF2(batch){
        return (
            String(batch?.current_stage || "")
                .trim()
                .toLowerCase()
        ) === "f2";
    }

    async function loadBatchFromSupabase(supabase){
        const batchCode = getBatchCode();

        if(!batchCode){
            throw new Error("Kode batch tidak ditemukan pada URL.");
        }

        const {
            data,
            error
        } = await supabase
            .from("batches")
            .select(`
                id,
                batch_code,
                planned_volume,
                actual_volume,
                current_stage,
                status,
                product_id,
                recipe_id,
                recipe_version_id,
                production_date
            `)
            .eq("batch_code",batchCode)
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

    async function loadF2SourceVolume(
        supabase,
        batch
    ){
        /*
         * Prioritas source volume:
         * 1. Log F2 terbaru yang mempunyai volume
         * 2. batches.actual_volume
         * 3. batches.planned_volume
         */
        const {
            data: logs,
            error
        } = await supabase
            .from("fermentation_logs")
            .select("*")
            .eq("batch_id",batch.id)
            .order("measured_at",{ascending:false})
            .limit(50);

        if(error){
            console.warn(
                "MERAMU P5: gagal membaca fermentation_logs.",
                error
            );
        }

        const f2Log = (logs || []).find(row => {
            const stage = String(
                row.stage ||
                row.fermentation_stage ||
                ""
            ).toLowerCase();

            const volume = number(
                row.volume ??
                row.measured_volume ??
                row.actual_volume,
                0
            );

            return (
                stage.includes("f2") &&
                volume > 0
            );
        });

        if(f2Log){
            return {
                volume: number(
                    f2Log.volume ??
                    f2Log.measured_volume ??
                    f2Log.actual_volume
                ),
                source: "F2 fermentation log"
            };
        }

        const actualVolume = number(
            batch.actual_volume,
            0
        );

        if(actualVolume > 0){
            return {
                volume: actualVolume,
                source: "Batch actual volume"
            };
        }

        const plannedVolume = number(
            batch.planned_volume,
            0
        );

        if(plannedVolume > 0){
            return {
                volume: plannedVolume,
                source: "Batch planned volume"
            };
        }

        return {
            volume: 0,
            source: "Tidak tersedia"
        };
    }

    function injectStyles(){
        if(document.getElementById(STYLE_ID)){
            return;
        }

        const style = document.createElement("style");

        style.id = STYLE_ID;

        style.textContent = `
            .f2-bottling-card{margin-top:24px;}
            .f2-bottling-grid{
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:16px;
            }
            .f2-bottling-field{
                display:flex;
                flex-direction:column;
                gap:8px;
            }
            .f2-bottling-field.full{
                grid-column:1/-1;
            }
            .f2-bottling-field label{
                font-size:13px;
                font-weight:600;
                color:#44546a;
            }
            .f2-bottling-field input,
            .f2-bottling-field textarea{
                width:100%;
                border:1px solid #dbe3ea;
                border-radius:14px;
                padding:13px 14px;
                font:inherit;
                background:#fff;
                box-sizing:border-box;
            }
            .f2-bottling-field input:focus,
            .f2-bottling-field textarea:focus{
                outline:none;
                border-color:#087f4f;
                box-shadow:0 0 0 3px rgba(8,127,79,.08);
            }
            .f2-bottling-field input[readonly]{
                background:#f6f8f7;
                color:#334155;
            }
            .f2-bottling-meta{
                display:grid;
                grid-template-columns:repeat(4,minmax(0,1fr));
                gap:12px;
                margin:18px 0 4px;
            }
            .f2-bottling-stat{
                padding:15px;
                border:1px solid #e2e8ee;
                border-radius:16px;
                background:#fafcfb;
            }
            .f2-bottling-stat span{
                display:block;
                font-size:12px;
                color:#8795a8;
                margin-bottom:6px;
            }
            .f2-bottling-stat strong{
                font-size:16px;
                color:#25344d;
            }
            .f2-bottling-status{
                display:inline-flex;
                align-items:center;
                gap:7px;
                padding:7px 11px;
                border-radius:999px;
                background:#edf9f3;
                color:#087f4f;
                font-size:12px;
                font-weight:700;
            }
            .f2-bottling-status.draft{
                background:#f5f7f9;
                color:#66758a;
            }
            .f2-bottling-status::before{
                content:"";
                width:7px;
                height:7px;
                border-radius:50%;
                background:currentColor;
            }
            .f2-bottling-note{
                margin-top:14px;
                padding:12px 14px;
                border-radius:14px;
                background:#f7faf8;
                color:#718096;
                font-size:13px;
                line-height:1.5;
            }
            .f2-bottling-warning{
                margin-top:14px;
                padding:12px 14px;
                border-radius:14px;
                background:#fff8e8;
                color:#8a5b00;
                font-size:13px;
                line-height:1.5;
            }
            .f2-bottling-actions{
                display:flex;
                justify-content:flex-end;
                gap:10px;
                margin-top:18px;
                padding-top:18px;
                border-top:1px solid #edf1f4;
            }
            .f2-bottling-locked{
                padding:18px;
                border:1px dashed #d7e0e7;
                border-radius:16px;
                background:#fafbfc;
                color:#7b8797;
                font-size:13px;
                line-height:1.5;
            }
            @media(max-width:900px){
                .f2-bottling-meta{
                    grid-template-columns:repeat(2,minmax(0,1fr));
                }
            }
            @media(max-width:700px){
                .f2-bottling-grid,
                .f2-bottling-meta{
                    grid-template-columns:1fr;
                }
                .f2-bottling-field.full{
                    grid-column:auto;
                }
                .f2-bottling-actions{
                    justify-content:stretch;
                }
                .f2-bottling-actions .page-btn{
                    width:100%;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function calculate(sourceVolume){
        const count = number(
            el("f2BottlingActualBottles")?.value,
            0
        );

        const size = number(
            el("f2BottlingBottleSize")?.value,
            0
        );

        const output =
            count > 0 && size > 0
                ? (count * size) / 1000
                : 0;

        const source = number(
            sourceVolume,
            0
        );

        const waste =
            source > 0 && output > 0
                ? Math.max(source - output,0)
                : 0;

        if(el("f2BottlingOutputVolume")){
            el("f2BottlingOutputVolume").value =
                output ? output.toFixed(3) : "";
        }

        if(el("f2BottlingWasteVolume")){
            el("f2BottlingWasteVolume").value =
                waste ? waste.toFixed(3) : "";
        }

        if(el("f2BottlingCalcOutput")){
            el("f2BottlingCalcOutput").textContent =
                output
                    ? `${formatNumber(output,3)} L`
                    : "—";
        }

        if(el("f2BottlingCalcWaste")){
            el("f2BottlingCalcWaste").textContent =
                waste
                    ? `${formatNumber(waste,3)} L`
                    : "—";
        }
    }

    async function load(){
        const container = el("f2BottlingContainer");

        if(!container){
            return;
        }

        container.innerHTML =
            `<div class="f2-bottling-locked">Memuat data Bottling...</div>`;

        try{
            const supabase =
                await waitForSupabase();

            const batch =
                await loadBatchFromSupabase(
                    supabase
                );

            // Bottling is strictly F2-only. Never write bottling data for another stage.
            if(!isF2(batch)){
                container.innerHTML = `
                    <div class="f2-bottling-locked">
                        Bottling hanya dapat dicatat ketika
                        <strong>${escapeHtml(batch.batch_code)}</strong>
                        berada pada stage <strong>F2</strong>.
                        <br><br>
                        Stage saat ini:
                        <strong>${escapeHtml(batch.current_stage || "—")}</strong>.
                    </div>
                `;
                return;
            }

            const sourceInfo =
                await loadF2SourceVolume(
                    supabase,
                    batch
                );

            const {
                data: record,
                error
            } = await supabase
                .from("batch_bottling")
                .select(`
                    id,
                    batch_id,
                    bottling_date,
                    bottle_size_ml,
                    planned_bottles,
                    actual_bottles,
                    output_volume_l,
                    waste_volume_l,
                    variant_name,
                    operator_name,
                    notes,
                    bottling_status,
                    created_at,
                    updated_at
                `)
                .eq("batch_id",batch.id)
                .maybeSingle();

            if(error){
                throw error;
            }

            render(
                batch,
                record,
                sourceInfo
            );

        }catch(error){
            console.error(
                "MERAMU P5: gagal memuat Bottling.",
                error
            );

            container.innerHTML = `
                <div class="f2-bottling-locked">
                    Gagal memuat data Bottling:
                    ${escapeHtml(error?.message || error)}
                </div>
            `;
        }
    }

    function render(batch,record,sourceInfo){
        const container =
            el("f2BottlingContainer");

        if(!container){
            return;
        }

        const status =
            record?.bottling_status === "completed"
                ? "completed"
                : "draft";

        const plannedBottles =
            record?.planned_bottles ?? "";

        const bottleSize =
            record?.bottle_size_ml ?? 250;

        const actualBottles =
            record?.actual_bottles ?? "";

        const sourceVolume =
            number(sourceInfo?.volume,0);

        const sourceLabel =
            sourceInfo?.source || "Tidak tersedia";

        const hasSourceVolume =
            sourceVolume > 0;

        container.innerHTML = `
            <div class="f2-bottling-meta">

                <div class="f2-bottling-stat">
                    <span>Status Bottling</span>
                    <strong>
                        <span class="f2-bottling-status ${status === "draft" ? "draft" : ""}">
                            ${status === "completed" ? "Selesai dicatat" : "Belum dicatat"}
                        </span>
                    </strong>
                </div>

                <div class="f2-bottling-stat">
                    <span>Volume F2 / sumber</span>
                    <strong>
                        ${hasSourceVolume ? formatNumber(sourceVolume,3) + " L" : "Belum ada"}
                    </strong>
                </div>

                <div class="f2-bottling-stat">
                    <span>Sumber Volume</span>
                    <strong>${escapeHtml(sourceLabel)}</strong>
                </div>

                <div class="f2-bottling-stat">
                    <span>Output Bottling</span>
                    <strong id="f2BottlingCalcOutput">
                        ${record?.output_volume_l
                            ? formatNumber(record.output_volume_l,3) + " L"
                            : "—"}
                    </strong>
                </div>

            </div>

            ${
                !hasSourceVolume
                    ? `
                        <div class="f2-bottling-warning">
                            Volume sumber F2 belum tersedia.
                            Catat volume F2 terlebih dahulu sebelum menyimpan Bottling.
                        </div>
                    `
                    : ""
            }

            <div class="f2-bottling-grid">

                <div class="f2-bottling-field">
                    <label for="f2BottlingDate">
                        Tanggal & Waktu Bottling
                    </label>
                    <input
                        id="f2BottlingDate"
                        type="datetime-local"
                        value="${escapeHtml(getLocalDateTimeValue(record?.bottling_date))}"
                        required
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingVariant">
                        Varian / Flavor
                    </label>
                    <input
                        id="f2BottlingVariant"
                        type="text"
                        placeholder="Contoh: Original"
                        value="${escapeHtml(record?.variant_name || "")}"
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingBottleSize">
                        Ukuran Botol (ml)
                    </label>
                    <input
                        id="f2BottlingBottleSize"
                        type="number"
                        min="1"
                        step="1"
                        value="${escapeHtml(bottleSize)}"
                        required
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingPlannedBottles">
                        Rencana Botol
                    </label>
                    <input
                        id="f2BottlingPlannedBottles"
                        type="number"
                        min="0"
                        step="1"
                        value="${escapeHtml(plannedBottles)}"
                        placeholder="Opsional"
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingActualBottles">
                        Actual Botol
                    </label>
                    <input
                        id="f2BottlingActualBottles"
                        type="number"
                        min="1"
                        step="1"
                        value="${escapeHtml(actualBottles)}"
                        required
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingOperator">
                        Operator
                    </label>
                    <input
                        id="f2BottlingOperator"
                        type="text"
                        placeholder="Nama operator"
                        value="${escapeHtml(record?.operator_name || "")}"
                        required
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingOutputVolume">
                        Output Volume (L)
                    </label>
                    <input
                        id="f2BottlingOutputVolume"
                        type="number"
                        step="0.001"
                        value="${record?.output_volume_l ?? ""}"
                        readonly
                    >
                </div>

                <div class="f2-bottling-field">
                    <label for="f2BottlingWasteVolume">
                        Waste Volume (L)
                    </label>
                    <input
                        id="f2BottlingWasteVolume"
                        type="number"
                        step="0.001"
                        value="${record?.waste_volume_l ?? ""}"
                        readonly
                    >
                </div>

                <div class="f2-bottling-field full">
                    <label for="f2BottlingNotes">
                        Catatan Bottling
                    </label>
                    <textarea
                        id="f2BottlingNotes"
                        rows="3"
                        placeholder="Catatan proses pembotolan..."
                    >${escapeHtml(record?.notes || "")}</textarea>
                </div>

            </div>

            <div class="f2-bottling-note">
                Output dihitung otomatis dari
                <strong>Actual Botol × Ukuran Botol</strong>.
                Waste dihitung dari volume sumber F2 dikurangi output.
                Menyimpan Bottling <strong>tidak</strong> memindahkan batch ke Harvest.
                Perpindahan dilakukan setelah QC F2 = PASS.
            </div>

            <div class="f2-bottling-actions">
                <button
                    id="saveF2BottlingBtn"
                    type="button"
                    class="page-btn primary"
                    ${!hasSourceVolume ? "disabled" : ""}
                >
                    <i data-lucide="save"></i>
                    <span>
                        ${status === "completed"
                            ? "Perbarui Bottling"
                            : "Simpan Bottling"}
                    </span>
                </button>
            </div>
        `;

        ["f2BottlingBottleSize","f2BottlingActualBottles"]
            .forEach(id => {
                el(id)?.addEventListener(
                    "input",
                    () => calculate(sourceVolume)
                );
            });

        el("saveF2BottlingBtn")
            ?.addEventListener(
                "click",
                () => save(sourceVolume)
            );

        calculate(sourceVolume);

        if(window.lucide){
            lucide.createIcons();
        }
    }

    async function save(sourceVolume){
        const button =
            el("saveF2BottlingBtn");

        try{
            const supabase =
                await waitForSupabase();

            const batch =
                await loadBatchFromSupabase(
                    supabase
                );

            if(!isF2(batch)){
                throw new Error(
                    "Batch sudah bukan F2. Refresh halaman."
                );
            }

            const dateRaw =
                el("f2BottlingDate")?.value;

            const bottleSize =
                number(
                    el("f2BottlingBottleSize")?.value,
                    0
                );

            const plannedBottlesRaw =
                el("f2BottlingPlannedBottles")?.value;

            const actualBottles =
                number(
                    el("f2BottlingActualBottles")?.value,
                    0
                );

            const operator =
                el("f2BottlingOperator")
                    ?.value
                    ?.trim();

            const variant =
                el("f2BottlingVariant")
                    ?.value
                    ?.trim() ||
                null;

            const notes =
                el("f2BottlingNotes")
                    ?.value
                    ?.trim() ||
                null;

            const source =
                number(sourceVolume,0);

            const outputVolume =
                (actualBottles * bottleSize) / 1000;

            if(
                !dateRaw ||
                bottleSize <= 0 ||
                actualBottles <= 0 ||
                !operator
            ){
                throw new Error(
                    "Tanggal, ukuran botol, actual botol, dan operator wajib diisi."
                );
            }

            if(source <= 0){
                throw new Error(
                    "Volume sumber F2 belum tersedia."
                );
            }

            if(outputVolume <= 0){
                throw new Error(
                    "Output bottling harus lebih dari 0 L."
                );
            }

            if(outputVolume > source + 0.0001){
                throw new Error(
                    `Output ${formatNumber(outputVolume,3)} L ` +
                    `melebihi volume sumber ${formatNumber(source,3)} L.`
                );
            }

            if(
                plannedBottlesRaw !== "" &&
                number(plannedBottlesRaw,0) < 0
            ){
                throw new Error(
                    "Rencana botol tidak boleh negatif."
                );
            }

            if(button){
                button.disabled = true;
                button.innerHTML =
                    "<span>Menyimpan...</span>";
            }

            const wasteVolume =
                Math.max(
                    source - outputVolume,
                    0
                );

            const payload = {
                batch_id: batch.id,
                bottling_date:
                    new Date(dateRaw).toISOString(),
                bottle_size_ml:
                    bottleSize,
                planned_bottles:
                    plannedBottlesRaw === ""
                        ? null
                        : number(plannedBottlesRaw,0),
                actual_bottles:
                    actualBottles,
                output_volume_l:
                    Number(outputVolume.toFixed(3)),
                waste_volume_l:
                    Number(wasteVolume.toFixed(3)),
                variant_name:
                    variant,
                operator_name:
                    operator,
                notes:
                    notes,
                bottling_status:
                    "completed",
                updated_at:
                    new Date().toISOString()
            };

            const {
                data,
                error
            } = await supabase
                .from("batch_bottling")
                .upsert(
                    payload,
                    {onConflict:"batch_id"}
                )
                .select(`
                    id,
                    batch_id,
                    bottling_date,
                    bottle_size_ml,
                    planned_bottles,
                    actual_bottles,
                    output_volume_l,
                    waste_volume_l,
                    variant_name,
                    operator_name,
                    notes,
                    bottling_status,
                    created_at,
                    updated_at
                `)
                .single();

            if(error){
                throw error;
            }

            alert(
                `Bottling ${batch.batch_code} berhasil disimpan.`
            );

            await load();

        }catch(error){
            console.error(
                "MERAMU P5: save Bottling gagal.",
                error
            );

            alert(
                "Bottling gagal disimpan.\n\n" +
                (error?.message || error)
            );

        }finally{
            if(button){
                button.disabled = false;
            }

            if(window.lucide){
                lucide.createIcons();
            }
        }
    }

    function init(){
        injectStyles();
        load();
    }

    window.MERAMUF2Bottling = {
        init,
        load,
        save
    };

    if(document.readyState === "loading"){
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    }else{
        init();
    }

})();
