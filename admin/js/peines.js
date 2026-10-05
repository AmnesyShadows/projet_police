// =========================================================
// CONFIGURATION
// =========================================================

const supabaseClient =
    window.supabaseClient;


// =========================================================
// ELEMENTS / VARIABLES
// =========================================================

const peines$ =
    id =>
        document.getElementById(id);

const list =
    peines$("list");

let peines = [];
let categories = [];
let delits = [];

let currentId = null;


// =========================================================
// UTILITAIRES
// =========================================================

function msg(text) {

    alert(text);

}


function categoryName(id) {

    return (
        categories.find(
            category =>
                String(category.id) ===
                String(id)
        )?.nom ||
        "Sans catégorie"
    );

}


function delitName(id) {

    return (
        delits.find(
            delit =>
                String(delit.id) ===
                String(id)
        )?.nom ||
        "Sans délit"
    );

}


function delitColor(id) {

    return (
        delits.find(
            delit =>
                String(delit.id) ===
                String(id)
        )?.couleur ||
        "#666666"
    );

}


// =========================================================
// INITIALISATION
// =========================================================

async function init() {

    console.log(
        "=== INITIALISATION PEINES ==="
    );


    if (!supabaseClient) {

        console.error(
            "SupabaseClient introuvable."
        );

        return;

    }


    console.log(
        "SupabaseClient trouvé."
    );


    await loadCategories();

    await loadDelits();

    await loadPeines();

    resetPeine();

}


// =========================================================
// CATEGORIES
// =========================================================

