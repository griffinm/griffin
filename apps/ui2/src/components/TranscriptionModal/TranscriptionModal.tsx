import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Center,
  Loader,
  Alert,
  Group,
  ActionIcon,
  CopyButton,
  Tooltip,
  Box,
} from '@mantine/core';
import {
  IconMicrophone,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { transcribeAudio } from '@/api/audioApi';
import { createConversation, sendMessage } from '@/api/conversationApi';
import { notifications } from '@mantine/notifications';

interface TranscriptionModalProps {
  opened: boolean;
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error';

export const TranscriptionModal = ({ opened, onClose, onOpenChat }: TranscriptionModalProps) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Start recording when modal opens
  useEffect(() => {
    if (opened && state === 'idle') {
      startRecording();
    }
  }, [opened]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!opened) {
      cleanup();
    }
  }, [opened]);

  const cleanup = () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset state
    audioChunksRef.current = [];
    setRecordingTime(0);
    setAudioLevel(0);
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for waveform visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualizing audio levels
      visualizeAudio();

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob, mimeType);
      };

      mediaRecorder.start();
      setState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access and try again.'
          : 'Failed to start recording. Please check your microphone and try again.'
      );
      setState('error');
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalized = average / 255; // Normalize to 0-1
      
      setAudioLevel(normalized);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState('processing');
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processAudio = async (audioBlob: Blob, mimeType: string) => {
    try {
      const response = await transcribeAudio(audioBlob, {
        filename: `recording-${Date.now()}.${mimeType.split('/')[1]}`,
        mimeType,
        duration: recordingTime,
        responseFormat: 'json',
      });

      if (response.success) {
        setTranscription(response.transcription);
        setState('success');
        notifications.show({
          title: 'Transcription Complete',
          message: 'Your audio has been successfully transcribed',
          color: 'green',
          icon: <IconCheck size={18} />,
        });

        // Automatically send transcription to LLM
        processWithLLM(response.transcription);
      } else {
        throw new Error(response.message || 'Transcription failed');
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to transcribe audio. Please try again.'
      );
      setState('error');
      notifications.show({
        title: 'Transcription Failed',
        message: 'Failed to transcribe audio. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
      });
    }
  };

  const processWithLLM = async (transcriptionText: string) => {
    try {
      // Show processing notification
      const processingNotification = notifications.show({
        title: 'Processing with AI Assistant',
        message: 'Analyzing your voice note...',
        color: 'blue',
        loading: true,
        autoClose: false,
      });

      // Get current date/time information for context
      const now = new Date();
      const currentDateTime = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      const isoDateTime = now.toISOString();

      // Construct context message with current date/time
      const contextMessage = `Current date and time: ${currentDateTime} (ISO: ${isoDateTime})

This is a voice note transcription:

${transcriptionText}

---

Available tools you can use:
- create_task: Create a new task with title, description, due date (in ISO 8601 format), and priority
- search_tasks: Search and filter tasks by status, due date, priority, or text search
- update_task: Update an existing task (mark as complete, change status, etc.)
- get_task: Look up and display detailed information about a specific task

Note: When the user mentions relative dates like "tomorrow", "next week", or "in 3 days", calculate the actual date based on the current date/time provided above.`;

      // Create conversation (title will be auto-generated after first message)
      const conversation = await createConversation();

      // Send message to LLM
      const messageResponse = await sendMessage(conversation.id, contextMessage);

      // Hide processing notification
      notifications.hide(processingNotification);

      // Check if an action was taken
      if (messageResponse.actionTaken) {
        // Action was taken (e.g., task created), show notification only
        notifications.show({
          title: 'Action Completed',
          message: messageResponse.aiMessage.content,
          color: 'teal',
          autoClose: 8000,
          icon: <IconCheck size={18} />,
        });
      } else {
        // No action taken, open chat drawer for conversation
        onOpenChat(conversation.id);
        onClose(); // Close transcription modal
      }
    } catch (err) {
      console.error('Error processing with LLM:', err);
      
      // Show subtle error notification - don't disrupt user experience
      notifications.show({
        title: 'AI Assistant Unavailable',
        message: 'Could not process with AI assistant, but your transcription was saved.',
        color: 'yellow',
        autoClose: 5000,
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    cleanup();
    setState('idle');
    setTranscription('');
    setError('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        state === 'recording'
          ? 'Recording...'
          : state === 'processing'
          ? 'Transcribing...'
          : state === 'success'
          ? 'Transcription Complete'
          : state === 'error'
          ? 'Error'
          : 'Voice Transcription'
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        {state === 'recording' && (
          <>
            <Center>
              <Stack align="center" gap="xs">
                <Box
                  style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                  }}
                >
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '50%',
                      backgroundColor: 'red',
                      opacity: 0.2,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                  <Center
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <IconMicrophone size={40} color="red" />
                  </Center>
                </Box>
                <Text size="xl" fw={600}>
                  {formatTime(recordingTime)}
                </Text>
              </Stack>
            </Center>

            {/* Audio level visualization */}
            <Box>
              <Center>
                <Group gap="xs">
                  {[...Array(20)].map((_, i) => (
                    <Box
                      key={i}
                      style={{
                        width: 4,
                        height: audioLevel > i / 20 ? 30 * (1 + audioLevel) : 10,
                        backgroundColor: audioLevel > i / 20 ? '#228be6' : '#dee2e6',
                        borderRadius: 2,
                        transition: 'height 0.1s ease',
                      }}
                    />
                  ))}
                </Group>
              </Center>
            </Box>

            <Button
              leftSection={<IconPlayerStop size={18} />}
              onClick={stopRecording}
              color="red"
              size="lg"
              fullWidth
            >
              Stop Recording
            </Button>
          </>
        )}

        {state === 'processing' && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text>Transcribing your recording...</Text>
            </Stack>
          </Center>
        )}

        {state === 'success' && transcription && (
          <>
            <Alert color="green" icon={<IconCheck size={18} />}>
              Your audio has been successfully transcribed
            </Alert>

            <Box
              p="md"
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #dee2e6',
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              <Text>{transcription}</Text>
            </Box>

            <Group justify="space-between">
              <CopyButton value={transcription}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
                    <ActionIcon
                      color={copied ? 'teal' : 'blue'}
                      variant="light"
                      onClick={copy}
                      size="lg"
                    >
                      {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>

              <Button onClick={handleClose}>Close</Button>
            </Group>
          </>
        )}

        {state === 'error' && error && (
          <>
            <Alert color="red" icon={<IconAlertCircle size={18} />} title="Error">
              {error}
            </Alert>

            <Group justify="flex-end">
              <Button onClick={handleClose} variant="light">
                Close
              </Button>
              <Button
                onClick={() => {
                  setState('idle');
                  setError('');
                  startRecording();
                }}
              >
                Try Again
              </Button>
            </Group>
          </>
        )}
      </Stack>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }
      `}</style>
    </Modal>
  );
};

