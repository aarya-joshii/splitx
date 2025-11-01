"use client"

import { useEffect, useState } from "react"
import { BarLoader } from "react-spinners"
import { Users } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GroupSelector = ({ onChange }) => {
  const [selectedGroupId, setSelectedGroupId] = useState("")

  const { data, isLoading } = useConvexQuery(
    api.groups.getGroupOrMembers,
    selectedGroupId ? { groupId: selectedGroupId } : {}
  )

  useEffect(() => {
    if (data?.selectedGroup && onChange) {
      onChange(data.selectedGroup)
    }
  }, [data])

  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId)
  }

  if (isLoading) {
    return <BarLoader color="#8200db" width={"100%"} />
  }

  if (!data?.groups || data.groups.lenght === 0) {
    return (
      <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
        You're not part of any groups. Please create a new group first.
      </div>
    )
  }

  return (
    <div>
      <Select value={selectedGroupId} onValueChange={handleGroupChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a group" />
        </SelectTrigger>
        <SelectContent>
          {data.groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1 rounded-full">
                  <Users className="h-3 w-3 text-brand" />
                </div>
                <span>{group.name}</span>
                <span className="text-xs text-muted-foreground">({group.memberCount} members)</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && selectedGroupId && (
        <div className="mt-2">
          <BarLoader color="#8200db" width={"100%"} />
        </div>
      )}
    </div>
  )
}

export default GroupSelector