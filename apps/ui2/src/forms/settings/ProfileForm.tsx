import { useState, useEffect, FormEvent } from 'react';
import { TextInput, Button, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUpdateProfile } from '@/hooks/useAuth';
import { User } from '@/types';

interface ProfileFormProps {
  user?: User;
  onSuccess?: () => void;
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim(),
        email: email.trim(),
      });

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully!',
        color: 'green',
      });

      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        color: 'red',
      });
    }
  };

  const isProfileChanged = 
    user && (firstName !== (user.firstName || '') || email !== (user.email || ''));

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        <TextInput
          label="First Name"
          placeholder="Enter your first name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <TextInput
          label="Email"
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Group justify="flex-end">
          <Button
            type="submit"
            loading={updateProfileMutation.isPending}
            disabled={!isProfileChanged || !firstName.trim() || !email.trim()}
          >
            Save Changes
          </Button>
        </Group>
      </Stack>
    </form>
  );
}


