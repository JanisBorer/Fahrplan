if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`Standort: ${lat}, ${lon}`);
        },
        (error) => {
            console.error("Standortzugriff abgelehnt oder Fehler:", error.message);
        }
    );
} else {
    console.log("Geolocation wird nicht unterstützt.");
}
