'use client';

import { useState, useEffect } from 'react';
import GenericPage from '@/components/layout/GenericPage';
import FlashMessage from '@/app/components/FlashMessage';
import { findUserByEmailAction, createGroupAction } from './actions';
import { isEmail } from '@/app/utils/validation';
import { useFlashMessage } from '@/app/utils/hooks';

type AddedMember = {
  user_uuid: string;
  email: string;
  label?: string;
};

export default function CreateGroupPage({ params }: { params: Promise<{ user_uuid: string }> }) {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [members, setMembers] = useState<AddedMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [errors, setErrors] = useState<{ groupName?: string; pendingEmail?: string }>({});
  const { message, messageKind, flash, resetFlash } = useFlashMessage();

  useEffect(() => {
    let active = true;

    const extractParams = async () => {
      const resolvedParams = await params;
      if (active) {
        setCurrentUserId(resolvedParams.user_uuid);
      }
    };

    extractParams();

    return () => {
      active = false;
    };
  }, [params]);

  const validateGroupName = () => {
    if (!groupName.trim()) {
      setErrors((e) => ({ ...e, groupName: 'Please enter a group name.' }));
      return false;
    }
    setErrors((e) => ({ ...e, groupName: undefined }));
    return true;
  };

  const validatePendingEmail = () => {
    const v = pendingEmail.trim();
    if (!v) {
      setErrors((e) => ({ ...e, pendingEmail: 'Enter a user email.' }));
      return false;
    }
    if (!isEmail(v)) {
      setErrors((e) => ({ ...e, pendingEmail: 'Invalid email format.' }));
      return false;
    }
    if (members.some((m) => m.email.toLowerCase() === v.toLowerCase())) {
      setErrors((e) => ({ ...e, pendingEmail: 'This email is already in the list.' }));
      return false;
    }
    setErrors((e) => ({ ...e, pendingEmail: undefined }));
    return true;
  };

  const handleAddMember = async () => {
    resetFlash();
    if (!validatePendingEmail()) return;

    setCheckingUser(true);
    try {
      const res = await findUserByEmailAction(pendingEmail.trim());

      if (!res.success) {
        setErrors((e) => ({
          ...e,
          pendingEmail: res.error || 'Could not verify user. Please try again.',
        }));
        return;
      }

      const label = res.user.name || res.user.email || `User ${res.user.user_uuid}`;
      setMembers((prev) => [
        ...prev,
        { user_uuid: res.user.user_uuid, email: res.user.email, label },
      ]);
      setPendingEmail('');
    } finally {
      setCheckingUser(false);
    }
  };

  const removeMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m.email.toLowerCase() !== email.toLowerCase()));
    resetFlash();
  };

  const handleCreate = async () => {
    resetFlash();
    const ok = validateGroupName();
    if (!ok) return;

    setIsLoading(true);
    try {
      const result = await createGroupAction({
        groupName,
        creatorUuid: currentUserId, // your auth/session id
        memberEmails: members.map((m) => m.email),
        // parentGroupUuid: optional
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to create group. Please try again.');
        return;
      }

      flash('success', `Group "${result.group.group_name}" created successfully!`);
      setGroupName('');
      setMembers([]);
      setPendingEmail('');
    } catch {
      flash('error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GenericPage
      title="Create New Group"
      description="Name your new group and add members by email. You will be the group admin."
      searchPlaceholder="(unused)"
      submitLabel={isLoading ? 'Creating...' : 'Create'}
      onSearch={undefined}
      onSubmit={handleCreate}
      showSearch={false}
      showSubmit={true}
    >
      <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

      {/* Group name */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Group name</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => {
            setGroupName(e.target.value);
            if (errors.groupName) setErrors((er) => ({ ...er, groupName: undefined }));
          }}
          className="w-full px-3 py-2 border rounded-md bg-background"
          placeholder="e.g., ECE444 Project"
        />
        {errors.groupName && <p className="text-xs text-red-600">{errors.groupName}</p>}
      </div>

      {/* Add members by email (one by one) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Add member by email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={pendingEmail}
            onChange={(e) => {
              setPendingEmail(e.target.value);
              if (errors.pendingEmail) {
                setErrors((er) => ({ ...er, pendingEmail: undefined }));
              }
            }}
            className="flex-1 px-3 py-2 border rounded-md bg-background"
            placeholder="user@example.com"
          />
          <button
            onClick={handleAddMember}
            disabled={checkingUser || !pendingEmail.trim()}
            className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {checkingUser ? 'Checking...' : 'Add'}
          </button>
        </div>
        {errors.pendingEmail && <p className="text-xs text-red-600">{errors.pendingEmail}</p>}
      </div>

      {/* Current members list */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Members added:</p>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No new members added yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.email}
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{m.label || m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <button
                  onClick={() => removeMember(m.email)}
                  className="px-2 py-1 text-sm bg-destructive text-destructive-foreground rounded-md hover:opacity-90"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </GenericPage>
  );
}
