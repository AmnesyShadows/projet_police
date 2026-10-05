// =========================================================
// CONFIGURATION
// =========================================================

const SUPABASE_URL =
    "https://kdahsggjtmgcjiguidfr.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_ELLTPv_hy2TybFrHKS3Mdg_HadZh9JH";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// =========================================================
// VARIABLES
// =========================================================

const $ = id =>
    document.getElementById(id);

let agents = [];
let peines = [];


// =========================================================
// INITIALISATION
// =========================================================

async function init() {

    await loadAgents();
    await loadPeines();

    const now = new Date();

    $("date").value =
        now.toISOString()
            .split("T")[0];

    $("heure").value =
        now.toTimeString()
            .slice(0, 5);

    addIndividu();
}


// =========================================================
// AGENTS
// =========================================================

async function loadAgents() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("agents")
            .select(
                "id, nom, prenom, matricule, grade, actif"
            )
            .eq("actif", true)
            .order("matricule");

    if (error) {

        console.error(
            "Erreur agents :",
            error
        );

        if ($("agents-error")) {

            $("agents-error").textContent =
                "Impossible de charger les agents : " +
                error.message;
        }

        return;
    }

    agents =
        data || [];

    renderAgents();
    renderRedacteur();
}


// =========================================================
// AGENTS PRESENTS
// =========================================================

function renderAgents() {

    const container =
        $("agents-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    agents
        .filter(
            agent =>
                agent.actif == true
        )
        .forEach(
            agent => {

                const label =
                    document.createElement(
                        "label"
                    );

                label.className =
                    "agent-check";

                label.innerHTML = `

                    <input
                        type="checkbox"
                        value="${escapeHtml(agent.id)}"
                    >

                    <span>
                        ${escapeHtml(agent.matricule)}
                        -
                        ${escapeHtml(agent.prenom)}
                        ${escapeHtml(agent.nom)}
                    </span>

                `;

                container.appendChild(label);
            }
        );
}


// =========================================================
// AGENT REDACTEUR
// =========================================================

function renderRedacteur() {

    const select =
        $("redacteur");

    if (!select) {
        return;
    }

    select.innerHTML = `

        <option value="">
            Sélectionner un agent
        </option>

    `;

    agents
        .filter(
            agent =>
                agent.actif == true
        )
        .forEach(
            agent => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    agent.id;

                option.textContent =
                    `${agent.matricule} - ${agent.prenom} ${agent.nom}`;

                select.appendChild(option);
            }
        );
}


// =========================================================
// MATRICULE REDACTEUR
// =========================================================

$("redacteur").addEventListener(
    "change",
    () => {

        const agent =
            agents.find(
                agent =>
                    String(agent.id) ===
                    String(
                        $("redacteur").value
                    )
            );

        $("redacteur-matricule").value =
            agent?.matricule || "";
    }
);


// =========================================================
// PEINES
// =========================================================

async function loadPeines() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("peines")
            .select(`
                id,
                article,
                infraction,
                delit,
                nominal,
                maximal,
                peine,
                delits (
                    id,
                    nom,
                    couleur
                )
            `)
            .order("article");

    if (error) {

        console.error(
            "Erreur peines :",
            error
        );

        alert(
            "Impossible de charger les peines : " +
            error.message
        );

        return;
    }

    peines =
        data || [];
}


function getPeineColor(peine) {

    const delit =
        Array.isArray(peine?.delits)
            ? peine.delits[0]
            : peine?.delits;

    return delit?.couleur || "#888888";
}


// =========================================================
// AJOUT INDIVIDU
// =========================================================

