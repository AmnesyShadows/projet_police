/* ============================================================
   CARTE V2 — LIEUX, ZONES ET FILTRES
   Adaptation de la Carte V1 à l'architecture V2.
   Supabase : utilise exclusivement supabaseClient de js/core/supabase.js
   ============================================================ */

let carteMapInstance = null;
let carteMapWidth = 0;
let carteMapHeight = 0;

let carteTypes = [];
let carteLocations = [];
let carteZones = [];

const carteMarkers = [];
const carteZoneLayers = [];

let carteSearchValue = "";
let carteSelectedLocationId = null;

/* ============================================================
   INITIALISATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", initCartePage);

async function initCartePage() {
    const mapContainer = document.getElementById("carte-map");
    const filtersContainer = document.getElementById("carte-filters-content");

    if (!mapContainer || !filtersContainer) {
        console.error("Carte V2 : conteneurs #carte-map ou #carte-filters-content introuvables.");
        return;
    }

    if (typeof supabaseClient === "undefined") {
        console.error("Carte V2 : supabaseClient est introuvable.");
        carteShowMessage("La connexion à Supabase n'est pas disponible.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Carte V2 : Leaflet n'est pas chargé.");
        carteShowMessage("La bibliothèque cartographique n'a pas pu être chargée.");
        return;
    }

    carteRenderSearch();

    try {
        await carteInitMap();
        await carteLoadData();
        carteRenderFilters();
        carteRenderMarkers();
        carteRenderZones();
        carteRenderLocationList();
        carteRenderZoneList();

        setTimeout(() => carteMapInstance?.invalidateSize(), 150);
    } catch (error) {
        console.error("Erreur initialisation Carte V2 :", error);
        carteShowMessage("Impossible de charger les données de la carte. Consulte la console pour le détail.");
    }
}

/* ============================================================
   INITIALISATION LEAFLET ET IMAGE DE FOND
   Le système de coordonnées est identique à la Carte V1.
   ============================================================ */

function carteInitMap() {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            carteMapWidth = image.naturalWidth;
            carteMapHeight = image.naturalHeight;

            const bounds = [[0, 0], [carteMapHeight, carteMapWidth]];

            carteMapInstance = L.map("carte-map", {
                crs: L.CRS.Simple,
                minZoom: -4,
                maxZoom: 3,
                zoomControl: true,
                attributionControl: false
            });

            L.imageOverlay("../assets/images/map.jpg", bounds).addTo(carteMapInstance);
            carteMapInstance.fitBounds(bounds);
            // Ouverture légèrement plus rapprochée que le fitBounds standard.
            carteMapInstance.setZoom(Math.min(carteMapInstance.getZoom() + 0.5, 3));
            carteMapInstance.on("zoomend", carteUpdateMarkerScale);

            // Utilisé par le bouton rétractable présent dans carte.html.
            window.carteMapInstance = carteMapInstance;

            resolve();
        };

        image.onerror = () => reject(new Error("Impossible de charger ../assets/images/map.jpg"));
        image.src = "../assets/images/map.jpg";
    });
}

function carteImageToLeaflet(x, y) {
    return [carteMapHeight - Number(y), Number(x)];
}

/* ============================================================
   CHARGEMENT DES DONNÉES SUPABASE V2
   Les requêtes reprennent les tables et relations de la V1.
   ============================================================ */

async function carteLoadData() {
    const [typesResult, locationsResult, zonesResult] = await Promise.all([
        supabaseClient
            .from("types")
            .select("*")
            .order("name", { ascending: true }),

        supabaseClient
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
            .order("name", { ascending: true }),

        supabaseClient
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
            .order("name", { ascending: true })
    ]);

    if (typesResult.error) throw typesResult.error;
    if (locationsResult.error) throw locationsResult.error;
    if (zonesResult.error) throw zonesResult.error;

    carteTypes = typesResult.data || [];
    carteLocations = locationsResult.data || [];
    carteZones = zonesResult.data || [];

    // Sécurise la relation si une réponse ne contient pas l'objet type.
    carteLocations = carteLocations.map(location => ({
        ...location,
        type: location.type || carteTypes.find(type => String(type.id) === String(location.type_id)) || null
    }));

    carteZones = carteZones.map(zone => ({
        ...zone,
        type: zone.type || carteTypes.find(type => String(type.id) === String(zone.type_id)) || null
    }));
}

