import {
    Modal,
    TitleComponent,
    ButtonComponent,
    InputFieldComponent,
    ColumnComponent,
    RowComponent,
    CloseButtonComponent
} from '../util/modal.js';

import {
    Notification,
    NotifType
} from "/util/notif.js";

// Get activity ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
let activityId = urlParams.get('id');
if (!activityId) {
    const m = window.location.pathname.match(/^\/activiteit\/(\d+)/);
    if (m) activityId = m[1];
}
const jwt = sessionStorage.getItem('JWT');

// DOM elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const mainContent = document.getElementById('mainContent');
const errorMessage = document.getElementById('errorMessage');

// Carousel functionality
let currentSlide = 0;
let totalSlides = 0;

window.moveCarousel = (direction) => {
    const carousel = document.querySelector('.carousel-wrapper');
    if (!carousel) return;

    totalSlides = document.querySelectorAll('.carousel-slide').length;
    currentSlide += direction;

    // Loop around if needed
    if (currentSlide >= totalSlides) {
        currentSlide = 0;
    } else if (currentSlide < 0) {
        currentSlide = totalSlides - 1;
    }

    // Move the carousel
    const translateX = -(currentSlide * (100 / totalSlides));
    carousel.style.transform = `translateX(${translateX}%)`;

    // Update indicators
    updateIndicators();
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    const carousel = document.querySelector('.carousel-wrapper');
    if (!carousel) return;

    totalSlides = document.querySelectorAll('.carousel-slide').length;
    const translateX = -(currentSlide * (100 / totalSlides));
    carousel.style.transform = `translateX(${translateX}%)`;

    updateIndicators();
}

function updateIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
            indicator.style.background = 'white';
        } else {
            indicator.classList.remove('active');
            indicator.style.background = 'transparent';
        }
    });
}

// Function to show error state
function showError(message = 'Er is een onbekende fout opgetreden.') {
    loadingState.style.display = 'none';
    mainContent.style.display = 'none';
    errorState.style.display = 'flex';
    errorMessage.textContent = message;
}

// Function to show main content
function showContent() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    mainContent.style.display = 'block';
}

// Function to format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to calculate available spots
function calculateAvailableSpots(min, max, current = 0) {
    return Math.max(0, max - current);
}

// Function to populate activity data
async function populateActivityData(data) {
    // Header information
    document.getElementById('activityTitle').textContent = data.naam || 'Onbekende Activiteit';
    document.querySelector('#activityLocation span').textContent = data.locatie || 'Locatie niet opgegeven';
    document.querySelector('#activityPrice span').textContent = data.kost ? `${data.kost} euro` : 'Gratis';

    // Detail information
    document.getElementById('startDateTime').textContent = formatDateTime(data.begin);
    document.getElementById('endDateTime').textContent = formatDateTime(data.eind);
    document.getElementById('participants').textContent = `${data.min || 0} - ${data.max || 0} personen`;
    document.getElementById('foodIncluded').innerHTML = data.eten ?
        '<i class="fas fa-check text-success"></i> Ja' :
        '<i class="fas fa-times text-danger"></i> Nee';

    // Description
    document.getElementById('activityDescription').textContent = data.omschrijving || 'Geen omschrijving beschikbaar.';

    // Registration information
    document.getElementById('registrationPrice').textContent = data.kost ? `€${data.kost}` : 'Gratis';

    let afbeeldingen;
    if (data.afbeeldingen[0] == null) {
        afbeeldingen = '<img src="https://covadis.nl/wp-content/themes/id/resource/image/header/1.svg" alt="Afbeelding van activiteit" class="single-image">';
    } else if (data.afbeeldingen.length == 1) {
        afbeeldingen = '<img src="' + data.afbeeldingen[0].afbeeldingUrl + '" alt="Afbeelding van activiteit" class="single-image">';
    } else {
        // Create carousel for multiple images
        afbeeldingen = `
                    <div class="carousel-container">
                        <div class="carousel-wrapper" style="width: ${data.afbeeldingen.length * 100}%;">`;

        for (let i = 0; i < data.afbeeldingen.length; i++) {
            afbeeldingen += `
                        <div class="carousel-slide" style="flex: 0 0 ${100 / data.afbeeldingen.length}%;">
                            <img src="${data.afbeeldingen[i].afbeeldingUrl}" alt="Afbeelding ${i + 1} van activiteit" class="carousel-image">
                        </div>`;
        }

        afbeeldingen += `
                        </div>
                        <button class="carousel-btn prev" onclick="moveCarousel(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-btn next" onclick="moveCarousel(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="carousel-indicators">`;

        for (let i = 0; i < data.afbeeldingen.length; i++) {
            afbeeldingen += `
                        <button class="indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>`;
        }

        afbeeldingen += `
                        </div>
                    </div>`;
    }

    document.querySelector('#activityImage').innerHTML = afbeeldingen;

    const inschrijvingen = await fetch("/api/inschrijving?activiteit=" + data.id);
    const inschrijvingenData = await inschrijvingen.json();
    const availableSpots = calculateAvailableSpots(data.min, data.max, inschrijvingenData.length);
    document.getElementById('registrationCount').textContent = inschrijvingenData.length;

    // Update availability status
    const statusElement = document.getElementById('availabilityStatus');
    if (availableSpots > 0) {
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i><span>Plaatsen beschikbaar</span>';
        statusElement.className = 'availability-status available';
    } else {
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i><span>Vol</span>';
        statusElement.className = 'availability-status full';
        document.getElementById('registerBtn').disabled = true;
        document.getElementById('registerBtn').innerHTML = '<i class="fas fa-ban"></i> Vol';
    }
}

