'use client';

import { useState } from 'react';
import GenericPage from '@/components/layout/GenericPage';
import { findUserByIdAction, createGroupAction } from './actions';

type AddedMember = {
  user_uuid: string;
  label?: string; // Optional: show name/email if your lookup returns it
};

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  );
}

// TODO: replace with current user id source (session)
function getCurrentUserId(): string {
  return 'cf955f50-7621-428c-a14b-c812f920a8b8';
}

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');
  const [members, setMembers] = useState<AddedMember[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageKind, setMessageKind] = useState<'success' | 'error' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [errors, setErrors] = useState<{ groupName?: string; pendingUserId?: string }>({});

  const currentUserId = getCurrentUserId();

  const resetFlash = () => {
    setMessage('');
    setMessageKind('');
  };

  const flash = (kind: 'success' | 'error', text: string) => {
    setMessageKind(kind);
    setMessage(text);
  };

  const validateGroupName = () => {
    if (!groupName.trim()) {
      setErrors((e) => ({ ...e, groupName: 'Please enter a group name.' }));
      return false;
    }
    setErrors((e) => ({ ...e, groupName: undefined }));
    return true;
  };

  const validatePendingUser = () => {
    const v = pendingUserId.trim();
    if (!v) {
      setErrors((e) => ({ ...e, pendingUserId: 'Enter a user ID (UUID).' }));
      return false;
    }
    if (!isUUID(v)) {
      setErrors((e) => ({ ...e, pendingUserId: 'Invalid UUID format.' }));
      return false;
    }
    if (members.some((m) => m.user_uuid.toLowerCase() === v.toLowerCase())) {
      setErrors((e) => ({ ...e, pendingUserId: 'This user is already in the list.' }));
      return false;
    }
    setErrors((e) => ({ ...e, pendingUserId: undefined }));
    return true;
  };

  const handleAddMember = async () => {
    resetFlash();
    if (!validatePendingUser()) return;

    setCheckingUser(true);
    try {
      const res = await findUserByIdAction(pendingUserId.trim());

      if (!res.success) {
        setErrors((e) => ({
          ...e,
          pendingUserId:
            res.code === 'NOT_FOUND'
              ? 'User not found in database.'
              : res.error || 'Could not verify user. Please try again.',
        }));
        return;
      }

      const label = res.user.name || res.user.email || `User ${res.user.user_uuid}`;
      setMembers((prev) => [...prev, { user_uuid: res.user.user_uuid, label }]);
      setPendingUserId('');
    } finally {
      setCheckingUser(false);
    }
  };

  const removeMember = (user_uuid: string) => {
    setMembers((prev) => prev.filter((m) => m.user_uuid !== user_uuid));
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
        creatorUuid: currentUserId,     // your auth/session id
        memberIds: members.map((m) => m.user_uuid),
        // parentGroupUuid: optional
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to create group. Please try again.');
        return;
      }

      flash('success', `Group "${result.group.group_name}" created successfully!`);
      setGroupName('');
      setMembers([]);
      setPendingUserId('');
    } catch {
      flash('error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <GenericPage
      title="Create New Group"
      description="Name your new group and add members to it. You will be the group admin."
      searchPlaceholder="(unused)"
      submitLabel={isLoading ? 'Creating...' : 'Create'}
      onSearch={undefined}
      onSubmit={handleCreate}
      showSearch={false}
      showSubmit={true}
    >
      {/* Flash message */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            messageKind === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }`}
        >
          {message}
        </div>
      )}

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
        {errors.groupName && (
          <p className="text-xs text-red-600">{errors.groupName}</p>
        )}
      </div>

      {/* Add members (one by one) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Add member by user ID (UUID)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pendingUserId}
            onChange={(e) => {
              setPendingUserId(e.target.value);
              if (errors.pendingUserId) {
                setErrors((er) => ({ ...er, pendingUserId: undefined }));
              }
            }}
            className="flex-1 px-3 py-2 border rounded-md bg-background"
          />
          <button
            onClick={handleAddMember}
            disabled={checkingUser || !pendingUserId.trim()}
            className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {checkingUser ? 'Checking...' : 'Add'}
          </button>
        </div>
        {errors.pendingUserId && (
          <p className="text-xs text-red-600">{errors.pendingUserId}</p>
        )}
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
                key={m.user_uuid}
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{m.label || m.user_uuid}</p>
                  <p className="text-xs text-muted-foreground">{m.user_uuid}</p>
                </div>
                <button
                  onClick={() => removeMember(m.user_uuid)}
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