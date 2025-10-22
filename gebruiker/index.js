const jwt = sessionStorage.getItem("JWT");
let userId = null;
let userEnrollments = [];
let activities = [];
const MAX_DESCRIPTION_LENGTH = 160;

document.addEventListener("DOMContentLoaded", async () => {
    initializePage();
});

async function initializePage(filter) {
    if (event && event.target && event.target.classList) {
        if (event.target.classList.contains("selected")) {
            return;
        }

        document.querySelector(".selected").classList.remove("selected");
        event.target.classList.add("selected");
    }
    const res = await fetch("/api/verify?token=" + jwt);
    const jwtData = await res.json();

    if (jwtData.id) {
        userId = jwtData.id;
        const enrollmentsRes = await fetch(`/api/inschrijving?gebruiker=${userId}&token=${jwt}`);
        userEnrollments = await enrollmentsRes.json() || [];

        document.querySelectorAll(".logged-in").forEach(section => section.style.display = "block");
    } else {
        document.querySelectorAll(".logged-in").forEach(section => section.style.display = "none");
    }

    const activitiesRes = await fetch('/api/activiteit');
    activities = await activitiesRes.json();
    activities = activities.filter(activity => new Date(activity.begin) > Date.now())
    if (filter === "beschikbaar") {
        activities = activities.filter(activity => !userEnrollments.some(e => e.activiteit === activity.id));
    } else if (filter === "ingeschreven") {
        activities = activities.filter(activity => userEnrollments.some(e => e.activiteit === activity.id));
    }

    // Sort activities by begin date (earliest first)
    activities.sort((a, b) => new Date(a.begin) - new Date(b.begin));

    renderActivities()
}

function renderActivities() {
    const container = document.getElementById("availableActivities");
    container.innerHTML = '';

    if (activities.length === 0) {
        container.innerHTML = '<p class="no-activities">Geen activiteiten gevonden</p>';
        return;
    }

    activities.forEach(activity => {
        const eventElement = document.createElement('div');
        eventElement.classList.add('event');

        const beginDate = new Date(activity.begin);
        const endDate = new Date(activity.eind);

        // Get the first image (sorted by order)
        let afbeelding;
        if (activity.afbeeldingen[0] != null) {
            // Sort images and get the first one
            const sortedImages = [...activity.afbeeldingen].sort((a, b) => {
                const orderA = a.sortOrder !== null && a.sortOrder !== undefined ? a.sortOrder : 999;
                const orderB = b.sortOrder !== null && b.sortOrder !== undefined ? b.sortOrder : 999;
                return orderA - orderB;
            });
            afbeelding = '<img src="' + sortedImages[0].afbeeldingUrl + '" alt="Afbeelding van activiteit" class="afbeeldingImg">';
        } else {
            afbeelding = '<img src="https://covadis.nl/wp-content/themes/id/resource/image/header/1.svg" alt="Afbeelding" class="afbeeldingImg placeholder">';
        }

        eventElement.innerHTML = `
                    <div class="event-info">
                        <div class="image-container">
                            ${afbeelding}
                        </div>
                        <div class="event-details">
                            <h2 class="event-title">${escapeHtml(activity.naam)}</h2>
                            <h3 class="location">${escapeHtml(activity.locatie)}</h3>
                            <p class="date">Begin: ${beginDate.toLocaleString('nl-NL')}</p>
                            <p class="date">Einde: ${endDate.toLocaleString('nl-NL')}</p>
                            ${activity.omschrijving ? `<p class="description">${escapeHtml(truncateText(activity.omschrijving, MAX_DESCRIPTION_LENGTH))}</p>` : ''}
                        </div>
                    </div>
                    <div class="icons">
                        <a href="activiteit/${activity.id}" class="btn">Info</a>
                        ${userEnrollments.some(e => e.activiteit === activity.id) ? `<p class="enrolled"><i class="fas fa-check-circle"></i>Ingeschreven</p>` : ``}
                    </div>
                `;

        container.appendChild(eventElement);
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
}