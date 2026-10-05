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
let grades = [];

let pointFortCount = 0;
let axeAmeliorationCount = 0;
let objectifCount = 0;


// =========================================================
// COMPÉTENCES
// =========================================================

const evaluations = [

    {
        id: "communication",
        icon: "📻",
        name: "COMMUNICATION RADIO"
    },

    {
        id: "conduite",
        icon: "🚔",
        name: "CONDUITE & VÉHICULE"
    },

    {
        id: "procedures",
        icon: "⚖️",
        name: "CONNAISSANCE DES PROCÉDURES"
    },

    {
        id: "interpellation",
        icon: "👮",
        name: "CONTRÔLE / INTERPELLATION"
    },

    {
        id: "interventions",
        icon: "🚨",
        name: "GESTION DES INTERVENTIONS"
    },

    {
        id: "equipe",
        icon: "🤝",
        name: "TRAVAIL EN ÉQUIPE"
    },

    {
        id: "decision",
        icon: "🧠",
        name: "PRISE DE DÉCISION"
    },

    {
        id: "secteur",
        icon: "🗺️",
        name: "CONNAISSANCE DU SECTEUR"
    },

    {
        id: "stress",
        icon: "😌",
        name: "GESTION DU STRESS"
    },

    {
        id: "professionnalisme",
        icon: "👮",
        name: "COMPORTEMENT & PROFESSIONNALISME"
    }

];


// =========================================================
// NIVEAUX
// =========================================================

const niveaux = {

    0: {
        emoji: "⚪",
        nom: "Niveau 0 — Aucun niveau précédent"
    },
    
    1: {
        emoji: "🔴",
        nom: "Niveau 1 — Découverte"
    },

    2: {
        emoji: "🟠",
        nom: "Niveau 2 — Formation"
    },

    3: {
        emoji: "🟡",
        nom: "Niveau 3 — Progression"
    },

    4: {
        emoji: "🟢",
        nom: "Niveau 4 — Autonomie"
    },

    5: {
        emoji: "🔵",
        nom: "Niveau 5 — Validation"
    }

};

const evaluationNiveaux = {
    1: {
        emoji: "🟥",
        nom: "Insuffisant"
    },
    2: {
        emoji: "🟧",
        nom: "À améliorer"
    },
    3: {
        emoji: "🟨",
        nom: "Satisfaisant"
    },
    4: {
        emoji: "🟩",
        nom: "Bon"
    },
    5: {
        emoji: "🟦",
        nom: "Excellent"
    }
};


// =========================================================
// INITIALISATION
// =========================================================

async function init() {

    renderEvaluations();

    await loadGrades();

    await loadAgents();

    setToday();

    addPointFort();

    addAxeAmelioration();

    addObjectif();

}


// =========================================================
// DATE DU JOUR
// =========================================================

function setToday() {

    const now =
        new Date();

    const date =
        now.toISOString()
            .split("T")[0];

    $("date-validation").value =
        date;

}


// =========================================================
// CHARGER LES GRADES
// =========================================================

async function loadGrades() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("grades")
            .select(
                "id, grade, priority"
            )
            .order(
                "priority",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erreur grades :",
            error
        );

        return;

    }


    grades =
        data || [];

}


// =========================================================
// CHARGER LES AGENTS
// =========================================================

async function loadAgents() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("agents")
            .select(
                "id, nom, prenom, matricule, grade, date_arrivee, fti, actif"
            )
            .eq(
                "actif",
                true
            )
            .order(
                "matricule"
            );


    if (error) {

        console.error(
            "Erreur agents :",
            error
        );


        showModal(
            "Erreur",
            "Impossible de charger les agents.",
            "",
            "❌"
        );


        return;

    }


    agents =
        data || [];


    renderAgentSelects();

}


// =========================================================
// SELECTS AGENTS
// =========================================================

