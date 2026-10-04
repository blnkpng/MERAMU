/* =========================================================
   MERAMU APP CONTROLLER
   Global Sidebar + Navigation
   Desktop + Mobile
========================================================= */


/* =========================================================
   ELEMENT HELPERS
========================================================= */

function getAppShell(){
    return (
        document.getElementById("appShell") ||
        document.querySelector(".app-shell")
    );
}

function getOverlay(){
    return document.getElementById("sidebarOverlay");
}

function getSidebar(){
    return document.querySelector(".sidebar");
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function openMobileSidebar(){

    const sidebar = getSidebar();
    const overlay = getOverlay();

    if(!sidebar){
        console.warn(
            "MERAMU: Sidebar tidak ditemukan."
        );
        return;
    }

    sidebar.classList.add("show");

    if(overlay){
        overlay.classList.add("show");
    }

    document.body.classList.add(
        "sidebar-open"
    );
}


function closeMobileSidebar(){

    const sidebar = getSidebar();
    const overlay = getOverlay();

    if(sidebar){
        sidebar.classList.remove("show");
    }

    if(overlay){
        overlay.classList.remove("show");
    }

    document.body.classList.remove(
        "sidebar-open"
    );
}


/* =========================================================
   SIDEBAR TOGGLE
   ---------------------------------------------------------
   DESKTOP  : > 1024px
               Toggle collapsed 280px <-> 88px

   TABLET   : 769px - 1024px
               Drawer 280px

   MOBILE   : <= 768px
               Drawer 280px
========================================================= */

function toggleSidebar(){

    const sidebar =
        getSidebar();

    const overlay =
        getOverlay();

    const appShell =
        getAppShell();


    if(!sidebar){

        console.warn(
            "MERAMU: Sidebar tidak ditemukan."
        );

        return;
    }


    /* =====================================================
       TABLET + MOBILE
       <= 1024px
    ===================================================== */

    if(window.innerWidth <= 1024){

        const isOpen =
            sidebar.classList.contains(
                "show"
            );


        if(isOpen){

            closeMobileSidebar();

        }else{

            openMobileSidebar();

        }


        console.log(
            "MERAMU: Drawer sidebar toggle",
            !isOpen
        );


        return;
    }


    /* =====================================================
       DESKTOP
       > 1024px
    ===================================================== */

    if(appShell){

        appShell.classList.toggle(
            "sidebar-collapsed"
        );


        console.log(
            "MERAMU: Desktop sidebar toggle",
            appShell.classList.contains(
                "sidebar-collapsed"
            )
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateToRoute(route){

    if(!route){
        return;
    }


    switch(route){

        case "overview":

            window.location.href =
                "/index.html";

            break;


        case "production":

            window.location.href =
                "/pages/production.html";

            break;


        case "fermentation-calendar":

            window.location.href =
                "/pages/fermentation-calendar.html";

            break;


        case "f1":

            window.location.href =
                "/pages/f1.html";

            break;


        case "f2":

            window.location.href =
                "/pages/f2.html";

            break;


        case "harvest":

            window.location.href =
                "/pages/harvest.html";

            break;

          case "allocation":

             window.location.href =
                 "/pages/allocation.html";

          break;


          case "finished":

             window.location.href =
                 "/pages/finished.html";

          break;


        case "recipe":

            window.location.href =
                "/pages/recipe.html";

            break;


        case "inventory":

            window.location.href =
                "/pages/inventory.html";

            break;


        case "hpp":

            window.location.href =
                "/pages/hpp.html";

            break;


        default:

            console.warn(
                `MERAMU: Route "${route}" belum tersedia.`
            );

            break;

    }

}


/* =========================================================
   ACTIVE MENU
========================================================= */

function setActiveMenu(){

    const menuItems =
        document.querySelectorAll(
            ".menu a[data-route]"
        );

    if(!menuItems.length){
        return;
    }


    const currentPath =
        window.location.pathname
            .replaceAll("\\","/")
            .toLowerCase();


    menuItems.forEach(item => {

        item.classList.remove(
            "active"
        );


        const route =
            item.dataset.route;


        /* -------------------------------------------------
           OVERVIEW
        ------------------------------------------------- */

        if(route === "overview"){

            const isDashboard =
                currentPath === "/" ||
                currentPath.endsWith(
                    "/index.html"
                );

            if(isDashboard){

                item.classList.add(
                    "active"
                );

            }

            return;
        }


        /* -------------------------------------------------
           OTHER ROUTES
        ------------------------------------------------- */

        const routeFileMap = {

            "fermentation-calendar":
                "/pages/fermentation-calendar.html",

            "production":
                "/pages/production.html",

            "f1":
                "/pages/f1.html",

            "f2":
                "/pages/f2.html",

            "harvest":
                "/pages/harvest.html",

            "allocation":
                "/pages/allocation.html",

            "finished":
                  "/pages/finished.html",

            "recipe":
                "/pages/recipe.html",

            "inventory":
                "/pages/inventory.html",

            "hpp":
                "/pages/hpp.html"

        };


        const expectedPath =
            routeFileMap[route];


        if(
            expectedPath &&
            currentPath.includes(
                expectedPath
            )
        ){

            item.classList.add(
                "active"
            );

        }

    });

}


/* =========================================================
   GLOBAL CLICK HANDLER
   IMPORTANT:
   Component HTML dimuat secara dinamis,
   sehingga event delegation digunakan.
========================================================= */

document.addEventListener(
    "click",
    function(event){

        /* -------------------------------------------------
           HAMBURGER / SIDEBAR TOGGLE
        ------------------------------------------------- */

        const toggleButton =
            event.target.closest(
                "#sidebarToggle, #mobileSidebarToggle, [data-sidebar-toggle], .sidebar-toggle, .mobile-sidebar-toggle, .hamburger-toggle"
            );


        if(toggleButton){

            event.preventDefault();

            event.stopPropagation();

            console.log(
                "MERAMU: Hamburger clicked",
                toggleButton.id ||
                toggleButton.className
            );


            toggleSidebar();

            return;
        }


        /* -------------------------------------------------
           SIDEBAR OVERLAY
        ------------------------------------------------- */

        const overlay =
            event.target.closest(
                "#sidebarOverlay"
            );


        if(overlay){

            closeMobileSidebar();

            return;
        }


        /* -------------------------------------------------
           SIDEBAR MENU
        ------------------------------------------------- */

        const menuItem =
            event.target.closest(
                ".menu a[data-route]"
            );


        if(!menuItem){
            return;
        }


        const route =
            menuItem.dataset.route;


        if(!route){
            return;
        }


        event.preventDefault();


        closeMobileSidebar();


        navigateToRoute(
            route
        );

    },
    true
);


/* =========================================================
   MOBILE / TABLET TOPBAR FALLBACK
   ---------------------------------------------------------
   Jika tombol pertama pada topbar belum mempunyai ID,
   tetap bisa membuka sidebar.

   Berlaku untuk:
   - Tablet <= 1024px
   - Mobile <= 768px
========================================================= */

document.addEventListener(
    "click",
    function(event){

        /* Jangan jalankan fallback jika sudah
           ditangani oleh handler utama */

        const directToggle =
            event.target.closest(
                "#sidebarToggle, #mobileSidebarToggle, [data-sidebar-toggle], .sidebar-toggle, .mobile-sidebar-toggle, .hamburger-toggle"
            );


        if(directToggle){
            return;
        }


        /* Hanya tablet + mobile */

        if(window.innerWidth > 1024){
            return;
        }


        const mobileTopbar =
            event.target.closest(
                ".topbar-mobile"
            );


        if(!mobileTopbar){
            return;
        }


        const clickedButton =
            event.target.closest(
                "button"
            );


        if(!clickedButton){
            return;
        }


        const buttons =
            mobileTopbar.querySelectorAll(
                "button"
            );


        /* Tombol pertama = hamburger */

        if(
            buttons.length &&
            clickedButton === buttons[0]
        ){

            event.preventDefault();

            event.stopPropagation();

            toggleSidebar();

        }

    },
    true
);


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function(){

        /* -------------------------------------------------
           Saat kembali ke desktop (>1024px),
           tutup state drawer.
        ------------------------------------------------- */

        if(window.innerWidth > 1024){

            closeMobileSidebar();

        }

    }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    function(event){

        if(event.key === "Escape"){

            closeMobileSidebar();

        }

    }
);


/* =========================================================
   INITIALIZE APP
========================================================= */

function initApp(){

    setActiveMenu();


    if(window.lucide){

        lucide.createIcons();

    }


    console.log(
        "✅ MERAMU App Controller Loaded"
    );

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.toggleSidebar =
    toggleSidebar;

window.openMobileSidebar =
    openMobileSidebar;

window.closeMobileSidebar =
    closeMobileSidebar;

window.navigateToRoute =
    navigateToRoute;

window.setActiveMenu =
    setActiveMenu;

window.initApp =
    initApp;


/* =========================================================
   LOAD
========================================================= */

window.addEventListener(
    "load",
    initApp
);


/* =========================================================
   MERAMU iOS-STYLE GLOBAL NOTIFICATION
   ---------------------------------------------------------
   Replaces native window.alert() across pages that load app.js.
   No per-page alert replacement is required.
========================================================= */
(function initMeramuIOSNotification(){

    const STYLE_ID = "meramu-ios-notify-style";
    const ROOT_ID = "meramuIOSNotify";

    function ensureStyle(){
        if(document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .meramu-ios-notify-backdrop{
                position:fixed;
                inset:0;
                z-index:999999;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
                background:rgba(15,23,42,.30);
                backdrop-filter:blur(12px);
                -webkit-backdrop-filter:blur(12px);
                opacity:0;
                pointer-events:none;
                transition:opacity .18s ease;
            }
            .meramu-ios-notify-backdrop.is-open{
                opacity:1;
                pointer-events:auto;
            }
            .meramu-ios-notify-card{
                width:min(390px, calc(100vw - 40px));
                border:1px solid rgba(255,255,255,.72);
                border-radius:24px;
                background:rgba(255,255,255,.96);
                box-shadow:0 24px 70px rgba(15,23,42,.22), 0 4px 18px rgba(15,23,42,.10);
                overflow:hidden;
                transform:scale(.96) translateY(8px);
                transition:transform .20s cubic-bezier(.22,1,.36,1);
                font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",sans-serif;
            }
            .meramu-ios-notify-backdrop.is-open .meramu-ios-notify-card{
                transform:scale(1) translateY(0);
            }
            .meramu-ios-notify-body{
                padding:26px 24px 20px;
                text-align:center;
            }
            .meramu-ios-notify-icon{
                width:48px;
                height:48px;
                margin:0 auto 14px;
                border-radius:15px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:22px;
                font-weight:800;
            }
            .meramu-ios-notify-icon.success{ background:#e9f8ef; color:#16794a; }
            .meramu-ios-notify-icon.error{ background:#fff0ef; color:#c62828; }
            .meramu-ios-notify-icon.warning{ background:#fff7df; color:#a66a00; }
            .meramu-ios-notify-icon.info{ background:#edf4ff; color:#1769aa; }
            .meramu-ios-notify-title{
                margin:0 0 8px;
                color:#17211b;
                font-size:19px;
                line-height:1.25;
                font-weight:750;
                letter-spacing:-.02em;
            }
            .meramu-ios-notify-message{
                margin:0;
                color:#66736b;
                font-size:14px;
                line-height:1.55;
                white-space:pre-line;
                overflow-wrap:anywhere;
            }
            .meramu-ios-notify-actions{
                border-top:1px solid #edf0ee;
            }
            .meramu-ios-notify-ok{
                width:100%;
                min-height:52px;
                border:0;
                background:transparent;
                color:#046738;
                font:700 16px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
                cursor:pointer;
            }
            .meramu-ios-notify-ok:active{ background:#f5faf7; }
            @media (max-width:480px){
                .meramu-ios-notify-backdrop{ padding:16px; }
                .meramu-ios-notify-card{ width:min(390px, calc(100vw - 32px)); border-radius:22px; }
                .meramu-ios-notify-body{ padding:24px 20px 18px; }
            }
        `;
        document.head.appendChild(style);
    }

    function classify(message){
        const text = String(message || "").toLowerCase();
        if(/gagal|error|tidak dapat|tidak berhasil|kesalahan|failed/.test(text)){
            return {type:"error", icon:"!", title:"Terjadi Kesalahan"};
        }
        if(/berhasil|sukses|success|selesai|tersimpan|dihapus/.test(text)){
            return {type:"success", icon:"✓", title:"Berhasil"};
        }
        if(/wajib|harap|ketik|perhatian|belum/.test(text)){
            return {type:"warning", icon:"!", title:"Perhatian"};
        }
        return {type:"info", icon:"i", title:"Informasi"};
    }

    function getRoot(){
        return document.getElementById(ROOT_ID);
    }

    function createRoot(){
        ensureStyle();

        let root = getRoot();
        if(root) return root;

        root = document.createElement("div");
        root.id = ROOT_ID;
        root.className = "meramu-ios-notify-backdrop";
        root.innerHTML = `
            <div class="meramu-ios-notify-card" role="alertdialog" aria-modal="true" aria-labelledby="meramuIOSNotifyTitle">
                <div class="meramu-ios-notify-body">
                    <div class="meramu-ios-notify-icon info" id="meramuIOSNotifyIcon">i</div>
                    <h2 class="meramu-ios-notify-title" id="meramuIOSNotifyTitle">Informasi</h2>
                    <p class="meramu-ios-notify-message" id="meramuIOSNotifyMessage"></p>
                </div>
                <div class="meramu-ios-notify-actions">
                    <button type="button" class="meramu-ios-notify-ok" id="meramuIOSNotifyOK">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(root);
        return root;
    }

    let queue = [];
    let showing = false;

    function showNext(){
        if(showing || !queue.length) return;
        showing = true;

        const item = queue.shift();
        const root = createRoot();
        const icon = root.querySelector("#meramuIOSNotifyIcon");
        const title = root.querySelector("#meramuIOSNotifyTitle");
        const message = root.querySelector("#meramuIOSNotifyMessage");
        const ok = root.querySelector("#meramuIOSNotifyOK");

        const meta = classify(item.message);
        icon.className = `meramu-ios-notify-icon ${meta.type}`;
        icon.textContent = meta.icon;
        title.textContent = meta.title;
        message.textContent = String(item.message ?? "");

        const close = () => {
            root.classList.remove("is-open");
            document.removeEventListener("keydown", onKey);
            setTimeout(() => {
                showing = false;
                item.resolve?.();
                showNext();
            }, 180);
        };

        const onKey = event => {
            if(event.key === "Escape" || event.key === "Enter"){
                event.preventDefault();
                close();
            }
        };

        ok.onclick = close;
        root.onclick = event => {
            if(event.target === root) close();
        };
        document.addEventListener("keydown", onKey);

        requestAnimationFrame(() => {
            root.classList.add("is-open");
            ok.focus();
        });
    }

    window.meramuAlert = function(message){
        return new Promise(resolve => {
            queue.push({message, resolve});
            showNext();
        });
    };

    // Preserve the native alert for emergency/debug use.
    if(!window.nativeMeramuAlert){
        window.nativeMeramuAlert = window.alert.bind(window);
    }

    window.alert = function(message){
        window.meramuAlert(message);
    };

})();
