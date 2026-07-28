import { useSelector, useDispatch } from 'react-redux'
import { fieldChanged, resetForm, persistComplaint } from '../store/complaintSlice'

const SEVERITIES = ['Critical', 'Major', 'Minor']
const PRIORITIES = ['High', 'Medium', 'Low']

function Field({ id, label, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}

export default function ComplaintForm() {
  const dispatch = useDispatch()
  const { form, aiFilledKeys, status, save } = useSelector((s) => s.complaint)

  const isAi = (key) => (aiFilledKeys.includes(key) ? 'ai-filled' : '')

  const onChange = (field) => (e) =>
    dispatch(fieldChanged({ field, value: e.target.value }))

  const badgeClass =
    status === 'Pending Triage' ? 'badge-amber' : status === 'Escalated' ? 'badge-red' : 'badge-green'

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Log Customer Complaint</h2>
          <div className="panel-subtitle">API &amp; FDF Quality Assurance Module</div>
        </div>
        <span className={`badge ${badgeClass}`}>{status}</span>
      </div>

      {save.error && <div className="error-banner">Save failed: {save.error}</div>}

      <div className="section-title">1. Origin &amp; Customer Details</div>
      <div className="field-grid">
        <Field id="complaint_source" label="Complaint Source">
          <input
            id="complaint_source"
            className={isAi('complaint_source')}
            value={form.complaint_source || ''}
            placeholder="Awaiting AI extraction..."
            onChange={onChange('complaint_source')}
          />
        </Field>
        <Field id="customer_name" label="Customer Name">
          <input
            id="customer_name"
            className={isAi('customer_name')}
            value={form.customer_name || ''}
            placeholder="Awaiting AI extraction..."
            onChange={onChange('customer_name')}
          />
        </Field>
      </div>

      <div className="section-title">2. Product &amp; Batch Identification</div>
      <div className="field-grid">
        <Field id="product_name" label="Product Name">
          <input id="product_name" className={isAi('product_name')} value={form.product_name || ''}
                 placeholder="Awaiting AI extraction..." onChange={onChange('product_name')} />
        </Field>
        <Field id="product_strength_grade" label="Product Strength/Grade">
          <input id="product_strength_grade" className={isAi('product_strength_grade')} value={form.product_strength_grade || ''}
                 placeholder="Awaiting AI extraction..." onChange={onChange('product_strength_grade')} />
        </Field>
        <Field id="batch_lot_number" label="Batch/Lot Number">
          <input id="batch_lot_number" className={isAi('batch_lot_number')} value={form.batch_lot_number || ''}
                 placeholder="Awaiting AI extraction..." onChange={onChange('batch_lot_number')} />
        </Field>
        <Field id="manufacturing_date" label="Manufacturing Date">
          <input id="manufacturing_date" type="date" className={isAi('manufacturing_date')} value={form.manufacturing_date || ''}
                 onChange={onChange('manufacturing_date')} />
        </Field>
        <Field id="expiry_date" label="Expiry Date">
          <input id="expiry_date" type="date" className={isAi('expiry_date')} value={form.expiry_date || ''}
                 onChange={onChange('expiry_date')} />
        </Field>
        <Field id="quantity_affected" label="Quantity Affected">
          <input id="quantity_affected" type="number" className={isAi('quantity_affected')} value={form.quantity_affected || ''}
                 placeholder="0" onChange={onChange('quantity_affected')} />
        </Field>
      </div>

      <div className="section-title">3. Complaint Details</div>
      <div className="field-grid">
        <Field id="complaint_type" label="Complaint Type">
          <input id="complaint_type" className={isAi('complaint_type')} value={form.complaint_type || ''}
                 placeholder="Awaiting AI extraction..." onChange={onChange('complaint_type')} />
        </Field>
        <Field id="complaint_date" label="Complaint Date">
          <input id="complaint_date" type="date" className={isAi('complaint_date')} value={form.complaint_date || ''}
                 onChange={onChange('complaint_date')} />
        </Field>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="detailed_description">Detailed Complaint Description</label>
        <textarea id="detailed_description" className={isAi('detailed_description')} value={form.detailed_description || ''}
                  placeholder="Awaiting AI extraction..." onChange={onChange('detailed_description')} />
      </div>

      <div className="section-title">4. Initial Assessment &amp; Priority</div>
      <div className="field-grid">
        <Field id="initial_severity" label="Initial Severity">
          <select id="initial_severity" className={isAi('initial_severity')} value={form.initial_severity || ''}
                  onChange={onChange('initial_severity')}>
            <option value="">Awaiting AI extraction...</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field id="priority" label="Priority">
          <select id="priority" className={isAi('priority')} value={form.priority || ''}
                  onChange={onChange('priority')}>
            <option value="">Awaiting AI extraction...</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <div className="form-actions">
        <button className="ghost" onClick={() => dispatch(resetForm())}>↺ Reset Form</button>
        <button
          className="primary"
          disabled={save.inProgress}
          onClick={() => dispatch(persistComplaint())}
        >
          {save.inProgress ? 'Saving...' : '🖹 Save Complaint'}
        </button>
      </div>
    </div>
  )
}
