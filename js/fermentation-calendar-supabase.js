/* =========================================================
   MERAMU FERMENTATION CALENDAR → SUPABASE
   Read batches from Supabase
========================================================= */

async function loadFermentationCalendarFromSupabase(){

    if(!window.supabaseClient){

        console.warn(
            "MERAMU: Supabase client belum siap."
        );

        return;

    }

    console.log(
        "MERAMU: Mengambil fermentation calendar dari Supabase..."
    );

    const supabase =
        window.supabaseClient;


    /* =====================================================
       GET BATCHES
    ===================================================== */

    const {
        data,
        error
    } = await supabase

        .from("batches")

        .select(`
            id,
            batch_code,
            product_id,
            production_date,
            target_date,
            planned_volume,
            actual_volume,
            current_stage,
            status,
            products (
                id,
                code,
                name,
                product_type,
                category
            )
        `)

        .order(
            "production_date",
            {
                ascending: true
            }
        );


    if(error){

        console.error(
            "MERAMU: Gagal mengambil fermentation calendar.",
            error
        );

        return;

    }


    if(!Array.isArray(data)){

        console.warn(
            "MERAMU: Data calendar bukan array."
        );

        return;

    }


    console.log(
        "MERAMU: Batch calendar dari Supabase:",
        data
    );


    /* =====================================================
       MAP SUPABASE → CALENDAR FORMAT
    ===================================================== */

    const mappedBatches =
        data
            .filter(batch => {

                const stage =
                    String(
                        batch.current_stage || ""
                    )
                    .toLowerCase();

                /*
                   Calendar fermentasi hanya menampilkan
                   batch Kombucha / batch yang berada
                   di F1, F2, atau Harvest.
                */

                return [
                    "f1",
                    "f2",
                    "harvest",
                    "panen"
                ].some(
                    value =>
                        stage === value ||
                        stage.includes(value)
                );

            })
            .map(batch => {

                const stage =
                    normalizeCalendarStage(
                        batch.current_stage
                    );


                const productName =
                    batch.products?.name ||
                    "Produk";


                const productType =
                    batch.products?.product_type ||
                    "kombucha";


                return {

                    id:
                        batch.id,

                    code:
                        batch.batch_code,

                    product:
                        productName,

                    type:
                        productType,

                    stage:
                        stage,

                    startDate:
                        batch.production_date,

                    endDate:
                        batch.target_date,

                    plannedVolume:
                        batch.planned_volume,

                    actualVolume:
                        batch.actual_volume,

                    status:
                        normalizeCalendarStatus(
                            batch.status,
                            batch.target_date
                        )

                };

            });


    console.log(
        "MERAMU: Calendar batch berhasil dipetakan:",
        mappedBatches
    );


    /* =====================================================
       SEND DATA TO EXISTING CALENDAR
    ===================================================== */

    window.meramuCalendarBatches =
        mappedBatches;


    /*
       Calendar JS yang lama akan tetap dipakai
       untuk rendering UI.

       Kita hanya mengganti sumber datanya.
    */

    if(
        typeof window.setFermentationCalendarData ===
        "function"
    ){

        window.setFermentationCalendarData(
            mappedBatches
        );

    }else{

        console.warn(
            "MERAMU: setFermentationCalendarData() belum tersedia di fermentation-calendar.js."
        );

    }

}


/* =========================================================
   NORMALIZE STAGE
========================================================= */

function normalizeCalendarStage(stage){

    if(!stage){

        return "f1";

    }


    const value =
        String(stage)
            .trim()
            .toLowerCase();


    if(
        value === "f1" ||
        value.includes("f1")
    ){

        return "f1";

    }


    if(
        value === "f2" ||
        value.includes("f2")
    ){

        return "f2";

    }


    if(
        value === "harvest" ||
        value === "panen" ||
        value.includes("harvest") ||
        value.includes("panen")
    ){

        return "harvest";

    }


    return "f1";

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeCalendarStatus(
    status,
    targetDate
){

    const value =
        String(
            status || ""
        )
        .trim()
        .toLowerCase();


    if(
        value.includes("cancel") ||
        value.includes("void")
    ){

        return "delayed";

    }


    if(
        value.includes("delay") ||
        value.includes("terlambat")
    ){

        return "delayed";

    }


    if(
        value.includes("harvest") ||
        value.includes("ready")
    ){

        return "harvest";

    }


    /*
       Kalau batch aktif dan target date sudah lewat,
       tandai sebagai delayed.
    */

    if(targetDate){

        const today =
            new Date();

        const target =
            new Date(
                targetDate +
                "T00:00:00"
            );


        if(
            !Number.isNaN(
                target.getTime()
            ) &&
            target < today
        ){

            return "delayed";

        }

    }


    return "active";

}


/* =========================================================
   INIT
========================================================= */

function initFermentationCalendarSupabase(){

    loadFermentationCalendarFromSupabase();

}


window.initFermentationCalendarSupabase =
    initFermentationCalendarSupabase;


/* =========================================================
   AUTO INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initFermentationCalendarSupabase();

    }
);
