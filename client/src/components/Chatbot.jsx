// client/src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import api from "../utils/api";

const Container = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 2rem auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 70vh;
  overflow: hidden;

  @media (max-width: 768px) {
    margin: 1rem;
    height: 60vh;
  }
`;

const Header = styled.div`
  background-color: #0070f3;
  padding: 1rem 1.5rem;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;

  @media (max-width: 480px) {
    font-size: 1.1rem;
    padding: 0.75rem 1rem;
  }
`;

const Messages = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #f5f7fa;

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const MessageBubble = styled.div`
  max-width: 75%;
  width: fit-content;
  margin-bottom: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.4;
  background-color: ${({ from }) =>
    from === "bot" ? "#e0e7ff" : "#d1fae5"};
  color: ${({ from }) => (from === "bot" ? "#1e293b" : "#064e3b")};
  align-self: ${({ from }) =>
    from === "bot" ? "flex-start" : "flex-end"};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  @media (max-width: 480px) {
    max-width: 100%;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
  }
`;

const InputFooter = styled.form`
  display: flex;
  border-top: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  background-color: #ffffff;

  @media (max-width: 500px) {
    flex-direction: column;
    padding: 0.5rem;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  margin-right: 0.75rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.25);
  }

  @media (max-width: 500px) {
    margin-right: 0;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    padding: 0.5rem 0.75rem;
  }
`;

const SendButton = styled.button`
  background-color: #0070f3;
  color: #ffffff;
  padding: 0 1.25rem;
  border: none;
  border-radius: 8px;
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
    width: 100%;
    padding: 0.75rem;
    font-size: 0.95rem;
  }
`;

export default function Chatbot() {
  const today = new Date();
  const [month] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    let planner = { month, budget: 0, futureExpenses: [] };
    try {
      const planRes = await api.get(`/planner/${month}`);
      planner = planRes.data;
    } catch (err) {
      console.error("Could not load planner data:", err);
    }

    setMsgs((prev) => [...prev, { from: "you", text: text.trim() }]);
    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await api.post(`/advisor/chat`, {
        message: messageText,
        planner,
      });
      const botReply = res.data.tips?.join("\n") || res.data.answer || "No response.";
      setMsgs((prev) => [...prev, { from: "bot", text: botReply }]);
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
        <div ref={messagesEndRef} />
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


