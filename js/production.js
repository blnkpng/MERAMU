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


    clearCreateBatchError();

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


        if(data){

            productionBatches =
                [
                    data,
                    ...productionBatches
                ];

        }


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
    /*
     * Update active detail batch.
     */

    if(
        activeDetailBatch &&
        String(
            activeDetailBatch.id
        ) ===
        String(
            batchId
        )
    ){

        activeDetailBatch.current_stage =
            data.current_stage;

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

        openBatchDetail(
            activeDetailBatch
        );

    }


    alert(
        `Batch ${data.batch_code || batch.batch_code || "-"} berhasil dimulai F1.`
    );


}
catch(error){

    console.error(
        "Start F1 Error:",
        error
    );


    alert(
        `Gagal memulai F1.\n\n${getErrorMessage(
            error
        )}`
    );

}
finally{

    actionButtons.forEach(
        button => {

            button.disabled =
                false;

            button.classList.remove(
                "is-loading"
            );

            button.innerHTML =
                `
                    <i
                        data-lucide="play-circle"
                    ></i>

                    <span>
                        Mulai F1
                    </span>
                `;

        }
    );


    if(window.lucide){

        lucide.createIcons();

    }

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


    const modal =
        document.getElementById(
            "batchDetailModal"
        );


    if(!modal){

        return;

    }


    /* =====================================================
       HEADER
    ===================================================== */

    setText(
        "batchDetailTitle",
        batch.batch_code
            ? `Detail Batch ${batch.batch_code}`
            : "Detail Batch"
    );


    setText(
        "batchDetailProduct",
        batch.products?.name ||
        "-"
    );


    /* =====================================================
       BASIC INFO
    ===================================================== */

    setText(
        "detailBatchCode",
        batch.batch_code ||
        "-"
    );


    setText(
        "detailProduct",
        batch.products?.name ||
        "-"
    );


    setText(
        "detailRecipe",
        batch.recipes?.name ||
        "-"
    );


    const versionNumber =
        batch.recipe_versions
            ?.version_number;


    setText(
        "detailRecipeVersion",
        versionNumber
            ? `V${versionNumber}`
            : "-"
    );


    setText(
        "detailProductionDate",
        formatDate(
            batch.production_date
        )
    );


    const plannedVolume =
        formatNumber(
            batch.planned_volume
        );


    const volumeUnit =
        batch.units?.code ||
        batch.units?.name ||
        "";


    setText(
        "detailPlannedVolume",
        plannedVolume !== "-"
            ? `${plannedVolume} ${volumeUnit}`
            : "-"
    );


    setText(
        "detailCurrentStage",
        formatStage(
            batch.current_stage
        )
    );


    setText(
        "detailStatus",
        formatStatus(
            batch.status
        )
    );


    setText(
        "detailNotes",
        batch.notes ||
        "-"
    );


    /* =====================================================
       PRODUCTION FLOW
    ===================================================== */

    updateProductionFlow(
        batch.current_stage
    );


    /* =====================================================
       START F1 BUTTON
    ===================================================== */

    const startF1Button =
        document.getElementById(
            "startF1FromDetailBtn"
        );


    const stage =
        String(
            batch.current_stage ||
            ""
        )
            .toLowerCase();


    const status =
        String(
            batch.status ||
            ""
        )
            .toLowerCase();


    const canStartF1 =
        stage ===
            "production" &&
        status !==
            "cancelled" &&
        status !==
            "completed";


    if(startF1Button){

        startF1Button.classList.toggle(
            "hidden",
            !canStartF1
        );


        startF1Button.disabled =
            false;


        startF1Button.classList.remove(
            "is-loading"
        );


        startF1Button.innerHTML =
            `
                <i
                    data-lucide="play-circle"
                ></i>

                <span>
                    Mulai F1
                </span>
            `;

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "production-modal-open"
    );


    /* =====================================================
       LOAD INITIAL QC
    ===================================================== */

    loadBatchInitialQC(
        batch
    );


    if(window.lucide){

        lucide.createIcons();

    }

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
        "production-modal-open"
    );


    activeDetailBatch =
        null;


    activeDetailInitialQC =
        null;

}


/* =========================================================
   UPDATE PRODUCTION FLOW
========================================================= */

