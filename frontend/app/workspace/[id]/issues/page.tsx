'use client'
import React from 'react'
import { useParams } from 'next/navigation'

export default function IssuesPage() {
  const { id } = useParams()
  return (
    <div>IssuesPage with workspace id {id}</div>
  )
}