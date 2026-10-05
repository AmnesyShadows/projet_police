// =========================================================
// ELEMENTS
// =========================================================

const zone$ = id => document.getElementById(id);

const supabaseClient =
    window.supabaseClient;

const loginPanel =
    zone$("login-panel");

const admin =
    zone$("admin");

const list =
    zone$("list");


// =========================================================
// VARIABLES
// =========================================================

let zones = [];
let types = [];

let currentZoneId = null;

let map = null;

let mapW = 0;
let mapH = 0;

let zonePoints = [];
let zonePolygon = null;
let zoneMarkers = [];


// =========================================================
// UTILITAIRE MESSAGE
// =========================================================

function msg(
    text,
    error = false
) {

    const status =
        zone$("status");

    if (!status) {
        return;
    }

    status.textContent =
        text || "";

    status.classList.toggle(
        "error",
        error
    );

}


// =========================================================
// INITIALISATION
// =========================================================

async function init() {

    initMap();

    await loadRefs();

    await loadZones();

    resetZone();


    setTimeout(() => {

        if (map) {

            map.invalidateSize();

        }

    }, 100);

}


// =========================================================
// TYPES
// =========================================================

async function loadRefs() {

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
            error.message,
            true
        );

        return;

    }


    types =
        data || [];


    const zoneType =
        types.find(
            type =>
                type.name === "Zone"
        );


    if (zoneType) {

        zone$("type").value =
            zoneType.id;

    }


    zone$("type").innerHTML =
        types
            .map(type => {

                return `
                    <option value="${type.id}">
                        ${type.icon || ""}
                        ${type.name}
                    </option>
                `;

            })
            .join("");

}


// =========================================================
// ZONES — CHARGEMENT
// =========================================================

async function loadZones() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("zones")
            .select("*")
            .order("name");


    if (error) {

        console.error(
            "Erreur chargement zones :",
            error
        );

        msg(
            "Impossible de charger les zones : " +
            error.message,
            true
        );

        return;

    }


    zones =
        data || [];


    renderList();

}


// =========================================================
// ZONES — LISTE
// =========================================================

function renderList() {

    const q =
        (zone$("search").value || "")
            .toLowerCase()
            .trim();


    list.innerHTML = "";


    zones
        .filter(zone => {

            return (
                zone.name || ""
            )
                .toLowerCase()
                .includes(q);

        })
        .forEach(zone => {

            const d =
                document.createElement(
                    "div"
                );


            d.className =
                "item" +
                (
                    zone.id ===
                    currentZoneId
                        ? " active"
                        : ""
                ) +
                (
                    zone.visible === false
                        ? " disabled-item"
                        : ""
                );


            const pointCount =
                Array.isArray(
                    zone.points
                )
                    ? zone.points.length
                    : 0;


            d.innerHTML = `
                <b>
                    ${getTypeIcon(zone.type_id)}
                    ${escapeHtml(zone.name)}
                </b>

                <small>
                    <span
                        style="
                            display:inline-block;
                            width:10px;
                            height:10px;
                            border-radius:3px;
                            background:${zone.color || "#888"};
                            margin-right:5px;
                            vertical-align:middle;
                        "
                    ></span>

                    Zone : ${pointCount} points
                </small>
            `;


            d.onclick = () =>
                editZone(zone);


            list.appendChild(d);

        });

}


zone$("search").oninput =
    renderList;


// =========================================================
// NOUVELLE ZONE
// =========================================================

function resetZone() {

    currentZoneId = null;

    zonePoints = [];


    zone$("title").textContent =
        "Nouvelle zone";


    zone$("status").textContent =
        "Création d'une zone";


    zone$("delete")
        .classList
        .add("hidden");


    zone$("name").value = "";

    zone$("description").value = "";

    zone$("visible").checked = true;


    /*
     * Couleur par défaut
     */

    zone$("color").value =
        "#10d1d1";


    /*
     * Sélection du type Zone
     * si présent.
     */

    const zoneType =
        types.find(type =>
            (
                type.name || ""
            )
                .toLowerCase()
                .includes("zone")
        );


    if (zoneType) {

        zone$("type").value =
            zoneType.id;

    } else if (types[0]) {

        zone$("type").value =
            types[0].id;

    }


    /*
     * Afficher les contrôles
     */

    zone$("zone-controls")
        .classList
        .remove("hidden");


    /*
     * Nettoyer l'aperçu
     */

    clearZone();

    renderList();

}


