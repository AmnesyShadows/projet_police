// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://kdahsggjtmgcjiguidfr.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_ELLTPv_hy2TybFrHKS3Mdg_HadZh9JH";


window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ============================================================
// DOM
// ============================================================

const login$ = (id) =>
    document.getElementById(id);


// ============================================================
// PAGE ADMIN
// ============================================================

function isAdminPage() {

    return window.location.pathname
        .includes("/admin/");

}


// ============================================================
// CREATION DU LOGIN PANEL
// ============================================================

function createLoginPanel() {

    if (login$("login-panel")) {
        return;
    }


    const panel =
        document.createElement("section");


    panel.id =
        "login-panel";


    panel.className =
        "hidden";


    panel.innerHTML = `
        <div class="card">

            <h2>
                Connexion administrateur
            </h2>

            <p>
                Utilise ton identifiant administrateur pour passer en mode Administrateur.
            </p>


            <form id="loginForm">

                <label>
                    Identifiant

                    <input
                        id="pseudo"
                        type="text"
                        autocomplete="username"
                        required
                    >
                </label>


                <label>
                    Mot de passe

                    <input
                        id="password"
                        type="password"
                        autocomplete="current-password"
                        required
                    >
                </label>


                <button
                    class="primary"
                    type="submit"
                >
                    Se connecter
                </button>


                <div
                    id="loginError"
                    class="error"
                ></div>

            </form>

        </div>
    `;


    document.body.appendChild(panel);

}


// ============================================================
// AFFICHER LE LOGIN PANEL
// ============================================================

function showLoginPanel() {

    createLoginPanel();


    login$("login-panel")
        .classList
        .remove("hidden");


    if (login$("pseudo")) {

        login$("pseudo").focus();

    }

}


// ============================================================
// INITIALISATION
// ============================================================

async function initLogin() {

    createLoginPanel();

    setupLoginEvents();

    await checkSession();

}


// ============================================================
// SESSION
// ============================================================

async function checkSession() {

    const {
        data: {
            session
        },
        error
    } =
        await window.supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Erreur récupération session :",
            error
        );

        return;

    }


    if (session) {

        showConnected(session);

    } else {

        showDisconnected();

    }


    window.dispatchEvent(
        new CustomEvent(
            "auth-ready",
            {
                detail: {
                    session
                }
            }
        )
    );

}


// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

function showConnected(session) {

    if (login$("login")) {

        login$("login")
            .classList
            .add("hidden");

    }


    if (login$("logout")) {

        login$("logout")
            .classList
            .remove("hidden");

    }


    if (login$("admin-logged")) {

        login$("admin-logged")
            .classList
            .remove("hidden");

    }


    if (login$("admin-menu")) {

        login$("admin-menu")
            .classList
            .remove("hidden");

    }


    if (login$("login-panel")) {

        login$("login-panel")
            .classList
            .add("hidden");

    }


    // --------------------------------------------------------
    // PAGE ADMIN
    // --------------------------------------------------------

    if (isAdminPage()) {

        if (login$("admin")) {

            login$("admin")
                .classList
                .remove("hidden");

        }

    }

}


// ============================================================
// UTILISATEUR NON CONNECTÉ
// ============================================================

function showDisconnected() {

    if (login$("login")) {

        login$("login")
            .classList
            .remove("hidden");

    }


    if (login$("logout")) {

        login$("logout")
            .classList
            .add("hidden");

    }


    if (login$("admin-logged")) {

        login$("admin-logged")
            .classList
            .add("hidden");

    }


    if (login$("admin-menu")) {

        login$("admin-menu")
            .classList
            .add("hidden");

    }


    // --------------------------------------------------------
    // PAGE ADMIN
    // --------------------------------------------------------

    if (isAdminPage()) {

        if (login$("admin")) {

            login$("admin")
                .classList
                .add("hidden");

        }


        showLoginPanel();

    }

}


// ============================================================
// EVENEMENTS
// ============================================================

function setupLoginEvents() {


    // --------------------------------------------------------
    // BOUTON CONNEXION
    // --------------------------------------------------------

    if (login$("login")) {

        login$("login").addEventListener(
            "click",
            showLoginPanel
        );

    }


    // --------------------------------------------------------
    // FORMULAIRE
    // --------------------------------------------------------

    if (login$("loginForm")) {

        login$("loginForm").addEventListener(
            "submit",
            login
        );

    }


    // --------------------------------------------------------
    // DECONNEXION
    // --------------------------------------------------------

    if (login$("logout")) {

        login$("logout").addEventListener(
            "click",
            logout
        );

    }

}


// ============================================================
// LOGIN
// ============================================================

async function login(event) {

    event.preventDefault();


    if (login$("loginError")) {

        login$("loginError")
            .textContent = "";

    }


    const pseudo =
        login$("pseudo")
            .value
            .trim();


    const password =
        login$("password")
            .value;


    if (!pseudo || !password) {

        if (login$("loginError")) {

            login$("loginError")
                .textContent =
                "Identifiant ou mot de passe incorrect.";

        }

        return;

    }


    // ========================================================
    // RECHERCHE DE L'ADMINISTRATEUR
    // ========================================================

    const {
        data: adminUser,
        error: adminError
    } =
        await window.supabaseClient
            .from("admin_users")
            .select(
                "email"
            )
            .eq(
                "pseudo",
                pseudo
            )
            .maybeSingle();


    if (adminError) {

        console.error(
            "Erreur recherche administrateur :",
            adminError
        );


        if (login$("loginError")) {

            login$("loginError")
                .textContent =
                "Erreur lors de la connexion.";

        }

        return;

    }


    if (!adminUser) {

        if (login$("loginError")) {

            login$("loginError")
                .textContent =
                "Identifiant ou mot de passe incorrect.";

        }

        return;

    }


    // ========================================================
    // CONNEXION SUPABASE AUTH
    // ========================================================

    const {
        error
    } =
        await window.supabaseClient.auth
            .signInWithPassword({
                email:
                    adminUser.email,
                password
            });


    if (error) {

        console.error(
            "Erreur connexion :",
            error
        );


        if (login$("loginError")) {

            login$("loginError")
                .textContent =
                "Identifiant ou mot de passe incorrect.";

        }

        return;

    }


    // ========================================================
    // CONNEXION RÉUSSIE
    // ========================================================

    login$("loginForm").reset();


    await checkSession();

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    const {
        error
    } =
        await window.supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );

        return;

    }


    if (isAdminPage()) {

        if (login$("admin")) {

            login$("admin")
                .classList
                .add("hidden");

        }


        showLoginPanel();

        return;

    }


    await checkSession();

}


// ============================================================
// SURVEILLER LES CHANGEMENTS DE SESSION
// ============================================================

window.supabaseClient.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (session) {

            showConnected(session);

        } else {

            showDisconnected();

        }

    }
);


// ============================================================
// DEMARRAGE
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initLogin
    );

} else {

    initLogin();

}