function addIndividu() {

    const number =
        document.querySelectorAll(
            "#individus-container .individu"
        ).length + 1;

    const div =
        document.createElement("div");

    div.className =
        "rapport-block individu";

    div.dataset.number =
        number;

    div.innerHTML = `

        <div class="rapport-block-header">

            <h3>
                Individu n°${number}
            </h3>

            <button
                type="button"
                class="rapport-remove"
                onclick="removeBlock(this)"
            >
                Supprimer
            </button>

        </div>

        <div class="rapport-grid">

            <label>
                Prénom / Nom
                <input
                    type="text"
                    class="individu-nom"
                    placeholder="Prénom Nom"
                >
            </label>

            <label>
                Téléphone
                <input
                    type="text"
                    class="individu-telephone"
                    placeholder="Téléphone"
                >
            </label>

            <label class="rapport-full">
                Objets saisis
                <textarea
                    class="individu-objets"
                    rows="3"
                    placeholder="Objet saisie 1 x 1 - (6zqe654qze68qze7456)
Objet saisie 2 x 1 - (qzdqd54dqzdq8ddqz54)"
                ></textarea>
            </label>

            <label>
                Lecture des droits
                <select class="individu-droits">

                    <option value="">
                        Sélectionner
                    </option>

                    <option
                        value="Oui"
                        selected
                    >
                        Oui
                    </option>

                    <option value="Non">
                        Non
                    </option>

                </select>
            </label>

            <label>
                Heure de lecture des droits
                <input
                    type="time"
                    class="individu-heure-droits"
                >
            </label>

            <div class="rapport-full">

                <label>
                    Fait reproché

                    <input
                        type="text"
                        class="individu-peine-search"
                        placeholder="Rechercher une infraction..."
                        autocomplete="off"
                    >
                </label>

                <div class="individu-peine-results"></div>

                <div class="individu-peine-selected"></div>

            </div>

            <label>
                Exercice des droits

                <select class="individu-exercice">

                    <option value="">
                        Sélectionner
                    </option>

                    <option value="Non">
                        Non
                    </option>

                    <option value="Oui">
                        Oui
                    </option>

                </select>
            </label>

            <label>
                Précision exercice des droits

                <input
                    type="text"
                    class="individu-exercice-details"
                    placeholder="Précision si nécessaire"
                >
            </label>

            <label>
                Amende

                <input
                    type="number"
                    step="any"
                    class="individu-amende"
                    placeholder="Calcul automatique ou à la main"
                >
            </label>

            <label class="rapport-full">
                Peine / Sanction

                <textarea
                    class="individu-sanction"
                    rows="3"
                    placeholder="50min de GAV"
                ></textarea>
            </label>

        </div>
    `;

    $("individus-container")
        .appendChild(div);

    setupPeineSearch(div);
}


// =========================================================
// RECHERCHE INFRACTION
// =========================================================