/* ============================================================
   RECHERCHE
   Le champ est créé dans le panneau de filtres car le HTML V2
   actuel ne contient pas de champ de recherche dédié.
   ============================================================ */

function carteRenderSearch() {
    const container = document.getElementById("carte-filters-content");
    if (!container || document.getElementById("carte-search")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "carte-search-wrapper";

    const input = document.createElement("input");
    input.type = "search";
    input.id = "carte-search";
    input.className = "carte-search-input";
    input.placeholder = "Rechercher un lieu...";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Rechercher un lieu");

    input.addEventListener("input", () => {
        carteSearchValue = input.value.trim().toLocaleLowerCase("fr");
        carteApplyFilters();
    });

    wrapper.appendChild(input);
    container.appendChild(wrapper);
}

/* ============================================================
   FILTRES PAR TYPE
   Chaque type contrôle les lieux correspondants.
   Le type nommé "Zone" contrôle l'affichage des polygones,
   comme dans la Carte V1.
   ============================================================ */

function carteRenderFilters() {
    const container = document.getElementById("carte-filters-content");
    if (!container) return;

    let section = document.getElementById("carte-type-filters");
    if (!section) {
        section = document.createElement("div");
        section.id = "carte-type-filters";
        section.className = "carte-type-filters";
        container.appendChild(section);
    }
    section.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Filtrer par type";
    section.appendChild(title);

    carteTypes.forEach(type => {
        const label = document.createElement("label");
        label.className = "carte-filter-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "carte-filter";
        checkbox.value = String(type.id);
        checkbox.checked = true;
        checkbox.addEventListener("change", carteApplyFilters);

        const color = document.createElement("span");
        color.className = "carte-filter-color";
        color.style.backgroundColor = carteSafeColor(type.color);

        const icon = document.createElement("span");
        icon.className = "carte-filter-icon";
        icon.textContent = (type.icon || "");

        const name = document.createElement("span");
        name.className = "carte-filter-name";
        name.textContent = type.name || "Type sans nom";

        label.append(checkbox, color, icon, name);
        section.appendChild(label);
    });

    const locationsTitle = document.createElement("h3");
    locationsTitle.textContent = "Lieux";
    locationsTitle.className = "carte-location-list-title";
    section.appendChild(locationsTitle);

    const locationsList = document.createElement("div");
    locationsList.id = "carte-location-list";
    locationsList.className = "carte-location-list";
    section.appendChild(locationsList);

    const zonesTitle = document.createElement("h3");
    zonesTitle.textContent = "Zones";
    zonesTitle.className = "carte-zones-list-title";
    section.appendChild(zonesTitle);

    const zonesList = document.createElement("div");
    zonesList.id = "carte-zones-list";
    zonesList.className = "carte-zones-list";
    section.appendChild(zonesList);
}

function carteGetActiveTypes() {
    return Array.from(document.querySelectorAll(".carte-filter:checked"))
        .map(input => String(input.value));
}

function carteApplyFilters() {
    const activeTypes = carteGetActiveTypes();

    carteMarkers.forEach(marker => {
        const location = marker.locationData;
        const typeVisible = activeTypes.includes(String(location.type_id));
        const searchVisible = (location.name || "").toLocaleLowerCase("fr").includes(carteSearchValue);
        const visible = location.visible !== false && typeVisible && searchVisible;

        if (visible) {
            if (!carteMapInstance.hasLayer(marker)) marker.addTo(carteMapInstance);
        } else {
            marker.removeFrom(carteMapInstance);
        }
    });

    carteZoneLayers.forEach(layer => {
        const zone = layer.zoneData;
        const typeVisible = activeTypes.includes(String(zone.type_id));
        const searchVisible = (zone.name || "").toLocaleLowerCase("fr").includes(carteSearchValue);
        const visible = zone.visible !== false && typeVisible && searchVisible;

        if (visible) {
            if (!carteMapInstance.hasLayer(layer)) layer.addTo(carteMapInstance);
        } else {
            layer.removeFrom(carteMapInstance);
        }
    });

    carteRenderLocationList();
    carteRenderZoneList();
}

/* ============================================================
   MARQUEURS DES LIEUX ET POPUPS
   ============================================================ */

function carteRenderMarkers() {
    carteMarkers.forEach(marker => marker.removeFrom(carteMapInstance));
    carteMarkers.length = 0;

    carteLocations.forEach(location => {
        // Les lieux masqués restent dans la liste, mais ne créent aucun marqueur.
        if (location.visible === false) return;
        if (location.x == null || location.y == null) return;

        const type = location.type;
        const color = carteSafeColor(type?.color);
        const iconText = type?.afficher_icon ? (type.icon || "") : "";

        const markerIcon = L.divIcon({
            className: "custom-marker-container",
            html: `
                <div class="custom-marker" style="background:${color}">
                    ${carteEscapeHtml(iconText)}
                </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        const marker = L.marker(carteImageToLeaflet(location.x, location.y), {
            icon: markerIcon,
            pane: "markerPane",
            zIndexOffset: (100 - Number(type?.priority || 0)) * 100
        });

        marker.locationData = location;

        marker.bindPopup(carteBuildLocationPopup(location));

        marker.on("click", () => {
            carteSelectLocation(location.id);
        });

        marker.on("popupopen", () => carteInitPopupGallery(marker, location));
        
        marker.addTo(carteMapInstance);
        carteMarkers.push(marker);
    });

    carteUpdateMarkerScale();
}

function carteBuildLocationPopup(location) {
    const images = carteNormalizeImages(location.images);
    let imageHTML = "";

    if (images.length === 1) {
        imageHTML = `
            <div class="popup-gallery single-image">
                <img src="${carteEscapeHtml(images[0].path)}" alt="${carteEscapeHtml(images[0].alt || location.name)}" class="popup-image">
            </div>`;
    } else if (images.length > 1) {
        imageHTML = `
            <div class="popup-gallery" data-gallery-id="${carteEscapeHtml(location.id)}">
                <div class="popup-image-container">
                    <img src="${carteEscapeHtml(images[0].path)}" alt="${carteEscapeHtml(images[0].alt || location.name)}" class="popup-image">
                    <button type="button" class="gallery-button gallery-prev" aria-label="Image précédente">‹</button>
                    <button type="button" class="gallery-button gallery-next" aria-label="Image suivante">›</button>
                </div>
                <div class="gallery-footer"><span class="gallery-counter">1 / ${images.length}</span></div>
            </div>`;
    }

    return `
        <div class="popup-content">
            ${imageHTML}
            <div class="popup-title">${carteEscapeHtml(location.type?.afficher_icon ? location.type?.icon : "")} ${carteEscapeHtml(location.name || "Lieu")}</div>
            <div class="popup-type">${carteEscapeHtml(location.type?.name || "Sans type")}</div>
            <div class="popup-description">${carteEscapeHtml(location.description || "")}</div>
        </div>`;
}

function carteNormalizeImages(images) {
    if (!Array.isArray(images)) return [];

    return images.map(image => {
        if (typeof image === "string") return { path: image, alt: "" };
        if (image && typeof image.path === "string") return image;
        return null;
    }).filter(image => image && /^https?:\/\//i.test(image.path));
}

function carteInitPopupGallery(marker, location) {
    const images = carteNormalizeImages(location.images);
    if (images.length <= 1) return;

    const popup = marker.getPopup()?.getElement();
    if (!popup) return;

    const imageElement = popup.querySelector(".popup-image");
    const counter = popup.querySelector(".gallery-counter");
    const previousButton = popup.querySelector(".gallery-prev");
    const nextButton = popup.querySelector(".gallery-next");
    if (!imageElement || !counter || !previousButton || !nextButton) return;

    let currentImage = 0;
    const showImage = index => {
        currentImage = (index + images.length) % images.length;
        imageElement.src = images[currentImage].path;
        imageElement.alt = images[currentImage].alt || `${location.name} - Image ${currentImage + 1}`;
        counter.textContent = `${currentImage + 1} / ${images.length}`;
    };

    previousButton.addEventListener("click", event => {
        event.stopPropagation();
        showImage(currentImage - 1);
    });

    nextButton.addEventListener("click", event => {
        event.stopPropagation();
        showImage(currentImage + 1);
    });
}

/* ============================================================
   TAILLE DES MARQUEURS SELON LE ZOOM — COMPORTEMENT V1
   ============================================================ */

function carteUpdateMarkerScale() {
    if (!carteMapInstance) return;

    const zoom = carteMapInstance.getZoom();
    const scale = Math.max(0.45, Math.min(1.6, Math.pow(1.2, zoom)));

    carteMarkers.forEach(marker => {
        const element = marker.getElement()?.querySelector(".custom-marker");
        if (!element) return;
        element.style.transform = `scale(${scale})`;
        element.style.transformOrigin = "center center";
    });
}

/* ============================================================
   ZONES — FORMAT DE POINTS IDENTIQUE À LA V1
   ============================================================ */

function carteNormalizeZonePoints(points) {
    let parsed = points;

    if (typeof parsed === "string") {
        try {
            parsed = JSON.parse(parsed);
        } catch (error) {
            console.error("Carte V2 : points de zone JSON invalides.", error);
            return [];
        }
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.map(point => {
        if (Array.isArray(point) && point.length >= 2) {
            return { x: Number(point[0]), y: Number(point[1]) };
        }
        if (point && point.x != null && point.y != null) {
            return { x: Number(point.x), y: Number(point.y) };
        }
        return null;
    }).filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
}

function carteRenderZones() {
    carteZoneLayers.forEach(layer => layer.removeFrom(carteMapInstance));
    carteZoneLayers.length = 0;

    carteZones.forEach(zone => {
        // Les zones masquées restent consultables dans le panneau, pas sur la carte.
        if (zone.visible === false) return;
        const points = carteNormalizeZonePoints(zone.points);
        if (points.length < 3) return;

        const color = carteSafeColor(zone.color || zone.type?.color);
        const polygon = L.polygon(
            points.map(point => carteImageToLeaflet(point.x, point.y)),
            {
                pane: "overlayPane",
                color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 2,
                opacity: 0.8
            }
        );

        polygon.zoneData = zone;
        polygon.bindPopup(`
            <div class="popup-content">
                <div class="popup-title">${carteEscapeHtml(zone.name || "Zone")}</div>
                <div class="popup-type">${carteEscapeHtml(zone.type?.name || "Sans type")}</div>
                <div class="popup-description">${carteEscapeHtml(zone.description || "")}</div>
            </div>`);

        polygon.on("mouseover", () => polygon.setStyle({ fillOpacity: 0.4, weight: 3 }));
        polygon.on("mouseout", () => polygon.setStyle({ fillOpacity: 0.25, weight: 2 }));

        polygon.addTo(carteMapInstance);
        carteZoneLayers.push(polygon);
    });

    // Les marqueurs sont affichés dans leur propre pane Leaflet,
    // au-dessus des polygones par défaut. Aucun bringToFront() nécessaire.
}

function carteSelectLocation(locationId, scrollToItem = true) {
    carteSelectedLocationId = String(locationId);

    // Met à jour la surbrillance dans la liste
    document.querySelectorAll(".location-item[data-location-id]").forEach(item => {
        const isSelected = item.dataset.locationId === carteSelectedLocationId;
        item.classList.toggle("is-selected", isSelected);

        // Fait défiler le menu jusqu'au lieu sélectionné
        if (isSelected && scrollToItem) {
            item.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    });
}

/* ============================================================
   LISTE DES LIEUX ET CENTRAGE AU CLIC — COMPORTEMENT V1
   ============================================================ */

function carteRenderLocationList() {
    const container = document.getElementById("carte-location-list");
    if (!container) return;
    container.innerHTML = "";

    const activeTypes = carteGetActiveTypes();
    const filtered = carteLocations.filter(location => {
        const typeVisible = activeTypes.includes(String(location.type_id));
        const searchVisible = (location.name || "").toLocaleLowerCase("fr").includes(carteSearchValue);
        return typeVisible && searchVisible;
    });

    // Regroupement par type, puis tri alphabétique des lieux.
    carteTypes.forEach(type => {
        const group = filtered
            .filter(location => String(location.type_id) === String(type.id))
            .sort((a, b) => (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" }));
        if (!group.length) return;

        const groupTitle = document.createElement("div");
        groupTitle.className = "carte-list-group-title";
        groupTitle.textContent = `${type.icon + " "}${type.name}`;
        container.appendChild(groupTitle);

        group.forEach(location => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "location-item";
            item.dataset.locationId = String(location.id);

            if (String(location.id) === carteSelectedLocationId) {
                item.classList.add("is-selected");
            }
            item.disabled = location.visible === false || location.x == null || location.y == null;

            const name = document.createElement("span");
            name.className = "location-name";
            name.textContent = location.name || "Lieu sans nom";

            const status = document.createElement("span");
            status.className = location.visible === false ? "location-status is-hidden" : "location-status is-visible";
            status.textContent = location.visible === false ? "Masqué" : "Visible";

            item.append(name, status);
            item.addEventListener("click", () => {
                if (location.visible === false) return;

                const marker = carteMarkers.find(
                    entry => String(entry.locationData.id) === String(location.id)
                );

                if (!marker) return;

                carteSelectLocation(location.id, false);

                carteMapInstance.flyTo(
                    carteImageToLeaflet(location.x, location.y),
                    Math.max(carteMapInstance.getZoom(), 1),
                    { duration: 0.8 }
                );

                marker.openPopup();
            });
            container.appendChild(item);
        });
    });

    if (!container.children.length) {
        const empty = document.createElement("p");
        empty.className = "carte-empty-list";
        empty.textContent = "Aucun lieu trouvé.";
        container.appendChild(empty);
    }
}

function carteRenderZoneList() {
    const container = document.getElementById("carte-zones-list");
    if (!container) return;
    container.innerHTML = "";

    const activeTypes = carteGetActiveTypes();
    const filtered = carteZones
        .filter(zone => activeTypes.includes(String(zone.type_id)) && (zone.name || "").toLocaleLowerCase("fr").includes(carteSearchValue))
        .sort((a, b) => (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" }));

    if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "carte-empty-list";
        empty.textContent = "Aucune zone trouvée.";
        container.appendChild(empty);
        return;
    }

    filtered.forEach(zone => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "location-item zone-item";
        item.disabled = zone.visible === false;

        const name = document.createElement("span");
        name.className = "location-name";
        name.textContent = zone.name || "Zone sans nom";

        const status = document.createElement("span");
        status.className = zone.visible === false ? "location-status is-hidden" : "location-status is-visible";
        status.textContent = zone.visible === false ? "Masquée" : "Visible";

        item.append(name, status);
        item.addEventListener("click", () => {
            const layer = carteZoneLayers.find(entry => String(entry.zoneData.id) === String(zone.id));
            if (!layer || zone.visible === false) return;
            carteMapInstance.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 1.5 });
            layer.openPopup();
        });
        container.appendChild(item);
    });
}

/* ============================================================
   UTILITAIRES
   ============================================================ */

function carteSafeColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value)
        ? value
        : "#888888";
}

function carteEscapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function carteShowMessage(message) {
    const container = document.getElementById("carte-map");
    if (!container) return;

    container.innerHTML = "";
    const paragraph = document.createElement("p");
    paragraph.style.padding = "24px";
    paragraph.style.textAlign = "center";
    paragraph.textContent = message;
    container.appendChild(paragraph);
}