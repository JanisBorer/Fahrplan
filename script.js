// ==========================================
// KONFIGURATION
// ==========================================
const DESTINATION_NAME = "Kleinlützel"; 

// ==========================================
// HAUPTLOGIK MIT CACHING
// ==========================================
function initApp() {
    const container = document.getElementById('timetable');

    // 1. Sofort gespeicherte Haltestelle laden (falls vorhanden)
    const cachedStation = localStorage.getItem('last_known_station');
    if (cachedStation) {
        fetchConnections(cachedStation);
    } else {
        container.innerHTML = `<div class="status-message">Standort wird ermittelt...</div>`;
    }

    if (!("geolocation" in navigator)) {
        if (!cachedStation) {
            container.innerHTML = `<div class="status-message">Geolocation wird nicht unterstützt.</div>`;
        }
        return;
    }

    // 2. Standort im Hintergrund abfragen (schnelle Einstellungen)
    const geoOptions = {
        enableHighAccuracy: false, // Nutzt Mobilfunk/WLAN -> blitzschnell
        timeout: 5000,            // Max. 5 Sekunden warten
        maximumAge: 300000        // Nutzt bis zu 5 Min. alte Standorte direkt
    };

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const locationUrl = `https://transport.opendata.ch/v1/locations?x=${lat}&y=${lon}&type=all`;
                const locResponse = await fetch(locationUrl);
                const locData = await locResponse.json();

                const nearestStation = locData.stations.find(s => s.id !== null);

                if (nearestStation) {
                    // Haltestelle im Browser speichern
                    localStorage.setItem('last_known_station', nearestStation.name);
                    
                    // Nur neu laden, wenn sich die Haltestelle geändert hat oder noch nichts angezeigt wird
                    if (nearestStation.name !== cachedStation) {
                        fetchConnections(nearestStation.name);
                    }
                }
            } catch (error) {
                console.error("Fehler beim Abrufen des Standorts:", error);
            }
        },
        (error) => {
            console.error("Standort-Fehler:", error.message);
            // Falls gar nichts im Cache war und GPS fehlschlägt
            if (!cachedStation) {
                container.innerHTML = `<div class="status-message">Standort konnte nicht geladen werden.</div>`;
            }
        },
        geoOptions
    );
}

async function fetchConnections(fromStation) {
    const container = document.getElementById('timetable');

    const connUrl = `https://transport.opendata.ch/v1/connections?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(DESTINATION_NAME)}&limit=5`;

    try {
        const response = await fetch(connUrl);
        const data = await response.json();

        container.innerHTML = '';

        if (!data.connections || data.connections.length === 0) {
            container.innerHTML = `<div class="status-message">Keine Verbindungen nach ${DESTINATION_NAME} gefunden.</div>`;
            return;
        }

        const header = document.querySelector('.board h2');
        if (header) {
            header.innerText = `Ab ${fromStation}`;
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

// Starten
initApp();
