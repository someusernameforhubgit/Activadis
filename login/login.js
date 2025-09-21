document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams);
    if (urlParams.has("reset_token")) {
        console.log("reset_token");
        const reset_token = urlParams.get("reset_token");
        const response = await fetch("../api/verify?token=" + reset_token);
        const data = await response.json();
        if (data.reset) {
            document.querySelector("#reset").value = "true";
            document.querySelector("#reset_token").value = reset_token;
            document.querySelector("#emailadress").value = data.email;
            document.querySelector("#emailadress").disabled = true;
            document.querySelector("#password").placeholder = "Voor je nieuwe wachtwoord in";
        }
    }

    document.querySelector("#loginForm #login").addEventListener("click", async (e) => submitForm(e));
});

async function submitForm(e) {
    e.preventDefault();

    const email = document.querySelector("#emailadress").value;
    const password = document.querySelector("#password").value;

    if (document.querySelector("#reset").value === "true") {
        const reset_token = document.querySelector("#reset_token").value;
        const response = await fetch("../api/verify?token=" + reset_token);
        const data = await response.json();
        if (data.reset) {
            const gebruiker = await fetch("../api/gebruiker?id=" + data.id + "&token=" + reset_token);
            const gebruikerData = await gebruiker.json();

            await fetch("../api/gebruiker?token=" + reset_token, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: data.id,
                    email: gebruikerData.email,
                    firstname: gebruikerData.firstname,
                    lastname: gebruikerData.lastname,
                    password: password,
                    role: gebruikerData.role
                })
            });
        }
    }

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
}

