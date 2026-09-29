/* =========================================================
   MERAMU INVENTORY SNAPSHOT
   Dummy Data → Ready for Supabase
========================================================= */

const inventoryData = [

    {
        name: "Gula Aren",
        stock: 18,
        unit: "kg",
        minimum: 10
    },

    {
        name: "Bunga Telang",
        stock: 2.4,
        unit: "kg",
        minimum: 5
    },

    {
        name: "Teh Hijau",
        stock: 0,
        unit: "kg",
        minimum: 3
    },

    {
        name: "Botol 250ml",
        stock: 120,
        unit: "pcs",
        minimum: 100
    },

    {
        name: "Botol 500ml",
        stock: 35,
        unit: "pcs",
        minimum: 80
    },

    {
        name: "Label MERAMU",
        stock: 850,
        unit: "pcs",
        minimum: 300
    }
];


/* =========================================================
   STATUS
========================================================= */

function getInventoryStatus(item){

    if(item.stock <= 0){
        return "empty";
    }

    if(item.stock <= item.minimum){
        return "low";
    }

    return "safe";
}


/* =========================================================
   RENDER
========================================================= */

function renderInventorySnapshot(){

    const container =
        document.getElementById("inventorySnapshotList");

    if(!container) return;


    /* ---------- Summary ---------- */

    const safe =
        inventoryData.filter(
            item => getInventoryStatus(item) === "safe"
        ).length;

    const low =
        inventoryData.filter(
            item => getInventoryStatus(item) === "low"
        ).length;

    const empty =
        inventoryData.filter(
            item => getInventoryStatus(item) === "empty"
        ).length;


    document.getElementById("inventorySafe").textContent = safe;
    document.getElementById("inventoryLow").textContent = low;
    document.getElementById("inventoryEmpty").textContent = empty;
    document.getElementById("inventoryTotal").textContent =
        inventoryData.length;


    /* ---------- Priority ---------- */

    const priority = [...inventoryData]
        .sort((a,b) => {

            const statusOrder = {
                empty: 0,
                low: 1,
                safe: 2
            };

            return (
                statusOrder[getInventoryStatus(a)] -
                statusOrder[getInventoryStatus(b)]
            );

        })
        .slice(0,5);


    container.innerHTML = "";


    /* ---------- Cards ---------- */

    priority.forEach(item => {

        const status =
            getInventoryStatus(item);

        const percentage =
            item.minimum > 0
                ? Math.min(
                    (item.stock / (item.minimum * 2)) * 100,
                    100
                )
                : 100;


        const statusLabel = {

            safe: "AMAN",
            low: "MENIPIS",
            empty: "HABIS"

        }[status];


        const card =
            document.createElement("article");

        card.className =
            `inventory-item ${status}`;


        card.innerHTML = `

            <div class="inventory-item-main">

                <div class="inventory-item-icon">

                    <i data-lucide="${
                        status === "empty"
                            ? "package-x"
                            : status === "low"
                                ? "package-minus"
                                : "package-check"
                    }"></i>

                </div>

                <div class="inventory-item-info">

                    <h4>
                        ${item.name}
                    </h4>

                    <span>
                        ${item.stock}
                        ${item.unit}
                    </span>

                </div>

            </div>


            <div class="inventory-item-right">

                <span class="inventory-status">
                    ${statusLabel}
                </span>

                <div class="inventory-progress">

                    <div
                        style="width:${percentage}%">
                    </div>

                </div>

            </div>

        `;


        container.appendChild(card);

    });


    if(window.lucide){
        lucide.createIcons();
    }

}


window.renderInventorySnapshot =
    renderInventorySnapshot;