/* =========================================================
   MERAMU PRODUCTION BATCH MASTER
   P1
========================================================= */


/* =========================================================
   STATE
========================================================= */

let productionBatches = [];

let productionProducts = [];

let productionRecipes = [];

let productionUnits = [];

let productionRecipeVersions = [];

let activeStatusFilter = "all";

let activeDetailBatch = null;

let activeDetailInitialQC = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initProductionPage();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initProductionPage(){

    bindProductionEvents();

    setDefaultProductionDate();

    await loadProductionPage();

    if(window.lucide){

        lucide.createIcons();

    }

}


/* =========================================================
   WAIT SUPABASE
========================================================= */

function waitForProductionSupabase(){

    return new Promise(
        (
            resolve,
            reject
        ) => {

            let attempts = 0;

            const maxAttempts = 100;

            const timer =
                setInterval(
                    () => {

                        attempts++;

                        if(
                            window.supabaseClient
                        ){

                            clearInterval(timer);

                            resolve(
                                window.supabaseClient
                            );

                            return;

                        }


                        /*
                         * Beberapa versi supabase.js
                         * menggunakan window.supabase.
                         */

                        if(
                            window.meramuSupabase
                        ){

                            clearInterval(timer);

                            resolve(
                                window.meramuSupabase
                            );

                            return;

                        }


                        if(
                            attempts >=
                            maxAttempts
                        ){

                            clearInterval(timer);

                            reject(
                                new Error(
                                    "Supabase client belum tersedia."
                                )
                            );

                        }

                    },
                    100
                );

        }
    );

}


/* =========================================================
   LOAD PAGE
========================================================= */

async function loadProductionPage(){

    setProductionLoading(true);

    hideProductionError();

    try{

        const supabase =
            await waitForProductionSupabase();


        await Promise.all([
            loadProducts(supabase),
            loadRecipes(supabase),
            loadUnits(supabase),
            loadBatches(supabase)
        ]);


        populateProductSelect();

        renderProduction();


    }
    catch(error){

        console.error(
            "MERAMU Production Load Error:",
            error
        );

        showProductionError(
            getErrorMessage(error)
        );

    }
    finally{

        setProductionLoading(false);

    }

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts(
    supabase
){

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
            name,
            product_type,
            category,
            shelf_life_days,
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
        );


    if(error){

        throw error;

    }


    productionProducts =
        Array.isArray(data)
            ? data
            : [];

}


/* =========================================================
   LOAD RECIPES
========================================================= */

async function loadRecipes(
    supabase
){

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
            current_version_number
        `)

        .order(
            "name",
            {
                ascending: true
            }
        );


    if(error){

        throw error;

    }


    productionRecipes =
        Array.isArray(data)
            ? data
            : [];

}


/* =========================================================
   LOAD UNITS
========================================================= */

async function loadUnits(
    supabase
){

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

        .order(
            "name",
            {
                ascending: true
            }
        );


    if(error){

        throw error;

    }


    productionUnits =
        Array.isArray(data)
            ? data
            : [];

}


/* =========================================================
   LOAD BATCHES
========================================================= */

async function loadBatches(
    supabase
){

    const {
        data,
        error
    } = await supabase

        .from(
            "batches"
        )

        .select(`
            id,
            batch_code,
            product_id,
            recipe_id,
            recipe_version_id,
            production_date,
            target_date,
            expiry_date,
            best_before_date,
            planned_volume,
            actual_volume,
            volume_unit_id,
            current_stage,
            status,
            f1_started_at,
            f1_completed_at,
            f2_started_at,
            f2_completed_at,
            hpp_total,
            hpp_per_unit,
            notes,
            created_at,
            updated_at,

            products (
                id,
                code,
                name,
                product_type
            ),

            recipes (
                id,
                code,
                name
            ),

            recipe_versions (
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
                status
            ),

            units (
                id,
                code,
                name,
                category
            )
        `)

        .order(
            "production_date",
            {
                ascending: false
            }
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if(error){

        throw error;

    }


    productionBatches =
        Array.isArray(data)
            ? data
            : [];

}


/* =========================================================
   EVENTS
========================================================= */

function bindProductionEvents(){

    const openButton =
        document.getElementById(
            "openCreateBatchBtn"
        );

    if(openButton){

        openButton.addEventListener(
            "click",
            openCreateBatchModal
        );

    }


    const emptyButton =
        document.getElementById(
            "emptyCreateBatchBtn"
        );

    if(emptyButton){

        emptyButton.addEventListener(
            "click",
            openCreateBatchModal
        );

    }


    const refreshButton =
        document.getElementById(
            "refreshProductionBtn"
        );

    if(refreshButton){

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadProductionPage();

            }
        );

    }


    const retryButton =
        document.getElementById(
            "retryProductionBtn"
        );

    if(retryButton){

        retryButton.addEventListener(
            "click",
            async () => {

                await loadProductionPage();

            }
        );

    }


    const searchInput =
        document.getElementById(
            "productionSearch"
        );

    if(searchInput){

        searchInput.addEventListener(
            "input",
            renderProduction
        );

    }


    document
        .querySelectorAll(
            "[data-status-filter]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        activeStatusFilter =
                            button.dataset.statusFilter ||
                            "all";


                        document
                            .querySelectorAll(
                                "[data-status-filter]"
                            )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );

                                }
                            );


                        renderProduction();

                    }
                );

            }
        );


    const closeCreate =
        document.getElementById(
            "closeCreateBatchBtn"
        );

    if(closeCreate){

        closeCreate.addEventListener(
            "click",
            closeCreateBatchModal
        );

    }


    const cancelCreate =
        document.getElementById(
            "cancelCreateBatchBtn"
        );

    if(cancelCreate){

        cancelCreate.addEventListener(
            "click",
            closeCreateBatchModal
        );

    }


    const createForm =
        document.getElementById(
            "createBatchForm"
        );

    if(createForm){

        createForm.addEventListener(
            "submit",
            handleCreateBatch
        );

    }


    const productSelect =
        document.getElementById(
            "batchProduct"
        );

    if(productSelect){

        productSelect.addEventListener(
            "change",
            handleProductChange
        );

    }


    const recipeSelect =
        document.getElementById(
            "batchRecipe"
        );

    if(recipeSelect){

        recipeSelect.addEventListener(
            "change",
            handleRecipeChange
        );

    }


    const closeDetail =
        document.getElementById(
            "closeBatchDetailBtn"
        );

    if(closeDetail){

        closeDetail.addEventListener(
            "click",
            closeBatchDetailModal
        );

    }


    const closeDetailBottom =
        document.getElementById(
            "closeBatchDetailBottomBtn"
        );

    if(closeDetailBottom){

        closeDetailBottom.addEventListener(
            "click",
            closeBatchDetailModal
        );

    }


    const startF1FromDetail =
        document.getElementById(
            "startF1FromDetailBtn"
        );

    if(startF1FromDetail){

        startF1FromDetail.addEventListener(
            "click",
            () => {

                if(
                    activeDetailBatch?.id
                ){

                    startBatchF1(
                        activeDetailBatch.id
                    );

                }

            }
        );

    }


    /* =====================================================
       INITIAL QC EVENTS
    ===================================================== */

    const openInitialQCButton =
        document.getElementById(
            "openInitialQCBtn"
        );

    if(openInitialQCButton){

        openInitialQCButton.addEventListener(
            "click",
            openInitialQCModal
        );

    }


    const closeInitialQCButton =
        document.getElementById(
            "closeInitialQCBtn"
        );

    if(closeInitialQCButton){

        closeInitialQCButton.addEventListener(
            "click",
            closeInitialQCModal
        );

    }


    const cancelInitialQCButton =
        document.getElementById(
            "cancelInitialQCBtn"
        );

    if(cancelInitialQCButton){

        cancelInitialQCButton.addEventListener(
            "click",
            closeInitialQCModal
        );

    }


    const initialQCForm =
        document.getElementById(
            "initialQCForm"
        );

    if(initialQCForm){

        initialQCForm.addEventListener(
            "submit",
            saveInitialQC
        );

    }

    document.addEventListener(
        "keydown",
        handleProductionKeydown
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleProductionKeydown(
    event
){

    if(
        event.key !==
        "Escape"
    ){

        return;

    }

    const createModal =
        document.getElementById(
            "createBatchModal"
        );

    const detailModal =
        document.getElementById(
            "batchDetailModal"
        );

    const initialQCModal =
        document.getElementById(
            "initialQCModal"
        );


    if(
        createModal &&
        !createModal.classList.contains(
            "hidden"
        )
    ){

        closeCreateBatchModal();

        return;

    }


    if(
        initialQCModal &&
        !initialQCModal.classList.contains(
            "hidden"
        )
    ){

        closeInitialQCModal();

        return;

    }


    if(
        detailModal &&
        !detailModal.classList.contains(
            "hidden"
        )
    ){

        closeBatchDetailModal();

    }

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultProductionDate(){

    const input =
        document.getElementById(
            "batchProductionDate"
        );

    if(!input){

        return;

    }


    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            now.getDate()
        )
            .padStart(
                2,
                "0"
            );


    input.value =
        `${year}-${month}-${day}`;

}


/* =========================================================
   PRODUCT SELECT
========================================================= */

function populateProductSelect(){

    const select =
        document.getElementById(
            "batchProduct"
        );

    if(!select){

        return;

    }


    select.innerHTML =
        `
        <option value="">
            Pilih Product
        </option>
        `;


    productionProducts
        .forEach(
            product => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    product.id;


                option.textContent =
                    `${product.name} — ${product.code}`;


                select.appendChild(
                    option
                );

            }
        );

}


/* =========================================================
   PRODUCT CHANGE
========================================================= */

function handleProductChange(){

    const productId =
        document.getElementById(
            "batchProduct"
        )?.value;


    const recipeSelect =
        document.getElementById(
            "batchRecipe"
        );


    const versionSelect =
        document.getElementById(
            "batchRecipeVersion"
        );


    if(!recipeSelect){

        return;

    }


    recipeSelect.innerHTML =
        `
        <option value="">
            Pilih Recipe
        </option>
        `;


    if(versionSelect){

        versionSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe Version
            </option>
            `;

        versionSelect.disabled = true;

    }


    if(!productId){

        recipeSelect.disabled = true;

        return;

    }


    const recipes =
        productionRecipes
            .filter(
                recipe =>
                    String(
                        recipe.product_id
                    ) ===
                    String(
                        productId
                    )
            );


    recipes
        .forEach(
            recipe => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    recipe.id;


                option.textContent =
                    `${recipe.name} — ${recipe.code}`;


                recipeSelect.appendChild(
                    option
                );

            }
        );


    recipeSelect.disabled =
        recipes.length === 0;

}


