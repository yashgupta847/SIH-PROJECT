const socket = io();

const map = L.map("map", {
  attributionControl: false,
}).setView([0, 0], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "",
}).addTo(map);

const markers = {};
const placesList = document.getElementById("placesList");
let myLocation = null;
let routeLayer = null;
let ORS_API_KEY = null;
const myIcon = L.icon({
  iconUrl:
    "https://tse4.mm.bing.net/th/id/OIP.YtV_XVciKPnXBVBi0LLt4wHaH7?pid=Api&P=0&h=180", // your person icon path
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

const destinationIcon = L.icon({
  iconUrl:
    "https://tse4.mm.bing.net/th/id/OIP.7HksRN5FmB05z_tmIOHS-QHaHa?pid=Api&P=0&h=180", // your destination icon path
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

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

async function searchNearby(lat, lon, type) {
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
  const res = await fetch(url);
  const data = await res.json();

  if (markers["nearby"]) markers["nearby"].forEach((m) => map.removeLayer(m));
  markers["nearby"] = [];
  if (placesList) placesList.innerHTML = "";
  if (data.elements.length === 0 && placesList) {
    const li = document.createElement("li");
    li.textContent = `No ${type} found near you.`;
    li.style.fontStyle = "italic";
    placesList.appendChild(li);
    return;
  }
  data.elements.forEach((el) => {
    if (el.lat && el.lon) {
      const m = L.marker([el.lat, el.lon])
        .addTo(map)
        .bindPopup(el.tags.name || type);
      markers["nearby"].push(m);

      if (placesList) {
        const li = document.createElement("li");
        li.textContent = el.tags.name || type;
        li.addEventListener("click", () => {
          map.setView([el.lat, el.lon], 17);

          if (markers["destination"]) map.removeLayer(markers["destination"]);

          markers["destination"] = L.marker([el.lat, el.lon], {
            icon: destinationIcon,
          })
            .addTo(map)
            .bindPopup(el.tags.name || type)
            .openPopup();

          drawRoute(myLocation, { lat: el.lat, lng: el.lon });
        });
        placesList.appendChild(li);
      }
    }
  });
}

async function drawRoute(from, to) {
  if (!from || !to || !ORS_API_KEY) return;

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
  const res = await fetch(url);
  const data = await res.json();

  if (routeLayer) map.removeLayer(routeLayer);

  const coords = data.features[0].geometry.coordinates.map((c) => [c[1], c[0]]);
  routeLayer = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
  map.fitBounds(routeLayer.getBounds());
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      myLocation = { lat: latitude, lng: longitude };

      map.setView([latitude, longitude], 15);
      if (!markers["me"]) {
        markers["me"] = L.marker([latitude, longitude], { icon: myIcon })
          .addTo(map)
          .bindPopup("You are here");
      } else {
        markers["me"].setLatLng([latitude, longitude]);
      }

      socket.emit("send-location", { latitude, longitude });
    },
    (error) => console.log(error),
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

document.getElementById("searchDropdown").addEventListener("change", () => {
  const type = document.getElementById("searchDropdown").value;

  if (myLocation) searchNearby(myLocation.lat, myLocation.lng, type);
  else alert("Still fetching your location. Please wait a moment.");
});
