import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

export const extractFromText = (text) =>
  client.post('/ai/extract-text', { text }).then((r) => r.data)

export const extractFromFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/ai/extract-file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const chatWithAssistant = (message, complaintId, currentFormState) =>
  client.post('/ai/chat', {
    message,
    complaint_id: complaintId ?? null,
    current_form_state: currentFormState ?? null,
  }).then((r) => r.data)

export const saveComplaint = (payload) =>
  client.post('/complaints', payload).then((r) => r.data)

export const updateComplaint = (id, payload) =>
  client.put(`/complaints/${id}`, payload).then((r) => r.data)

export const listComplaints = () =>
  client.get('/complaints').then((r) => r.data)

export default client
