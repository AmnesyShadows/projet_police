// ==========================================
// CONFIGURATION
// ==========================================

let MAP_WIDTH = 0;
let MAP_HEIGHT = 0;

// ==========================================
// INITIALISATION DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://kdahsggjtmgcjiguidfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ELLTPv_hy2TybFrHKS3Mdg_HadZh9JH";
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ==========================================
// INITIALISATION DE LEAFLET
// ==========================================

const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 3,
    zoomControl: true,
    attributionControl: false
});

map.on("zoom", updateMarkerScale);

// ==========================================
// DONNEES DES LIEUX
// ==========================================
let locations = [];
let types = [];

async function loadLocations() {
    const {
        data,
        error
    } = await supabaseClient
        .from("locations")
        .select(`
            *,
            type:types (
                id,
                name,
                icon,
                color,
                afficher_icon,
                priority
            )
        `)
        .eq("visible", true)
        .order("name");

    if (error) {

        console.error(
            "Erreur chargement locations :",
            error
        );

        return;

    }

    locations = data || [];

    console.log(
        "Locations récupérées :",
        locations
    );

    initializeLocations();
}

async function loadZones() {

    const {
        data,
        error
    } = await supabaseClient
        .from("zones")
        .select(`
            *,
            type:types (
                id,
                name,
                icon,
                color
            )
        `)
        .eq("visible", true)
        .order("name");


    if (error) {

        console.error(
            "Erreur chargement zones :",
            error
        );

        return;
    }


    zones = data || [];

    console.log(
        "Zones récupérées :",
        zones
    );


    initializeZones();
}

async function loadTypes() {

    const {
        data,
        error
    } = await supabaseClient
        .from("types")
        .select("*")
        .order("name");

    if (error) {
        console.error(
            "Erreur chargement types :",
            error
        );
        return;
    }

    types = data || [];

    renderFilters();
}

function renderFilters() {

    const filtersContainer =
        document.getElementById("filters");

    filtersContainer.innerHTML = "";

    types.forEach(type => {

        const label =
            document.createElement("label");

        label.innerHTML = `
            <input
                type="checkbox"
                class="filter"
                value="${type.id}"
                checked
            >

            <span class="filter-icon">
                ${type.icon || ""}
            </span>

            ${type.name}
        `;

        filtersContainer.appendChild(label);

    });

    document
        .querySelectorAll(".filter")
        .forEach(filter => {

            filter.addEventListener(
                "change",
                () => {

                    updateMarkers();
                    updateZoneVisibility();

                }
            );

        });
}

function updateZoneVisibility() {

    const zoneType =
        types.find(
            type =>
                type.name.toLowerCase() ===
                "zone"
        );

    if (!zoneType) {
        return;
    }


    const zoneFilter =
        document.querySelector(
            `.filter[value="${zoneType.id}"]`
        );

    if (!zoneFilter) {
        return;
    }


    zoneLayers.forEach(
        zone => {

            if (zoneFilter.checked) {

                zone.addTo(map);

            } else {

                zone.removeFrom(map);

            }

        }
    );

}

// ==========================================
// COULEURS DES CATEGORIES
// ==========================================

// const typeColors = {
//     police: "#2d7dd2",
//     hospital: "#d62828",
//     company: "#a010da",
//     government: "#cfbe24",
//     other: "#888"
// };

// ==========================================
// DONNEES DES ZONES
// ==========================================

let zones = [];

// ==========================================
// MARQUEURS
// ==========================================

const markers = [];
const zoneLayers = [];

// ==========================================
// CONVERSION X/Y → LEAFLET
// ==========================================

function imageToLeaflet(x, y) {
    return [
        MAP_HEIGHT - y,
        x
    ];

}

function zoneToLeaflet(points) {
    return points.map(point => {
        return imageToLeaflet(
            point.x,
            point.y
        );
    });
}

// ==========================================
// CREATION D'UN MARQUEUR
// ==========================================

