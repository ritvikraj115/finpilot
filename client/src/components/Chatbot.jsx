// client/src/components/Chatbot.jsx

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import api from "../utils/api";

const Container = styled.div`
  /* Mobile: full width, almost full viewport height */
  width: 100%;
  height: calc(100vh - 60px);  /* adjust if you have a navbar of different height */
  display: flex;
  flex-direction: column;
  background: #ffffff;

  /* Desktop: centered card */
  @media (min-width: 600px) {
    max-width: 600px;
    margin: 2rem auto;
    height: 70vh;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
`;

const Header = styled.div`
  background-color: #0070f3;
  padding: 1rem;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 1rem;
  min-height: 0; /* allow flex children to shrink properly on mobile */

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const MessageBubble = styled.div`
  max-width: 75%;
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  background-color: ${({ from }) =>
    from === "bot" ? "#e0e7ff" : "#d1fae5"};
  color: #1e293b;
  align-self: ${({ from }) =>
    from === "bot" ? "flex-start" : "flex-end"};
  font-size: 0.95rem;
  line-height: 1.4;

  @media (max-width: 480px) {
    max-width: 100%;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
  }
`;

const InputFooter = styled.form`
  display: flex;
  padding: 0.5rem;
  background: #ffffff;
  flex-shrink: 0;

  @media (max-width: 500px) {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0,112,243,0.2);
  }

  @media (max-width: 500px) {
    padding: 0.6rem 0.8rem;
    font-size: 0.95rem;
  }
`;

const SendButton = styled.button`
  margin-left: 0.5rem;
  padding: 0 1rem;
  background: #0070f3;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;

  &:hover {
    background-color: #005bb5;
  }
  &:active {
    transform: scale(0.97);
  }
  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }

  @media (max-width: 500px) {
    margin-left: 0;
    width: 100%;
    padding: 0.75rem;
  }
`;

export default function Chatbot() {
  // Derive current month (YYYY-MM)
  const today = new Date();
  const [month] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // fetch planner data
    let planner = { month, budget: 0, futureExpenses: [] };
    try {
      const planRes = await api.get(`/planner/${month}`);
      planner = planRes.data;
    } catch (err) {
      console.error("Could not load planner data:", err);
    }

    // add user message
    setMsgs((prev) => [...prev, { from: "you", text: text.trim() }]);
    const messageText = text.trim();
    setText("");
    setSending(true);

    // call advisor
    try {
      const res = await api.post(`/advisor/chat`, {
        message: messageText,
        planner,
      });
      // assume res.data.tips is array of strings
      const reply = Array.isArray(res.data.tips)
        ? res.data.tips.join("\n")
        : res.data.answer || "No response.";
      setMsgs((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMsgs((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Container>
      <Header>Budget AI Assistant</Header>
      <Messages>
        {msgs.map((m, i) => (
          <MessageBubble key={i} from={m.from}>
            <strong>{m.from === "you" ? "You:" : "Assistant:"}</strong>{" "}
            {m.text}
          </MessageBubble>
        ))}
        <div ref={endRef} />
      </Messages>

      <InputFooter onSubmit={send}>
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask your budget assistant..."
          disabled={sending}
        />
        <SendButton type="submit" disabled={!text.trim() || sending}>
          Send
        </SendButton>
      </InputFooter>
    </Container>
  );
}




