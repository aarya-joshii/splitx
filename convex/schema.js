import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
  })
  .index("by_token", ["tokenIdentifier"])
  .index("by_email", ["email"])
  .searchIndex("search_name", {searchField: "name"})
  .searchIndex("search_email", {searchField: "email"}),

  expenses: defineTable({
    description: v.string(),
    amount:v.number(),
    category: v.optional(v.string()),
    date: v.number(), //timestamp
    paidByUserId: v.id("users"), //user who paid the expense. Reference to users table
    splitType: v.string(), // "equal" or "percentage" or "exact"
    splits: v.array(v.object({
      userId: v.id("users"), //Reference to users table
      amount: v.number(), //amount owed by the user
      paid: v.boolean(),
    })),
    groupId: v.optional(v.id("groups")), //undefined for 1-1 expenses
    createdBy: v.id("users"), //Reference to users table
  })
  .index("by_group", ["groupId"])
  .index("by_user_and_group", ["paidByUserId", "groupId"])
  .index("by_date", ["date"]),

  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"), //Reference to users table
    members: v.array(v.object({
      userId: v.id("users"), //Reference to users table
      role: v.string(), // "admin" or "member"
      joinedAt: v.number(), //timestamp
    })), 
  }),

  settlements: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.number(), //timestamp
    paidByUserId: v.id("users"), //user who made the settlement. Reference to users table
    receivedByUserId: v.id("users"), //user who received the settlement. Reference to users table
    groupId: v.optional(v.id("groups")), //Reference to groups table
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))), //Reference to expenses table, if this settlement is related to an expense
    createdBy: v.id("users"), //Reference to users table
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_date", ["date"])
    .index("by_receiver_and_group", ["receivedByUserId", "groupId"]),

})