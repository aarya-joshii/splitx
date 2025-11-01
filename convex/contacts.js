import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getAllContacts = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const expenseYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => {
        return q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      })
      .collect()

    const expensesNotPaidByYou = (await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", undefined))
      .collect()
    ).filter(e => e.paidByUserId !== currentUser._id && e.splits.some((s) => s.userId === currentUser._id))

    const personalExpenses = [...expenseYouPaid, ...expensesNotPaidByYou]

    const contactIds = new Set()
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id) contactIds.add(exp.paidByUserId)
      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) contactIds.add(s.userId)
      })
    })
    const contactUsers = await Promise.all(
      [...contactIds].map(async (id) => {
        const user = await ctx.db.get(id)
        return user ? {
          id: user._id,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          type: "user", //to differentiate from groups
        } : null
      })
    )

    //other approach: using filter instead of withIndex
    const userGroups = (await ctx.db.query("groups").collect()).filter((g) => g.members
      .some((m) => m.userId === currentUser._id)
    ).map((g) => ({
      id: g._id,
      name: g.name,
      description: g.description,
      memberCount: g.members.length,
      type: "group", //to differentiate from users
    }))

    //Sort results alphabetically by name
    contactUsers.sort((a, b) => a?.name.localeCompare(b?.name))
    userGroups.sort((a, b) => a?.name.localeCompare(b?.name))

    //Return the result and filtering out any null values from contact users (in case a user was not found)
    return {
      users: contactUsers.filter(Boolean),
      groups: userGroups,
    }
  }
})

//Creating new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users")), //Reference to users table
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser)

    if (!args.name.trim()) throw new Error("Group name cannot be empty")

    const uniqueMembers = new Set(args.members)
    uniqueMembers.add(currentUser._id) //Adding current user to the group

    //Check if all user ids are valid
    for (const id of uniqueMembers) {
      const user = await ctx.db.get(id)
      if (!user) {
        throw new Error("User not found: " + id)
      }
    }

    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      description: args.description?.trim() ?? "",
      createdBy: currentUser._id,
      members: [...uniqueMembers].map((id) => ({
        userId: id,
        role: id === currentUser._id ? "admin" : "member", //Current user (or first user) is admin
        joinedAt: Date.now(),
      })),
    })
  }
})