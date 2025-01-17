import { useRef } from 'react';

export const useAudioAnalyzer = (fftSize: number = 1024) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    if (audioContextRef.current) return;

    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    mediaStreamRef.current = stream;
  };

  const stopRecording = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  const getAudioData = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      return dataArrayRef.current;
    }
    return null;
  };

  return { startRecording, stopRecording, getAudioData };
};
