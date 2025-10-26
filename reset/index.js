document.addEventListener("DOMContentLoaded", async () => {
   document.querySelector("#loginForm #login").addEventListener("click", async (e) => submitForm(e));
});

async function submitForm(e) {
    e.preventDefault();
    const email = document.querySelector("#emailadress").value;
    const errorMessage = document.querySelector("#errorMessage");
    errorMessage.classList.add("display-none");

    const response = await fetch("../api/gebruiker/reset?email=" + encodeURIComponent(email), {
        method: "GET",
    });

    if (response.status === 200) {
        document.querySelector(".form-group").classList.add("display-none");
        document.querySelector("#successMessage").classList.remove("display-none");
    } else {
        errorMessage.classList.remove("display-none");
        errorMessage.textContent = "Geen account met dit email gevonden";
        errorMessage.style.color = "red";
    }
}