/* =========================================================
   RECIPE CHANGE
========================================================= */

async function handleRecipeChange(){

    const recipeId =
        document.getElementById(
            "batchRecipe"
        )?.value;


    const versionSelect =
        document.getElementById(
            "batchRecipeVersion"
        );


    if(!versionSelect){

        return;

    }


    versionSelect.innerHTML =
        `
        <option value="">
            Pilih Recipe Version
        </option>
        `;


    versionSelect.disabled =
        true;


    if(!recipeId){

        return;

    }


    try{

        const supabase =
            await waitForProductionSupabase();


        const {
            data,
            error
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
                status
            `)

            .eq(
                "recipe_id",
                recipeId
            )

            .order(
                "version_number",
                {
                    ascending: false
                }
            );


        if(error){

            throw error;

        }


        productionRecipeVersions =
            Array.isArray(data)
                ? data
                : [];


        productionRecipeVersions
            .forEach(
                version => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        version.id;


                    option.textContent =
                        `V${version.version_number}`;


                    versionSelect.appendChild(
                        option
                    );

                }
            );


        versionSelect.disabled =
            productionRecipeVersions.length === 0;


    }
    catch(error){

        console.error(
            "MERAMU Recipe Version Load Error:",
            error
        );

        versionSelect.innerHTML =
            `
            <option value="">
                Gagal memuat version
            </option>
            `;

    }

}


/* =========================================================
   CREATE BATCH MODAL
========================================================= */

function openCreateBatchModal(){

    const modal =
        document.getElementById(
            "createBatchModal"
        );

    if(!modal){

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );


    resetCreateBatchForm();

}


function closeCreateBatchModal(){

    const modal =
        document.getElementById(
            "createBatchModal"
        );

    if(modal){

        modal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );

}


function resetCreateBatchForm(){

    const form =
        document.getElementById(
            "createBatchForm"
        );

    if(form){

        form.reset();

    }


    const recipeSelect =
        document.getElementById(
            "batchRecipe"
        );

    if(recipeSelect){

        recipeSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe
            </option>
            `;

        recipeSelect.disabled =
            true;

    }


    const versionSelect =
        document.getElementById(
            "batchRecipeVersion"
        );

    if(versionSelect){

        versionSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe Version
            </option>
            `;

        versionSelect.disabled =
            true;

    }


    const productionDate =
        document.getElementById(
            "batchProductionDate"
        );

if(productionDate){

    setDefaultProductionDate();

}


populateVolumeUnitSelect();


clearCreateBatchError();

}

/* =========================================================
   UNIT SELECT
========================================================= */

function populateVolumeUnitSelect(){

    const select =
        document.getElementById(
            "batchVolumeUnit"
        );

    if(!select){

        return;

    }

    select.innerHTML = `
        <option value="">
            Pilih Unit
        </option>
    `;

    productionUnits.forEach(
        unit => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                unit.id;

            option.textContent =
                `${unit.name} (${unit.code})`;

            select.appendChild(
                option
            );

        }
    );

}

/* =========================================================
   CREATE BATCH
========================================================= */

async function handleCreateBatch(
    event
){

    event.preventDefault();


    clearCreateBatchError();


    const productId =
        document.getElementById(
            "batchProduct"
        )?.value;


    const recipeId =
        document.getElementById(
            "batchRecipe"
        )?.value;


    const recipeVersionId =
        document.getElementById(
            "batchRecipeVersion"
        )?.value;


    const productionDate =
        document.getElementById(
            "batchProductionDate"
        )?.value;


    const plannedVolume =
        document.getElementById(
            "batchPlannedVolume"
        )?.value;


    const volumeUnitId =
        document.getElementById(
            "batchVolumeUnit"
        )?.value;


    const notes =
        document.getElementById(
            "batchNotes"
        )?.value
        ?.trim() || null;


    if(!productId){

        showCreateBatchError(
            "Product wajib dipilih."
        );

        return;

    }


    if(!recipeId){

        showCreateBatchError(
            "Recipe wajib dipilih."
        );

        return;

    }


    if(!recipeVersionId){

        showCreateBatchError(
            "Recipe Version wajib dipilih."
        );

        return;

    }


    if(!productionDate){

        showCreateBatchError(
            "Tanggal produksi wajib diisi."
        );

        return;

    }


    if(
        plannedVolume === "" ||
        plannedVolume === null ||
        Number.isNaN(
            Number(
                plannedVolume
            )
        ) ||
        Number(
            plannedVolume
        ) <= 0
    ){

        showCreateBatchError(
            "Planned volume harus lebih besar dari 0."
        );

        return;

    }


    if(!volumeUnitId){

        showCreateBatchError(
            "Satuan volume wajib dipilih."
        );

        return;

    }


    const selectedVersion =
        productionRecipeVersions
            .find(
                version =>
                    String(
                        version.id
                    ) ===
                    String(
                        recipeVersionId
                    )
            );


    if(
        selectedVersion &&
        String(
            selectedVersion.recipe_id
        ) !==
        String(
            recipeId
        )
    ){

        showCreateBatchError(
            "Recipe Version tidak sesuai dengan Recipe yang dipilih."
        );

        return;

    }


    const submitButton =
        document.querySelector(
            "#createBatchForm button[type='submit']"
        );


    try{

        if(submitButton){

            submitButton.disabled =
                true;

            submitButton.innerHTML =
                `
                <span class="production-button-loader"></span>
                <span>Menyimpan...</span>
                `;

        }


        const supabase =
            await waitForProductionSupabase();


        const payload = {

            product_id:
                productId,

            recipe_id:
                recipeId,

            recipe_version_id:
                recipeVersionId,

            production_date:
                productionDate,

            planned_volume:
                Number(
                    plannedVolume
                ),

            volume_unit_id:
                volumeUnitId,

            current_stage:
                "production",

            status:
                "active",

            hpp_total:
                0,

            hpp_per_unit:
                0,

            notes:
                notes

        };


        const {
            data,
            error
        } = await supabase

            .from(
                "batches"
            )

            .insert(
                payload
            )

            .select(`
                id,
                batch_code,
                product_id,
                recipe_id,
                recipe_version_id,
                production_date,
                target_date,
                expiry_date,
                best_before_date,
                planned_volume,
                actual_volume,
                volume_unit_id,
                current_stage,
                status,
                f1_started_at,
                f1_completed_at,
                f2_started_at,
                f2_completed_at,
                hpp_total,
                hpp_per_unit,
                notes,
                created_at,
                updated_at,

                products (
                    id,
                    code,
                    name,
                    product_type
                ),

                recipes (
                    id,
                    code,
                    name
                ),

                recipe_versions (
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
                    status
                ),

                units (
                    id,
                    code,
                    name,
                    category
                )
            `)

            .single();


        if(error){

            throw error;

        }


await loadBatches(supabase);

closeCreateBatchModal();

renderProduction();

alert(
    "Batch berhasil dibuat."
);


    }
    catch(error){

        console.error(
            "MERAMU Create Batch Error:",
            error
        );

        showCreateBatchError(
            getErrorMessage(error)
        );

    }
    finally{

        if(submitButton){

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                `
                <i data-lucide="plus"></i>
                <span>Buat Batch</span>
                `;

            if(window.lucide){

                lucide.createIcons();

            }

        }

    }

}


/* =========================================================
   PRODUCTION RENDER
========================================================= */

function renderProduction(){

    const searchInput =
        document.getElementById(
            "productionSearch"
        );


    const search =
        searchInput?.value
            ?.trim()
            .toLowerCase() ||
        "";


    let rows =
        Array.isArray(
            productionBatches
        )
            ? [...productionBatches]
            : [];


    if(
        activeStatusFilter &&
        activeStatusFilter !==
        "all"
    ){

        rows =
            rows.filter(
                batch =>
                    String(
                        batch.status || ""
                    ).toLowerCase() ===
                    String(
                        activeStatusFilter
                    ).toLowerCase()
            );

    }


    if(search){

        rows =
            rows.filter(
                batch => {

                    const productName =
                        batch.products?.name ||
                        "";

                    const productCode =
                        batch.products?.code ||
                        "";

                    const batchCode =
                        batch.batch_code ||
                        "";

                    const recipeName =
                        batch.recipes?.name ||
                        "";

                    const recipeCode =
                        batch.recipes?.code ||
                        "";


                    const haystack =
                        `
                        ${batchCode}
                        ${productName}
                        ${productCode}
                        ${recipeName}
                        ${recipeCode}
                        `
                            .toLowerCase();


                    return haystack.includes(
                        search
                    );

                }
            );

    }


    updateProductionSummary();


    const tableWrap =
        document.getElementById(
            "productionTableWrap"
        );


    const emptyState =
        document.getElementById(
            "productionEmpty"
        );


    if(!rows.length){

        tableWrap?.classList.add(
            "hidden"
        );


        emptyState?.classList.remove(
            "hidden"
        );


        return;

    }


    emptyState?.classList.add(
        "hidden"
    );


    tableWrap?.classList.remove(
        "hidden"
    );


    const tbody =
        document.getElementById(
            "productionTableBody"
        );


    if(!tbody){

        return;

    }


    tbody.innerHTML =
        rows
            .map(
                createProductionRow
            )
            .join("");


    bindProductionActionEvents();


    if(window.lucide){

        lucide.createIcons();

    }

}

/* =========================================================
   PRODUCTION ROW
========================================================= */

function createProductionRow(
    batch
){

    const product =
        batch.products ||
        {};

    const recipe =
        batch.recipes ||
        {};

    const version =
        batch.recipe_versions ||
        {};

    const unit =
        batch.units ||
        {};

    const stage =
        String(
            batch.current_stage ||
            "production"
        ).toLowerCase();

    const status =
        String(
            batch.status ||
            "active"
        ).toLowerCase();


    const canStartF1 =
        stage === "production" &&
        status !== "cancelled" &&
        status !== "completed";


    return `
        <tr
            data-batch-id="${escapeHtml(
                batch.id
            )}"
        >

            <!-- BATCH -->

            <td>

                <div class="production-batch-code">

                    ${escapeHtml(
                        batch.batch_code ||
                        "-"
                    )}

                </div>

                <div class="production-row-meta">

                    ${escapeHtml(
                        formatProductionDate(
                            batch.production_date
                        )
                    )}

                </div>

            </td>


            <!-- PRODUCT -->

            <td>

                <div class="production-product-name">

                    ${escapeHtml(
                        product.name ||
                        "-"
                    )}

                </div>

                <div class="production-row-meta">

                    ${escapeHtml(
                        product.code ||
                        "-"
                    )}

                </div>

            </td>


            <!-- RECIPE -->

            <td>

                <div class="production-recipe-name">

                    ${escapeHtml(
                        recipe.name ||
                        "-"
                    )}

                </div>

                <div class="production-row-meta">

                    ${escapeHtml(
                        recipe.code ||
                        "-"
                    )}

                </div>

            </td>


            <!-- VERSION -->

            <td>

                <div class="production-row-meta">

                    ${
                        version.version_number
                            ? `V${escapeHtml(
                                version.version_number
                            )}`
                            : "-"
                    }

                </div>

            </td>


            <!-- PRODUCTION DATE -->

            <td>

                ${escapeHtml(
                    formatProductionDate(
                        batch.production_date
                    )
                )}

            </td>


            <!-- VOLUME -->

            <td>

                <div class="production-volume-main">

                    ${escapeHtml(
                        formatProductionNumber(
                            batch.planned_volume
                        )
                    )}

                    ${
                        unit.code
                            ? ` ${escapeHtml(
                                unit.code
                            )}`
                            : ""
                    }

                </div>

                <div class="production-row-meta">

                    Aktual:
                    ${escapeHtml(
                        formatProductionNumber(
                            batch.actual_volume
                        )
                    )}

                    ${
                        unit.code
                            ? ` ${escapeHtml(
                                unit.code
                            )}`
                            : ""
                    }

                </div>

            </td>


            <!-- STAGE -->

            <td>

                <span
                    class="production-stage-badge production-stage-${escapeHtml(
                        stage
                    )}"
                >

                    ${escapeHtml(
                        getProductionStageLabel(
                            stage
                        )
                    )}

                </span>

            </td>


            <!-- STATUS -->

            <td>

                <span
                    class="production-status-badge production-status-${escapeHtml(
                        status
                    )}"
                >

                    ${escapeHtml(
                        getProductionStatusLabel(
                            status
                        )
                    )}

                </span>

            </td>


            <!-- ACTION -->