function setupPeineSearch(div) {

    const searchInput =
        div.querySelector(
            ".individu-peine-search"
        );

    const resultsContainer =
        div.querySelector(
            ".individu-peine-results"
        );

    const selectedContainer =
        div.querySelector(
            ".individu-peine-selected"
        );

    if (
        !searchInput ||
        !resultsContainer ||
        !selectedContainer
    ) {
        return;
    }

    let selectedPeines = [];

    div.selectedPeines =
        selectedPeines;


    function renderPeineResults() {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();

        resultsContainer.innerHTML =
            "";

        if (!search) {
            return;
        }

        const results =
            peines
                .filter(
                    peine => {

                        const article =
                            String(
                                peine.article || ""
                            )
                            .toLowerCase();

                        const infraction =
                            String(
                                peine.infraction || ""
                            )
                            .toLowerCase();

                        return (
                            article.includes(search) ||
                            infraction.includes(search)
                        );
                    }
                )
                .filter(
                    peine =>
                        !selectedPeines.some(
                            selected =>
                                String(
                                    selected.id
                                ) ===
                                String(
                                    peine.id
                                )
                        )
                )
                .slice(0, 10);


        if (!results.length) {

            resultsContainer.innerHTML = `

                <div class="peine-no-result">
                    Aucune infraction trouvée
                </div>

            `;

            return;
        }


        results.forEach(
            peine => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "peine-result";

                button.dataset.id =
                    peine.id;

                button.textContent =
                    `${peine.article} — ${peine.infraction}`;

                button.style.borderLeft =
                    `4px solid ${getPeineColor(peine)}`;

                button.addEventListener(
                    "click",
                    () => {

                        addPeine(
                            peine
                        );
                    }
                );

                resultsContainer.appendChild(
                    button
                );
            }
        );
    }


    function addPeine(peine) {

        const alreadySelected =
            selectedPeines.some(
                selected =>
                    String(
                        selected.id
                    ) ===
                    String(
                        peine.id
                    )
            );

        if (alreadySelected) {
            return;
        }

        selectedPeines.push(
            peine
        );

        div.selectedPeines =
            selectedPeines;

        searchInput.value =
            "";

        renderSelectedPeines();
        renderPeineResults();
        updatePeineValues();
    }


    function renderSelectedPeines() {

        selectedContainer.innerHTML =
            "";

        selectedPeines.forEach(
            peine => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "peine-selected";

                item.dataset.id =
                    peine.id;

                item.style.border =
                    `1px solid ${getPeineColor(peine)}`;

                item.style.borderRadius =
                    "6px";

                item.style.display =
                    "flex";

                item.style.alignItems =
                    "center";

                item.style.gap =
                    "10px";

                item.style.padding =
                    "8px 10px";

                item.style.marginBottom =
                    "6px";

                const text =
                    document.createElement(
                        "span"
                    );

                const dot =
                    document.createElement(
                        "span"
                    );

                dot.style.width =
                    "9px";

                dot.style.height =
                    "9px";

                dot.style.borderRadius =
                    "50%";

                dot.style.background =
                    getPeineColor(peine);

                dot.style.flexShrink =
                    "0";

                item.appendChild(dot);

                text.textContent =
                    `${peine.article} — ${peine.infraction}`;

                const removeButton =
                    document.createElement(
                        "button"
                    );

                removeButton.type =
                    "button";

                removeButton.className =
                    "peine-remove";

                removeButton.textContent =
                    "×";

                removeButton.title =
                    "Retirer cette infraction";

                removeButton.addEventListener(
                    "click",
                    () => {

                        removePeine(
                            peine.id
                        );
                    }
                );

                item.appendChild(text);

                removeButton.style.marginLeft =
                    "auto";

                removeButton.style.border =
                    "none";

                removeButton.style.background =
                    "transparent";

                removeButton.style.color =
                    "#888";

                removeButton.style.fontSize =
                    "18px";

                removeButton.style.cursor =
                    "pointer";

                removeButton.style.padding =
                    "0 4px";

                item.appendChild(
                    removeButton
                );

                selectedContainer.appendChild(
                    item
                );
            }
        );
    }


    function removePeine(id) {

        selectedPeines =
            selectedPeines.filter(
                peine =>
                    String(
                        peine.id
                    ) !==
                    String(
                        id
                    )
            );

        div.selectedPeines =
            selectedPeines;

        renderSelectedPeines();
        renderPeineResults();
        updatePeineValues();
    }


    function updatePeineValues() {

        const amende =
            div.querySelector(
                ".individu-amende"
            );

        const sanction =
            div.querySelector(
                ".individu-sanction"
            );

        const totalAmende =
            selectedPeines.reduce(
                (
                    total,
                    peine
                ) => {

                    if (
                        peine.nominal !== null &&
                        peine.nominal !== undefined
                    ) {

                        return (
                            total +
                            Number(
                                peine.nominal
                            )
                        );
                    }

                    return total;

                },
                0
            );

        if (
            selectedPeines.length > 0
        ) {

            amende.value =
                totalAmende;

        } else {

            amende.value =
                "";

        }
    }


    searchInput.addEventListener(
        "input",
        renderPeineResults
    );
}


// =========================================================
// AJOUT VEHICULE
// =========================================================

function addVehicule() {

    const number =
        document.querySelectorAll(
            "#vehicules-container .vehicule"
        ).length + 1;

    const div =
        document.createElement(
            "div"
        );

    div.className =
        "rapport-block vehicule";

    div.dataset.number =
        number;

    div.innerHTML = `

        <div class="rapport-block-header">

            <h3>
                Véhicule n°${number}
            </h3>

            <button
                type="button"
                class="rapport-remove"
                onclick="removeBlock(this)"
            >
                Supprimer
            </button>

        </div>

        <div class="rapport-grid">

            <label>
                Modèle

                <input
                    type="text"
                    class="vehicule-modele"
                    placeholder="Modèle"
                >
            </label>

            <label>
                Couleur

                <input
                    type="text"
                    class="vehicule-couleur"
                    placeholder="Couleur"
                >
            </label>

            <label>
                Propriétaire

                <input
                    type="text"
                    class="vehicule-proprietaire"
                    placeholder="Prénom Nom"
                >
            </label>

            <label>
                Immatriculation

                <input
                    type="text"
                    class="vehicule-immatriculation"
                    placeholder="Immatriculation"
                >
            </label>

        </div>
    `;

    $("vehicules-container")
        .appendChild(div);
}


// =========================================================
// AJOUT VICTIME / OTAGE
// =========================================================

