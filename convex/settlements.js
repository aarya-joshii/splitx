import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const createSettlement = mutation({
  args: {
    amount: v.number(),  //should be greater than 0
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")) //undefined for 1-1 expenses
  },
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(internal.users.getCurrentUser)

    /******  Basic validations  *******/
    if (args.amount <= 0)
      throw new Error("Amount should be greater than 0.")
    if (args.paidByUserId === args.receivedByUserId)
      throw new Error("Payer and receiver cannot be the same user.")
    if (caller._id !== args.paidByUserId && caller._id !== args.receivedByUserId)
      throw new Error("You must be either the payer or the receiver.")

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId)
      if (!group) throw new Error("Group not found!")

      const isMember = (uid) => group.members.some((m) => m.userId === uid)
      if (!isMember(args.paidByUserId) || !isMember(args.receivedByUserId)) {
        throw new Error("Both payer and receiver should be members of the group.")
      }
    }

    /******  Add data into settlements table  *******/
    return await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      createdBy: caller._id,
    })
  }
})

export const getSettlementData = query({
  args: {
    entityType: v.string(), // "user" | "group"
    entityId: v.string(), // Convex ID of user or group
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser)

    if (args.entityType === "user") {
      const other = await ctx.db.get(args.entityId)
      if (!other) throw new Error("User not found!")

      /****** Gather expenses where either of us paid or appears in the splits *******/
      const myExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined)
        )
        .collect()

      const otherUserExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined)
        )
        .collect()

      const expenses = [...myExpenses, ...otherUserExpenses]

      /****** Filter expenses where both of us are involved and part of the splits  *******/

      let owed = 0 // They owe me
      let owing = 0 // I owe them

      for (const exp of expenses) {
        const involvesMe =
          exp.paidByUserId === me._id ||
          exp.splits.some((s) => s.userId === me._id)

        const involvesThem =
          exp.paidByUserId === other._id ||
          exp.splits.some((s) => s.userId === other._id)
        if (!(involvesMe && involvesThem)) continue;

        // Case 1: I paid
        if (exp.paidByUserId === me._id) {
          const split = exp.splits.find(
            (s) => s.userId === other._id && !s.paid
          )
          if (split) owed += split.amount
        }
        // Case 2: They paid
        if (exp.paidByUserId === other._id) {
          const split = exp.splits.find(
            (s) => s.userId === me._id && !s.paid
          )
          if (split) owing += split.amount
        }
      }

      /****** Fetch all settlements for both users  *******/

      const mySettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined)
        )
        .collect()

      const otherUserSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined)
        )
        .collect()

      const settlements = [...mySettlements, ...otherUserSettlements]

      for (const st of settlements) {
        if (st.paidByUserId === me._id) {
          // I already paid them
          owing = Math.max(0, owing - st.amount)
        } else {
          // They already paid me
          owed = Math.max(0, owed - st.amount)
        }
      }

      /****** Return all information  *******/

      return {
        type: "user",
        counterpart: {
          userId: other._id,
          name: other.name,
          email: other.email,
          imageUrl: other.imageUrl,
        },
        youAreOwed: owed,
        youOwe: owing,
        netBalance: owed - owing, // +ve means they owe me (you will receive)
      }

    } else if (args.entityType === "group") {

      const group = await ctx.db.get(args.entityId)
      if (!group) throw new Error("Group not found!")

      const isMember = group.members.some((m) => m.userId === me._id)
      if (!isMember) throw new Error("You are not a member of this group.")

      /****** Gather expenses where groupId matches *******/
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect()

      /****** Initialize balances for each member *******/
      const balances = {}
      group.members.forEach((m) => {
        if (m.userId !== me._id) balances[m.userId] = { owed: 0, owing: 0 }
      })
      // Apply expenses
      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {
          // I paid, others owe me
          exp.splits.forEach((split) => {
            if (split.userId !== me._id && !split.paid) {
              balances[split.userId].owed += split.amount
            }
          })
        } else if (balances[exp.paidByUserId]) {
          // Someone else in the group paid, I may owe them
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid)
          if (split) balances[exp.paidByUserId].owing += split.amount
        }
      }

      // Apply settlements within the group
      const settlements = await ctx.db
        .query("settlements")
        .filter(q => q.eq(q.field("groupId"), group._id))
        .collect()

      for (const st of settlements) {
        // Fetch settlements where I am either payer or receiver
        if (st.paidByUserId === me._id && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(
            0,
            balances[st.receivedByUserId].owing - st.amount
          )
        }
        if (st.receivedByUserId === me._id && balances[st.paidByUserId]) {
          balances[st.paidByUserId].owed = Math.max(
            0,
            balances[st.paidByUserId].owed - st.amount
          )
        }
      }

      const members = await Promise.all(
        Object.keys(balances).map((id) => ctx.db.get(id))
      )

      /****** Structure the data *******/
      const list = Object.keys(balances).map((uid) => {
        const m = members.find((u) => u && u._id === uid)
        const { owed, owing } = balances[uid]
        return {
          userId: uid,
          name: m?.name || "Unknown",
          imageUrl: m?.imageUrl,
          youAreOwed: owed,
          youOwe: owing,
          netBalance: owed - owing, // +ve means they owe me (you will receive)
        }
      })

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        balances: list,
      }
    }

    throw new Error("Invalid entity type; expected 'user' or 'group'")
  }
})