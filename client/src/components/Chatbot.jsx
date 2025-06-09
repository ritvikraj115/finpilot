// client/src/components/Chatbot.jsx
import React, { /* … */ } from "react";
import styled from "styled-components";
import api from "../utils/api";

const Container = styled.div`
  /* Fill the available viewport on mobile */
  width: 100%;
  height: calc(100vh - 60px);  /* subtract navbar height if you have one */
  display: flex;
  flex-direction: column;
  background: #fff;

  @media (min-width: 600px) {
    max-width: 600px;
    margin: 2rem auto;
    height: 70vh;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
`;

// Make the header span 100% of the Container
const Header = styled.div`
  background-color: #0070f3;
  padding: 1rem;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;

  @media (max-width: 600px) {
    font-size: 1.1rem;
  }
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 1rem;

  /* Ensure it always fills available space */
  min-height: 0;
`;

const MessageBubble = styled.div`
  max-width: 75%;
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  background-color: ${({ from }) =>
    from === "bot" ? "#e0e7ff" : "#d1fae5"};
  align-self: ${({ from }) =>
    from === "bot" ? "flex-start" : "flex-end"};
  font-size: 0.9rem;

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const InputFooter = styled.form`
  display: flex;
  padding: 0.5rem;
  background: #fff;
  flex-shrink: 0;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;

  &:focus {
    border-color: #0070f3;
    box-shadow: 0 0 0 3px rgba(0,112,243,0.2);
  }
`;

const SendButton = styled.button`
  margin-left: 0.5rem;
  padding: 0 1rem;
  background: #0070f3;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  @media (max-width: 480px) {
    margin-left: 0;
    width: 100%;
  }
`;

export default function Chatbot() {
  // … your existing logic …

  return (
    <Container>
      <Header>Budget AI Assistant</Header>
      <Messages>
        {msgs.map((m,i) => (
          <MessageBubble key={i} from={m.from}>
            <strong>{m.from==="you"?"You":"Assistant"}:</strong> {m.text}
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} />
      </Messages>
      <InputFooter onSubmit={send}>
        <TextInput
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="Ask your budget assistant..."
        />
        <SendButton type="submit" disabled={!text.trim() || sending}>
          Send
        </SendButton>
      </InputFooter>
    </Container>
  );
}



