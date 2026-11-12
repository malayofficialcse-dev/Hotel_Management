"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type AdminHotel } from "@/lib/api-client";

export default function AdminHotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<AdminHotel | null>(null);
  const [form, setForm] = useState({ name: "", city: "", location: "", category: "", basePrice: "", description: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    api.getAdminHotels().then((hotels) => {
      const found = hotels.find((item) => item.slug === id || item._id === id);
      if (!active) return;
      if (!found) { setNotice("This property is not present in the hotel database."); return; }
      setHotel(found);
      setForm({ name: found.name, city: found.city, location: found.location, category: found.category, basePrice: String(found.basePrice), description: found.description || "", isActive: found.isActive });
    }).catch((error: unknown) => { if (active) setNotice(error instanceof Error ? error.message : "Could not load property details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function save() {
    if (!hotel) return;
    setSaving(true);
    setNotice("");
    try {
      const updated = await api.updateHotel(hotel.slug || hotel._id, { ...form, basePrice: Number(form.basePrice) });
      setHotel(updated);
      setNotice("Property changes saved to the hotel database.");
    } catch (error) {
      setNotice(error instanceof Error ? `Could not save property: ${error.message}` : "Could not save property.");
    } finally { setSaving(false); }
  }

  const setField = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="admin-hotel-detail">
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow"><Link href="/admin/hotels">HOTELS</Link>&nbsp; / &nbsp;PROPERTY EDITOR</div><h1>{loading ? "Loading property…" : hotel?.name || "Property unavailable"}</h1><p>{hotel ? `${hotel.location} · Property database record` : ""}</p></div>
        <div className="admin-heading-actions"><Link href="/admin/hotels" className="admin-secondary-button">← All properties</Link><button type="button" className="admin-primary-button" onClick={() => void save()} disabled={!hotel || saving}>{saving ? "Saving…" : "Save changes"}</button></div>
      </div>
      {notice && <div className="admin-inline-notice" role="status">{notice}</div>}
      {hotel && <div className="admin-hotel-detail-grid">
        <section className="admin-panel admin-hotel-editor">
          <div className="admin-hotel-cover" style={hotel.mainImage ? { backgroundImage: `url("${hotel.mainImage}")` } : undefined} />
          <div className="admin-hotel-edit-form">
            <h2>Property details</h2><p className="admin-panel-subtitle">Values are loaded from the hotel service.</p>
            <label>Property name<input value={form.name} onChange={(event) => setField("name", event.target.value)} /></label>
            <div className="admin-hotel-two-cols"><label>City<input value={form.city} onChange={(event) => setField("city", event.target.value)} /></label><label>Category<input value={form.category} onChange={(event) => setField("category", event.target.value)} /></label></div>
            <label>Address<input value={form.location} onChange={(event) => setField("location", event.target.value)} /></label>
            <label>About this stay<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={4} /></label>
            <div className="admin-hotel-two-cols"><label>Starting price<input type="number" min="0" value={form.basePrice} onChange={(event) => setField("basePrice", event.target.value)} /></label><label>Property status<select value={form.isActive ? "active" : "inactive"} onChange={(event) => setField("isActive", event.target.value === "active")}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
            <h2 className="admin-hotel-subhead">Amenities</h2><div className="admin-amenities">{(hotel.amenities || []).map((feature) => <span key={feature}>{feature}</span>)}</div>
          </div>
        </section>
        <aside className="admin-hotel-aside"><section className="admin-panel admin-hotel-summary"><h2>Property overview</h2><div><span>Guest rating</span><strong>{hotel.rating} / 5 <small>({hotel.reviewsCount} reviews)</small></strong></div><div><span>Availability</span><strong>{hotel.isActive ? "Active" : "Inactive"}</strong></div><div><span>Category</span><strong>{hotel.category}</strong></div><div><span>Listing ID</span><strong>{hotel.slug || hotel._id}</strong></div><Link href={`/hotels/${encodeURIComponent(hotel.slug || hotel._id)}`} className="admin-secondary-button">Preview customer listing ↗</Link></section></aside>
      </div>}
    </div>
  );
}
