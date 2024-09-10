'use client'

import React from 'react'
import Header from '../components/Header'

import SearchRoom from './SearchRoom'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchRoom/>
    </div>
  )
}