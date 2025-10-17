import React from 'react';
import { Button, TextInput, PasswordInput } from '@mantine/core';
import { useState } from 'react';

export function LogInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Log in');
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <TextInput label="Email" placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordInput label="Password" placeholder="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="mt-3 justify-end flex">
          <Button type="submit">Log In</Button>
        </div>
      </form>
    </div>
  );
}
