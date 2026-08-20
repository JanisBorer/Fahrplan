// ==========================================
// KONFIGURATION
// ==========================================
const TARGET_DESTINATION = "Kleinlützel";

// ==========================================
// STANDORT-ABFRAGE & VERBINDUNGEN
// ==========================================
function fetchLocationBased() {
    const container = document.getElementById('timetable');

    if (!("geolocation" in navigator)) {
        container.innerHTML = `<div class="status-message">Geolocation wird von deinem Browser nicht unterstützt.</div>`;
        return;
    }

    container.innerHTML = `<div class="status-message">Ermittle aktuellen Standort...</div>`;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                // Nächstgelegene Haltestelle über Koordinaten finden
                const locationUrl = `https://transport.opendata.ch/v1/locations?x=${lat}&y=${lon}&type=all`;
                const locResponse = await fetch(locationUrl);
                const locData = await locResponse.json();

                const nearestStation = locData.stations.find(s => s.id !== null);

                if (!nearestStation) {
                    container.innerHTML = `<div class="status-message">Keine Haltestelle in der Nähe gefunden.</div>`;
                    return;
                }

                // Verbindungen nach Kleinlützel abrufen
                fetchConnectionsToKleinlutzel(nearestStation.name);

            } catch (error) {
                console.error("Fehler beim Abrufen des Standorts:", error);
                container.innerHTML = `<div class="status-message">Fehler bei der Standortsuche.</div>`;
            }
        },
        (error) => {
            console.error("Standort-Fehler:", error.message);
            container.innerHTML = `<div class="status-message">Standort konnte nicht ermittelt werden. Bitte Zugriff im Browser erlauben.</div>`;
        },
        { enableHighAccuracy: false, timeout: 8000 }
    );
}

async function fetchConnectionsToKleinlutzel(fromStation) {
    const container = document.getElementById('timetable');
    const header = document.querySelector('.board h2');

    if (header) {
        header.innerText = `Ab ${fromStation}`;
    }

    container.innerHTML = `<div class="status-message">Suche Verbindungen nach ${TARGET_DESTINATION}...</div>`;

    const connUrl = `https://transport.opendata.ch/v1/connections?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(TARGET_DESTINATION)}&limit=5`;

    try {
        const response = await fetch(connUrl);
        const data = await response.json();

        container.innerHTML = '';

        if (!data.connections || data.connections.length === 0) {
            container.innerHTML = `<div class="status-message">Keine Verbindungen nach ${TARGET_DESTINATION} gefunden.</div>`;
            return;
        }

        data.connections.forEach(conn => {
            const departureTime = conn.from.departure.split('T')[1].substring(0, 5);
            const arrivalTime = conn.to.arrival.split('T')[1].substring(0, 5);
            
            const firstSection = conn.sections[0];
            const line = firstSection && firstSection.journey 
                ? `${firstSection.journey.category}${firstSection.journey.number || ''}` 
                : 'Zug/Bus';

            const destination = conn.to.station.name;

            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `
                <span class="line">${line}</span>
                <span class="destination">nach ${destination} (${arrivalTime})</span>
                <span class="time">${departureTime}</span>
            `;
            container.appendChild(row);
        });

    } catch (error) {
        console.error('Fehler beim Laden der Verbindungen:', error);
        container.innerHTML = `<div class="status-message">Fehler beim Laden der Verbindungen.</div>`;
    }
}

// Beim Aufrufen der Seite direkt den Standort abfragen
fetchLocationBased();
