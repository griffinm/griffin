import { UserContext } from '@/providers/UserProvider/UserContext';
import { Alert, TextInput, PasswordInput, Button } from '@mantine/core';
import { useContext, useState } from 'react';

export function LogInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { login, loading, messages } = useContext(UserContext);
    
  const allErrors = [
    ...validationErrors,
    ...messages
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors([]);
    
    // Basic validation
    const errors: string[] = [];
    if (!email.trim()) {
      errors.push('Email is required');
    }
    if (!password.trim()) {
      errors.push('Password is required');
    }
    if (!email.includes('@')) {
      errors.push('Please enter a valid email address');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await login({ email: email.trim(), password });
      // Success is handled by UserContext
    } catch (error) {
      // Error is handled by UserContext
      console.error('Login error:', error);
    }
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {allErrors.length > 0 && (
          <Alert color="red" title="Error">
            <ul className="list-disc list-inside">
              {allErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        
        <TextInput 
          label="Email" 
          placeholder="Email" 
          type="email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <PasswordInput 
          label="Password" 
          placeholder="Password" 
          type="password" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="mt-3 justify-end flex">
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Logging In...' : 'Log In'}
          </Button>
        </div>
      </form>
    </div>
  );
}
