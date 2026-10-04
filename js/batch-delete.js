/* =========================================================
   MERAMU PRODUCTION DELETE — D1 FINAL
   Delete the entire production tree from Production/Batch Master.
   Master data (Product, Recipe, Version, Ingredients, Units) is never deleted.
========================================================= */
(function(){
    "use strict";

    let previewData = null;

    function getBatchCode(){
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || params.get("batch") || params.get("code") || "";
    }

    function getModal(){ return document.getElementById("deleteBatchModal"); }

    function escapeHtml(value){
        return String(value ?? "")
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");
    }

    function number(value){
        return Number(value || 0).toLocaleString("id-ID");
    }

    function renderPreview(result){
        const box = document.getElementById("deleteBatchDependencyBox");
        if(!box) return;

        const d = result?.will_delete || {};
        const rows = [
            ["Production Batch", d.production_batches],
            ["Fermentation Logs", d.fermentation_logs],
            ["Quality Checks", d.quality_checks],
            ["F2 Bottling", d.batch_bottling],
            ["Allocation", d.batch_allocations],
            ["Harvest Allocation", d.harvest_allocations],
            ["Legacy Bottling", d.bottling_batches],
            ["Finished Batch", d.finished_batches],
            ["Finished Units", d.finished_units]
        ].filter(row => Number(row[1] || 0) > 0);

        if(Number(d.other_direct_batch_dependencies || 0) > 0){
            rows.push(["Data produksi terkait lainnya", d.other_direct_batch_dependencies]);
        }

        const rowsHtml = rows.length
            ? rows.map(([label,count]) => `
                <li>
                    <span>${escapeHtml(label)}</span>
                    <strong>${number(count)}</strong>
                </li>
            `).join("")
            : `<li><span>Data turunan</span><strong>0</strong></li>`;

        box.innerHTML = `
            <div class="batch-delete-preview-title">Data yang akan ikut dihapus</div>
            <ul class="batch-delete-preview-list">${rowsHtml}</ul>
            <div class="batch-delete-preview-total">
                <span>Total data</span>
                <strong>${number(d.total_rows)}</strong>
            </div>
            <div class="batch-delete-preview-note">
                Product, Recipe, Recipe Version, Ingredient, Unit, dan master data lainnya <strong>tidak ikut dihapus</strong>.
            </div>
        `;
        box.hidden = false;
    }

    function showErrorBox(message){
        const box = document.getElementById("deleteBatchDependencyBox");
        if(!box) return;
        box.innerHTML = `
            <div class="batch-delete-preview-error">
                <strong>Tidak dapat memuat data produksi.</strong>
                <p>${escapeHtml(message || "Terjadi kesalahan saat membaca data terkait.")}</p>
            </div>
        `;
        box.hidden = false;
    }

    function openDeleteBatchModal(){
        const modal = getModal();
        if(!modal) return;

        const code = getBatchCode();
        const codeEl = document.getElementById("deleteBatchCode");
        const confirmEl = document.getElementById("deleteBatchConfirm");
        const confirmCodeEl = document.getElementById("deleteBatchConfirmCode");
        const box = document.getElementById("deleteBatchDependencyBox");
        const submitBtn = document.getElementById("confirmDeleteBatchBtn");

        previewData = null;
        if(codeEl) codeEl.textContent = code || "—";
        if(confirmEl) confirmEl.value = "";
        if(confirmCodeEl) confirmCodeEl.textContent = code || "BATCH";
        if(box){
            box.hidden = false;
            box.innerHTML = '<div class="batch-delete-preview-loading">Memeriksa seluruh data produksi...</div>';
        }
        if(submitBtn) submitBtn.disabled = true;

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");

        setTimeout(() => {
            if(confirmEl) confirmEl.focus();
        }, 100);

        if(window.lucide) lucide.createIcons();
        loadDeletePreview();
    }

    function closeDeleteBatchModal(){
        const modal = getModal();
        if(!modal) return;
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    }

    async function waitForSupabase(){
        for(let i=0;i<50;i++){
            if(window.supabaseClient) return window.supabaseClient;
            await new Promise(r => setTimeout(r,100));
        }
        throw new Error("Supabase client belum tersedia.");
    }

    async function findBatch(){
        const supabase = await waitForSupabase();
        const code = getBatchCode();
        const { data: batch, error } = await supabase
            .from("batches")
            .select("id,batch_code,current_stage,status")
            .eq("batch_code", code)
            .maybeSingle();

        if(error) throw error;
        if(!batch) throw new Error(`Produksi ${code} tidak ditemukan.`);
        return { supabase, batch };
    }

    async function loadDeletePreview(){
        const submitBtn = document.getElementById("confirmDeleteBatchBtn");
        try{
            const { supabase, batch } = await findBatch();
            const { data, error } = await supabase.rpc("delete_meramu_production", {
                p_batch_id: batch.id,
                p_execute: false
            });

            if(error) throw error;
            if(data?.ok === false) throw new Error(data.message || "Preview penghapusan gagal.");

            previewData = data;
            renderPreview(data);
            if(submitBtn) submitBtn.disabled = false;
        }catch(error){
            console.error("MERAMU: Gagal membaca preview delete production.", error);
            previewData = null;
            showErrorBox(error.message || "Terjadi kesalahan.");
            if(submitBtn) submitBtn.disabled = true;
        }
    }

    async function deleteProduction(event){
        event.preventDefault();

        const code = getBatchCode();
        const confirmEl = document.getElementById("deleteBatchConfirm");
        const typed = (confirmEl?.value || "").trim().toUpperCase();

        if(!previewData){
            alert("Data produksi belum selesai diperiksa. Silakan tunggu sebentar.");
            return;
        }

        if(typed !== `HAPUS ${code}`.toUpperCase()){
            alert(`Ketik HAPUS ${code} untuk mengonfirmasi penghapusan.`);
            confirmEl?.focus();
            return;
        }

        const submitBtn = document.getElementById("confirmDeleteBatchBtn");
        if(submitBtn){
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent.trim();
            submitBtn.innerHTML = '<i data-lucide="loader-circle"></i> Menghapus...';
            if(window.lucide) lucide.createIcons();
        }

        try{
            const { supabase, batch } = await findBatch();
            const { data, error } = await supabase.rpc("delete_meramu_production", {
                p_batch_id: batch.id,
                p_execute: true
            });

            if(error) throw error;

            console.log("MERAMU: Delete Production result", data);

            if(data?.ok === false){
                throw new Error(data.message || "Produksi belum dapat dihapus.");
            }

            closeDeleteBatchModal();
            alert(`Produksi ${code} berhasil dihapus beserta seluruh data prosesnya.`);
            window.location.href = "production.html";

        }catch(error){
            console.error("MERAMU: Gagal menghapus produksi.", error);
            alert("Gagal menghapus produksi:\n" + (error.message || "Terjadi kesalahan."));
        }finally{
            if(submitBtn){
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="trash-2"></i> Hapus Seluruh Produksi';
                if(window.lucide) lucide.createIcons();
            }
        }
    }

    function bindEvents(){
        const button = document.getElementById("deleteBatch");
        if(button) button.addEventListener("click", openDeleteBatchModal);

        const form = document.getElementById("deleteBatchForm");
        if(form) form.addEventListener("submit", deleteProduction);

        document.addEventListener("click", event => {
            if(event.target.closest("[data-close-delete-modal]")) closeDeleteBatchModal();
        });

        document.addEventListener("keydown", event => {
            if(event.key === "Escape") closeDeleteBatchModal();
        });
    }

    window.openDeleteBatchModal = openDeleteBatchModal;
    window.closeDeleteBatchModal = closeDeleteBatchModal;

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", bindEvents);
    }else{
        bindEvents();
    }
})();
