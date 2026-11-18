"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Hotel } from "@/lib/data";
import { formatPrice } from "@/lib/data";

declare global {
  interface Window { L?: any; }
}

const cityCoordinates: Record<string, [number, number]> = {
  goa: [15.4909, 73.8278], jaipur: [26.9124, 75.7873], udaipur: [24.5854, 73.7125],
  mumbai: [18.922, 72.8347], chennai: [13.0827, 80.2707], kerala: [9.9312, 76.2673],
  coorg: [12.3375, 75.8069], bengaluru: [12.9716, 77.5946], bangalore: [12.9716, 77.5946],
  kumarakom: [9.6174, 76.4302], shimla: [31.1048, 77.1734], jodhpur: [26.2389, 73.0243],
  munnar: [10.0889, 77.0595], kolkata: [22.5726, 88.3639],
  varanasi: [25.3176, 82.9739], delhi: [28.6139, 77.209],
};

function coordinatesFor(hotel: Hotel): [number, number] | null {
  const { latitude, longitude } = hotel;
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) return [latitude, longitude];
  const cityPoint = cityCoordinates[hotel.city.trim().toLowerCase()];
  if (cityPoint) return cityPoint;
  return null;
}

function distanceInKm(from: [number, number], to: [number, number]) {
  const radians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDistance = radians(to[0] - from[0]);
  const longitudeDistance = radians(to[1] - from[1]);
  const a = Math.sin(latitudeDistance / 2) ** 2 + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(longitudeDistance / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hotelTooltipContent(hotel: Hotel, otherStays: number) {
  const card = document.createElement("div");
  card.className = "stayease-map-tooltip-content";

  const image = document.createElement("img");
  image.src = hotel.image || "/assets/figma/a0108.png";
  image.alt = "";
  image.loading = "lazy";
  card.appendChild(image);

  const details = document.createElement("div");
  details.className = "stayease-map-tooltip-details";

  const name = document.createElement("p");
  name.className = "stayease-map-tooltip-name";
  name.textContent = hotel.name;
  details.appendChild(name);

  const city = document.createElement("p");
  city.className = "stayease-map-tooltip-city";
  city.textContent = otherStays ? `${hotel.city} · ${otherStays + 1} stays here` : hotel.city;
  details.appendChild(city);

  const price = document.createElement("p");
  price.className = "stayease-map-tooltip-price";
  price.textContent = `From ${formatPrice(hotel.price)} per night`;
  details.appendChild(price);

  card.appendChild(details);
  return card;
}

export function HotelDiscoveryMap({ hotels }: { hotels: Hotel[] }) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);
  const userLayer = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());
  const selectedIdRef = useRef<string | null>(hotels[0]?.id || null);
  const [selectedId, setSelectedId] = useState<string | null>(hotels[0]?.id || null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const mappedHotels = useMemo(() => hotels.map((hotel) => ({ hotel, coordinates: coordinatesFor(hotel) })).filter((item): item is { hotel: Hotel; coordinates: [number, number] } => item.coordinates !== null), [hotels]);
  const mappedGroups = useMemo(() => {
    const groups = new Map<string, (typeof mappedHotels)[number][]>();
    mappedHotels.forEach((item) => {
      const key = item.coordinates.join(",");
      const group = groups.get(key);
      if (group) group.push(item);
      else groups.set(key, [item]);
    });
    return Array.from(groups, ([key, stays]) => ({ key, stays, coordinates: stays[0].coordinates }));
  }, [mappedHotels]);
  const selected = mappedHotels.find(({ hotel }) => hotel.id === selectedId)?.hotel || mappedHotels[0]?.hotel;

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!mapElement.current || map.current) return;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const start = () => {
      if (!mapElement.current || !window.L || map.current) return;
      map.current = window.L.map(mapElement.current, { scrollWheelZoom: false }).setView([22.5, 79], 4.5);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map.current);
      setMapReady(true);
    };
    if (window.L) start();
    else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = start;
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    }
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !window.L) return;
    layer.current?.clearLayers();
    layer.current = window.L.layerGroup().addTo(map.current);
    markers.current.clear();
    const points: [number, number][] = [];
    mappedGroups.forEach(({ key, stays, coordinates }) => {
      points.push(coordinates);
      const lowestPrice = Math.min(...stays.map(({ hotel }) => hotel.price));
      const priceLabel = stays.length > 1
        ? `${stays.length} stays · ${formatPrice(lowestPrice)}+`
        : formatPrice(stays[0].hotel.price);
      const iconWidth = Math.max(74, Math.ceil(priceLabel.length * 7 + 20));
      const marker = window.L.marker(coordinates, {
        icon: window.L.divIcon({
          className: "stayease-price-pin",
          html: `<span>${priceLabel}</span>`,
          iconSize: [iconWidth, 34],
          iconAnchor: [iconWidth / 2, 34],
        }),
      }).addTo(layer.current);
      marker.bindTooltip(hotelTooltipContent(stays[0].hotel, stays.length - 1), {
        direction: "top",
        offset: [0, -18],
        className: "stayease-map-tooltip",
      });
      marker.on("click", () => {
        const selectedIndex = stays.findIndex(({ hotel }) => hotel.id === selectedIdRef.current);
        const nextStay = stays[(selectedIndex + 1) % stays.length];
        selectedIdRef.current = nextStay.hotel.id;
        marker.setTooltipContent(hotelTooltipContent(nextStay.hotel, stays.length - 1));
        setSelectedId(nextStay.hotel.id);
      });
      markers.current.set(key, marker);
    });
    if (points.length > 1) map.current.fitBounds(points, { padding: [32, 32], maxZoom: 12 });
    else if (points[0]) map.current.setView(points[0], 12);
  }, [mappedGroups, mapReady]);

  useEffect(() => {
    markers.current.forEach((marker, key) => {
      const group = mappedGroups.find((item) => item.key === key);
      marker.getElement()?.classList.toggle("is-selected", Boolean(group?.stays.some(({ hotel }) => hotel.id === selected?.id)));
    });
  }, [selected, mappedGroups, mapReady]);

  useEffect(() => {
    if (!map.current || !window.L || !userLocation) return;
    userLayer.current?.remove();
    userLayer.current = window.L.circleMarker(userLocation, { radius: 9, color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 })
      .bindTooltip("Your location", { direction: "top" })
      .addTo(map.current);
  }, [userLocation, mapReady]);

  useEffect(() => {
    const point = selected && coordinatesFor(selected);
    if (point && map.current) map.current.flyTo(point, Math.max(map.current.getZoom(), 12), { duration: 0.45 });
  }, [selected]);

  function locateGuest() {
    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location search.");
      return;
    }
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point: [number, number] = [coords.latitude, coords.longitude];
        const nearest = mappedHotels.reduce((closest, item) => !closest || distanceInKm(point, item.coordinates) < distanceInKm(point, closest.coordinates) ? item : closest, undefined as typeof mappedHotels[number] | undefined);
        setUserLocation(point);
        if (nearest) setSelectedId(nearest.hotel.id);
        map.current?.flyTo(point, 10, { duration: 0.6 });
        setLocationMessage(nearest ? `${nearest.hotel.name} is the nearest mapped stay.` : "Your location is shown on the map.");
      },
      () => setLocationMessage("Location access was not granted. You can still select any hotel pin."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function resetMap() {
    const points = mappedHotels.map((item) => item.coordinates);
    if (points.length > 1) map.current?.fitBounds(points, { padding: [32, 32], maxZoom: 12 });
    else if (points[0]) map.current?.setView(points[0], 12);
    setLocationMessage("");
  }

  if (!hotels.length) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7e1] bg-white" aria-label="Hotels on map">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div><h3 className="text-sm font-semibold text-[#263b31]">Explore on a map</h3><p className="mt-1 text-[10px] text-[#78847c]">Pins group stays at the same location. Select repeatedly to compare them.</p></div>
        <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={locateGuest} className="rounded-full border border-[#dfe5dd] px-3 py-1.5 text-[10px] font-semibold text-[#385a49] hover:bg-[#f4f7f3]">Use my location</button><button type="button" onClick={resetMap} className="rounded-full border border-[#dfe5dd] px-3 py-1.5 text-[10px] font-semibold text-[#385a49] hover:bg-[#f4f7f3]">Reset map</button><span className="rounded-full bg-[#edf3ee] px-3 py-1.5 text-[10px] font-medium text-[#496b59]">{mappedHotels.length} mapped stays</span></div>
      </div>
      <div ref={mapElement} className="relative h-[380px] w-full bg-[#e8eee8]">
        {mapError && <p className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#f4f7f3] px-6 text-center text-xs font-medium text-[#385a49]" role="status">The map service is temporarily unavailable. Hotel details are still available below.</p>}
        {!mappedHotels.length && !mapError && <p className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#f4f7f3] px-6 text-center text-xs font-medium text-[#385a49]" role="status">Map locations are not available for these stays yet.</p>}
      </div>
      {locationMessage && <p className="border-t border-[#edf0eb] px-4 py-2 text-[10px] font-medium text-[#385a49]" role="status">{locationMessage}</p>}
      {selected && <div className="flex flex-col gap-3 border-t border-[#edf0eb] p-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selected.image || "/assets/figma/a0108.png"} alt="" className="h-16 w-full rounded-lg object-cover sm:w-24" />
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#263b31]">{selected.name}</p><p className="mt-1 truncate text-[10px] text-[#78847c]">{selected.location}</p><p className="mt-1 text-[11px] font-semibold text-[#385a49]">From {formatPrice(selected.price)} per night{userLocation ? ` · ${distanceInKm(userLocation, coordinatesFor(selected)!).toFixed(1)} km away` : ""}</p></div>
        <div className="flex gap-2"><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${coordinatesFor(selected)![0]},${coordinatesFor(selected)![1]}`)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#dfe5dd] px-3 py-2.5 text-center text-[10px] font-semibold text-[#385a49] hover:bg-[#f4f7f3]">Directions</a><Link href={`/hotels/${encodeURIComponent(selected.id)}`} className="rounded-lg bg-[#244b3e] px-4 py-2.5 text-center text-[10px] font-semibold text-white hover:bg-[#193c32]">View hotel & rooms</Link></div>
      </div>}
    </section>
  );
}
