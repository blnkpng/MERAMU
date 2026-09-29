/* =========================================================
   MERAMU BATCH CANCEL
   Cancel Batch via Supabase RPC
========================================================= */

(function(){

    function getBatchCode(){

        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get("batch") ||
            params.get("code") ||
            "KB-022"
        );

    }


    function getModal(){

        return document.getElementById(
            "cancelBatchModal"
        );

    }


    function openCancelBatchModal(){

        const modal =
            getModal();

        if(!modal){

            console.error(
                "MERAMU: #cancelBatchModal tidak ditemukan."
            );

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


        modal.classList.add("show");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        setTimeout(() => {

            if(reason){

                reason.focus();

            }

        },100);


        if(window.lucide){

            lucide.createIcons();

        }

    }


    function closeCancelBatchModal(){

        const modal =
            getModal();

        if(!modal){

            return;

        }


        modal.classList.remove("show");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    async function waitForSupabase(){

        for(let i = 0; i < 50; i++){

            if(window.supabaseClient){

                return window.supabaseClient;

            }

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );

        }

        throw new Error(
            "Supabase client belum tersedia."
        );

    }


    async function cancelBatch(event){

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
                "Alasan pembatalan wajib diisi."
            );

            if(reasonElement){

                reasonElement.focus();

            }

            return;

        }


        const confirmed =
            window.confirm(
                `Batalkan batch ${batchCode}?\n\nBatch tidak akan dihapus. Status akan menjadi Cancelled.`
            );


        if(!confirmed){

            return;

        }


        try{

            const supabase =
                await waitForSupabase();


            console.log(
                "MERAMU: Mencari batch",
                batchCode
            );


            const {
                data: batch,
                error: findError
            } = await supabase

                .from("batches")

                .select("id,batch_code,status")

                .eq(
                    "batch_code",
                    batchCode
                )

                .maybeSingle();


            if(findError){

                throw findError;

            }


            if(!batch){

                throw new Error(
                    `Batch ${batchCode} tidak ditemukan.`
                );

            }


            console.log(
                "MERAMU: Batch ditemukan",
                batch
            );


            const {
                data,
                error: rpcError
            } = await supabase.rpc(
                "cancel_meramu_batch",
                {
                    p_batch_id:
                        batch.id,

                    p_reason:
                        reason
                }
            );


            if(rpcError){

                throw rpcError;

            }


            console.log(
                "MERAMU: Batch berhasil dibatalkan.",
                data
            );


            closeCancelBatchModal();


            alert(
                `Batch ${batchCode} berhasil dibatalkan.`
            );


            window.location.href =
                "fermentation-calendar.html";


        }catch(error){

            console.error(
                "MERAMU: Gagal membatalkan batch.",
                error
            );


            alert(
                "Gagal membatalkan batch:\n" +
                (
                    error.message ||
                    "Terjadi kesalahan."
                )
            );

        }

    }


    function bindEvents(){

        const cancelButton =
            document.getElementById(
                "cancelBatch"
            );


        if(cancelButton){

            cancelButton.addEventListener(
                "click",
                function(event){

                    event.preventDefault();

                    event.stopPropagation();

                    console.log(
                        "MERAMU: Tombol Batalkan Batch diklik."
                    );

                    openCancelBatchModal();

                }
            );

        }else{

            console.warn(
                "MERAMU: #cancelBatch belum ditemukan."
            );

        }


        const form =
            document.getElementById(
                "cancelBatchForm"
            );


        if(form){

            form.addEventListener(
                "submit",
                cancelBatch
            );

        }


        document.addEventListener(
            "click",
            function(event){

                const closeButton =
                    event.target.closest(
                        "[data-close-cancel-modal]"
                    );

                if(closeButton){

                    closeCancelBatchModal();

                }

            }
        );


        document.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key ===
                    "Escape"
                ){

                    closeCancelBatchModal();

                }

            }
        );

    }


    window.openCancelBatchModal =
        openCancelBatchModal;


    window.closeCancelBatchModal =
        closeCancelBatchModal;


    if(
        document.readyState ===
        "loading"
    ){

        document.addEventListener(
            "DOMContentLoaded",
            bindEvents
        );

    }else{

        bindEvents();

    }

})();
