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
  Textarea,
} from '@mantine/core';
import {
  IconMicrophone,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconTrash,
  IconNote,
  IconSparkles,
} from '@tabler/icons-react';
import { transcribeAudio } from '@/api/audioApi';
import { createConversation, sendMessage } from '@/api/conversationApi';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useCreateNote } from '@/hooks/useNotes';
import { useOpenNote } from '@/hooks/useOpenNote';
import { notifications } from '@mantine/notifications';

interface TranscriptionModalProps {
  opened: boolean;
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'review' | 'error';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Turn a plain-text transcript into TipTap-compatible paragraph HTML. */
const transcriptToHtml = (text: string): string => {
  const html = text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : ''))
    .join('');
  return html || '<p></p>';
};

/** Derive a short note title from the transcript's opening sentence. */
const deriveTitle = (text: string): string => {
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const clean = firstLine.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Voice memo';
  const sentenceEnd = clean.search(/[.!?]/);
  const cut =
    sentenceEnd > 0 && sentenceEnd < 60 ? clean.slice(0, sentenceEnd) : clean.slice(0, 60);
  return cut.trim() || 'Voice memo';
};

export const TranscriptionModal = ({ opened, onClose, onOpenChat }: TranscriptionModalProps) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [savingNote, setSavingNote] = useState(false);
  const [sendingAgent, setSendingAgent] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // When true, a recorder stop should be discarded rather than transcribed
  // (used for cancel / close / re-record).
  const canceledRef = useRef(false);

  const { data: notebooks } = useNotebooks();
  const createNoteMutation = useCreateNote();
  const { openNote } = useOpenNote();

  // Reset everything whenever the modal is closed so it reopens fresh in idle.
  useEffect(() => {
    if (!opened) {
      cleanup();
      setState('idle');
      setTranscription('');
      setError('');
      setSavingNote(false);
      setSendingAgent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const cleanup = () => {
    // Discard any in-flight recording rather than transcribing it.
    canceledRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioChunksRef.current = [];
    setRecordingTime(0);
    setAudioLevel(0);
  };

  const startRecording = async () => {
    try {
      setError('');
      canceledRef.current = false;
      audioChunksRef.current = [];

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

      visualizeAudio();

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (canceledRef.current) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob, mimeType);
      };

      mediaRecorder.start();
      setRecordingTime(0);
      setState('recording');

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
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      canceledRef.current = false;
      mediaRecorderRef.current.stop();
      setState('processing');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
        setTranscription(response.transcription ?? '');
        setState('review');
      } else {
        throw new Error(response.message || 'Transcription failed');
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to transcribe audio. Please try again.'
      );
      setState('error');
    }
  };

  const handleSendToAgent = async () => {
    const text = transcription.trim();
    if (!text) return;

    setSendingAgent(true);
    try {
      // The backend system prompt already supplies the current date and the full
      // tool catalogue, so the agent just needs the raw transcript as the message.
      const conversation = await createConversation();
      await sendMessage(conversation.id, text);
      onOpenChat(conversation.id);
      onClose();
    } catch (err) {
      console.error('Error sending transcript to agent:', err);
      notifications.show({
        title: 'AI Assistant Unavailable',
        message: 'Could not reach the assistant. Your transcript is still here.',
        color: 'yellow',
      });
      setSendingAgent(false);
    }
  };

  const handleSaveAsNote = async () => {
    const text = transcription.trim();
    if (!text) return;

    const notebook = notebooks?.find((nb) => nb.isDefault) ?? notebooks?.[0];
    if (!notebook) {
      notifications.show({
        title: 'No notebook found',
        message: 'Create a notebook first, then save your transcript as a note.',
        color: 'red',
      });
      return;
    }

    setSavingNote(true);
    try {
      const note = await createNoteMutation.mutateAsync({
        notebookId: notebook.id,
        note: { title: deriveTitle(text), content: transcriptToHtml(text) },
      });
      notifications.show({
        title: 'Note created',
        message: 'Your voice memo was saved as a note.',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
      openNote(note.id, note.title);
      onClose();
    } catch (err) {
      console.error('Error saving transcript as note:', err);
      notifications.show({
        title: 'Could not save note',
        message: 'Something went wrong saving your note. Please try again.',
        color: 'red',
      });
      setSavingNote(false);
    }
  };

  const handleReRecord = () => {
    cleanup();
    setTranscription('');
    setError('');
    startRecording();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const title =
    state === 'recording'
      ? 'Recording…'
      : state === 'processing'
      ? 'Transcribing…'
      : state === 'review'
      ? 'Review transcript'
      : state === 'error'
      ? 'Error'
      : 'Voice memo';

  const busy = savingNote || sendingAgent;
  const hasText = transcription.trim().length > 0;

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg" centered>
      <Stack gap="md">
        {state === 'idle' && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <ActionIcon
                onClick={startRecording}
                variant="filled"
                color="red"
                radius="xl"
                size={88}
                aria-label="Start recording"
              >
                <IconMicrophone size={40} />
              </ActionIcon>
              <Text c="dimmed">Tap to start recording</Text>
            </Stack>
          </Center>
        )}

        {state === 'recording' && (
          <>
            <Center>
              <Stack align="center" gap="xs">
                <Box style={{ position: 'relative', width: 80, height: 80 }}>
                  <Box
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      backgroundColor: 'red',
                      opacity: 0.2,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                  <Center style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <IconMicrophone size={40} color="red" />
                  </Center>
                </Box>
                <Text size="xl" fw={600}>
                  {formatTime(recordingTime)}
                </Text>
              </Stack>
            </Center>

            {/* Audio level visualization */}
            <Center>
              <Group gap="xs">
                {[...Array(20)].map((_, i) => (
                  <Box
                    key={i}
                    style={{
                      width: 4,
                      height: audioLevel > i / 20 ? 30 * (1 + audioLevel) : 10,
                      backgroundColor:
                        audioLevel > i / 20
                          ? 'var(--mantine-color-blue-6)'
                          : 'var(--mantine-color-gray-3)',
                      borderRadius: 2,
                      transition: 'height 0.1s ease',
                    }}
                  />
                ))}
              </Group>
            </Center>

            <Button
              leftSection={<IconPlayerStop size={18} />}
              onClick={stopRecording}
              color="red"
              size="lg"
              fullWidth
            >
              Stop &amp; transcribe
            </Button>
            <Button variant="subtle" color="gray" onClick={onClose}>
              Cancel
            </Button>
          </>
        )}

        {state === 'processing' && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text>Transcribing your recording…</Text>
            </Stack>
          </Center>
        )}

        {state === 'review' && (
          <>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.currentTarget.value)}
              autosize
              minRows={4}
              maxRows={14}
              placeholder="Your transcript will appear here. Edit it before saving or sending."
              disabled={busy}
            />

            <Group justify="space-between" align="center">
              <Group gap="xs">
                <CopyButton value={transcription}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'} withArrow>
                      <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        variant="subtle"
                        onClick={copy}
                        size="lg"
                        disabled={!hasText}
                        aria-label="Copy transcript"
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                <Tooltip label="Discard and record again" withArrow>
                  <ActionIcon
                    color="gray"
                    variant="subtle"
                    onClick={handleReRecord}
                    size="lg"
                    disabled={busy}
                    aria-label="Re-record"
                  >
                    <IconMicrophone size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Discard" withArrow>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={onClose}
                    size="lg"
                    disabled={busy}
                    aria-label="Discard transcript"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group gap="xs">
                <Button
                  variant="light"
                  leftSection={<IconNote size={18} />}
                  onClick={handleSaveAsNote}
                  loading={savingNote}
                  disabled={!hasText || sendingAgent}
                >
                  Save as note
                </Button>
                <Button
                  leftSection={<IconSparkles size={18} />}
                  onClick={handleSendToAgent}
                  loading={sendingAgent}
                  disabled={!hasText || savingNote}
                >
                  Send to agent
                </Button>
              </Group>
            </Group>
          </>
        )}

        {state === 'error' && error && (
          <>
            <Alert color="red" icon={<IconAlertCircle size={18} />} title="Error">
              {error}
            </Alert>
            <Group justify="flex-end">
              <Button onClick={onClose} variant="subtle" color="gray">
                Close
              </Button>
              <Button onClick={startRecording}>Try again</Button>
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
