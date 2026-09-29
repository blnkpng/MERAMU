/* =========================================================
   MERAMU
   BATCH DETAIL — SUPABASE FERMENTATION LOGS
   v2.0
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const MAX_WAIT = 10000;
    const WAIT_STEP = 250;


    /* =====================================================
       WAIT FOR SUPABASE + BATCH
    ===================================================== */

    function waitForDependencies(){

        return new Promise(resolve => {

            const startedAt = Date.now();

            const check = () => {

                const supabase =
                    window.supabaseClient;

                let batch = null;

                try{

                    if(
                        typeof getCurrentBatch ===
                        "function"
                    ){

                        batch =
                            getCurrentBatch();

                    }

                }catch(error){

                    console.warn(
                        "MERAMU: Gagal membaca current batch.",
                        error
                    );

                }


                if(
                    supabase &&
                    batch
                ){

                    resolve({
                        supabase,
                        batch
                    });

                    return;

                }


                if(
                    Date.now() - startedAt >=
                    MAX_WAIT
                ){

                    resolve({
                        supabase:
                            supabase || null,
                        batch:
                            batch || null
                    });

                    return;

                }


                setTimeout(
                    check,
                    WAIT_STEP
                );

            };


            check();

        });

    }


    /* =====================================================
       GET BATCH ID
    ===================================================== */

    async function getBatchUuid(
        supabase,
        batch
    ){

        if(
            batch &&
            batch.id &&
            typeof batch.id === "string"
        ){

            return batch.id;

        }


        const batchCode =
            batch?.code ||
            new URLSearchParams(
                window.location.search
            ).get("id");


        if(!batchCode){

            return null;

        }


        const {
            data,
            error
        } = await supabase
            .from("batches")
            .select("id,batch_code")
            .eq(
                "batch_code",
                batchCode
            )
            .maybeSingle();


        if(error){

            console.error(
                "MERAMU: Gagal mencari UUID batch.",
                error
            );

            return null;

        }


        return data?.id || null;

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatLogDate(value){

        if(!value){

            return "—";

        }


        const date =
            new Date(value);


        if(Number.isNaN(date.getTime())){

            return "—";

        }


        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).format(date);

    }


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatLogTime(value){

        if(!value){

            return "—";

        }


        const date =
            new Date(value);


        if(Number.isNaN(date.getTime())){

            return "—";

        }


        return new Intl.DateTimeFormat(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        ).format(date);

    }


    /* =====================================================
       MAP SUPABASE LOG → UI LOG
    ===================================================== */

    function mapSupabaseLog(row){

        return {

            id:
                row.id,

            stage:
                row.stage,

            date:
                formatLogDate(
                    row.measured_at
                ),

            time:
                formatLogTime(
                    row.measured_at
                ),

            ph:
                row.ph !== null &&
                row.ph !== undefined
                    ? Number(row.ph).toFixed(2)
                    : "—",

            brix:
                row.brix !== null &&
                row.brix !== undefined
                    ? `${Number(row.brix).toFixed(1)}°`
                    : "—",

            temperature:
                row.temperature_c !== null &&
                row.temperature_c !== undefined
                    ? `${Number(row.temperature_c).toFixed(1)}°C`
                    : "—",

            volume:
                row.volume !== null &&
                row.volume !== undefined
                    ? `${Number(row.volume).toFixed(1)} L`
                    : "—",

            operator:
                row.operator_name ||
                "—",

            qc:
                row.qc_status ||
                "passed",

            note:
                row.notes ||
                ""

        };

    }


    /* =====================================================
       LOAD LOGS FROM SUPABASE
    ===================================================== */

    async function loadFermentationLogs(){

        const dependencies =
            await waitForDependencies();


        const supabase =
            dependencies.supabase;

        const batch =
            dependencies.batch;


        if(!supabase){

            console.warn(
                "MERAMU: Supabase client belum tersedia."
            );

            return;

        }


        if(!batch){

            console.warn(
                "MERAMU: Batch belum tersedia."
            );

            return;

        }


        const batchUuid =
            await getBatchUuid(
                supabase,
                batch
            );


        if(!batchUuid){

            console.warn(
                "MERAMU: UUID batch tidak ditemukan."
            );

            return;

        }


        console.log(
            "MERAMU: Mengambil fermentation logs:",
            batch.code
        );


        const {
            data,
            error
        } = await supabase
            .from("fermentation_logs")
            .select(`
                id,
                batch_id,
                stage,
                measured_at,
                ph,
                brix,
                temperature_c,
                volume,
                operator_name,
                qc_status,
                notes
            `)
            .eq(
                "batch_id",
                batchUuid
            )
            .order(
                "measured_at",
                {
                    ascending: false
                }
            );


        if(error){

            console.error(
                "MERAMU: Gagal mengambil fermentation logs.",
                error
            );

            return;

        }


        const logs =
            Array.isArray(data)
                ? data.map(
                    mapSupabaseLog
                )
                : [];


        console.log(
            "MERAMU: Fermentation logs dari Supabase:",
            data
        );


        /* -------------------------------------------------
           MASUKKAN KE CURRENT BATCH
        ------------------------------------------------- */

        batch.fermentationLogs =
            logs;


        /* -------------------------------------------------
           UPDATE METRIC TERBARU
        ------------------------------------------------- */

        if(
            data &&
            data.length
        ){

            const latest =
                data[0];


            if(
                latest.ph !== null &&
                latest.ph !== undefined
            ){

                batch.ph =
                    Number(
                        latest.ph
                    ).toFixed(2);

            }


            if(
                latest.brix !== null &&
                latest.brix !== undefined
            ){

                batch.brix =
                    `${Number(
                        latest.brix
                    ).toFixed(1)}°`;

            }


            if(
                latest.temperature_c !== null &&
                latest.temperature_c !== undefined
            ){

                batch.temperature =
                    `${Number(
                        latest.temperature_c
                    ).toFixed(1)}°C`;

            }


            if(
                latest.volume !== null &&
                latest.volume !== undefined
            ){

                batch.volume =
                    `${Number(
                        latest.volume
                    ).toFixed(1)} L`;

            }

        }


        /* -------------------------------------------------
           RENDER
        ------------------------------------------------- */

        if(
            window.renderBatchDetail
        ){

            window.renderBatchDetail();

        }


        console.log(
            `MERAMU: ${logs.length} fermentation log berhasil ditampilkan.`
        );

    }


    /* =====================================================
       GET FORM VALUE
    ===================================================== */

    function getValue(id){

        return (
            document.getElementById(id)
                ?.value
                ?.trim() ||
            ""
        );

    }


    /* =====================================================
       BUILD LOCAL DATETIME → ISO
    ===================================================== */

    function buildMeasuredAt(
        date,
        time
    ){

        if(!date){

            return new Date().toISOString();

        }


        const safeTime =
            time || "00:00";


        const localDate =
            new Date(
                `${date}T${safeTime}:00`
            );


        if(
            Number.isNaN(
                localDate.getTime()
            )
        ){

            return new Date().toISOString();

        }


        return localDate.toISOString();

    }


    /* =====================================================
       INSERT LOG
    ===================================================== */

    async function insertFermentationLog(){

        const dependencies =
            await waitForDependencies();


        const supabase =
            dependencies.supabase;

        const batch =
            dependencies.batch;


        if(!supabase){

            alert(
                "Supabase belum siap. Silakan coba lagi."
            );

            return false;

        }


        if(!batch){

            alert(
                "Batch belum ditemukan."
            );

            return false;

        }


        const form =
            document.getElementById(
                "fermentationLogForm"
            );


        if(!form){

            console.warn(
                "MERAMU: fermentationLogForm tidak ditemukan."
            );

            return false;

        }


        if(
            !form.checkValidity()
        ){

            form.reportValidity();

            return false;

        }


        const batchUuid =
            await getBatchUuid(
                supabase,
                batch
            );


        if(!batchUuid){

            alert(
                "UUID batch tidak ditemukan."
            );

            return false;

        }


        /* -------------------------------------------------
           FORM
        ------------------------------------------------- */

        const stage =
            getValue(
                "logStage"
            ) || "f2";


        const date =
            getValue(
                "logDate"
            );


        const time =
            getValue(
                "logTime"
            );


        const phValue =
            getValue(
                "logPh"
            );


        const brixValue =
            getValue(
                "logBrix"
            );


        const temperatureValue =
            getValue(
                "logTemperature"
            );


        const volumeValue =
            getValue(
                "logVolume"
            );


        const qc =
            getValue(
                "logQc"
            ) || "passed";


        const operator =
            getValue(
                "logOperator"
            ) || "Arif";


        const note =
            getValue(
                "logNote"
            );


        /* -------------------------------------------------
           NUMBER VALIDATION
        ------------------------------------------------- */

        const ph =
            Number(phValue);

        const brix =
            Number(brixValue);

        const temperature =
            Number(temperatureValue);

        const volume =
            Number(volumeValue);


        if(
            !Number.isFinite(ph) ||
            !Number.isFinite(brix) ||
            !Number.isFinite(temperature) ||
            !Number.isFinite(volume)
        ){

            alert(
                "Nilai pH, Brix, suhu, dan volume harus berupa angka."
            );

            return false;

        }


        /* -------------------------------------------------
           PAYLOAD
        ------------------------------------------------- */

        const payload = {

            batch_id:
                batchUuid,

            stage:
                stage,

            measured_at:
                buildMeasuredAt(
                    date,
                    time
                ),

            ph:
                ph,

            brix:
                brix,

            temperature_c:
                temperature,

            volume:
                volume,

            operator_name:
                operator,

            qc_status:
                qc,

            notes:
                note || null

        };


        console.log(
            "MERAMU: Menyimpan fermentation log ke Supabase:",
            payload
        );


        /* -------------------------------------------------
           INSERT
        ------------------------------------------------- */

        const {
            data,
            error
        } = await supabase
            .from("fermentation_logs")
            .insert(
                payload
            )
            .select()
            .single();


        if(error){

            console.error(
                "MERAMU: Gagal menyimpan fermentation log.",
                error
            );

            alert(
                "Gagal menyimpan fermentation log.\n\n" +
                (error.message || "Unknown error")
            );

            return false;

        }


        console.log(
            "MERAMU: Fermentation log berhasil disimpan:",
            data
        );


        /* -------------------------------------------------
           REFRESH DARI DATABASE
        ------------------------------------------------- */

        await loadFermentationLogs();


        /* -------------------------------------------------
           CLOSE MODAL
        ------------------------------------------------- */

        if(
            typeof closeFermentationLogModal ===
            "function"
        ){

            closeFermentationLogModal();

        }


        if(
            typeof resetFermentationLogForm ===
            "function"
        ){

            resetFermentationLogForm();

        }


        console.log(
            "MERAMU: Fermentation Log berhasil ditambahkan."
        );


        return true;

    }


    /* =====================================================
       SUBMIT HANDLER
       CAPTURE PHASE
       Supaya save lama dari batch-detail.js
       tidak ikut menjalankan dummy/local save.
    ===================================================== */

    function handleSubmit(event){

        if(
            !event.target ||
            event.target.id !==
            "fermentationLogForm"
        ){

            return;

        }


        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        insertFermentationLog();

    }


    /* =====================================================
       INIT
    ===================================================== */

    async function init(){

        console.log(
            "MERAMU: Supabase fermentation log module siap."
        );


        /*
           Capture = true
           supaya handler ini berjalan sebelum
           listener submit lama.
        */

        document.addEventListener(
            "submit",
            handleSubmit,
            true
        );


        await loadFermentationLogs();

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    window.loadFermentationLogs =
        loadFermentationLogs;

    window.insertFermentationLog =
        insertFermentationLog;

    window.initBatchDetailLogsSupabase =
        init;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


})();
