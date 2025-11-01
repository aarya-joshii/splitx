import { v } from "convex/values";

import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getGroupExpenses = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser)

    const group = await ctx.db.get(groupId)
    if (!group) throw new Error("Group not found!")

    if (!group.members.some((m) => m.userId === currentUser._id))
      throw new Error("You're not a member of this group.")

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect()

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId", groupId)))
      .collect()

    /* **********  Member Map  ********** */
    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId)
        return {
          id: u._id,
          name: u.name,
          imageUrl: u.imageUrl,
          role: m.role,
        }
      })
    )

    const ids = memberDetails.map((m) => m.id)

    /* **********  Balance Calculation Setup  ********** */

    //Initialize 'totals' object to track overall balance for each user
    //Format: { userId1: balance1, userId2: balance2, ... }
    const totals = Object.fromEntries(ids.map((id) => [id, 0]))

    //Create 2D ledger to track who owes whom
    //Format: ledger = { 
    //            userId1: { userId2: 0, userId3: 0 },
    //            userId2: { userId1: 0, userId3: 0 },
    //            userId3: { userId1: 0, userId2: 0 },
    //         }
    const ledger = {}
    ids.forEach((a) => {
      ledger[a] = {}
      ids.forEach((b) => {
        if (a !== b) ledger[a][b] = 0
      })
    })

    // Apply Expenses to Balances
    for (const exp of expenses) {
      const payer = exp.paidByUserId

      for (const split of exp.splits) {
        //skip if user is the payer or already paid
        if (split.userId === payer || split.paid) continue;

        const debtor = split.userId
        const amt = split.amount

        //Update totals - increase payer's balance, decrease debtor's balance
        totals[payer] += amt
        totals[debtor] -= amt

        ledger[debtor][payer] += amt
      }
    }

    // Apply Settlements to Balances
    for (const s of settlements) {
      //Update totals - increase payer's balance, decrease receiver's balance
      totals[s.paidByUserId] -= s.amount
      totals[s.receivedByUserId] += s.amount

      //Update ledger - reduce what the payer owes to the receiver
      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount
    }

    // Simplify the ledger to minimize transactions
    // Example with a circular debt:
    //  - A owes B ₹10 
    //  - B owes C ₹15
    //  - C owes A ₹5
    // - After simplification:
    //  - A owes B ₹5
    //  - B owes C ₹15
    //  - C owes A ₹0
    //  This reduces the circular debt and minimizes transactions needed to settle up
    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a >= b) return //Avoid double processing pairs

        //Calculate net amount between two users
        const diff = ledger[a][b] - ledger[b][a]
        if (diff > 0) {
          //A owes B
          ledger[a][b] = diff
          ledger[b][a] = 0
        } else if (diff < 0) {
          //B owes A
          ledger[b][a] = -diff
          ledger[a][b] = 0
        } else {
          //Settled up
          ledger[a][b] = ledger[b][a] = 0
        }
      })
    })

    

    /* **********  Format Response Data  ********** */
    // Create a comprehensive balance object for each member
    const balances = memberDetails.map(m => ({
      ...m,
      totalBalance: totals[m.id],
      owes: Object.entries(ledger[m.id])
        .filter(([, v]) => v > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledger[other][m.id] > 0)
        .map((other) => ({ from: other, amount: ledger[other][m.id] }))
    }))

    const userLookupMap = {}
    memberDetails.forEach((member) => {
      userLookupMap[member.id] = member
    })

    return {
      //Group Info
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      members: memberDetails,  //All group members with details
      expenses,  //All expenses in this group
      settlements,  //All settlements in this group
      balances,  //Calculated balances for each member
      userLookupMap,  //Quick lookup map for user details by userId
    }
  }
})


export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")), //Optional - if provided, will return details of this group only
  },
  handler: async(ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser)

    // Get all groups where the user is a member
    const allGroups = await ctx.db.query("groups").collect()
    const userGroups = allGroups.filter((group) => 
      group.members.some((member) => member.userId === currentUser._id)
    )

    if(args.groupId){
      const selectedGroup = userGroups.find(
        (group) => group._id === args.groupId
      )
      if(!selectedGroup) {
        throw new Error("Group not found or you're not a member")
      }

      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (member) => {
          const user = await ctx.db.get(member.userId)
          if(!user) return null

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: member.role,
          }
        })
      )

      const validMembers = memberDetails.filter((member) => member !== null)
      
      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          members: validMembers,
        },
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length
        }))
      }
    } else {
      // Return list of groups without member details
      return {
        selectedGroup: null,
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        }))
      }
    }
  }
})