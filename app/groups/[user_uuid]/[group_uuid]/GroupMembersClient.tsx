'use client';

import { useState } from 'react';
import Link from 'next/link';
import FlashMessage from '@/app/components/FlashMessage';
import { addMemberToGroupAction, removeMembersFromGroupAction, sendFriendRequestsToMembersAction } from './actions';
import { useFlashMessage } from '@/app/utils/hooks';
import { isEmail } from '@/app/utils/validation';

interface Member {
  user_uuid: string;
  role: string;
  name: string;
  email: string;
}

interface GroupMembersClientProps {
  userUuid: string;
  groupUuid: string;
  groupName: string;
  members: Member[];
}

export default function GroupMembersClient({
  userUuid,
  groupUuid,
  groupName,
  members,
}: GroupMembersClientProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberList, setMemberList] = useState<Member[]>(members);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const { message, messageKind, flash, resetFlash } = useFlashMessage();

  const toggleMemberSelection = (userUuid: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userUuid)) {
      newSelected.delete(userUuid);
    } else {
      newSelected.add(userUuid);
    }
    setSelectedMembers(newSelected);
  };

  const handleAddFriends = async () => {
    if (selectedMembers.size === 0) {
      flash('error', 'Please select members to add as friends.');
      return;
    }

    const selectedUserUuids = Array.from(selectedMembers);
    setIsLoading(true);
    try {
      const result = await sendFriendRequestsToMembersAction({
        requesterUuid: userUuid,
        recipientUuids: selectedUserUuids,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to send friend requests.');
        return;
      }

      flash('success', result.message || `Friend requests sent to ${selectedUserUuids.length} member(s)`);
      setSelectedMembers(new Set());
    } catch (err) {
      console.error('Error sending friend requests:', err);
      flash('error', 'Failed to send friend requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMembers = async () => {
    if (selectedMembers.size === 0) {
      flash('error', 'Please select members to remove.');
      return;
    }

    const selectedUserUuids = Array.from(selectedMembers);
    setIsLoading(true);
    try {
      const result = await removeMembersFromGroupAction({
        groupUuid,
        memberUuids: selectedUserUuids,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to remove members.');
        return;
      }

      // Update the member list
      const updatedMembers = memberList.filter(
        (m) => !selectedUserUuids.includes(String(m.user_uuid))
      );
      setMemberList(updatedMembers);

      flash('success', `Removed ${selectedUserUuids.length} member(s) from the group`);
      setSelectedMembers(new Set());
    } catch (err) {
      console.error('Error removing members:', err);
      flash('error', 'Failed to remove members.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFlash();
    setError('');

    const email = emailInput.trim().toLowerCase();

    if (!email) {
      setError('Please enter an email address.');
      return;
    }

    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    // Check if email belongs to a current member
    const isMember = memberList.some((m) => m.email.toLowerCase() === email);
    if (isMember) {
      setError('This person is already a member of the group.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await addMemberToGroupAction({
        groupUuid,
        recipientEmail: email,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to add member to group.');
        return;
      }

      flash('success', `${email} has been added to the group`);
      setEmailInput('');
      setShowAddForm(false);

      // Update the member list with the new member
      setMemberList([
        ...memberList,
        {
          user_uuid: result.user.user_uuid,
          role: 'member',
          name: result.user.name || email,
          email: result.user.email,
        },
      ]);
    } catch (err) {
      console.error('Error adding member to group:', err);
      flash('error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{groupName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {memberList.length} member{memberList.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-md hover:opacity-90 transition-opacity"
        >
          {showAddForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <form onSubmit={handleAddMember} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member's Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setError('');
                }}
                placeholder="member@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Add an existing user to this group.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {memberList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members in this group yet.</p>
      ) : (
        <>
          <ul className="divide-y rounded-md border">
            {memberList.map((member) => {
              const isSelected = selectedMembers.has(String(member.user_uuid));
              return (
                <li
                  key={String(member.user_uuid)}
                  onClick={() => toggleMemberSelection(String(member.user_uuid))}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMemberSelection(String(member.user_uuid))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide rounded-full bg-indigo-50 text-indigo-600 px-3 py-1">
                    {member.role}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddFriends}
              disabled={selectedMembers.size === 0 || isLoading}
              className="flex-1 px-4 py-2 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
            >
              Add Friend {selectedMembers.size > 0 && `(${selectedMembers.size})`}
            </button>

            <button
              onClick={handleRemoveMembers}
              disabled={selectedMembers.size === 0 || isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Remove {selectedMembers.size > 0 && `(${selectedMembers.size})`}
            </button>
          </div>
        </>
      )}


    </>
  );
}
