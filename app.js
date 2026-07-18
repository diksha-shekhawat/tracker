document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let syllabus = null;
  let expandedNodes = new Set();
  let filterQuery = '';
  let filterStatus = 'all';
  let filterPriority = 'all';

  // --- LOCAL STORAGE KEY ---
  const STORAGE_KEY = 'upsc_syllabus_data_v6';
  const EXPANDED_STORAGE_KEY = 'upsc_syllabus_expanded_v6';

  // --- DOM ELEMENT REFERENCES ---
  const treeContainer = document.getElementById('checklist-tree');

  const searchInput = document.getElementById('search-input');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterPrioritySelect = document.getElementById('filter-priority');

  const statProgress = document.getElementById('stat-progress');
  const statProgressFill = document.getElementById('stat-progress-fill');
  const statCompleted = document.getElementById('stat-completed');
  const statTotal = document.getElementById('stat-total');

  const btnAddRootTopic = document.getElementById('btn-add-root-topic');
  const btnExpandAll = document.getElementById('btn-expand-all');
  const btnCollapseAll = document.getElementById('btn-collapse-all');
  const btnResetData = document.getElementById('btn-reset-data');
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnImportBackup = document.getElementById('btn-import-backup');
  const importFileInput = document.getElementById('import-file-input');
  const agendaList = document.getElementById('agenda-list');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const appContainer = document.getElementById('app-container');

  // Node Dialog Elements
  const nodeDialog = document.getElementById('node-dialog');
  const nodeForm = document.getElementById('node-form');
  const dialogTitle = document.getElementById('dialog-title');
  const inputNodeId = document.getElementById('node-id');
  const inputNodeParentId = document.getElementById('node-parent-id');
  const inputNodeTitle = document.getElementById('node-title');
  const inputNodePriority = document.getElementById('node-priority');
  const inputNodeDueDate = document.getElementById('node-due-date');
  const inputNodeNotes = document.getElementById('node-notes');
  const btnDialogCancel = document.getElementById('btn-dialog-cancel');

  // Mass Add Dialog Elements
  const btnMassAdd = document.getElementById('btn-mass-add');
  const massAddDialog = document.getElementById('mass-add-dialog');
  const massAddForm = document.getElementById('mass-add-form');
  const massAddParent = document.getElementById('mass-add-parent');
  const massAddText = document.getElementById('mass-add-text');
  const btnMassAddCancel = document.getElementById('btn-mass-add-cancel');

  // Confirm Delete Dialog Elements
  const confirmDeleteDialog = document.getElementById('confirm-delete-dialog');
  const btnConfirmDeleteCancel = document.getElementById('btn-confirm-delete-cancel');
  const btnConfirmDeleteYes = document.getElementById('btn-confirm-delete-yes');
  let nodeIdToDelete = null;

  // Confirm Reset Dialog Elements
  const confirmResetDialog = document.getElementById('confirm-reset-dialog');
  const btnConfirmResetCancel = document.getElementById('btn-confirm-reset-cancel');
  const btnConfirmResetYes = document.getElementById('btn-confirm-reset-yes');

  // --- INITIALIZATION ---
  function init() {
    // Load from Local Storage or default to initial syllabus
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        syllabus = JSON.parse(savedData);
      } catch (e) {
        console.error("Error parsing saved syllabus data", e);
        syllabus = JSON.parse(JSON.stringify(defaultSyllabus));
      }
    } else {
      syllabus = JSON.parse(JSON.stringify(defaultSyllabus));
    }

    // Load Collapsed states
    const savedExpanded = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (savedExpanded) {
      try {
        expandedNodes = new Set(JSON.parse(savedExpanded));
      } catch (e) {
        expandedNodes = new Set();
      }
    } else {
      // First load: Nothing to do, empty expandedNodes means everything is collapsed
    }

    setupEventListeners();
    updateApp();
  }

  function setupEventListeners() {
    // Filters
    searchInput.addEventListener('input', (e) => {
      filterQuery = e.target.value.toLowerCase();
      updateApp();
    });
    filterStatusSelect.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      updateApp();
    });
    filterPrioritySelect.addEventListener('change', (e) => {
      filterPriority = e.target.value;
      updateApp();
    });

    // Sidebar Actions
    btnAddRootTopic.addEventListener('click', () => {
      openNodeDialog(null);
    });

    btnExpandAll.addEventListener('click', () => {
      Object.keys(syllabus.nodes).forEach(id => expandedNodes.add(id));
      saveExpandedStates();
      renderTree();
    });

    btnCollapseAll.addEventListener('click', () => {
      expandedNodes.clear();
      saveExpandedStates();
      renderTree();
    });

    if (btnExportBackup) {
      btnExportBackup.addEventListener('click', () => {
        const dataStr = JSON.stringify(syllabus, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `upsc_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (btnImportBackup) {
      btnImportBackup.addEventListener('click', () => {
        importFileInput.click();
      });
    }

    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target.result);
            if (importedData && importedData.nodes && importedData.rootIds) {
              syllabus = importedData;
              saveSyllabusData();
              updateApp();
              alert('Backup restored successfully!');
            } else {
              alert('Invalid backup file format.');
            }
          } catch (err) {
            alert('Error parsing backup file.');
          }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
      });
    }

    btnResetData.addEventListener('click', () => {
      confirmResetDialog.showModal();
    });

    btnConfirmResetCancel.addEventListener('click', () => {
      confirmResetDialog.close();
    });

    btnConfirmResetYes.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPANDED_STORAGE_KEY);
      syllabus = JSON.parse(JSON.stringify(defaultSyllabus));
      expandedNodes.clear();
      confirmResetDialog.close();
      updateApp();
    });

    sidebarToggle.addEventListener('click', () => {
      appContainer.classList.toggle('sidebar-closed');
    });

    // Node Dialog Modals
    btnDialogCancel.addEventListener('click', () => {
      nodeDialog.close();
    });

    nodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveNode();
    });

    // Mass Add Modal UI Binding
    btnMassAdd.addEventListener('click', () => {
      populateMassAddParentDropdown();
      massAddDialog.showModal();
    });

    btnMassAddCancel.addEventListener('click', () => {
      massAddDialog.close();
      massAddText.value = '';
    });

    massAddForm.addEventListener('submit', handleMassAdd);

    // Confirm Delete Dialog UI Binding
    btnConfirmDeleteCancel.addEventListener('click', () => {
      confirmDeleteDialog.close();
      nodeIdToDelete = null;
    });

    btnConfirmDeleteYes.addEventListener('click', () => {
      if (nodeIdToDelete) {
        executeDeleteNode(nodeIdToDelete);
        nodeIdToDelete = null;
      }
      confirmDeleteDialog.close();
    });
  }

  // --- DATA PERSISTENCE ---
  function saveSyllabusData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syllabus));
  }

  function saveExpandedStates() {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(expandedNodes)));
  }

  // --- MASS ADD SYLLABUS LOGIC ---
  function populateMassAddParentDropdown() {
    massAddParent.innerHTML = '<option value="root">-- Add as Top-Level (Main) Topics --</option>';

    // Helper to get nested titles
    function getNestedOptions(nodeIds, indent = '') {
      nodeIds.forEach(id => {
        const node = syllabus.nodes[id];
        const option = document.createElement('option');
        option.value = id;
        option.textContent = indent + node.title;
        massAddParent.appendChild(option);
        if (node.children && node.children.length > 0) {
          getNestedOptions(node.children, indent + '- ');
        }
      });
    }
    getNestedOptions(syllabus.rootIds);
  }

  function handleMassAdd(e) {
    e.preventDefault();
    const parentVal = massAddParent.value;
    const text = massAddText.value;
    const targetParentId = parentVal === 'root' ? null : parentVal;

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      massAddDialog.close();
      return;
    }

    // Stack holds objects: { indent: number, id: string }
    // The "virtual" root is the parentId passed in, at an imaginary indent of -1.
    const stack = [{ indent: -1, id: targetParentId }];

    lines.forEach((line) => {
      const indent = line.search(/\S/);
      const title = line.trim();
      const newId = generateId();

      const newNode = {
        id: newId,
        parentId: null,
        title: title,
        status: 'not-started',
        priority: 'medium',
        children: []
      };

      // Pop from stack until we find a parent with strictly less indentation
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      newNode.parentId = parent.id;

      syllabus.nodes[newId] = newNode;

      if (parent.id === null) {
        syllabus.rootIds.push(newId);
      } else {
        syllabus.nodes[parent.id].children.push(newId);
        // Expand the parent so the new children are visible!
        expandedNodes.add(parent.id);
      }

      stack.push({ indent: indent, id: newId });
    });

    updateApp();
    massAddDialog.close();
    massAddText.value = '';
  }

  // --- CORE APP UPDATES ---
  function updateApp() {
    saveSyllabusData();
    updateStatistics();
    renderTree();
    updateAgendaView();
  }

  function updateAgendaView() {
    if (!agendaList) return;
    
    // Collect all nodes with targetDate that are not completed
    const upcoming = [];
    Object.values(syllabus.nodes).forEach(node => {
      if (node.targetDate && node.status !== 'completed') {
        upcoming.push(node);
      }
    });

    // Sort by date
    upcoming.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    
    // Take top 5
    const topUpcoming = upcoming.slice(0, 5);

    agendaList.innerHTML = '';
    
    if (topUpcoming.length === 0) {
      agendaList.innerHTML = '<li style="padding: 0.5rem 0;">No upcoming deadlines.</li>';
      return;
    }

    topUpcoming.forEach(node => {
      const li = document.createElement('li');
      li.style.cssText = "padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 0.25rem;";
      
      const title = document.createElement('span');
      title.style.color = "var(--text-primary)";
      title.style.fontWeight = "500";
      title.style.whiteSpace = "nowrap";
      title.style.overflow = "hidden";
      title.style.textOverflow = "ellipsis";
      title.textContent = node.title;
      
      const date = document.createElement('span');
      date.style.color = "var(--secondary)";
      date.style.fontSize = "0.7rem";
      
      const parts = node.targetDate.split('-');
      const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffTime = target - today;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let dateText = node.targetDate;
      if (diffDays === 0) dateText += ' (Today)';
      else if (diffDays === 1) dateText += ' (Tomorrow)';
      else if (diffDays < 0) dateText += ` (${Math.abs(diffDays)} days overdue)`;
      else dateText += ` (in ${diffDays} days)`;
      
      if (diffDays < 0) date.style.color = "var(--danger)";
      
      date.textContent = dateText;
      
      li.appendChild(title);
      li.appendChild(date);
      agendaList.appendChild(li);
    });
  }

  function generateId() {
    return 'node-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  // --- STATUS CASCADING ---
  function cascadeStatusDownwards(nodeId, newStatus) {
    const node = syllabus.nodes[nodeId];
    if (!node) return;

    // Update the node itself
    node.status = newStatus;

    // Recursively update all children
    if (node.children && node.children.length > 0) {
      node.children.forEach(childId => {
        cascadeStatusDownwards(childId, newStatus);
      });
    }
  }

  function cascadeStatusUpwards(nodeId) {
    const node = syllabus.nodes[nodeId];
    if (!node || !node.parentId) return;

    const parent = syllabus.nodes[node.parentId];
    if (!parent || !parent.children || parent.children.length === 0) return;

    let allCompleted = true;
    let someStarted = false;

    parent.children.forEach(childId => {
      const child = syllabus.nodes[childId];
      if (child.status !== 'completed') {
        allCompleted = false;
      }
      if (child.status === 'completed' || child.status === 'in-progress') {
        someStarted = true;
      }
    });

    if (allCompleted) {
      parent.status = 'completed';
    } else if (someStarted) {
      parent.status = 'in-progress';
    } else {
      parent.status = 'not-started';
    }

    // Recursively update upwards to the root
    cascadeStatusUpwards(parent.id);
  }

  // --- NODE MANAGEMENT ---
  function openNodeDialog(parentId, nodeId = null) {
    if (nodeId) {
      const node = syllabus.nodes[nodeId];
      dialogTitle.textContent = 'Edit Topic';
      inputNodeId.value = node.id;
      inputNodeParentId.value = node.parentId || '';
      inputNodeTitle.value = node.title;
      inputNodePriority.value = node.priority;
      inputNodeDueDate.value = node.targetDate || '';
      inputNodeNotes.value = node.notes || '';
    } else {
      dialogTitle.textContent = 'Add Subtopic';
      inputNodeId.value = '';
      inputNodeParentId.value = parentId || '';
      inputNodeTitle.value = '';
      inputNodePriority.value = 'medium';
      inputNodeDueDate.value = '';
      inputNodeNotes.value = '';
    }
    nodeDialog.showModal();
  }

  function saveNode() {
    const id = inputNodeId.value;
    const parentId = inputNodeParentId.value || null;
    const title = inputNodeTitle.value.trim();
    const priority = inputNodePriority.value;
    const dueDate = inputNodeDueDate.value;
    const notes = inputNodeNotes.value;

    if (id) {
      // Edit existing
      syllabus.nodes[id].title = title;
      syllabus.nodes[id].priority = priority;
      syllabus.nodes[id].targetDate = dueDate;
      syllabus.nodes[id].notes = notes;
    } else {
      // Create new
      const newId = generateId();
      syllabus.nodes[newId] = {
        id: newId,
        parentId: parentId,
        title: title,
        status: 'not-started',
        priority: priority,
        watched: [],
        toWatch: [],
        notes: notes,
        targetDate: dueDate,
        children: []
      };

      if (parentId === null) {
        syllabus.rootIds.push(newId);
      } else {
        syllabus.nodes[parentId].children.push(newId);
      }
    }

    nodeDialog.close();
    updateApp();
  }

  function deleteNode(id) {
    nodeIdToDelete = id;
    confirmDeleteDialog.showModal();
  }

  function executeDeleteNode(id) {
    const node = syllabus.nodes[id];
    if (!node) return;

    // Remove from parent
    if (node.parentId) {
      const parent = syllabus.nodes[node.parentId];
      if (parent) {
        parent.children = parent.children.filter(childId => childId !== id);
      }
    } else {
      syllabus.rootIds = syllabus.rootIds.filter(childId => childId !== id);
    }

    // Recursively delete children
    function recursivelyDelete(nodeId) {
      const n = syllabus.nodes[nodeId];
      if (n && n.children) {
        n.children.forEach(childId => recursivelyDelete(childId));
      }
      delete syllabus.nodes[nodeId];
      expandedNodes.delete(nodeId);
    }

    recursivelyDelete(id);
    saveExpandedStates();
    updateApp();
  }

  function cycleStatus(id) {
    const node = syllabus.nodes[id];
    const statuses = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(node.status);
    node.status = statuses[(currentIndex + 1) % statuses.length];

    // If completing a parent, optionally complete all children? (Leaving out for safety)
    updateApp();
  }

  // --- RENDERING LOGIC ---
  function renderTree() {
    treeContainer.innerHTML = '';

    if (syllabus.rootIds.length === 0) {
      treeContainer.innerHTML = '<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No topics added yet. Click "Add Root Topic" to begin.</div>';
      return;
    }

    syllabus.rootIds.forEach(id => {
      const nodeEl = createNodeElement(id);
      if (nodeEl) {
        treeContainer.appendChild(nodeEl);
      }
    });
  }

  function createNodeElement(id) {
    const node = syllabus.nodes[id];
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;

    let isExpanded = expandedNodes.has(id);
    // Force expand if actively searching
    if (filterQuery && filterQuery.trim().length > 0) {
      isExpanded = true;
    }

    // Apply filtering logic
    let matchesFilter = true;

    if (filterQuery && !node.title.toLowerCase().includes(filterQuery)) {
      matchesFilter = false;
    }
    if (filterStatus !== 'all' && node.status !== filterStatus) {
      matchesFilter = false;
    }
    if (filterPriority !== 'all' && node.priority !== filterPriority) {
      matchesFilter = false;
    }

    // If it doesn't match filter, we only show it if a child matches (recursive check)
    let childNodesEls = [];
    let anyChildMatches = false;

    if (hasChildren) {
      node.children.forEach(childId => {
        const childEl = createNodeElement(childId);
        if (childEl) {
          childNodesEls.push(childEl);
          anyChildMatches = true;
        }
      });
    }

    if (!matchesFilter && !anyChildMatches) {
      return null; // Hide this branch completely
    }

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';

    // Determine status badge text
    let statusText = 'Not Started';
    if (node.status === 'in-progress') statusText = 'In Progress';
    if (node.status === 'completed') statusText = 'Completed';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'node-content';

    contentDiv.innerHTML = `
      <div class="node-toggle ${hasChildren ? '' : 'hidden'} ${isExpanded ? 'expanded' : ''}" data-id="${node.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
      <div class="priority-indicator priority-${node.priority}" title="Priority: ${node.priority}"></div>
      <div class="node-info">
        <input type="checkbox" class="node-checkbox" data-id="${node.id}" ${node.status === 'completed' ? 'checked' : ''} title="Mark as completed">
        <div class="node-title-group">
          <span class="node-title">${node.title}</span>
          ${node.targetDate || node.notes ? `
          <div class="node-meta-row">
            ${node.targetDate ? `<span class="node-meta due-date" title="Due Date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>${node.targetDate}</span>` : ''}
            ${node.notes ? `<span class="node-meta notes-icon" data-tooltip="${node.notes.replace(/"/g, '&quot;')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Notes attached</span>` : ''}
          </div>` : ''}
        </div>
      </div>
      <select class="status-badge status-select status-${node.status}" data-id="${node.id}" title="Change status">
        <option value="not-started" ${node.status === 'not-started' ? 'selected' : ''}>Not Started</option>
        <option value="in-progress" ${node.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${node.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
      <div class="node-controls">
        <button class="control-btn btn-add-child" data-id="${node.id}" title="Add Subtopic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button class="control-btn btn-edit" data-id="${node.id}" title="Edit Topic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="control-btn btn-delete" data-id="${node.id}" title="Delete Topic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    nodeDiv.appendChild(contentDiv);

    // Event Listeners for inline controls
    const toggleBtn = contentDiv.querySelector('.node-toggle');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (expandedNodes.has(id)) {
        expandedNodes.delete(id);
      } else {
        expandedNodes.add(id);
      }
      saveExpandedStates();
      renderTree();
    });

    const statusSelect = contentDiv.querySelector('.status-select');
    statusSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      const newStatus = e.target.value;
      cascadeStatusDownwards(id, newStatus);
      cascadeStatusUpwards(id);
      updateApp();
    });

    const checkbox = contentDiv.querySelector('.node-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      const newStatus = e.target.checked ? 'completed' : 'not-started';
      cascadeStatusDownwards(id, newStatus);
      cascadeStatusUpwards(id);
      updateApp();
    });

    const btnAddChild = contentDiv.querySelector('.btn-add-child');
    btnAddChild.addEventListener('click', (e) => {
      e.stopPropagation();
      expandedNodes.add(id); // auto-expand to show new child
      saveExpandedStates();
      openNodeDialog(id, null);
    });

    const btnEdit = contentDiv.querySelector('.btn-edit');
    btnEdit.addEventListener('click', (e) => {
      e.stopPropagation();
      openNodeDialog(node.parentId, id);
    });

    const btnDelete = contentDiv.querySelector('.btn-delete');
    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNode(id);
    });

    // Children Container
    if (hasChildren) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = `node-children ${!isExpanded ? 'collapsed' : ''}`;
      childNodesEls.forEach(childEl => childrenDiv.appendChild(childEl));
      nodeDiv.appendChild(childrenDiv);
    }

    return nodeDiv;
  }

  // --- STATISTICS ---
  function updateStatistics() {
    let total = 0;
    let completed = 0;

    Object.values(syllabus.nodes).forEach(node => {
      total++;
      if (node.status === 'completed') completed++;
    });

    statTotal.textContent = total;
    statCompleted.textContent = completed;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    statProgress.textContent = `${percentage}%`;
    statProgressFill.style.width = `${percentage}%`;
  }

  // --- BOOTSTRAP ---
  init();
});
