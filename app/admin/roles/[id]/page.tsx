import { AdminRecordDetail } from "@/components/admin/admin-record-detail";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminRecordDetail kind="roles" id={id} />;
}
