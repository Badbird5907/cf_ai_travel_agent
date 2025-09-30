import { Card } from "./ui/card"

interface CostBreakdownProps {
  hotelsTotal: number
  activitiesTotal: number
  mealsTotal: number
  flightCost: number
  total: number
}

export function CostBreakdown({
  hotelsTotal,
  activitiesTotal,
  mealsTotal,
  flightCost,
  total
}: CostBreakdownProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Cost Breakdown</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm">Flights</span>
          <span className="text-sm font-medium">${flightCost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Hotels</span>
          <span className="text-sm font-medium">${hotelsTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Activities</span>
          <span className="text-sm font-medium">${activitiesTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Meals (estimated)</span>
          <span className="text-sm font-medium">${mealsTotal.toLocaleString()}</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  )
}
