import { useState, FormEvent } from 'react';
import { PasswordInput, Button, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUpdateProfile } from '@/hooks/useAuth';
import { User } from '@/types';

interface PasswordFormProps {
  user?: User;
  onSuccess?: () => void;
}

export function PasswordForm({ user, onSuccess }: PasswordFormProps) {
  const updateProfileMutation = useUpdateProfile();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'All password fields are required.',
        color: 'red',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Passwords do not match.',
        color: 'red',
      });
      return;
    }

    if (newPassword.length < 8) {
      notifications.show({
        title: 'Validation Error',
        message: 'Password must be at least 8 characters long.',
        color: 'red',
      });
      return;
    }

    try {
      // Include email (required by backend) and firstName when changing password
      await updateProfileMutation.mutateAsync({
        email: user?.email || '',
        firstName: user?.firstName,
        password: newPassword,
      });

      notifications.show({
        title: 'Success',
        message: 'Password changed successfully!',
        color: 'green',
      });

      // Clear password fields
      setNewPassword('');
      setConfirmPassword('');

      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to change password. Please try again.',
        color: 'red',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        <PasswordInput
          label="New Password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Group justify="flex-end">
          <Button
            type="submit"
            loading={updateProfileMutation.isPending}
            disabled={!newPassword || !confirmPassword}
            color="blue"
          >
            Change Password
          </Button>
        </Group>
      </Stack>
    </form>
  );
}


