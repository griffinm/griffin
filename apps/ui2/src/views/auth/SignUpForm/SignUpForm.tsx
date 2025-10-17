import { ErrorDisplay } from '@/components/ErrorDisplay/ErrorDisplay';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { TextInput, PasswordInput, Button, Anchor, Text } from '@mantine/core';
import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUrl } from '@/constants/urls';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { signUp, loading, messages } = useContext(UserContext);
  const navigate = useNavigate();
    
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
    if (!firstName.trim()) {
      errors.push('First name is required');
    }
    if (!password.trim()) {
      errors.push('Password is required');
    }
    if (!confirmPassword.trim()) {
      errors.push('Please confirm your password');
    }
    if (!email.includes('@')) {
      errors.push('Please enter a valid email address');
    }
    if (firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    }
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await signUp({ 
        email: email.trim(), 
        firstName: firstName.trim(),
        password 
      });
      // Navigate to dashboard on successful sign up
      navigate(getUrl('dashboard').path());
    } catch (error) {
      // Error is handled by UserContext
      console.error('Sign up error:', error);
    }
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <ErrorDisplay errors={allErrors} title="Oops! Something went wrong." />
        
        <TextInput 
          label="First Name" 
          placeholder="First Name" 
          required 
          autoFocus
          value={firstName} 
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
        />
        
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
        
        <PasswordInput 
          label="Confirm Password" 
          placeholder="Confirm Password" 
          type="password" 
          required 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
        
        <div className="mt-3 justify-between flex items-center gap-2">
          <div className="text-center">
            <Text size="sm" c="dimmed">
              Already have an account?{' '}
              <Anchor component={Link} to={getUrl('login').path()}>
                Log in
              </Anchor>
            </Text>
          </div>
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </div>
        

      </form>
    </div>
  );
}
