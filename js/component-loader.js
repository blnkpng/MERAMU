/* =========================================================
   MERAMU COMPONENT LOADER v2.2
   Dynamic Component Loader
   Shared Components + Page Support
========================================================= */


/* =========================================================
   PATH HELPERS
========================================================= */

function isPageDirectory(){

    return window.location.pathname
        .replaceAll("\\", "/")
        .includes("/pages/");

}


function getComponentBase(){

    return isPageDirectory()
        ? "../components/"
        : "components/";

}


function getAssetBase(){

    return isPageDirectory()
        ? "../assets/"
        : "assets/";

}


/* =========================================================
   RESOLVE COMPONENT ASSETS
========================================================= */

function resolveComponentAssets(container){

    if(!container) return;


    const assetBase =
        getAssetBase();


    container
        .querySelectorAll("[data-asset]")
        .forEach(element => {

            const asset =
                element.dataset.asset;

            if(!asset) return;


            element.src =
                assetBase + asset;

        });

}


/* =========================================================
   LOAD COMPONENT
========================================================= */

async function loadComponent(
    id,
    file
){

    const el =
        document.getElementById(id);


    if(!el) return;


    try{

        const response =
            await fetch(file);


        if(!response.ok){

            throw new Error(
                `${response.status} ${response.statusText}`
            );

        }


        const html =
            await response.text();


        /* -----------------------------------------------
           INSERT COMPONENT
        ------------------------------------------------ */

        el.innerHTML =
            html;


        /* -----------------------------------------------
           RESOLVE ASSETS
        ------------------------------------------------ */

        resolveComponentAssets(
            el
        );


        /* -----------------------------------------------
           RENDER LUCIDE
        ------------------------------------------------ */

        if(window.lucide){

            lucide.createIcons();

        }


        /* -----------------------------------------------
           COMPONENT-SPECIFIC RENDER
        ------------------------------------------------ */

        if(
            id ===
            "live-production-container"
            &&
            window.renderLiveProduction
        ){

            window.renderLiveProduction();

        }


        if(
            id ===
            "inventory-snapshot-container"
            &&
            window.renderInventorySnapshot
        ){

            window.renderInventorySnapshot();

        }


        if(
            id ===
            "timeline-container"
            &&
            window.renderTimeline
        ){

            window.renderTimeline();

        }


    }catch(err){

        console.error(
            `Gagal memuat ${file}`,
            err
        );


        el.innerHTML = `

            <div
                style="
                    padding:20px;
                    border-radius:18px;
                    background:#FEF2F2;
                    color:#991B1B;
                    font-size:14px;
                    font-family:Poppins,sans-serif;
                "
            >

                Gagal memuat
                <strong>${file}</strong>

            </div>

        `;

    }

}


/* =========================================================
   INIT LAYOUT
========================================================= */

async function initLayout(){

    const base =
        getComponentBase();


    await Promise.all([


        /* -----------------------------------------------
           SIDEBAR
        ------------------------------------------------ */

        loadComponent(
            "sidebar-container",
            base + "sidebar.html"
        ),


        /* -----------------------------------------------
           TOPBAR
        ------------------------------------------------ */

        loadComponent(
            "topbar-container",
            base + "topbar.html"
        ),


        /* -----------------------------------------------
           HERO
        ------------------------------------------------ */

        loadComponent(
            "hero-container",
            base + "hero.html"
        ),


        /* -----------------------------------------------
           KPI
        ------------------------------------------------ */

        loadComponent(
            "kpi-container",
            base + "kpi-cards.html"
        ),


        /* -----------------------------------------------
           LIVE PRODUCTION
        ------------------------------------------------ */

        loadComponent(
            "live-production-container",
            base + "live-production.html"
        ),


        /* -----------------------------------------------
           QUICK ACTIONS
        ------------------------------------------------ */

        loadComponent(
            "quick-container",
            base + "quick-actions.html"
        ),


        /* -----------------------------------------------
           INVENTORY
        ------------------------------------------------ */

        loadComponent(
            "inventory-snapshot-container",
            base + "inventory-snapshot.html"
        ),


        /* -----------------------------------------------
           TIMELINE
        ------------------------------------------------ */

        loadComponent(
            "timeline-container",
            base + "production-timeline.html"
        ),


        /* -----------------------------------------------
           BATCH SHEET
        ------------------------------------------------ */

        loadComponent(
            "batch-sheet-container",
            base + "batch-sheet.html"
        )

    ]);


    /* =====================================================
       FINAL RENDER
    ====================================================== */

    if(window.lucide){

        lucide.createIcons();

    }


    /* =====================================================
       SIDEBAR INIT
    ====================================================== */

    if(window.initSidebar){

        window.initSidebar();

    }


    /* =====================================================
       APP INIT
    ====================================================== */

    if(window.setActiveMenu){

        window.setActiveMenu();

    }


    console.log(
        "✅ MERAMU Layout Loaded"
    );

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initLayout
);