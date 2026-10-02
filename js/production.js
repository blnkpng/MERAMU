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


    versionSelect.innerHTML =
        `
        <option value="">
            Pilih Recipe Version
        </option>
        `;


    versionSelect.disabled =
        true;


    if(!productId){

        recipeSelect.disabled =
            true;

        setVersionHint(
            "Pilih Recipe terlebih dahulu."
        );

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


    recipes.forEach(
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


    if(!recipes.length){

        recipeSelect.innerHTML =
            `
            <option value="">
                Tidak ada Recipe
            </option>
            `;

        setVersionHint(
            "Belum ada Recipe untuk Product ini."
        );

    }
    else{

        setVersionHint(
            "Pilih Recipe untuk melihat version."
        );

    }

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
            Memuat version...
        </option>
        `;


    versionSelect.disabled =
        true;


    if(!recipeId){

        versionSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe Version
            </option>
            `;

        setVersionHint(
            "Pilih Recipe terlebih dahulu."
        );

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


        versionSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe Version
            </option>
            `;


        productionRecipeVersions
            .forEach(
                version => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        version.id;


                    const currentRecipe =
                        productionRecipes.find(
                            recipe =>
                                recipe.id ===
                                recipeId
                        );


                    const isCurrent =
                        Number(
                            currentRecipe
                                ?.current_version_number
                        ) ===
                        Number(
                            version.version_number
                        );


                    option.textContent =
                        `V${version.version_number}${isCurrent ? " — Current" : ""}`;


                    versionSelect.appendChild(
                        option
                    );

                }
            );


        versionSelect.disabled =
            productionRecipeVersions.length === 0;


        if(
            productionRecipeVersions.length
        ){

            const currentRecipe =
                productionRecipes.find(
                    recipe =>
                        recipe.id ===
                        recipeId
                );


            const currentVersion =
                productionRecipeVersions.find(
                    version =>
                        Number(
                            version.version_number
                        ) ===
                        Number(
                            currentRecipe
                                ?.current_version_number
                        )
                );


            if(currentVersion){

                versionSelect.value =
                    currentVersion.id;

                setVersionHint(
                    `Current version: V${currentVersion.version_number}`
                );

            }
            else{

                setVersionHint(
                    "Pilih Recipe Version yang digunakan."
                );

            }

        }
        else{

            setVersionHint(
                "Recipe ini belum memiliki version."
            );

        }

    }
    catch(error){

        console.error(
            "Recipe Version Load Error:",
            error
        );


        versionSelect.innerHTML =
            `
            <option value="">
                Gagal memuat version
            </option>
            `;


        setVersionHint(
            getErrorMessage(error)
        );

    }

}


/* =========================================================
   VERSION HINT
========================================================= */

function setVersionHint(
    message
){

    const element =
        document.getElementById(
            "batchVersionHint"
        );


    if(element){

        element.textContent =
            message;

    }

}


/* =========================================================
   CREATE MODAL
========================================================= */

function openCreateBatchModal(){

    const modal =
        document.getElementById(
            "createBatchModal"
        );


    if(!modal){

        return;

    }


    clearCreateBatchError();

    resetCreateBatchForm();

    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "production-modal-open"
    );


    setTimeout(
        () => {

            document
                .getElementById(
                    "batchProduct"
                )
                ?.focus();

        },
        50
    );


    if(window.lucide){

        lucide.createIcons();

    }

}


function closeCreateBatchModal(){

    const modal =
        document.getElementById(
            "createBatchModal"
        );


    if(!modal){

        return;

    }


    modal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "production-modal-open"
    );

}


/* =========================================================
   RESET FORM
========================================================= */

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


    const versionSelect =
        document.getElementById(
            "batchRecipeVersion"
        );


    if(recipeSelect){

        recipeSelect.disabled =
            true;

        recipeSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe
            </option>
            `;

    }


    if(versionSelect){

        versionSelect.disabled =
            true;

        versionSelect.innerHTML =
            `
            <option value="">
                Pilih Recipe Version
            </option>
            `;

    }


    populateProductSelect();

    populateVolumeUnitSelect();

    setVersionHint(
        "Pilih Recipe terlebih dahulu."
    );


    setDefaultProductionDate();

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


    select.innerHTML =
        `
        <option value="">
            Pilih Unit
        </option>
        `;


    productionUnits
        .forEach(
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


    const plannedVolumeRaw =
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
            ?.trim() ||
        null;


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
            "Production Date wajib diisi."
        );

        return;

    }


    if(
        plannedVolumeRaw ===
        "" ||
        plannedVolumeRaw ===
        null ||
        plannedVolumeRaw ===
        undefined
    ){

        showCreateBatchError(
            "Planned Volume wajib diisi."
        );

        return;

    }


    const plannedVolume =
        Number(
            plannedVolumeRaw
        );


    if(
        !Number.isFinite(
            plannedVolume
        ) ||
        plannedVolume < 0
    ){

        showCreateBatchError(
            "Planned Volume harus berupa angka 0 atau lebih."
        );

        return;

    }


    if(!volumeUnitId){

        showCreateBatchError(
            "Volume Unit wajib dipilih."
        );

        return;

    }


    /*
     * Pastikan Recipe Version memang
     * milik Recipe yang dipilih.
     */

    const selectedVersion =
        productionRecipeVersions.find(
            version =>
                String(
                    version.id
                ) ===
                String(
                    recipeVersionId
                )
        );


    if(!selectedVersion){

        showCreateBatchError(
            "Recipe Version tidak valid atau bukan milik Recipe yang dipilih."
        );

        return;

    }


    if(
        String(
            selectedVersion.recipe_id
        ) !==
        String(
            recipeId
        )
    ){

        showCreateBatchError(
            "Recipe Version tidak sesuai dengan Recipe."
        );

        return;

    }


    const saveButton =
        document.getElementById(
            "saveCreateBatchBtn"
        );


    setButtonLoading(
        saveButton,
        true,
        "Menyimpan..."
    );


    try{

        const supabase =
            await waitForProductionSupabase();


        /*
         * IMPORTANT:
         *
         * batch_code TIDAK dikirim.
         *
         * Database trigger:
         * generate_meramu_batch_code()
         * akan membuatnya.
         */

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
                plannedVolume,

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
                planned_volume,
                volume_unit_id,
                current_stage,
                status,
                notes
            `)

            .single();


        if(error){

            throw error;

        }


        if(!data){

            throw new Error(
                "Batch berhasil dibuat tetapi data hasil insert tidak ditemukan."
            );

        }


        closeCreateBatchModal();


        await loadProductionPage();


        /*
         * Buka detail batch baru.
         */

        const createdBatch =
            productionBatches.find(
                batch =>
                    batch.id ===
                    data.id
            );


        if(createdBatch){

            openBatchDetail(
                createdBatch
            );

        }

    }
    catch(error){

        console.error(
            "Create Production Batch Error:",
            error
        );


        showCreateBatchError(
            getErrorMessage(error)
        );

    }
    finally{

        setButtonLoading(
            saveButton,
            false,
            "Buat Batch"
        );

    }

}


/* =========================================================
   RENDER PRODUCTION
========================================================= */

function renderProduction(){

    const searchInput =
        document.getElementById(
            "productionSearch"
        );


    const query =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    let filtered =
        Array.isArray(
            productionBatches
        )
            ? [
                ...productionBatches
            ]
            : [];


    /*
     * STATUS FILTER
     */

    if(
        activeStatusFilter !==
        "all"
    ){

        filtered =
            filtered.filter(
                batch =>
                    String(
                        batch.status ||
                        ""
                    )
                        .toLowerCase() ===
                    activeStatusFilter
            );

    }


    /*
     * SEARCH
     */

    if(query){

        filtered =
            filtered.filter(
                batch => {

                    const batchCode =
                        String(
                            batch.batch_code ||
                            ""
                        )
                            .toLowerCase();


                    const productName =
                        String(
                            batch.products
                                ?.name ||
                            ""
                        )
                            .toLowerCase();


                    const productCode =
                        String(
                            batch.products
                                ?.code ||
                            ""
                        )
                            .toLowerCase();


                    const recipeName =
                        String(
                            batch.recipes
                                ?.name ||
                            ""
                        )
                            .toLowerCase();


                    return (
                        batchCode.includes(
                            query
                        ) ||
                        productName.includes(
                            query
                        ) ||
                        productCode.includes(
                            query
                        ) ||
                        recipeName.includes(
                            query
                        )
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


    if(!filtered.length){

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


    renderProductionRows(
        filtered
    );

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
                    batch.status
                )
                    .toLowerCase() ===
                "active"
        ).length;


    const production =
        productionBatches.filter(
            batch =>
                String(
                    batch.current_stage
                )
                    .toLowerCase() ===
                "production"
        ).length;


    const completed =
        productionBatches.filter(
            batch =>
                String(
                    batch.status
                )
                    .toLowerCase() ===
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
   TABLE ROWS
========================================================= */

function renderProductionRows(
    batches
){

    const tbody =
        document.getElementById(
            "productionTableBody"
        );


    if(!tbody){

        return;

    }


    tbody.innerHTML =
        batches
            .map(
                batch =>
                    createProductionRow(
                        batch
                    )
            )
            .join("");


    if(window.lucide){

        lucide.createIcons();

    }

}


/* =========================================================
   ROW
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
        null;


    const unit =
        batch.units ||
        null;


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


    const stageClass =
        `stage-${escapeHtml(stage)}`;


    const statusClass =
        `status-${escapeHtml(status)}`;


    /*
     * MULAI F1 hanya boleh dilakukan
     * pada batch yang masih berada
     * di stage Production dan status
     * bukan cancelled / completed.
     */

    const canStartF1 =
        stage === "production" &&
        status !== "cancelled" &&
        status !== "completed";


    const startF1Button =
        canStartF1
            ? `
                <button
                    type="button"
                    class="production-action-btn production-action-btn-f1"
                    title="Mulai F1"
                    aria-label="Mulai F1"
                    data-production-action="start-f1"
                    data-id="${escapeHtml(
                        batch.id
                    )}"
                >

                    <i
                        data-lucide="play-circle"
                    ></i>

                    <span>
                        Mulai F1
                    </span>

                </button>
              `
            : "";


    return `

        <tr>

            <td>

                <div class="production-batch-code">

                    ${escapeHtml(
                        batch.batch_code ||
                        "-"
                    )}

                </div>

                <div class="production-batch-date">

                    ${formatDate(
                        batch.production_date
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

                <div class="production-product-code">

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

            </td>


            <td>

                ${
                    version
                        ? `
                            <span class="production-version">
                                V${escapeHtml(
                                    version.version_number
                                )}
                            </span>
                          `
                        : `
                            <span class="production-version">
                                -
                            </span>
                          `
                }

            </td>


            <td>

                ${formatDate(
                    batch.production_date
                )}

            </td>


            <td>

                <div class="production-volume">

                    ${formatNumber(
                        batch.planned_volume
                    )}

                    ${escapeHtml(
                        unit?.code ||
                        unit?.name ||
                        ""
                    )}

                </div>

            </td>


            <td>

                <span
                    class="
                        production-stage-badge
                        ${stageClass}
                    "
                >

                    ${formatStage(
                        stage
                    )}

                </span>

            </td>


            <td>

                <span
                    class="
                        production-status-badge
                        ${statusClass}
                    "
                >

                    ${formatStatus(
                        status
                    )}

                </span>

            </td>


            <td>

                <div class="production-row-actions">

                    <button
                        type="button"
                        class="production-icon-btn"
                        title="Lihat detail"
                        aria-label="Lihat detail"
                        data-production-action="detail"
                        data-id="${escapeHtml(
                            batch.id
                        )}"
                    >

                        <i
                            data-lucide="eye"
                        ></i>

                    </button>


                    ${startF1Button}

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   TABLE ACTION DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-production-action]"
            );


        if(!button){

            return;

        }


        const action =
            button.dataset.productionAction;


        const id =
            button.dataset.id;


        const batch =
            productionBatches.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        id
                    )
            );


        if(!batch){

            return;

        }


        /*
         * DETAIL
         */

        if(
            action ===
            "detail"
        ){

            openBatchDetail(
                batch
            );

            return;

        }


        /*
         * START F1
         */

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
            day: "2-digit",
            month: "short",
            year: "numeric"
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
            maximumFractionDigits: 3
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


    return map[stage] ||
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


    return map[status] ||
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
