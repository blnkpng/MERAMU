(function(){
    "use strict";

    const $ = id => document.getElementById(id);

    function supabase(){
        if(!window.supabaseClient){
            throw new Error("Supabase client belum tersedia.");
        }
        return window.supabaseClient;
    }

    function escapeHtml(value){
        return String(value ?? "")
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");
    }

    function formatDate(value){
        if(!value) return "—";
        const d = new Date(value);
        if(Number.isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric"}).format(d);
    }

    function formatVolume(value){
        const n = Number(value);
        if(!Number.isFinite(n)) return "—";
        return `${new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(n)} L`;
    }

    async function loadHarvest(){
        const state = $("harvestState");
        const list = $("harvestList");
        state.textContent = "Memuat data Harvest...";
        list.innerHTML = "";

        try{
            const {data,error} = await supabase()
                .from("batches")
                .select("id,batch_code,product_id,production_date,target_date,current_stage,status,planned_volume,actual_volume,harvest_ready_at,actual_harvest_at,harvest_volume,harvest_operator")
                .eq("current_stage","harvest")
                .order("actual_harvest_at",{ascending:false,nullsFirst:true})
                .order("target_date",{ascending:true});

            if(error) throw error;

            const rows = Array.isArray(data) ? data : [];
            $("harvestCount").textContent = `${rows.length} batch`;

            const ready = rows.filter(row => !row.actual_harvest_at).length;
            const completed = rows.filter(row => !!row.actual_harvest_at).length;
            const totalVolume = rows.reduce((sum,row)=>sum + (Number(row.harvest_volume)||0),0);
            $("readyCount").textContent = String(ready);
            $("completedCount").textContent = String(completed);
            $("harvestVolumeTotal").textContent = formatVolume(totalVolume);

            if(!rows.length){
                state.textContent = "Tidak ada batch pada stage Harvest.";
                list.innerHTML = `<div class="harvest-empty">Belum ada batch READY HARVEST.</div>`;
                if(window.lucide) lucide.createIcons();
                return;
            }

            state.textContent = "Batch pada stage Harvest. Buka detail untuk mencatat Actual Harvest.";
            list.innerHTML = rows.map(row => {
                const done = !!row.actual_harvest_at;
                return `
                    <article class="harvest-row">
                        <div>
                            <div class="harvest-row-code">${escapeHtml(row.batch_code)}</div>
                            <div class="harvest-row-product">Product ID: ${escapeHtml(row.product_id || "—")}</div>
                        </div>
                        <div class="harvest-cell">
                            <span>Target Panen</span>
                            <strong>${formatDate(row.target_date)}</strong>
                        </div>
                        <div class="harvest-cell">
                            <span>Volume Aktual</span>
                            <strong>${done ? formatVolume(row.harvest_volume) : "—"}</strong>
                        </div>
                        <div class="harvest-cell">
                            <span>Status</span>
                            <strong><span class="harvest-status ${done ? "done" : "ready"}">${done ? "Sudah Panen" : "READY HARVEST"}</span></strong>
                        </div>
                        <a class="harvest-open" href="/pages/batch-detail.html?id=${encodeURIComponent(row.batch_code)}">
                            <i data-lucide="external-link"></i>
                            ${done ? "Lihat Detail" : "Catat Panen"}
                        </a>
                    </article>
                `;
            }).join("");

            if(window.lucide) lucide.createIcons();
        }
        catch(error){
            console.error("MERAMU Harvest page:",error);
            state.textContent = "Gagal memuat data Harvest.";
            list.innerHTML = `<div class="harvest-error">${escapeHtml(error?.message || "Terjadi kesalahan saat mengambil data Harvest.")}</div>`;
        }
    }

    document.addEventListener("DOMContentLoaded",()=>{
        $("refreshHarvestBtn")?.addEventListener("click",loadHarvest);
        loadHarvest();
    });

})();