<td class="production-action-cell">

    <div class="production-action-group">

        <!-- DETAIL -->

        <button
            type="button"
            class="production-action-btn production-action-btn-detail"
            data-production-action="detail"
            data-batch-id="${escapeHtml(
                batch.id
            )}"
            title="Lihat Detail Batch"
            aria-label="Lihat detail batch"
        >

            <i data-lucide="eye"></i>

            <span class="production-action-label">
                Detail
            </span>

        </button>


        <!-- START F1 -->

        ${
            canStartF1
                ? `
                    <button
                        type="button"
                        class="production-action-btn production-action-btn-f1"
                        data-production-action="start-f1"
                        data-batch-id="${escapeHtml(
                            batch.id
                        )}"
                        title="Mulai F1"
                        aria-label="Mulai F1"
                    >

                        <i data-lucide="play"></i>

                        <span>
                            Mulai F1
                        </span>

                    </button>
                  `
                : ""
        }

    </div>

</td>

        </tr>
    `;

}


/* =========================================================
   ACTION EVENTS
========================================================= */

function bindProductionActionEvents(){

    document
        .querySelectorAll(
            "[data-production-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.productionAction;

                        const batchId =
                            button.dataset.batchId;


                        const batch =
                            productionBatches
                                .find(
                                    item =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            batchId
                                        )
                                );


                        if(!batch){

                            return;

                        }


                        if(
                            action ===
                            "detail"
                        ){

                            openBatchDetail(
                                batch
                            );

                            return;

                        }


                        if(
                            action ===
                            "start-f1"
                        ){

                            startBatchF1(
                                batch.id
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   START F1
========================================================= */

async function startBatchF1(
    batchId
){

    const batch =
        productionBatches
            .find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        batchId
                    )
            );


    if(!batch){

        alert(
            "Batch tidak ditemukan."
        );

        return;

    }


    if(
        batch.current_stage !==
        "production"
    ){

        alert(
            "Batch ini sudah tidak berada di tahap Production."
        );

        return;

    }


    if(
        batch.status ===
        "cancelled"
    ){

        alert(
            "Batch yang dibatalkan tidak dapat dimulai ke F1."
        );

        return;

    }


    if(
        batch.status ===
        "completed"
    ){

        alert(
            "Batch yang sudah selesai tidak dapat dimulai ke F1."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Mulai F1 untuk batch ${batch.batch_code || ""}?`
        );


    if(!confirmed){

        return;

    }


    try{

        const supabase =
            await waitForProductionSupabase();


        /*
         * F1 hanya boleh dimulai jika
         * Initial QC Production sudah PASS.
         */

        const {
            data: latestQC,
            error: qcError
        } = await supabase

            .from(
                "quality_checks"
            )

            .select(`
                id,
                batch_id,
                checked_at,
                stage,
                ph,
                brix,
                temperature_c,
                volume,
                decision,
                operator_name,
                notes
            `)

            .eq(
                "batch_id",
                batchId
            )

            .eq(
                "stage",
                "production"
            )

            .order(
                "checked_at",
                {
                    ascending: false
                }
            )

            .limit(
                1 );


        if(qcError){

            throw qcError;

        }


        const qc =
            Array.isArray(
                latestQC
            ) &&
            latestQC.length
                ? latestQC[0]
                : null;


        const decision =
            String(
                qc?.decision ||
                ""
            )
                .trim()
                .toLowerCase();


        if(
            decision !==
            "passed"
        ){

            alert(
                "Initial QC belum PASS. Silakan lakukan Initial QC terlebih dahulu sebelum memulai F1."
            );


            openBatchDetail(
                batch
            );


            setTimeout(
                () => {

                    openInitialQCModal();

                },
                150
            );


            return;

        }


        const {
            data,
            error
        } = await supabase

            .from(
                "batches"
            )

            .update({
                current_stage:
                    "f1",
                f1_started_at:
                    new Date().toISOString(),
                f1_completed_at:
                    null
            })

            .eq(
                "id",
                batchId
            )

            .eq(
                "current_stage",
                "production"
            )

            .select(`
                id,
                batch_code,
                current_stage,
                status,
                f1_started_at,
                f1_completed_at
            `)

            .single();


        if(error){

            throw error;

        }


        const index =
            productionBatches
                .findIndex(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            batchId
                        )
                );


        if(index !== -1){

            productionBatches[
                index
            ] = {

                ...productionBatches[
                    index
                ],

                ...data

            };

        }


        renderProduction();


        if(
            activeDetailBatch &&
            String(
                activeDetailBatch.id
            ) ===
            String(
                batchId
            )
        ){

            activeDetailBatch = {
                ...activeDetailBatch,
                ...data
            };


            openBatchDetail(
                activeDetailBatch
            );

        }


        alert(
            `Batch ${batch.batch_code || ""} berhasil dimulai ke F1.`
        );


    }
    catch(error){

        console.error(
            "MERAMU Start F1 Error:",
            error
        );


        alert(
            getErrorMessage(
                error
            )
        );

    }

}




