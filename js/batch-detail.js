/* =========================================================
MERAMU BATCH DETAIL
Dummy Data → Ready for Supabase
========================================================= */

/* =========================================================
BATCH DATA
========================================================= */

const batchDetailData = {

"KB-021": {
    code: "KB-021",
    product: "Original Kombucha",
    type: "kombucha",
    status: "F1 ACTIVE",
    stage: "F1 Fermentasi",
    progress: 60,
    day: 4,
    targetDays: 7,
    startDate: "28 Sep 2026",
    targetDate: "05 Okt 2026",
    volume: "20 L",
    hpp: "Rp 8.200",
    ph: "3.55",
    brix: "8.2°",
    temperature: "25.1°C",
    duration: "4 Hari"
},


"KB-022": {
    code: "KB-022",
    product: "Lemon Kombucha",
    type: "kombucha",
    status: "F2 ACTIVE",
    stage: "F2 Fermentasi",
    progress: 80,
    day: 4,
    targetDays: 5,
    startDate: "26 Sep 2026",
    targetDate: "01 Okt 2026",
    volume: "20 L",
    hpp: "Rp 8.450",
    ph: "3.42",
    brix: "7.8°",
    temperature: "25.4°C",
    duration: "4 Hari",

    /* =====================================================
       FERMENTATION LOG
    ===================================================== */

    fermentationLogs: [

        {
            id: 1,
            stage: "f2",
            date: "29 Sep 2026",
            time: "10:15",
            ph: "3.42",
            brix: "7.8°",
            temperature: "25.4°C",
            volume: "20 L",
            operator: "Arif",
            qc: "passed",
            note: "Aroma normal, fermentasi berjalan baik."
        },

        {
            id: 2,
            stage: "f2",
            date: "28 Sep 2026",
            time: "10:20",
            ph: "3.51",
            brix: "8.1°",
            temperature: "25.6°C",
            volume: "20 L",
            operator: "Arif",
            qc: "passed",
            note: "Fermentasi berjalan normal."
        }

    ],


    /* =====================================================
       BATCH TIMELINE
    ===================================================== */

    timeline: [

        {
            stage: "production",
            date: "26 Sep 2026",
            time: "10:15",
            status: "completed",
            note: "Batch dibuat."
        },

        {
            stage: "f1",
            date: "27 Sep 2026",
            time: "09:20",
            status: "completed",
            note: "F1 selesai."
        },

        {
            stage: "f2",
            date: "29 Sep 2026",
            time: "10:15",
            status: "active",
            note: "Sedang berjalan."
        },

        {
            stage: "harvest",
            date: "01 Okt 2026",
            time: null,
            status: "upcoming",
            note: "Menunggu F2 selesai."
        },

        {
            stage: "bottling",
            date: null,
            time: null,
            status: "upcoming",
            note: "Menunggu Harvest."
        },

        {
            stage: "label",
            date: null,
            time: null,
            status: "upcoming",
            note: "Menunggu Bottling."
        },

        {
            stage: "finished",
            date: null,
            time: null,
            status: "upcoming",
            note: "Menunggu proses sebelumnya."
        }

    ]
},


"KB-023": {
    code: "KB-023",
    product: "Berry Kombucha",
    type: "kombucha",
    status: "F1 ACTIVE",
    stage: "F1 Fermentasi",
    progress: 70,
    day: 5,
    targetDays: 7,
    startDate: "25 Sep 2026",
    targetDate: "02 Okt 2026",
    volume: "24 L",
    hpp: "Rp 9.100",
    ph: "3.48",
    brix: "8.0°",
    temperature: "24.9°C",
    duration: "5 Hari"
},


"KB-024": {
    code: "KB-024",
    product: "Jahe Kombucha",
    type: "kombucha",
    status: "F2 ACTIVE",
    stage: "F2 Fermentasi",
    progress: 90,
    day: 5,
    targetDays: 5,
    startDate: "24 Sep 2026",
    targetDate: "29 Sep 2026",
    volume: "18 L",
    hpp: "Rp 8.900",
    ph: "3.38",
    brix: "7.2°",
    temperature: "25.8°C",
    duration: "5 Hari"
},


"KB-025": {
    code: "KB-025",
    product: "Telang Kombucha",
    type: "kombucha",
    status: "READY HARVEST",
    stage: "Harvest",
    progress: 100,
    day: 7,
    targetDays: 7,
    startDate: "20 Sep 2026",
    targetDate: "27 Sep 2026",
    volume: "20 L",
    hpp: "Rp 8.750",
    ph: "3.30",
    brix: "7.1°",
    temperature: "25.0°C",
    duration: "7 Hari"
},


"KB-026": {
    code: "KB-026",
    product: "Original Kombucha",
    type: "kombucha",
    status: "F2 ACTIVE",
    stage: "F2 Fermentasi",
    progress: 40,
    day: 2,
    targetDays: 5,
    startDate: "28 Sep 2026",
    targetDate: "03 Okt 2026",
    volume: "20 L",
    hpp: "Rp 8.300",
    ph: "3.60",
    brix: "8.4°",
    temperature: "25.2°C",
    duration: "2 Hari"
},


"KB-027": {
    code: "KB-027",
    product: "Lemon Kombucha",
    type: "kombucha",
    status: "F1 ACTIVE",
    stage: "F1 Fermentasi",
    progress: 15,
    day: 1,
    targetDays: 7,
    startDate: "29 Sep 2026",
    targetDate: "06 Okt 2026",
    volume: "20 L",
    hpp: "Rp 8.500",
    ph: "3.70",
    brix: "8.7°",
    temperature: "24.8°C",
    duration: "1 Hari"
},


"KB-028": {
    code: "KB-028",
    product: "Berry Kombucha",
    type: "kombucha",
    status: "F2 ACTIVE",
    stage: "F2 Fermentasi",
    progress: 20,
    day: 1,
    targetDays: 5,
    startDate: "29 Sep 2026",
    targetDate: "04 Okt 2026",
    volume: "24 L",
    hpp: "Rp 9.050",
    ph: "3.68",
    brix: "8.3°",
    temperature: "25.3°C",
    duration: "1 Hari"
}

};

/* =========================================================
GET BATCH ID
========================================================= */

function getBatchId(){

const params =
    new URLSearchParams(
        window.location.search
    );

return (
    params.get("id") ||
    "KB-022"
);

}

/* =========================================================
LOAD BATCH
========================================================= */

function getCurrentBatch(){

const batchId =
    getBatchId();

return (
    batchDetailData[batchId] ||
    batchDetailData["KB-022"]
);

}

/* =========================================================
NORMALIZE STAGE
========================================================= */

function normalizeBatchStage(stage){

if(!stage){

    return "production";

}


const normalized =
    String(stage)
        .trim()
        .toLowerCase();


if(
    normalized === "production"
    ||
    normalized === "produksi"
){

    return "production";

}


if(
    normalized === "f1"
    ||
    normalized.includes("f1")
){

    return "f1";

}


if(
    normalized === "f2"
    ||
    normalized.includes("f2")
){

    return "f2";

}


if(
    normalized === "harvest"
    ||
    normalized === "panen"
){

    return "harvest";

}


if(
    normalized === "bottling"
    ||
    normalized === "bottle"
    ||
    normalized === "pembotolan"
){

    return "bottling";

}


if(
    normalized === "label"
    ||
    normalized.includes("qr")
){

    return "label";

}


if(
    normalized === "finished"
    ||
    normalized === "selesai"
){

    return "finished";

}


return "production";

}

/* =========================================================
STATUS CLASS
========================================================= */

function getBatchStatusClass(status){

if(!status){

    return "active";

}


const normalized =
    String(status)
        .toLowerCase();


if(
    normalized.includes("harvest")
    ||
    normalized.includes("ready")
){

    return "harvest";

}


if(
    normalized.includes("delay")
    ||
    normalized.includes("terlambat")
){

    return "delayed";

}


return "active";

}

/* =========================================================
FORMAT DATE
YYYY-MM-DD → DD Mon YYYY
========================================================= */

function formatFermentationDate(value){

if(!value){

    return "—";

}


const parts =
    String(value).split("-");


if(parts.length !== 3){

    return value;

}


const year =
    parts[0];

const month =
    Number(parts[1]);

const day =
    Number(parts[2]);


const monthNames = [

    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des"

];


return `${day} ${monthNames[month - 1]} ${year}`;

}

