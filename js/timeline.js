/* =========================================================
   MERAMU Timeline Engine v2.0
   Dummy Data → Ready for Supabase
========================================================= */

const MAX_PREVIEW = 3;

/* =========================================================
   Dummy Data
========================================================= */

const batches = [
    { code:"TL-001", name:"Sirup Telang",       status:"produksi", type:"direct",    info:"500g Telang" },
    { code:"SG-002", name:"Sirup Gula",         status:"produksi", type:"direct",    info:"5 Liter" },
    { code:"KB-003", name:"Original Kombucha", status:"f1",        type:"kombucha", info:"Hari ke-3" },
    { code:"KB-004", name:"Lemon Kombucha",    status:"f2",        type:"kombucha", info:"Hari ke-2" },
    { code:"TL-005", name:"Sirup Telang",       status:"completed", type:"direct",    info:"10 Liter" },
    { code:"SG-006", name:"Sirup Gula",         status:"completed", type:"direct",    info:"8 Liter" },
    { code:"KB-007", name:"Berry Kombucha",    status:"completed", type:"kombucha", info:"24 Botol" },
    { code:"KB-008", name:"Jahe Kombucha",     status:"completed", type:"kombucha", info:"20 Botol" },
    { code:"TL-009", name:"Sirup Telang",       status:"completed", type:"direct",    info:"6 Liter" },
    { code:"SG-010", name:"Sirup Gula",         status:"completed", type:"direct",    info:"12 Liter" }
];

/* =========================================================
   Render Timeline Column
========================================================= */

function renderColumn(status){

    const container = document.getElementById(`timeline-${status}`);
    const counter   = document.getElementById(`count-${status}`);

    if(!container || !counter) return;

    const data = batches.filter(batch => batch.status === status);

    counter.textContent = data.length;
    container.innerHTML = "";

    // Preview maksimal 3 card
    data.slice(0, MAX_PREVIEW).forEach(batch => {

        const card = document.createElement("article");
        card.className = "batch-card";

        card.innerHTML = `
            <div class="batch-head">
                <span class="batch-type ${batch.type}">
                    ${batch.type.toUpperCase()}
                </span>

                <span class="batch-code">${batch.code}</span>
            </div>

            <h4>${batch.name}</h4>
            <p>${batch.info}</p>
        `;

        container.appendChild(card);

    });

    // Tombol Lihat Lainnya
    if(data.length > MAX_PREVIEW){

        const btn = document.createElement("button");

        btn.className = "timeline-more";
        btn.textContent = `Lihat ${data.length - MAX_PREVIEW} lainnya`;

        btn.addEventListener("click", () => {
            openBatchSheet(status);
        });

        container.appendChild(btn);
    }

}

/* =========================================================
   Render Semua Timeline
========================================================= */

function renderTimeline(){

    if(!document.getElementById("timeline-produksi")) return;

    renderColumn("produksi");
    renderColumn("f1");
    renderColumn("f2");
    renderColumn("completed");

    if(window.lucide){
        lucide.createIcons();
    }

}

/* =========================================================
   Batch Sheet
========================================================= */

let currentStatus = "completed";

function openBatchSheet(status){

    const sheet = document.getElementById("batchSheet");

    if(!sheet) return;

    currentStatus = status;

    sheet.classList.add("show");

    renderSheet();

}

function closeBatchSheet(){

    document
        .getElementById("batchSheet")
        ?.classList.remove("show");

}

/* =========================================================
   Render Sheet
========================================================= */

function renderSheet(){

    const list = document.getElementById("sheetList");
    const subtitle = document.getElementById("sheet-subtitle");

    if(!list || !subtitle) return;

    const search =
        document.getElementById("batchSearch")?.value.toLowerCase() || "";

    const activeFilter =
        document.querySelector(".filter-btn.active")?.dataset.filter || "all";

    let data = batches.filter(batch => batch.status === currentStatus);

    if(activeFilter !== "all"){
        data = data.filter(batch => batch.type === activeFilter);
    }

    if(search){

        data = data.filter(batch =>
            batch.code.toLowerCase().includes(search) ||
            batch.name.toLowerCase().includes(search)
        );

    }

    subtitle.textContent = `${data.length} batch`;

    list.innerHTML = "";

    data.forEach(batch => {

        const item = document.createElement("article");

        item.className = "sheet-item";

        item.innerHTML = `
            <div>

                <span class="batch-type ${batch.type}">
                    ${batch.type.toUpperCase()}
                </span>

                <h4>${batch.name}</h4>

                <p>${batch.code}</p>

            </div>
        `;

        list.appendChild(item);

    });

}

/* =========================================================
   Events
========================================================= */

document.addEventListener("click", e => {

    if(
        e.target.id === "closeBatchSheet" ||
        e.target.closest("#closeBatchSheet") ||
        e.target.classList.contains("batch-sheet-backdrop")
    ){
        closeBatchSheet();
    }

});

document.addEventListener("input", e => {

    if(e.target.id === "batchSearch"){
        renderSheet();
    }

});

document.addEventListener("click", e => {

    const filter = e.target.closest(".filter-btn");

    if(!filter) return;

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn => btn.classList.remove("active"));

    filter.classList.add("active");

    renderSheet();

});

/* =========================================================
   Export
========================================================= */

window.renderTimeline = renderTimeline;
window.openBatchSheet = openBatchSheet;