import Link from 'next/link';
import { LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/app/actions/auth';

type DashboardNavbarProps = {
    userUuid: string;
};

export default function DashboardNavbar({ userUuid }: DashboardNavbarProps) {
    return (
        <nav className="sticky top-0 z-10 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-full border border-border bg-background/80 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="rounded-full px-3 sm:px-4"
                    >
                        <Link href={`/dashboard/${userUuid}`} aria-label="My dashboard">
                            <span className="flex items-center gap-1.5">
                                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs sm:text-sm">My Dashboard</span>
                            </span>
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="rounded-full px-3 sm:px-4"
                    >
                        <Link href={`/dashboard/${userUuid}/settings`} aria-label="Settings">
                            <span className="flex items-center gap-1.5">
                                <Settings className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs sm:text-sm">Settings</span>
                            </span>
                        </Link>
                    </Button>
                </div>
                <form action={logoutAction} className="flex-shrink-0">
                    <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="rounded-full px-3 sm:px-4 text-xs sm:text-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            <span>Logout</span>
                        </span>
                    </Button>
                </form>
            </div>
        </nav>
    );
}
