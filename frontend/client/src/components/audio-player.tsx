import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2, Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  isConnected: boolean;
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export function AudioPlayer({ 
  isConnected, 
  isMuted, 
  volume, 
  onToggleMute, 
  onVolumeChange 
}: AudioPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioQueue, setAudioQueue] = useState<Float32Array[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web Audio API
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = volume / 100;
        
        setIsInitialized(true);
        console.log('Audio context initialized');
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  // Process incoming audio data
  const processAudioData = async (audioData: Float32Array, sampleRate: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      await initializeAudio();
      if (!audioContextRef.current || !gainNodeRef.current) return;
    }

    try {
      // Create audio buffer from incoming data
      const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      channelData.set(audioData);

      // Add to queue for continuous playback
      setAudioQueue(prev => [...prev, audioData].slice(-10)); // Keep last 10 chunks

      // Play audio if not already playing
      if (!isPlaying && !isMuted) {
        playAudioBuffer(audioBuffer);
      }
    } catch (error) {
      console.error('Failed to process audio data:', error);
    }
  };

  // Play audio buffer
  const playAudioBuffer = (audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    try {
      // Stop previous source if exists
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }

      // Create and play new source
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.connect(gainNodeRef.current);
      
      sourceNodeRef.current.onended = () => {
        setIsPlaying(false);
        // Play next chunk from queue if available
        if (audioQueue.length > 0 && !isMuted) {
          const nextChunk = audioQueue[0];
          setAudioQueue(prev => prev.slice(1));
          
          const nextBuffer = audioContextRef.current!.createBuffer(1, nextChunk.length, 44100);
          nextBuffer.getChannelData(0).set(nextChunk);
          playAudioBuffer(nextBuffer);
        }
      };

      sourceNodeRef.current.start();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (volume / 100) * (isMuted ? 0 : 1);
    }
  }, [volume, isMuted]);

  // Handle mute toggle
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (volume / 100) * (isMuted ? 0 : 1);
    }
    
    if (isMuted && sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      setIsPlaying(false);
    }
  }, [isMuted, volume]);

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
    
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Expose audio processing function for WebSocket integration
  (window as any).processAudioData = processAudioData;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleMute}
        className="h-8 w-8 p-0"
        data-testid="audio-toggle"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {isInitialized ? (
          <>
            <span className="text-green-500">●</span>
            <span>Audio Active</span>
          </>
        ) : (
          <>
            <span className="text-red-500">●</span>
            <span>Audio Inactive</span>
          </>
        )}
      </div>
    </div>
  );
}
