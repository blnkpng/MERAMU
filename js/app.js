// ================================
// MERAMU Layout Controller
// Sidebar + Mobile Drawer
// Navigation
// ================================


const appShell =
    document.getElementById("appShell");

const overlay =
    document.getElementById("sidebarOverlay");


/* =========================================================
   SIDEBAR
========================================================= */

function getSidebar(){

    return document.querySelector(".sidebar");

}


function toggleSidebar(){

    const sidebar =
        getSidebar();

    if(!sidebar) return;


    if(window.innerWidth <= 768){

        sidebar.classList.toggle("show");

        overlay?.classList.toggle("show");

    }else{

        appShell?.classList.toggle(
            "sidebar-collapsed"
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateToRoute(route){

    if(!route) return;


    switch(route){

        /* -----------------------------------------------
           OVERVIEW
        ------------------------------------------------ */

        case "overview":

            window.location.href =
                "/index.html";

            break;


        /* -----------------------------------------------
           FERMENTATION CALENDAR
        ------------------------------------------------ */

        case "fermentation-calendar":

            window.location.href =
                "/pages/fermentation-calendar.html";

            break;


        /* -----------------------------------------------
           FUTURE PAGES
        ------------------------------------------------ */

        case "production":

            console.log(
                "Production page belum dibuat."
            );

            break;


        case "f1":

            console.log(
                "F1 page belum dibuat."
            );

            break;


        case "f2":

            console.log(
                "F2 page belum dibuat."
            );

            break;


        case "harvest":

            console.log(
                "Harvest page belum dibuat."
            );

            break;


        case "recipe":

            console.log(
                "Recipe page belum dibuat."
            );

            break;


        case "inventory":

            console.log(
                "Inventory page belum dibuat."
            );

            break;


        case "hpp":

            console.log(
                "HPP page belum dibuat."
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


    if(!menuItems.length) return;


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


        /* -----------------------------------------------
           FERMENTATION CALENDAR
        ------------------------------------------------ */

        if(
            route ===
            "fermentation-calendar"
        ){

            if(
                currentPath.includes(
                    "/pages/fermentation-calendar.html"
                )
            ){

                item.classList.add(
                    "active"
                );

            }

            return;

        }


        /* -----------------------------------------------
           OVERVIEW
        ------------------------------------------------ */

        if(
            route ===
            "overview"
        ){

            const isDashboard =

                currentPath === "/"

                ||

                currentPath.endsWith(
                    "/index.html"
                );


            if(isDashboard){

                item.classList.add(
                    "active"
                );

            }

        }

    });

}


/* =========================================================
   EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    (e) => {


        /* -----------------------------------------------
           DESKTOP HAMBURGER
        ------------------------------------------------ */

        if(
            e.target.closest(
                "#sidebarToggle"
            )
        ){

            toggleSidebar();

            return;

        }


        /* -----------------------------------------------
           MOBILE HAMBURGER
        ------------------------------------------------ */

        if(
            e.target.closest(
                "#mobileSidebarToggle"
            )
        ){

            toggleSidebar();

            return;

        }


        /* -----------------------------------------------
           OVERLAY
        ------------------------------------------------ */

        if(
            e.target.id ===
            "sidebarOverlay"
        ){

            getSidebar()
                ?.classList
                .remove("show");

            overlay
                ?.classList
                .remove("show");

            return;

        }


        /* -----------------------------------------------
           SIDEBAR MENU
        ------------------------------------------------ */

        const menuItem =
            e.target.closest(
                ".menu a[data-route]"
            );


        if(!menuItem) return;


        const route =
            menuItem.dataset.route;


        /*
           Page yang belum dibuat
           tidak melakukan navigasi.
        */

        if(
            route !== "overview"
            &&
            route !==
                "fermentation-calendar"
        ){

            e.preventDefault();

            console.log(
                `Page "${route}" belum dibuat.`
            );

            return;

        }


        e.preventDefault();


        navigateToRoute(
            route
        );

    }
);


/* =========================================================
   RESET SAAT RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if(
            window.innerWidth > 768
        ){

            getSidebar()
                ?.classList
                .remove("show");

            overlay
                ?.classList
                .remove("show");

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

}


window.addEventListener(
    "load",
    initApp
);