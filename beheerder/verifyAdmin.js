function withHeader(callback) {
    if (typeof window.onHeaderReady === "function") {
        window.onHeaderReady(() => callback());
    } else {
        callback();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const redirect = (url) => {
        window.location.href = url;
    };

    try {
        const token = sessionStorage.getItem("JWT");
        if (!token) return redirect("/login");

        const response = await fetch("/api/verify?token=" + token);
        if (!response.ok) return redirect("/login");

        const data = await response.json();
        if (!data || !data.id) return redirect("/");

        const user = await fetch("/api/gebruiker?id=" + data.id + "&token=" + token);
        if (!user.ok) return redirect("/login");

        const userData = await user.json();
        if (!userData || (userData.isAdmin !== 1 && userData.isAdmin !== true)) return redirect("/");

        withHeader(() => {
            const loginEl = document.querySelector(".login");
            if (loginEl) loginEl.style.display = "none";

            document.querySelectorAll(".logout").forEach((element) => {
                element.style.display = "block";
            });

            const nameEl = document.querySelector(".name");
            if (nameEl) {
                nameEl.textContent = `${userData.firstname || ""} ${userData.lastname || ""}`.trim();
            }
        });
    } catch {
        redirect("/login");
    }
});

function logout() {
    sessionStorage.removeItem("JWT");
    window.location.href = "/";
}