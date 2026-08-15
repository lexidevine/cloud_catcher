if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
    },
    (error) => {
      console.error("Geolocation error:", error.message);
    }
  );
} else {
  console.error("Geolocation is not supported by this browser.");
}
