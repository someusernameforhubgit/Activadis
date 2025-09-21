document.addEventListener("DOMContentLoaded", async () => {
    if (sessionStorage.getItem("JWT") === null) return window.location.href = "/login";
    const response = await fetch("../api/verify?token=" + sessionStorage.getItem("JWT"));
    const data = await response.json();
    if (Object.keys(data).length === 0) return window.location.href = "/";
    const user = await fetch("../api/gebruiker?id=" + data.id + "&token=" + sessionStorage.getItem("JWT"));
    const userData = await user.json();
    if (userData.role !== 1) return window.location.href = "/";
    document.querySelector(".login").style.display = "none";
    document.querySelectorAll(".logout").forEach((element) => {
        element.style.display = "block";
    });
    document.querySelector(".name").textContent = userData.firstname + " " + userData.lastname;
});

function logout() {
    sessionStorage.removeItem("JWT");
    window.location.href = "/";
}