function addVictime() {

    const number =
        document.querySelectorAll(
            "#victimes-container .victime"
        ).length + 1;

    const div =
        document.createElement(
            "div"
        );

    div.className =
        "rapport-block victime";

    div.dataset.number =
        number;

    div.dataset.type =
        "victime";

    div.innerHTML = `

        <div class="rapport-block-header">

            <h3>
                Victime
            </h3>

            <button
                type="button"
                class="rapport-remove"
                onclick="removeBlock(this)"
            >
                Supprimer
            </button>

        </div>

        <div class="rapport-grid">

            <div class="victime-type rapport-full">

                <span class="victime-type-title">
                    Type
                </span>

                <div class="victime-type-options">

                    <label>

                        <input
                            type="radio"
                            name="victime-type-${number}"
                            value="victime"
                            class="victime-type-input"
                            checked
                        >

                        Victime

                    </label>

                    <label>

                        <input
                            type="radio"
                            name="victime-type-${number}"
                            value="otage"
                            class="victime-type-input"
                        >

                        Otage

                    </label>

                </div>

            </div>

            <label>

                Prénom / Nom

                <input
                    type="text"
                    class="victime-nom"
                    placeholder="Prénom Nom"
                >

            </label>

            <label>

                Téléphone

                <input
                    type="text"
                    class="victime-telephone"
                    placeholder="Téléphone"
                >

            </label>

            <label class="rapport-full">

                État / Blessures

                <textarea
                    class="victime-etat"
                    rows="4"
                    placeholder="Bien, Blessé, Décédé, etc"
                ></textarea>

            </label>

        </div>
    `;

    $("victimes-container")
        .appendChild(div);


    const typeInputs =
        div.querySelectorAll(
            ".victime-type-input"
        );


    typeInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                () => {

                    updateVictimeNumbers();

                }
            );
        }
    );


    updateVictimeNumbers();
}


// =========================================================
// NUMEROTATION VICTIMES / OTAGES
// =========================================================

function updateVictimeNumbers() {

    let victimeNumber =
        0;

    let otageNumber =
        0;

    const blocks =
        document.querySelectorAll(
            "#victimes-container .victime"
        );


    blocks.forEach(
        block => {

            const selected =
                block.querySelector(
                    ".victime-type-input:checked"
                );

            const type =
                selected
                    ? selected.value
                    : "victime";

            block.dataset.type =
                type;

            let number;


            if (
                type === "otage"
            ) {

                otageNumber++;

                number =
                    otageNumber;

            } else {

                victimeNumber++;

                number =
                    victimeNumber;
            }


            const title =
                block.querySelector(
                    ".rapport-block-header h3"
                );


            if (title) {

                title.textContent =
                    type === "otage"
                        ? `Otage n°${number}`
                        : `Victime n°${number}`;
            }
        }
    );
}


// =========================================================
// BOUTONS AJOUT
// =========================================================

$("add-individu").onclick =
    addIndividu;

$("add-vehicule").onclick =
    addVehicule;

$("add-victime").onclick =
    addVictime;


// =========================================================
// SUPPRESSION DES BLOCS
// =========================================================

function removeBlock(button) {

    const block =
        button.closest(
            ".rapport-block"
        );

    if (!block) {
        return;
    }

    block.remove();


    renumberBlocks(
        ".individu",
        "#individus-container",
        "Individu n°"
    );


    renumberBlocks(
        ".vehicule",
        "#vehicules-container",
        "Véhicule n°"
    );


    updateVictimeNumbers();
}


// =========================================================
// RENOMMAGE DES BLOCS
// =========================================================

function renumberBlocks(
    selector,
    containerSelector,
    titlePrefix
) {

    const blocks =
        document.querySelectorAll(
            `${containerSelector} ${selector}`
        );


    blocks.forEach(
        (
            block,
            index
        ) => {

            const title =
                block.querySelector(
                    ".rapport-block-header h3"
                );


            if (title) {

                title.textContent =
                    `${titlePrefix}${index + 1}`;
            }
        }
    );
}


// =========================================================
// AGENTS SELECTIONNES
// =========================================================

function getAgentsPresents() {

    const checked =
        document.querySelectorAll(
            "#agents-list input:checked"
        );


    return Array.from(
        checked
    )
        .map(
            input =>
                agents.find(
                    agent =>
                        String(
                            agent.id
                        ) ===
                        String(
                            input.value
                        )
                )
        )
        .filter(Boolean);
}


