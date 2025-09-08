const socket = io();
const map = L.map("map", {
  attributionControl: false,
}).setView([0, 0], 30);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "",
}).addTo(map);

// state
const markers = {
  nearby: [],
  nearbyCircles: [],
  me: null,
  destination: null,
};
const placesList = document.getElementById("placesList");
let myLocation = null;
let routeLayer = null;
let ORS_API_KEY = null;
const debugPins = false; // set true while debugging coords

// icons
const myIcon = L.icon({
  iconUrl:
    "https://tse4.mm.bing.net/th/id/OIP.YtV_XVciKPnXBVBi0LLt4wHaH7?pid=Api&P=0&h=180",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});
const destinationIcon = L.icon({
  iconUrl:
    "https://tse4.mm.bing.net/th/id/OIP.7HksRN5FmB05z_tmIOHS-QHaHa?pid=Api&P=0&h=180",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

const infoBtn = document.getElementById("infoBtn");
const infoBox = document.getElementById("infoBox");
const closeInfo = document.getElementById("closeInfo");

infoBtn.addEventListener("click", () => {
  infoBox.classList.toggle("hidden");
});

closeInfo.addEventListener("click", () => {
  infoBox.classList.add("hidden");
});

// Optional: click outside to close
document.addEventListener("click", (e) => {
  if (!infoBox.contains(e.target) && e.target !== infoBtn) {
    infoBox.classList.add("hidden");
  }
});

// fetch ORS key (if used)
async function fetchORSKey() {
  try {
    const res = await fetch("/api/ors-key");
    const data = await res.json();
    ORS_API_KEY = data.key;
  } catch (err) {
    console.error("Failed to fetch ORS key:", err);
  }
}
fetchORSKey();

// helpers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getElementCoords(el) {
  if (!el) return null;
  if (el.lat && el.lon) return { lat: el.lat, lon: el.lon };
  if (el.center && el.center.lat && el.center.lon)
    return { lat: el.center.lat, lon: el.center.lon };
  if (Array.isArray(el.geometry) && el.geometry.length) {
    const g = el.geometry[0];
    if (g.lat && g.lon) return { lat: g.lat, lon: g.lon };
  }
  return null;
}

function safeRemoveLayer(item) {
  if (!item) return;
  try {
    if (Array.isArray(item)) {
      item.forEach((l) => {
        if (l && map.hasLayer && map.hasLayer(l)) map.removeLayer(l);
      });
    } else {
      if (map.hasLayer && map.hasLayer(item)) map.removeLayer(item);
    }
  } catch (e) {
    // ignore removal errors
  }
}

function clearNearbyMarkers() {
  safeRemoveLayer(markers.nearby);
  markers.nearby = [];

  safeRemoveLayer(markers.nearbyCircles);
  markers.nearbyCircles = [];

  safeRemoveLayer(markers.destination);
  markers.destination = null;

  if (routeLayer) {
    safeRemoveLayer(routeLayer);
    routeLayer = null;
  }

  if (placesList) placesList.innerHTML = "";
}

// searchNearby (Overpass)
async function searchNearby(lat, lon, type) {
  if (!lat || !lon) return;
  let queryFilter = "";
  switch (type) {
    case "restaurant":
      queryFilter = "amenity=restaurant";
      break;
    case "cafe":
      queryFilter = "amenity=cafe";
      break;
    case "fuel":
      queryFilter = "amenity=fuel";
      break;
    case "hospital":
      queryFilter = "amenity=hospital";
      break;
    case "school":
      queryFilter = "amenity=school";
      break;
    case "college":
      queryFilter = "amenity=college";
      break;
    case "hostel":
      queryFilter = "tourism=hostel";
      break;
    case "atm":
      queryFilter = "amenity=atm";
      break;
    default:
      queryFilter = `name~"${type}"`;
  }

  const query = `[out:json]; node(around:2000, ${lat}, ${lon})[${queryFilter}]; out;`;
  const url =
    "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    console.error("Overpass fetch failed:", err);
    clearNearbyMarkers();
    if (placesList) {
      const li = document.createElement("li");
      li.textContent = "Error fetching places. Check console.";
      li.style.fontStyle = "italic";
      placesList.appendChild(li);
    }
    return;
  }

  clearNearbyMarkers();

  if (!data || !Array.isArray(data.elements) || data.elements.length === 0) {
    if (placesList) {
      const li = document.createElement("li");
      li.textContent = `No ${type} found near you.`;
      li.style.fontStyle = "italic";
      placesList.appendChild(li);
    }
    return;
  }

  const elementsWithCoords = data.elements
    .map((el) => {
      const coords = getElementCoords(el);
      if (!coords) return null;
      return { ...el, _lat: coords.lat, _lon: coords.lon };
    })
    .filter(Boolean);

  if (elementsWithCoords.length === 0) {
    if (placesList) {
      const li = document.createElement("li");
      li.textContent = `No valid coordinate results for ${type}.`;
      li.style.fontStyle = "italic";
      placesList.appendChild(li);
    }
    return;
  }

  // distance + sort
  elementsWithCoords.forEach((el) => {
    el.distance = getDistanceFromLatLonInKm(lat, lon, el._lat, el._lon);
  });
  elementsWithCoords.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  if (debugPins)
    console.log("searchNearby results:", elementsWithCoords.slice(0, 10));

  elementsWithCoords.forEach((el) => {
    const elLat = el._lat;
    const elLon = el._lon;
    const name = (el.tags && (el.tags.name || el.tags["name:en"])) || type;

    const marker = L.marker([elLat, elLon]).addTo(map);
    markers.nearby.push(marker);

    let popupHtml = `<strong>${name}</strong>`;
    popupHtml += `<br/><small>ID: ${el.id} • type: ${
      el.type || "node"
    }</small>`;
    popupHtml += `<br/>Coords: ${elLat.toFixed(6)}, ${elLon.toFixed(6)}`;
    if (typeof el.distance === "number")
      popupHtml += `<br/>Distance: ${el.distance.toFixed(2)} km`;
    marker.bindPopup(popupHtml);

    if (placesList) {
      const li = document.createElement("li");
      li.style.padding = "10px";
      li.style.cursor = "pointer";

      const title = document.createElement("strong");
      title.textContent = name;
      li.appendChild(title);

      if (typeof el.distance === "number") {
        const distP = document.createElement("p");
        distP.textContent = `📏 ${el.distance.toFixed(2)} km away`;
        li.appendChild(distP);
      }

      li.addEventListener("click", () => {
        map.setView([elLat, elLon], 17);
        safeRemoveLayer(markers.destination);
        markers.destination = L.marker([elLat, elLon], {
          icon: destinationIcon,
        })
          .addTo(map)
          .bindPopup(name)
          .openPopup();

        drawRoute(myLocation, { lat: elLat, lng: elLon });
      });

      placesList.appendChild(li);
    }
  });
}