// Function to handle registration
async function handleRegistration() {
    const res = await fetch("/api/verify?token=" + jwt);
    const jwtData = await res.json();
    if (jwtData.id) {
        const inschrijvingen = await fetch("/api/inschrijving?gebruiker=" + jwtData.id + "&token=" + jwt);
        const inschrijvingenData = await inschrijvingen.json();
        const inschrijving = inschrijvingenData.find(inschrijving => inschrijving.activiteit === parseInt(activityId));
        if (!inschrijving) {
            await fetch("/api/inschrijving?gebruiker=" + jwtData.id + "&activiteit=" + activityId + "&token=" + jwt, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    gebruiker: jwtData.id,
                    activiteit: activityId,
                })
            });
            loadPage();
            const notification = new Notification("Je bent ingeschreven", NotifType.SUCCESS);
            notification.show();
        }
    } else {
        const modal = new Modal([
            new TitleComponent("Vul je gegevens in"),
            new RowComponent([
                new ColumnComponent([
                    new InputFieldComponent("voornaam", "Voornaam", "Vul je voornaam in", true),
                ]),
                new ColumnComponent([
                    new InputFieldComponent("achternaam", "Achternaam", "Vul je achternaam in", true),
                ]),
            ]),
            new InputFieldComponent("email", "Email", "Vul je email in", true),
            new RowComponent([
                new ButtonComponent("Submit", submitRegistration),
                new CloseButtonComponent()
            ])
        ], "inschrijven-extern-modal");
        modal.show();
    }
}

async function submitRegistration(modal) {
    modal.hideError();
    const voornaam = document.getElementById("voornaam").value;
    const achternaam = document.getElementById("achternaam").value;
    const email = document.getElementById("email").value;
    if (voornaam && achternaam && email) {
        const res = await fetch("../api/inschrijving", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                voornaam,
                achternaam,
                email,
                activiteit: activityId,
            })
        });

        if (res.status === 409) {
            if ((await res.text()) === "You are already registered for this activity") {
                modal.error("U bent al ingeschreven voor deze activiteit.");
                return;
            } else {
                modal.error("Er bestaat een gebruiker met dit email adres, log in a.u.b.");
                return;
            }
        } else if (!res.ok) {
            modal.error(await res.text());
            return;
        }

        modal.close();
        const notification = new Notification("Check uw inbox om uw inschrijving te voltooien.");
        notification.show();
    } else {
        modal.error("Zorg dat alle velden zijn ingevult.");
    }
}

