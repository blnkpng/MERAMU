/* =========================================================
   MERAMU RECIPE STUDIO
   H1 — RECIPE LIST
========================================================= */

(function(){

    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    let recipes = [];

    let filteredRecipes = [];


    /* =====================================================
       HELPERS
    ===================================================== */

    function waitForSupabase(
        callback,
        attempt = 0
    ){

        if(
            window.supabaseClient
        ){

            callback(
                window.supabaseClient
            );

            return;

        }


        if(attempt >= 50){

            showError(
                "Supabase client tidak tersedia."
            );

            return;

        }


        setTimeout(
            () => {

                waitForSupabase(
                    callback,
                    attempt + 1
                );

            },
            100
        );

    }


    function escapeHtml(value){

        if(
            value === null ||
            value === undefined
        ){

            return "";

        }


        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatNumber(value){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const number =
            Number(value);


        if(
            Number.isNaN(number)
        ){

            return escapeHtml(value);

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                maximumFractionDigits:2
            }
        ).format(number);

    }


    function formatCurrency(value){

        if(
            value === null ||
            value === undefined ||
            value === ""
        ){

            return "—";

        }


        const number =
            Number(value);


        if(
            Number.isNaN(number)
        ){

            return "—";

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                style:"currency",
                currency:"IDR",
                maximumFractionDigits:0
            }
        ).format(number);

    }


    /* =====================================================
       UI STATE
    ===================================================== */

    function showLoading(){

        const loading =
            document.getElementById(
                "recipeLoading"
            );

        const error =
            document.getElementById(
                "recipeError"
            );

        const empty =
            document.getElementById(
                "recipeEmpty"
            );

        const list =
            document.getElementById(
                "recipeList"
            );


        if(loading)
            loading.hidden = false;

        if(error)
            error.hidden = true;

        if(empty)
            empty.hidden = true;

        if(list)
            list.hidden = true;

    }


    function hideLoading(){

        const loading =
            document.getElementById(
                "recipeLoading"
            );

        if(loading){

            loading.hidden = true;

        }

    }


    function showError(message){

        hideLoading();


        const error =
            document.getElementById(
                "recipeError"
            );

        const messageEl =
            document.getElementById(
                "recipeErrorMessage"
            );


        if(messageEl){

            messageEl.textContent =
                message ||
                "Terjadi kesalahan.";

        }


        if(error){

            error.hidden = false;

        }


        const empty =
            document.getElementById(
                "recipeEmpty"
            );

        const list =
            document.getElementById(
                "recipeList"
            );


        if(empty)
            empty.hidden = true;

        if(list)
            list.hidden = true;


        if(window.lucide){

            lucide.createIcons();

        }

    }


    function showEmpty(){

        hideLoading();


        const empty =
            document.getElementById(
                "recipeEmpty"
            );

        const error =
            document.getElementById(
                "recipeError"
            );

        const list =
            document.getElementById(
                "recipeList"
            );


        if(empty)
            empty.hidden = false;

        if(error)
            error.hidden = true;

        if(list)
            list.hidden = true;


        updateSummary();

    }


    /* =====================================================
       LOAD RECIPES
    ===================================================== */

    async function loadRecipes(){

        showLoading();


        waitForSupabase(
            async (
                supabase
            ) => {

                try{

                    const {
                        data,
                        error
                    } = await supabase

                        .from("recipes")

                        .select(`
                            id,
                            code,
                            name,
                            recipe_type,

                            recipe_versions (
                                id,
                                version_number,
                                yield_quantity,
                                fermentation_required,
                                f1_target_days,
                                f2_target_days,
                                shelf_life_days
                            )
                        `)

                        .order(
                            "name",
                            {
                                ascending:true
                            }
                        );


                    if(error){

                        console.error(
                            "MERAMU Recipe Error:",
                            error
                        );

                        showError(
                            error.message ||
                            "Gagal mengambil data recipe."
                        );

                        return;

                    }


                    recipes =
                        Array.isArray(data)
                            ? data
                            : [];


                    filteredRecipes =
                        [...recipes];


                    hideLoading();


                    updateSummary();

                    renderRecipes();


                }catch(error){

                    console.error(
                        "MERAMU Recipe Exception:",
                        error
                    );

                    showError(
                        error.message ||
                        "Terjadi kesalahan."
                    );

                }

            }
        );

    }


    /* =====================================================
       CURRENT VERSION
    ===================================================== */

    function getCurrentVersion(recipe){

        const versions =
            Array.isArray(
                recipe.recipe_versions
            )
                ? recipe.recipe_versions
                : [];


        if(!versions.length){

            return null;

        }


        return [...versions]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b.version_number || 0
                    )
                    -
                    Number(
                        a.version_number || 0
                    )
            )[0];

    }


    /* =====================================================
       HPP
       
       HPP belum kita ambil di H1 karena struktur
       cost snapshot perlu kita cocokkan lebih dalam
       saat H2/H9.
    ===================================================== */

    function getRecipeHpp(recipe){

        return null;

    }


    /* =====================================================
       STATUS
       
       Untuk H1 kita gunakan Active sebagai default
       sampai kolom status recipe dikonfirmasi.
    ===================================================== */

    function getRecipeStatus(recipe){

        if(
            recipe.status
        ){

            return String(
                recipe.status
            ).toLowerCase();

        }


        return "active";

    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary(){

        const totalEl =
            document.getElementById(
                "recipeTotal"
            );

        const activeEl =
            document.getElementById(
                "recipeActive"
            );

        const versionsEl =
            document.getElementById(
                "recipeVersions"
            );


        const total =
            recipes.length;


        const active =
            recipes.filter(
                recipe =>
                    getRecipeStatus(
                        recipe
                    ) === "active"
            ).length;


        const versionCount =
            recipes.reduce(
                (
                    total,
                    recipe
                ) => {

                    return total +
                        (
                            Array.isArray(
                                recipe.recipe_versions
                            )
                                ? recipe.recipe_versions.length
                                : 0
                        );

                },
                0
            );


        if(totalEl)
            totalEl.textContent =
                formatNumber(total);

        if(activeEl)
            activeEl.textContent =
                formatNumber(active);

        if(versionsEl)
            versionsEl.textContent =
                formatNumber(
                    versionCount
                );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderRecipes(){

        const list =
            document.getElementById(
                "recipeList"
            );


        if(!list){

            return;

        }


        if(
            !filteredRecipes.length
        ){

            showEmpty();

            return;

        }


        const error =
            document.getElementById(
                "recipeError"
            );

        const empty =
            document.getElementById(
                "recipeEmpty"
            );


        if(error)
            error.hidden = true;

        if(empty)
            empty.hidden = true;


        list.hidden = false;


        list.innerHTML =
            filteredRecipes
                .map(
                    renderRecipeCard
                )
                .join("");


        if(window.lucide){

            lucide.createIcons();

        }

    }


    function renderRecipeCard(recipe){

        const currentVersion =
            getCurrentVersion(
                recipe
            );


        const version =
            currentVersion
                ? `v${escapeHtml(
                    currentVersion.version_number
                )}`
                : "Belum ada versi";


        const yieldQuantity =
            currentVersion
                ? formatNumber(
                    currentVersion.yield_quantity
                )
                : "—";


        const status =
            getRecipeStatus(
                recipe
            );


        const statusLabel =
            status === "archived"
                ? "Archived"
                : "Active";


        const hpp =
            getRecipeHpp(
                recipe
            );


        return `

            <article
                class="recipe-card"
                data-recipe-id="${escapeHtml(recipe.id)}"
            >

                <div class="recipe-card-main">


                    <div class="recipe-card-icon">

                        <i data-lucide="flask-conical"></i>

                    </div>


                    <div class="recipe-card-info">

                        <div class="recipe-card-title-row">

                            <h3>
                                ${escapeHtml(
                                    recipe.name ||
                                    "Tanpa Nama"
                                )}
                            </h3>

                            <span class="
                                recipe-status
                                ${status}
                            ">
                                ${statusLabel}
                            </span>

                        </div>


                        <div class="recipe-code">

                            ${escapeHtml(
                                recipe.code ||
                                "Tanpa kode"
                            )}

                        </div>


                        <div class="recipe-meta">

                            <span>

                                <i data-lucide="layers"></i>

                                ${version}

                            </span>


                            <span>

                                <i data-lucide="flask-conical"></i>

                                Yield ${yieldQuantity} L

                            </span>


                            ${
                                recipe.recipe_type
                                    ? `
                                        <span>

                                            <i data-lucide="tag"></i>

                                            ${escapeHtml(
                                                recipe.recipe_type
                                            )}

                                        </span>
                                      `
                                    : ""
                            }

                        </div>

                    </div>

                </div>


                <div class="recipe-card-right">


                    <div class="recipe-hpp">

                        <span>
                            HPP / Liter
                        </span>

                        <strong>
                            ${
                                hpp === null
                                    ? "—"
                                    : formatCurrency(hpp)
                            }
                        </strong>

                    </div>


                    <div class="recipe-actions">


                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="view"
                            data-id="${escapeHtml(recipe.id)}"
                            title="Lihat resep"
                        >

                            <i data-lucide="eye"></i>

                        </button>


                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="edit"
                            data-id="${escapeHtml(recipe.id)}"
                            title="Edit resep"
                        >

                            <i data-lucide="pencil"></i>

                        </button>


                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="version"
                            data-id="${escapeHtml(recipe.id)}"
                            title="Buat versi baru"
                        >

                            <i data-lucide="git-branch"></i>

                        </button>


                    </div>

                </div>

            </article>

        `;

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function applyFilters(){

        const searchInput =
            document.getElementById(
                "recipeSearch"
            );

        const statusFilter =
            document.getElementById(
                "recipeStatusFilter"
            );


        const search =
            (
                searchInput?.value ||
                ""
            )
            .trim()
            .toLowerCase();


        const status =
            statusFilter?.value ||
            "all";


        filteredRecipes =
            recipes.filter(
                recipe => {

                    const name =
                        String(
                            recipe.name ||
                            ""
                        )
                        .toLowerCase();


                    const code =
                        String(
                            recipe.code ||
                            ""
                        )
                        .toLowerCase();


                    const matchesSearch =
                        !search ||
                        name.includes(search) ||
                        code.includes(search);


                    const recipeStatus =
                        getRecipeStatus(
                            recipe
                        );


                    const matchesStatus =
                        status === "all" ||
                        recipeStatus === status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderRecipes();

    }


    /* =====================================================
       ACTIONS
    ===================================================== */

    function handleRecipeAction(
        action,
        id
    ){

        const recipe =
            recipes.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if(!recipe){

            return;

        }


        if(action === "view"){

            console.log(
                "MERAMU Recipe View:",
                recipe
            );

            alert(
                "Recipe detail akan kita kerjakan pada H2/H3."
            );

            return;

        }


        if(action === "edit"){

            console.log(
                "MERAMU Recipe Edit:",
                recipe
            );

            alert(
                "Recipe Edit akan kita kerjakan setelah H1 selesai."
            );

            return;

        }


        if(action === "version"){

            console.log(
                "MERAMU Recipe New Version:",
                recipe
            );

            alert(
                "Recipe Version akan kita kerjakan pada tahap H4."
            );

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents(){

        const search =
            document.getElementById(
                "recipeSearch"
            );

        const filter =
            document.getElementById(
                "recipeStatusFilter"
            );

        const retry =
            document.getElementById(
                "recipeRetryButton"
            );

        const create =
            document.getElementById(
                "createRecipeButton"
            );


        search?.addEventListener(
            "input",
            applyFilters
        );


        filter?.addEventListener(
            "change",
            applyFilters
        );


        retry?.addEventListener(
            "click",
            loadRecipes
        );


        create?.addEventListener(
            "click",
            () => {

                alert(
                    "Create Recipe akan kita kerjakan setelah Recipe List."
                );

            }
        );


        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if(!button){

                    return;

                }


                handleRecipeAction(
                    button.dataset.action,
                    button.dataset.id
                );

            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function initRecipePage(){

        bindEvents();

        loadRecipes();

    }


    /* =====================================================
       GLOBAL
    ===================================================== */

    window.initRecipePage =
        initRecipePage;


})();