// =========================================================
// VALIDATION
// =========================================================

function validateRequiredFields() {

    const requiredFields =
        document.querySelectorAll(
            "#date[required], " +
            "#heure[required], " +
            "#lieu[required], " +
            "#motif[required], " +
            "#faits[required], " +
            "#redacteur[required]"
        );

    const missingFields =
        [];


    requiredFields.forEach(
        field => {

            if (!field.value.trim()) {

                let name = "";


                switch (field.id) {

                    case "date":
                        name =
                            "date de l'intervention.";
                        break;

                    case "heure":
                        name =
                            "heure de l'intervention.";
                        break;

                    case "lieu":
                        name =
                            "lieu de l'intervention.";
                        break;

                    case "motif":
                        name =
                            "motif de l'intervention.";
                        break;

                    case "faits":
                        name =
                            "déroulement des faits.";
                        break;

                    case "redacteur":
                        name =
                            "rédacteur.";
                        break;

                    default:
                        name =
                            "champs obligatoires.";
                        break;
                }


                missingFields.push(
                    name
                );
            }
        }
    );


    const agentsPresents =
        getAgentsPresents();


    if (
        agentsPresents.length === 0
    ) {

        missingFields.push(
            "agent(s) présent(s)."
        );
    }


    if (
        missingFields.length === 0
    ) {

        return true;
    }


    const list =
        missingFields
            .map(
                field =>
                    `<li>${escapeHtml(field)}</li>`
            )
            .join("");


    showModal(
        "Formulaire incomplet",
        "Veuillez renseigner les champs obligatoires avant de générer le rapport.",
        `<ul>${list}</ul>`
    );


    return false;
}


// =========================================================
// GENERATION DU RAPPORT
// =========================================================

