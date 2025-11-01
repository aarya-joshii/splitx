import { internal } from "./_generated/api";
import { query } from "./_generated/server";

// Get user balances
export const getUserBalances = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser)
    // 1-to-1 expenses (no groupId)
    // where the current user is either the payer or in the splits
    // we can filter the expenses in two ways, either using .filter() or .withIndex()
    const expenses = (await ctx.db.query("expenses").collect())
      .filter(
        (e) =>
          !e.groupId &&  // 1-to-1 only
          (e.paidByUserId === user._id ||
            e.splits.some((s) => s.userId === user._id)
          )
      )

    let amtYouOwe = 0  //Total amount user owes others
    let amtYouAreOwed = 0  //Total amount others owe the user
    const balanceByUser = {}  //Detailed breakdown per user

    for (const e of expenses) {
      const isPayer = e.paidByUserId === user._id
      const mySplit = e.splits.find((s) => s.userId === user._id)

      if (isPayer) {
        for (const s of e.splits) {
          //Skip user's own split or already paid splits
          if (s.userId === user._id || s.paid) continue;

          //Add to amount owed to the user
          amtYouAreOwed += s.amount;
          (balanceByUser[s.userId] ??= { owed: 0, owing: 0 }).owed += s.amount;
        }
      } else if (mySplit && !mySplit.paid) {
        //Someone else paid and user hasn't paid their split
        amtYouOwe += mySplit.amount;
        (balanceByUser[e.paidByUserId] ??= { owed: 0, owing: 0 }).owing +=
          mySplit.amount;
      }
    }
    // 1-to-1 settltements (no groupId)
    // Get settlements that directly involve the current user
    const settlements = (await ctx.db.query("settlements").collect())
      .filter(
        (s) =>
          !s.groupId &&
          (s.paidByUserId === user._id || s.receivedByUserId === user._id)
      )

    for (const s of settlements) {
      if (s.paidByUserId === user._id) {
        //User paid someone else -> reduce what user owes
        amtYouOwe -= s.amount;
        (balanceByUser[s.receivedByUserId] ??= { owed: 0, owing: 0 }).owing -= s.amount;
      } else {
        //Someone paid the user -> reduce what they owe to user 
        amtYouAreOwed -= s.amount;
        (balanceByUser[s.paidByUserId] ??= { owed: 0, owing: 0 }).owed -= s.amount;
      }
    }

    /**  Build list for UI  **/
    const amtYouOweList = []  //List of people user owes money to
    const amtYouAreOwedByList = []  //List of people who owe money to the user

    for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
      const net = owed - owing  // Calculate net balance
      if (net === 0) continue;  // Skip if balanced

      // Get user details
      const counterpart = await ctx.db.get(uid)
      const base = {
        userId: uid,
        name: counterpart?.name ?? "Unknown",
        imageUrl: counterpart?.imageUrl,
        amount: Math.abs(net),
      }

      net > 0 ? amtYouAreOwedByList.push(base) : amtYouOweList.push(base)
    }

    //Sort list with amount highest first
    amtYouOweList.sort((a, b) => b.amount - a.amount)
    amtYouAreOwedByList.sort((a, b) => b.amount - a.amount)

    return {
      amtYouOwe,
      amtYouAreOwed,
      totalBalance: amtYouAreOwed - amtYouOwe,  // Net balance
      oweDetails: { amtYouOwe: amtYouOweList, amtYouAreOwedBy: amtYouAreOwedByList }  // Detailed List 
    }
  }
})

// Get Yearly spent
export const getTotalSpent = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser)

    // Get current year and its start timestamp
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1).getTime()

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", startOfYear))
      .collect()

    // Filter expenses to only include those where the user is involved
    const userExpenses = expenses.filter(
      (expense) =>
        expense.paidByUserId === user._id ||
        expense.splits.some((split) => split.userId === user._id)
    )

    let totalSpent = 0
    userExpenses.forEach((expense) => {
      const userSplit = expense.splits.find(
        split => split.userId === user._id
      )

      if (userSplit) {
        totalSpent += userSplit.amount
      }
    })

    return totalSpent
  }
})

// Get Monthly spending
export const getMonthlySpending = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser)

    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1).getTime()

    // Get all expenses for current year
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", startOfYear))
      .collect()

    // Filter expenses to only include those where the user is involved
    const userExpenses = allExpenses.filter(
      (expense) =>
        expense.paidByUserId === user._id ||
        expense.splits.some((split) => split.userId === user._id)
    )

    let monthlyTotals = {}

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, i, 1)
      monthlyTotals[monthDate.getTime()] = 0
    }

    userExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const monthStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ).getTime()

      const userSplit = expense.splits.find(
        (split) => split.userId === user._id
      )

      if (userSplit) {
        monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + userSplit.amount
      }
    })

    const result = Object.entries(monthlyTotals).map(([month, total]) => ({
      month: parseInt(month),
      total
    }))

    // Sort by month (in chronological order)
    result.sort((a, b) => a.month - b.month)
    return result
  }
})

// Get group balances
export const getUserGroups = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser)

    // Get all groups from the database
    const allGroups = await ctx.db.query("groups").collect()

    // Filter groups where user is a member
    const groups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === user._id)
    )

    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        // Get all expenses for this group
        const expenses = await ctx.db
          .query("expenses")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect()

        let balance = 0

        // Calculate balance from expenses
        expenses.forEach((expense) => {
          if (expense.paidByUserId === user._id) {
            // User paid for the expense - others may owe them
            expense.splits.forEach((split) => {
              // Add amount others owe to the user (excluding user's own split and paid splits)
              if (split.userId !== user._id && !split.paid) {
                balance += split.amount
              }
            })
          } else {
            // Someone else paid - user may owe them
            const userSplit = expense.splits.find(
              (split) => split.userId === user._id
            )

            // Substract amounts the user owes others
            if (userSplit && !userSplit.paid) {
              balance -= userSplit.amount
            }
          }
        })

        // Apply settlements to adjust the balance
        const settlements = await ctx.db
          .query("settlements")
          .filter((q) =>
            q.and(
              q.eq(q.field("groupId"), group._id),
              q.or(
                q.eq(q.field("paidByUserId"), user._id),
                q.eq(q.field("receivedByUserId"), user._id)
              )
            )
          )
          .collect()

        settlements.forEach((settlement) => {
          if (settlement.paidByUserId === user._id) {
            // User paid someone in the group - increases user's balance
            balance += settlement.amount
          } else {
            // Someone paid the user - decreases user's balance
            balance -= settlement.amount
          }
        })
        return {
          ...group,
          id: group._id,
          balance,
        }
      })
    )

    return enhancedGroups
  }
})