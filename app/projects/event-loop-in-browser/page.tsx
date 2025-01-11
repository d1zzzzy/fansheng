"use client";

import {useRef, useState, useCallback, useEffect, useLayoutEffect} from "react";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import PlayCircleFilledWhiteRoundedIcon from "@mui/icons-material/PlayCircleFilledWhiteRounded";

import "@/styles/event-loop-page.scss";

const initialCode = `
console.log("Start");

setTimeout(() => {
  console.log("setTimeout Task");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise Microtask");
});

fetch("https://jsonplaceholder.typicode.com/todos/1")
  .then(() => console.log("Fetch Microtask"));

console.log("End");
`;

export default function EventLoopInBrowser() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const callStackRef = useRef<HTMLDivElement | null>(null);
  const microQueueContainerRef = useRef<HTMLDivElement | null>(null);
  const macroQueueContainerRef = useRef<HTMLDivElement | null>(null);
  const executionLogContainerRef = useRef<HTMLDivElement | null>(null);

  const state = EditorState.create({
    doc: initialCode,
    extensions: [basicSetup, javascript()],
  });
  const [editorState] = useState(state);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const callStack = useRef<string[]>([]);
  const microtasks = useRef<Callback[]>([]);
  const macrotasks = useRef<Callback[]>([]);
  const logs = useRef<Log[]>([]);

  const timersRef = useRef<NodeJS.Timeout[]>([]); // 存储定时器 ID，方便清理
  // const eventLoopRunningRef = useRef(false); // 防止重复启动事件循环

  const executeCode = useCallback(() => {
    // 如果已经启动过事件循环，则清除数据
    logs.current = [];
    macrotasks.current = [];
    microtasks.current = [];
    timersRef.current.forEach(clearTimeout);

    const sandbox = {
      setTimeout: (callback: NormalCallback) => {
        macrotasks.current = [
          ...macrotasks.current,
          { message: "setTimeout", callback, source: "setTimeout" },
        ];
      },
      fetch: (...args: Parameters<typeof fetch>) => {
        return {
          then: (callback: NormalCallback) => {
            macrotasks.current = [
              ...macrotasks.current,
              {
                message: `fetch(${args[0]})`,
                callback: () => {
                  microtasks.current = [
                    ...microtasks.current,
                    { message: "fetch.then", callback, source: "fetch.then" },
                  ];
                },
                source: "fetch",
              },
            ];
          },
        };
      },
      Promise: {
        resolve: () => ({
          then: (callback: NormalCallback) => {
            microtasks.current = [
              ...microtasks.current,
              { message: "Promise.then", callback, source: "Promise" },
            ];
          },
        }),
      },
      console: {
        log: (message: string) => {
          callStack.current = [...callStack.current, "console.log"];
          logs.current = [
            ...logs.current,
            { message, type: "sync", source: "console" },
          ];
        },
      },
    };

    const execute = new Function(
      "setTimeout",
      "fetch",
      "Promise",
      "console",
      initialCode
    );

    execute(sandbox.setTimeout, sandbox.fetch, sandbox.Promise, sandbox.console);

    console.log('========> 执行完毕');
    console.log(microtasks, macrotasks, logs);
    eventLoop();
  }, []);

  // 更新 UI
  const updateCallStackUI = () => {
    if (!callStackRef.current) return;
    callStackRef.current.innerHTML = "";
    callStack.current.forEach((fn) => {
      const div = document.createElement("div");
      div.textContent = fn;
      div.className = "stack-item";
      callStackRef.current!.appendChild(div);
    });
  };

  const updateQueueUI = () => {
    if (!microQueueContainerRef.current || !macroQueueContainerRef.current) return;

    microQueueContainerRef.current!.innerHTML = "";
    macroQueueContainerRef.current!.innerHTML = "";

    microtasks.current.forEach((task, index) => {
      const div = document.createElement("div");
      div.textContent = `Microtask ${index + 1}: ${task.message}`;
      div.className = "task micro";
      microQueueContainerRef.current!.appendChild(div);
    });

    macrotasks.current.forEach((task, index) => {
      const div = document.createElement("div");
      div.textContent = `Macrotask ${index + 1}: ${task.message}`;
      div.className = "task macro";
      macroQueueContainerRef.current!.appendChild(div);
    });
  };

  const updateLogUI = () => {
    if (!executionLogContainerRef.current) return;

    executionLogContainerRef.current!.innerHTML = "";

    logs.current.forEach((log) => {
      const div = document.createElement("div");
      div.textContent = log.message;
      div.className = `task ${log.type}`;
      executionLogContainerRef.current!.appendChild(div);
    });
  };

  const eventLoop = () => {
    // 查看调用栈
    callStack.current.forEach((message) => {
      logs.current = [
        ...logs.current,
        { message, type: "async", source: "callStack" },
      ];

      updateCallStackUI();
      updateLogUI();
    });

    // 执行微任务
    microtasks.current.forEach(({ message, callback }) => {
      logs.current = [
        ...logs.current,
        { message, type: "async", source: "microtasks" },
      ];
      callback();

      updateQueueUI();
    });
    microtasks.current = [];

    // 执行宏任务
    macrotasks.current.forEach(({ message, callback }) => {
      logs.current = [
        ...logs.current,
        { message, type: "async", source: "macrotasks" },
      ];
      callback();

      updateQueueUI();
    });
    macrotasks.current = [];

    // 执行定时器
    timersRef.current.forEach((timer) => {
      logs.current = [
        ...logs.current,
        { message: "setTimeout", type: "async", source: "timers" },
      ];
      clearTimeout(timer);

      updateQueueUI();
    });
    timersRef.current = [];
  };

  useLayoutEffect(() => {
    if (!editorRef.current) return;
    const editor = new EditorView({
      state: editorState,
      parent: editorRef.current,
    });
    setEditorView(editor);
  }, [editorState]);

  useEffect(() => {
    return () => {
      editorView?.destroy();
      timersRef.current.forEach(clearTimeout);
    };
  }, [editorView]);

  return (
    <main className="page p-24 border-box">
      <h1 className="text-4xl font-bold text-center">Event Loop in Browser</h1>
      <section className="content mx-auto grid grid-col-2 gap-16 p-t-12">
        <div className="relative shadow-sm rounded-lg p-12">
          <div ref={editorRef} />
          <PlayCircleFilledWhiteRoundedIcon
            className="absolute pointer right-40 bottom-40"
            titleAccess="Run Code"
            onClick={executeCode}
          />
        </div>
        <div className="preview-box shadow-sm rounded-lg p-12">
          <section className="execute-section call-stack">
            <p className="execute-title">Call Stack</p>
            <div className="execute-content" ref={callStackRef}></div>
          </section>
          <section className="grid grid-col-2 gap-16 mt-24">
            <section className="execute-section task">
              <p className="execute-title">Macro Task</p>
              <div className="execute-content" ref={macroQueueContainerRef}></div>
            </section>
            <section className="execute-section micro-task">
              <p className="execute-title">Micro Task</p>
              <div className="execute-content" ref={microQueueContainerRef}></div>
            </section>
          </section>
          <section className="execute-log mt-24">
            <p className="execute-title">Logs</p>
            <div className="execute-content" ref={executionLogContainerRef}></div>
          </section>
        </div>
      </section>
    </main>
  );
}

interface Callback {
  message: string;
  callback: NormalCallback | (() => void);
  source: string;
}

interface Log {
  message: string;
  type: string;
  source: string;
}

type NormalCallback = (value?: never) => void;
