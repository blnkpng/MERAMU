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

    const tbody =
        document.getElementById(
            "productionTableBody"
        );

    const emptyState =
        document.getElementById(
            "productionEmptyState"
        );

    if(!tbody){

        return;

    }


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
                        batch.status ||
                        ""
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


    updateProductionSummary(
        rows
    );


    if(!rows.length){

        tbody.innerHTML =
            "";

        if(emptyState){

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if(emptyState){

        emptyState.classList.add(
            "hidden"
        );

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
        batch.current_stage ||
        "production";


    const status =
        batch.status ||
        "active";


    const stageLabel =
        getProductionStageLabel(
            stage
        );


    const statusLabel =
        getProductionStatusLabel(
            status
        );


    const productionDate =
        formatProductionDate(
            batch.production_date
        );


    const plannedVolume =
        formatProductionNumber(
            batch.planned_volume
        );


    const actualVolume =
        formatProductionNumber(
            batch.actual_volume
        );


    const volumeUnit =
        unit.code ||
        unit.name ||
        "";


    const hppPerUnit =
        formatProductionCurrency(
            batch.hpp_per_unit
        );


    const canStartF1 =
        stage ===
            "production" &&
        status !==
            "cancelled" &&
        status !==
            "completed";


    return `
        <tr
            data-batch-id="${escapeHtml(
                batch.id
            )}"
        >

            <td>

                <div class="production-batch-code">

                    ${escapeHtml(
                        batch.batch_code ||
                        "-"
                    )}

                </div>

                <div class="production-row-meta">

                    ${escapeHtml(
                        productionDate
                    )}

                </div>

            </td>


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

                    ${
                        version.version_number
                            ? ` · V${escapeHtml(
                                version.version_number
                            )}`
                            : ""
                    }

                </div>

            </td>


            <td>

                <span
                    class="production-stage-badge production-stage-${escapeHtml(
                        stage
                    )}"
                >

                    ${escapeHtml(
                        stageLabel
                    )}

                </span>

            </td>


            <td>

                <span
                    class="production-status-badge production-status-${escapeHtml(
                        status
                    )}"
                >

                    ${escapeHtml(
                        statusLabel
                    )}

                </span>

            </td>


            <td>

                <div class="production-volume-main">

                    ${escapeHtml(
                        plannedVolume
                    )}
                    ${volumeUnit
                        ? ` ${escapeHtml(
                            volumeUnit
                        )}`
                        : ""
                    }

                </div>

                <div class="production-row-meta">

                    Aktual:
                    ${escapeHtml(
                        actualVolume
                    )}
                    ${volumeUnit
                        ? ` ${escapeHtml(
                            volumeUnit
                        )}`
                        : ""
                    }

                </div>

            </td>


            <td>

                <div class="production-hpp">

                    ${escapeHtml(
                        hppPerUnit
                    )}

                </div>

            </td>


            <td>

                <div class="production-action-group">

                    <button
                        type="button"
                        class="production-action-btn"
                        data-production-action="detail"
                        data-batch-id="${escapeHtml(
                            batch.id
                        )}"
                        title="Detail Batch"
                    >

                        <i data-lucide="eye"></i>

                    </button>


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
                    "f1"
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
                status
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


    const stageOrder = [
        "production",
        "f1",
        "f2",
        "harvest",
        "completed"
    ];


    const currentIndex =
        stageOrder.indexOf(
            currentStage
        );


    flowItems.forEach(
        item => {

            const stage =
                item.dataset.productionFlow;


            const stageIndex =
                stageOrder.indexOf(
                    stage
                );


            item.classList.remove(
                "is-active",
                "is-complete"
            );


            if(
                currentIndex >= 0 &&
                stageIndex >= 0
            ){

                if(
                    stageIndex <
                    currentIndex
                ){

                    item.classList.add(
                        "is-complete"
                    );

                }


                if(
                    stageIndex ===
                    currentIndex
                ){

                    item.classList.add(
                        "is-active"
                    );

                }

            }

        }
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function updateProductionSummary(
    rows
){

    const total =
        rows.length;


    const active =
        rows.filter(
            batch =>
                String(
                    batch.status ||
                    ""
                ).toLowerCase() ===
                "active"
        ).length;


    const completed =
        rows.filter(
            batch =>
                String(
                    batch.status ||
                    ""
                ).toLowerCase() ===
                "completed"
        ).length;


    const cancelled =
        rows.filter(
            batch =>
                String(
                    batch.status ||
                    ""
                ).toLowerCase() ===
                "cancelled"
        ).length;


    setSummaryValue(
        "productionTotalCount",
        total
    );


    setSummaryValue(
        "productionActiveCount",
        active
    );


    setSummaryValue(
        "productionCompletedCount",
        completed
    );


    setSummaryValue(
        "productionCancelledCount",
        cancelled
    );

}


function setSummaryValue(
    id,
    value
){

    const element =
        document.getElementById(
            id
        );


    if(element){

        element.textContent =
            String(
                value
            );

    }

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
    
