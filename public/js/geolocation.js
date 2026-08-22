// Only run this on pages that actually have the sighting form
// (this script loads on every page)
const latInput = document.getElementById("lat");
const lonInput = document.getElementById("lon");
const sightingForm = latInput ? latInput.closest("form") : null;

if (sightingForm && latInput && lonInput && navigator.geolocation) {
  sightingForm.addEventListener("submit", (event) => {
    // If we already grabbed coordinates, let the form submit normally
    if (latInput.value && lonInput.value) return;

    // Otherwise, pause the submit and wait for the browser's location
    // lookup to actually finish first, so we don't send an empty lat/lon
    event.preventDefault();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        latInput.value = position.coords.latitude;
        lonInput.value = position.coords.longitude;
        sightingForm.submit();
      },
      (error) => {
        // Permission denied or timed out: submit anyway, just without weather data
        console.error("Geolocation error:", error.message);
        sightingForm.submit();
      },
      { timeout: 5000 }
    );
  });
}
