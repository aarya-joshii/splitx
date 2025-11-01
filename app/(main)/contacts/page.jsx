"use client";

import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { Plus, User, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import CreateNewGroup from "./_components/CreateNewGroup";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks";

const ContactsPage = () => {
  const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const createGroupParam = searchParams.get("createGroup")
    if (createGroupParam === "true") {
      setIsCreateGroupModalOpen(true)

      // Clear the param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete("createGroup")
      router.replace(url.pathname + url.search) // Use replace to avoid adding a new entry in history
    }
  }, [searchParams, router])


  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto py-12">
        <BeatLoader color="#8200db" />
      </div>
    )
  }

  const { users, groups } = data || { users: [], groups: [] }

  return (
    <div className="container mx-auto px-6 py-3">
      <h1 className="text-2xl sm:text-3xl gradient-text md:text-center mx-auto mb-5">Friends & Groups</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4 flex text-brand">
            <User className="mr-2 h-5 w-5" />
            Friends
          </h2>

          {
            users.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  No friends found. Start adding some!
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4 md:pr-12">
                {users.map((user) => (
                  <Link key={user.id} href={`/person/${user.id}`}>
                    <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <CardContent className="py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.imageUrl} />
                              <AvatarFallback>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          }
        </div>

        <div>
          <div className="flex justify-between">
            <h2 className="text-xl font-bold mb-4 flex text-brand">
              <Users className="mr-2 h-5 w-5" />
              Groups
            </h2>
            <Button onClick={() => setIsCreateGroupModalOpen(true)} className='text-xs sm:text-sm bg-yellow-400 hover:bg-yellow-300 border-none'>
              <Plus className="h-4 w-4" />
              Create New Group
            </Button>
          </div>
          {
            groups.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  No groups found. Create a new group to get started!
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {groups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <CardContent className="py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{group.name}</p>
                              <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          }
        </div>
      </div>
      <CreateNewGroup
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(groupId) => router.push(`/groups/${groupId}`)}
      />
    </div>
  )
}

export default ContactsPage