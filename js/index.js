// ============================================================
// SUPABASE
// ============================================================

const supabaseClient = window.supabaseClient;


// ============================================================
// DOM
// ============================================================

const index$ = (id) =>
    document.getElementById(id);


// ============================================================
// INITIALISATION
// ============================================================

async function init() {

    setupEvents();

    updateSession();
}


// ============================================================
// SESSION
// ============================================================

async function updateSession() {

    const {
        data: {
            session
        },
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Erreur récupération session :",
            error
        );

        return;
    }


    if (session) {

        showConnected();

    } else {

        showDisconnected();

    }

}


// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

function showConnected() {

    index$("login")
        .classList
        .add("hidden");


    index$("logout")
        .classList
        .remove("hidden");


    index$("admin-menu")
        .classList
        .remove("hidden");


    index$("admin-logged")
        .classList
        .remove("hidden");


    index$("login-panel")
        .classList
        .add("hidden");

}


// ============================================================
// UTILISATEUR NON CONNECTÉ
// ============================================================

function showDisconnected() {

    index$("login")
        .classList
        .remove("hidden");


    index$("logout")
        .classList
        .add("hidden");


    index$("admin-menu")
        .classList
        .add("hidden");


    index$("admin-logged")
        .classList
        .add("hidden");

}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {


    // --------------------------------------------------------
    // OUVRIR LA CONNEXION
    // --------------------------------------------------------

    index$("login").addEventListener(
        "click",
        () => {

            index$("login-panel")
                .classList
                .remove("hidden");

        }
    );


    // --------------------------------------------------------
    // DECONNEXION
    // --------------------------------------------------------

    index$("logout").addEventListener(
        "click",
        logout
    );

}


// ============================================================
// SURVEILLER LES CHANGEMENTS DE SESSION
// ============================================================

supabaseClient.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (session) {

            showConnected();

        } else {

            showDisconnected();

        }

    }
);


// ============================================================
// DEMARRAGE
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );

    }

}