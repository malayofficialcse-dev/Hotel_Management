import Link from "next/link";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SaveHotelButton } from "@/components/save-hotel-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { formatPrice, roomTypes } from "@/lib/data";

const gallery = [
  "/assets/figma/cb71f.png",
  "/assets/figma/8daf8.png",
  "/assets/figma/0918c.png",
  "/assets/figma/a6293.png",
  "/assets/figma/2a8e0.png",
];

export default function HotelDetailsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1296px] px-5 py-7 lg:px-0">
        <p className="mb-4 text-[11px] text-muted">
          <Link href="/" className="hover:text-forest">Explore</Link> / Goa / Candolim / The Palm House
        </p>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-[4px] bg-mint px-2 py-1 text-[9px] font-semibold">BOUTIQUE BEACH RETREAT</span>
            <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.7px] sm:text-[34px]">The Palm House, Goa</h1>
            <p className="mt-1 text-xs text-muted">Candolim Beach Road, North Goa, India · 350 m from the beach</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><FigmaIcon name="share" className="h-4 w-4" /> Share</Button>
            <SaveHotelButton hotelId="palm-house" />
          </div>
        </div>

        <div className="grid h-[250px] gap-2 overflow-hidden rounded-[4px] sm:h-[340px] sm:grid-cols-[1.45fr_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[0]} alt="The Palm House pool and gardens" className="h-full w-full object-cover" />
          <div className="hidden grid-cols-2 grid-rows-2 gap-2 sm:grid">
            {gallery.slice(1).map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`The Palm House room and grounds ${index + 1}`} className="h-full w-full object-cover" />
            ))}
          </div>
        </div>

        <nav className="mt-5 flex gap-6 overflow-x-auto border-b border-line text-[11px]">
          {["Overview", "Rooms", "Facilities", "Reviews", "Location", "Policies"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="whitespace-nowrap border-b-2 border-transparent pb-3 text-muted hover:border-forest hover:text-forest">{item}</a>
          ))}
        </nav>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            <section id="overview" className="grid gap-5 md:grid-cols-[1fr_230px]">
              <div>
                <h2 className="text-xl font-semibold">Slow days. Salt in the air.</h2>
                <p className="mt-3 max-w-[750px] text-xs leading-5 text-muted">
                  Tucked between swaying palms and the shores of Candolim, The Palm House is your invitation to take it easy. Think sunlit rooms, a palm-ringed pool and long breakfasts made with local ingredients. Wander down to the beach, find your favourite café, or do absolutely nothing.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                  {["350 m to beach", "Breakfast included", "Locally inspired"].map((label) => (
                    <span key={label} className="rounded-[4px] bg-mist px-3 py-2">{label}</span>
                  ))}
                </div>
                <h3 className="mt-5 text-sm font-semibold">Everything you need to unwind</h3>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-[10px] text-muted">
                  {[
                    ["wifi", "Wi-Fi"],
                    ["wallet", "Outdoor pool"],
                    ["coffee", "Restaurant"],
                    ["support", "Spa"],
                    ["car", "Free parking"],
                    ["plane", "Airport transfer"],
                  ].map(([icon, text]) => (
                    <span key={text} className="flex items-center gap-1.5"><FigmaIcon name={icon as "wifi"} className="h-3.5 w-3.5" />{text}</span>
                  ))}
                </div>
              </div>
              <Surface className="h-fit bg-mint p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold">4.8</span>
                  <span className="text-right text-[10px]">Exceptional<br /><span className="text-muted">324 verified reviews</span></span>
                </div>
                <p className="mt-2 text-xs tracking-[2px] text-forest">★★★★★</p>
                <p className="mt-3 border-t border-[#cfe4d8] pt-3 text-[10px] text-muted">Your stay, your escape, from</p>
                <p className="mt-1 text-lg font-semibold">{formatPrice(4000)} <span className="text-[10px] font-normal text-muted">/ night + taxes</span></p>
                <Button href="/booking/room" className="mt-3 w-full">Choose your room</Button>
                <p className="mt-2 text-[9px] text-muted">Free cancellation on select rooms</p>
              </Surface>
            </section>

            <section id="rooms">
              <PageHeading title="Find your kind of comfort" description="Five ways to make it yours. Every room comes with a little Goa sunshine." />
              <div className="mt-4 space-y-3">
                {roomTypes.map((room) => (
                  <Surface key={room.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={room.image} alt={room.name} className="h-[96px] w-full rounded-[4px] object-cover sm:w-[140px]" />
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold">{room.name}</h3>
                      <p className="mt-1 text-[10px] text-muted">{room.beds}</p>
                      <p className="mt-1 text-[10px] text-muted">{room.detail}</p>
                      <p className="mt-1 text-[10px] text-forest">{room.inclusions}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatPrice(room.price)}</p>
                        <p className="text-[9px] text-muted">per night + taxes</p>
                      </div>
                      <Button href="/booking/room" variant="outline" className="min-h-8 px-3">Select room</Button>
                    </div>
                  </Surface>
                ))}
              </div>
            </section>

            <section id="facilities" className="grid gap-4 md:grid-cols-2">
              <Surface className="bg-butter p-4">
                <h2 className="text-sm font-semibold">A stay guests come back for</h2>
                <p className="mt-3 text-lg font-semibold">4.8 / 5 <span className="text-xs font-normal text-muted"> · 324 reviews</span></p>
                <p className="mt-3 text-xs leading-5 text-muted">A relaxed resort-style hideaway, beautiful rooms, a genuinely warm team, and the beach just a short stroll away. We’re already planning our return.</p>
                <p className="mt-3 text-[10px] text-muted">Ananya S. · Bengaluru · Stayed October 2026</p>
                <a id="reviews" href="#reviews" className="mt-3 inline-block text-[10px] font-semibold text-forest">Read all reviews →</a>
              </Surface>
              <Surface id="location" className="bg-sky p-4">
                <h2 className="text-sm font-semibold">A good place to get lost</h2>
                <p className="mt-3 text-xs text-muted">Candolim, North Goa</p>
                <p className="mt-2 text-xs leading-5">Candolim Beach · 350 m<br />Fort Aguada · 2.5 km<br />Manohar International Airport · 31 km</p>
                <p className="mt-3 text-[10px] text-forest">View location on map →</p>
              </Surface>
            </section>
            <Surface id="policies" className="p-4">
              <h2 className="text-sm font-semibold">A few things to know</h2>
              <div className="mt-4 grid gap-5 text-[10px] text-muted sm:grid-cols-3">
                <p><strong className="block text-ink">Check-in &amp; check-out</strong><br />Check-in from 2:00 PM<br />Check-out by 11:00 AM</p>
                <p><strong className="block text-ink">Cancellation policy</strong><br />Free cancellation before 15 Dec, 2:00 PM. After this, the first night is charged.</p>
                <p><strong className="block text-ink">House rules</strong><br />Children of all ages welcome. No smoking inside rooms. Pets are not permitted.</p>
              </div>
            </Surface>
          </div>
          <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
