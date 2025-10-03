// Minimal vanilla JS client for dotenv-ui

const qs = (s) => document.querySelector(s)
const qsa = (s) => Array.from(document.querySelectorAll(s))

// State management
let currentEnv = {}
let collapsedSections = JSON.parse(localStorage.getItem('collapsedSections')) || {}
let newRows = [] // Track newly added rows
let newRowsData = {} // Store data for unsaved new rows

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

async function loadEnv() {
  try {
    const data = await apiCall('/api/env')
    currentEnv = data.env || {}
    newRows = [] // Reset new rows when loading fresh data
    newRowsData = {} // Reset new rows data
    return currentEnv
  } catch (error) {
    showError('Failed to load .env file')
    return {}
  }
}

async function loadExample() {
  try {
    const data = await apiCall('/api/env-example')
    return data.example || {}
  } catch (error) {
    console.error('Failed to load example:', error)
    return {}
  }
}

function saveNewRowsState() {
  // Save the current state of new rows before re-rendering
  const newKeyInputs = qsa('.new-key-input')
  const newValInputs = qsa('.new-val-input')
  
  newKeyInputs.forEach(keyInput => {
    const rowId = keyInput.dataset.rowId
    if (rowId) {
      if (!newRowsData[rowId]) {
        newRowsData[rowId] = {}
      }
      newRowsData[rowId].key = keyInput.value
    }
  })
  
  newValInputs.forEach(valInput => {
    const rowId = valInput.dataset.rowId
    if (rowId && newRowsData[rowId]) {
      newRowsData[rowId].value = valInput.value
    }
  })
}

function renderTable(env) {
  const tbody = qs('#env-table tbody')
  if (!tbody) {
    console.error('Table body not found')
    return
  }
  
  tbody.innerHTML = ''
  const hide = qs('#hide-values')?.checked || false
  const keys = Object.keys(env).sort()
  
  if (keys.length === 0 && newRows.length === 0) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 3
    td.textContent = 'No environment variables found'
    td.className = 'empty-message'
    tr.appendChild(td)
    tbody.appendChild(tr)
    return
  }
  
  // Render existing keys
  for (const k of keys) {
    const tr = document.createElement('tr')
    
    // Key column - editable
    const tdKey = document.createElement('td')
    const keyInput = document.createElement('input')
    keyInput.value = k
    keyInput.dataset.originalKey = k
    keyInput.className = 'key-input'
    keyInput.type = 'text'
    keyInput.addEventListener('blur', handleKeyEdit)
    keyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        keyInput.blur()
      }
    })
    tdKey.appendChild(keyInput)
    
    // Value column
    const tdVal = document.createElement('td')
    const input = document.createElement('input')
    input.value = env[k]
    input.dataset.key = k
    input.className = 'valinput'
    input.type = hide ? 'password' : 'text'
    input.placeholder = 'Enter value...'
    tdVal.appendChild(input)
    
    // Actions column
    const tdActions = document.createElement('td')
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.className = 'btn-delete'
    del.addEventListener('click', () => {
      delete env[k]
      renderTable(env)
    })
    tdActions.appendChild(del)

    tr.appendChild(tdKey)
    tr.appendChild(tdVal)
    tr.appendChild(tdActions)
    tbody.appendChild(tr)
  }
  
  // Render new rows (not yet saved)
  newRows.forEach((rowId) => {
    const tr = document.createElement('tr')
    tr.className = 'new-row'
    tr.dataset.newRowId = rowId
    
    // Key column
    const tdKey = document.createElement('td')
    const keyInput = document.createElement('input')
    keyInput.placeholder = 'Enter key name...'
    keyInput.className = 'key-input new-key-input'
    keyInput.type = 'text'
    keyInput.dataset.rowId = rowId
    // Restore saved key value if exists
    if (newRowsData[rowId] && newRowsData[rowId].key !== undefined) {
      keyInput.value = newRowsData[rowId].key
    }
    tdKey.appendChild(keyInput)
    
    // Value column
    const tdVal = document.createElement('td')
    const valInput = document.createElement('input')
    valInput.placeholder = 'Enter value...'
    valInput.className = 'valinput new-val-input'
    valInput.type = hide ? 'password' : 'text'
    valInput.dataset.rowId = rowId
    // Restore saved value if exists
    if (newRowsData[rowId] && newRowsData[rowId].value !== undefined) {
      valInput.value = newRowsData[rowId].value
    }
    tdVal.appendChild(valInput)
    
    // Actions column
    const tdActions = document.createElement('td')
    const del = document.createElement('button')
    del.textContent = 'Remove'
    del.className = 'btn-delete'
    del.addEventListener('click', () => {
      removeNewRow(rowId)
    })
    tdActions.appendChild(del)
    
    tr.appendChild(tdKey)
    tr.appendChild(tdVal)
    tr.appendChild(tdActions)
    tbody.appendChild(tr)
  })
}

