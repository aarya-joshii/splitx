import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation)

  const [data, setData] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const mutate = async(...args) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await mutationFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      toast.error(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }


  return { mutate, data, isLoading, error }
}