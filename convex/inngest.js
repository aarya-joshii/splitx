import { v } from "convex/values";
import { query } from "./_generated/server";

/********  Get users with pending payments  ********/
export const getUsersWithOutstandingDebts = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    const result = []

    // Load every 1-to-1 expense once (groupId === undefined)
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .collect()

    // Load every 1-to-1 settlements once (groupId === undefined)
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .collect()

    const userCache = new Map()
    const getUser = async (id) => {
      if (!userCache.has(id)) {
        userCache.set(id, await ctx.db.get(id))
      }
      return userCache.get(id)
    }

    for (const user of users) {
      // Map <counterpartyId, { amount:number, since:number }>
      // +amount => if user owns counterparty
      // -amount => if counterparty owes user
      const ledger = new Map()

      for (const exp of expenses) {
        // Case 1: Someone else paid the expense and, user appears in splits
        if (exp.paidByUserId !== user._id) {
          const split = exp.splits.find(
            (s) => s.userId === user._id && !s.paid
          )
          if (!split) continue;

          const entry = ledger.get(exp.paidByUserId) ?? {
            amount: 0,
            since: exp.date,
          }
          entry.amount += split.amount //user owes 
          entry.since = Math.min(entry.since, exp.date)
          ledger.set(exp.paidByUserId, entry)
        } else {
          // Case 2: User paid the expense and, others appear in splits
          for (const s of exp.splits) {
            if (s.userId === user._id || s.paid) continue

            const entry = ledger.get(s.userId) ?? {
              amount: 0,
              since: exp.date, // will be ignored while amount <= 0
            }
            entry.amount -= s.amount //others owe user
            ledger.set(s.userId, entry)
          }
        }
      }

      for (const st of settlements) {
        // Case 1: User paid someone -> reduce positive amt owed to that user
        if (st.paidByUserId === user._id) {
          const entry = ledger.get(st.receivedByUserId)
          if (entry) {
            entry.amount -= st.amount
            if (entry.amount === 0) ledger.delete(st.receivedByUserId)
            else ledger.set(st.receivedByUserId, entry)
          }
        } // Case 2: Someone paid the user -> reduce negative balance (they owed user)
        else if (st.receivedByUserId === user._id) {
          const entry = ledger.get(st.paidByUserId)
          if (entry) {
            entry.amount += st.amount // entry.amount is negative
            if (entry.amount === 0) ledger.delete(st.paidByUserId)
            else ledger.set(st.paidByUserId, entry)
          }
        }
      }

      const debts = []
      for (const [counterId, { amount, since }] of ledger) {
        if (amount > 0) {
          const counter = await getUser(counterId)
          debts.push({
            userId: counterId,
            name: counter?.name ?? "Unknown",
            amount,
            since,
          })
        }
      }

      console.log(user.name, debts);

      if (debts.length) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          debts,
        })
      }
    }

    return result
  }
})

/********  Get users with expenses for Monthly AI insights  ********/
export const getUsersWithExpenses = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    const result = []

    //Get current month start
    const now = new Date()
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(now.getMonth() - 1)
    const monthStart = oneMonthAgo.getTime()

    for (const user of users) {
      const paidExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .filter((q) => q.eq(q.field("paidByUserId"), user._id))
        .collect()

      // Check all expenses to find ones where user is in splits
      const allRecentExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .collect()

      const splitExpenses = allRecentExpenses.filter((expense) =>
        expense.splits.some((split) => split.userId === user._id)
      )

      // Combine both paid and split expenses removing duplicates
      const userExpenses = [...new Set([...paidExpenses, ...splitExpenses])]

      // If user has any expenses in last month, add to result
      if (userExpenses.length > 0) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
        })
      }
    }

    return result
  }
})
export const getUserMonthlyExpenses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    //Get current month start
    const now = new Date()
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(now.getMonth() - 1)
    const monthStart = oneMonthAgo.getTime()

    //Get all expenses where user is involved (paid or in splits)
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", monthStart))
      .collect()
    const userExpenses = allExpenses.filter((expense) =>
      expense.paidByUserId === args.userId ||
      expense.splits.some((split) => split.userId === args.userId)
    )

    // Format expenses for AI analysis
    return userExpenses.map((expense) => {
      // Get user's share in the expense
      const userSplit = expense.splits.find(
        (s) => s.userId === args.userId
      )
      return {
        description: expense.description,
        category: expense.category,
        date: expense.date,
        amount: userSplit ? userSplit.amount : 0,
        isPayer: expense.paidByUserId === args.userId,
        isGroupExpense: !!expense.groupId,
      }
    })
  }
})
