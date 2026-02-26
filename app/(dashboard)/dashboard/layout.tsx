'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Menu,
  X,
  LogOut,
  ChevronUp,
  ChevronsUpDown
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/jobs', icon: Briefcase, label: 'Vacatures' },
  { href: '/dashboard/candidates', icon: Users, label: 'Kandidaten' },
  { href: '/dashboard/pipeline', icon: Kanban, label: 'Pipeline' },
  { href: '/dashboard/interviews', icon: Calendar, label: 'Interviews' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
];

const settingsNavItems = [
  { href: '/dashboard/general', icon: Settings, label: 'Algemeen' },
  { href: '/dashboard/team', icon: Users, label: 'Team' },
  { href: '/dashboard/activity', icon: Activity, label: 'Activiteit' },
  { href: '/dashboard/security', icon: Shield, label: 'Beveiliging' },
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <span className="font-semibold text-gray-900">Hiro</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-gray-100">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold tracking-tight">H</span>
          </div>
          <span className="font-semibold text-[15px] text-gray-900">Hiro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Main nav */}
          <div className="space-y-0.5">
            {mainNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : 'text-orange-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Settings section */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="px-2.5 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Instellingen
            </p>
            <div className="space-y-0.5">
              {settingsNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : 'text-orange-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          {user && mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage alt={user.name || ''} />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                      {(user.name || user.email)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">
                      {user.name || user.email}
                    </p>
                    {user.name && (
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    )}
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-[232px]">
                <DropdownMenuItem onClick={() => router.push('/dashboard/general')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Instellingen
                </DropdownMenuItem>
                <form action={handleSignOut}>
                  <button type="submit" className="w-full">
                    <DropdownMenuItem className="w-full cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Uitloggen
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="px-2.5 py-2">
              <Button asChild size="sm" className="w-full">
                <Link href="/sign-in">Inloggen</Link>
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