function createMarker(location) {

    const type = location.type;

    const icon =
        type?.afficher_icon
            ? type.icon
            : "";

    const color =
        type?.color || "#888";


    // ==========================================
    // POSITION
    // ==========================================

    const leafletPosition = [
        MAP_HEIGHT - location.y,
        location.x
    ];


    // ==========================================
    // MARQUEUR
    // ==========================================

    const markerIcon = L.divIcon({

        className: "",

        html: `
            <div
                class="custom-marker"
                style="
                    background: ${color};
                "
            >
                ${icon}
            </div>
        `,

        iconSize: [34, 34],

        iconAnchor: [17, 17]

    });


    const marker = L.marker(
        leafletPosition,
        {
            icon: markerIcon,
            zIndexOffset: (100 - location.type.priority) * 100
        }
    );


    // ==========================================
    // IMAGES
    // ==========================================

    const images =
        Array.isArray(location.images)
            ? location.images
            : [];


    let imageHTML = "";


    // ==========================================
    // 0 IMAGE
    // ==========================================

    if (images.length === 0) {

        imageHTML = "";

    }


    // ==========================================
    // 1 IMAGE
    // ==========================================

    else if (images.length === 1) {

        const image =
            typeof images[0] === "string"
                ? {
                    path: images[0],
                    alt: location.name
                }
                : images[0];

        imageHTML = `
            <div class="popup-gallery single-image">

                <img
                    src="${image.path}"
                    alt="${image.alt || location.name}"
                    class="popup-image"
                >

            </div>
        `;

    }


    // ==========================================
    // 2+ IMAGES
    // ==========================================

    else {

        const firstImage =
            typeof images[0] === "string"
                ? {
                    path: images[0],
                    alt: location.name
                }
                : images[0];

        imageHTML = `
            <div
                class="popup-gallery"
                data-gallery-id="${location.id}"
            >

                <div class="popup-image-container">

                    <img
                        src="${firstImage.path}"
                        alt="${firstImage.alt || location.name}"
                        class="popup-image"
                    >

                    <button
                        type="button"
                        class="gallery-button gallery-prev"
                    >
                        ‹
                    </button>

                    <button
                        type="button"
                        class="gallery-button gallery-next"
                    >
                        ›
                    </button>

                </div>

                <div class="gallery-footer">

                    <span class="gallery-counter">
                        1 / ${images.length}
                    </span>

                </div>

            </div>
        `;

    }


    // ==========================================
    // POPUP
    // ==========================================

    marker.bindPopup(`

        <div class="popup-content">

            ${imageHTML}

            <div class="popup-title">

                ${icon}
                ${location.name}

            </div>

            <div class="popup-type">

                ${type?.name || "Sans type"}

            </div>

            <div class="popup-description">

                ${location.description || ""}

            </div>

        </div>

    `);


    // ==========================================
    // GALERIE
    // ==========================================

    marker.on(
        "popupopen",
        () => {

            if (images.length <= 1) {
                return;
            }

            const popupElement =
                marker
                    .getPopup()
                    .getElement();

            if (!popupElement) {
                return;
            }

            const gallery =
                popupElement.querySelector(
                    ".popup-gallery"
                );

            if (!gallery) {
                return;
            }

            const imageElement =
                gallery.querySelector(
                    ".popup-image"
                );

            const counter =
                gallery.querySelector(
                    ".gallery-counter"
                );

            const previousButton =
                gallery.querySelector(
                    ".gallery-prev"
                );

            const nextButton =
                gallery.querySelector(
                    ".gallery-next"
                );


            let currentImage = 0;


            function getImage(image) {

                if (typeof image === "string") {

                    return {
                        path: image,
                        alt: location.name
                    };

                }

                return image;

            }


            function showImage(index) {

                currentImage =
                    (
                        index +
                        images.length
                    ) %
                    images.length;


                const image =
                    getImage(
                        images[currentImage]
                    );


                imageElement.src =
                    image.path;


                imageElement.alt =
                    image.alt ||
                    `${location.name} - Image ${currentImage + 1}`;


                counter.textContent =
                    `${currentImage + 1} / ${images.length}`;

            }


            previousButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    showImage(
                        currentImage - 1
                    );

                }
            );


            nextButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    showImage(
                        currentImage + 1
                    );

                }
            );

        }
    );


    // ==========================================
    // DONNEES DU LIEU
    // ==========================================

    marker.locationData =
        location;


    return marker;

}

