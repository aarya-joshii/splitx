import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowDownCircle, ArrowUpCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

const ExpenseDetails = ({ balances }) => {
  if (!balances) return null

  const { oweDetails } = balances
  const hasOwed = oweDetails?.amtYouAreOwedBy?.length > 0  //user will get money
  const hasOwing = oweDetails?.amtYouOwe?.length > 0  //user need to pay someone

  return (
    <div className="space-y-4">
      {!hasOwed && !hasOwing && (
        <div className="flex items-center justify-center text-center py-6">
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          <p className="text-muted-foreground">You're all settled up!</p>
        </div>
      )}

      {hasOwed && (
        <div>
          <h3 className="flex items-center mb-3 text-sm font-medium text-brand">
            <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
            To Receive
          </h3>
          <div className="space-y-3">
            {oweDetails?.amtYouAreOwedBy?.map((item) => (
              <Link
                key={item.userId}
                href={`/person/${item.userId}`}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>
                      {item.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.name}</span>
                </div>

                <span className="font-medium text-green-500">
                  ₹{item.amount.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasOwing && (
        <div>
          <h3 className="flex items-center mb-3 text-sm font-medium text-brand">
            <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
            To Pay
          </h3>
          <div className="space-y-3">
            {oweDetails?.amtYouOwe?.map((item) => (
              <Link
                key={item.userId}
                href={`/person/${item.userId}`}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>
                      {item.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.name}</span>
                </div>

                <span className="font-medium text-red-500">
                  ₹{item.amount.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseDetails