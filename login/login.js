document.querySelector("#loginForm #login").addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#emailadress").value;
    const password = document.querySelector("#password").value;
    const errorMessage = document.querySelector("#errorMessage");

    try {
        errorMessage.classList.add("display-none");

        const response = await fetch("../api/login?email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password), {
            method: "GET",
        });
        console.log(response);
        const data = await response.json();

        if (Object.keys(data).length === 0) {
            errorMessage.classList.remove("display-none");
            errorMessage.textContent = "Wachtwoord of email onjuist";
            errorMessage.style.color = "red";
            throw new Error("Wachtwoord of email onjuist");
        } else {
            sessionStorage.setItem("JWT", data.token);
            window.location.href = "/";
        }
    } catch (error) {
        errorMessage.classList.remove("display-none");
        errorMessage.textContent = error.message;
        console.error("Login error:", error);
    }
});