function addNewRow() {
  // Save current state before adding new row
  saveNewRowsState()
  
  const rowId = 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  newRows.push(rowId)
  // Initialize empty data for new row
  newRowsData[rowId] = { key: '', value: '' }
  renderTable(currentEnv)
  
  // Focus on the new key input
  setTimeout(() => {
    const newKeyInput = qs(`.new-key-input[data-row-id="${rowId}"]`)
    if (newKeyInput) {
      newKeyInput.focus()
    }
  }, 10)
}

function removeNewRow(rowId) {
  newRows = newRows.filter(id => id !== rowId)
  delete newRowsData[rowId]
  renderTable(currentEnv)
}

function handleKeyEdit(event) {
  const keyInput = event.target
  const originalKey = keyInput.dataset.originalKey
  const newKey = keyInput.value.trim()
  
  // Don't do anything if key didn't change
  if (newKey === originalKey) {
    return
  }
  
  // Validate new key
  if (!newKey) {
    showError('Key cannot be empty')
    keyInput.value = originalKey
    return
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newKey)) {
    showError('Key must start with a letter or underscore and contain only letters, numbers, and underscores')
    keyInput.value = originalKey
    return
  }
  
  // Check if key already exists
  if (newKey !== originalKey && newKey in currentEnv) {
    showError(`Key "${newKey}" already exists`)
    keyInput.value = originalKey
    return
  }
  
  // Update the key
  currentEnv[newKey] = currentEnv[originalKey]
  delete currentEnv[originalKey]
  
  // Update the data-key attribute on the value input
  const valueInput = keyInput.closest('tr').querySelector('.valinput')
  valueInput.dataset.key = newKey
  
  // Update the original key reference
  keyInput.dataset.originalKey = newKey
  
  showSuccess(`Key renamed from "${originalKey}" to "${newKey}"`)
}

function showError(message) {
  showNotification(message, 'error')
}

function showSuccess(message) {
  showNotification(message, 'success')
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = qs('.notification')
  if (existingNotification) {
    existingNotification.remove()
  }
  
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `
  
  // Add styles if not already added
  if (!qs('#notification-styles')) {
    const styles = document.createElement('style')
    styles.id = 'notification-styles'
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        min-width: 300px;
        max-width: 500px;
        animation: slideIn 0.3s ease-out;
      }
      .notification-content {
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        justify-content: between;
        align-items: center;
      }
      .notification-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      .notification-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      .notification-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      .notification-message {
        flex: 1;
        margin-right: 10px;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(styles)
  }
  
  // Add close functionality
  const closeBtn = notification.querySelector('.notification-close')
  closeBtn.addEventListener('click', () => {
    notification.remove()
  })
  
  // Auto-remove after 5 seconds for success, 8 seconds for error
  const autoRemoveTime = type === 'success' ? 5000 : 8000
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, autoRemoveTime)
  
  document.body.appendChild(notification)
}

function toggleSection(sectionId) {
  collapsedSections[sectionId] = !collapsedSections[sectionId]
  localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections))
  
  const section = qs(`#${sectionId}`)
  const content = section.querySelector('.section-content')
  const toggle = section.querySelector('.toggle-section')
  
  if (collapsedSections[sectionId]) {
    content.style.display = 'none'
    toggle.textContent = '▶'
    toggle.title = 'Expand section'
  } else {
    content.style.display = 'block'
    toggle.textContent = '▼'
    toggle.title = 'Collapse section'
  }
}

function setupCollapsibleSections() {
  const sections = ['editor', 'diff', 'encrypt']
  
  sections.forEach(sectionId => {
    const section = qs(`#${sectionId}`)
    if (section) {
      // Add toggle button to section header
      const header = section.querySelector('h2') || section.querySelector('h1')
      if (header) {
        const toggle = document.createElement('button')
        toggle.className = 'toggle-section'
        toggle.textContent = collapsedSections[sectionId] ? '▶' : '▼'
        toggle.title = collapsedSections[sectionId] ? 'Expand section' : 'Collapse section'
        toggle.addEventListener('click', () => toggleSection(sectionId))
        
        // Wrap content in a div for easy hiding
        const content = document.createElement('div')
        content.className = 'section-content'
        while (section.childNodes.length > 0) {
          if (section.childNodes[0] !== header) {
            content.appendChild(section.childNodes[0])
          } else {
            break
          }
        }
        section.appendChild(content)
        
        header.appendChild(toggle)
        
        // Set initial state
        if (collapsedSections[sectionId]) {
          content.style.display = 'none'
        }
      }
    }
  })
}

