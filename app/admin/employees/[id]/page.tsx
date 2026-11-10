import { AdminRecordDetail } from "@/components/admin/admin-record-detail";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminRecordDetail kind="employees" id={id} />;
}
