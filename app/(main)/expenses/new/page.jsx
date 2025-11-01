"use client"

import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ExpenseForm from "./_components/ExpenseForm"

const NewExpensePage = () => {
  const router = useRouter()

  return (
    <div className="container mx-auto px-6 space-y-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl gradient-text">Split a Bill</h1>
        <p className="text-muted-foreground mt-1">Add a new expense — Track it before you forget it💸</p>
      </div>
      <Card className="border-purple-300">
        <CardContent>
          <Tabs defaultValue="individual" className="pb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Expense</TabsTrigger>
              <TabsTrigger value="group">Group Expense</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="mt-0">
              <ExpenseForm
                type="individual" 
                onSuccess={(id) => router.push(`/person/${id}`)}
              />
            </TabsContent>
            <TabsContent value="group" className="mt-0">
              <ExpenseForm 
                type="group" 
                onSuccess={(id) => router.push(`/groups/${id}`)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default NewExpensePage