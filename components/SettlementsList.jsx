"use client"

import { format } from "date-fns"
import { ArrowLeftRight } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const SettlementsList = ({
  settlements,
  isGroupSettlement = false,
  userLookupMap
}) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser)

  if (!settlements || !settlements.length) {
    return (
      <Card className="border-purple-300">
        <CardContent className="py-8 text-center text-muted-foreground">
          No settlements found.
        </CardContent>
      </Card>
    )
  }

  //Get user details from cache or lookup
  const getUserDetails = (userId) => {
    return {
      name:
        userId === currentUser?._id
          ? "You"
          : userLookupMap[userId]?.name || "Other User",
      id: userId,
    }
  }

  return <div className="flex flex-col gap-4">
    {settlements.map((settlement) => {
      const payer = getUserDetails(settlement.paidByUserId)
      const receiver = getUserDetails(settlement.receivedByUserId)
      const isCurrentUserPayer = settlement.paidByUserId === currentUser?._id
      const isCurrentUserReceiver = settlement.receivedByUserId === currentUser?._id

      return (
        <Card
          key={settlement._id}
          className="hover:bg-muted/30 transition-colors border-purple-300"
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <ArrowLeftRight className="h-5 w-5 text-brand" />
                </div>

                <div>
                  <h3 className="font-medium">
                    {isCurrentUserPayer
                      ? `You paid ${receiver.name}`
                      : isCurrentUserReceiver
                        ? `${payer.name} paid you`
                        : `${payer.name} paid ${receiver.name}`
                    }
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <span>
                      {format(new Date(settlement.date), "MMM d, yyyy")}
                    </span>
                    {settlement.note && (
                      <>
                        <span>💸</span>
                        <span className="font-medium">{settlement.note}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium">
                  ₹{settlement.amount.toFixed(2)}
                </div>

                {isGroupSettlement ? (
                  <Badge className="mt-1 border-yellow-500" variant="outline">
                    Group Settlement
                  </Badge>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {isCurrentUserPayer ? (
                      <span className="text-yellow-500">You paid</span>
                    ) : isCurrentUserReceiver ? (
                      <span className="text-green-500">You received</span>
                    ) : (
                      <span>Payment</span>
                    )
                    }
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    })}
  </div>
}

export default SettlementsList