async function handleDeRegistration() {
    const res = await fetch("/api/verify?token=" + jwt);
    const jwtData = await res.json();
    if (jwtData.id) {
        const inschrijvingen = await fetch("/api/inschrijving?gebruiker=" + jwtData.id + "&token=" + jwt);
        const inschrijvingenData = await inschrijvingen.json();
        const inschrijving = inschrijvingenData.find(inschrijving => inschrijving.activiteit === parseInt(activityId));
        if (inschrijving) {
            await fetch("/api/inschrijving?gebruiker=" + jwtData.id + "&activiteit=" + activityId + "&token=" + jwt, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    gebruiker: jwtData.id,
                    activiteit: activityId,
                })
            });
            const notification = new Notification("Je bent uitgeschreven.", NotifType.SUCCESS);
            notification.show();
        }
        loadPage();
    } else {
        const modal = new Modal([
            new TitleComponent("Vul je gegevens in"),
            new InputFieldComponent("email", "Email", "Vul je email in", true),
            new RowComponent([
                new ButtonComponent("Submit", submitDeRegistration),
                new CloseButtonComponent()
            ])
        ], "inschrijven-extern-modal");
        modal.show();
    }
}

async function submitDeRegistration(modal) {
    const email = document.getElementById("email").value;
    if (email) {
        const res = await fetch("../api/inschrijving", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                activiteit: activityId,
            })
        });

        if (res.status === 409) {
            modal.error("Er bestaat een gebruiker met dit email adres, log in a.u.b.");
            return;
        } else if (res.status === 404) {
            modal.error("U bent niet ingeschreven voor deze activiteit.");
            return;
        } else if (!res.ok) {
            modal.error(await res.text());
            return;
        }

        modal.close();
        const notification = new Notification("Check uw inbox om uw uitschrijving te voltooien.");
        notification.show();
    } else {
        modal.error("Vul je email in.");
    }
}

async function loadButtons() {
    const res = await fetch("/api/verify?token=" + jwt);
    const jwtData = await res.json();
    if (jwtData.id) {
        const inschrijvingen = await fetch("/api/inschrijving?gebruiker=" + jwtData.id + "&token=" + jwt);
        const inschrijvingenData = await inschrijvingen.json();
        const inschrijving = inschrijvingenData.find(inschrijving => inschrijving.activiteit === parseInt(activityId));
        if (inschrijving) {
            document.getElementById('registerBtn').disabled = true;
            document.getElementById('unregisterBtn').disabled = false;
        } else {
            document.getElementById('unregisterBtn').disabled = true;
            document.getElementById('registerBtn').disabled = false;
        }
    }
}

async function loadPage() {
    if (!activityId) {
        showError('Geen activiteit ID opgegeven in de URL.');
        return;
    }

    await loadButtons();

    // Fetch activity data
    fetch(`/api/activiteit?id=${activityId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Activity data:', data);
            if (!data || Object.keys(data).length === 0) {
                throw new Error('Geen activiteit gevonden met dit ID.');
            }
            populateActivityData(data);
            showContent();
        })
        .catch(error => {
            console.error('Error fetching activity:', error);
            showError(error.message || 'Kon de activiteit niet laden. Probeer het later opnieuw.');
        });

    // Add event listeners for buttons
    document.getElementById('registerBtn').addEventListener('click', handleRegistration);
    document.getElementById('unregisterBtn').addEventListener('click', handleDeRegistration);

    const token = urlParams.get('token');
    if (token) {
        // Remove token from URL without page refresh
        if (window.history.replaceState) {
            const cleanUrl = window.location.pathname + window.location.search.replace(/[&?]token=[^&]+/g, '').replace(/^&/, '?');
            window.history.replaceState({}, document.title, cleanUrl);
        }

        const res = await fetch("../api/inschrijving", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                activiteit: activityId,
                token: token
            })
        });

        if (res.ok) {
            const notification = new Notification("Je bent ingeschreven.", NotifType.SUCCESS);
            notification.show();
        } else {
            const res = await fetch("../api/inschrijving", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    activiteit: activityId,
                    token: token
                })
            });

            if (res.ok) {
                const notification = new Notification("Je bent uitgeschreven.", NotifType.SUCCESS);
                notification.show();
            }
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadPage();
});