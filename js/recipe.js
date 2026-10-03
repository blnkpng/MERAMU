/* =========================================================
   MERAMU — RECIPE STUDIO
   ---------------------------------------------------------
   H1  Recipe List
   H2  Create Recipe
   H3  Recipe Detail + Edit Recipe
   H4  Recipe Version — NEXT

   IMPORTANT BUSINESS RULE

   Recipe = MASTER FORMULA

   Production = EXECUTION / BATCH

   H3 Edit Recipe hanya mengubah MASTER RECIPE:

   - Name
   - Code
   - Product
   - Recipe Type
   - Description

   H3 TIDAK mengubah:

   - Recipe Version
   - Ingredients
   - Yield
   - Fermentation Setting
   - F1 Target
   - F2 Target
   - Shelf Life

   Perubahan formula dilakukan melalui
   Recipe Version pada H4.
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    let recipes = [];

    let filteredRecipes = [];

    let products = [];

    let ingredients = [];

    let units = [];

    let ingredientRows = 0;

    let activeDetailRecipeId = null;

    /*
    =========================================================
    H3 EDIT STATE

    null = Create Recipe
    ID   = Edit Recipe
    =========================================================
    */

    let editingRecipeId = null;


    /* =====================================================
       SUPABASE
    ===================================================== */

    function waitForSupabase(
        callback,
        attempt = 0
    ) {

        if (
            window.supabaseClient
        ) {

            callback(
                window.supabaseClient
            );

            return;

        }


        if (
            attempt >= 50
        ) {

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


    /* =====================================================
       GENERAL HELPERS
    ===================================================== */

    function escapeHtml(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    function formatNumber(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";

        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return escapeHtml(
                value
            );

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                maximumFractionDigits: 3
            }
        ).format(
            number
        );

    }


    function formatCurrency(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";

        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return "—";

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        ).format(
            number
        );

    }


    function getCurrentVersion(
    recipe
) {

    const versions =
        Array.isArray(
            recipe?.recipe_versions
        )
            ? recipe.recipe_versions
            : [];


    if (
        !versions.length
    ) {

        return null;

    }


    /*
    =====================================================
    CURRENT VERSION
    -----------------------------------------------------
    PRIORITAS:
    1. recipes.current_version_number
    2. fallback ke version terbesar
    =====================================================
    */

    const currentVersionNumber =
        Number(
            recipe?.current_version_number
        );


    /*
    -----------------------------------------------------
    1. CARI BERDASARKAN current_version_number
    -----------------------------------------------------
    */

    if (
        Number.isFinite(
            currentVersionNumber
        ) &&
        currentVersionNumber > 0
    ) {

        const currentVersion =
            versions.find(
                version =>
                    Number(
                        version.version_number
                    ) ===
                    currentVersionNumber
            );


        if (
            currentVersion
        ) {

            return currentVersion;

        }

    }


    /*
    -----------------------------------------------------
    2. FALLBACK
    -----------------------------------------------------

    Jika current_version_number:
    - kosong
    - null
    - invalid
    - menunjuk version yang tidak ada

    maka ambil version terbesar.
    -----------------------------------------------------
    */

    return [
        ...versions
    ]
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


    function getRecipeStatus(
        recipe
    ) {

        return String(
            recipe?.status ||
            "active"
        ).toLowerCase();

    }


    function refreshIcons() {

        if (
            window.lucide
        ) {

            lucide.createIcons();

        }

    }


    /* =====================================================
       PAGE LOADING
    ===================================================== */

    function showLoading() {

        document
            .getElementById(
                "recipeLoading"
            )
            ?.removeAttribute(
                "hidden"
            );


        document
            .getElementById(
                "recipeError"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById(
                "recipeEmpty"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById(
                "recipeList"
            )
            ?.setAttribute(
                "hidden",
                ""
            );

    }


    function hideLoading() {

        document
            .getElementById(
                "recipeLoading"
            )
            ?.setAttribute(
                "hidden",
                ""
            );

    }


    function showError(
        message
    ) {

        hideLoading();


        const error =
            document.getElementById(
                "recipeError"
            );


        const errorText =
            document.getElementById(
                "recipeErrorMessage"
            );


        if (
            errorText
        ) {

            errorText.textContent =
                message ||
                "Terjadi kesalahan.";

        }


        error?.removeAttribute(
            "hidden"
        );


        document
            .getElementById(
                "recipeEmpty"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById(
                "recipeList"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        refreshIcons();

    }


    function showEmpty() {

        hideLoading();


        document
            .getElementById(
                "recipeEmpty"
            )
            ?.removeAttribute(
                "hidden"
            );


        document
            .getElementById(
                "recipeError"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById(
                "recipeList"
            )
            ?.setAttribute(
                "hidden",
                ""
            );

    }


    /* =====================================================
       H1 — LOAD RECIPE LIST
    ===================================================== */

    async function loadRecipes() {

        showLoading();


        waitForSupabase(
            async supabase => {

                try {

                    const {
                        data,
                        error
                    } = await supabase

                        .from(
                            "recipes"
                        )

                        .select(`
                            id,
                            code,
                            name,
                            description,
                            recipe_type,
                            status,
                            product_id,
                            current_version_number,
                            recipe_versions (
                                id,
                                version_number,
                                yield_quantity,
                                yield_unit_id,
                                fermentation_required,
                                f1_target_days,
                                f2_target_days,
                                shelf_life_days
                            )
                        `)

                        .order(
                            "name",
                            {
                                ascending:
                                    true
                            }
                        );


                    if (
                        error
                    ) {

                        console.error(
                            "Recipe load error:",
                            error
                        );

                        showError(
                            error.message
                        );

                        return;

                    }


                    recipes =
                        Array.isArray(data)
                            ? data
                            : [];


                    filteredRecipes =
                        [
                            ...recipes
                        ];


                    hideLoading();

                    updateSummary();

                    renderRecipes();

                }
                catch (
                    error
                ) {

                    console.error(
                        "RECIPE LIST ERROR:",
                        error
                    );

                    showError(
                        error?.message ||
                        "Gagal memuat recipe."
                    );

                }

            }
        );

    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary() {

        const total =
            recipes.length;


        const active =
            recipes.filter(
                recipe =>
                    getRecipeStatus(
                        recipe
                    ) ===
                    "active"
            ).length;


        const versions =
            recipes.reduce(
                (
                    sum,
                    recipe
                ) => {

                    const recipeVersions =
                        Array.isArray(
                            recipe.recipe_versions
                        )
                            ? recipe.recipe_versions
                            : [];


                    return (
                        sum +
                        recipeVersions.length
                    );

                },
                0
            );


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


        if (
            totalEl
        ) {

            totalEl.textContent =
                formatNumber(
                    total
                );

        }


        if (
            activeEl
        ) {

            activeEl.textContent =
                formatNumber(
                    active
                );

        }


        if (
            versionsEl
        ) {

            versionsEl.textContent =
                formatNumber(
                    versions
                );

        }

    }


    /* =====================================================
       H1 — RENDER RECIPE LIST
    ===================================================== */

    function renderRecipes() {

        const list =
            document.getElementById(
                "recipeList"
            );


        if (
            !list
        ) {

            return;

        }


        if (
            !filteredRecipes.length
        ) {

            showEmpty();

            return;

        }


        document
            .getElementById(
                "recipeEmpty"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById(
                "recipeError"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        list.removeAttribute(
            "hidden"
        );


        list.innerHTML =
            filteredRecipes
                .map(
                    renderRecipeCard
                )
                .join("");


        refreshIcons();

    }


    function renderRecipeCard(
        recipe
    ) {

        const version =
            getCurrentVersion(
                recipe
            );


        const status =
            getRecipeStatus(
                recipe
            );


        const statusLabel =
            status === "archived"
                ? "Archived"
                : "Active";


        const type =
            recipe.recipe_type ||
            "";


        const yieldValue =
            version?.yield_quantity;


        return `

            <article
                class="recipe-card"
                data-recipe-id="${escapeHtml(
                    recipe.id
                )}"
            >

                <div
                    class="recipe-card-main"
                >

                    <div
                        class="recipe-card-icon"
                    >

                        <i
                            data-lucide="flask-conical"
                        ></i>

                    </div>


                    <div
                        class="recipe-card-info"
                    >

                        <div
                            class="recipe-card-title-row"
                        >

                            <h3>

                                ${escapeHtml(
                                    recipe.name ||
                                    "Tanpa Nama"
                                )}

                            </h3>


                            <span
                                class="
                                    recipe-status
                                    ${escapeHtml(
                                        status
                                    )}
                                "
                            >

                                ${statusLabel}

                            </span>

                        </div>


                        <div
                            class="recipe-code"
                        >

                            ${escapeHtml(
                                recipe.code ||
                                "Tanpa kode"
                            )}

                        </div>


                        <div
                            class="recipe-meta"
                        >

                            <span>

                                <i
                                    data-lucide="layers"
                                ></i>

                                ${
                                    version
                                        ? `v${escapeHtml(
                                            version.version_number
                                        )}`
                                        : "Belum ada versi"
                                }

                            </span>


                            <span>

                                <i
                                    data-lucide="flask-conical"
                                ></i>

                                Yield ${
                                    yieldValue !==
                                    undefined &&
                                    yieldValue !==
                                    null
                                        ? formatNumber(
                                            yieldValue
                                        )
                                        : "—"
                                }

                            </span>


                            ${
                                type
                                    ? `
                                        <span>

                                            <i
                                                data-lucide="tag"
                                            ></i>

                                            ${escapeHtml(
                                                type
                                            )}

                                        </span>
                                      `
                                    : ""
                            }

                        </div>

                    </div>

                </div>


                <div
                    class="recipe-card-right"
                >

                    <div
                        class="recipe-hpp"
                    >

                        <span>
                            HPP / Liter
                        </span>

                        <strong>
                            —
                        </strong>

                    </div>


                    <div
                        class="recipe-actions"
                    >

                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="view"
                            data-id="${escapeHtml(
                                recipe.id
                            )}"
                            title="Lihat recipe"
                        >

                            <i
                                data-lucide="eye"
                            ></i>

                        </button>


                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="edit"
                            data-id="${escapeHtml(
                                recipe.id
                            )}"
                            title="Edit recipe"
                        >

                            <i
                                data-lucide="pencil"
                            ></i>

                        </button>


                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="version"
                            data-id="${escapeHtml(
                                recipe.id
                            )}"
                            title="Buat versi baru"
                        >

                            <i
                                data-lucide="git-branch"
                            ></i>

                        </button>
                        <button
    type="button"
    class="icon-detail-btn danger"
    data-action="delete"
    data-id="${escapeHtml(
        recipe.id
    )}"
    title="Hapus recipe"
    aria-label="Hapus recipe"
>

    <i
        data-lucide="trash-2"
    ></i>

</button>

                    </div>

                </div>

            </article>

        `;

    }


    /* =====================================================
       H1 — FILTER
    ===================================================== */

    function applyFilters() {

        const search =
            (
                document.getElementById(
                    "recipeSearch"
                )?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const status =
            document.getElementById(
                "recipeStatusFilter"
            )?.value ||
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
                        name.includes(
                            search
                        ) ||
                        code.includes(
                            search
                        );


                    const recipeStatus =
                        getRecipeStatus(
                            recipe
                        );


                    const matchesStatus =
                        status === "all" ||
                        recipeStatus ===
                            status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderRecipes();

    }


    /* =====================================================
       H2 — LOAD MASTER DATA
    ===================================================== */

    async function loadFormData() {

        return new Promise(
            resolve => {

                waitForSupabase(
                    async supabase => {

                        try {

                            const [
                                productResult,
                                ingredientResult,
                                unitResult
                            ] =
                                await Promise.all([

                                    supabase
                                        .from(
                                            "products"
                                        )
                                        .select(`
                                            id,
                                            code,
                                            name,
                                            is_active
                                        `)
                                        .eq(
                                            "is_active",
                                            true
                                        )
                                        .order(
                                            "name",
                                            {
                                                ascending:
                                                    true
                                            }
                                        ),

                                    supabase
                                        .from(
                                            "ingredients"
                                        )
                                        .select(`
                                            id,
                                            code,
                                            name,
                                            default_unit_id,
                                            cost_per_unit,
                                            is_active
                                        `)
                                        .eq(
                                            "is_active",
                                            true
                                        )
                                        .order(
                                            "name",
                                            {
                                                ascending:
                                                    true
                                            }
                                        ),

                                    supabase
                                        .from(
                                            "units"
                                        )
                                        .select(`
                                            id,
                                            code,
                                            name,
                                            category
                                        `)
                                        .order(
                                            "name",
                                            {
                                                ascending:
                                                    true
                                            }
                                        )

                                ]);


                            if (
                                productResult.error
                            ) {

                                throw productResult.error;

                            }


                            if (
                                ingredientResult.error
                            ) {

                                throw ingredientResult.error;

                            }


                            if (
                                unitResult.error
                            ) {

                                throw unitResult.error;

                            }


                            products =
                                productResult.data ||
                                [];


                            ingredients =
                                ingredientResult.data ||
                                [];


                            units =
                                unitResult.data ||
                                [];


                            populateProductSelect();

                            populateUnitSelect();

                            resetIngredientRows();


                            resolve(
                                true
                            );

                        }
                        catch (
                            error
                        ) {

                            console.error(
                                "Recipe master data error:",
                                error
                            );

                            showFormError(
                                error?.message ||
                                "Gagal mengambil master data."
                            );


                            resolve(
                                false
                            );

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
       PRODUCT SELECT
    ===================================================== */

    function populateProductSelect() {

        const select =
            document.getElementById(
                "recipeProduct"
            );


        if (
            !select
        ) {

            return;

        }


        select.innerHTML = `

            <option value="">
                Pilih Product
            </option>

            ${
                products
                    .map(
                        product => `

                            <option
                                value="${escapeHtml(
                                    product.id
                                )}"
                            >

                                ${escapeHtml(
                                    product.name
                                )}

                                ${
                                    product.code
                                        ? ` (${escapeHtml(
                                            product.code
                                        )})`
                                        : ""
                                }

                            </option>

                        `
                    )
                    .join("")
            }

        `;

    }


    /* =====================================================
       UNIT SELECT
    ===================================================== */

    function populateUnitSelect() {

        const select =
            document.getElementById(
                "recipeYieldUnit"
            );


        if (
            !select
        ) {

            return;

        }


        select.innerHTML = `

            <option value="">
                Pilih Unit
            </option>

            ${
                units
                    .map(
                        unit => `

                            <option
                                value="${escapeHtml(
                                    unit.id
                                )}"
                            >

                                ${escapeHtml(
                                    unit.name ||
                                    unit.code
                                )}

                                ${
                                    unit.code
                                        ? ` (${escapeHtml(
                                            unit.code
                                        )})`
                                        : ""
                                }

                            </option>

                        `
                    )
                    .join("")
            }

        `;


        const liter =
            units.find(
                unit => {

                    const code =
                        String(
                            unit.code ||
                            ""
                        )
                            .toLowerCase();


                    const name =
                        String(
                            unit.name ||
                            ""
                        )
                            .toLowerCase();


                    return (
                        code === "l" ||
                        code === "liter" ||
                        name === "liter"
                    );

                }
            );


        if (
            liter
        ) {

            select.value =
                liter.id;

        }

    }


    /* =====================================================
       H2 — INGREDIENT ROWS
    ===================================================== */

    function resetIngredientRows() {

        ingredientRows = 0;


        const container =
            document.getElementById(
                "recipeIngredients"
            );


        if (
            !container
        ) {

            return;

        }


        container.innerHTML =
            "";


        updateIngredientEmpty();


        addIngredientRow();

    }


    function addIngredientRow() {

        ingredientRows++;


        const rowId =
            ingredientRows;


        const container =
            document.getElementById(
                "recipeIngredients"
            );


        if (
            !container
        ) {

            return;

        }


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "recipe-ingredient-row";


        row.dataset.rowId =
            rowId;


        row.innerHTML = `

            <div
                class="recipe-ingredient-number"
            >

                ${rowId}

            </div>


            <div
                class="recipe-field"
            >

                <label>
                    Ingredient
                </label>

                <select
                    class="recipe-ingredient-select"
                    data-field="ingredient"
                    required
                >

                    <option value="">
                        Pilih bahan
                    </option>

                    ${
                        ingredients
                            .map(
                                ingredient => `

                                    <option
                                        value="${escapeHtml(
                                            ingredient.id
                                        )}"
                                        data-default-unit="${escapeHtml(
                                            ingredient.default_unit_id ||
                                            ""
                                        )}"
                                    >

                                        ${escapeHtml(
                                            ingredient.name
                                        )}

                                        ${
                                            ingredient.code
                                                ? ` (${escapeHtml(
                                                    ingredient.code
                                                )})`
                                                : ""
                                        }

                                    </option>

                                `
                            )
                            .join("")
                    }

                </select>

            </div>


            <div
                class="recipe-field"
            >

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    class="recipe-ingredient-qty"
                    data-field="quantity"
                    min="0.000001"
                    step="0.000001"
                    placeholder="0"
                    required
                >

            </div>


            <div
                class="recipe-field"
            >

                <label>
                    Unit
                </label>

                <select
                    class="recipe-ingredient-unit"
                    data-field="unit"
                    required
                >

                    <option value="">
                        Unit
                    </option>

                    ${
                        units
                            .map(
                                unit => `

                                    <option
                                        value="${escapeHtml(
                                            unit.id
                                        )}"
                                    >

                                        ${escapeHtml(
                                            unit.name ||
                                            unit.code
                                        )}

                                        ${
                                            unit.code
                                                ? ` (${escapeHtml(
                                                    unit.code
                                                )})`
                                                : ""
                                        }

                                    </option>

                                `
                            )
                            .join("")
                    }

                </select>

            </div>


            <button
                type="button"
                class="recipe-remove-ingredient"
                title="Hapus bahan"
            >

                <i
                    data-lucide="trash-2"
                ></i>

            </button>

        `;


        container.appendChild(
            row
        );


        const ingredientSelect =
            row.querySelector(
                ".recipe-ingredient-select"
            );


        ingredientSelect?.addEventListener(
            "change",
            () => {

                const selected =
                    ingredientSelect
                        .selectedOptions[0];


                const defaultUnit =
                    selected?.dataset
                        ?.defaultUnit;


                const unitSelect =
                    row.querySelector(
                        ".recipe-ingredient-unit"
                    );


                if (
                    defaultUnit &&
                    unitSelect
                ) {

                    unitSelect.value =
                        defaultUnit;

                }

            }
        );


        row.querySelector(
            ".recipe-remove-ingredient"
        )?.addEventListener(
            "click",
            () => {

                row.remove();

                renumberIngredientRows();

                updateIngredientEmpty();

            }
        );


        updateIngredientEmpty();

        refreshIcons();

    }


    function renumberIngredientRows() {

        const rows =
            document.querySelectorAll(
                ".recipe-ingredient-row"
            );


        rows.forEach(
            (
                row,
                index
            ) => {

                const number =
                    row.querySelector(
                        ".recipe-ingredient-number"
                    );


                if (
                    number
                ) {

                    number.textContent =
                        index + 1;

                }

            }
        );

    }


    function updateIngredientEmpty() {

        const container =
            document.getElementById(
                "recipeIngredients"
            );


        const empty =
            document.getElementById(
                "recipeIngredientEmpty"
            );


        const count =
            container
                ?.querySelectorAll(
                    ".recipe-ingredient-row"
                )
                .length ||
            0;


        if (
            empty
        ) {

            empty.hidden =
                count > 0;

        }

    }


    /* =====================================================
       H2 — AUTO RECIPE CODE
    ===================================================== */

    function generateRecipeCode(
        name
    ) {

        const clean =
            String(
                name ||
                ""
            )
                .toUpperCase()
                .normalize(
                    "NFD"
                )
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^A-Z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                );


        if (
            !clean
        ) {

            return "";

        }


        return `REC-${clean.substring(
            0,
            24
        )}`;

    }


    /* =====================================================
       H2 / H3 — RECIPE MODAL MODE
    ===================================================== */

    function setRecipeModalMode(
        mode
    ) {

        const title =
            document.querySelector(
                "#recipeModal h2"
            );


        const subtitle =
            document.querySelector(
                "#recipeModal .recipe-modal-header p"
            );


        const saveButton =
            document.getElementById(
                "saveRecipeButton"
            );


        const saveText =
            saveButton?.querySelector(
                "span"
            );


        if (
            mode === "edit"
        ) {

            if (
                title
            ) {

                title.textContent =
                    "Edit Recipe";

            }


            if (
                subtitle
            ) {

                subtitle.textContent =
                    "Edit informasi master recipe tanpa mengubah formula version.";

            }


            if (
                saveText
            ) {

                saveText.textContent =
                    "Simpan Perubahan";

            }


            return;

        }


        /*
        CREATE MODE
        */

        if (
            title
        ) {

            title.textContent =
                "Buat Recipe";

        }


        if (
            subtitle
        ) {

            subtitle.textContent =
                "Buat master formula baru untuk digunakan sebagai template Production.";

        }


        if (
            saveText
        ) {

            saveText.textContent =
                "Simpan Recipe";

        }

    }


    /* =====================================================
       H2 — OPEN CREATE RECIPE
    ===================================================== */

    function openRecipeModal() {

        editingRecipeId =
            null;


        const modal =
            document.getElementById(
                "recipeModal"
            );


        if (
            !modal
        ) {

            return;

        }


        modal.removeAttribute(
            "hidden"
        );


        document.body.classList.add(
            "recipe-modal-open"
        );


        clearFormError();


        const form =
            document.getElementById(
                "createRecipeForm"
            );


        form?.reset();


        /*
        -----------------------------------------------------
        CREATE MODE
        -----------------------------------------------------
        */

        setRecipeModalMode(
            "create"
        );


        setEditFormulaReadonly(
            false
        );


        /*
        -----------------------------------------------------
        DEFAULT VALUE
        -----------------------------------------------------
        */

        const yieldInput =
            document.getElementById(
                "recipeYield"
            );


        if (
            yieldInput
        ) {

            yieldInput.value =
                "1";

        }


        const typeSelect =
            document.getElementById(
                "recipeType"
            );


        if (
            typeSelect
        ) {

            typeSelect.value =
                "fermentation";

        }


        const fermentation =
            document.getElementById(
                "fermentationRequired"
            );


        if (
            fermentation
        ) {

            fermentation.checked =
                true;

        }


        const f1 =
            document.getElementById(
                "f1TargetDays"
            );


        if (
            f1
        ) {

            f1.value =
                "7";

        }


        const f2 =
            document.getElementById(
                "f2TargetDays"
            );


        if (
            f2
        ) {

            f2.value =
                "5";

        }


        const shelf =
            document.getElementById(
                "recipeShelfLife"
            );


        if (
            shelf
        ) {

            shelf.value =
                "30";

        }


        const code =
            document.getElementById(
                "recipeCode"
            );


        if (
            code
        ) {

            code.value =
                "";

            delete code.dataset.manual;

        }


        const name =
            document.getElementById(
                "recipeName"
            );


        if (
            name
        ) {

            name.value =
                "";

        }


        updateFermentationVisibility();


        loadFormData();


        setTimeout(
            () => {

                name?.focus();

            },
            100
        );

    }


    /* =====================================================
       H3 — OPEN EDIT RECIPE
    ===================================================== */

    async function openEditRecipe(
        recipeId
    ) {

        if (
            !recipeId
        ) {

            return;

        }


        editingRecipeId =
            recipeId;


        /*
        -----------------------------------------------------
        CLOSE DETAIL
        -----------------------------------------------------
        */

        closeRecipeDetail();


        /*
        -----------------------------------------------------
        OPEN FORM
        -----------------------------------------------------
        */

        const modal =
            document.getElementById(
                "recipeModal"
            );


        if (
            !modal
        ) {

            return;

        }


        modal.removeAttribute(
            "hidden"
        );


        document.body.classList.add(
            "recipe-modal-open"
        );


        clearFormError();


        setRecipeModalMode(
            "edit"
        );


        /*
        -----------------------------------------------------
        LOAD MASTER DATA
        -----------------------------------------------------
        */

        const loaded =
            await loadFormData();


        if (
            !loaded
        ) {

            return;

        }
         /*
         ---------------------------------------------------------
         LOAD CURRENT VERSION
         ---------------------------------------------------------
         */
         
         const versionData =
             await loadRecipeVersionData(
                 recipeId
             );
         
         
         const currentVersion =
             versionData.currentVersion;
         
         
         const currentIngredients =
             versionData.ingredients || [];

        /*
        -----------------------------------------------------
        LOAD RECIPE
        -----------------------------------------------------
        */

        waitForSupabase(
            async supabase => {

                try {

                    const {
                        data: recipe,
                        error
                    } = await supabase

                        .from(
                            "recipes"
                        )

                        .select(`
                            id,
                            code,
                            name,
                            description,
                            recipe_type,
                            status,
                            product_id
                        `)

                        .eq(
                            "id",
                            recipeId
                        )

                        .single();


                    if (
                        error
                    ) {

                        throw error;

                    }


                    /*
                    -------------------------------------------------
                    ISI FORM
                    -------------------------------------------------
                    */

                    const name =
                        document.getElementById(
                            "recipeName"
                        );


                    const code =
                        document.getElementById(
                            "recipeCode"
                        );


                    const product =
                        document.getElementById(
                            "recipeProduct"
                        );


                    const type =
                        document.getElementById(
                            "recipeType"
                        );


                    const description =
                        document.getElementById(
                            "recipeDescription"
                        );


                    if (
                        name
                    ) {

                        name.value =
                            recipe.name ||
                            "";

                    }


                    if (
                        code
                    ) {

                        code.value =
                            recipe.code ||
                            "";

                        code.dataset.manual =
                            "true";

                    }


                    if (
                        product
                    ) {

                        product.value =
                            recipe.product_id ||
                            "";

                    }


                    if (
                        type
                    ) {

                        type.value =
                            recipe.recipe_type ||
                            "fermentation";

                    }


                    if (
                        description
                    ) {

                        description.value =
                            recipe.description ||
                            "";

                    }
                  /*
                  =========================================================
                  LOAD CURRENT VERSION INTO READONLY FORM
                  =========================================================
                  */
                  
                  const yieldInput =
                      document.getElementById(
                          "recipeYield"
                      );
                  
                  
                  const yieldUnit =
                      document.getElementById(
                          "recipeYieldUnit"
                      );
                  
                  
                  const fermentation =
                      document.getElementById(
                          "fermentationRequired"
                      );
                  
                  
                  const f1 =
                      document.getElementById(
                          "f1TargetDays"
                      );
                  
                  
                  const f2 =
                      document.getElementById(
                          "f2TargetDays"
                      );
                  
                  
                  const shelfLife =
                      document.getElementById(
                          "recipeShelfLife"
                      );
                  
                  
                  const notes =
                      document.getElementById(
                          "recipeNotes"
                      );
                  
                  
                  /*
                  ---------------------------------------------------------
                  YIELD
                  ---------------------------------------------------------
                  */
                  
                  if (
                      yieldInput
                  ) {
                  
                      yieldInput.value =
                          currentVersion
                              ?.yield_quantity ??
                          "";
                  
                  }
                  
                  
                  /*
                  ---------------------------------------------------------
                  YIELD UNIT
                  ---------------------------------------------------------
                  */
                  
                  if (
                      yieldUnit
                  ) {
                  
                      yieldUnit.value =
                          currentVersion
                              ?.yield_unit_id ||
                          "";
                  
                  }
                  
                  
                  /*
                  ---------------------------------------------------------
                  FERMENTATION
                  ---------------------------------------------------------
                  */
                  
                  if (
                      fermentation
                  ) {
                  
                      fermentation.checked =
                          Boolean(
                              currentVersion
                                  ?.fermentation_required
                          );
                  
                  }
                  
                  
                  /*
                  ---------------------------------------------------------
                  F1
                  ---------------------------------------------------------
                  */
                  
                  if (
                      f1
                  ) {
                  
                      f1.value =
                          currentVersion
                              ?.f1_target_days ??
                          "";
                  
                  }
                  
                  
                  /*
                  ---------------------------------------------------------
                  F2
                  ---------------------------------------------------------
                  */
                  
                  if (
                      f2
                  ) {
                  
                      f2.value =
                          currentVersion
                              ?.f2_target_days ??
                          "";
                  
                  }
                  
                  
                  /*
                  ---------------------------------------------------------
                  SHELF LIFE
                  ---------------------------------------------------------
                  */
                  
                  if (
                      shelfLife
                  ) {
                  
                      shelfLife.value =
                          currentVersion
                              ?.shelf_life_days ??
                          "";
                  
                  }
                  
                  
                  /* 
                  ================================================
                  NOTES
                  ================================================
                  */
                  
                  if (
                      notes
                  ) {
                  
                      notes.value =
                          currentVersion
                              ?.notes ??
                          "";
                  
                  }
                   /*
                  =========================================================
                  LOAD CURRENT VERSION INGREDIENTS
                  =========================================================
                  */
                  
                  const ingredientContainer =
                      document.getElementById(
                          "recipeIngredients"
                      );
                  
                  
                  if (
                      ingredientContainer
                  ) {
                  
                      ingredientContainer.innerHTML =
                          "";
                  
                      ingredientRows =
                          0;
                  
                  
                      if (
                          currentIngredients.length
                      ) {
                  
                          currentIngredients.forEach(
                              item => {
                  
                                  addIngredientRow();
                  
                  
                                  const rows =
                                      ingredientContainer
                                          .querySelectorAll(
                                              ".recipe-ingredient-row"
                                          );
                  
                  
                                  const row =
                                      rows[
                                          rows.length - 1
                                      ];
                  
                  
                                  if (
                                      !row
                                  ) {
                  
                                      return;
                  
                                  }
                  
                  
                                  const ingredientSelect =
                                      row.querySelector(
                                          ".recipe-ingredient-select"
                                      );
                  
                  
                                  const quantityInput =
                                      row.querySelector(
                                          ".recipe-ingredient-qty"
                                      );
                  
                  
                                  const unitSelect =
                                      row.querySelector(
                                          ".recipe-ingredient-unit"
                                      );
                  
                  
                                  if (
                                      ingredientSelect
                                  ) {
                  
                                      ingredientSelect.value =
                                          item.ingredient_id ||
                                          "";
                  
                                  }
                  
                  
                                  if (
                                      quantityInput
                                  ) {
                  
                                      quantityInput.value =
                                          item.quantity ??
                                          "";
                  
                                  }
                  
                  
                                  if (
                                      unitSelect
                                  ) {
                  
                                      unitSelect.value =
                                          item.unit_id ||
                                          "";
                  
                                  }
                  
                              }
                          );
                  
                      }
                      else {
                  
                          addIngredientRow();
                  
                      }
                  
                  }

                    /*
                    -------------------------------------------------
                    FORMULA LOCK
                    -------------------------------------------------

                    H3 Edit Recipe hanya mengubah
                    master recipe.

                    Formula version tetap aman.
                    -------------------------------------------------
                    */

                    setEditFormulaReadonly(
                        true
                    );


                    const form =
                        document.getElementById(
                            "createRecipeForm"
                        );


                    if (
                        form &&
                        typeof form.scrollTo ===
                            "function"
                    ) {

                        form.scrollTo(
                            {
                                top: 0,
                                behavior: "instant"
                            }
                        );

                    }


                    name?.focus();

                }
                catch (
                    error
                ) {

                    console.error(
                        "OPEN EDIT RECIPE ERROR:",
                        error
                    );


                    showFormError(
                        error?.message ||
                        "Gagal memuat recipe."
                    );

                }

            }
        );

    }


    /* =====================================================
       H3 — FORMULA PROTECTION
    ===================================================== */

    function setEditFormulaReadonly(
        isEdit
    ) {

        /*
        -----------------------------------------------------
        INGREDIENTS
        -----------------------------------------------------
        */

        const ingredientContainer =
            document.getElementById(
                "recipeIngredients"
            );


        if (
            ingredientContainer
        ) {

            ingredientContainer
                .querySelectorAll(
                    "select, input, button"
                )
                .forEach(
                    element => {

                        element.disabled =
                            isEdit;

                    }
                );

        }


        const addIngredient =
            document.getElementById(
                "addIngredientButton"
            );


        if (
            addIngredient
        ) {

            addIngredient.disabled =
                isEdit;

        }


        /*
        -----------------------------------------------------
        VERSION PARAMETERS
        -----------------------------------------------------
        */

        const yieldInput =
            document.getElementById(
                "recipeYield"
            );


        const yieldUnit =
            document.getElementById(
                "recipeYieldUnit"
            );


        const fermentation =
            document.getElementById(
                "fermentationRequired"
            );


        const f1 =
            document.getElementById(
                "f1TargetDays"
            );


        const f2 =
            document.getElementById(
                "f2TargetDays"
            );


        const shelfLife =
            document.getElementById(
                "recipeShelfLife"
            );


        const notes =
            document.getElementById(
                "recipeNotes"
            );


        [
            yieldInput,
            yieldUnit,
            fermentation,
            f1,
            f2,
            shelfLife,
            notes
        ]
            .filter(
                Boolean
            )
            .forEach(
                element => {

                    element.disabled =
                        isEdit;

                }
            );

    }


    /* =====================================================
       H2 — CLOSE CREATE / EDIT MODAL
    ===================================================== */

    function closeRecipeModal() {

        const modal =
            document.getElementById(
                "recipeModal"
            );


        if (
            !modal
        ) {

            return;

        }


        modal.setAttribute(
            "hidden",
            ""
        );


        document.body.classList.remove(
            "recipe-modal-open"
        );


        editingRecipeId =
            null;


        setRecipeModalMode(
            "create"
        );


        setEditFormulaReadonly(
            false
        );

    }


    /* =====================================================
       H2 — FORM ERROR
    ===================================================== */

    function showFormError(
        message
    ) {

        const box =
            document.getElementById(
                "recipeFormError"
            );


        if (
            !box
        ) {

            return;

        }


        const text =
            box.querySelector(
                "span"
            );


        if (
            text
        ) {

            text.textContent =
                message;

        }


        box.removeAttribute(
            "hidden"
        );


        refreshIcons();

    }


    function clearFormError() {

        document
            .getElementById(
                "recipeFormError"
            )
            ?.setAttribute(
                "hidden",
                ""
            );

    }


    /* =====================================================
       H2 — FERMENTATION TOGGLE
    ===================================================== */

    function updateFermentationVisibility() {

        const checkbox =
            document.getElementById(
                "fermentationRequired"
            );


        const fields =
            document.getElementById(
                "fermentationFields"
            );


        if (
            checkbox?.checked
        ) {

            fields?.removeAttribute(
                "hidden"
            );

        }
        else {

            fields?.setAttribute(
                "hidden",
                ""
            );

        }

    }


    /* =====================================================
       H2 / H3 — SAVE RECIPE
    ===================================================== */

    async function saveRecipe() {

        const isEdit =
            Boolean(
                editingRecipeId
            );


        clearFormError();


        const button =
            document.getElementById(
                "saveRecipeButton"
            );


        const buttonText =
            button?.querySelector(
                "span"
            );


        const originalText =
            isEdit
                ? "Simpan Perubahan"
                : "Simpan Recipe";


        /*
        -----------------------------------------------------
        READ MASTER FIELDS
        -----------------------------------------------------
        */

        const name =
            document.getElementById(
                "recipeName"
            )?.value
            ?.trim() ||
            "";


        const code =
            document.getElementById(
                "recipeCode"
            )?.value
            ?.trim()
            .toUpperCase() ||
            "";


        const productId =
            document.getElementById(
                "recipeProduct"
            )?.value ||
            "";


        const recipeType =
            document.getElementById(
                "recipeType"
            )?.value ||
            "";


        const description =
            document.getElementById(
                "recipeDescription"
            )?.value
            ?.trim() ||
            "";


        /*
        -----------------------------------------------------
        BASIC VALIDATION
        -----------------------------------------------------
        */

        if (
            !name
        ) {

            showFormError(
                "Nama recipe wajib diisi."
            );

            return;

        }


        if (
            !code
        ) {

            showFormError(
                "Recipe code wajib diisi."
            );

            return;

        }


        if (
            !productId
        ) {

            showFormError(
                "Product wajib dipilih."
            );

            return;

        }


        /*
        =====================================================
        H3 EDIT MODE
        =====================================================
        */

        if (
            isEdit
        ) {

            if (
                button
            ) {

                button.disabled =
                    true;

                button.classList.add(
                    "is-loading"
                );

            }


            if (
                buttonText
            ) {

                buttonText.textContent =
                    "Menyimpan...";

            }


            waitForSupabase(
                async supabase => {

                    try {

                        /*
                        -------------------------------------------------
                        UPDATE MASTER RECIPE ONLY
                        -------------------------------------------------
                        */

                        const {
                            error
                        } = await supabase

                            .from(
                                "recipes"
                            )

                            .update({

                                code,

                                name,

                                product_id:
                                    productId,

                                description:
                                    description ||
                                    null,

                                recipe_type:
                                    recipeType

                            })

                            .eq(
                                "id",
                                editingRecipeId
                            );


                        if (
                            error
                        ) {

                            throw error;

                        }


                        /*
                        -------------------------------------------------
                        IMPORTANT
                        -------------------------------------------------

                        TIDAK UPDATE:

                        recipe_versions
                        recipe_ingredients

                        Formula lama tetap aman.
                        -------------------------------------------------
                        */


                        closeRecipeModal();


                        await loadRecipes();


                        showSuccessMessage(
                            "Recipe berhasil diperbarui."
                        );

                    }
                    catch (
                        error
                    ) {

                        console.error(
                            "UPDATE RECIPE ERROR:",
                            error
                        );


                        showFormError(
                            error?.message ||
                            "Recipe gagal diperbarui."
                        );

                    }
                    finally {

                        if (
                            button
                        ) {

                            button.disabled =
                                false;

                            button.classList.remove(
                                "is-loading"
                            );

                        }


                        if (
                            buttonText
                        ) {

                            buttonText.textContent =
                                originalText;

                        }

                    }

                }
            );


            return;

        }


        /*
        =====================================================
        H2 CREATE MODE
        =====================================================

        Formula fields hanya divalidasi
        saat membuat Recipe baru.
        =====================================================
        */

        const yieldQuantity =
            Number(
                document.getElementById(
                    "recipeYield"
                )?.value
            );


        const yieldUnitId =
            document.getElementById(
                "recipeYieldUnit"
            )?.value ||
            "";


        const fermentationRequired =
            Boolean(
                document.getElementById(
                    "fermentationRequired"
                )?.checked
            );


        const f1Target =
            fermentationRequired
                ? Number(
                    document.getElementById(
                        "f1TargetDays"
                    )?.value
                )
                : 0;


        const f2Target =
            fermentationRequired
                ? Number(
                    document.getElementById(
                        "f2TargetDays"
                    )?.value
                )
                : 0;


        const shelfLife =
            Number(
                document.getElementById(
                    "recipeShelfLife"
                )?.value
            );


        const notes =
            document.getElementById(
                "recipeNotes"
            )?.value
            ?.trim() ||
            "";


        if (
            !yieldQuantity ||
            yieldQuantity <= 0
        ) {

            showFormError(
                "Yield harus lebih besar dari 0."
            );

            return;

        }


        if (
            !yieldUnitId
        ) {

            showFormError(
                "Unit yield wajib dipilih."
            );

            return;

        }


        if (
            fermentationRequired &&
            (
                f1Target < 0 ||
                f2Target < 0
            )
        ) {

            showFormError(
                "Target fermentasi tidak valid."
            );

            return;

        }


        const rows =
            [
                ...document.querySelectorAll(
                    ".recipe-ingredient-row"
                )
            ];


        if (
            !rows.length
        ) {

            showFormError(
                "Tambahkan minimal satu ingredient."
            );

            return;

        }


        const ingredientPayload =
            [];


        for (
            let index = 0;
            index < rows.length;
            index++
        ) {

            const row =
                rows[index];


            const ingredientId =
                row.querySelector(
                    ".recipe-ingredient-select"
                )?.value ||
                "";


            const quantity =
                Number(
                    row.querySelector(
                        ".recipe-ingredient-qty"
                    )?.value
                );


            const unitId =
                row.querySelector(
                    ".recipe-ingredient-unit"
                )?.value ||
                "";


            if (
                !ingredientId
            ) {

                showFormError(
                    `Ingredient nomor ${
                        index + 1
                    } belum dipilih.`
                );

                return;

            }


            if (
                !quantity ||
                quantity <= 0
            ) {

                showFormError(
                    `Quantity ingredient nomor ${
                        index + 1
                    } tidak valid.`
                );

                return;

            }


            if (
                !unitId
            ) {

                showFormError(
                    `Unit ingredient nomor ${
                        index + 1
                    } belum dipilih.`
                );

                return;

            }


            ingredientPayload.push({

                ingredient_id:
                    ingredientId,

                quantity,

                unit_id:
                    unitId

            });

        }


        /*
        -----------------------------------------------------
        BUTTON LOADING
        -----------------------------------------------------
        */

        if (
            button
        ) {

            button.disabled =
                true;

            button.classList.add(
                "is-loading"
            );

        }


        if (
            buttonText
        ) {

            buttonText.textContent =
                "Menyimpan...";

        }


        waitForSupabase(
            async supabase => {

                let createdRecipeId =
                    null;


                try {

                    /*
                    =========================================
                    STEP 1
                    CREATE RECIPE
                    =========================================
                    */

                    const {
                        data: recipe,
                        error: recipeError
                    } = await supabase

                        .from(
                            "recipes"
                        )

                        .insert({

                            code,

                            name,

                            product_id:
                                productId,

                            description:
                                description ||
                                null,

                            recipe_type:
                                recipeType,

                            status:
                                "active",

                            current_version_number:
                                1

                        })

                        .select(
                            "id"
                        )

                        .single();


                    if (
                        recipeError
                    ) {

                        throw recipeError;

                    }


                    createdRecipeId =
                        recipe.id;


                    /*
                    =========================================
                    STEP 2
                    CREATE VERSION 1
                    =========================================
                    */

                    const {
                        data: version,
                        error: versionError
                    } = await supabase

                        .from(
                            "recipe_versions"
                        )

                        .insert({

                            recipe_id:
                                createdRecipeId,

                            version_number:
                                1,

                            yield_quantity:
                                yieldQuantity,

                            yield_unit_id:
                                yieldUnitId,

                            fermentation_required:
                                fermentationRequired,

                            f1_target_days:
                                fermentationRequired
                                    ? f1Target
                                    : 0,

                            f2_target_days:
                                fermentationRequired
                                    ? f2Target
                                    : 0,

                            shelf_life_days:
                                shelfLife ||
                                0,

                            notes:
                                notes ||
                                null,

                            status:
                                "active",

                            effective_from:
                                new Date()
                                    .toISOString()

                        })

                        .select(
                            "id"
                        )

                        .single();


                    if (
                        versionError
                    ) {

                        throw versionError;

                    }


                    /*
                    =========================================
                    STEP 3
                    CREATE INGREDIENTS
                    =========================================
                    */

                    const ingredientRows =
                        ingredientPayload.map(
                            item => ({

                                recipe_version_id:
                                    version.id,

                                ingredient_id:
                                    item.ingredient_id,

                                quantity:
                                    item.quantity,

                                unit_id:
                                    item.unit_id

                            })
                        );


                    const {
                        error:
                            ingredientError
                    } = await supabase

                        .from(
                            "recipe_ingredients"
                        )

                        .insert(
                            ingredientRows
                        );


                    if (
                        ingredientError
                    ) {

                        throw ingredientError;

                    }


                    /*
                    =========================================
                    SUCCESS
                    =========================================
                    */

                    closeRecipeModal();


                    await loadRecipes();


                    showSuccessMessage(
                        "Recipe berhasil dibuat."
                    );

                }
                catch (
                    error
                ) {

                    console.error(
                        "CREATE RECIPE ERROR:",
                        error
                    );


                    /*
                    -------------------------------------------------
                    BEST EFFORT ROLLBACK
                    -------------------------------------------------
                    */

                    if (
                        createdRecipeId
                    ) {

                        try {

                            await supabase

                                .from(
                                    "recipes"
                                )

                                .delete()

                                .eq(
                                    "id",
                                    createdRecipeId
                                );

                        }
                        catch (
                            rollbackError
                        ) {

                            console.error(
                                "Rollback error:",
                                rollbackError
                            );

                        }

                    }


                    showFormError(
                        error?.message ||
                        "Recipe gagal disimpan."
                    );

                }
                finally {

                    if (
                        button
                    ) {

                        button.disabled =
                            false;

                        button.classList.remove(
                            "is-loading"
                        );

                    }


                    if (
                        buttonText
                    ) {

                        buttonText.textContent =
                            originalText;

                    }

                }

            }
        );

    }


    /* =====================================================
       H2 — SUCCESS TOAST
    ===================================================== */

    function showSuccessMessage(
        message
    ) {

        let toast =
            document.getElementById(
                "recipeSuccessToast"
            );


        if (
            !toast
        ) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "recipeSuccessToast";


            toast.className =
                "recipe-success-toast";


            document.body.appendChild(
                toast
            );

        }


        toast.innerHTML = `

            <i
                data-lucide="circle-check"
            ></i>

            <span>
                ${escapeHtml(
                    message
                )}
            </span>

        `;


        toast.classList.add(
            "show"
        );


        refreshIcons();


        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

    }


    /* =====================================================
       H3 — RECIPE DETAIL
    ===================================================== */

    async function openRecipeDetail(
        id
    ) {

        activeDetailRecipeId =
            id;


        const modal =
            document.getElementById(
                "recipeDetailModal"
            );


        if (
            !modal
        ) {

            console.error(
                "recipeDetailModal tidak ditemukan."
            );

            return;

        }


        modal.removeAttribute(
            "hidden"
        );


        document.body.classList.add(
            "recipe-modal-open"
        );


        const loading =
            document.getElementById(
                "recipeDetailLoading"
            );


        const content =
            document.getElementById(
                "recipeDetailContent"
            );


        const error =
            document.getElementById(
                "recipeDetailError"
            );


        loading?.removeAttribute(
            "hidden"
        );


        content?.setAttribute(
            "hidden",
            ""
        );


        error?.setAttribute(
            "hidden",
            ""
        );


        waitForSupabase(
            async supabase => {

                try {

                    /*
                    =========================================
                    1. LOAD RECIPE
                    =========================================
                    */

                    const {
                        data: recipe,
                        error: recipeError
                    } = await supabase

                        .from(
                            "recipes"
                        )

                        .select(`
                            id,
                            code,
                            name,
                            description,
                            recipe_type,
                            status,
                            product_id,
                            current_version_number
                        `)

                        .eq(
                            "id",
                            id
                        )

                        .single();


                    if (
                        recipeError
                    ) {

                        throw recipeError;

                    }


                    /*
                    =========================================
                    2. LOAD PRODUCT
                    =========================================
                    */

                    let product =
                        null;


                    if (
                        recipe.product_id
                    ) {

                        const {
                            data,
                            error
                        } = await supabase

                            .from(
                                "products"
                            )

                            .select(`
                                id,
                                code,
                                name
                            `)

                            .eq(
                                "id",
                                recipe.product_id
                            )

                            .maybeSingle();


                        if (
                            error
                        ) {

                            throw error;

                        }


                        product =
                            data;

                    }


                    /*
                    =========================================
                    3. LOAD VERSION
                    =========================================
                    */

                  const {
                      data: versions,
                      error: versionError
                  } = await supabase
                  
                      .from(
                          "recipe_versions"
                      )
                  
                      .select(`
                          id,
                          recipe_id,
                          version_number,
                          yield_quantity,
                          yield_unit_id,
                          fermentation_required,
                          f1_target_days,
                          f2_target_days,
                          shelf_life_days,
                          notes,
                          status,
                          effective_from
                      `)

                        .eq(
                            "recipe_id",
                            id
                        )

                        .order(
                            "version_number",
                            {
                                ascending:
                                    false
                            }
                        );


                    if (
                        versionError
                    ) {

                        throw versionError;

                    }


               /*
               =========================================================
               CURRENT VERSION
               ---------------------------------------------------------
               Prioritas:
               
               1. recipes.current_version_number
               2. fallback ke version terbesar
               =========================================================
               */
               
               let version =
                   null;
               
               
               const currentVersionNumber =
                   Number(
                       recipe?.current_version_number
                   );
               
               
               /*
               ---------------------------------------------------------
               1. CURRENT VERSION NUMBER
               ---------------------------------------------------------
               */
               
               if (
                   Number.isFinite(
                       currentVersionNumber
                   ) &&
                   currentVersionNumber > 0
               ) {
               
                   version =
                       (
                           versions || []
                       ).find(
                           item =>
                               Number(
                                   item.version_number
                               ) ===
                               currentVersionNumber
                       ) ||
                       null;
               
               }
               
               
               /*
               ---------------------------------------------------------
               2. FALLBACK
               ---------------------------------------------------------
               */
               
               if (
                   !version &&
                   Array.isArray(
                       versions
                   ) &&
                   versions.length
               ) {
               
                   version =
                       [
                           ...versions
                       ]
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


                    /*
                    =========================================
                    4. LOAD YIELD UNIT
                    =========================================
                    */

                    let yieldUnit =
                        null;


                    if (
                        version?.yield_unit_id
                    ) {

                        const {
                            data,
                            error
                        } = await supabase

                            .from(
                                "units"
                            )

                            .select(`
                                id,
                                code,
                                name
                            `)

                            .eq(
                                "id",
                                version.yield_unit_id
                            )

                            .maybeSingle();


                        if (
                            error
                        ) {

                            throw error;

                        }


                        yieldUnit =
                            data;

                    }


                    /*
                    =========================================
                    5. LOAD INGREDIENT ROWS
                    =========================================
                    */

                    let recipeIngredients =
                        [];


                    if (
                        version?.id
                    ) {

                        const {
                            data,
                            error
                        } = await supabase

                            .from(
                                "recipe_ingredients"
                            )

                            .select(`
                                id,
                                ingredient_id,
                                quantity,
                                unit_id
                            `)

                            .eq(
                                "recipe_version_id",
                                version.id
                            );


                        if (
                            error
                        ) {

                            throw error;

                        }


                        recipeIngredients =
                            data ||
                            [];

                    }


                    /*
                    =========================================
                    6. LOAD INGREDIENT + UNIT MASTER
                    =========================================
                    */

                    if (
                        recipeIngredients.length
                    ) {

                        const ingredientIds =
                            [
                                ...new Set(
                                    recipeIngredients
                                        .map(
                                            item =>
                                                item.ingredient_id
                                        )
                                        .filter(
                                            Boolean
                                        )
                                )
                            ];


                        const unitIds =
                            [
                                ...new Set(
                                    recipeIngredients
                                        .map(
                                            item =>
                                                item.unit_id
                                        )
                                        .filter(
                                            Boolean
                                        )
                                )
                            ];


                        const ingredientMap =
                            new Map();


                        const unitMap =
                            new Map();


                        if (
                            ingredientIds.length
                        ) {

                            const {
                                data,
                                error
                            } = await supabase

                                .from(
                                    "ingredients"
                                )

                                .select(`
                                    id,
                                    code,
                                    name
                                `)

                                .in(
                                    "id",
                                    ingredientIds
                                );


                            if (
                                error
                            ) {

                                throw error;

                            }


                            (
                                data ||
                                []
                            )
                                .forEach(
                                    item => {

                                        ingredientMap.set(
                                            String(
                                                item.id
                                            ),
                                            item
                                        );

                                    }
                                );

                        }


                        if (
                            unitIds.length
                        ) {

                            const {
                                data,
                                error
                            } = await supabase

                                .from(
                                    "units"
                                )

                                .select(`
                                    id,
                                    code,
                                    name
                                `)

                                .in(
                                    "id",
                                    unitIds
                                );


                            if (
                                error
                            ) {

                                throw error;

                            }


                            (
                                data ||
                                []
                            )
                                .forEach(
                                    item => {

                                        unitMap.set(
                                            String(
                                                item.id
                                            ),
                                            item
                                        );

                                    }
                                );

                        }


                        recipeIngredients =
                            recipeIngredients.map(
                                item => ({

                                    ...item,

                                    ingredient:
                                        ingredientMap.get(
                                            String(
                                                item.ingredient_id
                                            )
                                        ) ||
                                        null,

                                    unit:
                                        unitMap.get(
                                            String(
                                                item.unit_id
                                            )
                                        ) ||
                                        null

                                })
                            );

                    }


                    /*
                    =========================================
                    7. RENDER DETAIL
                    =========================================
                    */
                     
                     renderRecipeDetail({
                     
                         recipe,
                     
                         product,
                     
                         version,
                     
                         yieldUnit,
                     
                         versions:
                             versions || [],
                     
                         ingredients:
                             recipeIngredients
                     
                     });

                    loading?.setAttribute(
                        "hidden",
                        ""
                    );


                    content?.removeAttribute(
                        "hidden"
                    );


                    refreshIcons();

                }
                catch (
                    error
                ) {

                    console.error(
                        "RECIPE DETAIL ERROR:",
                        error
                    );


                    loading?.setAttribute(
                        "hidden",
                        ""
                    );


                    showRecipeDetailError(
                        error?.message ||
                        "Gagal memuat detail recipe."
                    );

                }

            }
        );

    }


    /* =====================================================
       H3 — RENDER DETAIL
    ===================================================== */

    function renderRecipeDetail(
        data
    ) {

         const {
             recipe,
             product,
             version,
             yieldUnit,
             versions:
                 recipeVersions,
             ingredients:
                 recipeIngredients
         } = data;

       /* =====================================================
            H3 — VERSION HISTORY
         ===================================================== */
         
         function renderRecipeVersionHistory(
             versions,
             currentVersion
         ) {
         
             const container =
                 document.getElementById(
                     "recipeVersionHistory"
                 );
         
         
             if (
                 !container
             ) {
         
                 return;
         
             }
         
         
             const list =
                 Array.isArray(
                     versions
                 )
                     ? [
                         ...versions
                     ]
                         .sort(
                             (
                                 a,
                                 b
                             ) =>
                                 Number(
                                     b.version_number || 0
                                 ) -
                                 Number(
                                     a.version_number || 0
                                 )
                         )
                     : [];
         
         
             if (
                 !list.length
             ) {
         
                 container.innerHTML = `
         
                     <div
                         class="recipe-version-history-empty"
                     >
         
                         <i
                             data-lucide="git-branch"
                         ></i>
         
                         <span>
                             Belum ada Version History.
                         </span>
         
                     </div>
         
                 `;
         
                 refreshIcons();
         
                 return;
         
             }
         
         
             container.innerHTML =
                 list
                     .map(
                         version => {
         
                             const isCurrent =
                                 currentVersion &&
                                 String(
                                     currentVersion.id
                                 ) ===
                                 String(
                                     version.id
                                 );
         
         
                             const fermentation =
                                 version.fermentation_required
                                     ? `F1 ${formatNumber(
                                         version.f1_target_days
                                     )} hari · F2 ${formatNumber(
                                         version.f2_target_days
                                     )} hari`
                                     : "Tidak ada fermentasi";
         
         
                             const effectiveDate =
                                 version.effective_from
                                     ? new Intl.DateTimeFormat(
                                         "id-ID",
                                         {
                                             day:
                                                 "2-digit",
                                             month:
                                                 "short",
                                             year:
                                                 "numeric"
                                         }
                                     ).format(
                                         new Date(
                                             version.effective_from
                                         )
                                     )
                                     : "Tanggal tidak tersedia";
         
         
                             return `
         
                                 <article
                                     class="
                                         recipe-version-history-item
                                         ${
                                             isCurrent
                                                 ? "is-current"
                                                 : ""
                                         }
                                     "
                                 >
         
                                     <div
                                         class="
                                             recipe-version-history-icon
                                         "
                                     >
         
                                         <i
                                             data-lucide="${
                                                 isCurrent
                                                     ? "check-circle-2"
                                                     : "git-branch"
                                             }"
                                         ></i>
         
                                     </div>
         
         
                                     <div
                                         class="
                                             recipe-version-history-content
                                         "
                                     >
         
                                         <div
                                             class="
                                                 recipe-version-history-top
                                             "
                                         >
         
                                             <div>
         
                                                 <strong>
                                                     v${escapeHtml(
                                                         version.version_number
                                                     )}
                                                 </strong>
         
                                                 ${
                                                     isCurrent
                                                         ? `
                                                             <span
                                                                 class="
                                                                     recipe-version-current-badge
                                                                 "
                                                             >
                                                                 Current
                                                             </span>
                                                           `
                                                         : ""
                                                 }
         
                                             </div>
         
         
                                             <span
                                                 class="
                                                     recipe-version-history-date
                                                 "
                                             >
                                                 ${escapeHtml(
                                                     effectiveDate
                                                 )}
                                             </span>
         
                                         </div>
         
         
                                         <div
                                             class="
                                                 recipe-version-history-meta
                                             "
                                         >
         
                                             <span>
         
                                                 <i
                                                     data-lucide="flask-conical"
                                                 ></i>
         
                                                 Yield
                                                 ${formatNumber(
                                                     version.yield_quantity
                                                 )}
         
                                             </span>
         
         
                                             <span>
         
                                                 <i
                                                     data-lucide="timer"
                                                 ></i>
         
                                                 ${escapeHtml(
                                                     fermentation
                                                 )}
         
                                             </span>
         
         
                                             <span>
         
                                                 <i
                                                     data-lucide="clock-3"
                                                 ></i>
         
                                                 Shelf Life
                                                 ${formatNumber(
                                                     version.shelf_life_days
                                                 )}
                                                 hari
         
                                             </span>
         
                                         </div>
         
         
                                         ${
                                             version.notes
                                                 ? `
                                                     <p
                                                         class="
                                                             recipe-version-history-notes
                                                         "
                                                     >
                                                         ${escapeHtml(
                                                             version.notes
                                                         )}
                                                     </p>
                                                   `
                                                 : ""
                                         }

                                         <div
                                             class="recipe-version-history-actions"
                                         >

                                             <button
                                                 type="button"
                                                 class="page-btn danger recipe-version-delete-button"
                                                 data-delete-recipe-version="${escapeHtml(version.id)}"
                                                 data-version-number="${escapeHtml(version.version_number)}"
                                                 ${isCurrent ? "disabled" : ""}
                                             >

                                                 <i data-lucide="trash-2"></i>

                                                 ${isCurrent ? "Current" : "Hapus Version"}

                                             </button>

                                         </div>
         
                                     </div>
         
                                 </article>
         
                             `;
         
                         }
                     )
                     .join("");
         
         
             refreshIcons();
         
         }


        /*
        -----------------------------------------------------
        HEADER
        -----------------------------------------------------
        */

        setText(
            "recipeDetailTitle",
            recipe.name ||
            "Recipe"
        );


        setText(
            "recipeDetailSubtitle",
            recipe.code ||
            "Master formula"
        );


        /*
        -----------------------------------------------------
        IDENTITY
        -----------------------------------------------------
        */

        setText(
            "detailRecipeName",
            recipe.name ||
            "—"
        );


        setText(
            "detailRecipeCode",
            recipe.code ||
            "—"
        );


        setText(
            "detailRecipeProduct",
            product?.name ||
            "—"
        );


        setText(
            "detailRecipeType",
            recipe.recipe_type ||
            "—"
        );


        setText(
            "detailRecipeVersion",
            version
                ? `v${version.version_number}`
                : "Belum ada"
        );


        /*
        -----------------------------------------------------
        STATUS
        -----------------------------------------------------
        */

        const status =
            String(
                recipe.status ||
                "active"
            ).toLowerCase();


        const statusElement =
            document.getElementById(
                "detailRecipeStatus"
            );


        if (
            statusElement
        ) {

            statusElement.textContent =
                status ===
                "archived"
                    ? "Archived"
                    : "Active";


            statusElement.className =
                `recipe-status ${status}`;

        }


        /*
        -----------------------------------------------------
        DESCRIPTION
        -----------------------------------------------------
        */

        const descriptionBox =
            document.getElementById(
                "detailRecipeDescriptionBox"
            );


        const description =
            recipe.description ||
            "";


        if (
            description
        ) {

            descriptionBox?.removeAttribute(
                "hidden"
            );


            setText(
                "detailRecipeDescription",
                description
            );

        }
        else {

            descriptionBox?.setAttribute(
                "hidden",
                ""
            );

        }


        /*
        -----------------------------------------------------
        VERSION
        -----------------------------------------------------
        */

        setText(
            "detailVersionNumber",
            version
                ? `v${version.version_number}`
                : "—"
        );


        setText(
            "detailVersionYield",
            version
                ? `${formatNumber(
                    version.yield_quantity
                )} ${
                    yieldUnit?.code ||
                    yieldUnit?.name ||
                    ""
                }`
                : "—"
        );


        setText(
            "detailVersionFermentation",
            version
                ? (
                    version.fermentation_required
                        ? "Required"
                        : "Tidak"
                )
                : "—"
        );


        setText(
            "detailVersionShelfLife",
            version
                ? `${formatNumber(
                    version.shelf_life_days
                )} hari`
                : "—"
        );


        /*
        -----------------------------------------------------
        F1 / F2
        -----------------------------------------------------
        */

        setText(
            "detailF1",
            version &&
            version.fermentation_required
                ? `${formatNumber(
                    version.f1_target_days
                )} hari`
                : "—"
        );


        setText(
            "detailF2",
            version &&
            version.fermentation_required
                ? `${formatNumber(
                    version.f2_target_days
                )} hari`
                : "—"
        );


        /*
        -----------------------------------------------------
        INGREDIENTS
        -----------------------------------------------------
        */

        renderRecipeDetailIngredients(
            recipeIngredients
        );

       /* 
-----------------------------------------------------
VERSION HISTORY
-----------------------------------------------------
*/

renderRecipeVersionHistory(
    recipeVersions,
    version
);
    }


    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (
            element
        ) {

            element.textContent =
                value ??
                "—";

        }

    }


    /* =====================================================
       H3 — RENDER DETAIL INGREDIENTS
    ===================================================== */

    function renderRecipeDetailIngredients(
        recipeIngredients
    ) {

        const container =
            document.getElementById(
                "recipeDetailIngredients"
            );


        if (
            !container
        ) {

            return;

        }


        if (
            !Array.isArray(
                recipeIngredients
            ) ||
            !recipeIngredients.length
        ) {

            container.innerHTML = `

                <div
                    class="recipe-ingredient-empty"
                >

                    <i
                        data-lucide="package-open"
                    ></i>

                    <span>
                        Belum ada ingredient
                        pada version ini.
                    </span>

                </div>

            `;


            refreshIcons();


            return;

        }


        container.innerHTML =
            recipeIngredients
                .map(
                    (
                        item,
                        index
                    ) => {

                        const ingredient =
                            item.ingredient;


                        const unit =
                            item.unit;


                        const ingredientName =
                            ingredient?.name ||
                            "Ingredient";


                        const ingredientCode =
                            ingredient?.code ||
                            "";


                        const unitLabel =
                            unit?.code ||
                            unit?.name ||
                            "";


                        return `

                            <div
                                class="
                                    recipe-detail-ingredient
                                "
                            >

                                <div
                                    class="
                                        recipe-detail-ingredient-number
                                    "
                                >

                                    ${
                                        index + 1
                                    }

                                </div>


                                <div
                                    class="
                                        recipe-detail-ingredient-name
                                    "
                                >

                                    <strong>

                                        ${escapeHtml(
                                            ingredientName
                                        )}

                                    </strong>


                                    ${
                                        ingredientCode
                                            ? `
                                                <span>

                                                    ${escapeHtml(
                                                        ingredientCode
                                                    )}

                                                </span>
                                              `
                                            : ""
                                    }

                                </div>


                                <div
                                    class="
                                        recipe-detail-ingredient-qty
                                    "
                                >

                                    ${formatNumber(
                                        item.quantity
                                    )}

                                    ${
                                        unitLabel
                                            ? ` ${escapeHtml(
                                                unitLabel
                                            )}`
                                            : ""
                                    }

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        refreshIcons();

    }


    /* =====================================================
       H3 — DETAIL ERROR
    ===================================================== */

    function showRecipeDetailError(
        message
    ) {

        const error =
            document.getElementById(
                "recipeDetailError"
            );


        if (
            !error
        ) {

            return;

        }


        const text =
            error.querySelector(
                "span"
            );


        if (
            text
        ) {

            text.textContent =
                message;

        }


        error.removeAttribute(
            "hidden"
        );


        refreshIcons();

    }


    /* =====================================================
       H3 — CLOSE DETAIL
    ===================================================== */

    function closeRecipeDetail() {

        document
            .getElementById(
                "recipeDetailModal"
            )
            ?.setAttribute(
                "hidden",
                ""
            );


        document.body.classList.remove(
            "recipe-modal-open"
        );


        activeDetailRecipeId =
            null;

    }


    /* =====================================================
       H3 — EDIT FROM DETAIL
    ===================================================== */

    function handleEditRecipe() {

        if (
            !activeDetailRecipeId
        ) {

            return;

        }


        openEditRecipe(
            activeDetailRecipeId
        );

    }


/* =====================================================
   H4 — RECIPE VERSION
   -----------------------------------------------------
   BUSINESS RULE

   Recipe = MASTER FORMULA

   Recipe Version = SNAPSHOT / FORMULA REVISION

   H4 TIDAK membuat Production.

   H4 hanya:
   - membaca recipe master
   - membaca version terakhir
   - membaca seluruh master ingredient
   - membaca seluruh master unit
   - copy ingredient dari version sebelumnya
   - memungkinkan formula version baru diedit
   - menyimpan version baru
   - update current_version_number

   Version lama TIDAK diubah.
===================================================== */


/* =====================================================
   H4 — STATE
===================================================== */

let activeVersionRecipe = null;

let activeVersionSource = null;

let versionIngredientRows = 0;


/* =====================================================
   H4 — MASTER DATA
   -----------------------------------------------------
   IMPORTANT

   H4 membutuhkan:
   1. seluruh Ingredients
   2. seluruh Units

   Jangan menggunakan data ingredient dari version lama
   sebagai sumber dropdown karena itu hanya berisi
   ingredient yang dipakai pada version tersebut.
===================================================== */

async function loadRecipeVersionMasterData() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            waitForSupabase(
                async supabase => {

                    try {

                        /*
                        =========================================
                        LOAD INGREDIENTS
                        =========================================
                        */

                        const {
                            data: ingredientData,
                            error: ingredientError
                        } = await supabase

                            .from(
                                "ingredients"
                            )

                            .select(`
                                id,
                                code,
                                name,
                                default_unit_id,
                                cost_per_unit,
                                is_active
                            `)

                            .order(
                                "name",
                                {
                                    ascending:
                                        true
                                }
                            );


                        if (
                            ingredientError
                        ) {

                            throw ingredientError;

                        }


                        /*
                        =========================================
                        LOAD UNITS
                        =========================================
                        */

                        const {
                            data: unitData,
                            error: unitError
                        } = await supabase

                            .from(
                                "units"
                            )

                            .select(`
                                id,
                                code,
                                name,
                                category
                            `)

                            .order(
                                "name",
                                {
                                    ascending:
                                        true
                                }
                            );


                        if (
                            unitError
                        ) {

                            throw unitError;

                        }


                        /*
                        =========================================
                        STORE GLOBAL MASTER DATA
                        =========================================
                        */

                        ingredients =
                            Array.isArray(
                                ingredientData
                            )
                                ? ingredientData
                                : [];


                        units =
                            Array.isArray(
                                unitData
                            )
                                ? unitData
                                : [];


                        console.log(
                            "MERAMU H4 — Ingredients:",
                            ingredients.length
                        );


                        console.log(
                            "MERAMU H4 — Units:",
                            units.length
                        );


                        resolve(
                            true
                        );

                    }

                    catch (
                        error
                    ) {

                        console.error(
                            "MERAMU H4 MASTER DATA ERROR:",
                            error
                        );


                        reject(
                            error
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   H4 — LOAD RECIPE + CURRENT VERSION
===================================================== */

async function loadRecipeVersionData(
    recipeId
) {

    if (
        !recipeId
    ) {

        throw new Error(
            "Recipe ID tidak ditemukan."
        );

    }


    return new Promise(
        (
            resolve,
            reject
        ) => {

            waitForSupabase(
                async supabase => {

                    try {

                        /*
                        =========================================
                        1. LOAD MASTER RECIPE
                        =========================================
                        */

                        const {
                            data: recipe,
                            error: recipeError
                        } = await supabase

                            .from(
                                "recipes"
                            )

                            .select(`
                                id,
                                code,
                                name,
                                description,
                                recipe_type,
                                status,
                                product_id,
                                current_version_number
                            `)

                            .eq(
                                "id",
                                recipeId
                            )

                            .single();


                        if (
                            recipeError
                        ) {

                            throw recipeError;

                        }


                        /*
                        =========================================
                        2. LOAD ALL VERSIONS
                        =========================================
                        */

                        const {
                            data: versions,
                            error: versionsError
                        } = await supabase

                            .from(
                                "recipe_versions"
                            )

                            .select(`
                                id,
                                recipe_id,
                                version_number,
                                yield_quantity,
                                yield_unit_id,
                                fermentation_required,
                                f1_target_days,
                                f2_target_days,
                                shelf_life_days,
                                notes,
                                status,
                                effective_from
                            `)

                            .eq(
                                "recipe_id",
                                recipeId
                            )

                            .order(
                                "version_number",
                                {
                                    ascending:
                                        false
                                }
                            );


                        if (
                            versionsError
                        ) {

                            throw versionsError;

                        }


                        /*
                        =========================================
                        3. DETERMINE CURRENT VERSION
                        =========================================

                        Prioritas:
                        1. recipes.current_version_number
                        2. version terbesar
                        */

                        let currentVersion =
                            null;


                        const currentVersionNumber =
                            Number(
                                recipe
                                    ?.current_version_number
                            );


                        if (
                            Number.isFinite(
                                currentVersionNumber
                            ) &&
                            currentVersionNumber > 0
                        ) {

                            currentVersion =
                                (
                                    versions || []
                                ).find(
                                    version =>
                                        Number(
                                            version.version_number
                                        ) ===
                                        currentVersionNumber
                                ) ||
                                null;

                        }


                        /*
                        Jika tidak ditemukan,
                        fallback ke version terbesar.
                        */

                        if (
                            !currentVersion &&
                            Array.isArray(
                                versions
                            ) &&
                            versions.length
                        ) {

                            currentVersion =
                                versions[0];

                        }


                        /*
                        =========================================
                        4. LOAD INGREDIENTS
                        =========================================
                        */

                        let recipeIngredients =
                            [];


                        if (
                            currentVersion?.id
                        ) {

                            const {
                                data,
                                error
                            } = await supabase

                                .from(
                                    "recipe_ingredients"
                                )

                                .select(`
                                    id,
                                    recipe_version_id,
                                    ingredient_id,
                                    quantity,
                                    unit_id
                                `)

                                .eq(
                                    "recipe_version_id",
                                    currentVersion.id
                                );


                            if (
                                error
                            ) {

                                throw error;

                            }


                            recipeIngredients =
                                Array.isArray(
                                    data
                                )
                                    ? data
                                    : [];

                        }


                        /*
                        =========================================
                        5. LOAD INGREDIENT DETAIL
                        =========================================
                        */

                        const ingredientIds =
                            [
                                ...new Set(
                                    recipeIngredients
                                        .map(
                                            item =>
                                                item.ingredient_id
                                        )
                                        .filter(
                                            Boolean
                                        )
                                )
                            ];


                        const unitIds =
                            [
                                ...new Set(
                                    recipeIngredients
                                        .map(
                                            item =>
                                                item.unit_id
                                        )
                                        .filter(
                                            Boolean
                                        )
                                )
                            ];


                        let ingredientMap =
                            new Map();


                        let unitMap =
                            new Map();


                        /*
                        =========================================
                        INGREDIENT DETAIL
                        =========================================
                        */

                        if (
                            ingredientIds.length
                        ) {

                            const {
                                data,
                                error
                            } = await supabase

                                .from(
                                    "ingredients"
                                )

                                .select(`
                                    id,
                                    code,
                                    name,
                                    default_unit_id,
                                    cost_per_unit,
                                    is_active
                                `)

                                .in(
                                    "id",
                                    ingredientIds
                                );


                            if (
                                error
                            ) {

                                throw error;

                            }


                            (
                                data || []
                            )
                                .forEach(
                                    item => {

                                        ingredientMap.set(
                                            String(
                                                item.id
                                            ),
                                            item
                                        );

                                    }
                                );

                        }


                        /*
                        =========================================
                        UNIT DETAIL
                        =========================================
                        */

                        if (
                            unitIds.length
                        ) {

                            const {
                                data,
                                error
                            } = await supabase

                                .from(
                                    "units"
                                )

                                .select(`
                                    id,
                                    code,
                                    name,
                                    category
                                `)

                                .in(
                                    "id",
                                    unitIds
                                );


                            if (
                                error
                            ) {

                                throw error;

                            }


                            (
                                data || []
                            )
                                .forEach(
                                    item => {

                                        unitMap.set(
                                            String(
                                                item.id
                                            ),
                                            item
                                        );

                                    }
                                );

                        }


                        /*
                        =========================================
                        ATTACH DETAIL
                        =========================================
                        */

                        recipeIngredients =
                            recipeIngredients.map(
                                item => ({

                                    ...item,

                                    ingredient:
                                        ingredientMap.get(
                                            String(
                                                item.ingredient_id
                                            )
                                        ) ||
                                        null,

                                    unit:
                                        unitMap.get(
                                            String(
                                                item.unit_id
                                            )
                                        ) ||
                                        null

                                })
                            );


                        /*
                        =========================================
                        RETURN
                        =========================================
                        */

                        resolve({

                            recipe,

                            currentVersion,

                            versions:
                                versions || [],

                            ingredients:
                                recipeIngredients

                        });

                    }

                    catch (
                        error
                    ) {

                        console.error(
                            "LOAD RECIPE VERSION ERROR:",
                            error
                        );


                        reject(
                            error
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   H4 — CREATE VERSION MODAL
===================================================== */

function ensureRecipeVersionModal() {

    let modal =
        document.getElementById(
            "recipeVersionModal"
        );


    if (
        modal
    ) {

        return modal;

    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "recipeVersionModal";


    modal.className =
        "recipe-version-modal";


    modal.hidden =
        true;


    modal.innerHTML = `

        <div
            class="recipe-version-backdrop"
            data-version-close
        ></div>


        <div
            class="recipe-version-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipeVersionModalTitle"
        >

            <div
                class="recipe-version-header"
            >

                <div>

                    <span
                        class="recipe-version-eyebrow"
                    >
                        RECIPE VERSION
                    </span>


                    <h2
                        id="recipeVersionModalTitle"
                    >
                        Buat Versi Baru
                    </h2>


                    <p
                        id="recipeVersionModalSubtitle"
                    >
                        Buat revision formula tanpa
                        mengubah version sebelumnya.
                    </p>

                </div>


                <button
                    type="button"
                    class="recipe-version-close"
                    data-version-close
                    aria-label="Tutup"
                >

                    <i
                        data-lucide="x"
                    ></i>

                </button>

            </div>


            <div
                id="recipeVersionError"
                class="recipe-version-error"
                hidden
            >

                <i
                    data-lucide="circle-alert"
                ></i>

                <span></span>

            </div>


            <div
                class="recipe-version-body"
            >

                <!-- MASTER INFO -->

                <div
                    class="recipe-version-master"
                >

                    <div>

                        <span>
                            Recipe
                        </span>

                        <strong
                            id="versionRecipeName"
                        >
                            —
                        </strong>

                    </div>


                    <div>

                        <span>
                            Code
                        </span>

                        <strong
                            id="versionRecipeCode"
                        >
                            —
                        </strong>

                    </div>


                    <div>

                        <span>
                            Previous Version
                        </span>

                        <strong
                            id="versionPreviousNumber"
                        >
                            —
                        </strong>

                    </div>


                    <div>

                        <span>
                            New Version
                        </span>

                        <strong
                            id="versionNewNumber"
                        >
                            —
                        </strong>

                    </div>

                </div>


                <!-- VERSION PARAMETERS -->

                <section
                    class="recipe-version-section"
                >

                    <div
                        class="recipe-version-section-title"
                    >

                        <div>

                            <span>
                                Formula Settings
                            </span>

                            <small>
                                Parameter khusus version ini.
                            </small>

                        </div>

                    </div>


                    <div
                        class="recipe-version-grid"
                    >

                        <div
                            class="recipe-field"
                        >

                            <label>
                                Yield
                            </label>

                            <input
                                id="versionYield"
                                type="number"
                                min="0.000001"
                                step="0.000001"
                            >

                        </div>


                        <div
                            class="recipe-field"
                        >

                            <label>
                                Yield Unit
                            </label>

                            <select
                                id="versionYieldUnit"
                            >

                                <option value="">
                                    Pilih Unit
                                </option>

                            </select>

                        </div>


                        <div
                            class="recipe-field"
                        >

                            <label>
                                Shelf Life
                            </label>

                            <div
                                class="recipe-version-input-suffix"
                            >

                                <input
                                    id="versionShelfLife"
                                    type="number"
                                    min="0"
                                    step="1"
                                >

                                <span>
                                    hari
                                </span>

                            </div>

                        </div>


                        <div
                            class="
                                recipe-field
                                recipe-version-checkbox-field
                            "
                        >

                            <label>
                                Fermentation
                            </label>


                            <label
                                class="recipe-version-check"
                            >

                                <input
                                    id="versionFermentationRequired"
                                    type="checkbox"
                                >

                                <span>
                                    Fermentasi diperlukan
                                </span>

                            </label>

                        </div>

                    </div>


                    <div
                        id="versionFermentationFields"
                        class="recipe-version-grid"
                    >

                        <div
                            class="recipe-field"
                        >

                            <label>
                                F1 Target
                            </label>


                            <div
                                class="
                                    recipe-version-input-suffix
                                "
                            >

                                <input
                                    id="versionF1Target"
                                    type="number"
                                    min="0"
                                    step="1"
                                >

                                <span>
                                    hari
                                </span>

                            </div>

                        </div>


                        <div
                            class="recipe-field"
                        >

                            <label>
                                F2 Target
                            </label>


                            <div
                                class="
                                    recipe-version-input-suffix
                                "
                            >

                                <input
                                    id="versionF2Target"
                                    type="number"
                                    min="0"
                                    step="1"
                                >

                                <span>
                                    hari
                                </span>

                            </div>

                        </div>

                    </div>


                    <div
                        class="recipe-field"
                    >

                        <label>
                            Notes Version
                        </label>


                        <textarea
                            id="versionNotes"
                            rows="3"
                            placeholder="
                                Catatan perubahan formula / proses...
                            "
                        ></textarea>

                    </div>

                </section>


                <!-- INGREDIENTS -->

                <section
                    class="recipe-version-section"
                >

                    <div
                        class="
                            recipe-version-section-header
                        "
                    >

                        <div>

                            <span
                                class="
                                    recipe-version-section-label
                                "
                            >
                                Ingredients
                            </span>


                            <small>
                                Formula disalin dari version
                                sebelumnya. Silakan sesuaikan
                                untuk version baru.
                            </small>

                        </div>


                        <button
                            type="button"
                            id="addVersionIngredientButton"
                            class="recipe-version-add-button"
                        >

                            <i
                                data-lucide="plus"
                            ></i>


                            <span>
                                Tambah Ingredient
                            </span>

                        </button>

                    </div>


                    <div
                        id="versionIngredients"
                        class="recipe-version-ingredients"
                    ></div>


                    <div
                        id="versionIngredientEmpty"
                        class="recipe-version-empty"
                        hidden
                    >

                        <i
                            data-lucide="package-open"
                        ></i>


                        <span>
                            Belum ada ingredient.
                        </span>

                    </div>

                </section>

            </div>


            <div
                class="recipe-version-footer"
            >

                <button
                    type="button"
                    class="recipe-version-cancel"
                    data-version-close
                >
                    Batal
                </button>


                <button
                    type="button"
                    id="saveRecipeVersionButton"
                    class="recipe-version-save"
                >

                    <i
                        data-lucide="git-branch"
                    ></i>


                    <span>
                        Simpan Version
                    </span>

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    bindRecipeVersionModalEvents();


    refreshIcons();


    return modal;

}


/* =====================================================
   H4 — POPULATE YIELD UNIT
===================================================== */

function populateVersionUnitSelect(
    selectedId
) {

    const select =
        document.getElementById(
            "versionYieldUnit"
        );


    if (
        !select
    ) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Pilih Unit
        </option>

        ${
            units
                .map(
                    unit => `

                        <option
                            value="${escapeHtml(
                                unit.id
                            )}"
                        >

                            ${escapeHtml(
                                unit.name ||
                                unit.code ||
                                ""
                            )}

                            ${
                                unit.code
                                    ? ` (${escapeHtml(
                                        unit.code
                                    )})`
                                    : ""
                            }

                        </option>

                    `
                )
                .join("")
        }

    `;


    if (
        selectedId
    ) {

        select.value =
            String(
                selectedId
            );

    }

}


/* =====================================================
   H4 — ADD INGREDIENT ROW
===================================================== */

function addVersionIngredientRow(
    item = null
) {

    versionIngredientRows++;


    const rowId =
        versionIngredientRows;


    const container =
        document.getElementById(
            "versionIngredients"
        );


    if (
        !container
    ) {

        return;

    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "recipe-version-ingredient-row";


    row.dataset.rowId =
        rowId;


    row.innerHTML = `

        <div
            class="
                recipe-version-ingredient-number
            "
        >
            ${rowId}
        </div>


        <div
            class="recipe-field"
        >

            <label>
                Ingredient
            </label>


            <select
                class="version-ingredient-select"
                required
            >

                <option value="">
                    Pilih bahan
                </option>


                ${
                    ingredients
                        .map(
                            ingredient => `

                                <option
                                    value="${escapeHtml(
                                        ingredient.id
                                    )}"
                                    data-default-unit="${escapeHtml(
                                        ingredient.default_unit_id ||
                                        ""
                                    )}"
                                >

                                    ${escapeHtml(
                                        ingredient.name ||
                                        "Ingredient"
                                    )}

                                    ${
                                        ingredient.code
                                            ? ` (${escapeHtml(
                                                ingredient.code
                                            )})`
                                            : ""
                                    }

                                    ${
                                        ingredient.is_active === false
                                            ? " — inactive"
                                            : ""
                                    }

                                </option>

                            `
                        )
                        .join("")
                }

            </select>

        </div>


        <div
            class="recipe-field"
        >

            <label>
                Quantity
            </label>


            <input
                type="number"
                class="version-ingredient-qty"
                min="0.000001"
                step="0.000001"
                placeholder="0"
                required
            >

        </div>


        <div
            class="recipe-field"
        >

            <label>
                Unit
            </label>


            <select
                class="version-ingredient-unit"
                required
            >

                <option value="">
                    Unit
                </option>


                ${
                    units
                        .map(
                            unit => `

                                <option
                                    value="${escapeHtml(
                                        unit.id
                                    )}"
                                >

                                    ${escapeHtml(
                                        unit.name ||
                                        unit.code ||
                                        ""
                                    )}

                                    ${
                                        unit.code
                                            ? ` (${escapeHtml(
                                                unit.code
                                            )})`
                                            : ""
                                    }

                                </option>

                            `
                        )
                        .join("")
                }

            </select>

        </div>


        <button
            type="button"
            class="
                recipe-version-remove-ingredient
            "
            title="Hapus ingredient"
        >

            <i
                data-lucide="trash-2"
            ></i>

        </button>

    `;


    container.appendChild(
        row
    );


    const ingredientSelect =
        row.querySelector(
            ".version-ingredient-select"
        );


    const unitSelect =
        row.querySelector(
            ".version-ingredient-unit"
        );


    /*
    =====================================================
    AUTO DEFAULT UNIT
    =====================================================
    */

    ingredientSelect?.addEventListener(
        "change",
        () => {

            const selected =
                ingredientSelect
                    .selectedOptions[0];


            const defaultUnit =
                selected
                    ?.dataset
                    ?.defaultUnit;


            if (
                defaultUnit &&
                unitSelect
            ) {

                unitSelect.value =
                    String(
                        defaultUnit
                    );

            }

        }
    );


    /*
    =====================================================
    REMOVE
    =====================================================
    */

    row.querySelector(
        ".recipe-version-remove-ingredient"
    )?.addEventListener(
        "click",
        () => {

            row.remove();

            renumberVersionIngredientRows();

            updateVersionIngredientEmpty();

        }
    );


    /*
    =====================================================
    PREFILL
    =====================================================
    */

    if (
        item
    ) {

        if (
            ingredientSelect
        ) {

            ingredientSelect.value =
                String(
                    item.ingredient_id ||
                    ""
                );

        }


        const quantityInput =
            row.querySelector(
                ".version-ingredient-qty"
            );


        if (
            quantityInput
        ) {

            quantityInput.value =
                item.quantity ??
                "";

        }


        if (
            unitSelect
        ) {

            unitSelect.value =
                String(
                    item.unit_id ||
                    ""
                );

        }

    }


    updateVersionIngredientEmpty();

    refreshIcons();

}


/* =====================================================
   H4 — RENUMBER INGREDIENTS
===================================================== */

function renumberVersionIngredientRows() {

    const rows =
        document.querySelectorAll(
            "#versionIngredients .recipe-version-ingredient-row"
        );


    rows.forEach(
        (
            row,
            index
        ) => {

            const number =
                row.querySelector(
                    ".recipe-version-ingredient-number"
                );


            if (
                number
            ) {

                number.textContent =
                    index + 1;

            }

        }
    );

}


/* =====================================================
   H4 — EMPTY STATE
===================================================== */

function updateVersionIngredientEmpty() {

    const container =
        document.getElementById(
            "versionIngredients"
        );


    const empty =
        document.getElementById(
            "versionIngredientEmpty"
        );


    const count =
        container
            ?.querySelectorAll(
                ".recipe-version-ingredient-row"
            )
            ?.length ||
        0;


    if (
        empty
    ) {

        empty.hidden =
            count > 0;

    }

}


/* =====================================================
   H4 — FERMENTATION VISIBILITY
===================================================== */

function updateVersionFermentationVisibility() {

    const checkbox =
        document.getElementById(
            "versionFermentationRequired"
        );


    const fields =
        document.getElementById(
            "versionFermentationFields"
        );


    if (
        !checkbox ||
        !fields
    ) {

        return;

    }


    if (
        checkbox.checked
    ) {

        fields.removeAttribute(
            "hidden"
        );

    }
    else {

        fields.setAttribute(
            "hidden",
            ""
        );

    }

}


/* =====================================================
   H4 — ERROR
===================================================== */

function showRecipeVersionError(
    message
) {

    const box =
        document.getElementById(
            "recipeVersionError"
        );


    if (
        !box
    ) {

        console.error(
            message
        );

        alert(
            message ||
            "Terjadi kesalahan."
        );

        return;

    }


    const text =
        box.querySelector(
            "span"
        );


    if (
        text
    ) {

        text.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    box.removeAttribute(
        "hidden"
    );


    refreshIcons();

}


/* =====================================================
   H4 — CLEAR ERROR
===================================================== */

function clearRecipeVersionError() {

    document
        .getElementById(
            "recipeVersionError"
        )
        ?.setAttribute(
            "hidden",
            ""
        );

}


/* =====================================================
   H4 — OPEN NEW VERSION
===================================================== */

async function handleNewRecipeVersion() {

    if (
        !activeDetailRecipeId
    ) {

        return;

    }


    /*
    =====================================================
    CLEAR
    =====================================================
    */

    clearRecipeVersionError();


    /*
    =====================================================
    LOAD MASTER DATA FIRST
    =====================================================
    */

    try {

        await loadRecipeVersionMasterData();

    }
    catch (
        error
    ) {

        console.error(
            "H4 MASTER DATA LOAD ERROR:",
            error
        );


        showRecipeVersionError(
            error?.message ||
            "Gagal memuat master Ingredient dan Unit."
        );


        return;

    }


    /*
    =====================================================
    VALIDATE MASTER DATA
    =====================================================
    */

    if (
        !Array.isArray(
            ingredients
        ) ||
        !ingredients.length
    ) {

        showRecipeVersionError(
            "Master Ingredient masih kosong."
        );


        return;

    }


    if (
        !Array.isArray(
            units
        ) ||
        !units.length
    ) {

        showRecipeVersionError(
            "Master Unit masih kosong."
        );


        return;

    }


    /*
    =====================================================
    CREATE MODAL
    =====================================================
    */

    const modal =
        ensureRecipeVersionModal();


    if (
        !modal
    ) {

        return;

    }


    modal.hidden =
        false;


    document.body.classList.add(
        "recipe-modal-open"
    );


    /*
    =====================================================
    SAVE BUTTON
    =====================================================
    */

    const saveButton =
        document.getElementById(
            "saveRecipeVersionButton"
        );


    if (
        saveButton
    ) {

        saveButton.disabled =
            true;

    }


    /*
    =====================================================
    RESET ERROR
    =====================================================
    */

    clearRecipeVersionError();


    /*
    =====================================================
    RESET ROW
    =====================================================
    */

    versionIngredientRows =
        0;


    const ingredientContainer =
        document.getElementById(
            "versionIngredients"
        );


    if (
        ingredientContainer
    ) {

        ingredientContainer.innerHTML =
            "";

    }


    try {

        /*
        ================================================
        LOAD RECIPE DATA
        ================================================
        */

        const data =
            await loadRecipeVersionData(
                activeDetailRecipeId
            );


        /*
        ================================================
        SAVE STATE
        ================================================
        */

        activeVersionRecipe =
            data.recipe;


        activeVersionSource =
            data.currentVersion;


        const recipe =
            data.recipe;


        const currentVersion =
            data.currentVersion;


        const sourceIngredients =
            Array.isArray(
                data.ingredients
            )
                ? data.ingredients
                : [];


        /*
        ================================================
        VERSION NUMBER
        ================================================
        */

        const previousNumber =
            Number(
                currentVersion
                    ?.version_number ||
                recipe
                    ?.current_version_number ||
                0
            );


        const newNumber =
            previousNumber +
            1;


        /*
        ================================================
        MASTER INFO
        ================================================
        */

        const nameElement =
            document.getElementById(
                "versionRecipeName"
            );


        const codeElement =
            document.getElementById(
                "versionRecipeCode"
            );


        const previousElement =
            document.getElementById(
                "versionPreviousNumber"
            );


        const newElement =
            document.getElementById(
                "versionNewNumber"
            );


        if (
            nameElement
        ) {

            nameElement.textContent =
                recipe?.name ||
                "Recipe";

        }


        if (
            codeElement
        ) {

            codeElement.textContent =
                recipe?.code ||
                "—";

        }


        if (
            previousElement
        ) {

            previousElement.textContent =
                currentVersion
                    ? `v${previousNumber}`
                    : "Belum ada";

        }


        if (
            newElement
        ) {

            newElement.textContent =
                `v${newNumber}`;

        }


        /*
        ================================================
        FORM ELEMENT
        ================================================
        */

        const yieldInput =
            document.getElementById(
                "versionYield"
            );


        const yieldUnit =
            document.getElementById(
                "versionYieldUnit"
            );


        const fermentation =
            document.getElementById(
                "versionFermentationRequired"
            );


        const f1 =
            document.getElementById(
                "versionF1Target"
            );


        const f2 =
            document.getElementById(
                "versionF2Target"
            );


        const shelf =
            document.getElementById(
                "versionShelfLife"
            );


        const notes =
            document.getElementById(
                "versionNotes"
            );


        /*
        ================================================
        YIELD
        ================================================
        */

        if (
            yieldInput
        ) {

            yieldInput.value =
                currentVersion
                    ?.yield_quantity ??
                "";

        }


        /*
        ================================================
        YIELD UNIT
        ================================================
        */

        populateVersionUnitSelect(
            currentVersion
                ?.yield_unit_id ||
            ""
        );


        /*
        ================================================
        FERMENTATION
        ================================================
        */

        if (
            fermentation
        ) {

            fermentation.checked =
                Boolean(
                    currentVersion
                        ?.fermentation_required
                );

        }


        /*
        ================================================
        F1
        ================================================
        */

        if (
            f1
        ) {

            f1.value =
                currentVersion
                    ?.f1_target_days ??
                "0";

        }


        /*
        ================================================
        F2
        ================================================
        */

        if (
            f2
        ) {

            f2.value =
                currentVersion
                    ?.f2_target_days ??
                "0";

        }


        /*
        ================================================
        SHELF LIFE
        ================================================
        */

        if (
            shelf
        ) {

            shelf.value =
                currentVersion
                    ?.shelf_life_days ??
                "0";

        }


        /*
        ================================================
        NOTES
        ================================================
        */

        if (
            notes
        ) {

            notes.value =
                "";

        }


        /*
        ================================================
        FERMENTATION VISIBILITY
        ================================================
        */

        updateVersionFermentationVisibility();


        /*
        ================================================
        COPY FORMULA
        ================================================
        */

        if (
            sourceIngredients.length
        ) {

            sourceIngredients.forEach(
                item => {

                    addVersionIngredientRow({

                        ingredient_id:
                            item.ingredient_id,

                        quantity:
                            item.quantity,

                        unit_id:
                            item.unit_id

                    });

                }
            );

        }
        else {

            addVersionIngredientRow();

        }


        /*
        ================================================
        EMPTY STATE
        ================================================
        */

        updateVersionIngredientEmpty();


        /*
        ================================================
        ENABLE SAVE
        ================================================
        */

        if (
            saveButton
        ) {

            saveButton.disabled =
                false;

        }


        /*
        ================================================
        ICON
        ================================================
        */

        refreshIcons();


        console.log(
            "MERAMU H4 READY",
            {
                recipe:
                    recipe?.name,

                previousVersion:
                    previousNumber,

                newVersion:
                    newNumber,

                masterIngredients:
                    ingredients.length,

                masterUnits:
                    units.length,

                copiedIngredients:
                    sourceIngredients.length
            }
        );

    }

    catch (
        error
    ) {

        console.error(
            "OPEN NEW RECIPE VERSION ERROR:",
            error
        );


        showRecipeVersionError(
            error?.message ||
            "Gagal memuat formula version sebelumnya."
        );

    }

}


/* =====================================================
   H4 — CLOSE MODAL
===================================================== */

function closeRecipeVersionModal() {

    const modal =
        document.getElementById(
            "recipeVersionModal"
        );


    if (
        modal
    ) {

        modal.hidden =
            true;

    }


    document.body.classList.remove(
        "recipe-modal-open"
    );


    activeVersionRecipe =
        null;


    activeVersionSource =
        null;


    versionIngredientRows =
        0;

}


/* =====================================================
   H4 — COLLECT INGREDIENTS
===================================================== */

function collectVersionIngredients() {

    const rows =
        [
            ...document.querySelectorAll(
                "#versionIngredients .recipe-version-ingredient-row"
            )
        ];


    if (
        !rows.length
    ) {

        throw new Error(
            "Tambahkan minimal satu ingredient."
        );

    }


    const payload =
        [];


    const duplicateIds =
        new Set();


    rows.forEach(
        (
            row,
            index
        ) => {

            const ingredientId =
                row.querySelector(
                    ".version-ingredient-select"
                )?.value ||
                "";


            const quantity =
                Number(
                    row.querySelector(
                        ".version-ingredient-qty"
                    )?.value
                );


            const unitId =
                row.querySelector(
                    ".version-ingredient-unit"
                )?.value ||
                "";


            /*
            ================================================
            INGREDIENT
            ================================================
            */

            if (
                !ingredientId
            ) {

                throw new Error(
                    `Ingredient nomor ${
                        index + 1
                    } belum dipilih.`
                );

            }


            /*
            ================================================
            QUANTITY
            ================================================
            */

            if (
                !Number.isFinite(
                    quantity
                ) ||
                quantity <= 0
            ) {

                throw new Error(
                    `Quantity ingredient nomor ${
                        index + 1
                    } tidak valid.`
                );

            }


            /*
            ================================================
            UNIT
            ================================================
            */

            if (
                !unitId
            ) {

                throw new Error(
                    `Unit ingredient nomor ${
                        index + 1
                    } belum dipilih.`
                );

            }


            /*
            ================================================
            DUPLICATE
            ================================================
            */

            if (
                duplicateIds.has(
                    String(
                        ingredientId
                    )
                )
            ) {

                throw new Error(
                    `Ingredient ${
                        index + 1
                    } duplikat. Satu ingredient cukup satu baris.`
                );

            }


            duplicateIds.add(
                String(
                    ingredientId
                )
            );


            /*
            ================================================
            PUSH
            ================================================
            */

            payload.push({

                ingredient_id:
                    ingredientId,

                quantity:
                    quantity,

                unit_id:
                    unitId

            });

        }
    );


    return payload;

}


/* =====================================================
   H4 — SAVE VERSION
===================================================== */

async function saveRecipeVersion() {

    clearRecipeVersionError();


    if (
        !activeVersionRecipe
    ) {

        showRecipeVersionError(
            "Recipe belum dimuat."
        );

        return;

    }


    const saveButton =
        document.getElementById(
            "saveRecipeVersionButton"
        );


    const buttonText =
        saveButton?.querySelector(
            "span"
        );


    const originalText =
        "Simpan Version";


    try {

        /*
        =================================================
        READ FORM
        =================================================
        */

        const yieldQuantity =
            Number(
                document.getElementById(
                    "versionYield"
                )?.value
            );


        const yieldUnitId =
            document.getElementById(
                "versionYieldUnit"
            )?.value ||
            "";


        const fermentationRequired =
            Boolean(
                document.getElementById(
                    "versionFermentationRequired"
                )?.checked
            );


        const f1Target =
            fermentationRequired
                ? Number(
                    document.getElementById(
                        "versionF1Target"
                    )?.value
                )
                : 0;


        const f2Target =
            fermentationRequired
                ? Number(
                    document.getElementById(
                        "versionF2Target"
                    )?.value
                )
                : 0;


        const shelfLife =
            Number(
                document.getElementById(
                    "versionShelfLife"
                )?.value
            );


        const notes =
            document.getElementById(
                "versionNotes"
            )?.value
            ?.trim() ||
            "";


        /*
        =================================================
        VALIDATION
        =================================================
        */

        if (
            !Number.isFinite(
                yieldQuantity
            ) ||
            yieldQuantity <= 0
        ) {

            throw new Error(
                "Yield harus lebih besar dari 0."
            );

        }


        if (
            !yieldUnitId
        ) {

            throw new Error(
                "Unit yield wajib dipilih."
            );

        }


        if (
            fermentationRequired &&
            (
                !Number.isFinite(
                    f1Target
                ) ||
                !Number.isFinite(
                    f2Target
                ) ||
                f1Target < 0 ||
                f2Target < 0
            )
        ) {

            throw new Error(
                "Target fermentasi tidak valid."
            );

        }


        if (
            !Number.isFinite(
                shelfLife
            ) ||
            shelfLife < 0
        ) {

            throw new Error(
                "Shelf life tidak valid."
            );

        }


        const ingredientPayload =
            collectVersionIngredients();


        /*
        =================================================
        BUTTON LOADING
        =================================================
        */

        if (
            saveButton
        ) {

            saveButton.disabled =
                true;

            saveButton.classList.add(
                "is-loading"
            );

        }


        if (
            buttonText
        ) {

            buttonText.textContent =
                "Menyimpan...";

        }


        /*
        =================================================
        SUPABASE
        =================================================
        */

        await new Promise(
            (
                resolve,
                reject
            ) => {

                waitForSupabase(
                    async supabase => {

                        let newVersionId =
                            null;


                        try {

                            /*
                            =====================================
                            GET LATEST VERSION
                            =====================================
                            */

                            const {
                                data:
                                    latestVersions,
                                error:
                                    latestError
                            } = await supabase

                                .from(
                                    "recipe_versions"
                                )

                                .select(`
                                    id,
                                    version_number
                                `)

                                .eq(
                                    "recipe_id",
                                    activeVersionRecipe.id
                                )

                                .order(
                                    "version_number",
                                    {
                                        ascending:
                                            false
                                    }
                                )

                                .limit(
                                    1
                                );


                            if (
                                latestError
                            ) {

                                throw latestError;

                            }


                            const latestVersion =
                                latestVersions?.[0] ||
                                null;


                            /*
                            =====================================
                            NEW VERSION NUMBER
                            =====================================
                            */

                            const newVersionNumber =
                                Number(
                                    latestVersion
                                        ?.version_number ||
                                    activeVersionRecipe
                                        ?.current_version_number ||
                                    0
                                ) + 1;


                            /*
                            =====================================
                            SAFETY CHECK
                            =====================================
                            */

                            if (
                                !Number.isInteger(
                                    newVersionNumber
                                ) ||
                                newVersionNumber <= 0
                            ) {

                                throw new Error(
                                    "Nomor Recipe Version tidak valid."
                                );

                            }


                            /*
                            =====================================
                            CREATE VERSION
                            =====================================
                            */

                            const {
                                data:
                                    newVersion,
                                error:
                                    versionError
                            } = await supabase

                                .from(
                                    "recipe_versions"
                                )

                                .insert({

                                    recipe_id:
                                        activeVersionRecipe.id,

                                    version_number:
                                        newVersionNumber,

                                    yield_quantity:
                                        yieldQuantity,

                                    yield_unit_id:
                                        yieldUnitId,

                                    fermentation_required:
                                        fermentationRequired,

                                    f1_target_days:
                                        fermentationRequired
                                            ? f1Target
                                            : 0,

                                    f2_target_days:
                                        fermentationRequired
                                            ? f2Target
                                            : 0,

                                    shelf_life_days:
                                        shelfLife || 0,

                                    notes:
                                        notes ||
                                        null,

                                    status:
                                        "active",

                                    effective_from:
                                        new Date()
                                            .toISOString()

                                })

                                .select(
                                    "id"
                                )

                                .single();


                            if (
                                versionError
                            ) {

                                throw versionError;

                            }


                            if (
                                !newVersion?.id
                            ) {

                                throw new Error(
                                    "Recipe Version berhasil dibuat tetapi ID tidak ditemukan."
                                );

                            }


                            newVersionId =
                                newVersion.id;


                            /*
                            =====================================
                            CREATE INGREDIENT ROWS
                            =====================================
                            */

                            const ingredientRows =
                                ingredientPayload.map(
                                    item => ({

                                        recipe_version_id:
                                            newVersion.id,

                                        ingredient_id:
                                            item.ingredient_id,

                                        quantity:
                                            item.quantity,

                                        unit_id:
                                            item.unit_id

                                    })
                                );


                            const {
                                error:
                                    ingredientError
                            } = await supabase

                                .from(
                                    "recipe_ingredients"
                                )

                                .insert(
                                    ingredientRows
                                );


                            if (
                                ingredientError
                            ) {

                                /*
                                =================================
                                BEST EFFORT ROLLBACK
                                =================================
                                */

                                try {

                                    await supabase

                                        .from(
                                            "recipe_versions"
                                        )

                                        .delete()

                                        .eq(
                                            "id",
                                            newVersion.id
                                        );

                                }
                                catch (
                                    rollbackError
                                ) {

                                    console.error(
                                        "Recipe Version rollback error:",
                                        rollbackError
                                    );

                                }


                                throw ingredientError;

                            }


                            /*
                            =====================================
                            UPDATE MASTER CURRENT VERSION
                            =====================================
                            */

                            const {
                                error:
                                    recipeUpdateError
                            } = await supabase

                                .from(
                                    "recipes"
                                )

                                .update({

                                    current_version_number:
                                        newVersionNumber

                                })

                                .eq(
                                    "id",
                                    activeVersionRecipe.id
                                );


                            if (
                                recipeUpdateError
                            ) {

                                /*
                                =================================
                                IMPORTANT

                                Version dan ingredient sudah
                                tersimpan.

                                Jangan delete version karena
                                formula baru sudah valid.

                                Error dilaporkan.
                                =================================
                                */

                                throw recipeUpdateError;

                            }


                            /*
                            =====================================
                            SUCCESS
                            =====================================
                            */

                            resolve(
                                newVersionNumber
                            );

                        }
                        catch (
                            error
                        ) {

                            console.error(
                                "CREATE RECIPE VERSION ERROR:",
                                error
                            );


                            reject(
                                error
                            );

                        }

                    }
                );

            }
        );


        /*
        =================================================
        CLOSE
        =================================================
        */

        closeRecipeVersionModal();


        /*
        =================================================
        REFRESH LIST
        =================================================
        */

        await loadRecipes();


        /*
        =================================================
        REFRESH DETAIL

        IMPORTANT:
        openRecipeDetail() akan membaca activeDetailRecipeId
        yang masih ada.
        =================================================
        */

        if (
            activeDetailRecipeId
        ) {

            await openRecipeDetail(
                activeDetailRecipeId
            );

        }


        /*
        =================================================
        SUCCESS MESSAGE
        =================================================
        */

        showSuccessMessage(
            "Recipe Version berhasil dibuat."
        );

    }

    catch (
        error
    ) {

        console.error(
            "SAVE RECIPE VERSION ERROR:",
            error
        );


        showRecipeVersionError(
            error?.message ||
            "Recipe Version gagal disimpan."
        );

    }

    finally {

        if (
            saveButton
        ) {

            saveButton.disabled =
                false;

            saveButton.classList.remove(
                "is-loading"
            );

        }


        if (
            buttonText
        ) {

            buttonText.textContent =
                originalText;

        }

    }

}


/* =====================================================
   H4 — MODAL EVENTS
===================================================== */

function bindRecipeVersionModalEvents() {

    /*
    =====================================================
    CLOSE
    =====================================================
    */

    document
        .querySelectorAll(
            "[data-version-close]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeRecipeVersionModal
                );

            }
        );


    /*
    =====================================================
    SAVE
    =====================================================
    */

    document
        .getElementById(
            "saveRecipeVersionButton"
        )
        ?.addEventListener(
            "click",
            saveRecipeVersion
        );


    /*
    =====================================================
    ADD INGREDIENT
    =====================================================
    */

    document
        .getElementById(
            "addVersionIngredientButton"
        )
        ?.addEventListener(
            "click",
            () => {

                addVersionIngredientRow();

            }
        );


    /*
    =====================================================
    FERMENTATION
    =====================================================
    */

    document
        .getElementById(
            "versionFermentationRequired"
        )
        ?.addEventListener(
            "change",
            updateVersionFermentationVisibility
        );


    /*
    =====================================================
    ESCAPE
    =====================================================
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            const modal =
                document.getElementById(
                    "recipeVersionModal"
                );


            if (
                modal &&
                !modal.hidden
            ) {

                closeRecipeVersionModal();

            }

        }
    );

}
   /* =====================================================
   DELETE RECIPE
===================================================== */

async function deleteRecipeVersion(
    recipeId,
    versionId,
    versionNumber
) {

    if (!recipeId || !versionId) {
        return;
    }

    const versionLabel =
        `V${versionNumber || "?"}`;

    const confirmed = window.confirm(
        `Hapus Recipe Version ${versionLabel}?\n\n` +
        `Version hanya akan dihapus jika belum menjadi Current, ` +
        `belum digunakan Batch / Production, dan belum digunakan ` +
        `oleh Allocation / HPP.\n\n` +
        `Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) {
        return;
    }

    waitForSupabase(
        async supabase => {

            try {

                /*
                =================================================
                SAFE DELETE VIA DATABASE FUNCTION
                =================================================

                Jangan membaca / menghapus allocation_components
                langsung dari browser.

                Tabel tersebut dilindungi RLS/permission dan juga
                merupakan histori Allocation / HPP.

                Function database melakukan seluruh pengecekan dan
                penghapusan dalam satu transaction.
                =================================================
                */

                const {
                    data,
                    error
                } = await supabase.rpc(
                    "delete_recipe_version_safe",
                    {
                        p_recipe_id: recipeId,
                        p_version_id: versionId
                    }
                );

                if (error) {
                    throw error;
                }

                const result =
                    Array.isArray(data)
                        ? data[0]
                        : data;

                if (!result?.success) {

                    const code =
                        result?.code ||
                        "DELETE_BLOCKED";

                    if (code === "CURRENT_VERSION") {
                        window.alert(
                            `${versionLabel} tidak dapat dihapus karena merupakan Current Version.\n\n` +
                            `Buat Version baru terlebih dahulu.`
                        );
                        return;
                    }

                    if (code === "BATCH_IN_USE") {
                        window.alert(
                            `${versionLabel} tidak dapat dihapus.\n\n` +
                            `${result?.message || "Version sudah digunakan oleh Batch / Production."}` +
                            `\n\nHistori produksi tetap dipertahankan.`
                        );
                        return;
                    }

                    if (code === "ALLOCATION_IN_USE") {
                        window.alert(
                            `${versionLabel} tidak dapat dihapus.\n\n` +
                            `Version ini masih digunakan oleh data Allocation / HPP. ` +
                            `Data tersebut dipertahankan agar histori tetap aman.`
                        );
                        return;
                    }

                    throw new Error(
                        result?.message ||
                        "Version tidak dapat dihapus."
                    );
                }

                await openRecipeDetail(recipeId);

                showSuccessMessage(
                    `Recipe Version ${versionLabel} berhasil dihapus.`
                );

            }
            catch (error) {

                console.error(
                    "DELETE RECIPE VERSION ERROR:",
                    error
                );

                let message =
                    error?.message ||
                    "Terjadi kesalahan saat menghapus Version.";

                if (
                    message.includes("delete_recipe_version_safe") &&
                    message.includes("does not exist")
                ) {
                    message =
                        "Fungsi database delete_recipe_version_safe belum dibuat di Supabase. " +
                        "Jalankan SQL migration yang disertakan pada paket V4 terlebih dahulu.";
                }

                window.alert(
                    `Recipe Version ${versionLabel} gagal dihapus.\n\n` +
                    message
                );
            }
        }
    );
}


async function deleteRecipe(
    recipeId
) {

    if (!recipeId) {
        return;
    }

    const recipe = recipes.find(
        item => String(item.id) === String(recipeId)
    );

    if (!recipe) {
        return;
    }

    const recipeName = recipe.name || "Recipe ini";

    waitForSupabase(
        async supabase => {

            try {

                /*
                =========================================
                1. LOAD VERSION IDS
                =========================================
                */

                const {
                    data: versions,
                    error: versionsError
                } = await supabase
                    .from("recipe_versions")
                    .select(`
                        id,
                        version_number
                    `)
                    .eq("recipe_id", recipeId);

                if (versionsError) {
                    throw versionsError;
                }

                const versionIds = (versions || [])
                    .map(item => item.id)
                    .filter(Boolean);

                /*
                =========================================
                2. CHECK BATCH -> RECIPE MASTER
                =========================================
                */

                const {
                    data: recipeBatches,
                    error: recipeBatchError
                } = await supabase
                    .from("batches")
                    .select(`
                        id,
                        batch_code
                    `)
                    .eq("recipe_id", recipeId)
                    .limit(20);

                if (recipeBatchError) {
                    throw recipeBatchError;
                }

                /*
                =========================================
                3. CHECK BATCH -> RECIPE VERSION

                Tetap dicek walaupun recipe_id kosong,
                agar histori produksi tidak ikut terhapus.
                =========================================
                */

                let versionBatches = [];

                if (versionIds.length) {

                    const {
                        data,
                        error
                    } = await supabase
                        .from("batches")
                        .select(`
                            id,
                            batch_code,
                            recipe_version_id
                        `)
                        .in("recipe_version_id", versionIds)
                        .limit(20);

                    if (error) {
                        throw error;
                    }

                    versionBatches = data || [];
                }

                const allUsedBatches = [
                    ...(recipeBatches || []),
                    ...versionBatches
                ].filter(
                    (batch, index, array) =>
                        array.findIndex(
                            item => String(item.id) === String(batch.id)
                        ) === index
                );

                if (allUsedBatches.length) {

                    const batchList = allUsedBatches
                        .map(batch => batch.batch_code || batch.id)
                        .join(", ");

                    window.alert(
                        `Recipe "${recipeName}" tidak dapat dihapus.\n\n` +
                        `Recipe ini sudah digunakan oleh Batch / Production:` +
                        `\n${batchList}` +
                        `${allUsedBatches.length >= 20 ? "\n...dan batch lainnya." : ""}\n\n` +
                        `Histori produksi harus tetap aman.`
                    );

                    return;
                }

                /*
                =========================================
                4. CONFIRM AFTER SAFETY CHECK
                =========================================
                */

                const confirmed = window.confirm(
                    `Hapus recipe "${recipeName}"?\n\n` +
                    `Recipe ini belum digunakan oleh Batch / Production.\n` +
                    `Semua Version dan formula ingredient milik Recipe ini akan dihapus.\n\n` +
                    `Tindakan ini tidak dapat dibatalkan.`
                );

                if (!confirmed) {
                    return;
                }

                /*
                =========================================
                5. DELETE CHILD INGREDIENTS
                =========================================
                */

                if (versionIds.length) {

                    const {
                        error: ingredientDeleteError
                    } = await supabase
                        .from("recipe_ingredients")
                        .delete()
                        .in("recipe_version_id", versionIds);

                    if (ingredientDeleteError) {
                        throw ingredientDeleteError;
                    }
                }

                /*
                =========================================
                6. DELETE VERSIONS
                =========================================
                */

                if (versionIds.length) {

                    const {
                        error: versionDeleteError
                    } = await supabase
                        .from("recipe_versions")
                        .delete()
                        .in("id", versionIds)
                        .eq("recipe_id", recipeId);

                    if (versionDeleteError) {
                        throw versionDeleteError;
                    }
                }

                /*
                =========================================
                7. DELETE MASTER
                =========================================
                */

                const {
                    error: recipeDeleteError
                } = await supabase
                    .from("recipes")
                    .delete()
                    .eq("id", recipeId);

                if (recipeDeleteError) {
                    throw recipeDeleteError;
                }

                if (
                    String(activeDetailRecipeId) === String(recipeId)
                ) {
                    closeRecipeDetail();
                }

                await loadRecipes();

                showSuccessMessage(
                    `Recipe "${recipeName}" berhasil dihapus.`
                );

            }
            catch (error) {

                console.error(
                    "DELETE RECIPE ERROR:",
                    error
                );

                window.alert(
                    `Recipe "${recipeName}" gagal dihapus.\n\n` +
                    `${error?.message || "Terjadi kesalahan saat menghapus Recipe."}\n\n` +
                    `Jika data masih memiliki relasi database lain yang belum ditangani, data tidak dihapus secara paksa.`
                );

            }

        }
    );

}

    /* =====================================================
       RECIPE ACTIONS
    ===================================================== */

    function handleRecipeAction(
        action,
        id
    ) {

        if (
            !id
        ) {

            return;

        }


        const recipe =
            recipes.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        id
                    )
            );


        if (
            !recipe
        ) {

            return;

        }


        switch (
            action
        ) {

            case "view":

                openRecipeDetail(
                    id
                );

                break;


            case "edit":

                openEditRecipe(
                    id
                );

                break;


            case "version":

                openRecipeDetail(
                    id
                );

                break;
              case "delete":

                deleteRecipe(
                    id
                );
            
                break;


            default:

                break;

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        /*
        -----------------------------------------------------
        SEARCH
        -----------------------------------------------------
        */

        document
            .getElementById(
                "recipeSearch"
            )
            ?.addEventListener(
                "input",
                applyFilters
            );


        /*
        -----------------------------------------------------
        STATUS FILTER
        -----------------------------------------------------
        */

        document
            .getElementById(
                "recipeStatusFilter"
            )
            ?.addEventListener(
                "change",
                applyFilters
            );


        /*
        -----------------------------------------------------
        RETRY
        -----------------------------------------------------
        */

        document
            .getElementById(
                "recipeRetryButton"
            )
            ?.addEventListener(
                "click",
                loadRecipes
            );


        /*
        -----------------------------------------------------
        CREATE RECIPE
        -----------------------------------------------------
        */

        document
            .getElementById(
                "createRecipeButton"
            )
            ?.addEventListener(
                "click",
                openRecipeModal
            );


        /*
        -----------------------------------------------------
        CLOSE CREATE / EDIT MODAL
        -----------------------------------------------------
        */

        document
            .getElementById(
                "closeRecipeModal"
            )
            ?.addEventListener(
                "click",
                closeRecipeModal
            );


        document
            .getElementById(
                "cancelRecipeButton"
            )
            ?.addEventListener(
                "click",
                closeRecipeModal
            );


        document
            .querySelector(
                "#recipeModal .recipe-modal-backdrop"
            )
            ?.addEventListener(
                "click",
                closeRecipeModal
            );


        /*
        -----------------------------------------------------
        ADD INGREDIENT
        -----------------------------------------------------
        */

        document
            .getElementById(
                "addIngredientButton"
            )
            ?.addEventListener(
                "click",
                addIngredientRow
            );


        /*
        -----------------------------------------------------
        FERMENTATION
        -----------------------------------------------------
        */

        document
            .getElementById(
                "fermentationRequired"
            )
            ?.addEventListener(
                "change",
                updateFermentationVisibility
            );


        /*
        -----------------------------------------------------
        AUTO RECIPE CODE
        -----------------------------------------------------
        */

        document
            .getElementById(
                "recipeName"
            )
            ?.addEventListener(
                "input",
                event => {

                    const code =
                        document.getElementById(
                            "recipeCode"
                        );


                    if (
                        code &&
                        !code.dataset.manual
                    ) {

                        code.value =
                            generateRecipeCode(
                                event.target.value
                            );

                    }

                }
            );


        document
            .getElementById(
                "recipeCode"
            )
            ?.addEventListener(
                "input",
                event => {

                    event.target.dataset.manual =
                        event.target.value
                            .trim()
                            .length
                            ? "true"
                            : "";

                }
            );


        /*
        -----------------------------------------------------
        CREATE / EDIT FORM SUBMIT
        -----------------------------------------------------
        */

        document
            .getElementById(
                "createRecipeForm"
            )
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    saveRecipe();

                }
            );


        /*
        -----------------------------------------------------
        DETAIL MODAL CLOSE
        -----------------------------------------------------
        */

        document
            .getElementById(
                "closeRecipeDetail"
            )
            ?.addEventListener(
                "click",
                closeRecipeDetail
            );


        document
            .getElementById(
                "closeRecipeDetailBottom"
            )
            ?.addEventListener(
                "click",
                closeRecipeDetail
            );


        document
            .querySelector(
                "#recipeDetailModal .recipe-modal-backdrop"
            )
            ?.addEventListener(
                "click",
                closeRecipeDetail
            );


        /*
        -----------------------------------------------------
        DETAIL → EDIT
        -----------------------------------------------------
        */

        document
            .getElementById(
                "editRecipeFromDetail"
            )
            ?.addEventListener(
                "click",
                handleEditRecipe
            );
/*
-----------------------------------------------------
DETAIL → DELETE
-----------------------------------------------------
*/

document
    .getElementById(
        "deleteRecipeFromDetail"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                activeDetailRecipeId
            ) {

                deleteRecipe(
                    activeDetailRecipeId
                );

            }

        }
    );

        /*
        -----------------------------------------------------
        VERSION HISTORY → DELETE VERSION
        -----------------------------------------------------
        */

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-delete-recipe-version]"
                    );

                if (!button) {
                    return;
                }

                const versionId =
                    button.dataset.deleteRecipeVersion;

                const versionNumber =
                    button.dataset.versionNumber;

                deleteRecipeVersion(
                    activeDetailRecipeId,
                    versionId,
                    versionNumber
                );

            }
        );

        /*
        -----------------------------------------------------
        DETAIL → NEW VERSION
        -----------------------------------------------------
        */

        document
            .getElementById(
                "newRecipeVersionFromDetail"
            )
            ?.addEventListener(
                "click",
                handleNewRecipeVersion
            );


        /*
        -----------------------------------------------------
        GLOBAL RECIPE ACTION
        -----------------------------------------------------
        */

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (
                    !button
                ) {

                    return;

                }


                handleRecipeAction(
                    button.dataset.action,
                    button.dataset.id
                );

            }
        );


        /*
        -----------------------------------------------------
        ESCAPE
        -----------------------------------------------------
        */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;

                }


                const createModal =
                    document.getElementById(
                        "recipeModal"
                    );


                const detailModal =
                    document.getElementById(
                        "recipeDetailModal"
                    );


                if (
                    createModal &&
                    !createModal.hidden
                ) {

                    closeRecipeModal();

                    return;

                }


                if (
                    detailModal &&
                    !detailModal.hidden
                ) {

                    closeRecipeDetail();

                }

            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function initRecipePage() {

        bindEvents();

        updateFermentationVisibility();

        loadRecipes();

    }


    /* =====================================================
       PUBLIC
    ===================================================== */

    window.initRecipePage =
        initRecipePage;


})();
