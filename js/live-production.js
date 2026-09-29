/* =========================================================
   MERAMU LIVE PRODUCTION
   Dummy Data → Ready for Supabase
========================================================= */

const liveProductionData = [

    {
        code: "TL-011",
        product: "Sirup Telang",
        type: "direct",
        status: "produksi",
        statusLabel: "Produksi",
        startedAt: "09:30",
        progress: 45,
        eta: "12:00",
        info: "500g Telang"
    },

    {
        code: "KB-021",
        product: "Original Kombucha",
        type: "kombucha",
        status: "f1",
        statusLabel: "F1 Fermentasi",
        startedAt: "08:00",
        progress: 57,
        day: "Hari ke-4",
        target: "7 hari",
        info: "4 / 7 hari"
    },

    {
        code: "KB-022",
        product: "Lemon Kombucha",
        type: "kombucha",
        status: "f2",
        statusLabel: "F2 Fermentasi",
        startedAt: "10:15",
        progress: 40,
        day: "Hari ke-2",
        target: "5 hari",
        info: "2 / 5 hari"
    },

    {
        code: "SG-018",
        product: "Sirup Gula",
        type: "direct",
        status: "produksi",
        statusLabel: "Produksi",
        startedAt: "10:15",
        progress: 20,
        eta: "13:30",
        info: "8 Liter"
    }

];


/* =========================================================
   Render Live Production
========================================================= */

function renderLiveProduction(){

    const container =
        document.getElementById("liveProductionList");

    if(!container) return;


    /* ---------- Summary ---------- */

    const total =
        liveProductionData.length;

    const produksi =
        liveProductionData.filter(
            item => item.status === "produksi"
        ).length;

    const f1 =
        liveProductionData.filter(
            item => item.status === "f1"
        ).length;

    const f2 =
        liveProductionData.filter(
            item => item.status === "f2"
        ).length;


    document.getElementById("liveTotal").textContent = total;
    document.getElementById("liveProduksi").textContent = produksi;
    document.getElementById("liveF1").textContent = f1;
    document.getElementById("liveF2").textContent = f2;


    /* ---------- Cards ---------- */

    container.innerHTML = "";


    liveProductionData.forEach(batch => {

        const card =
            document.createElement("article");

        card.className =
            `live-production-card ${batch.status}`;


        let progressInfo = "";


        if(batch.status === "produksi"){

            progressInfo = `
                <div class="live-card-meta">
                    <span>Mulai ${batch.startedAt}</span>
                    <span>ETA ${batch.eta}</span>
                </div>
            `;

        }else{

            progressInfo = `
                <div class="live-card-meta">
                    <span>${batch.day}</span>
                    <span>${batch.info}</span>
                </div>
            `;

        }


        card.innerHTML = `

            <div class="live-card-top">

                <div class="live-card-icon">

                    <i data-lucide="${
                        batch.status === "produksi"
                            ? "flask-conical"
                            : batch.status === "f1"
                                ? "container"
                                : "wine"
                    }"></i>

                </div>

                <span class="live-status ${batch.status}">
                    ${batch.statusLabel}
                </span>

            </div>


            <div class="live-card-body">

                <div>

                    <h4>
                        ${batch.product}
                    </h4>

                    <span class="live-batch-code">
                        ${batch.code}
                    </span>

                </div>

                <strong class="live-progress-value">
                    ${batch.progress}%
                </strong>

            </div>


            <div class="live-progress">

                <div
                    class="live-progress-bar"
                    style="width:${batch.progress}%"
                ></div>

            </div>


            ${progressInfo}


            <div class="live-card-footer">

                <span>
                    ${batch.info}
                </span>

                <button
                    class="live-detail-btn"
                    data-batch="${batch.code}"
                >
                    Detail
                    <i data-lucide="arrow-up-right"></i>
                </button>

            </div>

        `;


        container.appendChild(card);

    });


    if(window.lucide){
        lucide.createIcons();
    }

}


/* =========================================================
   Detail Button
========================================================= */

document.addEventListener("click", event => {

    const button =
        event.target.closest(".live-detail-btn");

    if(!button) return;


    const batchCode =
        button.dataset.batch;


    console.log(
        "Open batch:",
        batchCode
    );

    /*
       Nanti:

       window.location.href =
       `pages/batch-detail.html?batch=${batchCode}`;

       Untuk sekarang hanya log.
    */

});


/* =========================================================
   Refresh
========================================================= */

document.addEventListener("click", event => {

    const button =
        event.target.closest("#refreshLiveProduction");

    if(!button) return;


    button.classList.add("loading");


    setTimeout(() => {

        renderLiveProduction();

        button.classList.remove("loading");

    }, 350);

});


/* =========================================================
   Export
========================================================= */

window.renderLiveProduction =
    renderLiveProduction;