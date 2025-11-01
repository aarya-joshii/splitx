"use client"

import { useState } from "react"
import { BeatLoader } from "react-spinners"
import { ArrowLeft, ArrowLeftRight, PlusCircle, Users } from "lucide-react"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ExpenseList from "@/components/ExpenseList"
import GroupBalances from "@/components/GroupBalances"
import GroupMembers from "@/components/GroupMembers"
import SettlementsList from "@/components/SettlementsList"

const GroupPage = () => {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("expenses")

  const { data, isLoading } = useConvexQuery(
    api.groups.getGroupExpenses,
    { groupId: params.id }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto py-12">
        <BeatLoader color="#8200db" />
      </div>
    )
  }

  const group = data?.group
  const members = data?.members || []
  const expenses = data?.expenses || []
  const settlements = data?.settlements || []
  const balances = data?.balances || []
  const userLookupMap = data?.userLookupMap || {}

  return (
    <div className="container mx-auto px-6 space-y-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className='text-brand hover:text-yellow-500 hover:bg-white-100 hover:border-yellow-500 transition mb-4'
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-md border-text-brand">
              <Users className="h-8 w-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl gradient-text">{group?.name}</h1>
              <p className="text-muted-foreground">{group?.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {members.length} members
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild
              variant="outline"
              className="text-brand hover:text-yellow-500 hover:bg-white-100 hover:border-yellow-500 transition"
            >
              <Link href={`/settlements/group/${params.id}`}>
                <ArrowLeftRight className="mr-1 h-4 w-4" />
                Settle Up
              </Link>
            </Button>
            <Button asChild className="bg-yellow-400 hover:bg-yellow-300 border-none text-xs">
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-1 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="border-purple-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-brand">Group Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupBalances balances={balances} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-purple-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-brand">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupMembers members={members} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="settlement">Settlements ({settlements.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={true}
            isGroupExpense={true}
            userLookupMap={userLookupMap}
          />
        </TabsContent>
        <TabsContent value="settlement" className="space-y-4">
          <SettlementsList
            settlements={settlements}
            isGroupSettlement={true}
            userLookupMap={userLookupMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GroupPage