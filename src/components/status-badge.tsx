import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ShipmentStatus = "Pending" | "In Transit" | "Delivered"

const statusStyles: Record<ShipmentStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  "In Transit": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  Delivered: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status as ShipmentStatus] ?? "bg-gray-100 text-gray-700 border-gray-200"
  return (
    <Badge className={cn("font-medium", style)}>
      {status}
    </Badge>
  )
}