/* =========================================================
GET CURRENT LOCAL DATE
========================================================= */

function getLocalDateValue(){

const now =
    new Date();


const year =
    now.getFullYear();


const month =
    String(
        now.getMonth() + 1
    ).padStart(
        2,
        "0"
    );


const day =
    String(
        now.getDate()
    ).padStart(
        2,
        "0"
    );


return `${year}-${month}-${day}`;

}

/* =========================================================
GET CURRENT LOCAL TIME
========================================================= */

function getLocalTimeValue(){

const now =
    new Date();


const hours =
    String(
        now.getHours()
    ).padStart(
        2,
        "0"
    );


const minutes =
    String(
        now.getMinutes()
    ).padStart(
        2,
        "0"
    );


return `${hours}:${minutes}`;

}

/* =========================================================
RENDER BATCH
========================================================= */

function renderBatchDetail(){

const batch =
    getCurrentBatch();


if(!batch){

    console.warn(
        "MERAMU: Batch tidak ditemukan."
    );

    return;

}


/* -----------------------------------------------
   BASIC INFO
------------------------------------------------ */

const product =
    document.getElementById(
        "batchProduct"
    );

const code =
    document.getElementById(
        "batchCode"
    );

const status =
    document.getElementById(
        "batchStatus"
    );


if(product){

    product.textContent =
        batch.product;

}


if(code){

    code.textContent =
        batch.code;

}


if(status){

    status.textContent =
        batch.status;

    status.className =
        `batch-status ${getBatchStatusClass(batch.status)}`;

}


/* -----------------------------------------------
   STAGE
------------------------------------------------ */

const stage =
    document.getElementById(
        "batchStage"
    );


if(stage){

    stage.textContent =
        batch.stage;

}


/* -----------------------------------------------
   PROGRESS
------------------------------------------------ */

const progress =
    document.getElementById(
        "batchProgress"
    );

const progressBar =
    document.getElementById(
        "batchProgressBar"
    );


if(progress){

    progress.textContent =
        `${batch.progress}%`;

}


if(progressBar){

    progressBar.style.width =
        `${batch.progress}%`;

}


/* -----------------------------------------------
   PROGRESS META
------------------------------------------------ */

const progressMeta =
    document.querySelector(
        ".batch-progress-meta"
    );


if(progressMeta){

    progressMeta.innerHTML = `

        <span>
            Hari ke-${batch.day}
            dari ${batch.targetDays} hari
        </span>

        <span>
            Target ${batch.targetDate}
        </span>

    `;

}


/* -----------------------------------------------
   KPI
------------------------------------------------ */

const kpiCards =
    document.querySelectorAll(
        ".batch-kpi-card"
    );


if(kpiCards.length >= 4){

    const startValue =
        kpiCards[0]
            .querySelector("strong");


    if(startValue){

        startValue.textContent =
            batch.startDate;

    }


    const targetValue =
        kpiCards[1]
            .querySelector("strong");


    if(targetValue){

        targetValue.textContent =
            batch.targetDate;

    }


    const targetMeta =
        kpiCards[1]
            .querySelector(
                "span:last-child"
            );


    if(targetMeta){

        targetMeta.textContent =
            `${batch.targetDays} hari`;

    }


    const volumeValue =
        kpiCards[2]
            .querySelector("strong");


    if(volumeValue){

        volumeValue.textContent =
            batch.volume;

    }


    const hppValue =
        kpiCards[3]
            .querySelector("strong");


    if(hppValue){

        hppValue.textContent =
            batch.hpp;

    }

}


/* -----------------------------------------------
   FERMENTATION METRICS
------------------------------------------------ */

const metrics =
    document.querySelectorAll(
        ".fermentation-metric strong"
    );


if(metrics.length >= 4){

    metrics[0].textContent =
        batch.ph;

    metrics[1].textContent =
        batch.brix;

    metrics[2].textContent =
        batch.temperature;

    metrics[3].textContent =
        batch.duration;

}


/* -----------------------------------------------
   BATCH TIMELINE
------------------------------------------------ */

renderBatchTimeline(
    batch
);


/* -----------------------------------------------
   FERMENTATION LOG
------------------------------------------------ */

renderFermentationLogs(
    batch
);


console.log(
    "MERAMU Batch Detail:",
    batch
);

}

/* =========================================================
BATCH TIMELINE
========================================================= */

function renderBatchTimeline(batch){

const container =
    document.getElementById(
        "batchTimeline"
    );


if(!container){

    console.warn(
        "MERAMU: #batchTimeline tidak ditemukan."
    );

    return;

}


if(!batch){

    container.innerHTML = "";

    return;

}


/* =====================================================
   STAGE CONFIG
===================================================== */

const stageConfig = {

    production: {

        title: "Production",

        description:
            "Batch dibuat dan proses produksi dimulai.",

        icon: "flask-conical"

    },


    f1: {

        title: "F1 Fermentasi",

        description:
            "Fermentasi primer.",

        icon: "beaker"

    },


    f2: {

        title: "F2 Fermentasi",

        description:
            "Fermentasi sekunder dan pengembangan rasa.",

        icon: "wine"

    },


    harvest: {

        title: "Harvest",

        description:
            "Batch siap dipanen.",

        icon: "leaf"

    },


     bottling: {
     
         title: "Bottling",
     
         description:
             "Produk masuk proses pembotolan.",
     
         icon: "cylinder"
     
     },

    label: {

        title: "Label / QR",

        description:
            "Label dan QR traceability.",

        icon: "qr-code"

    },


    finished: {

        title: "Finished",

        description:
            "Batch selesai dan siap masuk inventory.",

        icon: "package-check"

    }

};


/* =====================================================
   DEFAULT STAGES
===================================================== */

const defaultStages = [

    "production",

    "f1",

    "f2",

    "harvest",

    "bottling",

    "label",

    "finished"

];


/* =====================================================
   GET EVENTS
===================================================== */

let events =
    Array.isArray(batch.timeline)
        ? batch.timeline
        : [];


/* =====================================================
   FALLBACK
===================================================== */

if(!events.length){

    const currentStage =
        normalizeBatchStage(
            batch.stage
        );


    const stageOrder = {

        production: 0,

        f1: 1,

        f2: 2,

        harvest: 3,

        bottling: 4,

        label: 5,

        finished: 6

    };


    const currentIndex =
        stageOrder[currentStage] ?? 0;


    events =
        defaultStages.map(
            (stage,index) => {

                let status =
                    "upcoming";


                if(index < currentIndex){

                    status =
                        "completed";

                }

                else if(
                    index === currentIndex
                ){

                    status =
                        "active";

                }


                return {

                    stage: stage,

                    date: null,

                    time: null,

                    status: status,

                    note:
                        stageConfig[stage]
                            ?.description || ""

                };

            }
        );

}


/* =====================================================
   DIRECT PRODUCTION
===================================================== */

if(batch.type === "direct"){

    events =
        events.filter(
            event => {

                return ![
                    "f1",
                    "f2",
                    "harvest"
                ].includes(
                    event.stage
                );

            }
        );

}


/* =====================================================
   RENDER TIMELINE
===================================================== */

container.innerHTML =
    events.map(
        (event,index) => {

            const config =
                stageConfig[event.stage];


            if(!config){

                return "";

            }


            const status =
                event.status ||
                "upcoming";


            /* -----------------------------------------
               DATE
            ----------------------------------------- */

            let dateText =
                "—";


            if(event.date){

                dateText =
                    event.date;

            }


            if(
                event.date &&
                event.time
            ){

                dateText =
                    `${event.date} • ${event.time}`;

            }


            /* -----------------------------------------
               NOTE
            ----------------------------------------- */

            const note =
                event.note ||
                config.description;


            /* -----------------------------------------
               CONNECTOR
            ----------------------------------------- */

            const connector =
                index <
                events.length - 1

                ? `
                    <div
                        class="history-line"
                    ></div>
                `

                : "";


            return `

                <div
                    class="history-item ${status}"
                >

                    <div class="history-icon">

                        <i
                            data-lucide="${config.icon}"
                        ></i>

                    </div>


                    <div class="history-content">

                        <strong>
                            ${config.title}
                        </strong>

                        <span>
                            ${note}
                        </span>

                    </div>


                    <time>
                        ${dateText}
                    </time>

                </div>

                ${connector}

            `;

        }
    ).join("");


if(window.lucide){

    lucide.createIcons();

}

}

