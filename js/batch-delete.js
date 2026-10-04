/* =========================================================
   MERAMU BATCH DELETE — D1
   Safe permanent delete for batches with no dependencies.
========================================================= */
(function(){
    "use strict";

    function getBatchCode(){
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || params.get("batch") || params.get("code") || "";
    }

    function getModal(){ return document.getElementById("deleteBatchModal"); }

    function openDeleteBatchModal(){
        const modal = getModal();
        if(!modal) return;

        const code = getBatchCode();
        const codeEl = document.getElementById("deleteBatchCode");
        const confirmEl = document.getElementById("deleteBatchConfirm");
        const box = document.getElementById("deleteBatchDependencyBox");

        if(codeEl) codeEl.textContent = code || "—";
        if(confirmEl) confirmEl.value = "";
        if(box){ box.hidden = true; box.innerHTML = ""; }

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");

        setTimeout(() => {
            if(confirmEl) confirmEl.focus();
        }, 100);

        if(window.lucide) lucide.createIcons();
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

    function showBlockers(result){
        const box = document.getElementById("deleteBatchDependencyBox");
        if(!box) return;

        const blockers = Array.isArray(result?.blockers) ? result.blockers : [];
        const lines = blockers.map(item => {
            const table = item.table || "data terkait";
            const count = Number(item.count || 0);
            return `<li><strong>${table}</strong>: ${count} data</li>`;
        }).join("");

        box.innerHTML = `
            <strong>Batch belum bisa dihapus.</strong>
            <p>Hapus atau selesaikan data proses berikut terlebih dahulu:</p>
            <ul>${lines || "<li>Ada data terkait yang masih digunakan.</li>"}</ul>
            <small>Untuk menjaga histori produksi, MERAMU tidak akan menghapus data turunan secara otomatis.</small>
        `;
        box.hidden = false;
    }

    async function deleteBatch(event){
        event.preventDefault();

        const code = getBatchCode();
        const confirmEl = document.getElementById("deleteBatchConfirm");
        const typed = (confirmEl?.value || "").trim().toUpperCase();

        if(typed !== "HAPUS"){
            alert("Ketik HAPUS untuk mengonfirmasi penghapusan.");
            confirmEl?.focus();
            return;
        }

        const finalConfirm = window.confirm(
            `Hapus batch ${code}?\n\nTindakan ini permanen dan tidak bisa dibatalkan.`
        );
        if(!finalConfirm) return;

        const submitBtn = document.getElementById("confirmDeleteBatchBtn");
        if(submitBtn){
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent.trim();
            submitBtn.innerHTML = '<i data-lucide="loader-circle"></i> Menghapus...';
            if(window.lucide) lucide.createIcons();
        }

        try{
            const supabase = await waitForSupabase();

            const { data: batch, error: findError } = await supabase
                .from("batches")
                .select("id,batch_code")
                .eq("batch_code", code)
                .maybeSingle();

            if(findError) throw findError;
            if(!batch) throw new Error(`Batch ${code} tidak ditemukan.`);

            const { data, error } = await supabase.rpc("delete_meramu_batch", {
                p_batch_id: batch.id
            });

            if(error) throw error;

            console.log("MERAMU: Delete Batch result", data);

            if(data?.ok === false){
                showBlockers(data);
                alert(data.message || "Batch belum bisa dihapus karena masih memiliki data terkait.");
                return;
            }

            closeDeleteBatchModal();
            alert(`Batch ${code} berhasil dihapus.`);
            window.location.href = "fermentation-calendar.html";

        }catch(error){
            console.error("MERAMU: Gagal menghapus batch.", error);
            alert("Gagal menghapus batch:\n" + (error.message || "Terjadi kesalahan."));
        }finally{
            if(submitBtn){
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="trash-2"></i> Hapus Permanen';
                if(window.lucide) lucide.createIcons();
            }
        }
    }

    function bindEvents(){
        const button = document.getElementById("deleteBatch");
        if(button) button.addEventListener("click", openDeleteBatchModal);

        const form = document.getElementById("deleteBatchForm");
        if(form) form.addEventListener("submit", deleteBatch);

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
