/* =========================================================
   MERAMU FERMENTATION CALENDAR v1.1
   Stable Calendar Engine
   Dummy Data → Ready for Supabase
========================================================= */


/* =========================================================
   BATCH DATA
========================================================= */

const fermentationBatches = [

    {
        id: 1,
        code: "KB-021",
        product: "Original Kombucha",
        stage: "f1",
        startDate: "2026-09-28",
        endDate: "2026-10-05",
        day: 2,
        targetDays: 7
    },

    {
        id: 2,
        code: "KB-022",
        product: "Lemon Kombucha",
        stage: "f2",
        startDate: "2026-09-26",
        endDate: "2026-10-01",
        day: 4,
        targetDays: 5
    },

    {
        id: 3,
        code: "KB-023",
        product: "Berry Kombucha",
        stage: "f1",
        startDate: "2026-09-25",
        endDate: "2026-10-02",
        day: 5,
        targetDays: 7
    },

    {
        id: 4,
        code: "KB-024",
        product: "Jahe Kombucha",
        stage: "f2",
        startDate: "2026-09-24",
        endDate: "2026-09-29",
        day: 5,
        targetDays: 5
    },

    {
        id: 5,
        code: "KB-025",
        product: "Telang Kombucha",
        stage: "f1",
        startDate: "2026-09-20",
        endDate: "2026-09-27",
        day: 7,
        targetDays: 7
    },

    {
        id: 6,
        code: "KB-026",
        product: "Original Kombucha",
        stage: "f2",
        startDate: "2026-09-28",
        endDate: "2026-10-03",
        day: 2,
        targetDays: 5
    },

    {
        id: 7,
        code: "KB-027",
        product: "Lemon Kombucha",
        stage: "f1",
        startDate: "2026-09-29",
        endDate: "2026-10-06",
        day: 1,
        targetDays: 7
    },

    {
        id: 8,
        code: "KB-028",
        product: "Berry Kombucha",
        stage: "f2",
        startDate: "2026-09-29",
        endDate: "2026-10-04",
        day: 1,
        targetDays: 5
    }

];


/* =========================================================
   CALENDAR STATE
========================================================= */

let calendarDate = new Date(2026, 8, 1);


/* =========================================================
   MONTH NAMES
========================================================= */

const calendarMonthNames = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"

];


/* =========================================================
   DATE HELPERS
========================================================= */