/* =========================================================
FERMENTATION LOG
========================================================= */

function renderFermentationLogs(batch){

const container =
    document.getElementById(
        "fermentationLogList"
    );


const count =
    document.getElementById(
        "fermentationLogCount"
    );


if(!container){

    console.warn(
        "MERAMU: #fermentationLogList tidak ditemukan."
    );

    return;

}


const logs =
    Array.isArray(batch?.fermentationLogs)
        ? batch.fermentationLogs
        : [];


if(count){

    count.textContent =
        logs.length;

}


if(!logs.length){

    container.innerHTML = `

        <div class="fermentation-log-empty">

            <i data-lucide="clipboard-list"></i>

            <strong>
                Belum ada fermentation log
            </strong>

            <span>
                Belum ada pengukuran yang tercatat
                untuk batch ini.
            </span>

        </div>

    `;


    if(window.lucide){

        lucide.createIcons();

    }


    return;

}


container.innerHTML =
    logs.map(
        log => {

            const qcClass =
                log.qc === "passed"
                    ? "passed"
                    : "failed";


            const qcLabel =
                log.qc === "passed"
                    ? "Passed"
                    : log.qc === "warning"
                        ? "Warning"
                        : "Failed";


            const stageLabel =
                log.stage
                    ? String(log.stage)
                        .toUpperCase()
                    : "—";


            return `

                <article
                    class="fermentation-log-item"
                >


                    <div
                        class="fermentation-log-top"
                    >

                        <div
                            class="fermentation-log-date"
                        >

                            <div
                                class="fermentation-log-icon"
                            >

                                <i
                                    data-lucide="activity"
                                ></i>

                            </div>


                            <div>

                                <strong>
                                    ${log.date || "—"}
                                </strong>

                                <span>
                                    ${log.time || "—"}
                                </span>

                            </div>

                        </div>


                        <span
                            class="log-stage"
                        >
                            ${stageLabel}
                        </span>


                    </div>


                    <div
                        class="fermentation-log-metrics"
                    >

                        <div class="log-metric">

                            <span>
                                pH
                            </span>

                            <strong>
                                ${log.ph || "—"}
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>
                                Brix
                            </span>

                            <strong>
                                ${log.brix || "—"}
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>
                                Suhu
                            </span>

                            <strong>
                                ${log.temperature || "—"}
                            </strong>

                        </div>


                        <div class="log-metric">

                            <span>
                                Volume
                            </span>

                            <strong>
                                ${log.volume || "—"}
                            </strong>

                        </div>

                    </div>


                    <div
                        class="fermentation-log-bottom"
                    >

                        <div
                            class="log-operator"
                        >

                            <i
                                data-lucide="user-round"
                            ></i>

                            <span>
                                ${log.operator || "—"}
                            </span>

                        </div>


                        <span
                            class="log-qc ${qcClass}"
                        >
                            ${qcLabel}
                        </span>

                    </div>


                    ${
                        log.note
                            ? `

                                <div
                                    class="fermentation-log-note"
                                >

                                    <i
                                        data-lucide="message-square"
                                    ></i>

                                    <span>
                                        ${log.note}
                                    </span>

                                </div>

                            `
                            : ""
                    }


                </article>

            `;

        }
    ).join("");


if(window.lucide){

    lucide.createIcons();

}

}

/* =========================================================
OPEN FERMENTATION LOG MODAL
========================================================= */

function openFermentationLogModal(){

const modal =
    document.getElementById(
        "fermentationLogModal"
    );


if(!modal){

    console.warn(
        "MERAMU: Modal fermentation log tidak ditemukan."
    );

    return;

}


const batch =
    getCurrentBatch();


/* -----------------------------------------------------
   DEFAULT FORM
----------------------------------------------------- */

const stageInput =
    document.getElementById(
        "logStage"
    );

const dateInput =
    document.getElementById(
        "logDate"
    );

const timeInput =
    document.getElementById(
        "logTime"
    );

const operatorInput =
    document.getElementById(
        "logOperator"
    );


if(stageInput){

    stageInput.value =
        normalizeBatchStage(
            batch?.stage
        ) === "f1"

            ? "f1"

            : "f2";

}


if(dateInput){

    dateInput.value =
        getLocalDateValue();

}


if(timeInput){

    timeInput.value =
        getLocalTimeValue();

}


const logs =
    Array.isArray(
        batch?.fermentationLogs
    )
        ? batch.fermentationLogs
        : [];


const latestLog =
    logs.length
        ? logs[0]
        : null;


if(operatorInput){

    operatorInput.value =
        latestLog?.operator ||
        "Arif";

}


/* -----------------------------------------------------
   OPEN
----------------------------------------------------- */

modal.hidden =
    false;

modal.setAttribute(
    "aria-hidden",
    "false"
);


document.body.classList.add(
    "modal-open"
);


/* -----------------------------------------------------
   FOCUS
----------------------------------------------------- */

setTimeout(
    () => {

        const firstInput =
            document.getElementById(
                "logPh"
            );


        if(firstInput){

            firstInput.focus();

        }

    },
    50
);


if(window.lucide){

    lucide.createIcons();

}

}

/* =========================================================
CLOSE FERMENTATION LOG MODAL
========================================================= */

function closeFermentationLogModal(){

const modal =
    document.getElementById(
        "fermentationLogModal"
    );


if(!modal){

    return;

}


modal.hidden =
    true;


modal.setAttribute(
    "aria-hidden",
    "true"
);


document.body.classList.remove(
    "modal-open"
);

}

/* =========================================================
RESET FORM
========================================================= */

function resetFermentationLogForm(){

const form =
    document.getElementById(
        "fermentationLogForm"
    );


if(!form){

    return;

}


form.reset();


const batch =
    getCurrentBatch();


const stageInput =
    document.getElementById(
        "logStage"
    );

const dateInput =
    document.getElementById(
        "logDate"
    );

const timeInput =
    document.getElementById(
        "logTime"
    );

const qcInput =
    document.getElementById(
        "logQc"
    );

const operatorInput =
    document.getElementById(
        "logOperator"
    );


if(stageInput){

    stageInput.value =
        normalizeBatchStage(
            batch?.stage
        ) === "f1"

            ? "f1"

            : "f2";

}


if(dateInput){

    dateInput.value =
        getLocalDateValue();

}


if(timeInput){

    timeInput.value =
        getLocalTimeValue();

}


if(qcInput){

    qcInput.value =
        "passed";

}


const logs =
    Array.isArray(
        batch?.fermentationLogs
    )
        ? batch.fermentationLogs
        : [];


if(operatorInput){

    operatorInput.value =
        logs[0]?.operator ||
        "Arif";

}

}

/* =========================================================
   SAVE FERMENTATION LOG
   Supabase
========================================================= */