async function refresh() {
  try {
    const env = await loadEnv()
    renderTable(env)
  } catch (error) {
    showError('Failed to refresh environment')
  }
}

async function saveAll() {
  // Save current state before processing
  saveNewRowsState()
  
  const env = {...currentEnv}
  
  const newEntries = {}
  const validationErrors = []
  
  // Validate and collect new rows using saved data
  newRows.forEach(rowId => {
    const rowData = newRowsData[rowId]
    if (rowData && rowData.key) {
      const key = rowData.key.trim()
      const value = rowData.value || ''
      
      if (key) {
        // Validate key format
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          validationErrors.push(`"${key}" must start with a letter or underscore and contain only letters, numbers, and underscores`)
          return
        }
        
        // Check for duplicates
        if (key in env || key in newEntries) {
          validationErrors.push(`Key "${key}" already exists`)
          return
        }
        
        newEntries[key] = value
      }
    }
  })
  
  // Show validation errors if any
  if (validationErrors.length > 0) {
    showError('Validation errors:\n' + validationErrors.join('\n'))
    return
  }
  
  // Merge new entries
  Object.assign(env, newEntries)
  
  try {
    await apiCall('/api/env', {
      method: 'POST',
      body: JSON.stringify({ env })
    })
    
    // Clear new rows after successful save
    newRows = []
    newRowsData = {}
    currentEnv = env
    renderTable(currentEnv)
    showSuccess('.env saved successfully with ' + Object.keys(newEntries).length + ' new variables')
    
  } catch (error) {
    showError('Failed to save .env file')
  }
}

// Event listeners
function setupEventListeners() {
  const btnRefresh = qs('#btn-refresh')
  const btnSave = qs('#btn-save')
  const btnAdd = qs('#btn-add')
  const btnAddMultiple = qs('#btn-add-multiple')
  const hideValues = qs('#hide-values')
  const btnDiff = qs('#btn-diff')
  const btnEncrypt = qs('#btn-encrypt')
  const btnDecrypt = qs('#btn-decrypt')
  
  if (!btnRefresh || !btnSave || !btnAdd) {
    console.error('Required buttons not found')
    return
  }
  
  btnRefresh.addEventListener('click', refresh)
  
  hideValues?.addEventListener('change', () => {
    // Save current state before re-rendering
    saveNewRowsState()
    renderTable(currentEnv)
  })
  
  btnAdd.addEventListener('click', addNewRow)
  
  
  btnSave.addEventListener('click', saveAll)
  
  btnDiff?.addEventListener('click', async () => {
    try {
      const data = await apiCall('/api/diff')
      const el = qs('#diff-result')
      if (el) {
        el.innerHTML = `
          <div class="diff-section">
            <strong>Missing in .env:</strong> 
            <span class="diff-missing">${data.missing.length ? data.missing.join(', ') : '(none)'}</span>
          </div>
          <div class="diff-section">
            <strong>Extra in .env:</strong> 
            <span class="diff-extra">${data.extra.length ? data.extra.join(', ') : '(none)'}</span>
          </div>
          <div class="diff-section">
            <strong>Common keys:</strong> 
            <span class="diff-common">${data.common.length ? data.common.join(', ') : '(none)'}</span>
          </div>
        `
      }
    } catch (error) {
      showError('Failed to compute diff')
    }
  })
  
  btnEncrypt?.addEventListener('click', async () => {
    try {
      const data = await apiCall('/api/encrypt', { method: 'POST' })
      const pre = qs('#exec-output')
      if (pre) {
        pre.textContent = JSON.stringify(data, null, 2)
      }
      if (data.ok) {
        showSuccess('Encryption completed successfully')
      }
    } catch (error) {
      showError('Encryption failed')
    }
  })
  
  btnDecrypt?.addEventListener('click', async () => {
    try {
      const data = await apiCall('/api/decrypt', { method: 'POST' })
      const pre = qs('#exec-output')
      if (pre) {
        pre.textContent = JSON.stringify(data, null, 2)
      }
      if (data.ok) {
        showSuccess('Decryption completed successfully')
        // Refresh the environment after decryption
        setTimeout(refresh, 500)
      }
    } catch (error) {
      showError('Decryption failed')
    }
  })
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners()
  setupCollapsibleSections()
  refresh()
})