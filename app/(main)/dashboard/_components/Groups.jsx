import { Users } from "lucide-react"
import Link from "next/link"

const Groups = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-muted-foreground">No groups yet.</p>
        <p className="text-sm mt-1 text-muted-foreground">Create a group to start tracking shared expenses</p>
      </div>
    )
  }

  return <div className="space-y-3">{
    groups.map(group => {
      const balance = group.balance || 0
      const hasBalance = balance !== 0
      return (
        <Link
          key={group.id}
          href={`/groups/${group.id}`}
          className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="bg-muted p-2 rounded-md">
              <Users className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-medium">{group.name}</p>
              <p className="text-xs text-muted-foreground">{group.members.length} members</p>
            </div>
          </div>
          {hasBalance && (
            <span
              className={`text-sm font-medium ${balance > 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {balance > 0 ? "+" : "-"} ₹{Math.abs(balance).toFixed(2)}
            </span>
          )}
        </Link>
      )

    })
  }</div>
}

export default Groups