/* =========================================================
   P4 — F1 TRACKING
========================================================= */

function formatF1DateTime(value){
    if(!value) return "—";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("id-ID", {
        day:"2-digit", month:"short", year:"numeric",
        hour:"2-digit", minute:"2-digit"
    });
}

function updateProductionF1Detail(batch){
    const statusEl = document.getElementById("detailF1Status");
    const startedEl = document.getElementById("detailF1StartedAt");
    const targetDaysEl = document.getElementById("detailF1TargetDays");
    const targetDateEl = document.getElementById("detailF1TargetDate");
    const progressTextEl = document.getElementById("detailF1ProgressText");
    const progressBarEl = document.getElementById("detailF1ProgressBar");
    const progressWrap = document.getElementById("detailF1ProgressWrap");
    const monitorBtn = document.getElementById("openF1MonitoringBtn");

    if(!statusEl) return;

    const stage = String(batch?.current_stage || "").toLowerCase();
    const started = batch?.f1_started_at || null;
    const targetDays = Number(batch?.recipe_versions?.f1_target_days ?? batch?.f1_target_days ?? 0);

    targetDaysEl.textContent = targetDays > 0 ? `${targetDays} hari` : "Belum diatur";
    startedEl.textContent = formatF1DateTime(started);

    if(stage !== "f1" || !started){
        statusEl.textContent = stage === "f2" ? "Selesai — masuk F2" : "Belum dimulai";
        targetDateEl.textContent = "—";
        progressTextEl.textContent = "—";
        progressBarEl.style.width = "0%";
        progressWrap?.classList.toggle("hidden", stage !== "f1");
        monitorBtn?.classList.toggle("hidden", stage !== "f1");
        return;
    }

    const start = new Date(started);
    const targetMs = targetDays > 0 ? targetDays * 86400000 : 0;
    const target = targetMs ? new Date(start.getTime() + targetMs) : null;
    const elapsedMs = Math.max(0, Date.now() - start.getTime());
    const elapsedDays = targetMs ? Math.floor(elapsedMs / 86400000) + 1 : 1;
    const percent = targetMs ? Math.min(100, Math.max(0, (elapsedMs / targetMs) * 100)) : 0;

    statusEl.textContent = "F1 ACTIVE";
    targetDateEl.textContent = target ? formatF1DateTime(target) : "—";
    progressTextEl.textContent = targetDays > 0 ? `Hari ${Math.min(elapsedDays, targetDays)} / ${targetDays}` : `Hari ${elapsedDays}`;
    progressBarEl.style.width = `${percent}%`;
    progressWrap?.classList.remove("hidden");

    if(monitorBtn){
        monitorBtn.href = `batch-detail.html?id=${encodeURIComponent(batch.batch_code || batch.code || batch.id)}`;
        monitorBtn.classList.remove("hidden");
    }
}

/* =========================================================
   P5 — F2 / BOTTLING TRACKING
========================================================= */
function formatF2DateTime(value){
    if(!value) return "—";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("id-ID", {
        day:"2-digit", month:"short", year:"numeric",
        hour:"2-digit", minute:"2-digit"
    });
}

function updateProductionF2Detail(batch){
    const statusEl = document.getElementById("detailF2Status");
    const startedEl = document.getElementById("detailF2StartedAt");
    const targetDaysEl = document.getElementById("detailF2TargetDays");
    const targetDateEl = document.getElementById("detailF2TargetDate");
    const progressTextEl = document.getElementById("detailF2ProgressText");
    const progressBarEl = document.getElementById("detailF2ProgressBar");
    const progressWrap = document.getElementById("detailF2ProgressWrap");
    const monitorBtn = document.getElementById("openF2MonitoringBtn");

    if(!statusEl) return;

    const stage = String(batch?.current_stage || "").toLowerCase();
    const started = batch?.f2_started_at || null;
    const targetDays = Number(batch?.recipe_versions?.f2_target_days ?? batch?.f2_target_days ?? 0);

    targetDaysEl.textContent = targetDays > 0 ? `${targetDays} hari` : "Belum diatur";
    startedEl.textContent = formatF2DateTime(started);

    if(stage !== "f2" || !started){
        statusEl.textContent = stage === "harvest" ? "Selesai — siap Harvest" : "Belum dimulai";
        targetDateEl.textContent = "—";
        progressTextEl.textContent = "—";
        progressBarEl.style.width = "0%";
        progressWrap?.classList.toggle("hidden", stage !== "f2");
        monitorBtn?.classList.toggle("hidden", stage !== "f2");
        return;
    }

    const start = new Date(started);
    const targetMs = targetDays > 0 ? targetDays * 86400000 : 0;
    const target = targetMs ? new Date(start.getTime() + targetMs) : null;
    const elapsedMs = Math.max(0, Date.now() - start.getTime());
    const elapsedDays = targetMs ? Math.floor(elapsedMs / 86400000) + 1 : 1;
    const percent = targetMs ? Math.min(100, Math.max(0, (elapsedMs / targetMs) * 100)) : 0;

    statusEl.textContent = "F2 ACTIVE / BOTTLING";
    targetDateEl.textContent = target ? formatF2DateTime(target) : "—";
    progressTextEl.textContent = targetDays > 0 ? `Hari ${Math.min(elapsedDays, targetDays)} / ${targetDays}` : `Hari ${elapsedDays}`;
    progressBarEl.style.width = `${percent}%`;
    progressWrap?.classList.remove("hidden");

    if(monitorBtn){
        monitorBtn.href = `batch-detail.html?id=${encodeURIComponent(batch.batch_code || batch.code || batch.id)}`;
        monitorBtn.classList.remove("hidden");
    }
}

/* =========================================================
   BATCH DETAIL
========================================================= */

function openBatchDetail(
    batch
){

    if(!batch){

        return;

    }


    activeDetailBatch =
        batch;


    const title =
        document.getElementById(
            "batchDetailTitle"
        );


    if(title){

        title.textContent =
            batch.batch_code
                ? `Detail Batch ${batch.batch_code}`
                : "Detail Batch";

    }


    setDetailText(
        "batchDetailProduct",
        batch.products?.name ||
        "-"
    );


    setDetailText(
        "detailBatchCode",
        batch.batch_code ||
        "-"
    );


    setDetailText(
        "detailProduct",
        batch.products?.name ||
        "-"
    );


    setDetailText(
        "detailRecipe",
        batch.recipes?.name ||
        "-"
    );


    const versionText =
        batch.recipe_versions?.version_number
            ? `V${batch.recipe_versions.version_number}`
            : "-";


    setDetailText(
        "detailRecipeVersion",
        versionText
    );


    setDetailText(
        "detailProductionDate",
        formatProductionDate(
            batch.production_date
        )
    );


    const volumeText =
        [
            formatProductionNumber(
                batch.planned_volume
            ),
            batch.units?.code ||
            batch.units?.name ||
            ""
        ]
            .filter(
                Boolean
            )
            .join(" ");


    setDetailText(
        "detailPlannedVolume",
        volumeText ||
        "-"
    );


    setDetailText(
        "detailCurrentStage",
        getProductionStageLabel(
            batch.current_stage
        )
    );


    setDetailText(
        "detailStatus",
        getProductionStatusLabel(
            batch.status
        )
    );


    setDetailText(
        "detailNotes",
        batch.notes ||
        "-"
    );


    updateProductionFlow(
        batch.current_stage
    );

    /*
     * P4 — render status/progress F1 setiap kali Batch Detail dibuka.
     * Sebelumnya renderer F1 belum dipanggil di jalur normal sehingga
     * stage sudah berubah ke f1 tetapi card F1 tetap terlihat "Belum dimulai".
     */
    updateProductionF1Detail(
        batch
    );

    updateProductionF2Detail(
        batch
    );


    const startF1Button =
        document.getElementById(
            "startF1FromDetailBtn"
        );


    const canStartF1 =
        batch.current_stage ===
            "production" &&
        batch.status !==
            "cancelled" &&
        batch.status !==
            "completed";


    if(startF1Button){

        startF1Button.classList.toggle(
            "hidden",
            !canStartF1
        );

    }


    const modal =
        document.getElementById(
            "batchDetailModal"
        );


    if(modal){

        modal.classList.remove(
            "hidden"
        );

    }


    document.body.classList.add(
        "modal-open"
    );


loadBatchRecipePreparation(
    batch
);

loadBatchInitialQC(
    batch
);

}


/* =========================================================
   CLOSE BATCH DETAIL
========================================================= */

function closeBatchDetailModal(){

    const modal =
        document.getElementById(
            "batchDetailModal"
        );


    if(modal){

        modal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );


    activeDetailBatch =
        null;

    activeDetailInitialQC =
        null;

}

/* =========================================================
   RECIPE PREPARATION LOAD
========================================================= */

