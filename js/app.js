/* =========================================================
   MERAMU APP CONTROLLER
   Global Sidebar + Navigation
========================================================= */


/* =========================================================
   GET ELEMENTS
========================================================= */

function getAppShell(){
    return document.getElementById("appShell");
}

function getOverlay(){
    return document.getElementById("sidebarOverlay");
}

function getSidebar(){
    return document.querySelector(".sidebar");
}


/* =========================================================
   SIDEBAR STATE
========================================================= */

function openMobileSidebar(){

    const sidebar = getSidebar();
    const overlay = getOverlay();

    if(!sidebar){
        console.warn("MERAMU: Sidebar tidak ditemukan.");
        return;
    }

    sidebar.classList.add("show");

    if(overlay){
        overlay.classList.add("show");
    }

    document.body.classList.add("sidebar-open");

}


function closeMobileSidebar(){

    const sidebar = getSidebar();
    const overlay = getOverlay();

    sidebar?.classList.remove("show");
    overlay?.classList.remove("show");

    document.body.classList.remove("sidebar-open");

}


function toggleSidebar(){

    const sidebar = getSidebar();
    const overlay = getOverlay();
    const appShell = getAppShell();

    if(!sidebar){
        console.warn("MERAMU: Sidebar tidak ditemukan.");
        return;
    }


    /* -----------------------------------------
       MOBILE
    ----------------------------------------- */

    if(window.innerWidth <= 768){

        const isOpen =
            sidebar.classList.contains("show");

        if(isOpen){
            closeMobileSidebar();
        }else{
            openMobileSidebar();
        }

        return;
    }


    /* -----------------------------------------
       DESKTOP
    ----------------------------------------- */

    if(appShell){

        appShell.classList.toggle(
            "sidebar-collapsed"
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

        item.classList.remove("active");


        const route =
            item.dataset.route;


        /* -----------------------------------------
           OVERVIEW
        ----------------------------------------- */

        if(route === "overview"){

            const isDashboard =
                currentPath === "/" ||
                currentPath.endsWith(
                    "/index.html"
                );

            if(isDashboard){

                item.classList.add("active");

            }

            return;
        }


        /* -----------------------------------------
           OTHER PAGES
        ----------------------------------------- */

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

            item.classList.add("active");

        }

    });

}


/* =========================================================
   FIND HAMBURGER BUTTON
========================================================= */

function findSidebarToggleButton(){

    /* -----------------------------------------
       PRIMARY IDs
    ----------------------------------------- */

    const directButton =
        document.getElementById(
            "sidebarToggle"
        ) ||
        document.getElementById(
            "mobileSidebarToggle"
        );


    if(directButton){

        return directButton;

    }


    /* -----------------------------------------
       DATA ATTRIBUTES
    ----------------------------------------- */

    const dataButton =
        document.querySelector(
            "[data-sidebar-toggle]"
        );


    if(dataButton){

        return dataButton;

    }


    /* -----------------------------------------
       COMMON CLASS NAMES
    ----------------------------------------- */

    const classButton =
        document.querySelector(
            ".sidebar-toggle, .mobile-sidebar-toggle, .hamburger-toggle"
        );


    if(classButton){

        return classButton;

    }


    /* -----------------------------------------
       TOPBAR FALLBACK
       Ambil tombol pertama di topbar.
    ----------------------------------------- */

    const topbar =
        document.querySelector(
            ".topbar, header"
        );


    if(topbar){

        const buttons =
            topbar.querySelectorAll(
                "button"
            );


        if(buttons.length){

            return buttons[0];

        }

    }


    return null;

}


/* =========================================================
   GLOBAL CLICK HANDLER
========================================================= */

document.addEventListener(
    "click",
    function(event){

        /* -----------------------------------------
           SIDEBAR TOGGLE
        ----------------------------------------- */

        const directToggle =
            event.target.closest(
                "#sidebarToggle, #mobileSidebarToggle, [data-sidebar-toggle], .sidebar-toggle, .mobile-sidebar-toggle, .hamburger-toggle"
            );


        if(directToggle){

            event.preventDefault();
            event.stopPropagation();

            toggleSidebar();

            return;

        }


        /* -----------------------------------------
           OVERLAY
        ----------------------------------------- */

        if(
            event.target.closest(
                "#sidebarOverlay"
            )
        ){

            closeMobileSidebar();

            return;

        }


        /* -----------------------------------------
           SIDEBAR MENU
        ----------------------------------------- */

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


        /* Close mobile sidebar */

        closeMobileSidebar();


        /* Navigate */

        navigateToRoute(route);

    },
    true
);


/* =========================================================
   MOBILE SIDEBAR FALLBACK
   Jika topbar tidak mempunyai ID toggle,
   tombol pertama di topbar akan menjadi hamburger.
========================================================= */

document.addEventListener(
    "click",
    function(event){

        const directToggle =
            event.target.closest(
                "#sidebarToggle, #mobileSidebarToggle, [data-sidebar-toggle], .sidebar-toggle, .mobile-sidebar-toggle, .hamburger-toggle"
            );


        if(directToggle){
            return;
        }


        if(window.innerWidth > 768){
            return;
        }


        const topbar =
            event.target.closest(
                ".topbar, header"
            );


        if(!topbar){
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
            topbar.querySelectorAll(
                "button"
            );


        /* Tombol pertama dianggap hamburger */

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

        if(window.innerWidth > 768){

            closeMobileSidebar();

        }

    }
);


/* =========================================================
   ESCAPE
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
   INIT
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
   EXPORT
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
   START
========================================================= */

window.addEventListener(
    "load",
    initApp
);