function updateProductionFlow(
    currentStage
){

    const stage =
        String(
            currentStage ||
            ""
        )
            .toLowerCase();


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
            stage
        );


    flowItems.forEach(
        item => {

            const itemStage =
                String(
                    item.dataset.productionFlow ||
                    ""
                )
                    .toLowerCase();


            const itemIndex =
                stageOrder.indexOf(
                    itemStage
                );


            item.classList.remove(
                "is-active",
                "is-complete"
            );


            if(
                currentIndex < 0 ||
                itemIndex < 0
            ){

                return;

            }


            if(
                itemIndex <
                currentIndex
            ){

                item.classList.add(
                    "is-complete"
                );

            }


            if(
                itemIndex ===
                currentIndex
            ){

                item.classList.add(
                    "is-active"
                );

            }

        }
    );

}


/* =========================================================
   INITIAL QC
========================================================= */

async function loadBatchInitialQC(
    batch
){

    if(!batch?.id){

        return;

    }


    const statusElement =
        document.getElementById(
            "detailInitialQCStatus"
        );


    const decisionElement =
        document.getElementById(
            "detailInitialQCDecision"
        );


    const metaElement =
        document.getElementById(
            "detailInitialQCMeta"
        );


    if(statusElement){

        statusElement.textContent =
            "Memuat...";

        statusElement.className =
            "production-qc-status-value";

    }


    if(decisionElement){

        decisionElement.textContent =
            "-";

        decisionElement.className =
            "production-qc-decision-value";

    }


    if(metaElement){

        metaElement.textContent =
            "Memuat Initial QC...";

    }


    activeDetailInitialQC =
        null;


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
                aroma,
                taste,
                color,
                carbonation,
                scoby_condition,
                decision,
                reason,
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
                1
            );


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
            "Load Initial QC Error:",
            error
        );


        activeDetailInitialQC =
            null;


        if(statusElement){

            statusElement.textContent =
                "Gagal memuat";

            statusElement.className =
                "production-qc-status-value is-error";

        }


        if(metaElement){

            metaElement.textContent =
                getErrorMessage(
                    error
                );

        }

    }

}


/* =========================================================
   RENDER INITIAL QC STATUS
========================================================= */

function renderInitialQCStatus(
    qc
){

    const statusElement =
        document.getElementById(
            "detailInitialQCStatus"
        );


    const decisionElement =
        document.getElementById(
            "detailInitialQCDecision"
        );


    const metaElement =
        document.getElementById(
            "detailInitialQCMeta"
        );


    if(!statusElement){

        return;

    }


    if(!qc){

        statusElement.textContent =
            "Belum dilakukan";

        statusElement.className =
            "production-qc-status-value is-empty";


        if(decisionElement){

            decisionElement.textContent =
                "-";

            decisionElement.className =
                "production-qc-decision-value";

        }


        if(metaElement){

            metaElement.textContent =
                "Initial QC Production belum tersedia.";

        }


        return;

    }


    const decision =
        String(
            qc.decision ||
            ""
        )
            .trim()
            .toLowerCase();


    statusElement.textContent =
        "Sudah dilakukan";


    statusElement.className =
        "production-qc-status-value is-done";


    if(decisionElement){

        let decisionLabel =
            qc.decision ||
            "-";


        if(
            decision ===
            "passed"
        ){

            decisionLabel =
                "PASS";

        }
        else if(
            decision ===
            "not_ready"
        ){

            decisionLabel =
                "NOT READY";

        }
        else if(
            decision ===
            "hold"
        ){

            decisionLabel =
                "HOLD";

        }


        decisionElement.textContent =
            decisionLabel;


        decisionElement.className =
            "production-qc-decision-value";


        if(
            decision ===
            "passed"
        ){

            decisionElement.classList.add(
                "is-passed"
            );

        }
        else if(
            decision ===
            "hold"
        ){

            decisionElement.classList.add(
                "is-hold"
            );

        }
        else{

            decisionElement.classList.add(
                "is-not-ready"
            );

        }

    }


    if(metaElement){

        const checkedAt =
            qc.checked_at
                ? formatDateTime(
                    qc.checked_at
                )
                : "-";


        const operator =
            qc.operator_name ||
            "-";


        metaElement.textContent =
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


    clearInitialQCError();


    /* =====================================================
       BATCH
    ===================================================== */

    setInputValue(
        "initialQCBatchCode",
        activeDetailBatch.batch_code ||
        ""
    );


    setInputValue(
        "initialQCBatchId",
        activeDetailBatch.id ||
        ""
    );


    /* =====================================================
       CHECKED AT
    ===================================================== */

    setInputValue(
        "initialQCCheckedAt",
        activeDetailInitialQC?.checked_at
            ? toLocalDateTimeInputValue(
                new Date(
                    activeDetailInitialQC.checked_at
                )
            )
            : toLocalDateTimeInputValue(
                new Date()
            )
    );


    /* =====================================================
       MEASUREMENT
    ===================================================== */

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


    /* =====================================================
       DECISION
    ===================================================== */

    setInputValue(
        "initialQCDecision",
        activeDetailInitialQC?.decision ||
        ""
    );


    /* =====================================================
       OPERATOR
    ===================================================== */

    setInputValue(
        "initialQCOperator",
        activeDetailInitialQC?.operator_name ||
        ""
    );


    /* =====================================================
       NOTES
    ===================================================== */

    setInputValue(
        "initialQCNotes",
        activeDetailInitialQC?.notes ||
        ""
    );


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "production-modal-open"
    );


    if(window.lucide){

        lucide.createIcons();

    }

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
            "production-modal-open"
        );

    }
    else{

        document.body.classList.remove(
            "production-modal-open"
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


    const checkedAtValue =
        document.getElementById(
            "initialQCCheckedAt"
        )?.value;


    const checkedAt =
        checkedAtValue
            ? new Date(
                checkedAtValue
            ).toISOString()
            : new Date().toISOString();


    const ph =
        getProductionOptionalNumber(
            "initialQCPh"
        );


    const brix =
        getProductionOptionalNumber(
            "initialQCBrix"
        );


    const temperature =
        getProductionOptionalNumber(
            "initialQCTemperature"
        );


    const volume =
        getProductionOptionalNumber(
            "initialQCVolume"
        );


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
                    <span
                        class="production-button-loader"
                    ></span>

                    <span>
                        Menyimpan...
                    </span>
                `;

        }


        const supabase =
            await waitForProductionSupabase();


        const payload = {

            batch_id:
                activeDetailBatch.id,

            checked_at:
                checkedAt,

            stage:
                "production",

            ph:
                ph,

            brix:
                brix,

            temperature_c:
                temperature,

            volume:
                volume,

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
                aroma,
                taste,
                color,
                carbonation,
                scoby_condition,
                decision,
                reason,
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
            "Save Initial QC Error:",
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
                    <i
                        data-lucide="save"
                    ></i>

                    <span>
                        Simpan Initial QC
                    </span>
                `;


            if(window.lucide){

                lucide.createIcons();

            }

        }

    }

}