async function loadBatchRecipePreparation(
    batch
){

    const loading =
        document.getElementById(
            "detailPreparationLoading"
        );

    const errorBox =
        document.getElementById(
            "detailPreparationError"
        );

    const errorMessage =
        document.getElementById(
            "detailPreparationErrorMessage"
        );

    const ingredientsContainer =
        document.getElementById(
            "detailPreparationIngredients"
        );


    /*
     * RESET UI
     */

    if(loading){

        loading.classList.remove(
            "hidden"
        );

    }


    if(errorBox){

        errorBox.classList.add(
            "hidden"
        );

    }


    if(errorMessage){

        errorMessage.textContent =
            "Gagal memuat formula Recipe.";

    }


    if(ingredientsContainer){

        ingredientsContainer.classList.add(
            "hidden"
        );

        ingredientsContainer.innerHTML =
            "";

    }


    /*
     * VALIDASI
     */

    if(!batch?.id){

        showBatchRecipePreparationError(
            "Batch tidak ditemukan."
        );

        return;

    }


    if(!batch?.recipe_version_id){

        showBatchRecipePreparationError(
            "Recipe Version pada batch ini belum tersedia."
        );

        return;

    }


    try{

        const supabase =
            await waitForProductionSupabase();


        /*
         * =====================================================
         * 1. LOAD RECIPE VERSION
         * =====================================================
         *
         * Batch menyimpan recipe_version_id.
         *
         * Jadi Preparation harus membaca version
         * yang benar-benar digunakan batch.
         *
         * Jangan mengambil current version dari Recipe Master.
         */

        const {
            data: version,
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
                status
            `)

            .eq(
                "id",
                batch.recipe_version_id
            )

            .maybeSingle();


        if(versionError){

            throw versionError;

        }


        if(!version){

            throw new Error(
                "Recipe Version tidak ditemukan."
            );

        }


        /*
         * =====================================================
         * 2. LOAD RECIPE INGREDIENTS
         * =====================================================
         */

        const {
            data: recipeIngredients,
            error: ingredientsError
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
                version.id
            );


        if(ingredientsError){

            throw ingredientsError;

        }


        const rows =
            Array.isArray(
                recipeIngredients
            )
                ? recipeIngredients
                : [];


        /*
         * =====================================================
         * 3. EMPTY FORMULA
         * =====================================================
         */

        if(!rows.length){

            renderBatchRecipePreparation(
                version,
                []
            );

            return;

        }


        /*
         * =====================================================
         * 4. COLLECT IDS
         * =====================================================
         */

        const ingredientIds =
            [
                ...new Set(
                    rows
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
                    rows
                        .map(
                            item =>
                                item.unit_id
                        )
                        .filter(
                            Boolean
                        )
                )
            ];


        /*
         * =====================================================
         * 5. LOAD INGREDIENT MASTER
         * =====================================================
         */

        let ingredientMap =
            new Map();


        if(
            ingredientIds.length
        ){

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


            if(error){

                throw error;

            }


            (
                data || []
            )
                .forEach(
                    ingredient => {

                        ingredientMap.set(
                            String(
                                ingredient.id
                            ),
                            ingredient
                        );

                    }
                );

        }


        /*
         * =====================================================
         * 6. LOAD UNIT MASTER
         * =====================================================
         */

        let unitMap =
            new Map();


        if(
            unitIds.length
        ){

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


            if(error){

                throw error;

            }


            (
                data || []
            )
                .forEach(
                    unit => {

                        unitMap.set(
                            String(
                                unit.id
                            ),
                            unit
                        );

                    }
                );

        }


        /*
         * =====================================================
         * 7. ATTACH MASTER DATA
         * =====================================================
         */

        const preparedRows =
            rows.map(
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
 * =====================================================
 * 8. LOAD ACTUAL INGREDIENTS
 * =====================================================
 */

const actualRows =
    await loadBatchActualIngredients(
        batch,
        version,
        preparedRows
    );


/*
 * =====================================================
 * 9. RENDER
 * =====================================================
 */

renderBatchRecipePreparation(
    version,
    actualRows
);

    }
    catch(error){

        console.error(
            "MERAMU Recipe Preparation Load Error:",
            error
        );


        showBatchRecipePreparationError(
            getErrorMessage(
                error
            )
        );

    }
    finally{

        /*
         * PENTING:
         * spinner HARUS selalu dihentikan.
         */

        if(loading){

            loading.classList.add(
                "hidden"
            );

        }

    }

}


/* =========================================================
   RECIPE PREPARATION ERROR
========================================================= */

function showBatchRecipePreparationError(
    message
){

    const loading =
        document.getElementById(
            "detailPreparationLoading"
        );

    const errorBox =
        document.getElementById(
            "detailPreparationError"
        );

    const errorMessage =
        document.getElementById(
            "detailPreparationErrorMessage"
        );

    const ingredientsContainer =
        document.getElementById(
            "detailPreparationIngredients"
        );


    if(loading){

        loading.classList.add(
            "hidden"
        );

    }


    if(ingredientsContainer){

        ingredientsContainer.classList.add(
            "hidden"
        );

    }


    if(errorMessage){

        errorMessage.textContent =
            message ||
            "Gagal memuat formula Recipe.";

    }


    if(errorBox){

        errorBox.classList.remove(
            "hidden"
        );

    }


    if(window.lucide){

        lucide.createIcons();

    }

}
/* =========================================================
   ACTUAL INGREDIENTS
========================================================= */

async function loadBatchActualIngredients(
    batch,
    version,
    rows
){

    /*
     * =====================================================
     * VALIDATION
     * =====================================================
     */

    if(
        !batch ||
        !batch.id
    ){

        throw new Error(
            "Batch tidak ditemukan."
        );

    }


    /*
     * =====================================================
     * GET SUPABASE CLIENT
     * =====================================================
     *
     * Gunakan client yang sama dengan
     * loadBatchRecipePreparation().
     */

    const supabase =
        await waitForProductionSupabase();


    /*
     * =====================================================
     * LOAD EXISTING ACTUAL INGREDIENTS
     * =====================================================
     */

    const {
        data: actualRows,
        error: actualError
    } = await supabase

        .from(
            "batch_ingredients"
        )

        .select(`
            id,
            batch_id,
            recipe_ingredient_id,
            ingredient_id,
            formula_quantity,
            formula_unit_id,
            actual_quantity,
            actual_unit_id,
            notes,
            created_at,
            updated_at
        `)

        .eq(
            "batch_id",
            batch.id
        );


    /*
     * =====================================================
     * ERROR
     * =====================================================
     */

    if(actualError){

        console.error(
            "Load batch ingredients error:",
            actualError
        );

        throw actualError;

    }


    /*
     * =====================================================
     * MAP EXISTING DATA
     * =====================================================
     */

    const actualMap =
        new Map(
            (
                actualRows ||
                []
            ).map(
                item => [

                    String(
                        item.recipe_ingredient_id
                    ),

                    item

                ]
            )
        );


    /*
     * =====================================================
     * MERGE FORMULA + ACTUAL
     * =====================================================
     */

    const mergedRows =
        (
            rows ||
            []
        ).map(
            item => {

                const actual =
                    actualMap.get(
                        String(
                            item.id
                        )
                    ) ||
                    null;


                return {

                    ...item,

                    actual

                };

            }
        );


    /*
     * =====================================================
     * RETURN
     * =====================================================
     */

    return mergedRows;

}
/* =========================================================
   SAVE ACTUAL INGREDIENTS
========================================================= */

async function saveBatchActualIngredients(){

    /*
     * =====================================================
     * VALIDASI ACTIVE BATCH
     * =====================================================
     */

    if(
        !activeDetailBatch ||
        !activeDetailBatch.id
    ){

        alert(
            "Batch tidak ditemukan."
        );

        return;

    }


    /*
     * =====================================================
     * GET SUPABASE
     * =====================================================
     */

    const supabase =
        await waitForProductionSupabase();


    /*
     * =====================================================
     * GET FORM ROWS
     * =====================================================
     */

    const rows =
        document.querySelectorAll(
            ".production-actual-ingredient-row"
        );


    if(!rows.length){

        alert(
            "Tidak ada bahan yang dapat disimpan."
        );

        return;

    }


    /*
     * =====================================================
     * PREPARE PAYLOAD
     * =====================================================
     */

    const payload = [];


    for(
    const row of rows
){

    const recipeIngredientId =
        row.dataset.recipeIngredientId;


    const ingredientId =
        row.dataset.ingredientId;


    const formulaQuantity =
        row.dataset.formulaQuantity;


    const formulaUnitId =
        row.dataset.formulaUnitId;


    const actualInput =
        row.querySelector(
            ".production-actual-quantity"
        );


    const notesInput =
        row.querySelector(
            ".production-actual-notes"
        );


    /*
     * -------------------------------------------------
     * ACTUAL QUANTITY
     * -------------------------------------------------
     */

    const rawActual =
        actualInput?.value
            ?.trim() ||
        "";


    let actualQuantity =
        null;


    if(rawActual !== ""){

        const normalized =
            rawActual
                .replace(
                    /\s/g,
                    ""
                )
                .replace(
                    /,/g,
                    "."
                );


        const parsed =
            Number(
                normalized
            );


        if(
            !Number.isFinite(
                parsed
            ) ||
            parsed < 0
        ){

            throw new Error(
                "Quantity actual tidak valid."
            );

        }


        actualQuantity =
            parsed;

    }


    /*
     * -------------------------------------------------
     * NOTES
     * -------------------------------------------------
     */

    const notes =
        notesInput?.value
            ?.trim() ||
        null;


    /*
     * -------------------------------------------------
     * PAYLOAD
     * -------------------------------------------------
     */

    payload.push({

        batch_id:
            activeDetailBatch.id,

        recipe_ingredient_id:
            recipeIngredientId,

        ingredient_id:
            ingredientId,

        formula_quantity:
            Number(
                formulaQuantity
            ) || 0,

        formula_unit_id:
            formulaUnitId ||
            null,

        actual_quantity:
            actualQuantity,

        actual_unit_id:
            formulaUnitId ||
            null,

        notes:
            notes,

        updated_at:
            new Date().toISOString()

    });

}
    /*
     * =====================================================
     * GET SAVE BUTTON
     * =====================================================
     */

    const saveButton =
        document.getElementById(
            "saveActualIngredientsBtn"
        );


    const originalButtonHtml =
        saveButton
            ? saveButton.innerHTML
            : "";


    if(saveButton){

        saveButton.disabled =
            true;

        saveButton.innerHTML = `
            <span class="production-inline-spinner"></span>
            Menyimpan...
        `;

    }


    try{

        /*
         * =================================================
         * UPSERT
         * =================================================
         */

        const {
            error
        } = await supabase

            .from(
                "batch_ingredients"
            )

            .upsert(
                payload,
                {
                    onConflict:
                        "batch_id,recipe_ingredient_id"
                }
            );


        if(error){

            console.error(
                "Save batch ingredients error:",
                error
            );

            throw error;

        }


        /*
         * =================================================
         * SUCCESS
         * =================================================
         */

        if(saveButton){

            saveButton.innerHTML = `
                <i data-lucide="check"></i>
                Tersimpan
            `;

        }


        if(window.lucide){

            lucide.createIcons();

        }


        /*
         * Kembalikan tombol setelah beberapa saat.
         */

        setTimeout(
            () => {

                if(
                    saveButton &&
                    document.body.contains(
                        saveButton
                    )
                ){

                    saveButton.disabled =
                        false;

                    saveButton.innerHTML =
                        originalButtonHtml;

                    if(window.lucide){

                        lucide.createIcons();

                    }

                }

            },
            1500
        );


    }
    catch(error){

        console.error(
            "MERAMU Save Actual Ingredients Error:",
            error
        );


        if(saveButton){

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                originalButtonHtml;

        }


        alert(
            getErrorMessage(
                error
            ) ||
            "Gagal menyimpan actual ingredients."
        );

    }

}
/* =========================================================
   RECIPE PREPARATION RENDER
========================================================= */

function renderBatchRecipePreparation(
    version,
    rows
){

    const loading =
        document.getElementById(
            "detailPreparationLoading"
        );


    const errorBox =
        document.getElementById(
            "detailPreparationError"
        );


    const ingredientsContainer =
        document.getElementById(
            "detailPreparationIngredients"
        );


    /*
     * =====================================================
     * RESET
     * =====================================================
     */

    if(loading){

        loading.classList.add(
            "hidden"
        );

    }


    if(errorBox){

        errorBox.classList.add(
            "hidden"
        );

    }


    if(!ingredientsContainer){

        return;

    }


    /*
     * =====================================================
     * EMPTY
     * =====================================================
     */

    if(
        !Array.isArray(rows) ||
        !rows.length
    ){

        ingredientsContainer.innerHTML = `
            <div class="production-preparation-empty">

                <i data-lucide="package-open"></i>

                <div>

                    <strong>
                        Formula belum tersedia
                    </strong>

                    <span>
                        Recipe Version V${escapeHtml(
                            version?.version_number ??
                            "-"
                        )}
                        belum memiliki bahan.
                    </span>

                </div>

            </div>
        `;


        ingredientsContainer.classList.remove(
            "hidden"
        );


        if(window.lucide){

            lucide.createIcons();

        }


        return;

    }


    /*
     * =====================================================
     * VERSION
     * =====================================================
     */

    const versionNumber =
        version?.version_number
            ? `V${version.version_number}`
            : "-";


    /*
     * =====================================================
     * FORMULA TABLE
     * =====================================================
     */

    const formulaRows =
        rows
            .map(
                (
                    item,
                    index
                ) => {

                    const ingredient =
                        item.ingredient ||
                        {};

                    const unit =
                        item.unit ||
                        {};


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        ingredient.name ||
                                        "-"
                                    )}
                                </strong>

                            </td>

                            <td>

                                <span class="production-ingredient-code">
                                    ${escapeHtml(
                                        ingredient.code ||
                                        "-"
                                    )}
                                </span>

                            </td>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        formatProductionNumber(
                                            item.quantity
                                        )
                                    )}
                                </strong>

                            </td>

                            <td>

                                ${escapeHtml(
                                    unit.code ||
                                    unit.name ||
                                    "-"
                                )}

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    /*
     * =====================================================
     * ACTUAL ROWS
     * =====================================================
     */

    const actualRows =
        rows
            .map(
                (
                    item,
                    index
                ) => {

                    const ingredient =
                        item.ingredient ||
                        {};

                    const unit =
                        item.unit ||
                        {};

                    const actual =
                        item.actual ||
                        {};


                    const actualValue =
                        actual.actual_quantity !== null &&
                        actual.actual_quantity !== undefined
                            ? actual.actual_quantity
                            : "";


                    const notesValue =
                        actual.notes ||
                        "";


                    return `

                        <div
                            class="production-actual-ingredient-row"
                            data-recipe-ingredient-id="${escapeHtml(
                                item.id ||
                                ""
                            )}"
                            data-ingredient-id="${escapeHtml(
                                item.ingredient_id ||
                                ""
                            )}"
                            data-formula-quantity="${escapeHtml(
                                item.quantity ??
                                "0"
                            )}"
                            data-formula-unit-id="${escapeHtml(
                                item.unit_id ||
                                ""
                            )}"
                        >

                            <div class="production-actual-ingredient-info">

                                <div class="production-actual-ingredient-number">
                                    ${index + 1}
                                </div>


                                <div class="production-actual-ingredient-name">

                                    <strong>
                                        ${escapeHtml(
                                            ingredient.name ||
                                            "-"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            ingredient.code ||
                                            "-"
                                        )}
                                    </span>

                                </div>

                            </div>


                            <div class="production-actual-ingredient-formula">

                                <span class="production-actual-label">
                                    Formula
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        formatProductionNumber(
                                            item.quantity
                                        )
                                    )}
                                    ${escapeHtml(
                                        unit.code ||
                                        unit.name ||
                                        ""
                                    )}
                                </strong>

                            </div>


                            <div class="production-actual-ingredient-input">

                                <label>
                                    Actual
                                </label>

                                <div class="production-actual-input-group">

                                    <input
                                        type="number"
                                        class="production-actual-quantity"
                                        min="0"
                                        step="any"
                                        inputmode="decimal"
                                        value="${escapeHtml(
                                            actualValue
                                        )}"
                                        placeholder="0"
                                    >

                                    <span>
                                        ${escapeHtml(
                                            unit.code ||
                                            unit.name ||
                                            ""
                                        )}
                                    </span>

                                </div>

                            </div>


                            <div class="production-actual-ingredient-notes">

                                <label>
                                    Catatan
                                </label>

                                <input
                                    type="text"
                                    class="production-actual-notes"
                                    value="${escapeHtml(
                                        notesValue
                                    )}"
                                    placeholder="Opsional"
                                >

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    /*
     * =====================================================
     * FINAL HTML
     * =====================================================
     */

    ingredientsContainer.innerHTML = `

        <div class="production-ingredients-header">

            <div>

                <strong>
                    Formula ${escapeHtml(
                        versionNumber
                    )}
                </strong>

                <span>
                    ${rows.length} bahan
                </span>

            </div>

        </div>


        <!-- ===============================================
             FORMULA
        ================================================ -->

        <div class="production-preparation-subtitle">
            Formula Recipe
        </div>


        <div class="production-ingredients-table-wrap">

            <table class="production-ingredients-table">

                <thead>

                    <tr>

                        <th>
                            #
                        </th>

                        <th>
                            Bahan
                        </th>

                        <th>
                            Kode
                        </th>

                        <th>
                            Quantity
                        </th>

                        <th>
                            Unit
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${formulaRows}

                </tbody>

            </table>

        </div>


        <!-- ===============================================
             ACTUAL INGREDIENTS
        ================================================ -->

        <div class="production-preparation-actual">

            <div class="production-preparation-actual-header">

                <div>

                    <strong>
                        Actual Ingredients
                    </strong>

                    <span>
                        Catat jumlah bahan yang benar-benar digunakan
                        pada batch ini.
                    </span>

                </div>

            </div>


            <div class="production-actual-ingredients-list">

                ${actualRows}

            </div>


            <div class="production-actual-actions">

                <button
                    type="button"
                    class="production-btn production-btn-primary"
                    id="saveActualIngredientsBtn"
                >

                    <i data-lucide="save"></i>

                    <span>
                        Simpan Actual Ingredients
                    </span>

                </button>

            </div>

        </div>

    `;


    /*
     * =====================================================
     * SHOW
     * =====================================================
     */

    ingredientsContainer.classList.remove(
        "hidden"
    );


    /*
     * =====================================================
     * SAVE BUTTON EVENT
     * =====================================================
     */

    const saveButton =
        document.getElementById(
            "saveActualIngredientsBtn"
        );


    if(saveButton){

        saveButton.addEventListener(
            "click",
            async () => {

                await saveBatchActualIngredients();

            }
        );

    }


    /*
     * =====================================================
     * LUCIDE
     * =====================================================
     */

    if(window.lucide){

        lucide.createIcons();

    }

}

