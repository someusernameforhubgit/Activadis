function withHeader(callback) {
    if (typeof window.onHeaderReady === "function") {
        window.onHeaderReady(() => callback());
    } else {
        callback();
    }
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

        // Only show beheerder link for admins (role === 1)
        if (gebruikerData.role === 1) {
            const navLeft = document.querySelector(".nav-left");
            if (navLeft && !navLeft.querySelector('a[href="/beheerder"]')) {
                const beheerderLink = document.createElement("a");
                beheerderLink.href = "/beheerder";
                beheerderLink.textContent = "Beheerder";
                navLeft.appendChild(beheerderLink);
            }
        } else {
            // Remove beheerder link if user is not an admin
            const navLeft = document.querySelector(".nav-left");
            if (navLeft) {
                const beheerderLink = navLeft.querySelector('a[href="/beheerder"]');
                if (beheerderLink) {
                    beheerderLink.remove();
                }
            }
        }
    });
});

function logout() {
    sessionStorage.removeItem("JWT");
    location.reload();
}