function renderAgentSelects() {

    const agentSelect =
        $("agent");

    const tuteurSelect =
        $("tuteur");

    const evaluateurSelect =
        $("evaluateur");


    agentSelect.innerHTML = `
        <option value="">
            Sélectionner un agent
        </option>
    `;


    tuteurSelect.innerHTML = `
        <option value="">
            Sélectionner un tuteur
        </option>
    `;


    evaluateurSelect.innerHTML = `
        <option value="">
            Sélectionner un évaluateur
        </option>
    `;


    agents.forEach(
        agent => {

            const label =
                `${agent.matricule} - ${agent.prenom} ${agent.nom}`;


            // =================================================
            // AGENT
            // UNIQUEMENT ROOKIE
            // =================================================

            if (
                getGradeName(agent).toLowerCase() ===
                "rookie"
            ) {

                const agentOption =
                    document.createElement(
                        "option"
                    );


                agentOption.value =
                    agent.id;


                agentOption.textContent =
                    label;


                agentSelect.appendChild(
                    agentOption
                );

            }


            // =================================================
            // TUTEUR
            // TOUS LES GRADES SAUF ROOKIE
            // =================================================

            if (
                getGradeName(agent).toLowerCase() !==
                "rookie"
            ) {

                const tuteurOption =
                    document.createElement(
                        "option"
                    );


                tuteurOption.value =
                    agent.id;


                tuteurOption.textContent =
                    label;


                tuteurSelect.appendChild(
                    tuteurOption
                );

            }


            // =================================================
            // ÉVALUATEUR
            // TOUS LES AGENTS ACTIFS
            // =================================================

            const evaluateurOption =
                document.createElement(
                    "option"
                );


            evaluateurOption.value =
                agent.id;


            evaluateurOption.textContent =
                label;


            evaluateurSelect.appendChild(
                evaluateurOption
            );

        }
    );

}


// =========================================================
// AFFICHER LE GRADE D'UN AGENT
// =========================================================

function getGradeName(
    agent
) {

    if (!agent) {

        return "";

    }


    const grade =
        grades.find(
            item =>
                String(item.id) ===
                String(agent.grade)
        );


    return grade?.grade || "";

}


// =========================================================
// AGENT SÉLECTIONNÉ
// =========================================================

$("agent").addEventListener(
    "change",
    () => {

        const agent =
            agents.find(
                item =>
                    String(item.id) ===
                    String(
                        $("agent").value
                    )
            );


        $("agent-matricule").value =
            agent?.matricule || "";


        $("agent-grade").value =
            getGradeName(agent);


        $("date-entree").value =
            agent?.date_arrivee || "";


        // =================================================
        // TUTEUR
        // Si le rookie possède déjà un FTI,
        // on le sélectionne automatiquement.
        // =================================================

        $("tuteur").value =
            agent?.fti || "";

    }
);


// =========================================================
// ÉVALUATEUR
// =========================================================

$("evaluateur").addEventListener(
    "change",
    () => {

        const agent =
            agents.find(
                item =>
                    String(item.id) ===
                    String(
                        $("evaluateur").value
                    )
            );


        $("evaluateur-matricule").value =
            agent?.matricule || "";


        $("evaluateur-grade").value =
            getGradeName(agent);

    }
);


// =========================================================
// AFFICHER LES ÉVALUATIONS
// =========================================================