zone$("new").onclick =
    resetZone;


// =========================================================
// EDITION D'UNE ZONE
// =========================================================

function editZone(zone) {

    currentZoneId =
        zone.id;


    zone$("title").textContent =
        zone.name;


    zone$("status").textContent =
        `ID : ${zone.id}`;


    zone$("delete")
        .classList
        .remove("hidden");


    zone$("name").value =
        zone.name || "";


    zone$("type").value =
        zone.type_id || "";


    zone$("description").value =
        zone.description || "";


    zone$("visible").checked =
        zone.visible !== false;


    zone$("color").value =
        zone.color ||
        "#10d1d1";


    /*
     * Charger EXACTEMENT les points
     * enregistrés dans Supabase.
     */

    zonePoints =
        Array.isArray(zone.points)
            ? structuredClone(
                zone.points
            )
            : [];


    /*
     * Redessiner la zone.
     */

    renderZonePreview();


    renderList();


    /*
     * Centrer la map sur le
     * premier point.
     */

    if (
        map &&
        zonePoints.length > 0
    ) {

        const firstPoint =
            zonePoints[0];


        const p =
            L.latLng(
                mapH -
                    Number(
                        firstPoint.y
                    ),

                Number(
                    firstPoint.x
                )
            );


        map.panTo(p);

    }


    msg("");

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

                attributionControl:
                    false
            }
        );


    const img =
        new Image();


    /*
     * IMPORTANT :
     * ta map est dans :
     *
     * images/map.jpg
     *
     * et zones.html est dans :
     *
     * admin/zones.html
     *
     * donc :
     *
     * ../images/map.jpg
     */

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
        )
            .addTo(map);


        map.fitBounds(
            bounds
        );


        /*
         * CLIC SUR LA MAP
         *
         * Chaque clic ajoute
         * un sommet à la zone.
         */

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


                addZonePoint(
                    x,
                    y
                );

            }
        );


        setTimeout(() => {

            map.invalidateSize();

        }, 100);

    };


    img.onerror = () => {

        console.error(
            "Impossible de charger ../images/map.jpg"
        );


        msg(
            "Impossible de charger la carte.",
            true
        );

    };


    img.src =
        "../images/map.jpg";

}


// =========================================================
// ZONES — AJOUT D'UN POINT
// =========================================================

function addZonePoint(
    x,
    y
) {

    zonePoints.push({
        x: x,
        y: y
    });


    renderZonePreview();

}


// =========================================================
// ZONES — APERCU
// =========================================================

function renderZonePreview() {

    zone$("zone-point-count")
        .textContent =
        `Points : ${zonePoints.length}`;


    /*
     * Supprimer ancien polygone
     */

    if (zonePolygon) {

        map.removeLayer(
            zonePolygon
        );

        zonePolygon = null;

    }


    /*
     * Supprimer anciens points
     */

    zoneMarkers.forEach(
        zoneMarker => {

            map.removeLayer(
                zoneMarker
            );

        }
    );


    zoneMarkers = [];


    /*
     * Aucun point
     */

    if (
        zonePoints.length === 0
    ) {

        return;

    }


    const color =
        zone$("color").value ||
        "#10d1d1";


    /*
     * Afficher les points
     */

    zonePoints.forEach(
        point => {

            const pointMarker =
                L.circleMarker(
                    [
                        mapH -
                            Number(
                                point.y
                            ),

                        Number(
                            point.x
                        )
                    ],
                    {
                        radius: 5,

                        color: "#fff",

                        weight: 2,

                        fillColor: color,

                        fillOpacity: 1,

                        /*
                         * Très important :
                         * le point ne capture
                         * pas les clics.
                         */

                        interactive: false
                    }
                )
                    .addTo(map);


            zoneMarkers.push(
                pointMarker
            );

        }
    );


    /*
     * Afficher le polygone
     * à partir de 3 points.
     */

    if (
        zonePoints.length >= 3
    ) {

        const leafletPoints =
            zonePoints.map(
                point => [

                    mapH -
                        Number(
                            point.y
                        ),

                    Number(
                        point.x
                    )

                ]
            );


        zonePolygon =
            L.polygon(
                leafletPoints,
                {
                    color: color,

                    fillColor: color,

                    fillOpacity: 0.25,

                    weight: 2,

                    /*
                     * Le polygone ne bloque
                     * pas les clics de la map.
                     */

                    interactive: false
                }
            )
                .addTo(map);

    }

}


