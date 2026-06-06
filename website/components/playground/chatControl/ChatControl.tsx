"use client";
import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SettingsModal } from "./SettingsModal";
import { z } from "zod";
import {
  getApiKeyFromLocalStorage,
  getBaseURLFromLocalStorage,
  getSystemPromptFromLocalStorage,
  getModelFromLocalStorage,
} from "../../../lib/chatSettings";
import useMeasure from "react-use-measure";
import { panelStyle } from "@/components/playground/panelStyle";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "nvidia/nemotron-voicechat";

type ChatControlProps = {
  robotName?: string;
  systemPrompt?: string;
  onHide: () => void;
  show?: boolean; // 新增 show 属性
};
type MovementAction = {
  key: string;
  duration: number;
  description: string;
};

export function ChatControl({
  robotName,
  systemPrompt: configSystemPrompt,
  onHide,
  show = true,
}: ChatControlProps) {
  const [ref, bounds] = useMeasure();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isKokoroReady, setIsKokoroReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const ttsRef = useRef<any>(null);

  const apiKey = getApiKeyFromLocalStorage();
  const baseURL = getBaseURLFromLocalStorage() || NVIDIA_BASE_URL;
  const model = getModelFromLocalStorage() || NVIDIA_MODEL;
  const systemPrompt =
    getSystemPromptFromLocalStorage(robotName) ||
    configSystemPrompt || // <-- Use configSystemPrompt if present
    `You are a helpful, realistic robot assistant. You can help control a robot by pressing keyboard keys. Use the keyPress tool to simulate key presses. Each key will be held down for 1 second by default. If the user describes roughly wanting to make it longer or shorter, adjust the duration accordingly. Keep your responses conversational, natural, and friendly, like a real robot-human conversation. Be concise and conversational, acknowledging the commands gracefully.`;

  // Create openai instance with current apiKey and baseURL
  const openai = createOpenAI({
    apiKey,
    baseURL,
  });

  useEffect(() => {
    if (bounds.height > 0) {
      setPosition((pos) => ({
        ...pos,
        x: window.innerWidth - bounds.width - 20,
        y: 70,
      }));
    }
  }, [bounds.height]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadKokoro = async () => {
      try {
        const { KokoroTTS } = await import("kokoro-js");
        const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32" });
        if (isMounted) {
          ttsRef.current = tts;
          setIsKokoroReady(true);
        }
      } catch (err) {
        console.error("Failed to load Kokoro TTS:", err);
      }
    };
    if (typeof window !== "undefined") {
      loadKokoro();
    }
    
    setMounted(true);
    
    return () => { isMounted = false; };
  }, []);

  const simulateKeyPress = async (key: string, duration = 1000) => {
    const keydownEvent = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
    });
    window.dispatchEvent(keydownEvent);
    await new Promise((resolve) => setTimeout(resolve, duration));
    const keyupEvent = new KeyboardEvent("keyup", {
      key,
      bubbles: true,
    });
    window.dispatchEvent(keyupEvent);
  };

  const speakText = async (text: string, onReady?: () => void) => {
    if (isMuted || typeof window === "undefined") {
      if (onReady) onReady();
      return;
    }
    
    // Strip out Markdown or symbols for cleaner speech
    const cleanText = text.replace(/[*_#`~]/g, "");

    if (ttsRef.current) {
      try {
        const audio = await ttsRef.current.generate(cleanText, { voice: "af_heart" });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = audioContext.createBuffer(1, audio.audio.length, audio.sampling_rate);
        audioBuffer.getChannelData(0).set(audio.audio);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        if (onReady) onReady();
        source.start();
        return;
      } catch (e) {
        console.error("Kokoro TTS playback failed:", e);
      }
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      if (onReady) {
        utterance.onstart = () => onReady();
      }
      window.speechSynthesis.speak(utterance);
      if (!onReady) return; // Fallback if no callback needed
    } else {
      if (onReady) onReady();
    }
  };

  const extractDurationMs = (command: string) => {
    const secondsMatch = command
      .toLowerCase()
      .match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|s)\b/);
    if (secondsMatch?.[1]) {
      const seconds = Number(secondsMatch[1]);
      if (!Number.isNaN(seconds)) {
        return Math.max(100, Math.min(5000, Math.round(seconds * 1000)));
      }
    }

    const msMatch = command.toLowerCase().match(/(\d+)\s*(milliseconds?|ms)\b/);
    if (msMatch?.[1]) {
      const ms = Number(msMatch[1]);
      if (!Number.isNaN(ms)) {
        return Math.max(100, Math.min(5000, Math.round(ms)));
      }
    }

    return 1000;
  };

  const getSimpleMovementActions = (command: string): MovementAction[] => {
    const normalized = command.toLowerCase();
    const duration = extractDurationMs(normalized);
    const actions: MovementAction[] = [];
    const seenKeys = new Set<string>();

    const mappings: {
      patterns: RegExp[];
      key: string;
      description: string;
    }[] = [
      { patterns: [/\b(rotate|turn|move)\s+left\b/, /\bleft\b/], key: "q", description: "rotate left" },
      { patterns: [/\b(rotate|turn|move)\s+right\b/, /\bright\b/], key: "1", description: "rotate right" },
      { patterns: [/\b(look|move)\s+up\b/, /\bjaw\s+up\b/, /\bup\b/, /\barm\s+up\b/], key: "8", description: "move robot up" },
      { patterns: [/\b(look|move)\s+down\b/, /\bjaw\s+down\b/, /\bdown\b/, /\barm\s+down\b/], key: "i", description: "move robot down" },
      { patterns: [/\bforward\b/], key: "o", description: "move robot forward" },
      { patterns: [/\bbackward\b/, /\bback\b/], key: "u", description: "move robot backward" },
      { patterns: [/\bopen\b/, /\bopen\s+(jaw|gripper|creeper|group|robot|arm)\b/], key: "6", description: "open robot" },
      { patterns: [/\bclose\b/, /\bclose\s+(jaw|gripper|creeper|group|robot|arm)\b/], key: "y", description: "close robot" },
    ];

    mappings.forEach((mapping) => {
      if (
        mapping.patterns.some((pattern) => pattern.test(normalized)) &&
        !seenKeys.has(mapping.key)
      ) {
        seenKeys.add(mapping.key);
        actions.push({
          key: mapping.key,
          duration,
          description: mapping.description,
        });
      }
    });

    return actions;
  };

  const handleCommand = async (command: string) => {
    setMessages((prev) => [...prev, { sender: "User", text: command }]);
    try {
      const simpleActions = getSimpleMovementActions(command);
      if (simpleActions.length > 0) {
        const actionDescriptions = simpleActions
          .map((action) => action.description)
          .join(" and ");
        
        const interactiveResponses = [
          `I'm on it! I've executed the command to ${actionDescriptions}.`,
          `Sure thing! Moving to ${actionDescriptions} now.`,
          `Consider it done. I just performed the ${actionDescriptions} action.`,
          `Got it! Executing ${actionDescriptions} right away.`,
          `Alright, I am processing the ${actionDescriptions} command.`
        ];
        const aiResponse = interactiveResponses[Math.floor(Math.random() * interactiveResponses.length)];
          
        setMessages((prev) => [
          ...prev,
          { sender: "AI", text: aiResponse },
        ]);
        
        // Trigger voice synthesis and execute movements exactly when audio is ready
        const executeMovements = async () => {
          for (const action of simpleActions) {
            await simulateKeyPress(action.key, action.duration);
          }
        };

        speakText(aiResponse, executeMovements);

        return;
      }

      if (!apiKey) {
        setShowSettings(true);
        const errorMsg = "Set your NVIDIA API key in Settings for advanced AI command interpretation.";
        setMessages((prev) => [...prev, { sender: "AI", text: errorMsg }]);
        speakText(errorMsg);
        return;
      }
      const result = await generateText({
        model: openai(model),
        prompt: command,
        system: systemPrompt,
        tools: {
          keyPress: tool({
            description:
              "Press and hold a keyboard key for a specified duration (in milliseconds) to control the robot",
            parameters: z.object({
              key: z
                .string()
                .describe(
                  "The key to press (e.g., 'w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')"
                ),
              duration: z
                .number()
                .int()
                .min(100)
                .max(5000)
                .default(1000)
                .describe(
                  "How long to hold the key in milliseconds (default: 1000, min: 100, max: 5000)"
                ),
            }),
            execute: async ({
              key,
              duration,
            }: {
              key: string;
              duration?: number;
            }) => {
              const holdTime = duration ?? 1000;
              await simulateKeyPress(key, holdTime);
              return `Held key "${key.toUpperCase()}" for ${holdTime} ms`;
            },
          }),
        },
      });
      let text = result.text.trim();
      const content = result.response?.messages[1]?.content;
      for (const element of content ?? []) {
        text += `\n\n${element.result}`;
      }
      setMessages((prev) => [...prev, { sender: "AI", text }]);
      speakText(text);
    } catch (error) {
      console.warn("Error generating text:", error);
      const errorMsg = "Error: Unable to process your request.";
      setMessages((prev) => [...prev, { sender: "AI", text: errorMsg }]);
      speakText(errorMsg);
    }
  };
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: "Voice input is not supported in this browser.",
        },
      ]);
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: `Voice input error: ${event?.error || "unknown error"}`,
        },
      ]);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setInput(transcript);
      handleCommand(transcript);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSend = () => {
    if (input.trim()) {
      handleCommand(input.trim());
      setInput(""); // Clear input after sending
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (!mounted) return null;

  return (
    <Rnd
      position={position}
      onDragStop={(_, d) => setPosition({ x: d.x, y: d.y })}
      bounds="window"
      className="z-50"
      style={{ display: show ? undefined : "none" }}
    >
      <div ref={ref} className={"p-4 w-80 z-50 " + panelStyle}>
        <h4 className="border-b border-white/50  pb-2 font-bold mb-2 flex items-center justify-between">
          <span>AI Control Robot</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              onTouchEnd={() => setShowSettings(true)}
              className="bg-zinc-700 hover:bg-zinc-600 text-white py-1 px-2 rounded text-sm"
            >
              Settings
            </button>
            <button
              onClick={onHide}
              onTouchEnd={onHide}
              className="text-xl hover:bg-zinc-800 px-2 rounded-full"
              title="Collapse"
            >
              ×
            </button>
          </div>
        </h4>
        <div className="mb-2 max-h-[60vh] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                msg.sender === "AI" ? "text-green-400" : "text-blue-400"
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {messages.length > 0 && (
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setMessages([])}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center w-full">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`absolute left-0 p-2 rounded ${
                isMuted
                  ? "bg-red-700 hover:bg-red-600 text-white"
                  : "bg-zinc-700 hover:bg-zinc-600 text-zinc-400"
              }`}
              title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              style={{ zIndex: 10 }}
            >
              {isMuted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M5.88909 3.06066L20.0312 17.2028L18.617 18.617L15.3406 15.3406C14.3912 16.3262 13.2505 17.078 12 17.4878V21H10V17.4878C6.91898 16.6433 4.5 13.8821 4.5 10.5V9H6.5V10.5C6.5 13.1166 8.35122 15.2892 10.8252 15.7001L7.26257 12.1374C6.79375 11.7583 6.5 11.1643 6.5 10.5V7.5L5.88909 6.88909L4.47487 5.47487L5.88909 3.06066ZM12 3C13.6569 3 15 4.34315 15 6V10.5C15 10.9859 14.8841 11.4447 14.6784 11.8532L13.1797 10.3546C13.0645 10.1557 13 9.9238 13 9.68367V6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6V8.17492L9.08053 6.25545C9.37365 4.41724 10.5594 3 12 3ZM19.5 10.5V9H17.5V10.5C17.5 11.7766 17.0425 12.9463 16.2736 13.8569L17.754 15.3372C18.8402 14.0768 19.5 12.3688 19.5 10.5Z"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M13 3C14.6569 3 16 4.34315 16 6V11C16 12.6569 14.6569 14 13 14C11.3431 14 10 12.6569 10 11V6C10 4.34315 11.3431 3 13 3ZM11 6V11C11 12.1046 11.8954 13 13 13C14.1046 13 15 12.1046 15 11V6C15 4.89543 14.1046 4 13 4C11.8954 4 11 4.89543 11 6ZM20 11C20 14.5195 17.386 17.4283 14 17.9207V21H12V17.9207C8.61401 17.4283 6 14.5195 6 11H8C8 13.7614 10.2386 16 13 16C15.7614 16 18 13.7614 18 11H20Z"></path>
                </svg>
              )}
            </button>
            <button
              onClick={handleVoiceInput}
              className={`absolute left-10 p-2 rounded ${
                isListening
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-zinc-700 hover:bg-zinc-600 text-zinc-400"
              }`}
              title={isListening ? "Stop voice input" : "Start voice input"}
              style={{ zIndex: 10 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M12 14C10.3431 14 9 12.6569 9 11V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V11C15 12.6569 13.6569 14 12 14ZM19 11C19 14.5195 16.386 17.4283 13 17.9207V21H11V17.9207C7.61401 17.4283 5 14.5195 5 11H7C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11H19Z"></path>{" "}
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder="Type a command..."
              className="flex-1 pl-20 p-2 rounded bg-zinc-700 text-white outline-none text-sm"
            />
          </div>
        </div>
      </div>
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        robotName={robotName}
        systemPrompt={configSystemPrompt}
      />
    </Rnd>
  );
}
