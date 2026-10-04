/* =========================================================
   MERAMU P5 — F2 → HARVEST
   ---------------------------------------------------------
   Lifecycle:
   1. QC F2 PASS disimpan oleh batch-quality-check.js.
   2. Event meramu:quality-check-saved diterima di sini.
   3. Pastikan bottling sudah completed.
   4. Update batches.current_stage = harvest.
   5. Simpan f2_completed_at.
   6. Refresh detail/timeline.

   Tidak memakai RPC yang tidak ada di project ZIP.
========================================================= */

(function(){
    "use strict";

    // Avoid processing the same QC PASS event twice in the same page session.
    const handledF2HarvestEvents = new Set();

    function getElement(id){
        return document.getElementById(id);
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

            await new Promise(
                resolve => setTimeout(resolve,100)
            );
        }

        throw new Error("Supabase belum siap.");
    }

    function normalizeDecision(value){
        const decision =
            String(value || "")
                .toLowerCase()
                .trim();

        return (
            decision === "pass" ||
            decision === "passed"
        )
            ? "passed"
            : decision;
    }

    async function getCurrentBatch(
        supabase,
        batchCode
    ){
        const {
            data,
            error
        } = await supabase
            .from("batches")
            .select(`
                id,
                batch_code,
                current_stage,
                status,
                f2_started_at,
                f2_completed_at
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

    async function ensureBottlingCompleted(
        supabase,
        batchId
    ){
        const {
            data,
            error
        } = await supabase
            .from("batch_bottling")
            .select(
                "id,batch_id,bottling_status,actual_bottles,output_volume_l"
            )
            .eq("batch_id",batchId)
            .eq("bottling_status","completed")
            .maybeSingle();

        if(error){
            throw error;
        }

        if(!data){
            throw new Error(
                "Bottling belum selesai. " +
                "Simpan Actual Bottling terlebih dahulu sebelum QC F2 PASS."
            );
        }

        if(
            Number(data.actual_bottles || 0) <= 0 ||
            Number(data.output_volume_l || 0) <= 0
        ){
            throw new Error(
                "Data Bottling belum valid. " +
                "Actual botol dan output volume harus lebih dari 0."
            );
        }

        return data;
    }

    async function handleQualityCheckSaved(event){
        const detail = event?.detail || {};

        const stage =
            String(
                detail.qualityCheck?.stage || ""
            )
                .toLowerCase()
                .trim();

        const decision =
            normalizeDecision(
                detail.decision ||
                detail.qualityCheck?.decision
            );

        if(
            stage !== "f2" ||
            decision !== "passed"
        ){
            return;
        }

        const batchCode =
            String(
                detail.batchCode ||
                getBatchCode()
            ).trim();

        if(!batchCode){
            console.error(
                "MERAMU P5: batch code tidak tersedia saat transisi F2 → Harvest."
            );
            return;
        }

        const eventKey = `${batchCode}|${detail.qualityCheck?.id || detail.qualityCheck?.checked_at || "qc"}`;
        if(handledF2HarvestEvents.has(eventKey)){
            console.warn(
                `MERAMU P5: event QC F2 PASS ${eventKey} sudah diproses. Diabaikan.`
            );
            return;
        }
        handledF2HarvestEvents.add(eventKey);

        try{
            const supabase =
                await waitForSupabase();

            const batch =
                await getCurrentBatch(
                    supabase,
                    batchCode
                );

            /*
             * Safety gate:
             * hanya F2 yang boleh masuk Harvest.
             */
            if(
                String(batch.current_stage || "")
                    .toLowerCase()
                    .trim() !== "f2"
            ){
                console.warn(
                    `MERAMU P5: ${batchCode} bukan lagi F2. Transisi dibatalkan.`
                );
                return;
            }

            /*
             * Safety gate:
             * Bottling harus sudah completed.
             */
            await ensureBottlingCompleted(
                supabase,
                batch.id
            );

            const completedAt =
                detail.qualityCheck?.checked_at ||
                new Date().toISOString();

            const {
                data: updatedBatch,
                error: updateError
            } = await supabase
                .from("batches")
                .update({
                    current_stage: "harvest",
                    status:
                        batch.status === "cancelled"
                            ? "cancelled"
                            : "active",
                    f2_completed_at: completedAt,
                    updated_at: new Date().toISOString()
                })
                .eq("id",batch.id)
                .eq("current_stage","f2")
                .select(`
                    id,
                    batch_code,
                    current_stage,
                    status,
                    f2_started_at,
                    f2_completed_at
                `)
                .maybeSingle();

            if(updateError){
                throw updateError;
            }

            if(!updatedBatch){
                throw new Error(
                    "Batch gagal dipindahkan ke Harvest. " +
                    "Stage mungkin sudah berubah."
                );
            }

            /*
             * Refresh semua komponen yang mengetahui stage batch.
             */
            if(
                typeof window.initBatchSupabase ===
                "function"
            ){
                await window.initBatchSupabase();
            }

            if(
                typeof window.renderBatchDetail ===
                "function"
            ){
                window.renderBatchDetail();
            }

            if(
                typeof window.loadQualityCheckHistory ===
                "function"
            ){
                window.loadQualityCheckHistory();
            }

            if(
                typeof window.MERAMUF2Bottling?.load ===
                "function"
            ){
                await window.MERAMUF2Bottling.load();
            }

            if(
                window.MERAMURealtime &&
                typeof window.MERAMURealtime.refresh ===
                "function"
            ){
                window.MERAMURealtime.refresh();
            }

            document.dispatchEvent(
                new CustomEvent(
                    "meramu:f2-to-harvest-complete",
                    {
                        detail:{
                            batchCode,
                            batch: updatedBatch
                        }
                    }
                )
            );

            alert(
                `QC F2 ${batchCode} PASS.\n\n` +
                `Bottling sudah lengkap.\n` +
                `Batch sekarang READY HARVEST.`
            );

        }catch(error){
            /*
             * QC tetap sudah tercatat.
             * Yang gagal hanya transisi stage.
             * User dapat memperbaiki bottling lalu melakukan
             * QC F2 PASS lagi.
             */
            console.error(
                "MERAMU P5: F2 → Harvest gagal.",
                error
            );

            alert(
                "QC F2 sudah tersimpan, tetapi batch belum dipindahkan ke Harvest.\n\n" +
                (error?.message || error)
            );
        }
    }

    function init(){
        document.addEventListener(
            "meramu:quality-check-saved",
            handleQualityCheckSaved
        );

        console.log(
            "✅ MERAMU P5 F2 → Harvest Controller Loaded"
        );
    }

    window.MERAMUF2Harvest = {
        handle: handleQualityCheckSaved
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
