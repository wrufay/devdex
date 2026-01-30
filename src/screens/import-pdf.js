import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { importPdf } from '../claude/pdf-import.js';

export default function ImportPdf({ onBack }) {
  const [filePath, setFilePath] = useState('');
  const [status, setStatus] = useState('input'); // input | loading | success | error
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
    if (status === 'success' || status === 'error') {
      if (key.return) onBack();
    }
  });

  const handleSubmit = async (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setStatus('loading');
    try {
      const res = await importPdf(trimmed, (msg) => setProgressMsg(msg));
      setResult(res);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="single" borderColor="blue" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">Import PDF</Text>
      </Box>

      {status === 'input' && (
        <Box flexDirection="column">
          <Text color="gray">Enter the path to your PDF file:</Text>
          <Box marginTop={1}>
            <Text color="green">&gt; </Text>
            <TextInput
              value={filePath}
              onChange={setFilePath}
              onSubmit={handleSubmit}
              placeholder="/path/to/lecture.pdf"
            />
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>Press ESC to go back</Text>
          </Box>
        </Box>
      )}

      {status === 'loading' && (
        <Box flexDirection="column">
          <Box>
            <Text color="yellow"><Spinner type="dots" /> </Text>
            <Text>{progressMsg || 'Processing...'}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>This may take a moment while Claude analyzes your PDF...</Text>
          </Box>
        </Box>
      )}

      {status === 'success' && result && (
        <Box flexDirection="column">
          <Text color="green" bold>Import successful!</Text>
          <Box marginTop={1} flexDirection="column">
            <Text>Topic: <Text bold>{result.topic}</Text></Text>
            <Text color="cyan">  Flashcards: {result.counts.flashcards}</Text>
            <Text color="magenta">  MCQ Questions: {result.counts.mcq}</Text>
            <Text color="yellow">  Deep Questions: {result.counts.elaboration}</Text>
            <Text bold>  Total: {result.counts.total} cards</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="green">+50 XP earned!</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Press Enter to continue</Text>
          </Box>
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Text color="red" bold>Import failed</Text>
          <Text color="red">{error}</Text>
          <Box marginTop={1}>
            <Text color="gray">Press Enter to go back</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
