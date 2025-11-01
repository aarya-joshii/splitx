"use client"

import { BeatLoader } from "react-spinners"
import { ArrowLeft, Users } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { useConvexQuery } from "@/hooks"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import SettlementForm from "./_components/SettlementForm"

const SettlementPage = () => {
  const params = useParams()
  const router = useRouter()
  const { type, id } = params

  const { data, isLoading } = useConvexQuery(
    api.settlements.getSettlementData,
    {
      entityType: type,
      entityId: id,
    }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center mx-auto py-12">
        <BeatLoader color="#8200db" />
      </div>
    )
  }

  const handleSuccess = () => {
    // Redirect to appropriate page based on type
    if (type === "user") {
      router.push(`/person/${id}`)
    } else if (type === "group") {
      router.push(`/groups/${id}`)
    }
  }

  return (
    <div className="container mx-auto pu-5 max-w-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className='text-brand hover:text-yellow-500 hover:bg-white-100 hover:border-yellow-500 transition mb-4'
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl gradient-text">Settle Your Expenses</h1>
        <p className="text-muted-foreground mt-1">{
          type === "user"
            ? `Settle up with ${data?.counterpart?.name}`
            : `Settle up in ${data?.group?.name}`
        }</p>
      </div>

      <Card className="border-purple-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            {type === "user" ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={data?.counterpart?.imageUrl} />
                <AvatarFallback className='bg-purple-300'>
                  {data?.counterpart?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="bg-muted p-2 rounded-md">
                <Users className="h-6 w-6 text-brand" />
              </div>
            )}
            <CardTitle>
              {type === "user" ? data?.counterpart?.name : data?.group?.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <SettlementForm
            entityType={type}
            entityData={data}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default SettlementPage