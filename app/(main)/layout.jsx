"use client";

import { Authenticated } from "convex/react"

const MainLayout = ({ children }) => {
  return (
    <Authenticated>
      <div className="container mx-auto mt-20 mb-20 md:px-20">{children}</div>
    </Authenticated>
  )
}

export default MainLayout