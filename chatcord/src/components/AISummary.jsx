import React, { useState, useEffect } from "react";
import AIService from "../lib/aiService";

function AISummary({ currentRoom, onClose }) {
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentRoom) {
      generateSummary();
    }
  }, [currentRoom]);

  const generateSummary = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSummary("");

      const response = await AIService.generateSummary(currentRoom.id);

      if (response.summary) {
        const processedSummary = processText(response.summary);
        setSummary(processedSummary);
      } else {
        setSummary("No summary available for this room.");
      }
    } catch (err) {
      console.error("Error generating AI summary:", err);
      setError("Failed to generate AI summary. Please try again.");
      setSummary("Unable to generate summary at this time.");
    } finally {
      setIsGenerating(false);
    }
  };

  const processText = (text) => {
    let processed = text
      .replace(
        /[\u{1f300}-\u{1f6ff}]|[\u{1f900}-\u{1f9ff}]|[\u{2600}-\u{26ff}]|[\u{2700}-\u{27bf}]/gu,
        ""
      )
      .replace(/[*#`_~]/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (
      processed.includes("Room Summary") ||
      processed.includes("messages from")
    ) {
      const participants = extractParticipants(processed);
      const messageCount = extractMessageCount(processed);

      if (participants.length > 0) {
        processed = `The users ${participants.join(
          ", "
        )} have been chatting in this room`;
        if (messageCount > 0) {
          processed += ` with ${messageCount} messages exchanged`;
        }
        processed +=
          ". They were discussing various topics and sharing information.";
      } else {
        processed =
          "Users have been chatting in this room about various topics.";
      }
    }

    return processed;
  };

  const extractParticipants = (text) => {
    const matches =
      text.match(/Active users[:\s]+([^.\n]+)/i) ||
      text.match(/from active users[:\s]+([^.\n]+)/i);
    if (matches && matches[1]) {
      return matches[1]
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name);
    }
    return [];
  };

  const extractMessageCount = (text) => {
    const matches = text.match(/(\d+)\s+messages/i);
    return matches ? parseInt(matches[1]) : 0;
  };

  const handleRefresh = () => {
    generateSummary();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#2c2c2c",
          borderRadius: "10px",
          padding: "20px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "70vh",
          overflow: "auto",
          color: "white",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: 0, color: "#00d4aa" }}>Room Summary</h3>
          <div>
            <button
              onClick={handleRefresh}
              disabled={isGenerating}
              style={{
                backgroundColor: "#00d4aa",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "5px 10px",
                marginRight: "10px",
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              {isGenerating ? "⏳" : "🔄"}
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#666",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ minHeight: "100px" }}>
          {isGenerating ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div>Generating summary...</div>
              <div style={{ marginTop: "10px", fontSize: "24px" }}>⏳</div>
            </div>
          ) : error ? (
            <div
              style={{ color: "#ff6b6b", padding: "10px", textAlign: "center" }}
            >
              {error}
            </div>
          ) : summary ? (
            <div style={{ lineHeight: "1.6" }}>{summary}</div>
          ) : (
            <div
              style={{ color: "#999", textAlign: "center", padding: "20px" }}
            >
              No summary available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AISummary;
