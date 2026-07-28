import { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  runExtractionFromFile,
  runExtractionFromText,
  sendChatMessage,
  userMessageAdded,
} from '../store/complaintSlice'

export default function AIAssistantPanel() {
  const dispatch = useDispatch()
  const { extraction, insights, chat, form, savedComplaintId } = useSelector((s) => s.complaint)
  const [dragging, setDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [chatInput, setChatInput] = useState('')
  const fileInputRef = useRef(null)

  const handleFiles = (files) => {
    const file = files?.[0]
    if (!file) return
    dispatch(runExtractionFromFile(file))
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const submitPaste = () => {
    if (!pasteText.trim()) return
    dispatch(runExtractionFromText(pasteText))
  }

  const submitChat = () => {
    const message = chatInput.trim()
    if (!message) return
    dispatch(userMessageAdded(message))
    dispatch(sendChatMessage({ message, complaintId: savedComplaintId, currentFormState: form }))
    setChatInput('')
  }

  const riskBadgeClass =
    insights.risk_classification === 'Critical'
      ? 'badge-red'
      : insights.risk_classification === 'Major'
      ? 'badge-amber'
      : 'badge-green'

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">✨ AI Complaint Intake Assistant</h2>
        </div>
        <span className="badge badge-blue">BETA</span>
      </div>

      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        ⬆ Drag &amp; drop complaint document here<br />
        or <strong>click to browse</strong>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.eml"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <div className="ai-note" style={{ textAlign: 'center', marginTop: 6 }}>
        Supported formats: PDF, DOCX, TXT, EML · Max size 10MB
      </div>

      <div className="or-divider">OR</div>

      <textarea
        className="paste-box"
        placeholder="Paste Complaint Text / Email"
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
      />
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button className="primary" onClick={submitPaste} disabled={extraction.inProgress}>
          Extract from Text
        </button>
      </div>

      {extraction.inProgress && (
        <>
          <div className="section-title">Extraction Progress</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${extraction.progress}%` }} />
          </div>
          <div className="progress-label">
            Analyzing document content and extracting key details... Please wait, this may take a few moments.
          </div>
        </>
      )}

      {extraction.error && <div className="error-banner">{extraction.error}</div>}

      {insights.completeness_score !== null && !extraction.inProgress && (
        <>
          <div className="section-title">AI Insights</div>

          <div className="insight-card">
            <h4>Completeness</h4>
            <p>{insights.completeness_score}% complete</p>
            {insights.missing_fields?.length > 0 && (
              <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                Missing: {insights.missing_fields.join(', ')}
              </p>
            )}
          </div>

          <div className="insight-card">
            <h4>Risk Classification</h4>
            <span className={`badge ${riskBadgeClass}`}>{insights.risk_classification}</span>
            <p style={{ marginTop: 8 }}>{insights.risk_rationale}</p>
          </div>

          <div className="insight-card">
            <h4>Root Cause Recommendation</h4>
            <p>{insights.root_cause_recommendation}</p>
          </div>

          <div className="insight-card">
            <h4>CAPA Recommendation</h4>
            <p style={{ whiteSpace: 'pre-line' }}>{insights.capa_recommendation}</p>
          </div>

          <div className="insight-card">
            <h4>Summary</h4>
            <p>{insights.ai_summary}</p>
          </div>

          {insights.possible_duplicate_id && (
            <div className="insight-card">
              <h4>Possible Duplicate</h4>
              <p>
                Similar to complaint #{insights.possible_duplicate_id}
                {insights.duplicate_confidence != null &&
                  ` (confidence ${Math.round(insights.duplicate_confidence * 100)}%)`}
              </p>
            </div>
          )}
        </>
      )}

      <div className="section-title">AI Assistant</div>
      <div className="chat-log">
        {chat.messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
            {m.text}
          </div>
        ))}
        {chat.sending && <div className="chat-bubble assistant">Thinking…</div>}
      </div>
      <div className="chat-input-row">
        <input
          placeholder="Ask me anything about this complaint..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitChat()}
        />
        <button className="primary" onClick={submitChat}>➤</button>
      </div>
      <div className="disclaimer">AI responses may contain errors. Please verify information.</div>
    </div>
  )
}
