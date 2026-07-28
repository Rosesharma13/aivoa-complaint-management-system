import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../api/api'

const emptyForm = {
  complaint_source: '',
  customer_name: '',
  product_name: '',
  product_strength_grade: '',
  batch_lot_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  quantity_unit: 'kg',
  complaint_type: '',
  complaint_date: '',
  detailed_description: '',
  initial_severity: '',
  priority: '',
}

const initialState = {
  form: { ...emptyForm },
  aiFilledKeys: [],           // which field keys were auto-populated (for highlight styling)
  status: 'Pending Triage',
  savedComplaintId: null,

  extraction: {
    inProgress: false,
    progress: 0,
    error: null,
  },

  insights: {
    completeness_score: null,
    missing_fields: [],
    risk_classification: null,
    risk_rationale: null,
    root_cause_recommendation: null,
    capa_recommendation: null,
    ai_summary: null,
    possible_duplicate_id: null,
    duplicate_confidence: null,
  },

  chat: {
    messages: [
      {
        role: 'assistant',
        text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.',
      },
    ],
    sending: false,
  },

  save: {
    inProgress: false,
    error: null,
  },
}

export const runExtractionFromText = createAsyncThunk(
  'complaint/extractFromText',
  async (text) => api.extractFromText(text),
)

export const runExtractionFromFile = createAsyncThunk(
  'complaint/extractFromFile',
  async (file) => api.extractFromFile(file),
)

export const sendChatMessage = createAsyncThunk(
  'complaint/sendChatMessage',
  async ({ message, complaintId, currentFormState }) =>
    api.chatWithAssistant(message, complaintId, currentFormState),
)

export const persistComplaint = createAsyncThunk(
  'complaint/persistComplaint',
  async (_, { getState }) => {
    const { form, status, savedComplaintId, insights } = getState().complaint
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]),
    )
    const payload = { ...cleaned, status }
    if (savedComplaintId) {
      return api.updateComplaint(savedComplaintId, payload)
    }
    return api.saveComplaint(payload)
  },
)

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    fieldChanged(state, action) {
      const { field, value } = action.payload
      state.form[field] = value
      // once a user edits a field manually, stop treating it as "AI filled" styling
      state.aiFilledKeys = state.aiFilledKeys.filter((k) => k !== field)
    },
    resetForm() {
      return { ...initialState }
    },
    setExtractionProgress(state, action) {
      state.extraction.progress = action.payload
    },
    userMessageAdded(state, action) {
      state.chat.messages.push({ role: 'user', text: action.payload })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runExtractionFromText.pending, (state) => {
        state.extraction.inProgress = true
        state.extraction.error = null
        state.extraction.progress = 10
      })
      .addCase(runExtractionFromFile.pending, (state) => {
        state.extraction.inProgress = true
        state.extraction.error = null
        state.extraction.progress = 10
      })
      .addCase(runExtractionFromText.fulfilled, applyExtractionResult)
      .addCase(runExtractionFromFile.fulfilled, applyExtractionResult)
      .addCase(runExtractionFromText.rejected, applyExtractionError)
      .addCase(runExtractionFromFile.rejected, applyExtractionError)

      .addCase(sendChatMessage.pending, (state) => {
        state.chat.sending = true
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chat.sending = false
        state.chat.messages.push({ role: 'assistant', text: action.payload.reply })
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.chat.sending = false
        state.chat.messages.push({
          role: 'assistant',
          text: 'Sorry, I could not reach the AI service. Please check the backend/API key configuration.',
        })
      })

      .addCase(persistComplaint.pending, (state) => {
        state.save.inProgress = true
        state.save.error = null
      })
      .addCase(persistComplaint.fulfilled, (state, action) => {
        state.save.inProgress = false
        state.savedComplaintId = action.payload.id
        state.status = action.payload.status
      })
      .addCase(persistComplaint.rejected, (state, action) => {
        state.save.inProgress = false
        state.save.error = action.error.message
      })
  },
})

function applyExtractionResult(state, action) {
  state.extraction.inProgress = false
  state.extraction.progress = 100

  const extracted = action.payload.extracted || {}
  const filledKeys = []
  Object.entries(extracted).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '' && key in state.form) {
      state.form[key] = value
      filledKeys.push(key)
    }
  })
  state.aiFilledKeys = filledKeys

  state.insights = {
    completeness_score: action.payload.completeness_score,
    missing_fields: action.payload.missing_fields,
    risk_classification: action.payload.risk_classification,
    risk_rationale: action.payload.risk_rationale,
    root_cause_recommendation: action.payload.root_cause_recommendation,
    capa_recommendation: action.payload.capa_recommendation,
    ai_summary: action.payload.ai_summary,
    possible_duplicate_id: action.payload.possible_duplicate_id,
    duplicate_confidence: action.payload.duplicate_confidence,
  }

  if (action.payload.risk_classification) {
    state.form.initial_severity = state.form.initial_severity || action.payload.risk_classification
  }

  state.chat.messages.push({
    role: 'assistant',
    text: `Done! I extracted the complaint details and populated the form (completeness: ${action.payload.completeness_score}%, risk: ${action.payload.risk_classification}). Review and click "Save Complaint" when ready.`,
  })
}

function applyExtractionError(state, action) {
  state.extraction.inProgress = false
  state.extraction.progress = 0
  state.extraction.error = action.error.message || 'Extraction failed'
  state.chat.messages.push({
    role: 'assistant',
    text: `I ran into an error extracting this complaint: ${state.extraction.error}`,
  })
}

export const { fieldChanged, resetForm, setExtractionProgress, userMessageAdded } = complaintSlice.actions
export default complaintSlice.reducer