// ==========================================
// TAILLE DES MARQUEURS SELON LE ZOOM
// ==========================================

function updateMarkerScale() {

    const zoom = map.getZoom();

    // Taille normale à zoom 0
    // 1.2 = vitesse de réduction/agrandissement
    const scale = Math.max(
        0.45,
        Math.min(
            1.6,
            Math.pow(1.2, zoom)
        )
    );

    markers.forEach(marker => {

        const element = marker.getElement();

        if (!element) {
            return;
        }

        const markerElement =
            element.querySelector(".custom-marker");

        if (!markerElement) {
            return;
        }

        markerElement.style.transform =
            `scale(${scale})`;

        markerElement.style.transformOrigin =
            "center center";
    });
}

function initializeLocations() {

    markers.length = 0;


    locations.forEach(
        location => {

            const marker =
                createMarker(location);


            marker.addTo(map);


            markers.push(marker);

        }
    );


    updateLocationList();

    updateMarkerScale();

}

function initializeZones() {

    // Supprime les anciennes zones

    zoneLayers.forEach(
        layer => layer.removeFrom(map)
    );

    zoneLayers.length = 0;


    // Crée les nouvelles zones

    zones.forEach(zone => {

        if (
            !Array.isArray(zone.points) ||
            zone.points.length < 3
        ) {
            return;
        }


        const polygon =
            createZone(zone);


        // Les zones restent derrière
        // les marqueurs

        polygon.addTo(map);


        zoneLayers.push(polygon);

    });


    // Met les marqueurs au-dessus

    markers.forEach(
        marker => marker.bringToFront()
    );
}

function updateZoneVisibility() {

    const zoneType =
        types.find(
            type =>
                type.name.toLowerCase() === "zone"
        );

    if (!zoneType) {
        return;
    }

    const zoneFilter =
        document.querySelector(
            `.filter[value="${zoneType.id}"]`
        );

    if (!zoneFilter) {
        return;
    }

    zoneLayers.forEach(zone => {

        if (zoneFilter.checked) {
            zone.addTo(map);
        } else {
            zone.removeFrom(map);
        }

    });
}

// ==========================================
// CREATION D'UNE ZONE
// ==========================================

function createZone(zone) {
    const polygon = L.polygon(
        zoneToLeaflet(
            zone.points
        ),
        {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.25,
            weight: 2,
            opacity: 0.8
        }
    );

    // ==========================================
    // POPUP
    // ==========================================

    polygon.bindPopup(`
        <div class="popup-content">
            <div class="popup-title">
                ${zone.name}
            </div>
            <div class="popup-description">
                ${zone.description}
            </div>
        </div>
    `);

    // ==========================================
    // SURVOL
    // ==========================================

    polygon.on(
        "mouseover",
        () => {
            polygon.setStyle({
                fillOpacity: 0.4,
                weight: 3
            });
        }
    );

    polygon.on(
        "mouseout",
        () => {
            polygon.setStyle({
                fillOpacity: 0.25,
                weight: 2
            });
        }
    );

    polygon.zoneData =
        zone;

    return polygon;
}

// ==========================================
// CHARGEMENT DE LA CARTE
// ==========================================

const mapImage = new Image();