function formatCalendarDate(date){

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function parseCalendarDate(value){

    const parts =
        value.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


function isSameCalendarDate(
    dateA,
    dateB
){

    return (

        dateA.getFullYear() ===
        dateB.getFullYear()

        &&

        dateA.getMonth() ===
        dateB.getMonth()

        &&

        dateA.getDate() ===
        dateB.getDate()

    );

}


/* =========================================================
   BATCH STATUS
========================================================= */

function getBatchStatus(batch){

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const endDate =
        parseCalendarDate(
            batch.endDate
        );


    /*
       F2 mencapai target
       → Ready Harvest
    */

    if(
        batch.stage === "f2"
        &&
        endDate <= today
    ){

        return "harvest";

    }


    /*
       Batch melewati target
       → Delayed
    */

    if(
        endDate < today
    ){

        return "delayed";

    }


    /*
       Normal
       → f1 / f2
    */

    return batch.stage;

}


/* =========================================================
   GET BATCHES ON DATE
========================================================= */

function getBatchesForDate(date){

    const dateString =
        formatCalendarDate(
            date
        );


    return fermentationBatches.filter(
        batch => {

            return (

                batch.startDate ===
                dateString

                ||

                batch.endDate ===
                dateString

            );

        }
    );

}


/* =========================================================
   RENDER CALENDAR
========================================================= */

function renderFermentationCalendar(){

    const grid =
        document.getElementById(
            "calendarGrid"
        );


    const monthLabel =
        document.getElementById(
            "calendarMonth"
        );


    if(
        !grid ||
        !monthLabel
    ){

        return;

    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    monthLabel.textContent =
        `${calendarMonthNames[month]} ${year}`;


    grid.innerHTML = "";


    /*
       JavaScript:

       Minggu = 0
       Senin = 1

       Kita ubah menjadi:

       Senin = 0
       ...
       Minggu = 6
    */

    const firstDay =
        new Date(
            year,
            month,
            1
        );


    let startingDay =
        firstDay.getDay() - 1;


    if(
        startingDay < 0
    ){

        startingDay = 6;

    }


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    /* =====================================================
       PREVIOUS MONTH
    ===================================================== */

    for(
        let i = startingDay - 1;
        i >= 0;
        i--
    ){

        const day =
            previousMonthDays - i;


        const cell =
            createCalendarDay(
                new Date(
                    year,
                    month - 1,
                    day
                ),
                true
            );


        grid.appendChild(
            cell
        );

    }


    /* =====================================================
       CURRENT MONTH
    ===================================================== */

    for(
        let day = 1;
        day <= daysInMonth;
        day++
    ){

        const date =
            new Date(
                year,
                month,
                day
            );


        const cell =
            createCalendarDay(
                date,
                false
            );


        grid.appendChild(
            cell
        );

    }


    /* =====================================================
       NEXT MONTH
    ===================================================== */

    const totalCells =
        Math.ceil(
            grid.children.length / 7
        ) * 7;


    let nextDay = 1;


    while(
        grid.children.length <
        totalCells
    ){

        const cell =
            createCalendarDay(
                new Date(
                    year,
                    month + 1,
                    nextDay
                ),
                true
            );


        grid.appendChild(
            cell
        );


        nextDay++;

    }


    if(window.lucide){

        lucide.createIcons();

    }

}


/* =========================================================
   CREATE CALENDAR DAY
========================================================= */

function createCalendarDay(
    date,
    outsideMonth
){

    const cell =
        document.createElement(
            "div"
        );


    cell.className =
        "calendar-day";


    if(outsideMonth){

        cell.classList.add(
            "outside-month"
        );

    }


    /* ---------- TODAY ---------- */

    if(
        isSameCalendarDate(
            date,
            new Date()
        )
    ){

        cell.classList.add(
            "today"
        );

    }


    /* ---------- DATE HEADER ---------- */

    const dateHeader =
        document.createElement(
            "div"
        );


    dateHeader.className =
        "calendar-day-header";


    const dateNumber =
        document.createElement(
            "span"
        );


    dateNumber.className =
        "calendar-date-number";


    dateNumber.textContent =
        date.getDate();


    dateHeader.appendChild(
        dateNumber
    );


    cell.appendChild(
        dateHeader
    );


    /* ---------- BATCHES ---------- */

    const batches =
        getBatchesForDate(
            date
        );


    batches.forEach(
        batch => {

            const event =
                document.createElement(
                    "button"
                );


            const status =
                getBatchStatus(
                    batch
                );


            event.type =
                "button";


            event.className =
                `calendar-event ${status}`;


            event.innerHTML = `

                <span class="calendar-event-stage">
                    ${status === "harvest"
                        ? "HARVEST"
                        : status === "delayed"
                            ? "TERLAMBAT"
                            : batch.stage.toUpperCase()
                    }
                </span>

                <span class="calendar-event-name">
                    ${batch.product}
                </span>

                <span class="calendar-event-code">
                    ${batch.code}
                </span>

            `;


            event.addEventListener(
                "click",
                () => {

                    openFermentationBatch(
                        batch
                    );

                }
            );


            cell.appendChild(
                event
            );

        }
    );


    return cell;

}


/* =========================================================
   NAVIGATION
========================================================= */

function goToPreviousMonth(){

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() - 1,
            1
        );


    renderFermentationCalendar();

}


function goToNextMonth(){

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + 1,
            1
        );


    renderFermentationCalendar();

}


function goToToday(){

    const today =
        new Date();


    calendarDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    renderFermentationCalendar();

}


/* =========================================================
   UPCOMING FERMENTATION
========================================================= */

function renderUpcomingFermentation(){

    const container =
        document.getElementById(
            "upcomingList"
        );


    if(!container){

        return;

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcoming =
        [...fermentationBatches]

            .sort(
                (a,b) => {

                    return (

                        parseCalendarDate(
                            a.endDate
                        )

                        -

                        parseCalendarDate(
                            b.endDate
                        )

                    );

                }
            )

            .filter(
                batch => {

                    return (

                        parseCalendarDate(
                            batch.endDate
                        ) >= today

                    );

                }
            )

            .slice(
                0,
                5
            );


    container.innerHTML =
        "";


    upcoming.forEach(
        batch => {

            const endDate =
                parseCalendarDate(
                    batch.endDate
                );


            const diff =
                Math.ceil(

                    (
                        endDate -
                        today
                    )

                    /

                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )

                );


            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "upcoming-item";


            item.innerHTML = `

                <div
                    class="upcoming-icon ${batch.stage}"
                >

                    <i data-lucide="${
                        batch.stage === "f1"
                            ? "flask-conical"
                            : "wine"
                    }"></i>

                </div>


                <div class="upcoming-info">

                    <div class="upcoming-top">

                        <strong>
                            ${batch.product}
                        </strong>

                        <span
                            class="upcoming-stage ${batch.stage}"
                        >
                            ${batch.stage.toUpperCase()}
                        </span>

                    </div>


                    <span class="upcoming-code">
                        ${batch.code}
                    </span>

                </div>


                <div class="upcoming-date">

                    <strong>

                        ${
                            diff === 0
                                ? "Hari ini"
                                : diff === 1
                                    ? "Besok"
                                    : `${diff} hari`
                        }

                    </strong>


                    <span>
                        ${batch.endDate}
                    </span>

                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    openFermentationBatch(
                        batch
                    );

                }
            );


            container.appendChild(
                item
            );

        }
    );


    if(window.lucide){

        lucide.createIcons();

    }

}


/* =========================================================
   BATCH DETAIL
========================================================= */

function openFermentationBatch(batch){

    if(!batch || !batch.code){

        return;

    }


    window.location.href =
        `batch-detail.html?id=${encodeURIComponent(batch.code)}`;

}


/* =========================================================
   EVENTS
========================================================= */

document.addEventListener(
    "click",
    event => {


        if(
            event.target.closest(
                "#previousMonth"
            )
        ){

            goToPreviousMonth();

        }


        if(
            event.target.closest(
                "#nextMonth"
            )
        ){

            goToNextMonth();

        }


        if(
            event.target.closest(
                "#todayButton"
            )
        ){

            goToToday();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initFermentationCalendar(){

    renderFermentationCalendar();

    renderUpcomingFermentation();

}


/* =========================================================
   EXPORT
========================================================= */

window.initFermentationCalendar =
    initFermentationCalendar;


window.renderFermentationCalendar =
    renderFermentationCalendar;


window.renderUpcomingFermentation =
    renderUpcomingFermentation;