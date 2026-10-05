function createAlert(message, type = "info", options = {}) {

    const {
        title = "",
        closable = true,
        className = ""
    } = options;

    const alert = document.createElement("div");

    alert.className = `alert alert-${type} ${className}`.trim();

    alert.innerHTML = `
        <div class="alert-content">

            ${
                title
                    ? `
                        <div class="alert-title">
                            ${escapeAlertHtml(title)}
                        </div>
                    `
                    : ""
            }

            <div class="alert-message">
                ${escapeAlertHtml(message)}
            </div>

        </div>

        ${
            closable
                ? `
                    <button
                        type="button"
                        class="alert-close"
                        aria-label="Fermer"
                    >
                        ×
                    </button>
                `
                : ""
        }
    `;

    if (closable) {

        const closeButton =
            alert.querySelector(".alert-close");

        closeButton.addEventListener("click", () => {
            alert.remove();
        });
    }

    const pageContent =
        document.querySelector(".page-content");

    if (pageContent) {
        pageContent.prepend(alert);
    }

    return alert;
}


function escapeAlertHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}