// drawRoute (ORS)
async function drawRoute(from, to) {
  if (!from || !to || !ORS_API_KEY) return;
  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data || !data.features || !data.features[0]) return;

    if (routeLayer) {
      safeRemoveLayer(routeLayer);
      routeLayer = null;
    }

    const coords = data.features[0].geometry.coordinates.map((c) => [
      c[1],
      c[0],
    ]);
    routeLayer = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
    map.fitBounds(routeLayer.getBounds());
  } catch (e) {
    console.error("drawRoute error:", e);
  }
}
function showNotification(message, type = "error") {
  const box = document.getElementById("notification");
  if (!box) return;

  box.textContent = message;
  box.className = `notification ${type}`;
  box.classList.remove("hidden");

  // Auto-hide after 4s
  setTimeout(() => {
    box.classList.add("hidden");
  }, 4000);
}

// geolocation
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      myLocation = { lat: latitude, lng: longitude, accuracy };

      map.setView([latitude, longitude], 15);
      if (markers.me) {
        markers.me.setLatLng([latitude, longitude]);
      } else {
        markers.me = L.marker([latitude, longitude], { icon: myIcon })
          .addTo(map)
          .bindPopup("You are here");
      }

      showNotification("✅ Location detected successfully!", "success");
      socket.emit("send-location", { latitude, longitude, accuracy });
    },
    (error) => {
      console.log(error);
      if (error.code === 1) {
        showNotification(
          "⚠️ Location access denied. Please enable GPS!",
          "warning"
        );
      } else if (error.code === 2) {
        showNotification("❌ Location unavailable. Try again.", "error");
      } else if (error.code === 3) {
        showNotification("⏰ Location request timed out.", "error");
      } else {
        showNotification("❌ Unknown geolocation error.", "error");
      }
    },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

// search dropdown
document.getElementById("searchDropdown").addEventListener("change", () => {
  const type = document.getElementById("searchDropdown").value;
  if (myLocation) searchNearby(myLocation.lat, myLocation.lng, type);
  else alert("Still fetching your location. Please wait a moment.");
});
