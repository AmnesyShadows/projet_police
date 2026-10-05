// =========================================================
// CONFIGURATION
// =========================================================

const supabaseClient = window.supabaseClient;


// =========================================================
// ELEMENTS / VARIABLES
// =========================================================

const lieux$ = id =>
    document.getElementById(id);

const list =
    lieux$("list");

let locations = [];
let types = [];

let currentId = null;

let images = [];

let map;
let marker;

let mapW = 0;
let mapH = 0;


// =========================================================
// UTILITAIRES
// =========================================================

function msg(text) {

    alert(text);

}


function typeName(id) {

    return (
        types.find(
            type =>
                type.id === id
        )?.name ||
        "Sans type"
    );

}


function iconValue(typeId) {

    const type =
        types.find(
            type =>
                type.id === typeId
        );

    return type?.icon || "";

}


// =========================================================
// INITIALISATION
// =========================================================

async function init() {

    console.log(
        "=== INITIALISATION LIEUX ==="
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


    initMap();

    await loadRefs();

    await loadLocations();

    resetLocation();

}


// =========================================================
// TYPES
// =========================================================

async function loadRefs() {

    console.log(
        "Chargement des types..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("types")
            .select("*")
            .order("name");


    if (error) {

        console.error(
            "Erreur types :",
            error
        );


        msg(
            "Impossible de charger les types : " +
            error.message
        );


        return;

    }


    types =
        data || [];


    console.log(
        "Types chargés :",
        types
    );


    const typeSelect =
        lieux$("type");


    if (!typeSelect) {

        console.error(
            "Élément #type introuvable."
        );

        return;

    }


    typeSelect.innerHTML =
        types
            .filter(
                type =>
                    type.name !== "Zone"
            )
            .map(
                type => `
                    <option value="${type.id}">
                        ${type.icon || ""}
                        ${type.name}
                    </option>
                `
            )
            .join("");

}


// =========================================================
// LOCATIONS
// =========================================================

async function loadLocations() {

    console.log(
        "Chargement des lieux..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("locations")
            .select("*")
            .order("name");


    if (error) {

        console.error(
            "Erreur lieux :",
            error
        );


        msg(
            "Impossible de charger les lieux : " +
            error.message
        );


        return;

    }


    locations =
        data || [];


    console.log(
        "Lieux chargés :",
        locations
    );


    renderList();

}


function renderList() {

    if (!list) {

        return;

    }


    const search =
        lieux$("search");


    const q =
        search
            ? search.value
                .toLowerCase()
                .trim()
            : "";


    list.innerHTML = "";


    locations
        .filter(
            location =>
                location.name
                    .toLowerCase()
                    .includes(q)
        )
        .forEach(
            location => {

                const d =
                    document.createElement(
                        "div"
                    );


                d.className =
                    "item" +
                    (
                        location.id === currentId
                            ? " active"
                            : ""
                    ) +
                    (
                        location.visible === false
                            ? " disabled-item"
                            : ""
                    );


                d.innerHTML = `

                    <b>
                        ${iconValue(location.type_id)}
                        ${location.name}
                    </b>

                    <small>
                        ${typeName(location.type_id)}
                        · X ${location.x}
                        · Y ${location.y}
                    </small>

                `;


                d.onclick =
                    () =>
                        editLocation(
                            location
                        );


                list.appendChild(d);

            }
        );

}


if (lieux$("search")) {

    lieux$("search").oninput =
        renderList;

}


// =========================================================
// NOUVEAU LIEU
// =========================================================

function resetLocation() {

    currentId = null;

    images = [];


    lieux$("title").textContent =
        "Nouveau lieu";


    lieux$("status").textContent =
        "Création d'un lieu";


    lieux$("delete")
        .classList
        .add("hidden");


    lieux$("name").value = "";

    lieux$("description").value = "";

    lieux$("x").value = "";

    lieux$("y").value = "";

    lieux$("visible").checked = true;


    if (types[0]) {

        lieux$("type").value =
            types[0].id;

    }


    if (marker) {

        map.removeLayer(marker);

        marker = null;

    }


    renderImages();

    renderList();

}


if (lieux$("new")) {

    lieux$("new").onclick =
        resetLocation;

}


// =========================================================
// EDITION D'UN LIEU
// =========================================================

function editLocation(location) {

    currentId =
        location.id;


    lieux$("title").textContent =
        location.name;


    lieux$("status").textContent =
        `ID : ${location.id}`;


    lieux$("delete")
        .classList
        .remove("hidden");


    lieux$("name").value =
        location.name;


    lieux$("type").value =
        location.type_id || "";


    lieux$("x").value =
        location.x;


    lieux$("y").value =
        location.y;


    lieux$("description").value =
        location.description || "";


    lieux$("visible").checked =
        location.visible !== false;


    images =
        Array.isArray(location.images)
            ? structuredClone(
                location.images
            )
            : [];


    renderImages();

    renderList();


    setPoint(
        location.x,
        location.y
    );

}


// =========================================================
// CARTE
// =========================================================

function initMap() {

    if (map) {

        return;

    }


    map =
        L.map(
            "map",
            {
                crs: L.CRS.Simple,
                minZoom: -4,
                maxZoom: 3,
                attributionControl: false
            }
        );


    const img =
        new Image();


    img.onload = () => {

        mapW =
            img.naturalWidth;


        mapH =
            img.naturalHeight;


        const bounds = [
            [0, 0],
            [mapH, mapW]
        ];


        L.imageOverlay(
            "../images/map.jpg",
            bounds
        ).addTo(map);


        map.fitBounds(
            bounds
        );


        map.on(
            "click",
            e => {

                const x =
                    Math.round(
                        e.latlng.lng
                    );


                const y =
                    Math.round(
                        mapH -
                        e.latlng.lat
                    );


                lieux$("x").value =
                    x;


                lieux$("y").value =
                    y;


                setPoint(
                    x,
                    y
                );

            }
        );

    };


    img.src =
        "../images/map.jpg";

}


function setPoint(x, y) {

    if (
        !map ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
    ) {

        return;

    }


    const p =
        L.latLng(
            mapH - y,
            x
        );


    if (!marker) {

        marker =
            L.marker(p)
                .addTo(map);

    } else {

        marker.setLatLng(
            p
        );

    }


    map.panTo(
        p
    );

}


if (lieux$("x")) {

    lieux$("x").onchange =
        () =>
            setPoint(
                Number(
                    lieux$("x").value
                ),
                Number(
                    lieux$("y").value
                )
            );

}


if (lieux$("y")) {

    lieux$("y").onchange =
        () =>
            setPoint(
                Number(
                    lieux$("x").value
                ),
                Number(
                    lieux$("y").value
                )
            );

}


// =========================================================
// IMAGES
// =========================================================

function renderImages() {

    const container =
        lieux$("images");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    images.forEach(
        (im, i) => {

            const url =
                typeof im === "string"
                    ? im
                    : im.path ||
                      im.url;


            const d =
                document.createElement(
                    "div"
                );


            d.className =
                "image";


            d.innerHTML = `

                <img
                    src="${url}"
                    alt=""
                >

                <div>

                    <small>
                        ${url.split("/").pop()}
                    </small>

                    <button
                        type="button"
                    >
                        Supprimer
                    </button>

                </div>

            `;


            d.querySelector(
                "button"
            ).onclick =
                () => {

                    images.splice(
                        i,
                        1
                    );


                    renderImages();

                };


            container.appendChild(
                d
            );

        }
    );

}


if (lieux$("files")) {

    lieux$("files").onchange =
        async () => {

            for (
                const file of [
                    ...lieux$("files").files
                ]
            ) {

                const safe =
                    file.name.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "-"
                    );


                const path =
                    `locations/${
                        currentId ||
                        crypto.randomUUID()
                    }/${
                        Date.now()
                    }-${safe}`;


                const {
                    error
                } =
                    await supabaseClient
                        .storage
                        .from("images")
                        .upload(
                            path,
                            file,
                            {
                                contentType:
                                    file.type,
                                upsert:
                                    false
                            }
                        );


                if (error) {

                    msg(
                        error.message
                    );


                    continue;

                }


                const {
                    data
                } =
                    supabaseClient
                        .storage
                        .from("images")
                        .getPublicUrl(
                            path
                        );


                images.push({
                    path:
                        data.publicUrl,
                    alt:
                        file.name
                });

            }


            lieux$("files").value =
                "";


            renderImages();

        };

}


// =========================================================
// SAUVEGARDE
// =========================================================

if (lieux$("save")) {

    lieux$("save").onclick =
        async () => {

            const name =
                lieux$("name")
                    .value
                    .trim();


            if (!name) {

                msg(
                    "Le nom est obligatoire."
                );


                return;

            }


            const x =
                Number(
                    lieux$("x").value
                );


            const y =
                Number(
                    lieux$("y").value
                );


            if (
                !Number.isInteger(x) ||
                !Number.isInteger(y)
            ) {

                msg(
                    "X et Y sont obligatoires."
                );


                return;

            }


            const payload = {

                name,

                type_id:
                    lieux$("type").value ||
                    null,

                x,

                y,

                description:
                    lieux$("description")
                        .value
                        .trim(),

                images,

                visible:
                    lieux$("visible")
                        .checked

            };


            lieux$("save").disabled =
                true;


            let result;


            if (currentId) {

                result =
                    await supabaseClient
                        .from("locations")
                        .update(payload)
                        .eq(
                            "id",
                            currentId
                        )
                        .select()
                        .single();

            } else {

                result =
                    await supabaseClient
                        .from("locations")
                        .insert(payload)
                        .select()
                        .single();

            }


            lieux$("save").disabled =
                false;


            if (result.error) {

                msg(
                    result.error.message
                );


                return;

            }


            currentId =
                result.data.id;


            msg(
                "Lieu enregistré."
            );


            await loadLocations();


            const savedLocation =
                locations.find(
                    location =>
                        location.id ===
                        currentId
                );


            if (savedLocation) {

                editLocation(
                    savedLocation
                );

            }

        };

}


// =========================================================
// SUPPRESSION
// =========================================================

if (lieux$("delete")) {

    lieux$("delete").onclick =
        async () => {

            if (!currentId) {

                return;

            }


            const location =
                locations.find(
                    x =>
                        x.id ===
                        currentId
                );


            if (
                !location ||
                !confirm(
                    `Supprimer "${location.name}" ?`
                )
            ) {

                return;

            }


            const {
                error
            } =
                await supabaseClient
                    .from("locations")
                    .delete()
                    .eq(
                        "id",
                        currentId
                    );


            if (error) {

                msg(
                    error.message
                );


                return;

            }


            msg(
                "Lieu supprimé."
            );


            resetLocation();

            await loadLocations();

        };

}


// =========================================================
// START
// =========================================================

async function startLieux() {

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
        startLieux
    );

} else {

    startLieux();

}