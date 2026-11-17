import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HotelDetailSkeleton } from "@/components/skeletons/hotel-detail-skeleton";

export default function HotelLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1296px] px-5 py-7 lg:px-0">
        <HotelDetailSkeleton />
      </main>
      <SiteFooter />
    </>
  );
}

