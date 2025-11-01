import { v } from "convex/values";

import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server";

export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser)

    if (me._id === userId) throw new Error("Cannot get expenses between the same user")

    //Step 1: 1-to-1 expenses. Expenses paid by me to others
    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => {
        return q.eq("paidByUserId", me._id).eq("groupId", undefined)
      })
      .collect()

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => {
        return q.eq("paidByUserId", userId).eq("groupId", undefined)
      })
      .collect()

    const candidateExpenses = [...myPaid, ...theirPaid]

    //Step 2: Filter to only include expenses where BOTH users involved (payer or in splits)
    const expenses = candidateExpenses.filter((e) => {
      const meInSplits = e.splits.some((s) => s.userId === me._id)
      const themInSplits = e.splits.some((s) => s.userId === userId)

      const meInvolved = e.paidByUserId === me._id || meInSplits
      const themInvolved = e.paidByUserId === userId || themInSplits

      return meInvolved && themInvolved
    })

    expenses.sort((a, b) => b.date - a.date) //newest first

    //Step 3: Settlements between two of us (groupId = undefined)
    const settlements = await ctx.db
      .query("settlements")
      .filter(q => q.and(
        q.eq(q.field("groupId"), undefined),
        q.or(
          q.and(
            q.eq(q.field("paidByUserId"), me._id),
            q.eq(q.field("receivedByUserId"), userId),
          ),
          q.and(
            q.eq(q.field("paidByUserId"), userId),
            q.eq(q.field("receivedByUserId"), me._id),
          ),
        )
      ))
      .collect()

    settlements.sort((a, b) => b.date - a.date) //newest first

    //Step 4: Compute Running Balance
    let balance = 0
    for await (const e of expenses) {
      if (e.paidByUserId === me._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid)
        if (split) balance += split.amount //they owe me
      } else {
        const split = e.splits.find((s) => s.userId === me._id && !s.paid)
        if (split) balance -= split.amount //I owe them
      }
    }

    for (const s of settlements) {
      if (s.paidByUserId === me._id)
        balance += s.amount //I paid them, they owe me
      else
        balance -= s.amount //They paid me, I owe them
    }

    //Step 5: Return payload
    const other = await ctx.db.get(userId)
    if (!other) throw new Error("User not found")
    return {
      expenses,
      settlements,
      balance,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      }
    }
  }
})

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async(ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser)

    const expense = await ctx.db.get(args.expenseId)
    if(!expense) throw new Error("Expense not found")

    if(expense.createdBy !== user._id && expense.paidByUserId !== user._id) 
      throw new Error("You don't have permission to delete this expense")

    await ctx.db.delete(args.expenseId)
    return { success: true }
  }
})

export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"),
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },
  handler: async(ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser)

    if(args.groupId){
      const group = await ctx.db.get(args.groupId)
      if(!group){
        throw new Error("Group not found")
      }

      const isMember = group.members.some((m) => m.userId === user._id)
      if(!isMember){
        throw new Error("You are not a member of this group.")
      }
    }

    // Verify the splits add up to the total amount (with small tolerance for floating point issues)
    const totalSplitAmount = args.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    )
    const tolerance = 0.01 //Allow for small rounding errors
    if(Math.abs(totalSplitAmount - args.amount) > tolerance){
      throw new Error("Split amounts must add up to the total expense amount")
    }

    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: user._id,
    })

    return expenseId
  }
})