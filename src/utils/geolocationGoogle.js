const axios = require('axios');

async function cityNameFromUserLocation(res, latitude, longitude) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const geocodeUrl = `${process.env.GOOGLE_MAPS_GEOCODE_URL}?latlng=${latitude},${longitude}&key=${apiKey}`;

    try {
        const response = await axios.get(geocodeUrl);
        const data = response.data;

        if (data.status === "OK") {
            const results = data.results;
            const cityComponent = results[0].address_components.find(component =>
                component.types.includes("locality")
            );

            if (cityComponent) {
                const city = cityComponent.long_name;
                return city;
            } else {
                res.status(404).json({ error: "City not found in the response" });
            }
        } else {
            res.status(400).json({ error: "Geocoding error", status: data.status });
        }
    } catch (error) {
        console.error("Geocoding fetch error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    cityNameFromUserLocation
};
