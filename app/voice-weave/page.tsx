'use client';

import { useCallback, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { IconButton } from '@mui/material';
import KeyboardVoiceRoundedIcon from '@mui/icons-material/KeyboardVoiceRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';

import { useAudioAnalyzer } from './useAudio';
import { useWebGL } from './useWebgl';

import "@/styles/voice-weave.scss";

const vertexShaderSource = `
  attribute float position;
  uniform float time;
  uniform vec2 resolution;
  uniform float amplitudes[256];
  varying float vAmplitude;

  void main() {
    float x = (position / 256.0) * 2.0 - 1.0;
    // 10 是拉伸 y 轴的倍数
    float y = (amplitudes[int(position)] * 20.0) / 128.0 - 0.5;
    vAmplitude = amplitudes[int(position)];
    gl_Position = vec4(x, y, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying float vAmplitude;
  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color * vAmplitude, 1.0);
  }
`;

export default function VoiceWeave() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { getAudioData, startRecording, stopRecording } = useAudioAnalyzer();
    const { getGLContext } = useWebGL(canvasRef);
    const [isRecording, setIsRecording] = useState(false);

    const RecordIcon = isRecording
        ? <GraphicEqRoundedIcon />
        : <KeyboardVoiceRoundedIcon />;

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
        await stopRecording();
    } else {
        await startRecording();
    }

    setIsRecording(prev => !prev);
  }, [isRecording, startRecording, stopRecording]);

  
  const renderCallback = useCallback(() => {
    const gl = getGLContext();
    if (!gl || !isRecording) return;

    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    if (!program) return;

    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const colorLocation = gl.getUniformLocation(program, 'color');
    const amplitudesLocation = gl.getUniformLocation(program, 'amplitudes');

    const audioData = getAudioData();

    if (!audioData) return;

    const amplitudes = Array.from(audioData).map((value) => value / 255.0);

    gl.uniform1fv(amplitudesLocation, amplitudes);

    const time = performance.now() / 1000;
    gl.uniform1f(timeLocation, time);
    gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform3f(colorLocation, 0.3, 1.0, 0.8);

    gl.clear(gl.COLOR_BUFFER_BIT);


    const positions = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) positions[i] = i;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, audioData.length);

    if (isRecording) requestAnimationFrame(renderCallback);
  }, [getAudioData, getGLContext, isRecording]);

  useLayoutEffect(() => {
    const gl = getGLContext();
    if (!gl) return;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        console.error('Shader compile failed with:', info);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      console.error('Program linking failed with:', info);
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = new Float32Array(256); 
    for (let i = 0; i < 256; i++) positions[i] = i;
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 1, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
  }, [getGLContext]);

  useEffect(() => {
    if (isRecording) requestAnimationFrame(renderCallback);
  }, [isRecording, renderCallback]);

    return (
        <article className="voice-weave w-full h-full">
            <canvas ref={canvasRef} id="canvas"></canvas>

            <IconButton className="pointer record-btn" color='primary' onClick={toggleRecording}>
                { RecordIcon }
            </IconButton>
        </article>
    )
}
