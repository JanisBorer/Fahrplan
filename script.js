// ==========================================
// KONFIGURATION
// ==========================================
const STATION_NAME = "Kleinlützel, Frohmatt"; 
const ALLOWED_DESTINATIONS = ["Laufen", "Nunningen", "Breitenbach"]; 
const LIMIT = 40; 

const API_URL = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(STATION_NAME)}&limit=${LIMIT}`;

// ==========================================
// STANDORT-ABFRAGE (GEOLOCATION)
// ==========================================
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`Dein Standort: ${lat}, ${lon}`);
        },
        (error) => {
            console.error("Standortzugriff abgelehnt oder Fehler:", error.message);
        }
    );
}

// ==========================================
// FAHRPLAN-LOGIK
// ==========================================
async function updateBoard() {
    const container = document.getElementById('timetable');

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        container.innerHTML = '';

        const filteredDepartures = data.stationboard.filter(item => {
            if (!item.to) return false;
            const dest = item.to.toLowerCase();
            return ALLOWED_DESTINATIONS.some(target => dest.includes(target.toLowerCase()));
        });

        if (filteredDepartures.length === 0) {
            container.innerHTML = `<div class="status-message">Keine Abfahrten Richtung Laufen gefunden.</div>`;
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
                <span class="destination">${destination}</span>
                <span class="time">${departureTime}</span>
            `;
            container.appendChild(row);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Fahrplandaten:', error);
        container.innerHTML = `<div class="status-message">Fehler beim Laden der Daten.</div>`;
    }
}

updateBoard();
setInterval(updateBoard, 30000);