/* =========================================================
   INITIAL QC LOAD
========================================================= */

async function loadBatchInitialQC(
    batch
){

    if(!batch?.id){

        return;

    }


    renderInitialQCStatus(
        null
    );


    try{

        const supabase =
            await waitForProductionSupabase();


        const {
            data,
            error
        } = await supabase

            .from(
                "quality_checks"
            )

            .select(`
                id,
                batch_id,
                checked_at,
                stage,
                ph,
                brix,
                temperature_c,
                volume,
                decision,
                operator_name,
                notes
            `)

            .eq(
                "batch_id",
                batch.id
            )

            .eq(
                "stage",
                "production"
            )

            .order(
                "checked_at",
                {
                    ascending: false
                }
            )

            .limit(
                1 );


        if(error){

            throw error;

        }


        const qc =
            Array.isArray(
                data
            ) &&
            data.length
                ? data[0]
                : null;


        activeDetailInitialQC =
            qc;


        renderInitialQCStatus(
            qc
        );


    }
    catch(error){

        console.error(
            "MERAMU Initial QC Load Error:",
            error
        );


        activeDetailInitialQC =
            null;


        renderInitialQCStatus(
            null,
            getErrorMessage(
                error
            )
        );

    }

}


/* =========================================================
   INITIAL QC STATUS RENDER
========================================================= */

