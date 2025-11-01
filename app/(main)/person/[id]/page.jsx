"use client"

import { useState } from "react"
import { BeatLoader } from "react-spinners"
import { ArrowLeft, PlusCircle, ArrowLeftRight } from "lucide-react"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import ExpenseList from "@/components/ExpenseList"
import SettlementsList from "@/components/SettlementsList"

const PersonPage = () => {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("expenses")

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto py-12">
        <BeatLoader color="#8200db" />
      </div>
    )
  }

  const expenses = data?.expenses || []
  const settlements = data?.settlements || []
  const balance = data?.balance || 0
  const otherUser = data?.otherUser || null

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
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.imageUrl} />
              <AvatarFallback>
                {otherUser?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl gradient-text">{otherUser?.name}</h1>
              <p className="text-muted-foreground">{otherUser?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild 
              variant="outline"
              className="text-brand hover:text-yellow-500 hover:bg-white-100 hover:border-yellow-500 transition"
            >
              <Link href={`/settlements/user/${params.id}`}>
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
      <Card className="mb-6 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {balance === 0 ? (
                <p>You're all settled up!</p>
              ) : balance > 0 ? (
                 <p><span className="font-medium">{otherUser?.name}</span> owes you</p>
                 ) : (
                 <p>You owe <span className="font-medium">{otherUser?.name}</span></p>
                 )}
            </div>
            <div 
              className={`text-2xl font-bold ${balance > 0 ? "text-green-500" : balance < 0 ? "text-red-500" : ""}`}
            >
              ₹{Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
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
            showOtherPerson={false}
            otherPersonId={params.id}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
        <TabsContent value="settlement" className="space-y-4">
          <SettlementsList
            settlements={settlements}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PersonPage