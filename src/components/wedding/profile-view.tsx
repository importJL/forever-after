'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, Loader2, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { client } from '@/lib/amplify-client';
import { useAmplifySession } from '@/lib/amplify-session-provider';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
  full: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
  readwrite: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
  readonly: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
};

export function ProfileView() {
  const { user, refreshUser } = useAmplifySession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadMember = async () => {
      try {
        const { data } = await client.models.Member.list({ filter: { userId: { eq: user.userId } } });
        const member = data?.[0];
        if (member) {
          setFirstName(member.firstName || user.firstName || '');
          setLastName(member.lastName || user.lastName || '');
        } else {
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
        }
      } catch {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
      } finally {
        setLoading(false);
      }
    };
    loadMember();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await client.models.Member.list({ filter: { userId: { eq: user.userId } } });
      const member = data?.[0];
      if (member) {
        await client.models.Member.update({
          id: member.id,
          firstName,
          lastName,
        });
      } else {
        await client.models.Member.create({
          userId: user.userId,
          email: user.email,
          firstName,
          lastName,
        });
      }
      await refreshUser();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center">
          <User className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-playfair)] font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account information</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            Account Details
          </CardTitle>
          <CardDescription>Your name and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">Email</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1">
              <p className="text-sm font-medium">Role:</p>
              <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="pf-firstName">First Name</Label>
              <Input
                id="pf-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-lastName">Last Name</Label>
              <Input
                id="pf-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
