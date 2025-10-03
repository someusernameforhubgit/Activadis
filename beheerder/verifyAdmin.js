document.addEventListener("DOMContentLoaded", async () => {
    try {
        const token = sessionStorage.getItem("JWT");
        if (!token) return window.location.href = "/login";
        const response = await fetch("/api/verify?token=" + token);
        if (!response.ok) return window.location.href = "/login";
        const data = await response.json();
        if (!data || !data.id) return window.location.href = "/";
        const user = await fetch("/api/gebruiker?id=" + data.id + "&token=" + token);
        if (!user.ok) return window.location.href = "/login";
        const userData = await user.json();
        if (!userData || (userData.isAdmin !== 1 && userData.isAdmin !== true)) return window.location.href = "/";
        const loginEl = document.querySelector(".login");
        if (loginEl) loginEl.style.display = "none";
        document.querySelectorAll(".logout").forEach(e => e.style.display = "block");
        const nameEl = document.querySelector(".name");
        if (nameEl) nameEl.textContent = (userData.firstname || '') + " " + (userData.lastname || '');
    } catch {
        window.location.href = "/login";
    }
});

function logout() {
    sessionStorage.removeItem("JWT");
    window.location.href = "/";
}