/* =========================================================
   OPTIONAL NUMBER
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
        !Number.isFinite(
            number
        )
    ){

        return null;

    }


    return number;

}


/* =========================================================
   CREATE ERROR
========================================================= */

function showCreateBatchError(
    message
){

    const errorBox =
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


    if(errorBox){

        errorBox.classList.remove(
            "hidden"
        );

    }

}


function clearCreateBatchError(){

    const errorBox =
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


    if(errorBox){

        errorBox.classList.add(
            "hidden"
        );

    }

}
        }

    }
);


/* =========================================================
   START F1
========================================================= */

async function startBatchF1(
    batchId
){

    if(!batchId){

        return;

    }


    /*
     * Cari batch dari state lokal terlebih dahulu.
     */

    const batch =
        productionBatches.find(
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


    const currentStage =
        String(
            batch.current_stage ||
            ""
        )
            .toLowerCase();


    const currentStatus =
        String(
            batch.status ||
            ""
        )
            .toLowerCase();


    /*
     * SECURITY / BUSINESS VALIDATION
     *
     * Hanya Production yang boleh
     * dipindahkan ke F1.
     */

    if(
        currentStage !==
        "production"
    ){

        alert(
            `Batch ${batch.batch_code || ""} ` +
            `tidak dapat dimulai F1 karena ` +
            `stage saat ini adalah ${formatStage(
                currentStage
            )}.`
        );

        return;

    }


    if(
        currentStatus ===
        "cancelled"
    ){

        alert(
            "Batch yang dibatalkan tidak dapat dimulai F1."
        );

        return;

    }


    if(
        currentStatus ===
        "completed"
    ){

        alert(
            "Batch yang sudah selesai tidak dapat dimulai F1."
        );

        return;

    }


    /*
     * Konfirmasi operator.
     */

    const confirmed =
        window.confirm(
            `Mulai F1 untuk batch ${batch.batch_code || "-"}?\n\n` +
            `Product: ${batch.products?.name || "-"}\n` +
            `Recipe: ${batch.recipes?.name || "-"}\n` +
            `Version: ${
                batch.recipe_versions?.version_number
                    ? `V${batch.recipe_versions.version_number}`
                    : "-"
            }\n\n` +
            `Stage akan berubah dari Production menjadi F1.`
        );


    if(!confirmed){

        return;

    }


    /*
     * Ambil Supabase.
     */

    let supabase;


    try{

        supabase =
            await waitForProductionSupabase();


    }
    catch(error){

        console.error(
            "Start F1 Supabase Error:",
            error
        );

        alert(
            getErrorMessage(
                error
            )
        );

        return;

    }


    /* =====================================================
       INITIAL QC GATE
       Batch wajib memiliki Initial QC PASS
       sebelum boleh masuk F1.
    ===================================================== */

    const {
        data: latestInitialQC,
        error: initialQCError
    } = await supabase

        .from(
            "quality_checks"
        )

        .select(`
            id,
            batch_id,
            checked_at,
            stage,
            decision
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
            1
        )

        .maybeSingle();


    if(initialQCError){

        alert(
            `Gagal memeriksa Initial QC.\n\n${getErrorMessage(
                initialQCError
            )}`
        );

        return;

    }


    if(
        !latestInitialQC ||
        String(
            latestInitialQC.decision || ""
        ).toLowerCase() !==
        "passed"
    ){

        alert(
            `Batch ${batch.batch_code || "-"} belum READY F1.\n\n` +
            `Initial QC Production harus PASS — Siap F1 terlebih dahulu.`
        );


        /*
         * Jika detail batch sedang terbuka,
         * langsung buka modal Initial QC.
         */

        const detailBatch =
            productionBatches.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        batchId
                    )
            );


        if(detailBatch){

            openBatchDetail(
                detailBatch
            );

            setTimeout(
                () => {

                    openInitialQCModal();

                },
                100
            );

        }

        return;

    }


    /*
     * Cari tombol yang sedang digunakan.
     * Semua tombol Start F1 menggunakan
     * data-id yang sama dengan batch UUID.
     */

    const actionButtons =
        document.querySelectorAll(
            `[data-production-action="start-f1"][data-id="${CSS.escape(
                String(batchId)
            )}"]`
        );


    actionButtons.forEach(
        button => {

            button.disabled =
                true;

            button.classList.add(
                "is-loading"
            );

            button.innerHTML =
                `
                    <span
                        class="production-button-loader"
                    ></span>

                    <span>
                        Memulai F1...
                    </span>
                `;

        }
    );


    try{

        /*
         * PENTING:
         *
         * HANYA batch yang dipilih
         * yang di-update.
         *
         * Tidak menyentuh Recipe.
         * Tidak menyentuh Recipe Version.
         * Tidak menyentuh batch lain.
         */

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


        if(!data){

            throw new Error(
                "Batch tidak ditemukan atau stage sudah berubah."
            );

        }


        /*
         * Update state lokal supaya UI
         * langsung konsisten.
         */

        const localIndex =
            productionBatches.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        batchId
                    )
            );


        if(
            localIndex >= 0
        ){

            productionBatches[
                localIndex
            ].current_stage =
                data.current_stage;

        }


        /*
         * Update active detail batch.
         */

        if(
            activeDetailBatch &&
            String(
                activeDetailBatch.id
            ) ===
            String(
                batchId
            )
        ){

            activeDetailBatch =
                productionBatches[
                    localIndex
                ] || null;

        }


        /*
         * Render ulang tabel.
         */

        renderProduction();


        /*
         * Jika modal detail masih terbuka,
         * refresh isi detail.
         */

        if(
            activeDetailBatch
        ){

            openBatchDetail(
                activeDetailBatch
            );

        }


        /*
         * Feedback.
         */

        console.log(
            "MERAMU: Batch berhasil dimulai F1",
            data
        );


    }
    catch(error){

        console.error(
            "Start F1 Error:",
            error
        );


        alert(
            `Gagal memulai F1.\n\n${
                getErrorMessage(
                    error
                )
            }`
        );


        /*
         * Kalau gagal, render ulang
         * supaya tombol kembali normal.
         */

        renderProduction();

    }

}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeBatchDetailModal(){

    const modal =
        document.getElementById(
            "batchDetailModal"
        );


    modal?.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "production-modal-open"
    );


    activeDetailBatch =
        null;

    activeDetailInitialQC =
        null;

}


