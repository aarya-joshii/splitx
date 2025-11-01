"use client"

import { BeatLoader } from "react-spinners"
import { ChevronRight, PlusCircle, Users } from "lucide-react"
import Link from "next/link"

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ExpenseSummary from "./_components/ExpenseSummary"
import ExpenseDetails from "./_components/ExpenseDetails"
import Groups from "./_components/Groups"

const DashboardPage = () => {
  const { data: balances, isLoading: balancesLoading } = useConvexQuery(api.dashboard.getUserBalances)
  const { data: groups, isLoading: groupsLoading } = useConvexQuery(api.dashboard.getUserGroups)
  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(api.dashboard.getTotalSpent)
  const { data: monthlySpending, isLoading: monthlySpendingLoading } = useConvexQuery(api.dashboard.getMonthlySpending)

  const isLoading = balancesLoading || groupsLoading || totalSpentLoading || monthlySpendingLoading
  return (
    <div className="container mx-auto px-6 space-y-6">
      {isLoading ?
        (<div className="flex justify-center mx-auto py-12">
          <BeatLoader color="#8200db" />
        </div>)
        : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl gradient-text md:mx-auto">Dashboard</h1>
              <Button asChild className="bg-yellow-400 hover:bg-yellow-300 border-none text-xs">
                <Link href="/expenses/new">
                  <PlusCircle className="mr-1 h-4 w-4 hidden md:flex" />
                  Add Expense
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-purple-300 gap-4">
                <CardHeader className="pb-2">
                  <CardTitle className="font-bold text-brand">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {balances.totalBalance > 0 ? (
                      <span className="text-green-500">
                        + ₹{balances.totalBalance.toFixed(2)}
                      </span>
                    ) : balances.totalBalance < 0 ? (
                      <span className="text-red-500">
                        - ₹{Math.abs(balances?.totalBalance).toFixed(2)}
                      </span>
                    ) : (
                      <span>₹0.00</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {balances?.totalBalance > 0 ? "Your share to receive" : balances?.totalBalance < 0 ? "Your share to pay" : "All settled up!"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-300 gap-4">
                <CardHeader className="pb-2">
                  <CardTitle className="font-bold text-brand">To Receive</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    ₹{balances?.amtYouAreOwed.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {balances?.oweDetails?.amtYouAreOwedBy?.length || 0} people
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-300 gap-4">
                <CardHeader className="pb-2">
                  <CardTitle className="font-bold text-brand">To Pay</CardTitle>
                </CardHeader>
                <CardContent>
                  {balances?.oweDetails?.amtYouOwe?.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-red-500">
                        ₹{balances?.amtYouOwe.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        To {balances?.oweDetails?.amtYouOwe?.length || 0} people
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ₹0.00
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        No pending payments from you
                      </p></>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ExpenseSummary
                  totalSpent={totalSpent}
                  monthlySpending={monthlySpending}
                />
              </div>
              <div className="space-y-6">
                <Card className="border-purple-300">
                  <CardHeader className="pb-3 flex items-center justify-between">
                    <CardTitle className="font-bold text-brand">Balance Details</CardTitle>
                    <Button variant="link" size="sm" asChild className="text-yellow-500">
                      <Link href="/contacts">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ExpenseDetails balances={balances} />
                  </CardContent>
                </Card>

                <Card className="border-purple-300">
                  <CardHeader className="pb-3 flex items-center justify-between">
                    <CardTitle className="font-bold text-brand">My Groups</CardTitle>
                    <Button variant="link" size="sm" asChild className="text-yellow-500">
                      <Link href="/contacts">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Groups groups={groups} />
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild className="w-full border-yellow-500 text-yellow-500 hover:text-yellow-400 hover:bg-white">
                      <Link href="/contacts?createGroup=true">
                        <Users className="mr-2 h-4 w-4" />
                        Create New Group
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </>
        )}
    </div>
  )
}

export default DashboardPage