function renderEvaluations() {

    const container =
        $("evaluations-container");


    container.innerHTML =
        "";


    evaluations.forEach(
        evaluation => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "rapport-block evaluation-block";


            div.innerHTML = `

                <div class="rapport-block-header">

                    <h3>
                        ${evaluation.icon}
                        ${evaluation.name}
                    </h3>

                </div>


                <div class="rapport-grid">

                    <div>

                        <strong>
                            Niveau
                        </strong>


                        <div>

                            <label class="evaluation-level-option">

                                <input
                                    type="checkbox"
                                    class="evaluation-level"
                                    data-evaluation="${evaluation.id}"
                                    value="1"
                                >

                                🟥 1 — Insuffisant

                            </label>


                            <label class="evaluation-level-option">

                                <input
                                    type="checkbox"
                                    class="evaluation-level"
                                    data-evaluation="${evaluation.id}"
                                    value="2"
                                >

                                🟧 2 — À améliorer

                            </label>


                            <label class="evaluation-level-option">

                                <input
                                    type="checkbox"
                                    class="evaluation-level"
                                    data-evaluation="${evaluation.id}"
                                    value="3"
                                >

                                🟨 3 — Satisfaisant

                            </label>


                            <label class="evaluation-level-option">

                                <input
                                    type="checkbox"
                                    class="evaluation-level"
                                    data-evaluation="${evaluation.id}"
                                    value="4"
                                >

                                🟩 4 — Bon

                            </label>


                            <label class="evaluation-level-option">

                                <input
                                    type="checkbox"
                                    class="evaluation-level"
                                    data-evaluation="${evaluation.id}"
                                    value="5"
                                >

                                🟦 5 — Excellent

                            </label>

                        </div>

                    </div>


                    <label class="rapport-full">

                        Observations

                        <textarea
                            id="${evaluation.id}-observations"
                            rows="3"
                            placeholder="Observations concernant cette compétence..."
                        ></textarea>

                    </label>

                </div>

            `;


            container.appendChild(
                div
            );


            const checkboxes =
                div.querySelectorAll(
                    `.evaluation-level[data-evaluation="${evaluation.id}"]`
                );


            checkboxes.forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        () => {

                            if (!checkbox.checked) {

                                return;

                            }


                            checkboxes.forEach(
                                other => {

                                    if (
                                        other !== checkbox
                                    ) {

                                        other.checked =
                                            false;

                                    }

                                }
                            );

                        }
                    );

                }
            );

        }
    );

}


// =========================================================
// POINTS FORTS
// =========================================================

function addPointFort() {

    pointFortCount++;


    const container =
        $("points-forts-container");


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "rapport-block";


    div.innerHTML = `

        <div class="rapport-block-header">

            <h3>
                Point fort n°${pointFortCount}
            </h3>

            <button
                type="button"
                class="danger point-fort-remove"
            >
                Supprimer
            </button>

        </div>


        <label>

            Point fort

            <input
                type="text"
                class="point-fort-input"
                placeholder="Décrivez le point fort observé..."
            >

        </label>

    `;


    container.appendChild(
        div
    );


    div.querySelector(
        ".point-fort-remove"
    ).addEventListener(
        "click",
        () => {

            div.remove();

            updatePointFortNumbers();

        }
    );

}


// =========================================================
// RENUMÉROTATION POINTS FORTS
// =========================================================

function updatePointFortNumbers() {

    const blocks =
        document.querySelectorAll(
            "#points-forts-container .rapport-block"
        );


    blocks.forEach(
        (block, index) => {

            const title =
                block.querySelector(
                    ".rapport-block-header h3"
                );


            if (title) {

                title.textContent =
                    `Point fort n°${index + 1}`;

            }

        }
    );


    pointFortCount =
        blocks.length;

}


// =========================================================
// AXES D'AMÉLIORATION
// =========================================================

function addAxeAmelioration() {

    axeAmeliorationCount++;


    const container =
        $("axes-amelioration-container");


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "rapport-block";


    div.innerHTML = `

        <div class="rapport-block-header">

            <h3>
                Axe d'amélioration n°${axeAmeliorationCount}
            </h3>

            <button
                type="button"
                class="danger axe-amelioration-remove"
            >
                Supprimer
            </button>

        </div>


        <label>

            Axe d'amélioration

            <input
                type="text"
                class="axe-amelioration-input"
                placeholder="Décrivez l'axe d'amélioration..."
            >

        </label>

    `;


    container.appendChild(
        div
    );


    div.querySelector(
        ".axe-amelioration-remove"
    ).addEventListener(
        "click",
        () => {

            div.remove();

            updateAxeAmeliorationNumbers();

        }
    );

}


// =========================================================
// RENUMÉROTATION AXES
// =========================================================

