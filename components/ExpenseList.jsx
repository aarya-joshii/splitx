"use client"

import { format } from "date-fns"
import { Trash } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { useConvexQuery, useConvexMutation } from "@/hooks"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories"

const ExpenseList = ({
  expenses,
  showOtherPerson = true,
  isGroupExpense = false,
  otherPersonId = null,
  userLookupMap = {}
}) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser)
  const deleteExpense = useConvexMutation(api.expenses.deleteExpense)
  if (!expenses || !expenses.length) {
    return (
      <Card className="border-purple-300">
        <CardContent className="py-8 text-center text-muted-foreground">
          No expense found!
        </CardContent>
      </Card>
    )
  }

  const getUserDetails = (userId) => {
    return {
      name:
        userId === currentUser?._id
          ? "You"
          : userLookupMap[userId]?.name || "Other User",
      id: userId,
    }
  }

  const canDeleteExpense = (expense) => {
    if (!currentUser) return false
    return (
      expense.createdBy === currentUser._id ||
      expense.paidByUserId === currentUser._id
    )
  }

  const handleDeleteExpense = async (expense) => {
    const confirmed = window.confirm(
      "Do you want to delete this expense?"
    )
    if (!confirmed) return
    try {
      await deleteExpense.mutate({ expenseId: expense._id })
      toast.success("Expense deleted successfully.")
    } catch (error) {
      toast.error("Failed to delete expense: " + error.message)
    }
  }

  return <div className="flex flex-col gap-4">
    {expenses.map((expense) => {
      const payer = getUserDetails(expense.paidByUserId)
      const isCurrentUserPayer = expense.paidByUserId === currentUser?._id
      const category = getCategoryById(expense.category)
      const CategoryIcon = getCategoryIcon(category.id)
      const showDeleteOption = canDeleteExpense(expense)

      return (
        <Card key={expense._id} className="border-purple-300">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <CategoryIcon className="h-5 w-5 text-brand" />
                </div>

                <div>
                  <h3 className="font-medium">{expense.description}</h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <span>
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </span>
                    {showOtherPerson && (
                      <>
                        <span>💸</span>
                        <span className="text-brand font-medium text-xs">
                          {isCurrentUserPayer ? "You" : payer.name} paid
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div>
                  <div className="font-medium">
                    ₹{expense.amount.toFixed(2)}
                  </div>

                  {isGroupExpense ? (
                    <Badge className="mt-1 border-yellow-500" variant="outline">
                      Group Expense
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isCurrentUserPayer ? (
                        <span className="text-green-500">You paid</span>
                      ) : (
                        <span className="text-red-500">{payer.name} paid</span>
                      )}
                    </div>
                  )}
                </div>

                {showDeleteOption && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-red-500 hover:bg-white hover:text-red-500 hover:bg-red-100"
                    onClick={() => handleDeleteExpense(expense)}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 text-sm flex gap-2 flex-wrap">
              {expense.splits.map((split, idx) => {
                const splitUser = getUserDetails(split.userId, expense)
                const isCurrentUser = split.userId === currentUser?._id
                return (
                  <Badge
                    key={idx}
                    variant={splitUser.paid ? "outline" : "secondary"}
                    className="flex items-center gap-1 bg-white border-purple-300"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className='bg-purple-300'>
                        {splitUser.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {isCurrentUser ? "You" : splitUser.name}: ₹
                      {split.amount.toFixed(2)}
                    </span>
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )
    })}
  </div>
}

export default ExpenseList