async function loadCategories() {

    console.log(
        "Chargement des catégories..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("categories")
            .select(
                "id, nom"
            )
            .order("nom");


    if (error) {

        console.error(
            "Erreur catégories :",
            error
        );


        msg(
            "Impossible de charger les catégories : " +
            error.message
        );


        return;

    }


    categories =
        data || [];


    console.log(
        "Catégories chargées :",
        categories
    );


    const select =
        peines$("categorie");


    select.innerHTML = `

        <option value="">
            Sélectionner une catégorie
        </option>

    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.nom;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// DELITS
// =========================================================

async function loadDelits() {

    console.log(
        "Chargement des délits..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("delits")
            .select(
                "id, nom, priority, couleur"
            )
            .order(
                "priority",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erreur délits :",
            error
        );


        msg(
            "Impossible de charger les délits : " +
            error.message
        );


        return;

    }


    delits =
        data || [];


    console.log(
        "Délits chargés :",
        delits
    );


    const select =
        peines$("delit");


    select.innerHTML = `

        <option value="">
            Sélectionner un délit
        </option>

    `;


    delits.forEach(
        delit => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                delit.id;


            option.textContent =
                delit.nom;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// PEINES
// =========================================================

async function loadPeines() {

    console.log(
        "Chargement des peines..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("peines")
            .select("*");


    if (error) {

        console.error(
            "Erreur chargement peines :",
            error
        );


        msg(
            "Impossible de charger les peines : " +
            error.message
        );


        return;

    }


    peines =
        data || [];


    console.log(
        "Peines chargées :",
        peines
    );


    // =====================================================
    // TRI NATUREL DES ARTICLES
    // =====================================================

    peines.sort(
        (a, b) => {

            const articleA =
                String(
                    a.article || ""
                );


            const articleB =
                String(
                    b.article || ""
                );


            return articleA.localeCompare(
                articleB,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );

        }
    );


    renderList();

}


// =========================================================
// LISTE
// =========================================================

function renderList() {

    if (!list) {

        return;

    }


    const search =
        peines$("search");


    const q =
        search
            ? search.value
                .toLowerCase()
                .trim()
            : "";


    list.innerHTML =
        "";


    peines
        .filter(
            peine => {

                const text = `

                    ${peine.article || ""}

                    ${peine.infraction || ""}

                    ${peine.description || ""}

                    ${peine.peine || ""}

                    ${categoryName(
                        peine.categorie
                    )}

                    ${delitName(
                        peine.delit
                    )}

                `
                    .toLowerCase();


                return text.includes(
                    q
                );

            }
        )
        .forEach(
            peine => {

                const d =
                    document.createElement(
                        "div"
                    );


                d.className =
                    "item" +
                    (
                        peine.id ===
                        currentId
                            ? " active"
                            : ""
                    );


                // =================================================
                // COULEUR DU DELIT
                // =================================================

                const couleur =
                    delitColor(
                        peine.delit
                    );


                if (
                    peine.id ===
                    currentId
                ) {

                    d.style.border =
                        "";

                } else {

                    d.style.border =
                        `1px solid ${couleur}`;

                }


                // =================================================
                // CONTENU
                // =================================================

                d.innerHTML = `

                    <b>

                        ${escapeHtml(
                            peine.article || ""
                        )}

                    </b>


                    <small>

                        ${escapeHtml(
                            peine.infraction || ""
                        )}

                        ·

                        ${escapeHtml(
                            delitName(
                                peine.delit
                            )
                        )}

                    </small>

                `;


                d.onclick =
                    () =>
                        editPeine(
                            peine
                        );


                list.appendChild(
                    d
                );

            }
        );

}


if (peines$("search")) {

    peines$("search").oninput =
        renderList;

}


// =========================================================
// NOUVELLE PEINE
// =========================================================

function resetPeine() {

    currentId =
        null;


    peines$("title").textContent =
        "Nouvelle peine";


    peines$("status").textContent =
        "Création d'une peine";


    peines$("delete")
        .classList
        .add("hidden");


    peines$("categorie").value =
        "";


    peines$("delit").value =
        "";


    peines$("article").value =
        "";


    peines$("infraction").value =
        "";


    peines$("description").value =
        "";


    peines$("nominal").value =
        "";


    peines$("maximal").value =
        "";


    peines$("unite").checked =
        false;


    peines$("peine").value =
        "";


    renderList();

}


if (peines$("new")) {

    peines$("new").onclick =
        resetPeine;

}


// =========================================================
// EDITION
// =========================================================

function editPeine(peine) {

    currentId =
        peine.id;


    peines$("title").textContent =
        peine.infraction ||
        peine.article ||
        "Peine";


    peines$("status").textContent =
        `ID : ${peine.id}`;


    peines$("delete")
        .classList
        .remove("hidden");


    peines$("categorie").value =
        peine.categorie || "";


    peines$("delit").value =
        peine.delit || "";


    peines$("article").value =
        peine.article || "";


    peines$("infraction").value =
        peine.infraction || "";


    peines$("description").value =
        peine.description || "";


    peines$("nominal").value =
        peine.nominal ?? "";


    peines$("maximal").value =
        peine.maximal ?? "";


    peines$("unite").checked =
        peine.unite === true;


    peines$("peine").value =
        peine.peine || "";


    renderList();

}


// =========================================================
// SAUVEGARDE
// =========================================================

if (peines$("save")) {

    peines$("save").onclick =
        async () => {

            const categorie =
                peines$("categorie")
                    .value ||
                null;


            const delit =
                peines$("delit")
                    .value ||
                null;


            const article =
                peines$("article")
                    .value
                    .trim();


            const infraction =
                peines$("infraction")
                    .value
                    .trim();


            const description =
                peines$("description")
                    .value
                    .trim();


            const nominalValue =
                peines$("nominal")
                    .value;


            const maximalValue =
                peines$("maximal")
                    .value;


            const unite =
                peines$("unite")
                    .checked;


            const peine =
                peines$("peine")
                    .value
                    .trim();


            if (
                !categorie ||
                !delit ||
                !article ||
                !infraction
            ) {

                msg(
                    "Catégorie, délit, article et infraction sont obligatoires."
                );


                return;

            }


            const payload = {

                categorie,

                delit,

                article,

                infraction,

                description,

                nominal:
                    nominalValue === ""
                        ? null
                        : Number(
                            nominalValue
                        ),

                maximal:
                    maximalValue === ""
                        ? null
                        : Number(
                            maximalValue
                        ),

                unite,

                peine

            };


            peines$("save").disabled =
                true;


            let result;


            // =================================================
            // MODIFICATION
            // =================================================

            if (currentId) {

                result =
                    await supabaseClient
                        .from("peines")
                        .update(payload)
                        .eq(
                            "id",
                            currentId
                        )
                        .select()
                        .single();

            }


            // =================================================
            // CREATION
            // =================================================

            else {

                result =
                    await supabaseClient
                        .from("peines")
                        .insert(payload)
                        .select()
                        .single();

            }


            peines$("save").disabled =
                false;


            if (result.error) {

                console.error(
                    "Erreur sauvegarde :",
                    result.error
                );


                msg(
                    result.error.message
                );


                return;

            }


            currentId =
                result.data.id;


            msg(
                "Peine enregistrée."
            );


            await loadPeines();


            const savedPeine =
                peines.find(
                    peine =>
                        peine.id ===
                        currentId
                );


            if (savedPeine) {

                editPeine(
                    savedPeine
                );

            }

        };

}


// =========================================================
// SUPPRESSION
// =========================================================

if (peines$("delete")) {

    peines$("delete").onclick =
        async () => {

            if (!currentId) {

                return;

            }


            const peine =
                peines.find(
                    x =>
                        x.id ===
                        currentId
                );


            if (
                !peine ||
                !confirm(
                    `Supprimer "${peine.infraction || peine.article}" ?`
                )
            ) {

                return;

            }


            const {
                error
            } =
                await supabaseClient
                    .from("peines")
                    .delete()
                    .eq(
                        "id",
                        currentId
                    );


            if (error) {

                console.error(
                    "Erreur suppression :",
                    error
                );


                msg(
                    error.message
                );


                return;

            }


            msg(
                "Peine supprimée."
            );


            resetPeine();


            await loadPeines();

        };

}


// =========================================================
// SECURITE
// =========================================================

function escapeHtml(value) {

    return String(
        value ?? ""
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


// =========================================================
// START
// =========================================================

async function startPeines() {

    console.log(
        "Vérification de la session..."
    );


    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "Erreur récupération session :",
            error
        );

        return;

    }


    if (!session) {

        console.log(
            "Aucune session utilisateur."
        );

        return;

    }


    console.log(
        "Session trouvée, chargement des données..."
    );

    admin.classList.remove("hidden");

    await init();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startPeines
    );

} else {

    startPeines();

}