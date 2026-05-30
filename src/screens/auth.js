import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { supabase } from '../db/connection.js';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('select'); // select | login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [field, setField] = useState('email'); // email | password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useInput((input, key) => {
    if (loading) return;
    if (mode === 'select') return;

    if (key.return) {
      if (field === 'email') {
        setField('password');
        return;
      }
      if (field === 'password') {
        handleSubmit();
      }
    }

    if (key.escape) {
      setMode('select');
      setEmail('');
      setPassword('');
      setField('email');
      setError('');
    }
  });

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        onAuth();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        onAuth();
      }
    }
  };

  if (mode === 'select') {
    return (
      <Box flexDirection="column" paddingX={2} marginTop={2}>
        <Box borderStyle="double" borderColor="blue" paddingX={2} paddingY={0} marginBottom={2}>
          <Text bold color="cyan">Study Terminal</Text>
        </Box>
        <Text bold color="white">Welcome! Please log in or sign up.</Text>
        <Box marginTop={1}>
          <SelectInput
            items={[
              { label: 'Log In', value: 'login' },
              { label: 'Sign Up', value: 'signup' },
            ]}
            onSelect={(item) => setMode(item.value)}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} marginTop={2}>
      <Box borderStyle="double" borderColor="blue" paddingX={2} marginBottom={2}>
        <Text bold color="cyan">{mode === 'login' ? 'Log In' : 'Sign Up'}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={field === 'email' ? 'cyan' : 'gray'}>Email: </Text>
        {field === 'email'
          ? <TextInput value={email} onChange={setEmail} />
          : <Text>{email}</Text>
        }
      </Box>

      <Box marginBottom={1}>
        <Text color={field === 'password' ? 'cyan' : 'gray'}>Password: </Text>
        {field === 'password'
          ? <TextInput value={password} onChange={setPassword} mask="*" />
          : <Text>{password ? '••••••••' : ''}</Text>
        }
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      {loading
        ? <Text color="gray">Loading...</Text>
        : <Text color="gray">Press Enter to continue • ESC to go back</Text>
      }
    </Box>
  );
}