function renderInitialQCStatus(
    qc,
    errorMessage = ""
){

    const status =
        document.getElementById(
            "detailInitialQCStatus"
        );


    const decision =
        document.getElementById(
            "detailInitialQCDecision"
        );


    const meta =
        document.getElementById(
            "detailInitialQCMeta"
        );


    if(!qc){

        if(status){

            status.textContent =
                errorMessage
                    ? "Gagal memuat QC"
                    : "Belum dilakukan";

            status.className =
                "production-qc-status-value " +
                (
                    errorMessage
                        ? "is-error"
                        : "is-empty"
                );

        }


        if(decision){

            decision.textContent =
                "-";

            decision.className =
                "production-qc-decision-value";

        }


        if(meta){

            meta.textContent =
                errorMessage ||
                "Initial QC Production belum tersedia.";

        }


        return;

    }


    const normalizedDecision =
        String(
            qc.decision ||
            ""
        )
            .trim()
            .toLowerCase();


    let decisionLabel =
        qc.decision ||
        "-";


    if(
        normalizedDecision ===
        "passed"
    ){

        decisionLabel =
            "PASS";

    }
    else if(
        normalizedDecision ===
        "not_ready"
    ){

        decisionLabel =
            "NOT READY";

    }
    else if(
        normalizedDecision ===
        "hold"
    ){

        decisionLabel =
            "HOLD";

    }


    if(status){

        status.textContent =
            "Sudah dilakukan";

        status.className =
            "production-qc-status-value is-done";

    }


    if(decision){

        decision.textContent =
            decisionLabel;


        decision.className =
            "production-qc-decision-value " +
            (
                normalizedDecision ===
                "passed"
                    ? "is-passed"
                    : normalizedDecision ===
                      "hold"
                        ? "is-hold"
                        : "is-not-ready"
            );

    }


    if(meta){

        const checkedAt =
            qc.checked_at
                ? formatProductionDateTime(
                    qc.checked_at
                )
                : "-";


        const operator =
            qc.operator_name ||
            "-";


        meta.textContent =
            `Checked ${checkedAt} · Operator ${operator}`;

    }

}


/* =========================================================
   OPEN INITIAL QC MODAL
========================================================= */

function openInitialQCModal(){

    if(!activeDetailBatch?.id){

        alert(
            "Batch belum dipilih."
        );

        return;

    }


    const modal =
        document.getElementById(
            "initialQCModal"
        );


    if(!modal){

        return;

    }


    const batchCodeInput =
        document.getElementById(
            "initialQCBatchCode"
        );


    const batchIdInput =
        document.getElementById(
            "initialQCBatchId"
        );


    if(batchCodeInput){

        batchCodeInput.value =
            activeDetailBatch.batch_code ||
            "";

    }


    if(batchIdInput){

        batchIdInput.value =
            activeDetailBatch.id ||
            "";

    }


    const checkedAtInput =
        document.getElementById(
            "initialQCCheckedAt"
        );


    if(checkedAtInput){

        checkedAtInput.value =
            toLocalDateTimeInputValue(
                new Date()
            );

    }


    const decisionInput =
        document.getElementById(
            "initialQCDecision"
        );


    if(decisionInput){

        decisionInput.value =
            activeDetailInitialQC?.decision ||
            "";

    }


    setInputValue(
        "initialQCPh",
        activeDetailInitialQC?.ph
    );


    setInputValue(
        "initialQCBrix",
        activeDetailInitialQC?.brix
    );


    setInputValue(
        "initialQCTemperature",
        activeDetailInitialQC?.temperature_c
    );


    setInputValue(
        "initialQCVolume",
        activeDetailInitialQC?.volume
    );


    setInputValue(
        "initialQCOperator",
        activeDetailInitialQC?.operator_name ||
        ""
    );


    setInputValue(
        "initialQCNotes",
        activeDetailInitialQC?.notes ||
        ""
    );


    clearInitialQCError();


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );


    if(window.lucide){

        lucide.createIcons();

    }

}


/* =========================================================
   INPUT HELPER
========================================================= */

function setInputValue(
    id,
    value
){

    const input =
        document.getElementById(
            id
        );


    if(!input){

        return;

    }


    input.value =
        value === null ||
        value === undefined
            ? ""
            : value;

}


/* =========================================================
   CLOSE INITIAL QC MODAL
========================================================= */

function closeInitialQCModal(){

    const modal =
        document.getElementById(
            "initialQCModal"
        );


    if(modal){

        modal.classList.add(
            "hidden"
        );

    }


    const detailModal =
        document.getElementById(
            "batchDetailModal"
        );


    if(
        detailModal &&
        !detailModal.classList.contains(
            "hidden"
        )
    ){

        document.body.classList.add(
            "modal-open"
        );

    }
    else{

        document.body.classList.remove(
            "modal-open"
        );

    }


    clearInitialQCError();

}


/* =========================================================
   INITIAL QC ERROR
========================================================= */

function clearInitialQCError(){

    const errorBox =
        document.getElementById(
            "initialQCError"
        );


    const errorMessage =
        document.getElementById(
            "initialQCErrorMessage"
        );


    if(errorBox){

        errorBox.classList.add(
            "hidden"
        );

    }


    if(errorMessage){

        errorMessage.textContent =
            "";

    }

}


