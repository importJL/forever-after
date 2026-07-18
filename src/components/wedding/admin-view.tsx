'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, UserCog, Trash2, AlertTriangle, RefreshCw, CheckCircle2, Loader2, XCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { fetchAuthSession } from 'aws-amplify/auth';
import { client } from '@/lib/amplify-client';
import { useWeddingStore } from '@/lib/store';
import { useAmplifySession } from '@/lib/amplify-session-provider';

interface MemberRecord {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const ROLE_OPTIONS = ['admin', 'full', 'readwrite', 'readonly'] as const;

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
  full: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
  readwrite: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
  readonly: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
};

async function getUserPoolId(): Promise<string> {
  const session = await fetchAuthSession();
  const issuer = session.tokens?.accessToken?.payload?.iss as string;
  return issuer?.split('/').pop() || '';
}

const MODELS = ['Wedding', 'Guest', 'BudgetCategory', 'BudgetExpense', 'Task', 'Vendor', 'TimelineEvent', 'MediaItem', 'WebLink', 'Notification', 'ImportedFile'] as const;

export function AdminView() {
  const { user } = useAmplifySession();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRoles, setChangingRoles] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Member.list();
      setMembers(data as MemberRecord[]);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    setChangingRoles((prev) => ({ ...prev, [memberId]: 'saving' }));
    try {
      const userPoolId = await getUserPoolId();
      const { errors } = await client.mutations.setUserRole({
        userId: member.userId,
        role: newRole,
        userPoolId,
      });
      if (errors) {
        toast.error(errors[0]?.message || 'Failed to update role');
        setChangingRoles((prev) => ({ ...prev, [memberId]: 'error' }));
        return;
      }
      await client.models.Member.update({
        id: member.id,
        role: newRole,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
      setChangingRoles((prev) => ({ ...prev, [memberId]: 'done' }));
      toast.success(`Role updated to ${newRole}`);
      setTimeout(() => {
        setChangingRoles((prev) => {
          const next = { ...prev };
          delete next[memberId];
          return next;
        });
      }, 2000);
    } catch {
      toast.error('Failed to update role');
      setChangingRoles((prev) => ({ ...prev, [memberId]: 'error' }));
    }
  };

  const handleResetApp = async () => {
    setResetting(true);
    try {
      const store = useWeddingStore.getState();
      for (const modelName of MODELS) {
        const model = client.models[modelName as keyof typeof client.models] as {
          list: () => Promise<{ data: Array<{ id: string }> }>;
          delete: (input: { id: string }) => Promise<unknown>;
        };
        const { data: items } = await model.list();
        if (items && items.length > 0) {
          for (const item of items) {
            await model.delete({ id: item.id });
          }
        }
      }
      store.setWedding({
        id: '1', coupleName: 'Our Wedding', partner1: '', partner2: '',
        date: '', venue: '', venueAddress: '', ceremonyDate: '',
        ceremonyLocation: '', ceremonyAddress: '', theme: 'Classic Elegance',
        guestCount: 0, budgetTotal: 0, notes: '',
      });
      store.setGuests([]);
      store.setBudgetCategories([]);
      store.setTasks([]);
      store.setVendors([]);
      store.setTimelineEvents([]);
      store.setMediaItems([]);
      store.setWebLinks([]);
      store.setNotifications([]);
      toast.success('App has been reset. All data cleared.');
    } catch {
      toast.error('Failed to reset app');
    } finally {
      setResetting(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <p className="text-sm">Admin access required</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-playfair)] font-semibold">Admin</h1>
            <p className="text-sm text-muted-foreground">Manage users and application data</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  Team Members
                </CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchMembers} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                        {(member.firstName?.[0] || member.email?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.email || 'Unknown'}
                      </p>
                      {member.email && (
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={ROLE_COLORS[member.role] || ROLE_COLORS.readwrite}
                      >
                        {member.role}
                      </Badge>
                      <Select
                        disabled={changingRoles[member.id] === 'saving'}
                        value={member.role}
                        onValueChange={(val) => handleRoleChange(member.id, val)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role} className="text-xs">
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {changingRoles[member.id] === 'saving' && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {changingRoles[member.id] === 'done' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {changingRoles[member.id] === 'error' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete all wedding data (guests, tasks, budget, vendors, timeline, media, links, notifications)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={resetting} className="gap-2">
                  {resetting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Reset All Application Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Reset Application Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL wedding data including guests, tasks, budget, 
                    vendors, timeline, media, web links, and notifications. Member accounts and roles 
                    will be preserved. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetApp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
