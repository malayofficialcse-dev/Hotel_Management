"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { hotels } from "@/lib/data";

export default function AdminHotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hotel = hotels.find((item) => item.id === id) ?? hotels[0];
  return (
    <div className="admin-hotel-detail">
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow"><Link href="/admin/hotels">HOTELS</Link>&nbsp; / &nbsp;PROPERTY EDITOR</div><h1>{hotel.name}</h1><p>{hotel.location} · Portfolio property</p></div>
        <div className="admin-heading-actions"><Link href="/admin/hotels" className="admin-secondary-button">← All properties</Link><button type="button" className="admin-primary-button" onClick={() => window.alert("Property changes saved.")}>Save changes</button></div>
      </div>
      <div className="admin-hotel-detail-grid">
        <section className="admin-panel admin-hotel-editor">
          <div className="admin-hotel-cover" style={{ backgroundImage: `url("${hotel.image}")` }} />
          <div className="admin-hotel-edit-form">
            <h2>Property details</h2><p className="admin-panel-subtitle">Keep your property information accurate and welcoming.</p>
            <label>Property name<input defaultValue={hotel.name} /></label>
            <div className="admin-hotel-two-cols"><label>City<input defaultValue={hotel.city} /></label><label>Category<select defaultValue={hotel.category}><option>{hotel.category}</option><option>Boutique hotels</option><option>Beach resorts</option><option>Heritage stays</option></select></label></div>
            <label>Address<input defaultValue={hotel.location} /></label>
            <label>About this stay<textarea defaultValue={`${hotel.tag}. Thoughtful hospitality, beautiful surroundings, and the little details that make a stay memorable.`} rows={4} /></label>
            <div className="admin-hotel-two-cols"><label>Starting price<input defaultValue={`₹${hotel.price.toLocaleString("en-IN")}`} /></label><label>Property status<select defaultValue="Active"><option>Active</option><option>Draft</option><option>Paused</option></select></label></div>
            <h2 className="admin-hotel-subhead">Amenities</h2><div className="admin-amenities">{hotel.features.map((feature) => <label key={feature}><input type="checkbox" defaultChecked />{feature}</label>)}</div>
          </div>
        </section>
        <aside className="admin-hotel-aside">
          <section className="admin-panel admin-hotel-summary"><h2>Property overview</h2><div><span>Guest rating</span><strong>★ {hotel.rating} <small>({hotel.reviews} reviews)</small></strong></div><div><span>Availability</span><strong>Active</strong></div><div><span>Category</span><strong>{hotel.category}</strong></div><div><span>Listing ID</span><strong>HT-{hotel.id.toUpperCase()}</strong></div><button type="button" className="admin-secondary-button">Preview customer listing ↗</button></section>
          <section className="admin-panel admin-hotel-summary"><h2>Reservations</h2><div><span>Upcoming</span><strong>18 stays</strong></div><div><span>Arrivals today</span><strong>06 guests</strong></div><div><span>Occupancy today</span><strong>78%</strong></div><Link className="admin-mini-link" href="/admin/reservations">Manage reservations →</Link></section>
        </aside>
      </div>
    </div>
  );
}

