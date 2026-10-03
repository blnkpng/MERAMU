/* =========================================================
   MERAMU P5 — F2 / BOTTLING
   - One bottling record per production batch
   - F2 remains the current batch stage until QC F2 PASS
   - Output volume is derived from bottle count x bottle size
   ========================================================= */

(function(){
    "use strict";

    const STYLE_ID = "meramuF2BottlingStyles";

    function el(id){ return document.getElementById(id); }

    function escapeHtml(value){
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function number(value, fallback = 0){
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function formatNumber(value, decimals = 2){
        const n = Number(value);
        if(!Number.isFinite(n)) return "—";
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        }).format(n);
    }

    function getLocalDateTimeValue(value){
        const date = value ? new Date(value) : new Date();
        if(Number.isNaN(date.getTime())) return "";
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60000);
        return local.toISOString().slice(0,16);
    }

    async function waitForSupabase(){
        for(let i=0;i<50;i++){
            if(window.supabaseClient) return window.supabaseClient;
            await new Promise(resolve => setTimeout(resolve,100));
        }
        throw new Error("Supabase belum siap.");
    }

    function injectStyles(){
        if(document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .f2-bottling-card{margin-top:24px;}
            .f2-bottling-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
            .f2-bottling-field{display:flex;flex-direction:column;gap:8px;}
            .f2-bottling-field.full{grid-column:1/-1;}
            .f2-bottling-field label{font-size:13px;font-weight:600;color:#44546a;}
            .f2-bottling-field input,.f2-bottling-field textarea{width:100%;border:1px solid #dbe3ea;border-radius:14px;padding:13px 14px;font:inherit;background:#fff;box-sizing:border-box;}
            .f2-bottling-field input:focus,.f2-bottling-field textarea:focus{outline:none;border-color:#087f4f;box-shadow:0 0 0 3px rgba(8,127,79,.08);}
            .f2-bottling-field input[readonly]{background:#f6f8f7;color:#334155;}
            .f2-bottling-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0 4px;}
            .f2-bottling-stat{padding:15px;border:1px solid #e2e8ee;border-radius:16px;background:#fafcfb;}
            .f2-bottling-stat span{display:block;font-size:12px;color:#8795a8;margin-bottom:6px;}
            .f2-bottling-stat strong{font-size:16px;color:#25344d;}
            .f2-bottling-status{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;background:#edf9f3;color:#087f4f;font-size:12px;font-weight:700;}
            .f2-bottling-status.draft{background:#f5f7f9;color:#66758a;}
            .f2-bottling-status::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;}
            .f2-bottling-note{margin-top:14px;padding:12px 14px;border-radius:14px;background:#f7faf8;color:#718096;font-size:13px;line-height:1.5;}
            .f2-bottling-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:18px;border-top:1px solid #edf1f4;}
            .f2-bottling-locked{padding:18px;border:1px dashed #d7e0e7;border-radius:16px;background:#fafbfc;color:#7b8797;font-size:13px;}
            @media(max-width:700px){
                .f2-bottling-grid,.f2-bottling-meta{grid-template-columns:1fr;}
                .f2-bottling-field.full{grid-column:auto;}
                .f2-bottling-actions{justify-content:stretch;}
                .f2-bottling-actions .page-btn{width:100%;}
            }
        `;
        document.head.appendChild(style);
    }

    function getBatch(){
        try{
            if(typeof getCurrentBatch === "function") return getCurrentBatch();
        }catch(error){
            console.warn("MERAMU: getCurrentBatch gagal.", error);
        }
        return null;
    }

    function isF2(batch){
        return String(batch?.current_stage || batch?.stage || "").trim().toLowerCase().includes("f2");
    }

    function calculate(){
        const count = number(el("f2BottlingActualBottles")?.value, 0);
        const size = number(el("f2BottlingBottleSize")?.value, 0);
        const output = count > 0 && size > 0 ? (count * size) / 1000 : 0;
        const source = number(el("f2BottlingSourceVolume")?.value, 0);
        const waste = source > 0 && output > 0 ? Math.max(source - output, 0) : 0;
        if(el("f2BottlingOutputVolume")) el("f2BottlingOutputVolume").value = output ? output.toFixed(3) : "";
        if(el("f2BottlingWasteVolume")) el("f2BottlingWasteVolume").value = waste ? waste.toFixed(3) : "";
        if(el("f2BottlingCalcOutput")) el("f2BottlingCalcOutput").textContent = output ? `${formatNumber(output,3)} L` : "—";
        if(el("f2BottlingCalcWaste")) el("f2BottlingCalcWaste").textContent = waste ? `${formatNumber(waste,3)} L` : "—";
    }

    async function load(){
        const container = el("f2BottlingContainer");
        if(!container) return;

        const batch = getBatch();
        if(!batch?.id){
            container.innerHTML = `<div class="f2-bottling-locked">Batch belum tersedia.</div>`;
            return;
        }

        const f2 = isF2(batch);
        const sourceVolume = number(batch.actual_volume ?? batch.planned_volume, 0);

        try{
            const supabase = await waitForSupabase();
            const {data,error} = await supabase
                .from("batch_bottling")
                .select("id,batch_id,bottling_date,bottle_size_ml,planned_bottles,actual_bottles,output_volume_l,waste_volume_l,variant_name,operator_name,notes,bottling_status,created_at,updated_at")
                .eq("batch_id", batch.id)
                .maybeSingle();
            if(error) throw error;

            render(batch, data, sourceVolume, f2);
        }catch(error){
            console.error("MERAMU: gagal mengambil data F2/Bottling", error);
            render(batch, null, sourceVolume, f2, error.message);
        }
    }

    function render(batch, record, sourceVolume, f2, errorMessage){
        const container = el("f2BottlingContainer");
        if(!container) return;

        if(errorMessage){
            container.innerHTML = `<div class="f2-bottling-locked">Gagal memuat data bottling: ${escapeHtml(errorMessage)}</div>`;
            return;
        }

        if(!f2){
            container.innerHTML = `<div class="f2-bottling-locked">Bagian Bottling aktif ketika batch sudah berada di F2.</div>`;
            return;
        }

        const status = record?.bottling_status === "completed" ? "completed" : "draft";
        const plannedBottles = record?.planned_bottles ?? "";
        const bottleSize = record?.bottle_size_ml ?? 250;
        const actualBottles = record?.actual_bottles ?? "";

        container.innerHTML = `
            <div class="f2-bottling-meta">
                <div class="f2-bottling-stat"><span>Status Bottling</span><strong><span class="f2-bottling-status ${status === "draft" ? "draft" : ""}">${status === "completed" ? "Selesai dicatat" : "Belum dicatat"}</span></strong></div>
                <div class="f2-bottling-stat"><span>Volume F2 / sumber</span><strong>${formatNumber(sourceVolume,3)} L</strong></div>
                <div class="f2-bottling-stat"><span>Output Bottling</span><strong id="f2BottlingCalcOutput">${record?.output_volume_l ? formatNumber(record.output_volume_l,3)+" L" : "—"}</strong></div>
            </div>

            <div class="f2-bottling-grid">
                <div class="f2-bottling-field">
                    <label for="f2BottlingDate">Tanggal & Waktu Bottling</label>
                    <input id="f2BottlingDate" type="datetime-local" value="${escapeHtml(getLocalDateTimeValue(record?.bottling_date))}" required>
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingVariant">Varian / Flavor</label>
                    <input id="f2BottlingVariant" type="text" placeholder="Contoh: Original" value="${escapeHtml(record?.variant_name || "")}">
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingBottleSize">Ukuran Botol (ml)</label>
                    <input id="f2BottlingBottleSize" type="number" min="1" step="1" value="${escapeHtml(bottleSize)}" required>
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingPlannedBottles">Rencana Botol</label>
                    <input id="f2BottlingPlannedBottles" type="number" min="0" step="1" value="${escapeHtml(plannedBottles)}" placeholder="Opsional">
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingActualBottles">Actual Botol</label>
                    <input id="f2BottlingActualBottles" type="number" min="1" step="1" value="${escapeHtml(actualBottles)}" required>
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingOperator">Operator</label>
                    <input id="f2BottlingOperator" type="text" placeholder="Nama operator" value="${escapeHtml(record?.operator_name || "")}" required>
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingOutputVolume">Output Volume (L)</label>
                    <input id="f2BottlingOutputVolume" type="number" step="0.001" value="${record?.output_volume_l ?? ""}" readonly>
                </div>
                <div class="f2-bottling-field">
                    <label for="f2BottlingWasteVolume">Waste Volume (L)</label>
                    <input id="f2BottlingWasteVolume" type="number" step="0.001" value="${record?.waste_volume_l ?? ""}" readonly>
                </div>
                <div class="f2-bottling-field full">
                    <label for="f2BottlingNotes">Catatan Bottling</label>
                    <textarea id="f2BottlingNotes" rows="3" placeholder="Catatan proses pembotolan...">${escapeHtml(record?.notes || "")}</textarea>
                </div>
            </div>

            <div class="f2-bottling-note">
                Output dihitung otomatis dari <strong>Actual Botol × Ukuran Botol</strong>. Waste dihitung dari volume F2/sumber dikurangi output bottling.
            </div>

            <div class="f2-bottling-actions">
                <button id="saveF2BottlingBtn" type="button" class="page-btn primary">
                    <i data-lucide="save"></i><span>${status === "completed" ? "Perbarui Bottling" : "Simpan & Selesaikan Bottling"}</span>
                </button>
            </div>
        `;

        ["f2BottlingBottleSize","f2BottlingActualBottles"].forEach(id => {
            el(id)?.addEventListener("input", calculate);
        });
        el("saveF2BottlingBtn")?.addEventListener("click", save);
        calculate();
        if(window.lucide) lucide.createIcons();
    }

    async function save(){
        const batch = getBatch();
        if(!batch?.id) return alert("Batch tidak ditemukan.");
        if(!isF2(batch)) return alert("Batch belum berada di F2.");

        const dateRaw = el("f2BottlingDate")?.value;
        const bottleSize = number(el("f2BottlingBottleSize")?.value, 0);
        const plannedBottlesRaw = el("f2BottlingPlannedBottles")?.value;
        const actualBottles = number(el("f2BottlingActualBottles")?.value, 0);
        const operator = el("f2BottlingOperator")?.value?.trim();
        const variant = el("f2BottlingVariant")?.value?.trim() || null;
        const notes = el("f2BottlingNotes")?.value?.trim() || null;
        const sourceVolume = number(batch.actual_volume ?? batch.planned_volume, 0);
        const outputVolume = (actualBottles * bottleSize) / 1000;
        const wasteVolume = Math.max(sourceVolume - outputVolume, 0);

        if(!dateRaw || bottleSize <= 0 || actualBottles <= 0 || !operator){
            return alert("Tanggal, ukuran botol, actual botol, dan operator wajib diisi.");
        }
        if(sourceVolume > 0 && outputVolume > sourceVolume + 0.0001){
            return alert("Output bottling melebihi volume F2/sumber. Periksa jumlah botol dan ukuran botol.");
        }

        const button = el("saveF2BottlingBtn");
        if(button){
            button.disabled = true;
            button.innerHTML = `<span>Menyimpan...</span>`;
        }

        try{
            const supabase = await waitForSupabase();
            const payload = {
                batch_id: batch.id,
                bottling_date: new Date(dateRaw).toISOString(),
                bottle_size_ml: bottleSize,
                planned_bottles: plannedBottlesRaw === "" ? null : number(plannedBottlesRaw,0),
                actual_bottles: actualBottles,
                output_volume_l: Number(outputVolume.toFixed(3)),
                waste_volume_l: Number(wasteVolume.toFixed(3)),
                variant_name: variant,
                operator_name: operator,
                notes,
                bottling_status: "completed",
                updated_at: new Date().toISOString()
            };

            const {data,error} = await supabase
                .from("batch_bottling")
                .upsert(payload,{onConflict:"batch_id"})
                .select("id,batch_id,bottling_date,bottle_size_ml,planned_bottles,actual_bottles,output_volume_l,waste_volume_l,variant_name,operator_name,notes,bottling_status,created_at,updated_at")
                .single();

            if(error) throw error;

            alert("Data F2 / Bottling berhasil disimpan.");
            render(batch,data,sourceVolume,true);
            if(typeof window.loadBatchDetail === "function") window.loadBatchDetail();
        }catch(error){
            console.error("MERAMU: save F2/Bottling gagal",error);
            alert("F2 / Bottling gagal disimpan.\n\n" + (error.message || error));
            if(button){
                button.disabled = false;
                button.innerHTML = `<i data-lucide="save"></i><span>Simpan & Selesaikan Bottling</span>`;
                if(window.lucide) lucide.createIcons();
            }
        }
    }

    function init(){
        injectStyles();
        load();
    }

    window.MERAMUF2Bottling = { init, load, save };

    document.addEventListener("DOMContentLoaded",init);
})();
