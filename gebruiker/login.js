function withHeader(callback) {
    if (typeof window.onHeaderReady === "function") {
        window.onHeaderReady(() => callback());
    } else {
        callback();
    }
}

function normalizePath(path) {
    if (!path || path === "#" || path.startsWith("javascript:")) {
        return null;
    }

    try {
        const url = new URL(path, window.location.origin);
        path = url.pathname;
    } catch (error) {
        path = path.startsWith("/") ? path : `/${path}`;
    }

    path = path.replace(/\/index\.html$/i, "/");

    if (path !== "/" && path.endsWith("/")) {
        path = path.slice(0, -1);
    }

    return path || "/";
}

function updateNavActiveStates(navElement) {
    if (!navElement) {
        return;
    }

    const currentPath = normalizePath(window.location.pathname) || "/";
    navElement.querySelectorAll("a").forEach((link) => {
        const linkPath = normalizePath(link.getAttribute("href"));
        const isActive = linkPath !== null && linkPath === currentPath;
        link.classList.toggle("active", isActive);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const filters = document.querySelector(".filters");
    const token = sessionStorage.getItem("JWT");

    const showLoggedOutState = () => {
        withHeader(() => {
            const loginEl = document.querySelector(".login");
            if (loginEl) loginEl.style.display = "";

            document.querySelectorAll(".logout").forEach((element) => {
                element.style.display = "none";
            });

            const nameEl = document.querySelector(".name");
            if (nameEl) nameEl.textContent = "";

            const navLeft = document.querySelector(".nav-left");
            if (navLeft) {
                const profileLink = navLeft.querySelector('[data-profile-link="true"]');
                if (profileLink) {
                    profileLink.remove();
                }
                updateNavActiveStates(navLeft);
            }
        });
    };

    if (!token) {
        if (filters) filters.style.display = "none";
        showLoggedOutState();
        return;
    }

    const response = await fetch("../api/verify?token=" + token);
    const data = await response.json();

    if (!data || Object.keys(data).length === 0) {
        sessionStorage.removeItem("JWT");
        if (filters) filters.style.display = "none";
        showLoggedOutState();
        return;
    }

    const gebruiker = await fetch("../api/gebruiker?id=" + data.id + "&token=" + token);
    const gebruikerData = await gebruiker.json();

    withHeader(() => {
        const loginEl = document.querySelector(".login");
        if (loginEl) loginEl.style.display = "none";

        document.querySelectorAll(".logout").forEach((element) => {
            element.style.display = "block";
        });

        const nameEl = document.querySelector(".name");
        if (nameEl) {
            nameEl.textContent = `${gebruikerData.firstname || ""} ${gebruikerData.lastname || ""}`.trim();
        }

        const isAdmin = gebruikerData.role === 1 || gebruikerData.isAdmin === 1 || gebruikerData.isAdmin === true;

        const navLeft = document.querySelector(".nav-left");

        if (navLeft) {
            if (isAdmin) {
                if (!navLeft.querySelector('a[href="/beheerder"]')) {
                    const beheerderLink = document.createElement("a");
                    beheerderLink.href = "/beheerder";
                    beheerderLink.textContent = "Beheerder";
                    navLeft.appendChild(beheerderLink);
                }
            } else {
                const beheerderLink = navLeft.querySelector('a[href="/beheerder"]');
                if (beheerderLink) {
                    beheerderLink.remove();
                }
            }

            let profileLink = navLeft.querySelector('[data-profile-link="true"]');
            if (!profileLink) {
                profileLink = document.createElement("a");
                profileLink.href = "/profiel";
                profileLink.textContent = "Profiel";
                profileLink.dataset.profileLink = "true";
                navLeft.appendChild(profileLink);
            }

            updateNavActiveStates(navLeft);
        }
    });
});

function logout() {
    sessionStorage.removeItem("JWT");
    location.reload();
}