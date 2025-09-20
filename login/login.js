document.querySelector("#loginForm #login").addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#emailadress").value;
    const password = document.querySelector("#password").value;
    const errorMessage = document.querySelector("#errorMessage");

    try {
        errorMessage.textContent = "";
         errorMessage.style.color = "red";

        const response = await fetch("../api/login?email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password), {
            method: "GET",
        });
        console.log(response);
        const data = await response.json();

        if (Object.keys(data).length === 0) {
            errorMessage.textContent = "Wachtwoord of email onjuist";
            throw new Error("Wachtwoord of email onjuist");
        } else {
            errorMessage.textContent = "inlogt";
            errorMessage.style.color = "green";
            sessionStorage.setItem("JWT", data.token);
            window.location.href = "../../";
        }
    } catch (error) {
        // if (errorMessage) {
        //     errorMessage.textContent = error.message;
        // }
        console.error("Login error:", error);
    }
});
