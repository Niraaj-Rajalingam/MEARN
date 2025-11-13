import Link from 'next/link';
import { LogOut, Settings, LayoutDashboard, UsersRound } from 'lucide-react';
import { Button } from '@mui/material'
import { logoutAction } from '@/app/actions/auth';

type DashboardNavbarProps = {
    userUuid: string;
};

export default function DashboardNavbar({ userUuid }: DashboardNavbarProps) {
    return (
        <nav className="sticky top-0 z-10 mb-4 sm:mb-6 w-full flex justify-center px-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-full border border-border bg-background/80 px-4 py-2.5 shadow-md backdrop-blur supports-[backdrop-filter]:backdrop-blur max-w-4xl w-full">
                <div className="flex flex-wrap items-center gap-1">
                    <Button className="transition-transform hover:scale-105">
                        <Link href={`/dashboard/${userUuid}`} aria-label="My dashboard">
                            <span className="flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
                                <span className="text-sm sm:text-base font-medium">My Dashboard</span>
                            </span>
                        </Link>
                    </Button>
                    <Button className="transition-transform hover:scale-105">
                        <Link href={`/dashboard/${userUuid}/friends`} aria-label="Friends">
                            <span className="flex items-center gap-2">
                                <UsersRound className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
                                <span className="text-sm sm:text-base font-medium">Friends</span>
                            </span>
                        </Link>
                    </Button>
                    <Button className="transition-transform hover:scale-105">
                        <Link href={`/dashboard/${userUuid}/settings`} aria-label="Settings">
                            <span className="flex items-center gap-2">
                                <Settings className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
                                <span className="text-sm sm:text-base font-medium">Settings</span>
                            </span>
                        </Link>
                    </Button>
                </div>
                <form action={logoutAction} className="flex-shrink-0">
                    <Button type="submit" className="transition-transform hover:scale-105">
                        <span className="flex items-center gap-2">
                            <LogOut className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
                            <span className="text-sm sm:text-base font-medium">Logout</span>
                        </span>
                    </Button>
                </form>
            </div>
        </nav>
    );
}