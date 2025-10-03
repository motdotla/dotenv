// Minimal vanilla JS client for dotenv-ui

const qs = (s) => document.querySelector(s)
const qsa = (s) => Array.from(document.querySelectorAll(s))

// State management
let currentEnv = {}
let collapsedSections = JSON.parse(localStorage.getItem('collapsedSections')) || {}

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

function renderTable(env) {
  const tbody = qs('#env-table tbody')
  if (!tbody) {
    console.error('Table body not found')
    return
  }
  
  tbody.innerHTML = ''
  const hide = qs('#hide-values')?.checked || false
  const keys = Object.keys(env).sort()
  
  if (keys.length === 0) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 3
    td.textContent = 'No environment variables found'
    td.className = 'empty-message'
    tr.appendChild(td)
    tbody.appendChild(tr)
    return
  }
  
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
      if (confirm(`Delete environment variable "${k}"?`)) {
        delete env[k]
        renderTable(env)
      }
    })
    tdActions.appendChild(del)

    tr.appendChild(tdKey)
    tr.appendChild(tdVal)
    tr.appendChild(tdActions)
    tbody.appendChild(tr)
  }
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
  alert(`Error: ${message}`)
}

function showSuccess(message) {
  // You could replace this with a more subtle notification
  console.log(`Success: ${message}`)
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

// Event listeners
function setupEventListeners() {
  const btnRefresh = qs('#btn-refresh')
  const btnSave = qs('#btn-save')
  const btnAdd = qs('#btn-add')
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
    renderTable(currentEnv)
  })
  
  btnAdd.addEventListener('click', () => {
    let i = 1
    while (currentEnv[`NEW_KEY_${i}`]) i++
    currentEnv[`NEW_KEY_${i}`] = ''
    renderTable(currentEnv)
  })
  
  btnSave.addEventListener('click', async () => {
    const inputs = qsa('.valinput')
    const env = {}
    
    for (const input of inputs) {
      const key = input.dataset.key
      if (key) {
        env[key] = input.value
      }
    }
    
    try {
      await apiCall('/api/env', {
        method: 'POST',
        body: JSON.stringify({ env })
      })
      showSuccess('.env saved successfully')
    } catch (error) {
      showError('Failed to save .env file')
    }
  })
  
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