import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';
import { getOrCreateThemePreferences } from '@/app/services/theme.service';

type PageProps = {
    params: Promise<{ user_uuid: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
    const session = await getSession();
    const { user_uuid } = await params;

    if (!session || session.user_uuid !== user_uuid) {
        redirect('/signup');
    }

    // Fetch user's theme preferences
    const themePreferences = await getOrCreateThemePreferences(session.user_uuid);

    return (
        <SettingsClient
            userUuid={user_uuid}
            initialThemeMode={themePreferences.theme_mode}
            initialAccentColor={themePreferences.accent_color}
        />
    );
}
