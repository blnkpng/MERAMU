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
