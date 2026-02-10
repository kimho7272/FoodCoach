
import * as Location from 'expo-location';

export const locationService = {
    async getCurrentLocation() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return null;
        }

        try {
            let location = await Location.getCurrentPositionAsync({});
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async getPlaceName(latitude: number, longitude: number): Promise<{ name: string | null, address: string | null }> {
        try {
            let reverseGeocoded = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            if (reverseGeocoded.length > 0) {
                const place = reverseGeocoded[0];
                let name = place.name;
                const street = place.street;
                const city = place.city;
                const region = place.region;
                const postalCode = place.postalCode;

                // Check if name is likely just a street number
                const isNumeric = name && /^\d+$/.test(name.replace(/\s/g, ''));

                let formattedAddress = '';

                // Handle Street Part
                if (street) {
                    // If name is numeric and not in street, prepend it (e.g. "412" + "Long Cove")
                    if (isNumeric && name && !street.includes(name)) {
                        formattedAddress = `${name} ${street}`;
                        name = null; // It's part of address now
                    } else {
                        formattedAddress = street;
                    }
                } else if (isNumeric && name) {
                    // No street but have string number? unlikely but safe fallback
                    formattedAddress = name;
                    name = null;
                }

                // Append City, Region, Zip
                if (city) formattedAddress += `, ${city}`;
                if (region) formattedAddress += `, ${region}`;
                if (postalCode) formattedAddress += ` ${postalCode}`;

                // If name is same as street, clear it
                if (name === street) name = null;

                return { name, address: formattedAddress.trim() };
            }
        } catch (e) {
            console.error(e);
        }
        return { name: null, address: null };
    }
};
