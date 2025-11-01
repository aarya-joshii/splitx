import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const ExpenseSummary = ({ totalSpent, monthlySpending }) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const chartData = monthlySpending?.map(item => {
    const date = new Date(item.month)
    return {
      name: monthNames[date.getMonth()],
      amount: item.total,
    }
  }) || []

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-bold text-brand">Expense Summary</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">Track how much you’ve spent month by month.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Your Monthly Total</p>
            <h3 className="text-2xl font-bold mt-1">
              ₹{monthlySpending?.[currentMonth]?.total.toFixed(2) || '0.00'}
            </h3>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Your Yearly Total</p>
            <h3 className="text-2xl font-bold mt-1">
              ₹{totalSpent?.toFixed(2) || '0.00'}
            </h3>
          </div>
        </div>
        <div className="h-64 mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                labelFormatter={() => "Your Expenses"}
                labelStyle={{ color: '#a1a1a1' }}
              />
              <Bar dataKey="amount" fill="#b424ceb3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Monthly spending for {currentYear}
        </p>
      </CardContent>
    </Card>
  )
}

export default ExpenseSummary