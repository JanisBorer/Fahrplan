// ==========================================
// KONFIGURATION
// ==========================================
const DEFAULT_STATION = "Kleinlützel, Frohmatt";
const ALLOWED_DESTINATIONS = ["Laufen", "Nunningen", "Breitenbach", "Erschwil", "Beinwil", "Büsserach"];
const LIMIT = 40; 

// ==========================================
// 1. STANDARD: Abfahrten ab Kleinlützel
// ==========================================
async function loadDefaultBoard() {
    const container = document.getElementById('timetable');
    const header = document.querySelector('.board h2');
    
    if (header) {
        header.innerText = `Ab ${DEFAULT_STATION}`;
    }

    // WICHTIG: Keine Einschränkung auf "to" in der URL, damit alle Richtungen von der API geliefert werden
    const apiUrl = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(DEFAULT_STATION)}&limit=${LIMIT}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        container.innerHTML = '';

        if (!data.stationboard || data.stationboard.length === 0) {
            container.innerHTML = `<div class="status-message">Keine Abfahrten gefunden.</div>`;
            return;
        }

        // Gefiltert wird erst hier im Code für alle gewünschten Zielorte
        const filteredDepartures = data.stationboard.filter(item => {
            if (!item.to) return false;
            const dest = item.to.toLowerCase();
            return ALLOWED_DESTINATIONS.some(target => dest.includes(target.toLowerCase()));
        });

        if (filteredDepartures.length === 0) {
            container.innerHTML = `<div class="status-message">Keine passenden Abfahrten gefunden.</div>`;
            return;
        }

        filteredDepartures.slice(0, 5).forEach(item => {
            const departureTime = item.stop.departure.split('T')[1].substring(0, 5);
            const line = item.category + item.number;
            const destination = item.to;

            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `
                <span class="line">${line}</span>
                <span class="destination">nach ${destination}</span>
                <span class="time">${departureTime}</span>
            `;
            container.appendChild(row);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Fahrplandaten:', error);
        container.innerHTML = `<div class="status-message">Fehler beim Laden der Daten.</div>`;
    }
}

// ==========================================
// 2. STANDORT: Erst bei Button-Klick ausführen
// ==========================================
function fetchLocationBased() {
    const container = document.getElementById('timetable');

    if (!("geolocation" in navigator)) {
        alert("Geolocation wird von deinem Browser nicht unterstützt.");
        return;
    }

    container.innerHTML = `<div class="status-message">Ermittle Standort...</div>`;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const locationUrl = `https://transport.opendata.ch/v1/locations?x=${lat}&y=${lon}&type=all`;
                const locResponse = await fetch(locationUrl);
                const locData = await locResponse.json();

                const nearestStation = locData.stations.find(s => s.id !== null);

                if (!nearestStation) {
                    container.innerHTML = `<div class="status-message">Keine Haltestelle in der Nähe gefunden.</div>`;
                    return;
                }

                fetchConnectionsToKleinlutzel(nearestStation.name);

            } catch (error) {
                console.error("Fehler beim Abrufen des Standorts:", error);
                container.innerHTML = `<div class="status-message">Fehler bei der Standortsuche.</div>`;
            }
        },
        (error) => {
            console.error("Standort-Fehler:", error.message);
            alert("Standort konnte nicht ermittelt werden. Bitte Zugriff erlauben.");
            loadDefaultBoard();
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

    container.innerHTML = `<div class="status-message">Suche Verbindungen nach Kleinlützel...</div>`;

    const connUrl = `https://transport.opendata.ch/v1/connections?from=${encodeURIComponent(fromStation)}&to=Kleinlützel&limit=5`;

    try {
        const response = await fetch(connUrl);
        const data = await response.json();

        container.innerHTML = '';

        if (!data.connections || data.connections.length === 0) {
            container.innerHTML = `<div class="status-message">Keine Verbindungen nach Kleinlützel gefunden.</div>`;
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

// Beim Aufruf sofort die Standardabfahrten laden
loadDefaultBoard();