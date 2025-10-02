document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (sessionStorage.getItem("JWT") === null) return window.location.href = "/login";
        
        const response = await fetch("../api/verify?token=" + sessionStorage.getItem("JWT"));
        if (!response.ok) return window.location.href = "/login";
        
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) return window.location.href = "/";
        
        const user = await fetch("../api/gebruiker?id=" + data.id + "&token=" + sessionStorage.getItem("JWT"));
        if (!user.ok) return window.location.href = "/login";
        
        const userData = await user.json();
        if (!userData || userData.role !== 1) return window.location.href = "/";
        
        document.querySelector(".login").style.display = "none";
        document.querySelectorAll(".logout").forEach((element) => {
            element.style.display = "block";
        });
        document.querySelector(".name").textContent = (userData.firstname || '') + " " + (userData.lastname || '');
    } catch (error) {
        console.error('Error during admin verification:', error);
        window.location.href = "/login";
    }
});

function logout() {
    sessionStorage.removeItem("JWT");
    window.location.href = "/";
}