function showInitialQCError(
    message
){

    const errorBox =
        document.getElementById(
            "initialQCError"
        );


    const errorMessage =
        document.getElementById(
            "initialQCErrorMessage"
        );


    if(errorMessage){

        errorMessage.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    if(errorBox){

        errorBox.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   INITIAL QC OPTIONAL NUMBER
========================================================= */

function getProductionOptionalNumber(
    id
){

    const input =
        document.getElementById(
            id
        );


    if(!input){

        return null;

    }


    const value =
        String(
            input.value ??
            ""
        )
            .trim();


    if(value === ""){

        return null;

    }


    const number =
        Number(
            value
        );


    if(
        Number.isNaN(
            number
        )
    ){

        return null;

    }


    return number;

}


/* =========================================================
   SAVE INITIAL QC
========================================================= */

async function saveInitialQC(
    event
){

    event.preventDefault();


    clearInitialQCError();


    if(!activeDetailBatch?.id){

        showInitialQCError(
            "Batch belum dipilih."
        );

        return;

    }


    const batchId =
        activeDetailBatch.id;


    const checkedAtInput =
        document.getElementById(
            "initialQCCheckedAt"
        );


    const checkedAt =
        checkedAtInput?.value
            ? new Date(
                checkedAtInput.value
            ).toISOString()
            : new Date().toISOString();


    const decision =
        document.getElementById(
            "initialQCDecision"
        )?.value
        ?.trim();


    const operatorName =
        document.getElementById(
            "initialQCOperator"
        )?.value
        ?.trim() ||
        null;


    const notes =
        document.getElementById(
            "initialQCNotes"
        )?.value
        ?.trim() ||
        null;


    if(!decision){

        showInitialQCError(
            "Decision Initial QC wajib dipilih."
        );

        return;

    }


    const saveButton =
        document.getElementById(
            "saveInitialQCBtn"
        );


    try{

        if(saveButton){

            saveButton.disabled =
                true;

            saveButton.innerHTML =
                `
                <span class="production-button-loader"></span>
                <span>Menyimpan...</span>
                `;

        }


        const supabase =
            await waitForProductionSupabase();


        const payload = {

            batch_id:
                batchId,

            checked_at:
                checkedAt,

            stage:
                "production",

            ph:
                getProductionOptionalNumber(
                    "initialQCPh"
                ),

            brix:
                getProductionOptionalNumber(
                    "initialQCBrix"
                ),

            temperature_c:
                getProductionOptionalNumber(
                    "initialQCTemperature"
                ),

            volume:
                getProductionOptionalNumber(
                    "initialQCVolume"
                ),

            decision:
                decision,

            operator_name:
                operatorName,

            notes:
                notes

        };


        const {
            data,
            error
        } = await supabase

            .from(
                "quality_checks"
            )

            .insert(
                payload
            )

            .select(`
                id,
                batch_id,
                checked_at,
                stage,
                ph,
                brix,
                temperature_c,
                volume,
                decision,
                operator_name,
                notes
            `)

            .single();


        if(error){

            throw error;

        }


        activeDetailInitialQC =
            data;


        renderInitialQCStatus(
            data
        );


        closeInitialQCModal();


        alert(
            "Initial QC berhasil disimpan."
        );


    }
    catch(error){

        console.error(
            "MERAMU Save Initial QC Error:",
            error
        );


        showInitialQCError(
            getErrorMessage(
                error
            )
        );

    }
    finally{

        if(saveButton){

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                `
                <i data-lucide="save"></i>
                <span>Simpan Initial QC</span>
                `;


            if(window.lucide){

                lucide.createIcons();

            }

        }

    }

}


/* =========================================================
   PRODUCTION FLOW
========================================================= */

function updateProductionFlow(
    currentStage
){

    const flowItems =
        document.querySelectorAll(
            "[data-production-flow]"
        );


    if(!flowItems.length){

        return;

    }


    /*
     * Production Flow adalah indikator perjalanan batch.
     * Stage aktif harus selalu mengikuti batches.current_stage.
     */

    const normalizedStage =
        String(
            currentStage ||
            "production"
        )
            .trim()
            .toLowerCase();


    const stageAliases = {

        production: "production",

        f1: "f1",

        f2: "f2",

        harvest: "harvest",

        completed: "finished",

        finished: "finished"

    };


    const activeStage =
        stageAliases[normalizedStage] ||
        "production";


    const stageOrder = [
        "production",
        "f1",
        "f2",
        "harvest",
        "finished"
    ];


    const currentIndex =
        stageOrder.indexOf(
            activeStage
        );


    flowItems.forEach(
        item => {

            const stage =
                String(
                    item.dataset.productionFlow ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const stageIndex =
                stageOrder.indexOf(stage);


            /* CSS production.css menggunakan
             * .active dan .completed. */

            item.classList.remove(
                "active",
                "completed",
                "is-active",
                "is-complete"
            );


            if(
                currentIndex < 0 ||
                stageIndex < 0
            ){

                return;

            }


            if(
                stageIndex <
                currentIndex
            ){

                item.classList.add(
                    "completed"
                );

            }

            else if(
                stageIndex ===
                currentIndex
            ){

                item.classList.add(
                    "active"
                );

            }

        }
    );


    if(window.lucide){

        lucide.createIcons();

    }

}

/* =========================================================
   SUMMARY
========================================================= */

function updateProductionSummary(){

    const total =
        productionBatches.length;


    const active =
        productionBatches.filter(
            batch =>
                String(
                    batch.status || ""
                ).toLowerCase() ===
                "active"
        ).length;


    const production =
        productionBatches.filter(
            batch =>
                String(
                    batch.current_stage || ""
                ).toLowerCase() ===
                "production"
        ).length;


    const completed =
        productionBatches.filter(
            batch =>
                String(
                    batch.status || ""
                ).toLowerCase() ===
                "completed"
        ).length;


    setText(
        "summaryTotal",
        total
    );


    setText(
        "summaryActive",
        active
    );


    setText(
        "summaryProduction",
        production
    );


    setText(
        "summaryCompleted",
        completed
    );

}

/* =========================================================
   LOADING
========================================================= */

function setProductionLoading(
    loading
){

    const loadingElement =
        document.getElementById(
            "productionLoading"
        );


    const tableContainer =
        document.getElementById(
            "productionTableContainer"
        );


    if(loadingElement){

        loadingElement.classList.toggle(
            "hidden",
            !loading
        );

    }


    if(tableContainer){

        tableContainer.classList.toggle(
            "is-loading",
            loading
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showProductionError(
    message
){

    const errorElement =
        document.getElementById(
            "productionError"
        );


    const errorMessage =
        document.getElementById(
            "productionErrorMessage"
        );


    if(errorMessage){

        errorMessage.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    if(errorElement){

        errorElement.classList.remove(
            "hidden"
        );

    }

}


function hideProductionError(){

    const errorElement =
        document.getElementById(
            "productionError"
        );


    if(errorElement){

        errorElement.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   CREATE ERROR
========================================================= */

function showCreateBatchError(
    message
){

    const errorElement =
        document.getElementById(
            "createBatchError"
        );


    const errorMessage =
        document.getElementById(
            "createBatchErrorMessage"
        );


    if(errorMessage){

        errorMessage.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    if(errorElement){

        errorElement.classList.remove(
            "hidden"
        );

    }

}


function clearCreateBatchError(){

    const errorElement =
        document.getElementById(
            "createBatchError"
        );


    const errorMessage =
        document.getElementById(
            "createBatchErrorMessage"
        );


    if(errorMessage){

        errorMessage.textContent =
            "";

    }


    if(errorElement){

        errorElement.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   TEXT HELPERS
========================================================= */

function setDetailText(
    id,
    value
){

    const element =
        document.getElementById(
            id
        );


    if(element){

        element.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "-"
                : String(
                    value
                );

    }

}


/* =========================================================
   STAGE LABEL
========================================================= */

function getProductionStageLabel(
    stage
){

    const labels = {

        production:
            "Production",

        f1:
            "F1",

        f2:
            "F2",

        harvest:
            "Harvest",

        completed:
            "Completed"

    };


    return (
        labels[
            String(
                stage ||
                ""
            ).toLowerCase()
        ] ||
        stage ||
        "-"
    );

}


/* =========================================================
   STATUS LABEL
========================================================= */

function getProductionStatusLabel(
    status
){

    const labels = {

        active:
            "Active",

        completed:
            "Completed",

        cancelled:
            "Cancelled",

        draft:
            "Draft",

        on_hold:
            "On Hold"

    };


    return (
        labels[
            String(
                status ||
                ""
            ).toLowerCase()
        ] ||
        status ||
        "-"
    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatProductionDate(
    value
){

    if(!value){

        return "-";

    }


    const date =
        new Date(
            value
        );


    if(
        Number.isNaN(
            date.getTime()
        )
    ){

        return "-";

    }


    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    )
        .format(
            date
        );

}


/* =========================================================
   DATE TIME FORMAT
========================================================= */

function formatProductionDateTime(
    value
){

    if(!value){

        return "-";

    }


    const date =
        new Date(
            value
        );


    if(
        Number.isNaN(
            date.getTime()
        )
    ){

        return "-";

    }


    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    )
        .format(
            date
        );

}


/* =========================================================
   LOCAL DATETIME INPUT
========================================================= */

function toLocalDateTimeInputValue(
    date
){

    if(!date){

        return "";

    }


    const localDate =
        new Date(
            date
        );


    if(
        Number.isNaN(
            localDate.getTime()
        )
    ){

        return "";

    }


    const year =
        localDate.getFullYear();


    const month =
        String(
            localDate.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            localDate.getDate()
        )
            .padStart(
                2,
                "0"
            );


    const hours =
        String(
            localDate.getHours()
        )
            .padStart(
                2,
                "0"
            );


    const minutes =
        String(
            localDate.getMinutes()
        )
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${day}T${hours}:${minutes}`;

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatProductionNumber(
    value
){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return "-";

    }


    const number =
        Number(
            value
        );


    if(
        Number.isNaN(
            number
        )
    ){

        return "-";

    }


    return new Intl.NumberFormat(
        "id-ID",
        {
            maximumFractionDigits:
                2
        }
    )
        .format(
            number
        );

}


/* =========================================================
   CURRENCY FORMAT
========================================================= */

function formatProductionCurrency(
    value
){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return "Rp 0";

    }


    const number =
        Number(
            value
        );


    if(
        Number.isNaN(
            number
        )
    ){

        return "Rp 0";

    }


    return new Intl.NumberFormat(
        "id-ID",
        {
            style:
                "currency",

            currency:
                "IDR",

            maximumFractionDigits:
                0
        }
    )
        .format(
            number
        );

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
    error
){

    if(!error){

        return "Terjadi kesalahan.";

    }


    if(
        typeof error ===
        "string"
    ){

        return error;

    }


    if(
        error.message
    ){

        return error.message;

    }


    if(
        error.details
    ){

        return error.details;

    }


    if(
        error.hint
    ){

        return error.hint;

    }


    try{

        return JSON.stringify(
            error
        );

    }
    catch{

        return "Terjadi kesalahan.";

    }

}

/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    id,
    value
){

    const element =
        document.getElementById(
            id
        );


    if(element){

        element.textContent =
            value ?? "-";

    }

}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
    
