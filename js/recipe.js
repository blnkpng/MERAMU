/* =========================================================
   MERAMU — RECIPE STUDIO
   ---------------------------------------------------------
   H1  Recipe List
   H2  Create Recipe
   H3  Recipe Detail
   ---------------------------------------------------------
   IMPORTANT:
   Recipe = MASTER FORMULA
   Production = EXECUTION / BATCH

   H3 tidak mengubah Recipe Version / Ingredients lama.
   Perubahan formula akan dilakukan melalui H4 Version.
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


    /* =====================================================
       SUPABASE
    ===================================================== */

    function waitForSupabase(callback, attempt = 0) {

        if (window.supabaseClient) {

            callback(
                window.supabaseClient
            );

            return;

        }


        if (attempt >= 50) {

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

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatNumber(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";

        }


        const number =
            Number(value);


        if (Number.isNaN(number)) {

            return escapeHtml(value);

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                maximumFractionDigits: 3
            }
        ).format(number);

    }


    function formatCurrency(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";

        }


        const number =
            Number(value);


        if (Number.isNaN(number)) {

            return "—";

        }


        return new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        ).format(number);

    }


    function getCurrentVersion(recipe) {

        const versions =
            Array.isArray(
                recipe?.recipe_versions
            )
                ? recipe.recipe_versions
                : [];


        if (!versions.length) {

            return null;

        }


        return [...versions]
            .sort(
                (a, b) =>
                    Number(
                        b.version_number || 0
                    )
                    -
                    Number(
                        a.version_number || 0
                    )
            )[0];

    }


    function getRecipeStatus(recipe) {

        return String(
            recipe?.status || "active"
        ).toLowerCase();

    }


    function refreshIcons() {

        if (window.lucide) {

            lucide.createIcons();

        }

    }


    /* =====================================================
       PAGE ERROR / LOADING
    ===================================================== */

    function showLoading() {

        document
            .getElementById("recipeLoading")
            ?.removeAttribute("hidden");


        document
            .getElementById("recipeError")
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById("recipeEmpty")
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById("recipeList")
            ?.setAttribute(
                "hidden",
                ""
            );

    }


    function hideLoading() {

        document
            .getElementById("recipeLoading")
            ?.setAttribute(
                "hidden",
                ""
            );

    }


    function showError(message) {

        hideLoading();


        const error =
            document.getElementById(
                "recipeError"
            );


        const errorText =
            document.getElementById(
                "recipeErrorMessage"
            );


        if (errorText) {

            errorText.textContent =
                message ||
                "Terjadi kesalahan.";

        }


        error?.removeAttribute(
            "hidden"
        );


        document
            .getElementById("recipeEmpty")
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById("recipeList")
            ?.setAttribute(
                "hidden",
                ""
            );


        refreshIcons();

    }


    function showEmpty() {

        hideLoading();


        document
            .getElementById("recipeEmpty")
            ?.removeAttribute(
                "hidden"
            );


        document
            .getElementById("recipeError")
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById("recipeList")
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

                        .from("recipes")

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
                                ascending: true
                            }
                        );


                    if (error) {

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
                        [...recipes];


                    hideLoading();

                    updateSummary();

                    renderRecipes();

                }
                catch (error) {

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
                    getRecipeStatus(recipe) ===
                    "active"
            ).length;


        const versions =
            recipes.reduce(
                (sum, recipe) => {

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


        if (totalEl) {

            totalEl.textContent =
                formatNumber(total);

        }


        if (activeEl) {

            activeEl.textContent =
                formatNumber(active);

        }


        if (versionsEl) {

            versionsEl.textContent =
                formatNumber(versions);

        }

    }


    /* =====================================================
       RENDER RECIPE LIST
    ===================================================== */

    function renderRecipes() {

        const list =
            document.getElementById(
                "recipeList"
            );


        if (!list) {

            return;

        }


        if (!filteredRecipes.length) {

            showEmpty();

            return;

        }


        document
            .getElementById("recipeEmpty")
            ?.setAttribute(
                "hidden",
                ""
            );


        document
            .getElementById("recipeError")
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


    function renderRecipeCard(recipe) {

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
                data-recipe-id="${escapeHtml(recipe.id)}"
            >

                <div class="recipe-card-main">

                    <div class="recipe-card-icon">

                        <i
                            data-lucide="flask-conical"
                        ></i>

                    </div>


                    <div class="recipe-card-info">

                        <div class="recipe-card-title-row">

                            <h3>
                                ${escapeHtml(
                                    recipe.name ||
                                    "Tanpa Nama"
                                )}
                            </h3>


                            <span
                                class="
                                    recipe-status
                                    ${escapeHtml(status)}
                                "
                            >
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
                                    yieldValue !== undefined &&
                                    yieldValue !== null
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


                <div class="recipe-card-right">

                    <div class="recipe-hpp">

                        <span>
                            HPP / Liter
                        </span>

                        <strong>
                            —
                        </strong>

                    </div>


                    <div class="recipe-actions">

                        <button
                            type="button"
                            class="icon-detail-btn"
                            data-action="view"
                            data-id="${escapeHtml(recipe.id)}"
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
                            data-id="${escapeHtml(recipe.id)}"
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
                            data-id="${escapeHtml(recipe.id)}"
                            title="Buat versi baru"
                        >

                            <i
                                data-lucide="git-branch"
                            ></i>

                        </button>

                    </div>

                </div>

            </article>

        `;

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function applyFilters() {

        const search =
            (
                document.getElementById(
                    "recipeSearch"
                )?.value || ""
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
                            recipe.name || ""
                        )
                            .toLowerCase();


                    const code =
                        String(
                            recipe.code || ""
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
       H2 — LOAD MASTER DATA
    ===================================================== */

    async function loadFormData() {

        waitForSupabase(
            async supabase => {

                try {

                    const [
                        productResult,
                        ingredientResult,
                        unitResult
                    ] = await Promise.all([

                        supabase
                            .from("products")
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
                                    ascending: true
                                }
                            ),

                        supabase
                            .from("ingredients")
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
                                    ascending: true
                                }
                            ),

                        supabase
                            .from("units")
                            .select(`
                                id,
                                code,
                                name,
                                category
                            `)
                            .order(
                                "name",
                                {
                                    ascending: true
                                }
                            )

                    ]);


                    if (productResult.error) {

                        throw productResult.error;

                    }


                    if (ingredientResult.error) {

                        throw ingredientResult.error;

                    }


                    if (unitResult.error) {

                        throw unitResult.error;

                    }


                    products =
                        productResult.data || [];


                    ingredients =
                        ingredientResult.data || [];


                    units =
                        unitResult.data || [];


                    populateProductSelect();

                    populateUnitSelect();

                    resetIngredientRows();

                }
                catch (error) {

                    console.error(
                        "Recipe master data error:",
                        error
                    );

                    showFormError(
                        error?.message ||
                        "Gagal mengambil master data."
                    );

                }

            }
        );

    }


    function populateProductSelect() {

        const select =
            document.getElementById(
                "recipeProduct"
            );


        if (!select) {

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


    function populateUnitSelect() {

        const select =
            document.getElementById(
                "recipeYieldUnit"
            );


        if (!select) {

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
                            unit.code || ""
                        )
                            .toLowerCase();


                    const name =
                        String(
                            unit.name || ""
                        )
                            .toLowerCase();


                    return (
                        code === "l" ||
                        code === "liter" ||
                        name === "liter"
                    );

                }
            );


        if (liter) {

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


        if (!container) {

            return;

        }


        container.innerHTML = "";


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


        if (!container) {

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


            <div class="recipe-field">

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
                                            ingredient.default_unit_id || ""
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


            <div class="recipe-field">

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


            <div class="recipe-field">

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
            (row, index) => {

                const number =
                    row.querySelector(
                        ".recipe-ingredient-number"
                    );


                if (number) {

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
                .length || 0;


        if (empty) {

            empty.hidden =
                count > 0;

        }

    }


    /* =====================================================
       H2 — AUTO RECIPE CODE
    ===================================================== */

    function generateRecipeCode(name) {

        const clean =
            String(name || "")
                .toUpperCase()
                .normalize("NFD")
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


        if (!clean) {

            return "";

        }


        return `REC-${clean.substring(0, 24)}`;

    }


    /* =====================================================
       H2 — OPEN CREATE RECIPE
    ===================================================== */

    function openRecipeModal() {

        const modal =
            document.getElementById(
                "recipeModal"
            );


        if (!modal) {

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


        const yieldInput =
            document.getElementById(
                "recipeYield"
            );


        if (yieldInput) {

            yieldInput.value =
                "1";

        }


        const typeSelect =
            document.getElementById(
                "recipeType"
            );


        if (typeSelect) {

            typeSelect.value =
                "fermentation";

        }


        const fermentation =
            document.getElementById(
                "fermentationRequired"
            );


        if (fermentation) {

            fermentation.checked =
                true;

        }


        document.getElementById(
            "f1TargetDays"
        ).value = "7";


        document.getElementById(
            "f2TargetDays"
        ).value = "5";


        document.getElementById(
            "recipeShelfLife"
        ).value = "30";


        const code =
            document.getElementById(
                "recipeCode"
            );


        const name =
            document.getElementById(
                "recipeName"
            );


        if (code) {

            code.value =
                "";

            delete code.dataset.manual;

        }


        if (name) {

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


    function closeRecipeModal() {

        const modal =
            document.getElementById(
                "recipeModal"
            );


        if (!modal) {

            return;

        }


        modal.setAttribute(
            "hidden",
            ""
        );


        document.body.classList.remove(
            "recipe-modal-open"
        );

    }


    /* =====================================================
       H2 — FORM ERROR
    ===================================================== */

    function showFormError(message) {

        const box =
            document.getElementById(
                "recipeFormError"
            );


        if (!box) {

            return;

        }


        const text =
            box.querySelector(
                "span"
            );


        if (text) {

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
       H2 — SAVE RECIPE
    ===================================================== */

    async function saveRecipe() {

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
            buttonText?.textContent ||
            "Simpan Recipe";


        const name =
            document.getElementById(
                "recipeName"
            ).value.trim();


        const code =
            document.getElementById(
                "recipeCode"
            ).value.trim().toUpperCase();


        const productId =
            document.getElementById(
                "recipeProduct"
            ).value;


        const recipeType =
            document.getElementById(
                "recipeType"
            ).value;


        const description =
            document.getElementById(
                "recipeDescription"
            ).value.trim();


        const yieldQuantity =
            Number(
                document.getElementById(
                    "recipeYield"
                ).value
            );


        const yieldUnitId =
            document.getElementById(
                "recipeYieldUnit"
            ).value;


        const fermentationRequired =
            document.getElementById(
                "fermentationRequired"
            ).checked;


        const f1Target =
            fermentationRequired
                ? Number(
                    document.getElementById(
                        "f1TargetDays"
                    ).value
                )
                : 0;


        const f2Target =
            fermentationRequired
                ? Number(
                    document.getElementById(
                        "f2TargetDays"
                    ).value
                )
                : 0;


        const shelfLife =
            Number(
                document.getElementById(
                    "recipeShelfLife"
                ).value
            );


        const notes =
            document.getElementById(
                "recipeNotes"
            ).value.trim();


        /* -------------------------------------------------
           VALIDATION
        ------------------------------------------------- */

        if (!name) {

            showFormError(
                "Nama recipe wajib diisi."
            );

            return;

        }


        if (!code) {

            showFormError(
                "Recipe code wajib diisi."
            );

            return;

        }


        if (!productId) {

            showFormError(
                "Product wajib dipilih."
            );

            return;

        }


        if (
            !yieldQuantity ||
            yieldQuantity <= 0
        ) {

            showFormError(
                "Yield harus lebih besar dari 0."
            );

            return;

        }


        if (!yieldUnitId) {

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


        if (!rows.length) {

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
                )?.value;


            const quantity =
                Number(
                    row.querySelector(
                        ".recipe-ingredient-qty"
                    )?.value
                );


            const unitId =
                row.querySelector(
                    ".recipe-ingredient-unit"
                )?.value;


            if (!ingredientId) {

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


            if (!unitId) {

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


        /* -------------------------------------------------
           BUTTON LOADING
        ------------------------------------------------- */

        if (button) {

            button.disabled =
                true;

            button.classList.add(
                "is-loading"
            );

        }


        if (buttonText) {

            buttonText.textContent =
                "Menyimpan...";

        }


        waitForSupabase(
            async supabase => {

                let createdRecipeId =
                    null;


                try {

                    /* =====================================
                       STEP 1
                       CREATE RECIPE
                    ===================================== */

                    const {
                        data: recipe,
                        error: recipeError
                    } = await supabase

                        .from("recipes")

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


                    if (recipeError) {

                        throw recipeError;

                    }


                    createdRecipeId =
                        recipe.id;


                    /* =====================================
                       STEP 2
                       CREATE VERSION 1
                    ===================================== */

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


                    if (versionError) {

                        throw versionError;

                    }


                    /* =====================================
                       STEP 3
                       CREATE INGREDIENTS
                    ===================================== */

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


                    if (ingredientError) {

                        throw ingredientError;

                    }


                    /* =====================================
                       SUCCESS
                    ===================================== */

                    closeRecipeModal();

                    await loadRecipes();

                    showSuccessMessage(
                        "Recipe berhasil dibuat."
                    );

                }
                catch (error) {

                    console.error(
                        "CREATE RECIPE ERROR:",
                        error
                    );


                    /*
                     * Best effort rollback.
                     */

                    if (createdRecipeId) {

                        try {

                            await supabase
                                .from("recipes")
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

                    if (button) {

                        button.disabled =
                            false;

                        button.classList.remove(
                            "is-loading"
                        );

                    }


                    if (buttonText) {

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

    function showSuccessMessage(message) {

        let toast =
            document.getElementById(
                "recipeSuccessToast"
            );


        if (!toast) {

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
                ${escapeHtml(message)}
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

    async function openRecipeDetail(id) {

        activeDetailRecipeId =
            id;


        const modal =
            document.getElementById(
                "recipeDetailModal"
            );


        if (!modal) {

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

                    /* =====================================
                       1. LOAD RECIPE
                    ===================================== */

                    const {
                        data: recipe,
                        error: recipeError
                    } = await supabase

                        .from("recipes")

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


                    if (recipeError) {

                        throw recipeError;

                    }


                    /* =====================================
                       2. LOAD PRODUCT
                    ===================================== */

                    let product = null;


                    if (recipe.product_id) {

                        const {
                            data,
                            error
                        } = await supabase

                            .from("products")

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


                        if (error) {

                            throw error;

                        }


                        product =
                            data;

                    }


                    /* =====================================
                       3. LOAD VERSION
                    ===================================== */

                    const {
                        data: versions,
                        error: versionError
                    } = await supabase

                        .from(
                            "recipe_versions"
                        )

                        .select(`
                            id,
                            version_number,
                            yield_quantity,
                            yield_unit_id,
                            fermentation_required,
                            f1_target_days,
                            f2_target_days,
                            shelf_life_days,
                            notes,
                            status
                        `)

                        .eq(
                            "recipe_id",
                            id
                        )

                        .order(
                            "version_number",
                            {
                                ascending: false
                            }
                        );


                    if (versionError) {

                        throw versionError;

                    }


                    const version =
                        Array.isArray(versions) &&
                        versions.length
                            ? versions[0]
                            : null;


                    /* =====================================
                       4. LOAD YIELD UNIT
                    ===================================== */

                    let yieldUnit = null;


                    if (
                        version?.yield_unit_id
                    ) {

                        const {
                            data,
                            error
                        } = await supabase

                            .from("units")

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


                        if (error) {

                            throw error;

                        }


                        yieldUnit =
                            data;

                    }


                    /* =====================================
                       5. LOAD INGREDIENT ROWS
                    ===================================== */

                    let recipeIngredients =
                        [];


                    if (version?.id) {

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


                        if (error) {

                            throw error;

                        }


                        recipeIngredients =
                            data || [];

                    }


                    /* =====================================
                       6. LOAD INGREDIENT MASTER DATA
                    ===================================== */

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
                                        .filter(Boolean)
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
                                        .filter(Boolean)
                                )
                            ];


                        let ingredientMap =
                            new Map();


                        let unitMap =
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


                            if (error) {

                                throw error;

                            }


                            (data || [])
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

                                .from("units")

                                .select(`
                                    id,
                                    code,
                                    name
                                `)

                                .in(
                                    "id",
                                    unitIds
                                );


                            if (error) {

                                throw error;

                            }


                            (data || [])
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
                                        ) || null,

                                    unit:
                                        unitMap.get(
                                            String(
                                                item.unit_id
                                            )
                                        ) || null

                                })
                            );

                    }


                    /* =====================================
                       7. RENDER
                    ===================================== */

                    renderRecipeDetail({

                        recipe,

                        product,

                        version,

                        yieldUnit,

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
                catch (error) {

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

    function renderRecipeDetail(data) {

        const {
            recipe,
            product,
            version,
            yieldUnit,
            ingredients: recipeIngredients
        } = data;


        /* ---------------------------------------------
           HEADER
        --------------------------------------------- */

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


        /* ---------------------------------------------
           IDENTITY
        --------------------------------------------- */

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


        /* ---------------------------------------------
           STATUS
        --------------------------------------------- */

        const status =
            String(
                recipe.status ||
                "active"
            ).toLowerCase();


        const statusElement =
            document.getElementById(
                "detailRecipeStatus"
            );


        if (statusElement) {

            statusElement.textContent =
                status === "archived"
                    ? "Archived"
                    : "Active";


            statusElement.className =
                `recipe-status ${status}`;

        }


        /* ---------------------------------------------
           DESCRIPTION
        --------------------------------------------- */

        const descriptionBox =
            document.getElementById(
                "detailRecipeDescriptionBox"
            );


        const description =
            recipe.description ||
            "";


        if (description) {

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


        /* ---------------------------------------------
           VERSION
        --------------------------------------------- */

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


        /* ---------------------------------------------
           F1 / F2
        --------------------------------------------- */

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


        /* ---------------------------------------------
           INGREDIENTS
        --------------------------------------------- */

        renderRecipeDetailIngredients(
            recipeIngredients
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


        if (element) {

            element.textContent =
                value ??
                "—";

        }

    }


    function renderRecipeDetailIngredients(
        recipeIngredients
    ) {

        const container =
            document.getElementById(
                "recipeDetailIngredients"
            );


        if (!container) {

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
                    (item, index) => {

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
                                    ${index + 1}
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


        if (!error) {

            return;

        }


        const text =
            error.querySelector(
                "span"
            );


        if (text) {

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
       H3 — EDIT
       -----------------------------------------------------
       Untuk H3 kita belum overwrite formula.
       Edit master information akan kita sambungkan
       ke Edit Form setelah detail sudah tervalidasi.
    ===================================================== */

    function handleEditRecipe() {

        if (!activeDetailRecipeId) {

            return;

        }


        closeRecipeDetail();


        alert(
            "Edit Recipe akan kita sambungkan pada form Edit H3."
        );

    }


    /* =====================================================
       H4 PLACEHOLDER
    ===================================================== */

    function handleNewRecipeVersion() {

        if (!activeDetailRecipeId) {

            return;

        }


        alert(
            "Recipe Version akan kita kerjakan pada H4."
        );

    }


    /* =====================================================
       RECIPE ACTIONS
    ===================================================== */

    function handleRecipeAction(
        action,
        id
    ) {

        if (!id) {

            return;

        }


        const recipe =
            recipes.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!recipe) {

            return;

        }


        switch (action) {

            case "view":

                openRecipeDetail(
                    id
                );

                break;


            case "edit":

                /*
                 * H3 Edit akan menggunakan
                 * master recipe information.
                 */

                openRecipeDetail(
                    id
                );

                break;


            case "version":

                openRecipeDetail(
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

        /* ---------------------------------------------
           SEARCH
        --------------------------------------------- */

        document
            .getElementById(
                "recipeSearch"
            )
            ?.addEventListener(
                "input",
                applyFilters
            );


        /* ---------------------------------------------
           STATUS FILTER
        --------------------------------------------- */

        document
            .getElementById(
                "recipeStatusFilter"
            )
            ?.addEventListener(
                "change",
                applyFilters
            );


        /* ---------------------------------------------
           RETRY
        --------------------------------------------- */

        document
            .getElementById(
                "recipeRetryButton"
            )
            ?.addEventListener(
                "click",
                loadRecipes
            );


        /* ---------------------------------------------
           CREATE RECIPE
        --------------------------------------------- */

        document
            .getElementById(
                "createRecipeButton"
            )
            ?.addEventListener(
                "click",
                openRecipeModal
            );


        /* ---------------------------------------------
           CLOSE CREATE MODAL
        --------------------------------------------- */

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


        /* ---------------------------------------------
           ADD INGREDIENT
        --------------------------------------------- */

        document
            .getElementById(
                "addIngredientButton"
            )
            ?.addEventListener(
                "click",
                addIngredientRow
            );


        /* ---------------------------------------------
           FERMENTATION
        --------------------------------------------- */

        document
            .getElementById(
                "fermentationRequired"
            )
            ?.addEventListener(
                "change",
                updateFermentationVisibility
            );


        /* ---------------------------------------------
           AUTO RECIPE CODE
        --------------------------------------------- */

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


        /* ---------------------------------------------
           CREATE FORM SUBMIT
        --------------------------------------------- */

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


        /* ---------------------------------------------
           DETAIL MODAL CLOSE
        --------------------------------------------- */

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


        /* ---------------------------------------------
           DETAIL → EDIT
        --------------------------------------------- */

        document
            .getElementById(
                "editRecipeFromDetail"
            )
            ?.addEventListener(
                "click",
                handleEditRecipe
            );


        /* ---------------------------------------------
           DETAIL → NEW VERSION
        --------------------------------------------- */

        document
            .getElementById(
                "newRecipeVersionFromDetail"
            )
            ?.addEventListener(
                "click",
                handleNewRecipeVersion
            );


        /* ---------------------------------------------
           GLOBAL RECIPE ACTION
        --------------------------------------------- */

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (!button) {

                    return;

                }


                handleRecipeAction(
                    button.dataset.action,
                    button.dataset.id
                );

            }
        );


        /* ---------------------------------------------
           ESCAPE
        --------------------------------------------- */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape"
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