function updateAxeAmeliorationNumbers() {

    const blocks =
        document.querySelectorAll(
            "#axes-amelioration-container .rapport-block"
        );


    blocks.forEach(
        (block, index) => {

            const title =
                block.querySelector(
                    ".rapport-block-header h3"
                );


            if (title) {

                title.textContent =
                    `Axe d'amélioration n°${index + 1}`;

            }

        }
    );


    axeAmeliorationCount =
        blocks.length;

}


// =========================================================
// OBJECTIFS
// =========================================================

function addObjectif() {

    objectifCount++;


    const container =
        $("points-objectifs");


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "rapport-block";


    div.innerHTML = `

        <div class="rapport-block-header">

            <h3>
                Objectif n°${objectifCount}
            </h3>

            <button
                type="button"
                class="danger objectif-remove"
            >
                Supprimer
            </button>

        </div>


        <label>

            Objectif

            <textarea
                class="objectif-input"
                rows="3"
                placeholder="Décrivez l'objectif à atteindre..."
            ></textarea>

        </label>

    `;


    container.appendChild(
        div
    );


    div.querySelector(
        ".objectif-remove"
    ).addEventListener(
        "click",
        () => {

            div.remove();

            updateObjectifNumbers();

        }
    );

}


// =========================================================
// RENUMÉROTATION OBJECTIFS
// =========================================================

function updateObjectifNumbers() {

    const blocks =
        document.querySelectorAll(
            "#points-objectifs .rapport-block"
        );


    blocks.forEach(
        (block, index) => {

            const title =
                block.querySelector(
                    ".rapport-block-header h3"
                );


            if (title) {

                title.textContent =
                    `Objectif n°${index + 1}`;

            }

        }
    );


    objectifCount =
        blocks.length;

}


// =========================================================
// BOUTONS AJOUT
// =========================================================

$("add-point-fort").addEventListener(
    "click",
    () => {

        addPointFort();

    }
);


$("add-axe-amelioration").addEventListener(
    "click",
    () => {

        addAxeAmelioration();

    }
);


$("add-objectif").addEventListener(
    "click",
    () => {

        addObjectif();

    }
);


// =========================================================
// VALIDATION
// =========================================================

function validateRequiredFields() {

    const missingFields = [];


    if (!$("agent").value) {

        missingFields.push(
            "agent."
        );

    }


    if (!$("tuteur").value) {

        missingFields.push(
            "tuteur."
        );

    }


    if (!$("evaluateur").value) {

        missingFields.push(
            "évaluateur."
        );

    }


    if (!$("date-validation").value) {

        missingFields.push(
            "date de validation."
        );

    }


    if (!missingFields.length) {

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
        "Veuillez renseigner les champs obligatoires avant de générer la fiche.",
        `<ul>${list}</ul>`,
        "⚠️"
    );


    return false;

}


// =========================================================
// GÉNÉRER LA FICHE
// =========================================================