mapImage.onload = async function () {

    // Récupération des vraies dimensions
    // de map.jpg

    MAP_WIDTH =
        mapImage.naturalWidth;

    MAP_HEIGHT =
        mapImage.naturalHeight;

    console.log(
        "Dimensions de la carte :",
        MAP_WIDTH,
        "x",
        MAP_HEIGHT
    );

    // ==========================================
    // BOUNDS LEAFLET
    // ==========================================

    const bounds = [
        [0, 0],
        [
            MAP_HEIGHT,
            MAP_WIDTH
        ]
    ];

    // ==========================================
    // AJOUT DE L'IMAGE
    // ==========================================

    L.imageOverlay(
        "images/map.jpg",
        bounds
    ).addTo(map);

    // ==========================================
    // POSITION INITIALE
    // ==========================================

    map.fitBounds(bounds);
    await loadTypes();
    await loadLocations();
    await loadZones();

    // ==========================================
    // LISTE DES LIEUX
    // ==========================================

    updateLocationList();
};


// ==========================================
// ERREUR DE CHARGEMENT
// ==========================================

mapImage.onerror = function () {
    console.error(
        "Impossible de charger map.jpg"
    );
};

// Lancement du chargement
mapImage.src = "images/map.jpg";

// ==========================================
// MISE A JOUR DES MARQUEURS
// ==========================================

function updateMarkers() {

    const activeTypes = [];

    document
        .querySelectorAll(".filter")
        .forEach(filter => {

            if (filter.checked) {

                activeTypes.push(
                    filter.value
                );

            }

        });

    const searchValue =
        document
            .getElementById("search")
            .value
            .toLowerCase()
            .trim();

    markers.forEach(
        marker => {
            const location =
                marker.locationData;

            const typeVisible =
                activeTypes.includes(
                    location.type_id
                );

            const searchVisible =
                location.name
                    .toLowerCase()
                    .includes(
                        searchValue
                    );

            if (
                typeVisible &&
                searchVisible
            ) {
                marker.addTo(map);
            } else {
                marker.removeFrom(map);
            }
        }
    );

    updateLocationList(
        activeTypes,
        searchValue
    );
}

// ==========================================
// RECHERCHE
// ==========================================

document
    .getElementById("search")
    .addEventListener(
        "input",
        updateMarkers
    );

// ==========================================
// LISTE DES LIEUX
// ==========================================

const locationList =
    document.getElementById(
        "location-list"
    );

// ==========================================
// MISE A JOUR DE LA LISTE
// ==========================================

function updateLocationList(
    activeTypes = types.map(type => type.id),
    searchValue = ""
) {
    locationList.innerHTML = "";

    locations.forEach(
        location => {
            // Vérifier la catégorie
            if (
                !activeTypes.includes(
                    location.type_id
                )
            ) {
                return;
            }

            // Vérifier la recherche
            if (
                !location.name
                    .toLowerCase()
                    .includes(
                        searchValue
                    )
            ) {
                return;
            }

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "location-item";

            item.innerHTML = `
                <div class="location-name">
                    ${location.type?.icon || ""}
                    ${location.name}
                </div>

                <div class="location-type">
                    ${location.type?.name || "Autre"}
                </div>
            `;

            // ==========================================
            // CLIC SUR UN LIEU
            // ==========================================

            item.addEventListener(
                "click",
                () => {
                    map.flyTo(
                        imageToLeaflet(
                            location.x,
                            location.y
                        ),
                        1,
                        {
                            duration: 1
                        }
                    );

                    const marker =
                        markers.find(
                            marker =>
                                marker
                                    .locationData ===
                                    location
                        );

                    if (marker) {
                        marker.openPopup();
                    }
                }
            );

            locationList.appendChild(
                item
            );
        }
    );
}

// ==========================================
// SIDEBAR MOBILE
// ==========================================

const sidebarToggle =
    document.getElementById(
        "sidebar-toggle"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

sidebarToggle.addEventListener(
    "click",
    () => {
        sidebar.classList.toggle(
            "open"
        );
    }
);