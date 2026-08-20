// ==========================================
// KONFIGURATION
// ==========================================
const DESTINATION_NAME = "Kleinlützel"; 

// ==========================================
// HAUPTLOGIK
// ==========================================
function initApp() {
    const container = document.getElementById('timetable');

    if (!("geolocation" in navigator)) {
        container.innerHTML = `<div class="status-message">Geolocation wird nicht unterstützt.</div>`;
        return;
    }

    container.innerHTML = `<div class="status-message">Standort wird ermittelt...</div>`;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                // 1. Nächstgelegene Haltestelle über Koordinaten finden
                const locationUrl = `https://transport.opendata.ch/v1/locations?x=${lat}&y=${lon}&type=all`;
                const locResponse = await fetch(locationUrl);
                const locData = await locResponse.json();

                // Ersten gültigen Stopp filtern
                const nearestStation = locData.stations.find(s => s.id !== null);

                if (!nearestStation) {
                    container.innerHTML = `<div class="status-message">Keine Haltestelle in der Nähe gefunden.</div>`;
                    return;
                }

                console.log(`Nächste Haltestelle: ${nearestStation.name}`);

                // 2. Verbindungen von der Start-Haltestelle nach Kleinlützel abfragen
                fetchConnections(nearestStation.name);

            } catch (error) {
                console.error("Fehler beim Abrufen des Standorts:", error);
                container.innerHTML = `<div class="status-message">Fehler bei der Standortsuche.</div>`;
            }
        },
        (error) => {
            console.error("Standortzugriff abgelehnt:", error.message);
            container.innerHTML = `<div class="status-message">Standortzugriff erforderlich.</div>`;
        }
    );
}

async function fetchConnections(fromStation) {
    const container = document.getElementById('timetable');
    container.innerHTML = `<div class="status-message">Suche Verbindungen ab ${fromStation}...</div>`;

    const connUrl = `https://transport.opendata.ch/v1/connections?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(DESTINATION_NAME)}&limit=5`;

    try {
        const response = await fetch(connUrl);
        const data = await response.json();

        container.innerHTML = '';

        if (!data.connections || data.connections.length === 0) {
            container.innerHTML = `<div class="status-message">Keine Verbindungen nach ${DESTINATION_NAME} gefunden.</div>`;
            return;
        }

        // Titelelement anpassen/anzeigen, von wo gesucht wird
        const header = document.querySelector('.board h2');
        if (header) {
            header.innerText = `Ab ${fromStation}`;
        }

        // Verbindungen auflisten
        data.connections.forEach(conn => {
            const departureTime = conn.from.departure.split('T')[1].substring(0, 5);
            const arrivalTime = conn.to.arrival.split('T')[1].substring(0, 5);
            
            // Erstes Verkehrsmittel der Route holen (z.B. B 112 oder IR 56)
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

// Starten
initApp();
