document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("JWT");
    if (token) {
        const response = await fetch("../api/verify?token=" + token);
        const data = await response.json();
        if (Object.keys(data).length === 0) {
            sessionStorage.removeItem("JWT");
        } else {
            document.querySelector(".login").style.display = "none";
            document.querySelectorAll(".logout").forEach((element) => {
                element.style.display = "block";
            });
            const gebruiker = await fetch("../api/gebruiker?id=" + data.id);
            const gebruikerData = await gebruiker.json();
            document.querySelector(".name").textContent = gebruikerData.firstname + " " + gebruikerData.lastname;
        }
    }
});

function logout() {
    sessionStorage.removeItem("JWT");
    location.reload();
}