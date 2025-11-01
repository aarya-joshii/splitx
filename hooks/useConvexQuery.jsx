import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { toast } from "sonner"

export const useConvexQuery = (query, ...args) => {
  const result = useQuery(query, ...args)

  const [data, setData] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if(result === undefined) {
      setIsLoading(true)
      return
    }
    try {
      setData(result)
      setError(null)
    } catch (err) {
      setError(err)
      toast.error(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [result])

  return { data, isLoading, error }
}