// =========================================================
// COULEUR
// =========================================================

zone$("color").oninput =
    () => {

        renderZonePreview();

    };


// =========================================================
// EFFACER ZONE
// =========================================================

function clearZone() {

    zonePoints = [];


    zone$("zone-point-count")
        .textContent =
        "Points : 0";


    if (zonePolygon) {

        map.removeLayer(
            zonePolygon
        );

        zonePolygon = null;

    }


    zoneMarkers.forEach(
        zoneMarker => {

            map.removeLayer(
                zoneMarker
            );

        }
    );


    zoneMarkers = [];

}


// =========================================================
// RETIRER DERNIER POINT
// =========================================================

zone$("undo-zone-point").onclick =
    () => {

        if (
            zonePoints.length === 0
        ) {

            return;

        }


        zonePoints.pop();


        renderZonePreview();

    };


// =========================================================
// EFFACER
// =========================================================

zone$("clear-zone").onclick =
    () => {

        clearZone();

    };


// =========================================================
// SAUVEGARDE
// =========================================================

zone$("save").onclick =
    async () => {

        const name =
            zone$("name")
                .value
                .trim();


        if (!name) {

            msg(
                "Le nom est obligatoire.",
                true
            );

            return;

        }


        /*
         * Une zone doit avoir
         * au moins 3 points.
         */

        if (
            zonePoints.length < 3
        ) {

            msg(
                "Une zone doit avoir au moins 3 points.",
                true
            );

            return;

        }


        const payload = {

            name,

            type_id:
                zone$("type").value ||
                null,

            color:
                zone$("color").value,

            points:
                zonePoints,

            description:
                zone$("description")
                    .value
                    .trim(),

            visible:
                zone$("visible")
                    .checked

        };


        zone$("save").disabled =
            true;


        let result;


        /*
         * MODIFICATION
         */

        if (currentZoneId) {

            result =
                await supabaseClient
                    .from("zones")
                    .update(payload)
                    .eq(
                        "id",
                        currentZoneId
                    )
                    .select()
                    .single();

        }


        /*
         * CREATION
         */

        else {

            result =
                await supabaseClient
                    .from("zones")
                    .insert(payload)
                    .select()
                    .single();

        }


        zone$("save").disabled =
            false;


        if (result.error) {

            console.error(
                "Erreur sauvegarde zone :",
                result.error
            );


            msg(
                "Erreur zone : " +
                result.error.message,
                true
            );

            return;

        }


        currentZoneId =
            result.data.id;


        msg(
            "Zone enregistrée !"
        );


        /*
         * Recharger les zones
         */

        await loadZones();


        /*
         * Reprendre la zone sauvegardée
         */

        const savedZone =
            zones.find(
                zone =>
                    zone.id ===
                    currentZoneId
            );


        if (savedZone) {

            editZone(
                savedZone
            );

        }

    };


// =========================================================
// SUPPRESSION
// =========================================================

zone$("delete").onclick =
    async () => {

        if (!currentZoneId) {

            return;

        }


        const zone =
            zones.find(
                z =>
                    z.id ===
                    currentZoneId
            );


        if (!zone) {

            return;

        }


        if (
            !confirm(
                `Supprimer "${zone.name}" ?`
            )
        ) {

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from("zones")
                .delete()
                .eq(
                    "id",
                    currentZoneId
                );


        if (error) {

            console.error(
                "Erreur suppression zone :",
                error
            );


            msg(
                error.message,
                true
            );

            return;

        }


        msg(
            "Zone supprimée."
        );


        resetZone();


        await loadZones();

    };


// =========================================================
// ICONE DU TYPE
// =========================================================

function getTypeIcon(
    typeId
) {

    const type =
        types.find(
            type =>
                type.id ===
                typeId
        );


    return type?.icon || "";

}


// =========================================================
// ECHAPPEMENT HTML
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

async function startZones() {
    const { data: { session }, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error("Erreur récupération session :", error);
        return;
    }

    if (!session) {
        console.log("Aucune session utilisateur.");
        return;
    }

    admin.classList.remove("hidden");

    await init();
}

startZones();