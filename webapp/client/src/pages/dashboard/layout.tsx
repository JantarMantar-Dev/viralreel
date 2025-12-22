import { useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
    LayoutDashboard,
    LogOut,
    Settings,
    User,
    Plus,
    FolderOpen,
    Image as ImageIcon,
    LayoutTemplate,
    GraduationCap,
    Video
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    SidebarInset,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/sonner"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function DashboardLayout() {
    const { data: session, isPending, error } = authClient.useSession()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (!isPending && !session) {
            navigate("/auth/login")
        }
    }, [session, isPending, navigate])

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    navigate("/auth/login")
                },
            },
        })
    }

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Loading...</div>
            </div>
        )
    }

    if (!session) return null

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" className="border-r border-slate-100 bg-white">
                <SidebarHeader className="bg-white pb-4 pt-4">
                    <div className="flex items-center gap-2 px-2 py-1 mb-4">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
                            <img src="/logo.svg" alt="ViralReel Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="grid flex-1 text-left">
                            <span className="truncate font-bold text-slate-900 leading-tight">ViralReel</span>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent className="bg-white">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip="Dashboard"
                                        isActive={location.pathname === "/dashboard"}
                                        className="data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 hover:bg-slate-50 text-slate-600 font-medium"
                                    >
                                        <a href="/dashboard">
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Dashboard</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip="Settings"
                                        isActive={location.pathname === "/dashboard/settings"}
                                        className="data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 hover:bg-slate-50 text-slate-600 font-medium"
                                    >
                                        <a href="/dashboard/settings">
                                            <Settings className="h-4 w-4" />
                                            <span>Settings</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="bg-white border-t border-slate-100 p-4">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-purple-50 data-[state=open]:text-purple-600 hover:bg-slate-50"
                                    >
                                        <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                                            <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                                            <AvatarFallback className="bg-purple-100 text-purple-700">
                                                {session.user.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight max-w-[150px]">
                                            <span className="truncate font-semibold text-slate-900">{session.user.name}</span>
                                            <span className="truncate text-xs text-slate-500">Pro Plan</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L7 7L1 13" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180 -mt-1">
                                                <path d="M1 1L7 7L1 13" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-slate-200 shadow-lg"
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">{session.user.name}</span>
                                                <span className="truncate text-xs text-slate-500">{session.user.email}</span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SidebarInset className="bg-slate-50">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[radial-gradient(circle_at_center,theme(colors.purple.50)_0%,theme(colors.slate.50)_75%)]">
                    <Outlet />
                </div>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    )
}