function generateReport() {

    if (
        !validateRequiredFields()
    ) {
        return;
    }


    const agentsPresents =
        getAgentsPresents();


    if (
        agentsPresents.length === 0
    ) {

        showModal(
            "Formulaire incomplet",
            "Veuillez sélectionner au moins un agent présent."
        );

        return;
    }


    const lieu =
        $("lieu")
            .value
            .trim();


    const date =
        $("date")
            .value;


    const heure =
        $("heure")
            .value;


    const motif =
        $("motif")
            .value
            .trim();


    const faits =
        $("faits")
            .value
            .trim();


    const redacteur =
        agents.find(
            agent =>
                String(
                    agent.id
                ) ===
                String(
                    $("redacteur").value
                )
        );


    let rapport =
        "";


    // =====================================================
    // TITRE
    // =====================================================

    rapport +=
        "<h1>RAPPORT D’INTERVENTION / ARRESTATION</h1>";


    // =====================================================
    // 1. INFORMATIONS GENERALES
    // =====================================================

    rapport +=
        "<h2>1. INFORMATIONS GÉNÉRALES</h2>";


    rapport +=
        `<p><strong>Agents présents :</strong> ${formatAgents(
            agentsPresents
        )}</p>`;


    const dateFormatee =
        date
            ? date
                .split("-")
                .reverse()
                .join("/")
            : "";


    rapport +=
        `<p><strong>Date :</strong> ${dateFormatee}</p>`;


    const heureFormatee =
        heure
            ? heure.replace(":", "h")
            : "";


    rapport +=
        `<p><strong>Heure :</strong> ${heureFormatee}</p>`;


    rapport +=
        `<p><strong>Lieu :</strong> ${lieu}</p>`;


    rapport +=
        `<p><strong>Motif de l’intervention :</strong> ${motif}</p>`;


    rapport +=
        "<hr />";


    // =====================================================
    // 2. DEROULEMENT
    // =====================================================

    rapport +=
        "<h2>2. DÉROULEMENT DES FAITS</h2>";


    rapport +=
        `<p>${faits || ""}</p>`;


    rapport +=
        "<hr />";


    let numeroSection =
        3;


    // =====================================================
    // INDIVIDUS
    // =====================================================

    const individus =
        Array.from(
            document.querySelectorAll(
                "#individus-container .individu"
            )
        )
        .filter(
            div => {

                const nom =
                    getValue(
                        div,
                        ".individu-nom"
                    );

                const telephone =
                    getValue(
                        div,
                        ".individu-telephone"
                    );

                const objets =
                    getValue(
                        div,
                        ".individu-objets"
                    );

                const heureDroits =
                    getValue(
                        div,
                        ".individu-heure-droits"
                    );

                const exercice =
                    getValue(
                        div,
                        ".individu-exercice"
                    );

                const exerciceDetails =
                    getValue(
                        div,
                        ".individu-exercice-details"
                    );

                const amende =
                    getValue(
                        div,
                        ".individu-amende"
                    );

                const sanction =
                    getValue(
                        div,
                        ".individu-sanction"
                    );

                const droits =
                    getValue(
                        div,
                        ".individu-droits"
                    );

                const selectedPeines =
                    div.selectedPeines || [];


                return (
                    nom ||
                    telephone ||
                    objets ||
                    heureDroits ||
                    exercice ||
                    exerciceDetails ||
                    amende ||
                    sanction ||
                    selectedPeines.length > 0 ||
                    droits === "Non"
                );
            }
        );


    if (
        individus.length > 0
    ) {

        rapport +=
            `<h2>${numeroSection}. INDIVIDUS IMPLIQUÉS</h2>`;

        numeroSection++;


        individus.forEach(
            (
                div,
                index
            ) => {

                const nom =
                    getValue(
                        div,
                        ".individu-nom"
                    );

                const telephone =
                    getValue(
                        div,
                        ".individu-telephone"
                    );

                const objets =
                    getValue(
                        div,
                        ".individu-objets"
                    );

                const droits =
                    getValue(
                        div,
                        ".individu-droits"
                    );

                const heureDroits =
                    getValue(
                        div,
                        ".individu-heure-droits"
                    );

                const selectedPeines =
                    div.selectedPeines || [];

                const exercice =
                    getValue(
                        div,
                        ".individu-exercice"
                    );

                const exerciceDetails =
                    getValue(
                        div,
                        ".individu-exercice-details"
                    );

                const amende =
                    getValue(
                        div,
                        ".individu-amende"
                    );

                const sanction =
                    getValue(
                        div,
                        ".individu-sanction"
                    );


                rapport +=
                    `<h3>Individu n°${index + 1}</h3>`;


                rapport +=
                    `<p><strong>Prénom / Nom :</strong> ${nom}</p>`;


                rapport +=
                    `<p><strong>Téléphone :</strong> ${telephone}</p>`;


                rapport +=
                    `<p><strong>Objets saisis :</strong> ${objets}</p>`;


                rapport +=
                    `<p><strong>Lecture des droits :</strong> ${droits}</p>`;


                const heureDroitsFormatee =
                    heureDroits
                        ? heureDroits.replace(":", "h")
                        : "";


                rapport +=
                    `<p><strong>Heure de lecture des droits :</strong> ${heureDroitsFormatee} h</p>`;


                rapport +=
                    "<p><strong>Faits reprochés :</strong></p>";


                if (
                    selectedPeines.length
                ) {

                    selectedPeines.forEach(
                        peine => {

                            rapport +=
                                `<p>- ${peineText(
                                    peine
                                )}</p>`;
                        }
                    );
                }


                rapport +=
                    `<p><strong>Exercice des droits :</strong> ${formatExercice(
                        exercice,
                        exerciceDetails
                    )}</p>`;


                rapport +=
                    `<p><strong>Amende :</strong> $${amende}</p>`;


                rapport +=
                    `<p><strong>Peine / Sanction :</strong> ${sanction}</p>`;
            }
        );


        rapport +=
            "<hr />";
    }


    // =====================================================
    // VEHICULES
    // =====================================================

    const vehicules =
        Array.from(
            document.querySelectorAll(
                "#vehicules-container .vehicule"
            )
        )
        .filter(
            div => {

                const modele =
                    getValue(
                        div,
                        ".vehicule-modele"
                    );

                const couleur =
                    getValue(
                        div,
                        ".vehicule-couleur"
                    );

                const proprietaire =
                    getValue(
                        div,
                        ".vehicule-proprietaire"
                    );

                const immatriculation =
                    getValue(
                        div,
                        ".vehicule-immatriculation"
                    );


                return (
                    modele ||
                    couleur ||
                    proprietaire ||
                    immatriculation
                );
            }
        );


    if (
        vehicules.length > 0
    ) {

        rapport +=
            `<h2>${numeroSection}. VÉHICULES</h2>`;

        numeroSection++;


        vehicules.forEach(
            (
                div,
                index
            ) => {

                const modele =
                    getValue(
                        div,
                        ".vehicule-modele"
                    );

                const couleur =
                    getValue(
                        div,
                        ".vehicule-couleur"
                    );

                const proprietaire =
                    getValue(
                        div,
                        ".vehicule-proprietaire"
                    );

                const immatriculation =
                    getValue(
                        div,
                        ".vehicule-immatriculation"
                    );


                rapport +=
                    `<h3>Véhicule n°${index + 1}</h3>`;


                rapport +=
                    `<p><strong>Modèle :</strong> ${modele}</p>`;


                rapport +=
                    `<p><strong>Couleur :</strong> ${couleur}</p>`;


                rapport +=
                    `<p><strong>Propriétaire :</strong> ${proprietaire}</p>`;


                rapport +=
                    `<p><strong>Immatriculation :</strong> ${immatriculation}</p>`;
            }
        );


        rapport +=
            "<hr />";
    }


    // =====================================================
    // VICTIMES / OTAGES
    // =====================================================

    const personnes =
        Array.from(
            document.querySelectorAll(
                "#victimes-container .victime"
            )
        )
        .filter(
            div => {

                const nom =
                    getValue(
                        div,
                        ".victime-nom"
                    );

                const telephone =
                    getValue(
                        div,
                        ".victime-telephone"
                    );

                const etat =
                    getValue(
                        div,
                        ".victime-etat"
                    );


                return (
                    nom ||
                    telephone ||
                    etat
                );
            }
        );


    if (
        personnes.length > 0
    ) {

        rapport +=
            `<h2>${numeroSection}. OTAGES / VICTIMES</h2>`;

        numeroSection++;


        // =================================================
        // ON SEPARE LES VICTIMES ET LES OTAGES
        // =================================================

        const victimes =
            personnes.filter(
                div => {

                    const selected =
                        div.querySelector(
                            ".victime-type-input:checked"
                        );

                    return (
                        !selected ||
                        selected.value === "victime"
                    );
                }
            );


        const otages =
            personnes.filter(
                div => {

                    const selected =
                        div.querySelector(
                            ".victime-type-input:checked"
                        );

                    return (
                        selected &&
                        selected.value === "otage"
                    );
                }
            );


        // =================================================
        // VICTIMES
        // =================================================

        victimes.forEach(
            (
                div,
                index
            ) => {

                const nom =
                    getValue(
                        div,
                        ".victime-nom"
                    );

                const telephone =
                    getValue(
                        div,
                        ".victime-telephone"
                    );

                const etat =
                    getValue(
                        div,
                        ".victime-etat"
                    );


                rapport +=
                    `<h3>Victime n°${index + 1}</h3>`;


                rapport +=
                    `<p><strong>Prénom / Nom :</strong> ${nom}</p>`;


                rapport +=
                    `<p><strong>Téléphone :</strong> ${telephone}</p>`;


                rapport +=
                    `<p><strong>État / Blessures :</strong> ${etat}</p>`;
            }
        );


        // =================================================
        // OTAGES
        // =================================================

        otages.forEach(
            (
                div,
                index
            ) => {

                const nom =
                    getValue(
                        div,
                        ".victime-nom"
                    );

                const telephone =
                    getValue(
                        div,
                        ".victime-telephone"
                    );

                const etat =
                    getValue(
                        div,
                        ".victime-etat"
                    );


                rapport +=
                    `<h3>Otage n°${index + 1}</h3>`;


                rapport +=
                    `<p><strong>Prénom / Nom :</strong> ${nom}</p>`;


                rapport +=
                    `<p><strong>Téléphone :</strong> ${telephone}</p>`;


                rapport +=
                    `<p><strong>État / Blessures :</strong> ${etat}</p>`;
            }
        );


        rapport +=
            "<hr />";
    }


    // =====================================================
    // AGENT REDACTEUR
    // =====================================================

    rapport +=
        `<h2>${numeroSection}. AGENT RÉDACTEUR</h2>`;


    rapport +=
        `<p><strong>Agent :</strong> ${
            redacteur
                ? `${redacteur.prenom} ${redacteur.nom}`
                : ""
        }</p>`;


    rapport +=
        `<p><strong>Matricule :</strong> [${
            redacteur?.matricule || ""
        }]</p>`;


    // =====================================================
    // AFFICHAGE
    // =====================================================

    $("rapport-output").innerHTML =
        rapport.trim();
}


