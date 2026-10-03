(function(){
    "use strict";

    const $ = id => document.getElementById(id);
    let batches = [];
    let selected = null;

    function client(){
        if(!window.supabaseClient) throw new Error("Supabase client belum tersedia.");
        return window.supabaseClient;
    }

    function escapeHtml(value){
        return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
    }

    function number(value){
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }

    function fmt(value, max=3){
        return new Intl.NumberFormat("id-ID",{maximumFractionDigits:max}).format(number(value));
    }

    function fmtDate(value){
        if(!value) return "—";
        const d = new Date(value);
        if(Number.isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric"}).format(d);
    }

    function localDateTime(){
        const d = new Date();
        const pad = n => String(n).padStart(2,"0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    async function loadBatches(){
        const sb = client();
        $("allocationState").textContent = "Memuat batch Harvest...";
        const {data,error} = await sb.from("batches")
            .select("id,batch_code,product_id,production_date,target_date,current_stage,status,harvest_volume,actual_harvest_at")
            .eq("current_stage","harvest")
            .not("actual_harvest_at","is",null)
            .order("actual_harvest_at",{ascending:false});
        if(error) throw error;
        const rows = Array.isArray(data) ? data : [];
        const ids = rows.map(r=>r.id);
        let allocations = [];
        if(ids.length){
            const res = await sb.from("batch_allocations").select("batch_id,allocated_volume,status").in("batch_id",ids);
            if(res.error) throw res.error;
            allocations = res.data || [];
        }
        batches = rows.map(row=>{
            const used = allocations.filter(a=>a.batch_id===row.id && a.status!=="cancelled").reduce((s,a)=>s+number(a.allocated_volume),0);
            return {...row, allocated_volume:used, remaining_volume:Math.max(number(row.harvest_volume)-used,0)};
        });
        renderBatches();
        renderKpis();
        if(selected){
            const fresh = batches.find(b=>b.id===selected.id);
            if(fresh) selectBatch(fresh.id,false);
        }
    }

    function renderKpis(){
        const harvest = batches.reduce((s,b)=>s+number(b.harvest_volume),0);
        const used = batches.reduce((s,b)=>s+number(b.allocated_volume),0);
        const remaining = Math.max(harvest-used,0);
        $("allocationReady").textContent = String(batches.filter(b=>b.remaining_volume>0).length);
        $("allocationHarvestVolume").textContent = `${fmt(harvest)} L`;
        $("allocationUsedVolume").textContent = `${fmt(used)} L`;
        $("allocationRemainingVolume").textContent = `${fmt(remaining)} L`;
        $("harvestBatchCount").textContent = `${batches.length} batch`;
    }

    function renderBatches(){
        const list=$("allocationBatchList");
        if(!batches.length){
            $("allocationState").textContent="Tidak ada batch Harvest yang sudah dipanen.";
            list.innerHTML="";
            return;
        }
        $("allocationState").textContent="Pilih batch untuk membuat alokasi.";
        list.innerHTML=batches.map(b=>`
            <button type="button" class="allocation-batch ${selected?.id===b.id?"active":""}" data-id="${escapeHtml(b.id)}">
                <div><div class="allocation-batch-code">${escapeHtml(b.batch_code)}</div><div class="allocation-batch-meta">Actual Harvest ${fmtDate(b.actual_harvest_at)}</div></div>
                <div class="allocation-batch-volume"><strong>${fmt(b.remaining_volume)} L</strong><span>sisa dari ${fmt(b.harvest_volume)} L</span></div>
            </button>`).join("");
        list.querySelectorAll("[data-id]").forEach(btn=>btn.addEventListener("click",()=>selectBatch(btn.dataset.id)));
    }

    async function selectBatch(id, reload=true){
        selected=batches.find(b=>b.id===id) || null;
        renderBatches();
        if(!selected) return;
        $("allocationBatchId").value=selected.id;
        $("allocationSelected").classList.remove("empty");
        $("allocationSelected").innerHTML=`<strong>${escapeHtml(selected.batch_code)}</strong> • Actual Harvest ${fmt(selected.harvest_volume)} L • Sisa ${fmt(selected.remaining_volume)} L`;
        const volume=Math.max(selected.remaining_volume,0);
        $("allocatedVolume").value=volume>0 ? volume : "";
        updateCalculation();
        $("saveAllocationBtn").disabled=volume<=0;
        if($("allocationDate").value==="") $("allocationDate").value=localDateTime();
        await loadHistory(reload);
    }

    function updateCalculation(){
        const volume=number($("allocatedVolume").value);
        const size=number($("bottleSizeMl").value);
        const output=number($("plannedBottles").value)*size/1000;
        const remaining=selected ? Math.max(selected.remaining_volume-volume,0) : 0;
        $("allocationOutput").textContent=`${fmt(output)} L`;
        $("allocationRemaining").textContent=selected ? `${fmt(remaining)} L` : "—";
        if(size>0 && volume>0 && document.activeElement?.id!=="plannedBottles"){
            const bottles=Math.floor((volume*1000)/size + 0.000001);
            if(bottles>0) $("plannedBottles").value=bottles;
        }
    }

    async function loadHistory(){
        if(!selected){
            $("allocationHistoryState").textContent="Pilih batch untuk melihat alokasi.";
            $("allocationHistory").innerHTML="";
            return;
        }
        const {data,error}=await client().from("batch_allocations").select("allocation_code,allocation_date,allocated_volume,bottle_size_ml,planned_bottles,variant_name,operator_name,status").eq("batch_id",selected.id).order("allocation_date",{ascending:false});
        if(error) throw error;
        const rows=data||[];
        $("allocationHistoryState").textContent=rows.length?`${rows.length} alokasi tercatat.`:"Belum ada alokasi untuk batch ini.";
        $("allocationHistory").innerHTML=rows.map(r=>`<div class="allocation-history-row"><div><strong>${escapeHtml(r.allocation_code)}</strong><span>${fmtDate(r.allocation_date)}</span></div><div><strong>${fmt(r.allocated_volume)} L</strong><span>${fmt(r.bottle_size_ml,0)} ml</span></div><div><strong>${fmt(r.planned_bottles,0)} botol</strong><span>${escapeHtml(r.variant_name||"Tanpa varian")}</span></div><div><span class="allocation-status">${escapeHtml(r.status)}</span></div></div>`).join("");
    }

    async function saveAllocation(event){
        event.preventDefault();
        if(!selected){ alert("Pilih batch Harvest terlebih dahulu."); return; }
        const volume=number($("allocatedVolume").value);
        const size=number($("bottleSizeMl").value);
        const bottles=Math.floor(number($("plannedBottles").value));
        const operator=$("operatorName").value.trim();
        if(volume<=0 || size<=0 || bottles<=0 || !operator){ alert("Volume, ukuran botol, rencana botol, dan operator wajib diisi."); return; }
        if(volume>selected.remaining_volume+0.0005){ alert(`Volume alokasi melebihi sisa ${fmt(selected.remaining_volume)} L.`); return; }
        const btn=$("saveAllocationBtn"); btn.disabled=true; btn.textContent="Menyimpan...";
        try{
            const {data,error}=await client().rpc("create_meramu_allocation",{
                p_batch_id:selected.id,
                p_allocation_date:new Date($("allocationDate").value).toISOString(),
                p_allocated_volume:volume,
                p_bottle_size_ml:size,
                p_planned_bottles:bottles,
                p_variant_name:$("variantName").value.trim()||null,
                p_operator_name:operator,
                p_notes:$("allocationNotes").value.trim()||null,
                p_product_id:selected.product_id||null
            });
            if(error) throw error;
            const code=Array.isArray(data)?data[0]?.allocation_code:data?.allocation_code;
            alert(`Alokasi ${code||"batch"} berhasil disimpan.`);
            await loadBatches();
            $("allocationNotes").value="";
        }catch(error){
            console.error("MERAMU Allocation:",error);
            alert(error?.message||"Gagal menyimpan alokasi.");
        }finally{
            btn.disabled=!selected || selected.remaining_volume<=0;
            btn.innerHTML='<i data-lucide="save"></i> Simpan Alokasi';
            if(window.lucide) lucide.createIcons();
        }
    }

    document.addEventListener("DOMContentLoaded",async()=>{
        $("refreshAllocationBtn")?.addEventListener("click",()=>loadBatches().catch(showError));
        $("allocationForm")?.addEventListener("submit",saveAllocation);
        ["allocatedVolume","bottleSizeMl","plannedBottles"].forEach(id=>$(id)?.addEventListener("input",updateCalculation));
        if($("allocationDate")) $("allocationDate").value=localDateTime();
        try{ await loadBatches(); }catch(error){ showError(error); }
        if(window.lucide) lucide.createIcons();
    });

    function showError(error){
        console.error(error);
        $("allocationState").innerHTML=`<div class="allocation-error">${escapeHtml(error?.message||"Gagal memuat Allocation.")}</div>`;
    }
})();
