/* =========================================================
   MERAMU BATCH CANCEL
   Cancel Batch → Supabase
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       HELPERS
    ===================================================== */

    function getBatchCode(){

        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get("id") ||
            "KB-022"
        );

    }


    function getModal(){

        return document.getElementById(
            "cancelBatchModal"
        );

    }


    function openCancelModal(){

        const modal =
            getModal();

        if(!modal){
            return;
        }


        const batchCode =
            getBatchCode();


        const codeElement =
            document.getElementById(
                "cancelBatchCode"
            );


        if(codeElement){

            codeElement.textContent =
                batchCode;

        }


        const reason =
            document.getElementById(
                "cancelBatchReason"
            );


        if(reason){

            reason.value = "";

        }


        modal.classList.add(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        if(window.lucide){

            lucide.createIcons();

        }

    }


    function closeCancelModal(){

        const modal =
            getModal();

        if(!modal){
            return;
        }


        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /* =====================================================
       WAIT SUPABASE
    ===================================================== */

    function waitForSupabase(
        callback,
        attempts = 50
    ){

        if(
            window.supabaseClient &&
            typeof window.supabaseClient.rpc ===
                "function"
        ){

            callback(
                window.supabaseClient
            );

            return;

        }


        if(attempts <= 0){

            alert(
                "Koneksi Supabase belum tersedia."
            );

            return;

        }


        setTimeout(
            function(){

                waitForSupabase(
                    callback,
                    attempts - 1
                );

            },
            100
        );

    }


    /* =====================================================
       CANCEL BATCH
    ===================================================== */

    async function cancelBatch(
        event
    ){

        event.preventDefault();


        const batchCode =
            getBatchCode();


        const reasonElement =
            document.getElementById(
                "cancelBatchReason"
            );


        const reason =
            reasonElement
                ? reasonElement.value.trim()
                : "";


        if(!reason){

            alert(
                "Masukkan alasan pembatalan terlebih dahulu."
            );

            reasonElement?.focus();

            return;

        }


        const confirmed =
            window.confirm(
                `Batalkan batch ${batchCode}?\n\nBatch tidak akan dihapus. Status akan menjadi CANCELLED.`
            );


        if(!confirmed){

            return;

        }


        waitForSupabase(
            async function(
                supabase
            ){

                try{

                    /* -------------------------------------
                       Cari UUID batch
                    ------------------------------------- */

                    const {
                        data: batch,
                        error: batchError
                    } =
                        await supabase
                            .from("batches")
                            .select(
                                "id,batch_code,status"
                            )
                            .eq(
                                "batch_code",
                                batchCode
                            )
                            .maybeSingle();


                    if(batchError){

                        throw batchError;

                    }


                    if(!batch){

                        throw new Error(
                            `Batch ${batchCode} tidak ditemukan.`
                        );

                    }


                    /* -------------------------------------
                       Panggil RPC cancel
                    ------------------------------------- */

                    const {
                        data,
                        error
                    } =
                        await supabase.rpc(
                            "cancel_meramu_batch",
                            {
                                p_batch_id:
                                    batch.id,

                                p_reason:
                                    reason
                            }
                        );


                    if(error){

                        throw error;

                    }


                    console.log(
                        "✅ MERAMU: Batch berhasil dibatalkan.",
                        data
                    );


                    closeCancelModal();


                    /*
                       Realtime akan menangkap UPDATE
                       dari Supabase.

                       Kita juga redirect kembali ke
                       calendar setelah sedikit delay.
                    */

                    setTimeout(
                        function(){

                            window.location.href =
                                "/pages/fermentation-calendar.html";

                        },
                        500
                    );


                }catch(error){

                    console.error(
                        "❌ MERAMU: Gagal membatalkan batch.",
                        error
                    );


                    alert(
                        "Batch gagal dibatalkan.\n\n" +
                        (
                            error.message ||
                            "Terjadi kesalahan."
                        )
                    );

                }

            }
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    document.addEventListener(
        "click",
        function(event){

            const cancelButton =
                event.target.closest(
                    "#cancelBatch"
                );


            if(cancelButton){

                event.preventDefault();

                openCancelModal();

                return;

            }


            const closeButton =
                event.target.closest(
                    "[data-close-cancel-modal]"
                );


            if(closeButton){

                event.preventDefault();

                closeCancelModal();

            }

        }
    );


    document.addEventListener(
        "submit",
        function(event){

            if(
                event.target.id !==
                "cancelBatchForm"
            ){

                return;

            }


            cancelBatch(
                event
            );

        }
    );


    document.addEventListener(
        "keydown",
        function(event){

            if(
                event.key === "Escape"
            ){

                closeCancelModal();

            }

        }
    );


    /* =====================================================
       EXPORT
    ===================================================== */

    window.openCancelBatchModal =
        openCancelModal;

    window.closeCancelBatchModal =
        closeCancelModal;


})();