/* =========================================================
   INITIAL QC
========================================================= */

async function loadBatchInitialQC(
    batch
){

    const statusElement =
        document.getElementById(
            "detailInitialQCStatus"
        );

    const decisionElement =
        document.getElementById(
            "detailInitialQCDecision"
        );

    const metaElement =
        document.getElementById(
            "detailInitialQCMeta"
        );


    if(!batch){

        return;

    }


    activeDetailInitialQC = null;


    if(statusElement){

        statusElement.textContent =
            "Memuat...";

    }


    if(decisionElement){

        decisionElement.textContent =
            "—";

    }


    if(metaElement){

        metaElement.textContent =
            "Mengambil Initial QC terakhir...";

    }


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
                1
            )

            .maybeSingle();


        if(error){

            throw error;

        }


        activeDetailInitialQC =
            data || null;


        renderInitialQCStatus(
            data
        );

    }
    catch(error){

        console.error(
            "Load Initial QC Error:",
            error
        );


        if(statusElement){

            statusElement.textContent =
                "Gagal memuat";

        }


        if(decisionElement){

            decisionElement.textContent =
                "ERROR";

        }


        if(metaElement){

            metaElement.textContent =
                getErrorMessage(
                    error
                );

        }

    }

}


/* =========================================================
   RENDER INITIAL QC STATUS
========================================================= */