function saveFermentationLog(event){

    /* =====================================================
       PREVENT DEFAULT
    ===================================================== */

    if(event){
        event.preventDefault();
    }


    /* =====================================================
       GET FORM
    ===================================================== */

    const form =
        document.getElementById(
            "fermentationLogForm"
        );


    if(!form){

        console.warn(
            "MERAMU: fermentationLogForm tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       VALIDATE FORM
    ===================================================== */

    if(!form.checkValidity()){

        form.reportValidity();

        return;

    }


    /* =====================================================
       GET CURRENT BATCH
    ===================================================== */

    const batch =
        getCurrentBatch();


    if(!batch){

        alert(
            "Batch tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       SUPABASE CLIENT
    ===================================================== */

    const supabase =
        window.supabaseClient;


    if(!supabase){

        console.error(
            "MERAMU: Supabase client tidak tersedia."
        );

        alert(
            "Koneksi database belum siap. Silakan coba lagi."
        );

        return;

    }


    /* =====================================================
       GET FORM VALUES
    ===================================================== */

    const stage =
        document.getElementById(
            "logStage"
        )?.value || "f2";


    const date =
        document.getElementById(
            "logDate"
        )?.value || "";


    const time =
        document.getElementById(
            "logTime"
        )?.value || "";


    const ph =
        Number(
            document.getElementById(
                "logPh"
            )?.value
        );


    const brix =
        Number(
            document.getElementById(
                "logBrix"
            )?.value
        );


    const temperature =
        Number(
            document.getElementById(
                "logTemperature"
            )?.value
        );


    const volume =
        Number(
            document.getElementById(
                "logVolume"
            )?.value
        );


    const qc =
        document.getElementById(
            "logQc"
        )?.value || "passed";


    const operator =
        document.getElementById(
            "logOperator"
        )?.value.trim() || "Arif";


    const note =
        document.getElementById(
            "logNote"
        )?.value.trim() || "";


    /* =====================================================
       VALIDATE NUMERIC DATA
    ===================================================== */

    if(
        !Number.isFinite(ph) ||
        !Number.isFinite(brix) ||
        !Number.isFinite(temperature) ||
        !Number.isFinite(volume)
    ){

        alert(
            "pH, Brix, suhu, dan volume harus berupa angka."
        );

        return;

    }


    /* =====================================================
       VALIDATE DATE / TIME
    ===================================================== */

    if(
        !date ||
        !time
    ){

        alert(
            "Tanggal dan waktu wajib diisi."
        );

        return;

    }


    /* =====================================================
       MEASURED AT
    ===================================================== */

    const measuredAt =
        `${date}T${time}:00`;


    /* =====================================================
       SUBMIT BUTTON
    ===================================================== */

    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    const originalButtonHTML =
        submitButton
            ? submitButton.innerHTML
            : "";


    if(submitButton){

        submitButton.disabled =
            true;

        submitButton.innerHTML =
            "Menyimpan...";

    }


    /* =====================================================
       FIND BATCH UUID
    ===================================================== */

    console.log(
        "MERAMU: Mencari batch:",
        batch.code
    );


    supabase

        .from("batches")

        .select(
            "id,batch_code"
        )

        .eq(
            "batch_code",
            batch.code
        )

        .maybeSingle()

        .then(function(batchResult){

            /* =============================================
               BATCH QUERY ERROR
            ============================================= */

            if(batchResult.error){

                throw batchResult.error;

            }


            /* =============================================
               BATCH NOT FOUND
            ============================================= */

            if(!batchResult.data){

                throw new Error(
                    `Batch ${batch.code} tidak ditemukan di Supabase.`
                );

            }


            const batchUuid =
                batchResult.data.id;


            console.log(
                "MERAMU: Batch UUID:",
                batchUuid
            );


            /* =============================================
               PAYLOAD
               
               SESUAI STRUKTUR DATABASE:
               
               temperature_c
               operator_name
               qc_status
               notes
            ============================================= */

            const payload = {

                batch_id:
                    batchUuid,

                stage:
                    stage,

                measured_at:
                    measuredAt,

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
                "MERAMU: Menyimpan fermentation log:",
                payload
            );


            /* =============================================
               INSERT
            ============================================= */

            return supabase

                .from(
                    "fermentation_logs"
                )

                .insert(
                    payload
                )

                .select("*")

                .single();

        })


        /* =================================================
           INSERT RESULT
        ================================================= */

        .then(function(logResult){

            if(logResult.error){

                throw logResult.error;

            }


            console.log(
                "MERAMU: Fermentation Log berhasil disimpan.",
                logResult.data
            );


            /* =============================================
               CLOSE MODAL
            ============================================= */

            closeFermentationLogModal();


            /* =============================================
               RESET FORM
            ============================================= */

            resetFermentationLogForm();


            /* =============================================
               RELOAD LOG DARI SUPABASE
            ============================================= */

            if(
                typeof window.initBatchFermentationLogs ===
                "function"
            ){

                return window
                    .initBatchFermentationLogs();

            }


            return null;

        })


        /* =================================================
           SUCCESS
        ================================================= */

        .then(function(){

            console.log(
                "MERAMU: Fermentation Log selesai diproses."
            );

        })


        /* =================================================
           ERROR
        ================================================= */

        .catch(function(error){

            console.error(
                "MERAMU: Gagal menyimpan fermentation log.",
                error
            );


            alert(
                "Fermentation Log gagal disimpan.\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );

        })


        /* =================================================
           RESTORE BUTTON
        ================================================= */

        .finally(function(){

            if(submitButton){

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    originalButtonHTML;

            }

        });

}
/* =========================================================
EDIT BATCH
========================================================= */

function formatDateForInput(value){

if(!value){
    return "";
}

const text =
    String(value).trim();

/* Jika sudah YYYY-MM-DD */
const isoMatch =
    text.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

if(isoMatch){

    return text;

}


/* Format: 01 Okt 2026 */
const parts =
    text.split(/\s+/);

if(parts.length !== 3){

    return "";

}


const day =
    String(
        parts[0]
    ).padStart(
        2,
        "0"
    );


const monthMap = {

    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    Mei: "05",
    Jun: "06",
    Jul: "07",
    Agu: "08",
    Sep: "09",
    Okt: "10",
    Nov: "11",
    Des: "12"

};


const month =
    monthMap[
        parts[1]
    ];


if(
    !month ||
    !/^\d{4}$/.test(parts[2])
){

    return "";

}


return `${parts[2]}-${month}-${day}`;

}

/* =========================================================
GET EDIT MODAL
========================================================= */

function getEditBatchModal(){

return document.getElementById(
    "editBatchModal"
);

}

/* =========================================================
OPEN EDIT BATCH
========================================================= */

function openEditBatchModal(){

const modal =
    getEditBatchModal();


const batch =
    getCurrentBatch();


if(
    !modal ||
    !batch
){

    console.warn(
        "MERAMU: Edit Batch modal atau batch tidak ditemukan."
    );

    return;

}


const productInput =
    document.getElementById(
        "editProduct"
    );


const volumeInput =
    document.getElementById(
        "editVolume"
    );


const targetDateInput =
    document.getElementById(
        "editTargetDate"
    );


const stageInput =
    document.getElementById(
        "editStage"
    );


const noteInput =
    document.getElementById(
        "editNote"
    );


/* PRODUCT */

if(productInput){

    productInput.value =
        batch.product || "";

}


/* VOLUME */

if(volumeInput){

    const numericVolume =
        String(
            batch.volume || ""
        )
        .replace(",",".")
        .match(
            /[\d.]+/
        );


    volumeInput.value =
        numericVolume
            ? numericVolume[0]
            : "";

}


/* TARGET DATE */

if(targetDateInput){

    targetDateInput.value =
        formatDateForInput(
            batch.targetDate
        );

}


/* STAGE */

if(stageInput){

    const normalizedStage =
        normalizeBatchStage(
            batch.stage
        );


    stageInput.value =
        normalizedStage;

}


/* NOTE */

if(noteInput){

    noteInput.value =
        batch.note || "";

}


/* OPEN */

modal.hidden =
    false;


modal.setAttribute(
    "aria-hidden",
    "false"
);


document.body.classList.add(
    "modal-open"
);


/* FOCUS */

setTimeout(
    () => {

        if(productInput){

            productInput.focus();

        }

    },
    50
);


if(window.lucide){

    lucide.createIcons();

}

}

/* =========================================================
CLOSE EDIT BATCH
========================================================= */

function closeEditBatchModal(){

const modal =
    getEditBatchModal();


if(!modal){

    return;

}


modal.hidden =
    true;


modal.setAttribute(
    "aria-hidden",
    "true"
);


document.body.classList.remove(
    "modal-open"
);

}

/* =========================================================
RESET EDIT FORM
========================================================= */

function resetEditBatchForm(){

const form =
    document.getElementById(
        "editBatchForm"
    );


if(form){

    form.reset();

}

}

/* =========================================================
STAGE LABEL
========================================================= */

function getStageLabel(stage){

const labels = {

    production:
        "Production",

    f1:
        "F1 Fermentasi",

    f2:
        "F2 Fermentasi",

    harvest:
        "Harvest",

    bottling:
        "Bottling",

    label:
        "Label / QR",

    finished:
        "Finished"

};


return (
    labels[stage] ||
    stage
);

}

/* =========================================================
UPDATE TIMELINE
========================================================= */

function updateBatchStageTimeline(
batch,
normalizedStage
){

if(!batch){

    return;

}


if(
    !Array.isArray(
        batch.timeline
    )
){

    batch.timeline = [];

}


const stageOrder = [

    "production",

    "f1",

    "f2",

    "harvest",

    "bottling",

    "label",

    "finished"

];


const currentIndex =
    Math.max(
        0,
        stageOrder.indexOf(
            normalizedStage
        )
    );


const now =
    new Date();


const monthNames = [

    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des"

];


const date =
    `${String(
        now.getDate()
    ).padStart(
        2,
        "0"
    )} ${
        monthNames[
            now.getMonth()
        ]
    } ${
        now.getFullYear()
    }`;


const time =
    `${String(
        now.getHours()
    ).padStart(
        2,
        "0"
    )}:${
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        )
    }`;


batch.timeline =
    stageOrder.map(
        (
            stage,
            index
        ) => {

            const existing =
                batch.timeline.find(
                    item =>
                        normalizeBatchStage(
                            item.stage
                        ) === stage
                );


            if(existing){

                return {

                    ...existing,

                    stage:

                        stage,

                    status:

                        index <
                        currentIndex

                            ? "completed"

                            : index ===
                              currentIndex

                                ? "active"

                                : "upcoming"

                };

            }


            return {

                stage:

                    stage,

                date:

                    index ===
                    currentIndex

                        ? date

                        : null,

                time:

                    index ===
                    currentIndex

                        ? time

                        : null,

                status:

                    index <
                    currentIndex

                        ? "completed"

                        : index ===
                          currentIndex

                            ? "active"

                            : "upcoming",

                note:

                    index ===
                    currentIndex

                        ? `Stage diubah ke ${getStageLabel(stage)}.`

                        : ""

            };

        }
    );

}

/* =========================================================
   SAVE EDIT BATCH
   Supabase Version
========================================================= */

function saveEditBatch(event){

    if(event){
        event.preventDefault();
    }


    /* =====================================================
       FORM
    ===================================================== */

    const form =
        document.getElementById(
            "editBatchForm"
        );


    if(!form){

        console.warn(
            "MERAMU: editBatchForm tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       VALIDATE FORM
    ===================================================== */

    if(!form.checkValidity()){

        form.reportValidity();

        return;

    }


    /* =====================================================
       CURRENT BATCH
    ===================================================== */

    const batch =
        getCurrentBatch();


    if(!batch){

        alert(
            "Batch tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    const supabase =
        window.supabaseClient;


    if(!supabase){

        console.error(
            "MERAMU: Supabase client tidak tersedia."
        );

        alert(
            "Koneksi database belum siap. Silakan coba lagi."
        );

        return;

    }


    /* =====================================================
       FORM VALUES
    ===================================================== */

    const product =
        document.getElementById(
            "editProduct"
        )?.value.trim();


    const volume =
        document.getElementById(
            "editVolume"
        )?.value.trim();


    const targetDate =
        document.getElementById(
            "editTargetDate"
        )?.value;


    const stage =
        document.getElementById(
            "editStage"
        )?.value;


    const note =
        document.getElementById(
            "editNote"
        )?.value.trim() || "";


    /* =====================================================
       VALIDATION
    ===================================================== */

    if(!product){

        alert(
            "Product wajib diisi."
        );

        return;

    }


    if(
        !volume ||
        Number(volume) <= 0
    ){

        alert(
            "Volume harus lebih besar dari 0."
        );

        return;

    }


    if(!targetDate){

        alert(
            "Target date wajib diisi."
        );

        return;

    }


    if(!stage){

        alert(
            "Stage wajib dipilih."
        );

        return;

    }


    const normalizedStage =
        normalizeBatchStage(
            stage
        );


    /* =====================================================
       CALCULATE STATUS
    ===================================================== */

    let status = "";


    if(
        normalizedStage ===
        "harvest"
    ){

        status =
            "READY HARVEST";

    }

    else if(
        normalizedStage ===
        "finished"
    ){

        status =
            "FINISHED";

    }

    else if(
        normalizedStage ===
        "production"
    ){

        status =
            "PRODUCTION ACTIVE";

    }

    else{

        status =
            `${getStageLabel(
                normalizedStage
            )
            .replace(
                " Fermentasi",
                ""
            )
            .toUpperCase()} ACTIVE`;

    }


    /* =====================================================
       CALCULATE PROGRESS
    ===================================================== */

    let progress =
        batch.progress || 0;


    if(
        normalizedStage ===
        "harvest"
        ||
        normalizedStage ===
        "finished"
    ){

        progress =
            100;

    }

    else{

        const stageProgress = {

            production: 10,

            f1: 50,

            f2: 80,

            bottling: 90,

            label: 95

        };


        if(
            stageProgress[
                normalizedStage
            ] !== undefined
        ){

            progress =
                stageProgress[
                    normalizedStage
                ];

        }

    }


    /* =====================================================
       SUBMIT BUTTON
    ===================================================== */

    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    const originalButtonHTML =
        submitButton
            ? submitButton.innerHTML
            : "";


    if(submitButton){

        submitButton.disabled =
            true;

        submitButton.innerHTML =
            "Menyimpan...";

    }


    /* =====================================================
       FIND PRODUCT
    ===================================================== */

    console.log(
        "MERAMU: Mencari product:",
        product
    );


    supabase

        .from("products")

        .select(
            "id,name"
        )

        .eq(
            "name",
            product
        )

        .maybeSingle()

        .then(function(productResult){

            /* =============================================
               PRODUCT QUERY ERROR
            ============================================= */

            if(productResult.error){

                throw productResult.error;

            }


            /* =============================================
               PRODUCT NOT FOUND
            ============================================= */

            if(!productResult.data){

                throw new Error(
                    `Product "${product}" tidak ditemukan di database.`
                );

            }


            const productId =
                productResult.data.id;


            console.log(
                "MERAMU: Product UUID:",
                productId
            );


            /* =============================================
               UPDATE PAYLOAD
            ============================================= */

            const payload = {

                product_id:
                    productId,

                target_date:
                    targetDate,

                planned_volume:
                    Number(volume),

                current_stage:
                    normalizedStage,

                status:
                    status,

                notes:
                    note || null

            };


            console.log(
                "MERAMU: UPDATE batch:",
                payload
            );


            /* =============================================
               UPDATE BATCH
            ============================================= */

            return supabase

                .from(
                    "batches"
                )

                .update(
                    payload
                )

                .eq(
                    "id",
                    batch.id
                )

                .select(
                    "*"
                )

                .single();

        })


        /* =================================================
           UPDATE RESULT
        ================================================= */

        .then(function(updateResult){

            if(updateResult.error){

                throw updateResult.error;

            }


            console.log(
                "MERAMU: Batch berhasil diperbarui di Supabase.",
                updateResult.data
            );


            /* =================================================
               UPDATE LOCAL DATA
               Supaya UI langsung berubah
            ================================================= */

            batch.product =
                product;


            batch.volume =
                `${Number(
                    volume
                ).toFixed(
                    1
                )} L`;


            batch.targetDate =
                formatFermentationDate(
                    targetDate
                );


            batch.stage =
                getStageLabel(
                    normalizedStage
                );


            batch.note =
                note;


            batch.status =
                status;


            batch.progress =
                progress;


            if(
                normalizedStage ===
                "harvest"
                ||
                normalizedStage ===
                "finished"
            ){

                batch.day =
                    batch.targetDays;

            }


            /* =================================================
               UPDATE TIMELINE
            ================================================= */

            updateBatchStageTimeline(
                batch,
                normalizedStage
            );


            /* =================================================
               RENDER
            ================================================= */

            renderBatchDetail();


            /* =================================================
               CLOSE MODAL
            ================================================= */

            closeEditBatchModal();


            /* =================================================
               RESET FORM
            ================================================= */

            resetEditBatchForm();


            console.log(
                "MERAMU: Edit Batch selesai.",
                batch
            );

        })


        /* =================================================
           ERROR
        ================================================= */

        .catch(function(error){

            console.error(
                "MERAMU: Gagal update batch.",
                error
            );


            alert(
                "Batch gagal diperbarui.\n\n" +
                (
                    error?.message ||
                    "Terjadi kesalahan."
                )
            );

        })


        /* =================================================
           RESTORE BUTTON
        ================================================= */

        .finally(function(){

            if(submitButton){

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    originalButtonHTML;

            }

        });

}
/* =========================================================
EDIT BATCH EVENTS
========================================================= */

document.addEventListener(
"click",
event => {

    /* -----------------------------------------------
       OPEN
    ----------------------------------------------- */

    const editButton =
        event.target.closest(
            "#editBatch"
        );


    if(editButton){

        openEditBatchModal();

        return;

    }


    /* -----------------------------------------------
       CLOSE
    ----------------------------------------------- */

    const closeEditButton =
        event.target.closest(
            "#closeEditBatch"
        );


    if(closeEditButton){

        closeEditBatchModal();

        return;

    }


    /* -----------------------------------------------
       CANCEL
    ----------------------------------------------- */

    const cancelEditButton =
        event.target.closest(
            "#cancelEditBatch"
        );


    if(cancelEditButton){

        closeEditBatchModal();

        return;

    }


    /* -----------------------------------------------
       BACKDROP
    ----------------------------------------------- */

    const editBackdrop =
        event.target.closest(
            "[data-close-edit-batch]"
        );


    if(editBackdrop){

        closeEditBatchModal();

    }

}

);

/* =========================================================
EDIT FORM SUBMIT
========================================================= */

document.addEventListener(
"submit",
event => {

    if(
        event.target.id !==
        "editBatchForm"
    ){

        return;

    }


    saveEditBatch(
        event
    );

}

);

/* =========================================================
ESCAPE
========================================================= */

document.addEventListener(
"keydown",
event => {

    if(
        event.key !==
        "Escape"
    ){

        return;

    }


    const modal =
        getEditBatchModal();


    if(
        modal &&
        !modal.hidden
    ){

        closeEditBatchModal();

    }

}

);

/* =========================================================
PRINT BATCH SHEET
========================================================= */

function escapePrintHtml(value){

if(value === null || value === undefined){
    return "";
}

return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function getPrintQcLabel(qc){

if(qc === "passed"){
    return "Passed";
}

if(qc === "warning"){
    return "Warning";
}

if(qc === "failed"){
    return "Failed";
}

return "—";

}

function printBatchSheet(){

const batch =
    getCurrentBatch();


if(!batch){

    console.warn(
        "MERAMU: Batch untuk print tidak ditemukan."
    );

    return;

}


const logs =
    Array.isArray(
        batch.fermentationLogs
    )
        ? batch.fermentationLogs
        : [];


const timeline =
    Array.isArray(
        batch.timeline
    )
        ? batch.timeline
        : [];


const printWindow =
    window.open(
        "",
        "_blank",
        "width=1100,height=800"
    );


if(!printWindow){

    alert(
        "Popup print diblokir browser. Izinkan popup untuk MERAMU."
    );

    return;

}


const logRows =
    logs.length

        ? logs.map(
            log => `

                <tr>

                    <td>
                        ${escapePrintHtml(
                            log.date || "—"
                        )}
                        <br>
                        <small>
                            ${escapePrintHtml(
                                log.time || "—"
                            )}
                        </small>
                    </td>

                    <td>
                        ${escapePrintHtml(
                            String(
                                log.stage || "—"
                            ).toUpperCase()
                        )}
                    </td>

                    <td>
                        ${escapePrintHtml(
                            log.ph || "—"
                        )}
                    </td>

                    <td>
                        ${escapePrintHtml(
                            log.brix || "—"
                        )}
                    </td>

                    <td>
                        ${escapePrintHtml(
                            log.temperature || "—"
                        )}
                    </td>

                    <td>
                        ${escapePrintHtml(
                            log.volume || "—"
                        )}
                    </td>

                    <td>
                        ${escapePrintHtml(
                            log.operator || "—"
                        )}
                    </td>

                    <td>
                        <span class="
                            qc-badge
                            ${escapePrintHtml(
                                log.qc || ""
                            )}
                        ">
                            ${escapePrintHtml(
                                getPrintQcLabel(
                                    log.qc
                                )
                            )}
                        </span>
                    </td>

                    <td>
                        ${escapePrintHtml(
                            log.note || "—"
                        )}
                    </td>

                </tr>

            `
        ).join("")

        : `

            <tr>

                <td
                    colspan="9"
                    class="empty-row"
                >
                    Belum ada fermentation log.
                </td>

            </tr>

        `;


const timelineRows =
    timeline.length

        ? timeline.map(
            event => `

                <div class="timeline-row">

                    <div class="timeline-stage">

                        <strong>
                            ${escapePrintHtml(
                                getStageLabel(
                                    normalizeBatchStage(
                                        event.stage
                                    )
                                )
                            )}
                        </strong>

                        <span>
                            ${escapePrintHtml(
                                event.note || "—"
                            )}
                        </span>

                    </div>

                    <div class="timeline-date">

                        ${escapePrintHtml(
                            event.date || "—"
                        )}

                        ${
                            event.time
                                ? `
                                    <br>
                                    <small>
                                        ${escapePrintHtml(
                                            event.time
                                        )}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                    <div
                        class="
                            timeline-status
                            ${escapePrintHtml(
                                event.status || "upcoming"
                            )}
                        "
                    >
                        ${escapePrintHtml(
                            event.status || "upcoming"
                        )}
                    </div>

                </div>

            `
        ).join("")

        : `

            <div class="empty-timeline">
                Belum ada timeline batch.
            </div>

        `;


const generatedAt =
    new Date().toLocaleString(
        "id-ID",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );


const printHtml = `

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>
    MERAMU • Batch ${escapePrintHtml(batch.code)}
</title>

<style>

*{
    box-sizing:border-box;
}

html,
body{
    margin:0;
    padding:0;
}

body{

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color:#17211C;

    background:#ffffff;

    font-size:12px;

    line-height:1.45;

}


.print-page{

    width:210mm;

    min-height:297mm;

    margin:0 auto;

    padding:14mm;

    background:#ffffff;

}


.header{

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    padding-bottom:16px;

    border-bottom:2px solid #046738;

}


.brand{

    display:flex;

    flex-direction:column;

    gap:3px;

}


.brand-name{

    font-size:24px;

    font-weight:800;

    letter-spacing:1px;

    color:#046738;

}


.brand-subtitle{

    font-size:10px;

    color:#6B7A72;

}


.document-info{

    text-align:right;

}


.document-title{

    font-size:18px;

    font-weight:700;

    color:#17211C;

}


.document-meta{

    margin-top:4px;

    font-size:10px;

    color:#6B7A72;

}


.batch-header{

    margin-top:20px;

    display:flex;

    justify-content:space-between;

    align-items:flex-start;

    gap:20px;

}


.batch-product{

    margin:0;

    font-size:22px;

    line-height:1.2;

    color:#17211C;

}


.batch-code{

    margin-top:5px;

    font-size:12px;

    font-weight:600;

    color:#046738;

}


.status{

    display:inline-flex;

    align-items:center;

    padding:6px 10px;

    border-radius:999px;

    background:#EAF5EF;

    color:#046738;

    font-size:10px;

    font-weight:700;

    white-space:nowrap;

}


.section{

    margin-top:22px;

}


.section-title{

    margin:0 0 10px;

    padding-bottom:6px;

    border-bottom:1px solid #DCE9E1;

    font-size:13px;

    font-weight:700;

    color:#046738;

}


.info-grid{

    display:grid;

    grid-template-columns:
        repeat(4, 1fr);

    border:1px solid #DCE9E1;

    border-radius:8px;

    overflow:hidden;

}


.info-item{

    padding:10px;

    border-right:1px solid #DCE9E1;

    border-bottom:1px solid #DCE9E1;

}


.info-item:nth-child(4n){

    border-right:none;

}


.info-label{

    display:block;

    margin-bottom:3px;

    font-size:9px;

    color:#7A8981;

}


.info-value{

    display:block;

    font-size:12px;

    font-weight:700;

    color:#17211C;

}


.metric-grid{

    display:grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap:8px;

}


.metric{

    padding:11px;

    border:1px solid #DCE9E1;

    border-radius:8px;

}


.metric-label{

    display:block;

    font-size:9px;

    color:#7A8981;

}


.metric-value{

    display:block;

    margin-top:3px;

    font-size:15px;

    font-weight:700;

    color:#17211C;

}


.progress-wrap{

    margin-top:12px;

}


.progress-header{

    display:flex;

    justify-content:space-between;

    margin-bottom:5px;

    font-size:10px;

}


.progress-track{

    width:100%;

    height:8px;

    border-radius:999px;

    background:#E8EFEA;

    overflow:hidden;

}


.progress-bar{

    width:${Number(batch.progress) || 0}%;

    height:100%;

    background:#046738;

    border-radius:999px;

}


table{

    width:100%;

    border-collapse:collapse;

}


th{

    padding:7px 6px;

    background:#F3F7F4;

    border:1px solid #DCE9E1;

    text-align:left;

    font-size:9px;

    color:#53635A;

}


td{

    padding:7px 6px;

    border:1px solid #DCE9E1;

    vertical-align:top;

    font-size:9px;

}


td small{

    color:#7A8981;

}


.qc-badge{

    display:inline-block;

    padding:3px 6px;

    border-radius:999px;

    font-size:8px;

    font-weight:700;

}


.qc-badge.passed{

    background:#EAF5EF;

    color:#046738;

}


.qc-badge.warning{

    background:#FFF5DF;

    color:#9A6B00;

}


.qc-badge.failed{

    background:#FDECEC;

    color:#A12B2B;

}


.empty-row{

    text-align:center;

    color:#7A8981;

    padding:18px;

}


.timeline{

    border:1px solid #DCE9E1;

    border-radius:8px;

    overflow:hidden;

}


.timeline-row{

    display:grid;

    grid-template-columns:
        1fr
        130px
        75px;

    gap:12px;

    padding:9px 11px;

    border-bottom:1px solid #E7EEE9;

}


.timeline-row:last-child{

    border-bottom:none;

}


.timeline-stage{

    display:flex;

    flex-direction:column;

    gap:2px;

}


.timeline-stage strong{

    font-size:10px;

}


.timeline-stage span{

    font-size:9px;

    color:#7A8981;

}


.timeline-date{

    font-size:9px;

    color:#53635A;

}


.timeline-status{

    text-align:right;

    font-size:8px;

    font-weight:700;

    text-transform:uppercase;

}


.timeline-status.completed{

    color:#046738;

}


.timeline-status.active{

    color:#046738;

}


.timeline-status.upcoming{

    color:#9AA69F;

}


.timeline-status.delayed{

    color:#A12B2B;

}


.note-box{

    padding:11px;

    border:1px solid #DCE9E1;

    border-radius:8px;

    background:#F8FBF9;

    color:#53635A;

    font-size:10px;

    white-space:pre-wrap;

}


.footer{

    display:flex;

    justify-content:space-between;

    margin-top:25px;

    padding-top:10px;

    border-top:1px solid #DCE9E1;

    font-size:8px;

    color:#8A958F;

}


@page{

    size:A4;

    margin:0;

}


@media print{

    body{

        background:#ffffff;

    }

    .print-page{

        margin:0;

        width:210mm;

        min-height:297mm;

    }

}


</style>

</head>

<body>

<div class="print-page">

<header class="header">

    <div class="brand">

        <div class="brand-name">
            MERAMU
        </div>

        <div class="brand-subtitle">
            Botanical Beverage Production System
        </div>

    </div>


    <div class="document-info">

        <div class="document-title">
            BATCH SHEET
        </div>

        <div class="document-meta">
            ${escapePrintHtml(generatedAt)}
        </div>

    </div>

</header>


<section class="batch-header">

    <div>

        <h1 class="batch-product">
            ${escapePrintHtml(
                batch.product
            )}
        </h1>

        <div class="batch-code">
            Batch ${escapePrintHtml(
                batch.code
            )}
        </div>

    </div>


    <div class="status">

        ${escapePrintHtml(
            batch.status || "—"
        )}

    </div>

</section>


<section class="section">

    <h2 class="section-title">
        Batch Information
    </h2>


    <div class="info-grid">

        <div class="info-item">

            <span class="info-label">
                Stage
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    batch.stage || "—"
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                Start Date
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    batch.startDate || "—"
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                Target Date
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    batch.targetDate || "—"
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                Volume
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    batch.volume || "—"
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                HPP
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    batch.hpp || "—"
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                Progress
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    `${batch.progress || 0}%`
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                Day
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    `Hari ke-${batch.day || 0} / ${batch.targetDays || 0}`
                )}
            </span>

        </div>


        <div class="info-item">

            <span class="info-label">
                Duration
            </span>

            <span class="info-value">
                ${escapePrintHtml(
                    batch.duration || "—"
                )}
            </span>

        </div>

    </div>


    <div class="progress-wrap">

        <div class="progress-header">

            <strong>
                Fermentation Progress
            </strong>

            <span>
                ${escapePrintHtml(
                    `${batch.progress || 0}%`
                )}
            </span>

        </div>


        <div class="progress-track">

            <div class="progress-bar"></div>

        </div>

    </div>

</section>


<section class="section">

    <h2 class="section-title">
        Current Fermentation Metrics
    </h2>


    <div class="metric-grid">

        <div class="metric">

            <span class="metric-label">
                pH
            </span>

            <span class="metric-value">
                ${escapePrintHtml(
                    batch.ph || "—"
                )}
            </span>

        </div>


        <div class="metric">

            <span class="metric-label">
                Brix
            </span>

            <span class="metric-value">
                ${escapePrintHtml(
                    batch.brix || "—"
                )}
            </span>

        </div>


        <div class="metric">

            <span class="metric-label">
                Suhu
            </span>

            <span class="metric-value">
                ${escapePrintHtml(
                    batch.temperature || "—"
                )}
            </span>

        </div>


        <div class="metric">

            <span class="metric-label">
                Volume
            </span>

            <span class="metric-value">
                ${escapePrintHtml(
                    batch.volume || "—"
                )}
            </span>

        </div>

    </div>

</section>


<section class="section">

    <h2 class="section-title">
        Fermentation Log
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    Tanggal
                </th>

                <th>
                    Stage
                </th>

                <th>
                    pH
                </th>

                <th>
                    Brix
                </th>

                <th>
                    Suhu
                </th>

                <th>
                    Volume
                </th>

                <th>
                    Operator
                </th>

                <th>
                    QC
                </th>

                <th>
                    Catatan
                </th>

            </tr>

        </thead>


        <tbody>

            ${logRows}

        </tbody>

    </table>

</section>


<section class="section">

    <h2 class="section-title">
        Batch Timeline
    </h2>


    <div class="timeline">

        ${timelineRows}

    </div>

</section>


${
    batch.note
        ? `

            <section class="section">

                <h2 class="section-title">
                    Catatan Produksi
                </h2>

                <div class="note-box">
                    ${escapePrintHtml(
                        batch.note
                    )}
                </div>

            </section>

        `
        : ""
}


<footer class="footer">

    <span>
        MERAMU • Batch ${escapePrintHtml(
            batch.code
        )}
    </span>

    <span>
        Dokumen produksi internal
    </span>

</footer>

</div>

<script>

window.onload = function(){

    setTimeout(
        function(){

            window.print();

        },
        250
    );

};


window.onafterprint = function(){

    window.close();

};

</script>

</body>

</html>

`;

printWindow.document.open();

printWindow.document.write(
    printHtml
);

printWindow.document.close();


console.log(
    "MERAMU: Print Batch Sheet dibuka.",
    batch.code
);

}

/* =========================================================
PRINT BATCH EVENTS
========================================================= */

document.addEventListener(
"click",
event => {

    const printButton =
        event.target.closest(
            "#printBatch"
        );


    if(!printButton){
        return;
    }


    event.preventDefault();


    printBatchSheet();

}

);

/* =========================================================
THERMAL LABEL
80mm + QR + BEST BEFORE
========================================================= */

function escapeLabelHtml(value){

if(
    value === null ||
    value === undefined
){
    return "";
}

return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

/* =========================================================
GET LABEL TRACE URL
========================================================= */

function getBatchTraceUrl(batch){

if(!batch || !batch.code){
    return "";
}


const baseUrl =
    window.location.origin;


return `${baseUrl}/trace/${encodeURIComponent(
    batch.code
)}`;

}

/* =========================================================
GET BEST BEFORE
========================================================= */

function getBatchBestBefore(batch){

if(!batch){
    return "—";
}


return (
    batch.expiryDate ||
    batch.bestBefore ||
    "—"
);

}

/* =========================================================
PRINT THERMAL LABEL
========================================================= */

function printThermalLabel(){

const batch =
    getCurrentBatch();


if(!batch){

    console.warn(
        "MERAMU: Batch untuk thermal label tidak ditemukan."
    );

    return;

}


const traceUrl =
    getBatchTraceUrl(
        batch
    );


const bestBefore =
    getBatchBestBefore(
        batch
    );


const printWindow =
    window.open(
        "",
        "_blank",
        "width=500,height=800"
    );


if(!printWindow){

    alert(
        "Popup print diblokir browser. Izinkan popup untuk MERAMU."
    );

    return;

}


const labelHtml = `

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>
    MERAMU • ${escapeLabelHtml(batch.code)}
</title>

<script
    src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
></script>

<style>

*{
    box-sizing:border-box;
}


html,
body{

    margin:0;
    padding:0;

}


body{

    background:#ffffff;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

}


.label{

    width:80mm;

    min-height:50mm;

    padding:4mm;

    margin:0 auto;

    background:#ffffff;

    color:#111111;

}


.brand{

    text-align:center;

    font-size:16px;

    font-weight:800;

    letter-spacing:1.5px;

}


.brand-subtitle{

    margin-top:1px;

    text-align:center;

    font-size:7px;

    color:#555555;

    letter-spacing:.4px;

}


.divider{

    width:100%;

    height:1px;

    margin:3mm 0;

    background:#111111;

}


.product{

    text-align:center;

    font-size:15px;

    font-weight:800;

    line-height:1.15;

}


.batch{

    margin-top:2mm;

    text-align:center;

    font-size:10px;

    font-weight:700;

}


.info-grid{

    display:grid;

    grid-template-columns:
        1fr 1fr;

    gap:2mm;

    margin-top:4mm;

}


.info{

    text-align:center;

}


.info-label{

    display:block;

    font-size:7px;

    color:#666666;

    text-transform:uppercase;

    letter-spacing:.4px;

}


.info-value{

    display:block;

    margin-top:1px;

    font-size:10px;

    font-weight:700;

}


.qr-section{

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    margin-top:4mm;

}


#qrcode{

    width:30mm;

    height:30mm;

}


#qrcode img{

    width:30mm !important;

    height:30mm !important;

}


.qr-caption{

    margin-top:2mm;

    text-align:center;

    font-size:7px;

    color:#555555;

}


.trace-code{

    margin-top:1mm;

    text-align:center;

    font-size:7px;

    word-break:break-all;

    color:#333333;

}


.footer{

    margin-top:3mm;

    padding-top:2mm;

    border-top:1px solid #111111;

    display:flex;

    justify-content:space-between;

    font-size:7px;

    font-weight:600;

}


@page{

    size:80mm auto;

    margin:0;

}


@media print{

    html,
    body{

        width:80mm;

        margin:0;

        padding:0;

    }


    .label{

        width:80mm;

        margin:0;

        padding:4mm;

    }

}

</style>

</head>

<body>

<div class="label">

<div class="brand">
    MERAMU
</div>


<div class="brand-subtitle">
    BOTANICAL BEVERAGE
</div>


<div class="divider"></div>


<div class="product">

    ${escapeLabelHtml(
        batch.product || "Produk MERAMU"
    )}

</div>


<div class="batch">

    BATCH
    ${escapeLabelHtml(
        batch.code || "—"
    )}

</div>


<div class="info-grid">


    <div class="info">

        <span class="info-label">
            Volume
        </span>

        <span class="info-value">
            ${escapeLabelHtml(
                batch.volume || "—"
            )}
        </span>

    </div>


    <div class="info">

        <span class="info-label">
            Stage
        </span>

        <span class="info-value">
            ${escapeLabelHtml(
                batch.stage || "—"
            )}
        </span>

    </div>


    <div class="info">

        <span class="info-label">
            Production
        </span>

        <span class="info-value">
            ${escapeLabelHtml(
                batch.startDate || "—"
            )}
        </span>

    </div>


    <div class="info">

        <span class="info-label">
            Best Before
        </span>

        <span class="info-value">
            ${escapeLabelHtml(
                bestBefore
            )}
        </span>

    </div>


</div>


<div class="qr-section">


    <div id="qrcode"></div>


    <div class="qr-caption">
        Scan untuk melihat informasi batch
    </div>


    <div class="trace-code">
        ${escapeLabelHtml(
            traceUrl
        )}
    </div>


</div>


<div class="footer">

    <span>
        ${escapeLabelHtml(
            batch.hpp || ""
        )}
    </span>

    <span>
        MERAMU
    </span>

</div>

</div>

<script>

window.addEventListener(
    "load",
    function(){

        const qrTarget =
            document.getElementById(
                "qrcode"
            );


        if(
            qrTarget &&
            window.QRCode
        ){

            new QRCode(
                qrTarget,
                {
                    text:
                        ${JSON.stringify(traceUrl)},

                    width: 120,

                    height: 120,

                    correctLevel:
                        QRCode.CorrectLevel.M
                }
            );

        }


        setTimeout(
            function(){

                window.print();

            },
            700
        );

    }
);


window.onafterprint =
    function(){

        window.close();

    };

</script>

</body>

</html>

`;

printWindow.document.open();

printWindow.document.write(
    labelHtml
);

printWindow.document.close();


console.log(
    "MERAMU: Thermal Label 80mm dibuka.",
    batch.code
);

}

/* =========================================================
THERMAL LABEL EVENT
========================================================= */

document.addEventListener(
"click",
event => {

    const labelButton =
        event.target.closest(
            "#printThermalLabel"
        );


    if(!labelButton){
        return;
    }


    event.preventDefault();


    printThermalLabel();

}

);

/* =========================================================
BACK TO CALENDAR
========================================================= */

function backToCalendar(){

window.location.href =
    "fermentation-calendar.html";

}

/* =========================================================
EVENTS
========================================================= */

document.addEventListener(
"click",
event => {

    /* -----------------------------------------------
       BACK TO CALENDAR
    ----------------------------------------------- */

    const backButton =
        event.target.closest(
            "#backToCalendar"
        );


    if(backButton){

        backToCalendar();

        return;

    }


    /* -----------------------------------------------
       OPEN ADD LOG
    ----------------------------------------------- */

    const addLogButton =
        event.target.closest(
            "#addFermentationLog"
        );


    if(addLogButton){

        openFermentationLogModal();

        return;

    }


    /* -----------------------------------------------
       CLOSE BUTTON
    ----------------------------------------------- */

    const closeButton =
        event.target.closest(
            "#closeFermentationLog"
        );


    if(closeButton){

        closeFermentationLogModal();

        return;

    }


    /* -----------------------------------------------
       CANCEL BUTTON
    ----------------------------------------------- */

    const cancelButton =
        event.target.closest(
            "#cancelFermentationLog"
        );


    if(cancelButton){

        closeFermentationLogModal();

        return;

    }


    /* -----------------------------------------------
       CLICK BACKDROP
    ----------------------------------------------- */

    const backdrop =
        event.target.closest(
            "[data-close-fermentation-log]"
        );


    if(backdrop){

        closeFermentationLogModal();

    }

}

);

/* =========================================================
FORM SUBMIT
========================================================= */

document.addEventListener(
"submit",
event => {

    if(
        event.target.id !==
        "fermentationLogForm"
    ){

        return;

    }


    saveFermentationLog(
        event
    );

}

);

/* =========================================================
ESCAPE KEY
========================================================= */

document.addEventListener(
"keydown",
event => {

    if(
        event.key !== "Escape"
    ){

        return;

    }


    const modal =
        document.getElementById(
            "fermentationLogModal"
        );


    if(
        modal &&
        !modal.hidden
    ){

        closeFermentationLogModal();

    }

}

);

/* =========================================================
INIT
========================================================= */

function initBatchDetail(){

renderBatchDetail();


if(window.lucide){

    lucide.createIcons();

}

}

/* =========================================================
EXPORT
========================================================= */

window.initBatchDetail =
initBatchDetail;

window.renderBatchDetail =
renderBatchDetail;

window.renderBatchTimeline =
renderBatchTimeline;

window.renderFermentationLogs =
renderFermentationLogs;

window.openFermentationLogModal =
openFermentationLogModal;

window.closeFermentationLogModal =
closeFermentationLogModal;

window.saveFermentationLog =
saveFermentationLog;

window.openEditBatchModal =
openEditBatchModal;

window.closeEditBatchModal =
closeEditBatchModal;

window.saveEditBatch =
saveEditBatch;

window.printBatchSheet =
printBatchSheet;

window.printThermalLabel =
printThermalLabel;
