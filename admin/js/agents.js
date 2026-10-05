// ============================================================
// CONFIGURATION
// ============================================================

const supabaseClient =
    window.supabaseClient;


// ============================================================
// VARIABLES
// ============================================================

let agents = [];
let grades = [];

let currentId = null;


// ============================================================
// DOM
// ============================================================

const agents$ =
    id =>
        document.getElementById(id);


// ============================================================
// INITIALISATION
// ============================================================

async function init() {

    console.log(
        "=== INITIALISATION AGENTS ==="
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


    await loadGrades();

    await loadAgents();

    resetForm();

}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {

    agents$("new").addEventListener(
        "click",
        resetForm
    );


    agents$("search").addEventListener(
        "input",
        renderAgentList
    );


    agents$("save").addEventListener(
        "click",
        saveAgent
    );


    agents$("delete").addEventListener(
        "click",
        deleteAgent
    );

}


// ============================================================
// CHARGER LES GRADES
// ============================================================

async function loadGrades() {

    console.log(
        "Chargement des grades..."
    );


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


    console.log(
        "Grades :",
        data
    );


    if (error) {

        console.error(
            "Erreur chargement grades :",
            error
        );


        agents$("status").textContent =
            "Erreur lors du chargement des grades.";


        return;

    }


    grades =
        data || [];


    renderGradeSelect();

}


// ============================================================
// LISTE DES GRADES
// ============================================================

function renderGradeSelect() {

    const select =
        agents$("grade");


    select.innerHTML = `

        <option value="">
            Sélectionner un grade
        </option>

    `;


    grades.forEach(
        grade => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                grade.id;


            option.textContent =
                grade.grade;


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// CHARGER LES AGENTS
// ============================================================

async function loadAgents() {

    console.log(
        "Chargement des agents..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("agents")
            .select("*")
            .order(
                "matricule",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erreur chargement agents :",
            error
        );


        agents$("status").textContent =
            "Erreur lors du chargement des agents.";


        return;

    }


    agents =
        data || [];


    console.log(
        "Agents chargés :",
        agents
    );


    renderFtiSelect();

    renderAgentList();

}


// ============================================================
// LISTE DES FTI
// ============================================================

function renderFtiSelect() {

    const select =
        agents$("fti");


    select.innerHTML = `
        <option value="">
            Aucun FTI
        </option>
    `;


    agents
        .filter(agent => {

            const grade =
                grades.find(
                    g => g.id === agent.grade
                );


            return grade?.grade !== "Rookie";

        })
        .forEach(
            agent => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    agent.id;


                option.textContent =
                    `${agent.prenom || ""} ${agent.nom || ""} — ${agent.matricule || ""}`.trim();


                select.appendChild(
                    option
                );

            }
        );

}


// ============================================================
// AFFICHER LA LISTE
// ============================================================

function renderAgentList() {

    const list =
        agents$("list");


    list.innerHTML =
        "";


    const search =
        agents$("search")
            .value
            .trim()
            .toLowerCase();


    const filtered =
        agents.filter(
            agent => {

                const nom =
                    agent.nom || "";


                const prenom =
                    agent.prenom || "";


                const matricule =
                    agent.matricule || "";


                const grade =
                    grades.find(
                        g =>
                            g.id ===
                            agent.grade
                    )?.grade || "";


                const text = `

                    ${nom}
                    ${prenom}
                    ${matricule}
                    ${grade}

                `.toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    if (
        filtered.length === 0
    ) {

        list.innerHTML = `

            <p>
                Aucun agent trouvé.
            </p>

        `;


        return;

    }


    filtered.forEach(
        agent => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item";


            if (!agent.actif) {

                item.classList.add(
                    "inactive"
                );

            }


            const grade =
                grades.find(
                    g =>
                        g.id ===
                        agent.grade
                );


            // Recherche du FTI
            const ftiAgent =
                agent.fti
                    ? agents.find(
                        item =>
                            item.id === agent.fti
                    )
                    : null;


            item.innerHTML = `
                <div>

                    <strong class="agent-name">
                        ${escapeHtml(agent.matricule || "")}
                        —
                        ${escapeHtml(
                            `${agent.prenom || ""} ${agent.nom || ""}`.trim()
                        )}
                    </strong>

                    <span class="agent-info">
                        ${
                            grade?.grade
                                ? escapeHtml(grade.grade)
                                : "Sans grade"
                        }
                        —
                        ${
                            agent.actif
                                ? "Actif"
                                : "Inactif"
                        }
                    </span>

                    ${
                        grade?.grade === "Rookie"
                            ? `
                                <span class="agent-fti">
                                    ${
                                        ftiAgent
                                            ? `FTI — ${escapeHtml(
                                                `${ftiAgent.prenom || ""} ${ftiAgent.nom || ""}`.trim()
                                            )}`
                                            : "Pas de FTI"
                                    }
                                </span>
                            `
                            : ""
                    }

                </div>
            `;


            item.addEventListener(
                "click",
                () => {

                    editAgent(
                        agent
                    );

                }
            );


            list.appendChild(
                item
            );

        }
    );

}


// ============================================================
// NOUVEL AGENT
// ============================================================

function resetForm() {

    currentId =
        null;


    agents$("title").textContent =
        "Nouvel agent";


    agents$("status").textContent =
        "";


    agents$("delete")
        .classList
        .add("hidden");


    agents$("nom").value =
        "";


    agents$("prenom").value =
        "";


    agents$("matricule").value =
        "";


    agents$("grade").value =
        "";


    agents$("date_arrivee").value =
        "";


    agents$("fti").value =
        "";


    agents$("actif").checked =
        true;


    renderAgentList();

}


// ============================================================
// MODIFIER UN AGENT
// ============================================================

function editAgent(agent) {

    currentId =
        agent.id;


    agents$("title").textContent =
        `${agent.prenom || ""} ${agent.nom || ""}`.trim();


    agents$("status").textContent =
        agent.actif
            ? "Agent actif"
            : "Agent inactif";


    agents$("nom").value =
        agent.nom || "";


    agents$("prenom").value =
        agent.prenom || "";


    agents$("matricule").value =
        agent.matricule || "";


    agents$("grade").value =
        agent.grade || "";


    agents$("date_arrivee").value =
        agent.date_arrivee || "";


    agents$("fti").value =
        agent.fti || "";


    agents$("actif").checked =
        agent.actif === true;


    agents$("delete")
        .classList
        .remove("hidden");


    renderAgentList();

}


// ============================================================
// SAUVEGARDER
// ============================================================

async function saveAgent() {

    const nom =
        agents$("nom")
            .value
            .trim();


    const prenom =
        agents$("prenom")
            .value
            .trim();


    const matricule =
        agents$("matricule")
            .value
            .trim();


    const grade =
        agents$("grade").value ||
        null;


    const date_arrivee =
        agents$("date_arrivee").value ||
        null;


    const fti =
        agents$("fti").value ||
        null;


    const actif =
        agents$("actif")
            .checked;


    if (
        !nom ||
        !prenom ||
        !matricule ||
        !grade
    ) {

        agents$("status").textContent =
            "Merci de remplir tous les champs.";


        return;

    }


    const payload = {
        nom,
        prenom,
        matricule,
        grade,
        date_arrivee,
        fti,
        actif
    };


    agents$("save").disabled =
        true;


    let result;


    // ========================================================
    // MODIFICATION
    // ========================================================

    if (currentId) {

        result =
            await supabaseClient
                .from("agents")
                .update(payload)
                .eq(
                    "id",
                    currentId
                );

    }


    // ========================================================
    // CREATION
    // ========================================================

    else {

        result =
            await supabaseClient
                .from("agents")
                .insert(
                    payload
                );

    }


    agents$("save").disabled =
        false;


    if (result.error) {

        console.error(
            "Erreur sauvegarde agent :",
            result.error
        );


        agents$("status").textContent =
            "Erreur lors de l'enregistrement.";


        return;

    }


    agents$("status").textContent =
        "Agent enregistré.";


    await loadAgents();

}


// ============================================================
// SUPPRIMER
// ============================================================

async function deleteAgent() {

    if (!currentId) {

        return;

    }


    const agent =
        agents.find(
            item =>
                item.id ===
                currentId
        );


    if (!agent) {

        return;

    }


    const confirmed =
        confirm(
            `Supprimer définitivement ${agent.prenom} ${agent.nom} ?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("agents")
            .delete()
            .eq(
                "id",
                currentId
            );


    if (error) {

        console.error(
            "Erreur suppression agent :",
            error
        );


        agents$("status").textContent =
            "Erreur lors de la suppression.";


        return;

    }


    resetForm();

    await loadAgents();

}


// ============================================================
// SECURITE
// ============================================================

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


// ============================================================
// START
// ============================================================

async function startAgents() {

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


    setupEvents();

    admin.classList.remove("hidden");

    await init();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAgents
    );

} else {

    startAgents();

}