function renderInitialQCStatus(
    qc
){

    const statusElement =
        document.getElementById(
            "detailInitialQCStatus"
        );

    const decisionElement =
        document.getElementById(
            "detailInitialQCDecision"
        );

    const metaElement =
        document.getElementById(
            "detailInitialQCMeta"
        );


    if(!qc){

        if(statusElement){

            statusElement.textContent =
                "Belum diperiksa";

        }


        if(decisionElement){

            decisionElement.textContent =
                "—";

        }


        if(metaElement){

            metaElement.textContent =
                "Initial QC belum dilakukan untuk batch ini.";

        }

        return;

    }


    const decision =
        String(
            qc.decision || ""
        )
            .toLowerCase();


    const decisionLabels = {

        passed:
            "PASS",

        not_ready:
            "NOT READY",

        hold:
            "HOLD"

    };


    const decisionLabel =
        decisionLabels[
            decision
        ] ||
        decision ||
        "—";


    if(decisionElement){

        decisionElement.textContent =
            decisionLabel;

    }


    if(statusElement){

        if(
            decision ===
            "passed"
        ){

            statusElement.textContent =
                "PASS — SIAP F1";

        }
        else if(
            decision ===
            "hold"
        ){

            statusElement.textContent =
                "HOLD";

        }
        else if(
            decision ===
            "not_ready"
        ){

            statusElement.textContent =
                "BELUM READY F1";

        }
        else{

            statusElement.textContent =
                "Perlu diperiksa";

        }

    }


    const checkedAt =
        qc.checked_at
            ? new Date(
                qc.checked_at
            )
            : null;


    const checkedAtLabel =
        checkedAt &&
        !Number.isNaN(
            checkedAt.getTime()
        )

            ? new Intl.DateTimeFormat(
                "id-ID",
                {
                    dateStyle:
                        "medium",

                    timeStyle:
                        "short"
                }
            )
                .format(
                    checkedAt
                )

            : "-";


    const operator =
        qc.operator_name ||
        "-";


    if(metaElement){

        metaElement.textContent =
            `Diperiksa ${checkedAtLabel} • Operator: ${operator}`;

    }

}


/* =========================================================
   OPEN INITIAL QC MODAL
========================================================= */

function openInitialQCModal(){

    const batch =
        activeDetailBatch;


    if(!batch){

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


    setInputValue(
        "initialQCBatchId",
        batch.id
    );


    setInputValue(
        "initialQCBatchCode",
        batch.batch_code || ""
    );


    const checkedAt =
        document.getElementById(
            "initialQCCheckedAt"
        );


    if(checkedAt){

        const now =
            new Date();


        const local =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() *
                60000
            )
                .toISOString()
                .slice(
                    0,
                    16
                );


        checkedAt.value =
            local;

    }


    const decision =
        document.getElementById(
            "initialQCDecision"
        );


    if(decision){

        decision.value =
            activeDetailInitialQC
                ?.decision ||
            "";

    }


    setInputValue(
        "initialQCPh",
        activeDetailInitialQC
            ?.ph ??
        ""
    );


    setInputValue(
        "initialQCBrix",
        activeDetailInitialQC
            ?.brix ??
        ""
    );


    setInputValue(
        "initialQCTemperature",
        activeDetailInitialQC
            ?.temperature_c ??
        ""
    );


    setInputValue(
        "initialQCVolume",
        activeDetailInitialQC
            ?.volume ??
        batch.planned_volume ??
        ""
    );


    setInputValue(
        "initialQCOperator",
        activeDetailInitialQC
            ?.operator_name ||
        ""
    );


    setInputValue(
        "initialQCNotes",
        activeDetailInitialQC
            ?.notes ||
        ""
    );


    clearInitialQCError();


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "production-modal-open"
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

    const element =
        document.getElementById(
            id
        );


    if(element){

        element.value =
            value ??
            "";

    }

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


    document.body.classList.remove(
        "production-modal-open"
    );

}


