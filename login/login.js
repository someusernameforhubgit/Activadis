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
            document.querySelector("#passwordRestrictions").style.display = "block";
            document.querySelectorAll(".passVerify").forEach((element) => {
                element.style.display = "block";
            });

            document.querySelector("#password").addEventListener("input", checkPassword);
            document.querySelector("#resetLink").classList.add("display-none");
        }
    }

    document.querySelector("#loginForm #login").addEventListener("click", async (e) => submitForm(e));
});

async function submitForm(e) {
    e.preventDefault();

    const email = document.querySelector("#emailadress").value;
    const password = document.querySelector("#password").value;
    const errorMessage = document.querySelector("#errorMessage");

    if (document.querySelector("#reset").value === "true") {
        const reset_token = document.querySelector("#reset_token").value;
        const response = await fetch("../api/verify?token=" + reset_token);
        const data = await response.json();
        if (data.reset) {
            if (checkPassword()) {
                if (document.querySelector("#password").value !== document.querySelector("#passwordVerify").value) {
                    errorMessage.classList.remove("display-none");
                    errorMessage.textContent = "Wachtwoord komt niet overeen";
                    errorMessage.style.color = "red";
                    return;
                }
                const gebruiker = await fetch("../api/gebruiker?id=" + data.id + "&token=" + reset_token);
                const gebruikerData = await gebruiker.json();

                const response = await fetch("../api/gebruiker?token=" + reset_token, {
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
                if (response.status === 400) {
                    errorMessage.classList.remove("display-none");
                    errorMessage.textContent = "Wachtwoord voldoet niet aan de eisen";
                    errorMessage.style.color = "red";
                    return;
                }
            } else {
                errorMessage.classList.remove("display-none");
                errorMessage.textContent = "Wachtwoord voldoet niet aan de eisen";
                errorMessage.style.color = "red";
                return;
            }
        }
    }

    try {
        errorMessage.classList.add("display-none");

        const response = await fetch("../api/login?email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password), {
            method: "GET",
        });
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

function checkPassword() {
    const password = document.querySelector("#password").value;

    const validations = [
        {
            id: "lengthRestriction",
            isValid: (pwd) => pwd.length >= 8
        },
        {
            id: "uppercaseRestriction",
            isValid: (pwd) => /[A-Z]/.test(pwd)
        },
        {
            id: "numberRestriction",
            isValid: (pwd) => /[0-9]/.test(pwd)
        },
        {
            id: "specialRestriction",
            isValid: (pwd) => /[^a-zA-Z0-9]/.test(pwd)
        }
    ];

    validations.forEach(({ id, isValid }) => {
        const element = document.querySelector(`#${id}`);
        const parent = element.parentElement;
        const isValidPassword = isValid(password);

        parent.classList.toggle("valid", isValidPassword);
        element.classList.toggle("fa-check", isValidPassword);
        element.classList.toggle("fa-xmark", !isValidPassword);
    });

    return !validations.some(({ isValid }) => !isValid(password));
}