"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import z from "zod"

import { api } from "@/convex/_generated/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useConvexMutation, useConvexQuery } from "@/hooks"

import { getAllCategories } from "@/lib/expense-categories"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import GroupSelector from "./GroupSelector"
import CategorySelector from "./CategorySelector"
import ParticipantSelector from "./ParticipantSelector"
import SplitSelector from "./SplitSelector"

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
})

const ExpenseForm = ({ type, onSuccess }) => {
  const [participants, setParticipants] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [splits, setSplits] = useState([])

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser)
  const createExpense = useConvexMutation(api.expenses.createExpense)
  const categories = getAllCategories()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } =
    useForm({
      resolver: zodResolver(expenseSchema),
      defaultValues: {
        description: "",
        amount: "",
        category: "",
        date: new Date(),
        paidByUserId: currentUser?._id || "",
        splitType: "equal",
        groupId: undefined,
      }
    })

  // When a user is added or removed, update the participants list
  useEffect(() => {
    if (participants.length === 0 && currentUser) {
      setParticipants([{
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        imageUrl: currentUser.imageUrl,
      }])
    }

  }, [currentUser, participants])

  const amountValue = watch("amount")
  const paidByUserId = watch("paidByUserId")

  const onSubmit = async (data) => {
    try {
      const amount = parseFloat(data.amount)

      //Format splits to match API expectation
      const formattedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        paid: split.userId === data.paidByUserId,
      }))

      //Validate that splits sum up to the total amount (with small tolerance)
      const totalSplitAmount = formattedSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      )

      const tolerance = 0.01

      if (Math.abs(totalSplitAmount - amount) > tolerance) {
        toast.error("Splits do not add up to total amount. Please adjust your splits.")
        return
      }

      const groupId = type === "individual" ? undefined : data.groupId

      //Create the expense
      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "Other",
        date: data.date.getTime(),
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId,
      })

      toast.success("Expense added successfully!")

      const otherParticipant = participants.find(
        (p) => p.id !== currentUser._id
      )
      const otherUserId = otherParticipant?.id

      onSuccess(type === "individual" ? otherUserId : groupId)
    } catch (error) {
      toast.error("Failed to add a new expense: " + error.message)
    } finally {
      //Reset the form
      reset()
    }
  }

  if (!currentUser) return null

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Goa trip scooty rental, etc."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">
                {errors.amount.message}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              categories={categories || []}
              onChange={(categoryId) => {
                if (categoryId) {
                  setValue("category", categoryId)
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setValue("date", date)
                  }}
                  className="rounded-lg border"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {type === "group" && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              onChange={(group) => {
                //Only update if the group is changed to prevent loop
                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group)
                  setValue("groupId", group.id)

                  //Update participants with group members
                  if (group.members && Array.isArray(group.members)) {
                    //Set the participants once, don't reset if they're same
                    setParticipants(group.members)
                  }
                }
              }}
            />

            {!selectedGroup && (
              <p className="text-xs text-yellow-500">Select a group to continue.</p>
            )}
          </div>
        )}

        {type === "individual" && (
          <div className="space-y-2">
            <Label>Bill Spliters</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
            />

            {participants.length <= 1 && (
              <p className="text-xs text-yellow-500">Add atleast one member.</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Paid By</Label>
          {/* <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("paidByUserId")}
          >
            <option value=""> Select who paid</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.id === currentUser._id ? "You" : participant.name}
              </option>
            ))}
          </select> */}
          <Select
            {...register("paidByUserId")}
            onValueChange={(val) => setValue("paidByUserId", val)}
            value={paidByUserId}
          >
            <SelectTrigger className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <SelectValue placeholder="Select who paid" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">Select who paid</SelectItem> */}
              {participants.map((participant) => (
                <SelectItem key={participant.id} value={participant.id}>
                  {participant.id === currentUser._id ? "You" : participant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.paidByUserId && (
            <p className="text-xs text-red-500">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Split Type</Label>
          <Tabs
            defaultValue="equal"
            onValueChange={(val) => setValue("splitType", val)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="exact">Exact Amount</TabsTrigger>
            </TabsList>
            <TabsContent value="equal" className="pt-2">
              <p className="text-sm text-muted-foreground">
                Split equally among all friends.
              </p>
              <SplitSelector
                type="equal"
                amount={parseFloat(amountValue) || 0}
                paidByUserId={paidByUserId}
                participants={participants}
                onSplitsChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="percentage" className="pt-2">
              <p className="text-sm text-muted-foreground">
                Split by percentage among all friends.
              </p>
              <SplitSelector
                type="percentage"
                amount={parseFloat(amountValue) || 0}
                paidByUserId={paidByUserId}
                participants={participants}
                onSplitsChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="exact" className="pt-2">
              <p className="text-sm text-muted-foreground">
                Enter exact amounts for each friend.
              </p>
              <SplitSelector
                type="exact"
                amount={parseFloat(amountValue) || 0}
                paidByUserId={paidByUserId}
                participants={participants}
                onSplitsChange={setSplits}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || participants.length <= 1}
          className="bg-brand border-none disabled:opacity-40 hover:bg-brand/90"
        >
          {isSubmitting ? "Adding..." : "Add Expense"}
        </Button>
      </div>
    </form>
  )
}

export default ExpenseForm