/* =========================================================
   INITIAL QC ERROR
========================================================= */

function clearInitialQCError(){

    document
        .getElementById(
            "initialQCError"
        )
        ?.classList.add(
            "hidden"
        );


    const message =
        document.getElementById(
            "initialQCErrorMessage"
        );


    if(message){

        message.textContent =
            "";

    }

}


function showInitialQCError(
    message
){

    const box =
        document.getElementById(
            "initialQCError"
        );


    const messageElement =
        document.getElementById(
            "initialQCErrorMessage"
        );


    if(messageElement){

        messageElement.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    box?.classList.remove(
        "hidden"
    );


    if(window.lucide){

        lucide.createIcons();

    }

}


/* =========================================================
   OPTIONAL NUMBER
========================================================= */

function getProductionOptionalNumber(
    id
){

    const value =
        document.getElementById(
            id
        )?.value;


    if(
        value === "" ||
        value === null ||
        value === undefined
    ){

        return null;

    }


    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* =========================================================
   SAVE INITIAL QC
========================================================= */

async function saveInitialQC(
    event
){

    event.preventDefault();

    clearInitialQCError();


    const batchId =
        document.getElementById(
            "initialQCBatchId"
        )?.value;


    const decision =
        document.getElementById(
            "initialQCDecision"
        )?.value;


    if(!batchId){

        showInitialQCError(
            "Batch tidak ditemukan."
        );

        return;

    }


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


    const checkedAtRaw =
        document.getElementById(
            "initialQCCheckedAt"
        )?.value;


    let checkedAt =
        new Date();


    if(checkedAtRaw){

        const parsed =
            new Date(
                checkedAtRaw
            );


        if(
            !Number.isNaN(
                parsed.getTime()
            )
        ){

            checkedAt =
                parsed;

        }

    }


    const payload = {

        batch_id:
            batchId,

        checked_at:
            checkedAt.toISOString(),

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
            document
                .getElementById(
                    "initialQCOperator"
                )
                ?.value
                ?.trim() ||
            null,

        notes:
            document
                .getElementById(
                    "initialQCNotes"
                )
                ?.value
                ?.trim() ||
            null

    };


    if(saveButton){

        saveButton.disabled =
            true;

        saveButton.innerHTML =
            `
                <span class="production-button-loader"></span>
                <span>Menyimpan...</span>
            `;

    }


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


        console.log(
            "MERAMU: Initial QC berhasil disimpan.",
            data
        );

    }
    catch(error){

        console.error(
            "Save Initial QC Error:",
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
                    <span>
                        Simpan Initial QC
                    </span>
                `;


            if(window.lucide){

                lucide.createIcons();

            }

        }

    }

}


/* =========================================================
   DETAIL
========================================================= */

function openBatchDetail(
    batch
){

    if(!batch){

        return;

    }


    activeDetailBatch =
        batch;

    activeDetailInitialQC =
        null;


    setText(
        "batchDetailTitle",
        batch.batch_code ||
        "-"
    );


    setText(
        "batchDetailProduct",
        batch.products?.name ||
        "-"
    );


    setText(
        "detailBatchCode",
        batch.batch_code ||
        "-"
    );


    setText(
        "detailProduct",
        batch.products?.name ||
        "-"
    );


    setText(
        "detailRecipe",
        batch.recipes?.name ||
        "-"
    );


    setText(
        "detailRecipeVersion",
        batch.recipe_versions
            ?.version_number
            ? `V${batch.recipe_versions.version_number}`
            : "-"
    );


    setText(
        "detailProductionDate",
        formatDate(
            batch.production_date
        )
    );


    setText(
        "detailPlannedVolume",
        `${formatNumber(
            batch.planned_volume
        )} ${
            batch.units?.name ||
            batch.units?.code ||
            ""
        }`
    );


    setText(
        "detailCurrentStage",
        formatStage(
            batch.current_stage
        )
    );


    setText(
        "detailStatus",
        formatStatus(
            batch.status
        )
    );


    setText(
        "detailNotes",
        batch.notes ||
        "Tidak ada catatan."
    );


    /*
     * Update Production Flow
     */

    updateProductionFlow(
        batch.current_stage
    );


    /*
     * Update tombol Mulai F1
     */

    const startF1Button =
        document.getElementById(
            "startF1FromDetailBtn"
        );


    const stage =
        String(
            batch.current_stage ||
            "production"
        )
            .toLowerCase();


    const status =
        String(
            batch.status ||
            "active"
        )
            .toLowerCase();


    const canStartF1 =
        stage === "production" &&
        status !== "cancelled" &&
        status !== "completed";


    if(startF1Button){

        startF1Button.classList.toggle(
            "hidden",
            !canStartF1
        );

        startF1Button.disabled =
            false;

        startF1Button.innerHTML =
            `
                <i
                    data-lucide="play-circle"
                ></i>

                <span>
                    Mulai F1
                </span>
            `;

    }


    const modal =
        document.getElementById(
            "batchDetailModal"
        );


    modal?.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "production-modal-open"
    );


    if(window.lucide){

        lucide.createIcons();

    }


    /* =====================================================
       LOAD INITIAL QC
    ===================================================== */

    loadBatchInitialQC(
        batch
    );

}
        if(saveButton){

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                `
                    <i data-lucide="save"></i>
                    <span>
                        Simpan Initial QC
                    </span>
                `;

            if(window.lucide){

                lucide.createIcons();

            }

        }

    }

}


/* =========================================================
   DETAIL
========================================================= */

function openBatchDetail(
    batch
){

    if(!batch){

        return;

    }


    activeDetailBatch =
        batch;

    activeDetailInitialQC =
        null;


    setText(
        "batchDetailTitle",
        batch.batch_code ||
        "-"
    );


    setText(
        "batchDetailProduct",
        batch.products?.name ||
        "-"
    );


    setText(
        "detailBatchCode",
        batch.batch_code ||
        "-"
    );


    setText(
        "detailProduct",
        batch.products?.name ||
        "-"
    );


    setText(
        "detailRecipe",
        batch.recipes?.name ||
        "-"
    );


    setText(
        "detailRecipeVersion",
        batch.recipe_versions
            ?.version_number
            ? `V${batch.recipe_versions.version_number}`
            : "-"
    );


    setText(
        "detailProductionDate",
        formatDate(
            batch.production_date
        )
    );


    setText(
        "detailPlannedVolume",
        `${formatNumber(
            batch.planned_volume
        )} ${
            batch.units?.name ||
            batch.units?.code ||
            ""
        }`
    );


    setText(
        "detailCurrentStage",
        formatStage(
            batch.current_stage
        )
    );


    setText(
        "detailStatus",
        formatStatus(
            batch.status
        )
    );


    setText(
        "detailNotes",
        batch.notes ||
        "Tidak ada catatan."
    );


    /*
     * Update Production Flow
     */

    updateProductionFlow(
        batch.current_stage
    );


    /*
     * Update tombol Mulai F1
     */

    const startF1Button =
        document.getElementById(
            "startF1FromDetailBtn"
        );


    const stage =
        String(
            batch.current_stage ||
            "production"
        )
            .toLowerCase();


    const status =
        String(
            batch.status ||
            "active"
        )
            .toLowerCase();


    const canStartF1 =
        stage === "production" &&
        status !== "cancelled" &&
        status !== "completed";


    if(startF1Button){

        startF1Button.classList.toggle(
            "hidden",
            !canStartF1
        );

        startF1Button.disabled =
            false;

        startF1Button.innerHTML =
            `
                <i
                    data-lucide="play-circle"
                ></i>

                <span>
                    Mulai F1
                </span>
            `;

    }


    const modal =
        document.getElementById(
            "batchDetailModal"
        );


    modal?.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "production-modal-open"
    );


    if(window.lucide){

        lucide.createIcons();

    }


    /* =====================================================
       LOAD INITIAL QC
    ===================================================== */

    loadBatchInitialQC(
        batch
    );

}


/* =========================================================
   PRODUCTION FLOW
========================================================= */

function updateProductionFlow(
    currentStage
){

    const stages = [
        "production",
        "f1",
        "f2",
        "harvest",
        "finished"
    ];


    const normalizedStage =
        String(
            currentStage ||
            "production"
        )
            .toLowerCase();


    const currentIndex =
        stages.indexOf(
            normalizedStage
        );


    const flowSteps =
        document.querySelectorAll(
            "#batchDetailModal .production-flow-step"
        );


    if(!flowSteps.length){

        return;

    }


    flowSteps.forEach(
        (
            step,
            index
        ) => {

            step.classList.remove(
                "active"
            );

            step.classList.remove(
                "completed"
            );


            if(
                currentIndex >= 0 &&
                index < currentIndex
            ){

                step.classList.add(
                    "completed"
                );

            }


            if(
                currentIndex >= 0 &&
                index === currentIndex
            ){

                step.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   LOADING
========================================================= */

function setProductionLoading(
    isLoading
){

    const loading =
        document.getElementById(
            "productionLoading"
        );


    if(isLoading){

        loading?.classList.remove(
            "hidden"
        );

        document
            .getElementById(
                "productionTableWrap"
            )
            ?.classList.add(
                "hidden"
            );

        document
            .getElementById(
                "productionEmpty"
            )
            ?.classList.add(
                "hidden"
            );

    }
    else{

        loading?.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showProductionError(
    message
){

    const element =
        document.getElementById(
            "productionError"
        );


    const messageElement =
        document.getElementById(
            "productionErrorMessage"
        );


    if(messageElement){

        messageElement.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    element?.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "productionTableWrap"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "productionEmpty"
        )
        ?.classList.add(
            "hidden"
        );


    if(window.lucide){

        lucide.createIcons();

    }

}


function hideProductionError(){

    document
        .getElementById(
            "productionError"
        )
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   CREATE ERROR
========================================================= */

function showCreateBatchError(
    message
){

    const box =
        document.getElementById(
            "createBatchError"
        );


    const messageElement =
        document.getElementById(
            "createBatchErrorMessage"
        );


    if(messageElement){

        messageElement.textContent =
            message ||
            "Terjadi kesalahan.";

    }


    box?.classList.remove(
        "hidden"
    );


    if(window.lucide){

        lucide.createIcons();

    }

}


function clearCreateBatchError(){

    document
        .getElementById(
            "createBatchError"
        )
        ?.classList.add(
            "hidden"
        );


    const messageElement =
        document.getElementById(
            "createBatchErrorMessage"
        );


    if(messageElement){

        messageElement.textContent =
            "";

    }

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    label
){

    if(!button){

        return;

    }


    button.disabled =
        loading;


    if(loading){

        button.innerHTML =
            `
            <span class="production-button-loader"></span>
            <span>${escapeHtml(
                label
            )}</span>
            `;

    }
    else{

        button.innerHTML =
            `
            <i data-lucide="plus"></i>
            <span>${escapeHtml(
                label
            )}</span>
            `;


        if(window.lucide){

            lucide.createIcons();

        }

    }

}


/* =========================================================
   FORMATTERS
========================================================= */

function formatDate(
    value
){

    if(!value){

        return "-";

    }


    const date =
        new Date(
            `${value}T00:00:00`
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


function formatDateTime(
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
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    )
        .format(
            date
        );

}


function formatNumber(
    value
){

    if(
        value ===
        null ||
        value ===
        undefined ||
        value ===
        ""
    ){

        return "0";

    }


    const number =
        Number(
            value
        );


    if(
        !Number.isFinite(
            number
        )
    ){

        return "0";

    }


    return new Intl.NumberFormat(
        "id-ID",
        {
            maximumFractionDigits:
                3
        }
    )
        .format(
            number
        );

}


function formatStage(
    value
){

    const stage =
        String(
            value ||
            "production"
        )
            .toLowerCase();


    const map = {

        production:
            "Production",

        f1:
            "F1",

        f2:
            "F2",

        harvest:
            "Harvest",

        finished:
            "Finished"

    };


    return map[
        stage
    ] ||
        stage
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /^\w/,
                char =>
                    char.toUpperCase()
            );

}


function formatStatus(
    value
){

    const status =
        String(
            value ||
            "active"
        )
            .toLowerCase();


    const map = {

        active:
            "Aktif",

        completed:
            "Selesai",

        cancelled:
            "Dibatalkan",

        draft:
            "Draft"

    };


    return map[
        status
    ] ||
        status;

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


    return (
        error.message ||
        error.details ||
        error.hint ||
        "Terjadi kesalahan pada Supabase."
    );

}


/* =========================================================
   TEXT
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
            value ??
            "-";

    }

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
    value
){

    return String(
        value ??
        ""
    )
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
/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
    value
){

    return String(
        value ??
        ""
    )
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
