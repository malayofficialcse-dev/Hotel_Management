"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type AdminHotel } from "@/lib/api-client";
import { canPerform } from "@/lib/rbac";

export default function AdminHotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<AdminHotel | null>(null);
  const [form, setForm] = useState({ name: "", city: "", location: "", latitude: "", longitude: "", category: "", basePrice: "", description: "", isActive: true });
  const [mainImage, setMainImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notice, setNotice] = useState("");
  const canEdit = canPerform(api.getUser(), "hotels", "edit");

  useEffect(() => {
    let active = true;
    api.getAdminHotels().then((hotels) => {
      const found = hotels.find((item) => item.slug === id || item._id === id);
      if (!active) return;
      if (!found) { setNotice("This property is not present in the hotel database."); return; }
      setHotel(found);
      setForm({ name: found.name, city: found.city, location: found.location, latitude: found.latitude === undefined ? "" : String(found.latitude), longitude: found.longitude === undefined ? "" : String(found.longitude), category: found.category, basePrice: String(found.basePrice), description: found.description || "", isActive: found.isActive });
      setMainImage(found.mainImage || "");
      setGalleryImages(found.galleryImages || []);
    }).catch((error: unknown) => { if (active) setNotice(error instanceof Error ? error.message : "Could not load property details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function save() {
    if (!hotel) return;
    if (!canEdit) {
      setNotice("You do not have permission to edit hotel records.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const updated = await api.updateHotel(hotel.slug || hotel._id, {
        ...form,
        basePrice: Number(form.basePrice),
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
        mainImage,
        galleryImages,
      });
      setHotel(updated);
      setNotice("Property changes saved to the hotel database.");
    } catch (error) {
      setNotice(error instanceof Error ? `Could not save property: ${error.message}` : "Could not save property.");
    } finally { setSaving(false); }
  }

  async function uploadCover(file: File) {
    if (!canEdit) {
      setNotice("You do not have permission to edit hotel records.");
      return;
    }
    setUploadingImage(true);
    setNotice("");
    try {
      const result = await api.uploadHotelImage(file);
      setMainImage(result.url);
      setNotice("Cover image uploaded. Save changes to attach it to this property.");
    } catch (error) {
      setNotice(error instanceof Error ? `Could not upload cover image: ${error.message}` : "Could not upload cover image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadGallery(files: File[]) {
    if (!canEdit) {
      setNotice("You do not have permission to edit hotel records.");
      return;
    }
    setUploadingImage(true);
    setNotice("");
    try {
      const uploaded = await Promise.all(files.map((file) => api.uploadHotelImage(file)));
      setGalleryImages((current) => [...current, ...uploaded.map((image) => image.url)]);
      setNotice(`${uploaded.length} gallery image${uploaded.length === 1 ? "" : "s"} uploaded. Save changes to attach them.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not upload gallery images: ${error.message}` : "Could not upload gallery images.");
    } finally {
      setUploadingImage(false);
    }
  }

  const setField = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="admin-hotel-detail">
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow"><Link href="/admin/hotels">HOTELS</Link>&nbsp; / &nbsp;PROPERTY EDITOR</div><h1>{loading ? "Loading property…" : hotel?.name || "Property unavailable"}</h1><p>{hotel ? `${hotel.location} · Property database record` : ""}</p></div>
        <div className="admin-heading-actions"><Link href="/admin/hotels" className="admin-secondary-button">← All properties</Link><button type="button" className="admin-primary-button" onClick={() => void save()} disabled={!hotel || !canEdit || saving || uploadingImage}>{saving ? "Saving…" : "Save changes"}</button></div>
      </div>
      {notice && <div className="admin-inline-notice" role="status">{notice}</div>}
      {hotel && <div className="admin-hotel-detail-grid">
        <section className="admin-panel admin-hotel-editor">
          <div className="admin-hotel-cover" style={mainImage ? { backgroundImage: `url("${mainImage}")` } : undefined} />
          <div className="admin-hotel-edit-form">
            <h2>Property details</h2><p className="admin-panel-subtitle">Values are loaded from the hotel service.</p>
            <label>Property name<input value={form.name} onChange={(event) => setField("name", event.target.value)} /></label>
            <div className="admin-hotel-two-cols"><label>City<input value={form.city} onChange={(event) => setField("city", event.target.value)} /></label><label>Category<input value={form.category} onChange={(event) => setField("category", event.target.value)} /></label></div>
            <label>Address<input value={form.location} onChange={(event) => setField("location", event.target.value)} /></label>
            <div className="admin-hotel-two-cols"><label>Latitude<input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(event) => setField("latitude", event.target.value)} placeholder="e.g. 15.5170" /></label><label>Longitude<input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(event) => setField("longitude", event.target.value)} placeholder="e.g. 73.7620" /></label></div>
            <label>About this stay<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={4} /></label>
            <div className="admin-hotel-two-cols"><label>Starting price<input type="number" min="0" value={form.basePrice} onChange={(event) => setField("basePrice", event.target.value)} /></label><label>Property status<select value={form.isActive ? "active" : "inactive"} onChange={(event) => setField("isActive", event.target.value === "active")}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
            <h2 className="admin-hotel-subhead">Property images</h2>
            <label>Cover image URL<input value={mainImage} readOnly={!canEdit} onChange={(event) => setMainImage(event.target.value)} placeholder="https://res.cloudinary.com/…" /></label>
            <label>Upload cover image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!canEdit || uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadCover(file); }} /></label>
            <label>Upload gallery images<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={!canEdit || uploadingImage} onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) void uploadGallery(files); }} /></label>
            {galleryImages.length > 0 && <div className="admin-amenities">{galleryImages.map((image, index) => <span key={`${image}-${index}`}><a href={image} target="_blank" rel="noreferrer">Gallery image {index + 1}</a><button type="button" aria-label={`Remove gallery image ${index + 1}`} disabled={!canEdit} onClick={() => setGalleryImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></span>)}</div>}
            <h2 className="admin-hotel-subhead">Amenities</h2><div className="admin-amenities">{(hotel.amenities || []).map((feature) => <span key={feature}>{feature}</span>)}</div>
          </div>
        </section>
        <aside className="admin-hotel-aside"><section className="admin-panel admin-hotel-summary"><h2>Property overview</h2><div><span>Guest rating</span><strong>{hotel.rating} / 5 <small>({hotel.reviewsCount} reviews)</small></strong></div><div><span>Availability</span><strong>{hotel.isActive ? "Active" : "Inactive"}</strong></div><div><span>Category</span><strong>{hotel.category}</strong></div><div><span>Listing ID</span><strong>{hotel.slug || hotel._id}</strong></div><Link href={`/hotels/${encodeURIComponent(hotel.slug || hotel._id)}`} className="admin-secondary-button">Preview customer listing ↗</Link></section></aside>
      </div>}
    </div>
  );
}
