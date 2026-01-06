"use client"

/**
 * User Dropdown Menu Component
 * Industry-standard avatar dropdown with account management options
 */
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LogOut,
} from "lucide-react"

interface UserDropdownProps {
  onLogout?: () => void
}

interface UserData {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export function UserDropdown({ onLogout }: UserDropdownProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // Get user data from localStorage
    const loginData = localStorage.getItem("login_data")
    if (loginData) {
      try {
        const data = JSON.parse(loginData)
        setUser(data)
      } catch (e) {
        console.error("Failed to parse login data:", e)
      }
    }
  }, [])

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("login_data")
      router.push("/login")
    }
  }

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.username || user?.email || "User"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center gap-3 rounded-2xl hover:bg-[#E8F5F3] p-2 pr-3 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]">
          <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-[#4FD1C5]/20 hover:ring-[#4FD1C5]/40 transition-all">
            <AvatarImage src={user?.avatar_url || ""} alt={getDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-[#2D7A89] to-[#1E5A68] text-white font-semibold text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-[#2D3748]">{getDisplayName()}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72 rounded-3xl bg-white border border-gray-200 shadow-2xl shadow-gray-300/50 p-2" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal p-0 mb-2">
          <div className="flex flex-col space-y-3 p-3 rounded-2xl bg-gradient-to-br from-[#E8F5F3] via-[#F0FAF8] to-[#F7FCFB]">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-white shadow-lg">
                <AvatarImage src={user?.avatar_url || ""} alt={getDisplayName()} />
                <AvatarFallback className="bg-gradient-to-br from-[#2D7A89] to-[#1E5A68] text-white font-bold text-base">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2D3748] truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-[#718096] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-100" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 font-medium focus:bg-red-50 focus:text-red-700"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
