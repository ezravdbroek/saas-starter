import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'zojuist';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minuten geleden`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} uur geleden`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} dagen geleden`;
  return date.toLocaleDateString('nl-NL');
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'Je hebt je aangemeld';
    case ActivityType.SIGN_IN:
      return 'Je bent ingelogd';
    case ActivityType.SIGN_OUT:
      return 'Je bent uitgelogd';
    case ActivityType.UPDATE_PASSWORD:
      return 'Je hebt je wachtwoord gewijzigd';
    case ActivityType.DELETE_ACCOUNT:
      return 'Je hebt je account verwijderd';
    case ActivityType.UPDATE_ACCOUNT:
      return 'Je hebt je account bijgewerkt';
    case ActivityType.CREATE_TEAM:
      return 'Je hebt een nieuw team aangemaakt';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'Je hebt een teamlid verwijderd';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'Je hebt een teamlid uitgenodigd';
    case ActivityType.ACCEPT_INVITATION:
      return 'Je hebt een uitnodiging geaccepteerd';
    default:
      return 'Onbekende actie';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Activiteitenlog
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recente activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` vanaf IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nog geen activiteit
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Wanneer je acties uitvoert zoals inloggen of je account bijwerken,
                verschijnen ze hier.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