// =========================================================
// FORMAT AGENTS
// =========================================================

function formatAgents(
    agentList
) {

    if (
        !agentList.length
    ) {
        return "";
    }


    return agentList
        .map(
            agent =>
                `[${agent.matricule}] - ${agent.prenom} ${agent.nom}`
        )
        .join(", ");
}


// =========================================================
// FORMAT PEINE
// =========================================================

function peineText(
    peine
) {

    if (!peine) {
        return "";
    }


    return (
        `${peine.article || ""} — ` +
        `${peine.infraction || ""}`
    ).trim();
}


// =========================================================
// FORMAT EXERCICE DES DROITS
// =========================================================

function formatExercice(
    value,
    details
) {

    if (
        value === "Oui"
    ) {

        return details
            ? `Oui (${details})`
            : "Oui";
    }


    if (
        value === "Non"
    ) {

        return "Non";
    }


    return "";
}


// =========================================================
// GET VALUE
// =========================================================

function getValue(
    parent,
    selector
) {

    return (
        parent.querySelector(
            selector
        )?.value
            ?.trim() || ""
    );
}


// =========================================================
// SECURITE HTML
// =========================================================

function escapeHtml(
    value
) {

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
// COPIER
// =========================================================

$("copy").onclick =
    async () => {

        const output =
            $("rapport-output");


        if (
            !output.innerHTML.trim()
        ) {

            showModal(
                "Rapport vide",
                "Générez d'abord le rapport.",
                "",
                "⚠️"
            );

            return;
        }


        try {

            const html =
                output.innerHTML;

            const text =
                output.innerText;


            const clipboardItem =
                new ClipboardItem({

                    "text/html":
                        new Blob(
                            [html],
                            {
                                type: "text/html"
                            }
                        ),

                    "text/plain":
                        new Blob(
                            [text],
                            {
                                type: "text/plain"
                            }
                        )
                });


            await navigator.clipboard.write([
                clipboardItem
            ]);


            showModal(
                "Rapport copié",
                "Le rapport a été copié et est prêt à être collé dans le MDT.",
                "",
                "✅"
            );


        } catch (error) {

            console.error(
                "Erreur copie :",
                error
            );


            showModal(
                "Erreur",
                "Impossible de copier le rapport.",
                "",
                "❌"
            );
        }
    };


// =========================================================
// GENERER
// =========================================================

$("generate").onclick =
    generateReport;


// =========================================================
// MODALE
// =========================================================

function showModal(
    title,
    message,
    content = "",
    icon = "⚠️"
) {

    const modal =
        $("custom-modal");


    $("custom-modal-title").textContent =
        title;


    $("custom-modal-message").textContent =
        message;


    $("custom-modal-content").innerHTML =
        content;


    const iconElement =
        $("custom-modal-icon");


    if (iconElement) {

        iconElement.textContent =
            icon;
    }


    modal.classList.remove(
        "hidden"
    );
}


$("custom-modal-close").addEventListener(
    "click",
    () => {

        $("custom-modal")
            .classList.add(
                "hidden"
            );
    }
);


// =========================================================
// REFORMULER LES FAITS
// =========================================================

$("reformuler-faits").addEventListener(
    "click",
    async () => {

        const textarea =
            $("faits");

        const texte =
            textarea.value.trim();


        if (!texte) {

            showModal(
                "Texte vide",
                "Veuillez renseigner le déroulement des faits avant de demander une reformulation.",
                "",
                "❌"
            );

            return;
        }


        const prompt =
            `Salut ChatGPT,

Peux-tu reformuler mon paragraphe suivant dans un style professionnel de rapport d'intervention ?

Important :
- Ne modifie aucun fait.
- N'invente aucune information.
- Ne supprime aucune information.
- Conserve les personnes, lieux, heures, actions et circonstances.
- Améliore uniquement la formulation, l'orthographe, la grammaire et la fluidité.

Voici mon paragraphe :

${texte}`;


        try {

            await navigator.clipboard.writeText(
                prompt
            );


            window.open(
                "https://chatgpt.com/",
                "_blank"
            );


        } catch (error) {

            console.error(
                "Erreur copie :",
                error
            );


            showModal(
                "Erreur",
                "Impossible de copier le texte."
            );
        }
    }
);


// =========================================================
// START
// =========================================================

init();