function generateReport() {

    if (!validateRequiredFields()) {

        return;

    }


    const agent =
        agents.find(
            item =>
                String(item.id) ===
                String(
                    $("agent").value
                )
        );


    const tuteur =
        agents.find(
            item =>
                String(item.id) ===
                String(
                    $("tuteur").value
                )
        );


    const evaluateur =
        agents.find(
            item =>
                String(item.id) ===
                String(
                    $("evaluateur").value
                )
        );


    const dateEntree =
        formatDate(
            $("date-entree").value
        );


    const dateValidation =
        formatDate(
            $("date-validation").value
        );


    const patrouilles =
        $("patrouilles").value.trim();


    let rapport =
        "";


    // =====================================================
    // TITRE
    // =====================================================

    rapport +=
        "# :clipboard: **FICHE DE SUIVI — ROOKIE SASP NORD**\n\n";


    rapport +=
        "> **Document interne — Suivi et accompagnement des agents en formation**\n\n";


    rapport +=
        "────────────────────────────────\n\n";


    // =====================================================
    // INFORMATIONS AGENT
    // =====================================================

    rapport +=
        "## :bust_in_silhouette: INFORMATIONS DE L'AGENT\n\n";


    rapport +=
        `> **Nom :** ${agent ? `${agent.prenom} ${agent.nom}` : ""}\n`;


    rapport +=
        `> **Matricule :** ${agent?.matricule || ""}\n`;


    rapport +=
        `> **Grade :** ${getGradeName(agent)}\n`;


    rapport +=
        `> **Date d'entrée au SASP :** ${dateEntree}\n`;


    rapport +=
        `> **Tuteur :** ${tuteur ? `${tuteur.prenom} ${tuteur.nom}` : ""}\n`;


    rapport +=
        `> **Nombres de patrouilles observées :** ${patrouilles}\n\n`;


    rapport +=
        "────────────────────────────────\n\n";


    // =====================================================
    // ÉVALUATION GÉNÉRALE
    // =====================================================

    rapport +=
        "## :bar_chart: ÉVALUATION GÉNÉRALE\n\n";


    rapport +=
        "**Échelle d'évaluation :**\n\n";


    rapport +=
        "> :red_square: **1 — Insuffisant**\n";


    rapport +=
        "> :orange_square: **2 — À améliorer**\n";


    rapport +=
        "> :yellow_square: **3 — Satisfaisant**\n";


    rapport +=
        "> :green_square: **4 — Bon**\n";


    rapport +=
        "> :blue_square: **5 — Excellent**\n\n";


    evaluations.forEach(
        evaluation => {

            const niveauElement =
                document.querySelector(
                    `.evaluation-level[data-evaluation="${evaluation.id}"]:checked`
                );


            const note =
                niveauElement
                    ? niveauElement.value
                    : "";

            const niveau = evaluationNiveaux[note];

            const observations =
                $(
                    `${evaluation.id}-observations`
                ).value.trim();


            rapport +=
                `### ${evaluation.icon} ${evaluation.name}\n\n`;


            rapport +=
                `> **Niveau :** ${niveau?.emoji || ""} ${note} / 5 — ${niveau?.nom || ""}\n`;


            rapport +=
                `> **Observations :** ${observations || ""}\n\n`;

        }
    );


    // =====================================================
    // POINTS FORTS
    // =====================================================

    rapport +=
        "────────────────────────────────\n\n";


    rapport +=
        "## :star: POINTS FORTS\n\n";


    const pointsForts =
        document.querySelectorAll(
            ".point-fort-input"
        );


    pointsForts.forEach(
        input => {

            const value =
                input.value.trim();


            if (value) {

                rapport +=
                    `> • ${value}\n`;

            }

        }
    );


    rapport +=
        "\n";


    // =====================================================
    // AXES D'AMÉLIORATION
    // =====================================================

    rapport +=
        "────────────────────────────────\n\n";


    rapport +=
        "## :warning: AXES D'AMÉLIORATION\n\n";


    const axesAmelioration =
        document.querySelectorAll(
            ".axe-amelioration-input"
        );


    axesAmelioration.forEach(
        input => {

            const value =
                input.value.trim();


            if (value) {

                rapport +=
                    `> • ${value}\n`;

            }

        }
    );


    rapport +=
        "\n";


    // =====================================================
    // OBJECTIFS
    // =====================================================

    rapport +=
        "────────────────────────────────\n\n";


    rapport +=
        "## :dart: OBJECTIFS POUR LA PROCHAINE ÉVALUATION\n\n";


    const objectifs =
        document.querySelectorAll(
            ".objectif-input"
        );


    objectifs.forEach(
        (input, index) => {

            const value =
                input.value.trim();


            if (value) {

                rapport +=
                    `> **Objectif n°${index + 1} :**\n`;

                rapport +=
                    `> ${value}\n`;

            }

        }
    );


    rapport +=
        "\n";


    // =====================================================
    // OBSERVATIONS
    // =====================================================

    rapport +=
        "────────────────────────────────\n\n";


    rapport +=
        "## :pencil: OBSERVATIONS DU SUPERVISEUR\n\n";


    rapport +=
        `> **Bilan général :**\n> ${$("bilan").value.trim()}\n\n`;


    // =====================================================
    // ÉVOLUTION
    // =====================================================

    rapport +=
        "────────────────────────────────\n\n";


    rapport +=
        "## :chart_with_upwards_trend: ÉVOLUTION DU ROOKIE\n\n";


    rapport +=
        "> **:red_circle: Niveau 1 — Découverte**\n";


    rapport +=
        "> L'agent découvre les procédures, le fonctionnement du service et nécessite un accompagnement constant.\n\n";


    rapport +=
        "> **:orange_circle: Niveau 2 — Formation**\n";


    rapport +=
        "> L'agent commence à maîtriser les bases mais nécessite encore une supervision régulière.\n\n";


    rapport +=
        "> **:yellow_circle: Niveau 3 — Progression**\n";


    rapport +=
        "> L'agent est capable de gérer les situations courantes avec supervision et commence à prendre des initiatives.\n\n";


    rapport +=
        "> **:green_circle: Niveau 4 — Autonomie**\n";


    rapport +=
        "> L'agent maîtrise les procédures courantes et peut intervenir de manière autonome sur la majorité des situations.\n\n";


    rapport +=
        "> **:blue_circle: Niveau 5 — Validation**\n";


    rapport +=
        "> L'agent démontre un niveau suffisant pour terminer sa période de formation et être proposé à la validation.\n\n";


    const niveauActuel =
        niveaux[
            $("niveau-actuel").value
        ];


    const niveauPrecedent =
        niveaux[
            $("niveau-precedent").value
        ];


    rapport +=
        `> **Niveau actuel :** ${niveauActuel?.emoji || ""} ${niveauActuel?.nom || ""}\n`;


    rapport +=
        `> **Évaluation précédente :** ${niveauPrecedent?.emoji || ""} ${niveauPrecedent?.nom || ""}\n\n`;


    rapport +=
        "**Justification de l'évolution :**\n";


    rapport +=
        `> ${$("justification").value.trim()}\n\n`;


    // =====================================================
    // VALIDATION
    // =====================================================

    rapport +=
        "────────────────────────────────\n\n";


    rapport +=
        "## :white_check_mark: VALIDATION\n\n";


    rapport +=
        `> **Évaluateur :** ${evaluateur ? `${evaluateur.prenom} ${evaluateur.nom}` : ""}\n`;


    rapport +=
        `> **Grade :** ${getGradeName(evaluateur)}\n`;


    rapport +=
        `> **Matricule :** ${evaluateur?.matricule || ""}\n`;


    rapport +=
        `> **Date :** ${dateValidation}\n`;


    // =====================================================
    // AFFICHAGE
    // =====================================================

    $("rookie-output").value =
        rapport.trim();

}


// =========================================================
// BOUTON GÉNÉRER
// =========================================================

$("generate").addEventListener(
    "click",
    () => {

        generateReport();

    }
);


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(
    date
) {

    if (!date) {

        return "";

    }


    return date
        .split("-")
        .reverse()
        .join("/");

}


// =========================================================
// COPIER
// =========================================================

$("copy").onclick =
    async () => {

        const output =
            $("rookie-output");


        if (!output.value.trim()) {

            showModal(
                "Fiche vide",
                "Générez d'abord la fiche.",
                "",
                "⚠️"
            );


            return;

        }


        try {

            await navigator.clipboard.writeText(
                output.value
            );


            showModal(
                "Fiche copiée",
                "La fiche Markdown est prête à être collée dans Discord.",
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
                "Impossible de copier la fiche.",
                "",
                "❌"
            );

        }

    };


// =========================================================
// MODAL
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


// =========================================================
// FERMER MODAL
// =========================================================

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
// SECURITÉ HTML
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
// START
// =========================================================

init();