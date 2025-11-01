import { useState } from "react"
import { useForm } from "react-hook-form"
import { UserPlus, X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { api } from "@/convex/_generated/api"
import { useConvexMutation, useConvexQuery } from "@/hooks"

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
})

const CreateNewGroup = ({ isOpen, onClose, onSuccess }) => {
  const [selectedMembers, setSelectedMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [commandOpen, setCommandOpen] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)

  const createGroup = useConvexMutation(api.contacts.createGroup)
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser)
  const { data: searchResults, isLoading: isSearching } = useConvexQuery(
    api.users.searchUsers,
    { query: searchQuery }
  )

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  })

  const addMember = (user) => {
    setIsInvalid(false)
    if (!selectedMembers.some((m) => m.id === user.id)) {
      setSelectedMembers([...selectedMembers, user])
    }
    setCommandOpen(false)
  }

  const removeMember = (userId) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId))
  }

  const onSubmit = async (data) => {
    if (selectedMembers.length === 0) {
      setIsInvalid(true)
      return
    }
    try {
      const memberIds = selectedMembers.map((member) => member.id)
      const groupId = await createGroup.mutate({
        name: data.name,
        description: data.description,
        members: memberIds, //including current user as a member
      })
      toast.success("Group created successfully!")
      handleOnClose()
      onSuccess && onSuccess(groupId) // Redirect to the new group page
    } catch (err) {
      toast.error("Failed to create group: " + err.message)
    }
  }

  const handleOnClose = () => {
    setSelectedMembers([])
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="gradient-text">Create New Group</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" {...register("description")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            <div className="flex flex-wrap gap-2 mb-2">{currentUser && (
              <Badge variant="secondary" className="px-3 py-1">
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarImage src={currentUser.imageUrl} />
                  <AvatarFallback>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{currentUser.name} (You)</span>
              </Badge>
            )}

              {/* Add selected members as badges */}
              {selectedMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="px-3 py-1">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={member.imageUrl} />
                    <AvatarFallback className='bg-purple-300'>
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
              }

              {/* Add user to selectedMembers array */}
              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                  >
                    <UserPlus className="h-3 w-3" />
                    Add Member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" side="bottom">
                  <Command>
                    <CommandInput
                      placeholder="Start typing name or email..."
                      value={searchQuery}
                      onValueChange={(value) => setSearchQuery(value)}
                    />
                    <CommandList>
                      <CommandEmpty>{
                        searchQuery.length < 2 ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">Type at least 2 characters </p>
                        ) :
                          isSearching ? (
                            <p className="py-3 px-4 text-sm text-center text-muted-foreground">Searching...</p>
                          ) : (
                            <p className="py-3 px-4 text-sm text-center text-muted-foreground">No user found</p>
                          )
                      }
                      </CommandEmpty>
                      <CommandGroup heading="Users">
                        {searchResults?.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name || user.email}
                            onSelect={() => addMember(user)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.imageUrl} />
                                <AvatarFallback>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {
              isInvalid && (
                <p className="text-sm text-red-500">
                  Add at least one member to create a group.
                </p>
              )
            }
          </div>

          <DialogFooter>
            <Button variant="outline" className='text-yellow-500 border-none hover:text-yellow-500' onClick={handleOnClose}>Cancel</Button>
            <Button type="submit" className='bg-yellow-500 hover:bg-yellow-400 border-none'
              disabled={isSubmitting}
            >{isSubmitting ? "Creating..." : "Create Group"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateNewGroup