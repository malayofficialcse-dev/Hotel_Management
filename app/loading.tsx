import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TotalPageSkeleton } from "@/components/skeletons/home-page-skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader active="explore" />
      <TotalPageSkeleton />
      <SiteFooter />
    </>
  );
}
