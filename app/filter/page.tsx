import { ElectiveFilter } from "@/components/ElectiveFilter";

export default function FilterPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold font-heading mb-4">Course filter</h1>
      <ElectiveFilter />
    </main>
  );
}
