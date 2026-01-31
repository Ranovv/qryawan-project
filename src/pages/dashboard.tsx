import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";



export default function Dashboard() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <SectionCards />
        <ChartAreaInteractive />
        <DataTable />
      </div>
    </>
  )
}
