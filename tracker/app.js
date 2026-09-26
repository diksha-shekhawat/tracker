import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBshVCW04oA4djsLhC9jusZdI9mgr_MJP4",
  authDomain: "tracker-1edc2.firebaseapp.com",
  projectId: "tracker-1edc2",
  storageBucket: "tracker-1edc2.firebasestorage.app",
  messagingSenderId: "294749759631",
  appId: "1:294749759631:web:40cd079eec3535c683a8fa"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
  const defaultSyllabus = window.defaultSyllabus;
  // --- APPLICATION STATE ---
  let syllabus = null;
  let expandedNodes = new Set();
  let filterQuery = '';
  let filterStatus = 'all';
  let filterPriority = 'all';
  let eventListenersSetup = false;

  // Daily Streak State
  let previousCompletedCount = null;
  let dailyCompletedCount = 0;
  let lastActiveDate = '';

  // Daily Goals State
  let dailyGoals = [];
  let dailyGoalsLog = {};
  let dailyRevisionNotes = {};
  let currentStartOfWeek = new Date();

  // --- LOCAL STORAGE KEY ---
  const STORAGE_KEY = 'upsc_syllabus_data';
  const EXPANDED_STORAGE_KEY = 'upsc_syllabus_expanded';
  const LEGACY_STORAGE_KEY = 'upsc_syllabus_data_v13';
  const LEGACY_EXPANDED_KEY = 'upsc_syllabus_expanded_v13';
  const DAILY_STREAK_KEY = 'upsc_syllabus_daily_streak';
  const DAILY_GOALS_KEY = 'upsc_daily_goals';
  const DAILY_GOALS_LOG_KEY = 'upsc_daily_goals_log';
  const DAILY_REVISION_NOTES_KEY = 'upsc_daily_revision_notes';

  // --- DOM ELEMENT REFERENCES ---
  const treeContainer = document.getElementById('checklist-tree');

  const searchInput = document.getElementById('search-input');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterPrioritySelect = document.getElementById('filter-priority');

  const statProgress = document.getElementById('stat-progress');
  const statProgressFill = document.getElementById('stat-progress-fill');
  const statCompleted = document.getElementById('stat-completed');
  const statTotal = document.getElementById('stat-total');
  const statDailyStreak = document.getElementById('stat-daily-streak');

  const btnAddRootTopic = document.getElementById('btn-add-root-topic');
  const btnExpandAll = document.getElementById('btn-expand-all');
  const btnCollapseAll = document.getElementById('btn-collapse-all');

  const btnMassDelete = document.getElementById('btn-mass-delete');
  const massDeleteDialog = document.getElementById('mass-delete-dialog');
  const massDeleteForm = document.getElementById('mass-delete-form');
  const massDeleteList = document.getElementById('mass-delete-list');
  const massDeleteSearch = document.getElementById('mass-delete-search');
  const btnMassDeleteToggleAll = document.getElementById('btn-mass-delete-toggle-all');
  const btnMassDeleteCancel = document.getElementById('btn-mass-delete-cancel');

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

  // Daily Goals Elements
  const tabSyllabus = document.getElementById('tab-syllabus');
  const tabDaily = document.getElementById('tab-daily');
  const syllabusTabContent = document.getElementById('syllabus-tab-content');
  const dailyTabContent = document.getElementById('daily-tab-content');
  const dailyGoalForm = document.getElementById('daily-goal-form');
  const dailyGoalTitle = document.getElementById('daily-goal-title');
  const dailyGoalType = document.getElementById('daily-goal-type');
  const dailyGoalDate = document.getElementById('daily-goal-date');
  const btnPrevWeek = document.getElementById('btn-prev-week');
  const btnNextWeek = document.getElementById('btn-next-week');
  const currentWeekRange = document.getElementById('current-week-range');
  const dailyTableHeader = document.getElementById('daily-table-header');
  const dailyActiveTableBody = document.getElementById('daily-active-table-body');
  const dailyBacklogTableBody = document.getElementById('daily-backlog-table-body');

  // Revision Note Dialog Elements
  const revisionNoteDialog = document.getElementById('revision-note-dialog');
  const revisionNoteForm = document.getElementById('revision-note-form');
  const revisionNoteDate = document.getElementById('revision-note-date');
  const revisionNoteText = document.getElementById('revision-note-text');
  const revisionNoteDateLabel = document.getElementById('revision-note-date-label');
  const btnRevisionNoteCancel = document.getElementById('btn-revision-note-cancel');

  // --- INITIALIZATION ---
  async function init() {
    let serverData = {};
    try {
      if (!currentUser) return;
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        serverData = docSnap.data();
      }
    } catch (e) {
      console.error("Could not fetch data from Firestore, falling back to local storage", e);
    }

    // Load Daily Streak
    const dailyData = serverData.dailyStreak
      ? (typeof serverData.dailyStreak === 'string' ? serverData.dailyStreak : JSON.stringify(serverData.dailyStreak))
      : localStorage.getItem(DAILY_STREAK_KEY);
    if (dailyData) {
      try {
        const parsed = JSON.parse(dailyData);
        lastActiveDate = parsed.date;
        dailyCompletedCount = parsed.count;
      } catch (e) { }
    }

    let savedData = serverData.syllabus
      ? (typeof serverData.syllabus === 'string' ? serverData.syllabus : JSON.stringify(serverData.syllabus))
      : localStorage.getItem(STORAGE_KEY);
    let migrated = false;

    if (!savedData && !serverData.syllabus) {
      savedData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedData) {
        migrated = true;
      }
    }

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        syllabus = parsed;

        let hasUpdates = false;

        for (let id in defaultSyllabus.nodes) {
          if (!syllabus.nodes[id]) {
            syllabus.nodes[id] = JSON.parse(JSON.stringify(defaultSyllabus.nodes[id]));
            hasUpdates = true;
          }
        }

        for (let rootId of defaultSyllabus.rootIds) {
          if (!syllabus.rootIds.includes(rootId)) {
            syllabus.rootIds.push(rootId);
            hasUpdates = true;
          }
        }

        for (let id in defaultSyllabus.nodes) {
          if (syllabus.nodes[id]) {
            let defaultChildren = defaultSyllabus.nodes[id].children;
            let existingChildren = syllabus.nodes[id].children;
            for (let childId of defaultChildren) {
              if (!existingChildren.includes(childId)) {
                existingChildren.push(childId);
                hasUpdates = true;
              }
            }
          }
        }

        // PRUNING LOGIC: Remove system nodes (node_XX) that no longer exist in defaultSyllabus
        let nodesToDelete = [];
        for (let id in syllabus.nodes) {
          // Only prune nodes generated by the python script (starts with node_)
          if (id.startsWith('node_') && !defaultSyllabus.nodes[id]) {
            nodesToDelete.push(id);
          }
        }

        if (nodesToDelete.length > 0) {
          hasUpdates = true;
          for (let id of nodesToDelete) {
            delete syllabus.nodes[id];

            let indexInRoot = syllabus.rootIds.indexOf(id);
            if (indexInRoot !== -1) {
              syllabus.rootIds.splice(indexInRoot, 1);
            }
          }

          // Remove deleted children from their parents
          for (let id in syllabus.nodes) {
            let children = syllabus.nodes[id].children;
            let originalLength = children.length;
            let updatedChildren = children.filter(childId => !nodesToDelete.includes(childId));
            if (updatedChildren.length !== originalLength) {
              syllabus.nodes[id].children = updatedChildren;
            }
          }
        }

        if (hasUpdates || migrated || (!serverData.syllabus && savedData)) {
          saveSyllabusData();
        }

      } catch (e) {
        console.error("Error parsing saved syllabus data", e);
        syllabus = JSON.parse(JSON.stringify(defaultSyllabus));
      }
    } else {
      syllabus = JSON.parse(JSON.stringify(defaultSyllabus));
    }

    let savedExpanded = serverData.expandedNodes
      ? (typeof serverData.expandedNodes === 'string' ? serverData.expandedNodes : JSON.stringify(serverData.expandedNodes))
      : localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!savedExpanded && migrated && !serverData.expandedNodes) {
      savedExpanded = localStorage.getItem(LEGACY_EXPANDED_KEY);
    }

    if (savedExpanded) {
      try {
        expandedNodes = new Set(JSON.parse(savedExpanded));
        if (migrated || (!serverData.expandedNodes && savedExpanded)) {
          saveExpandedStates();
        }
      } catch (e) {
        expandedNodes = new Set();
      }
    }

    // Load Daily Goals & Tasks
    let savedDailyGoals = serverData.dailyGoals
      ? (typeof serverData.dailyGoals === 'string' ? serverData.dailyGoals : JSON.stringify(serverData.dailyGoals))
      : localStorage.getItem(DAILY_GOALS_KEY);
    if (savedDailyGoals) {
      try {
        dailyGoals = JSON.parse(savedDailyGoals);
      } catch (e) {
        dailyGoals = [];
      }
    } else {
      dailyGoals = [];
    }

    let savedDailyGoalsLog = serverData.dailyGoalsLog
      ? (typeof serverData.dailyGoalsLog === 'string' ? serverData.dailyGoalsLog : JSON.stringify(serverData.dailyGoalsLog))
      : localStorage.getItem(DAILY_GOALS_LOG_KEY);
    if (savedDailyGoalsLog) {
      try {
        dailyGoalsLog = JSON.parse(savedDailyGoalsLog);
      } catch (e) {
        dailyGoalsLog = {};
      }
    } else {
      dailyGoalsLog = {};
    }

    let savedDailyRevisionNotes = serverData.dailyRevisionNotes
      ? (typeof serverData.dailyRevisionNotes === 'string' ? serverData.dailyRevisionNotes : JSON.stringify(serverData.dailyRevisionNotes))
      : localStorage.getItem(DAILY_REVISION_NOTES_KEY);
    if (savedDailyRevisionNotes) {
      try {
        dailyRevisionNotes = JSON.parse(savedDailyRevisionNotes);
      } catch (e) {
        dailyRevisionNotes = {};
      }
    } else {
      dailyRevisionNotes = {};
    }

    currentStartOfWeek = getStartOfWeek(new Date());

    setupEventListeners();
    updateApp();
    renderDailyGoals();
  }

  function setupEventListeners() {
    if (eventListenersSetup) return;
    eventListenersSetup = true;
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
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_EXPANDED_KEY);
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

    // Tabs Toggling
    tabSyllabus.addEventListener('click', () => {
      tabSyllabus.classList.add('active');
      tabDaily.classList.remove('active');
      syllabusTabContent.classList.add('active');
      dailyTabContent.classList.remove('active');
    });

    tabDaily.addEventListener('click', () => {
      tabDaily.classList.add('active');
      tabSyllabus.classList.remove('active');
      syllabusTabContent.classList.remove('active');
      dailyTabContent.classList.add('active');
      renderDailyGoals();
    });

    // Toggle Date Input on Form
    dailyGoalType.addEventListener('change', () => {
      if (dailyGoalType.value === 'one-time') {
        dailyGoalDate.style.display = 'block';
        dailyGoalDate.value = new Date().toISOString().split('T')[0];
      } else {
        dailyGoalDate.style.display = 'none';
        dailyGoalDate.value = '';
      }
    });

    // Submit Daily Goal Form
    dailyGoalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = dailyGoalTitle.value.trim();
      const type = dailyGoalType.value;
      const date = dailyGoalDate.value || null;
      if (!title) return;

      const newGoal = {
        id: 'dg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        type: type,
        date: date
      };

      dailyGoals.push(newGoal);
      saveDailyGoalsData();
      renderDailyGoals();

      dailyGoalTitle.value = '';
      dailyGoalType.value = 'recurring';
      dailyGoalDate.style.display = 'none';
      dailyGoalDate.value = '';
    });

    // Week navigation
    btnPrevWeek.addEventListener('click', () => {
      currentStartOfWeek.setDate(currentStartOfWeek.getDate() - 7);
      renderDailyGoals();
    });

    btnNextWeek.addEventListener('click', () => {
      currentStartOfWeek.setDate(currentStartOfWeek.getDate() + 7);
      renderDailyGoals();
    });

    // Revision Note Dialog Bindings
    btnRevisionNoteCancel.addEventListener('click', () => {
      revisionNoteDialog.close();
    });

    revisionNoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateStr = revisionNoteDate.value;
      const notesText = revisionNoteText.value.trim();
      if (notesText) {
        dailyRevisionNotes[dateStr] = notesText;
      } else {
        delete dailyRevisionNotes[dateStr];
      }
      saveDailyRevisionNotesData();
      revisionNoteDialog.close();
      renderDailyGoals();
    });
  }

  // --- DATA PERSISTENCE ---
  function saveSyllabusData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syllabus));
    if (!currentUser) return;
    setDoc(doc(db, "users", currentUser.uid), { syllabus: JSON.stringify(syllabus) }, { merge: true })
      .catch(e => console.error("Failed to save syllabus to Firestore", e));
  }

  function saveExpandedStates() {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(expandedNodes)));
    if (!currentUser) return;
    setDoc(doc(db, "users", currentUser.uid), { expandedNodes: JSON.stringify(Array.from(expandedNodes)) }, { merge: true })
      .catch(e => console.error("Failed to save expanded states to Firestore", e));
  }

  function saveDailyGoalsData() {
    localStorage.setItem(DAILY_GOALS_KEY, JSON.stringify(dailyGoals));
    if (!currentUser) return;
    setDoc(doc(db, "users", currentUser.uid), { dailyGoals: JSON.stringify(dailyGoals) }, { merge: true })
      .catch(e => console.error("Failed to save daily goals to Firestore", e));
  }

  function saveDailyGoalsLogData() {
    localStorage.setItem(DAILY_GOALS_LOG_KEY, JSON.stringify(dailyGoalsLog));
    if (!currentUser) return;
    setDoc(doc(db, "users", currentUser.uid), { dailyGoalsLog: JSON.stringify(dailyGoalsLog) }, { merge: true })
      .catch(e => console.error("Failed to save daily goals log to Firestore", e));
  }

  function saveDailyRevisionNotesData() {
    localStorage.setItem(DAILY_REVISION_NOTES_KEY, JSON.stringify(dailyRevisionNotes));
    if (!currentUser) return;
    setDoc(doc(db, "users", currentUser.uid), { dailyRevisionNotes: JSON.stringify(dailyRevisionNotes) }, { merge: true })
      .catch(e => console.error("Failed to save daily revision notes to Firestore", e));
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
      today.setHours(0, 0, 0, 0);
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

    // Daily Streak Logic
    let today = new Date().toLocaleDateString();
    if (lastActiveDate !== today) {
      dailyCompletedCount = 0;
      lastActiveDate = today;
      previousCompletedCount = completed; // Reset baseline for the new day
    } else {
      if (previousCompletedCount !== null) {
        if (completed > previousCompletedCount) {
          dailyCompletedCount += (completed - previousCompletedCount);
        } else if (completed < previousCompletedCount) {
          dailyCompletedCount -= (previousCompletedCount - completed);
        }
      }
      previousCompletedCount = completed;
    }

    if (dailyCompletedCount < 0) dailyCompletedCount = 0;

    if (statDailyStreak) statDailyStreak.textContent = dailyCompletedCount;

    const streakData = {
      date: lastActiveDate,
      count: dailyCompletedCount
    };
    localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(streakData));

    if (!currentUser) return;
    setDoc(doc(db, "users", currentUser.uid), { dailyStreak: JSON.stringify(streakData) }, { merge: true })
      .catch(e => console.error("Failed to save daily streak to Firestore", e));
  }


  // --- MASS DELETE LOGIC ---
  function populateMassDeleteList(filterText = '') {
    massDeleteList.innerHTML = '';

    function renderMassDeleteNode(id, depth) {
      const node = syllabus.nodes[id];
      if (!node) return;

      const matchesSearch = filterText === '' || node.title.toLowerCase().includes(filterText.toLowerCase());

      if (matchesSearch) {
        const itemDiv = document.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.padding = '4px 0';
        itemDiv.style.marginLeft = `${depth * 20}px`;
        itemDiv.style.borderBottom = '1px solid var(--border-color)';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = id;
        checkbox.className = 'mass-delete-checkbox';
        checkbox.style.marginRight = '8px';
        checkbox.style.cursor = 'pointer';

        const label = document.createElement('label');
        label.textContent = node.title;
        label.style.cursor = 'pointer';
        label.style.flex = '1';
        label.style.fontSize = '0.9rem';
        label.style.color = 'var(--text-primary)';

        label.addEventListener('click', () => {
          checkbox.checked = !checkbox.checked;
        });

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        massDeleteList.appendChild(itemDiv);
      }

      if (node.children) {
        node.children.forEach(childId => renderMassDeleteNode(childId, depth + 1));
      }
    }

    syllabus.rootIds.forEach(rootId => renderMassDeleteNode(rootId, 0));
  }

  if (btnMassDelete) {
    btnMassDelete.addEventListener('click', () => {
      massDeleteSearch.value = '';
      populateMassDeleteList();
      massDeleteDialog.showModal();
    });
  }

  if (btnMassDeleteCancel) {
    btnMassDeleteCancel.addEventListener('click', () => {
      massDeleteDialog.close();
    });
  }

  if (massDeleteSearch) {
    massDeleteSearch.addEventListener('input', (e) => {
      populateMassDeleteList(e.target.value);
    });
  }

  if (btnMassDeleteToggleAll) {
    btnMassDeleteToggleAll.addEventListener('click', () => {
      const checkboxes = massDeleteList.querySelectorAll('.mass-delete-checkbox');
      const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
      checkboxes.forEach(cb => cb.checked = anyUnchecked);
      btnMassDeleteToggleAll.textContent = anyUnchecked ? 'Deselect All' : 'Select All';
    });
  }

  if (massDeleteForm) {
    massDeleteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const checkboxes = massDeleteList.querySelectorAll('.mass-delete-checkbox:checked');
      if (checkboxes.length === 0) {
        alert("Please select at least one topic to delete.");
        return;
      }

      const idsToDelete = Array.from(checkboxes).map(cb => cb.value);

      idsToDelete.forEach(id => {
        if (syllabus.nodes[id]) {
          const node = syllabus.nodes[id];
          if (node.parentId && syllabus.nodes[node.parentId]) {
            const parent = syllabus.nodes[node.parentId];
            parent.children = parent.children.filter(childId => childId !== id);
          } else {
            syllabus.rootIds = syllabus.rootIds.filter(childId => childId !== id);
          }
          function recursivelyDelete(nodeId) {
            const n = syllabus.nodes[nodeId];
            if (n && n.children) {
              n.children.forEach(childId => recursivelyDelete(childId));
            }
            delete syllabus.nodes[nodeId];
            expandedNodes.delete(nodeId);
          }
          recursivelyDelete(id);
        }
      });

      saveExpandedStates();
      updateApp();
      massDeleteDialog.close();
    });
  }

  // --- DAILY GOALS & TRACKER LOGIC ---
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // standard Monday start
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  }

  function getDaysRange(centerDate, rangeBefore = 15, rangeAfter = 15) {
    const days = [];
    for (let i = -rangeBefore; i <= rangeAfter; i++) {
      const d = new Date(centerDate);
      d.setDate(centerDate.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function renderDailyGoals() {
    if (!currentWeekRange || !dailyTableHeader || !dailyActiveTableBody || !dailyBacklogTableBody) return;
    const days = getDaysRange(currentStartOfWeek);

    // Render Header
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startLabel = `${days[0].getDate()} ${months[days[0].getMonth()]}`;
    const endLabel = `${days[days.length - 1].getDate()} ${months[days[days.length - 1].getMonth()]} ${days[days.length - 1].getFullYear()}`;
    currentWeekRange.textContent = `${startLabel} - ${endLabel}`;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let headerHTML = `<th style="text-align: left;">Task / Goal</th>`;
    headerHTML += `<th>Type</th>`;
    days.forEach((day) => {
      const dateStr = formatDateISO(day);
      const isToday = dateStr === formatDateISO(new Date());
      const dayName = dayNames[day.getDay()];
      const style = isToday ? 'class="today-column"' : '';
      const hasNote = dailyRevisionNotes[dateStr] && dailyRevisionNotes[dateStr].trim().length > 0;
      const noteIconColor = hasNote ? 'var(--text-secondary)' : 'var(--text-muted)';
      const noteTooltip = hasNote ? dailyRevisionNotes[dateStr].replace(/"/g, '&quot;') : 'Click to add revision notes';
      
      headerHTML += `
        <th ${style} style="text-align: center; font-size: 0.8rem; vertical-align: top; min-width: 90px; padding: 0.5rem 0.25rem;">
          <div style="font-weight: bold; margin-bottom: 2px;">${dayName}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">${day.getDate()} ${months[day.getMonth()]}</div>
          <button class="btn-day-revision-note" data-date="${dateStr}" data-date-label="${day.getDate()} ${months[day.getMonth()]} (${dayName})" title="${noteTooltip}" style="background: ${hasNote ? 'var(--primary-light)' : 'none'}; border: 1px solid ${hasNote ? 'var(--text-secondary)' : 'rgba(0,0,0,0.1)'}; cursor: pointer; color: ${noteIconColor}; padding: 2px 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 0.65rem; border-radius: 4px; transition: all 0.2s;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>${hasNote ? 'Note' : 'Add'}</span>
          </button>
        </th>
      `;
    });
    headerHTML += `<th style="text-align: center;">Action</th>`;
    dailyTableHeader.innerHTML = headerHTML;

    // Filter goals by section
    const activeGoals = [];
    const backlogGoals = [];
    dailyGoals.forEach(goal => {
      if (goal.section === 'backlog') {
        backlogGoals.push(goal);
      } else {
        goal.section = 'active';
        activeGoals.push(goal);
      }
    });

    // Helper to generate group HTML
    function generateTableHTML(goalsList) {
      if (goalsList.length === 0) {
        return `<tr><td colspan="40" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No tasks here. Drag tasks or add one above!</td></tr>`;
      }
      
      let html = '';
      goalsList.forEach(goal => {
        html += `<tr draggable="true" data-goal-id="${goal.id}" style="cursor: grab;">`;

        // Goal Title
        let goalDetail = `<strong>${goal.title}</strong>`;
        if (goal.type === 'one-time') {
          const goalDate = new Date(goal.date);
          goalDetail += `<br><span style="font-size: 0.75rem; color: var(--text-muted);">For: ${goalDate.getDate()} ${months[goalDate.getMonth()]}</span>`;
        }
        html += `<td>${goalDetail}</td>`;

        // Type Badge
        const badgeClass = goal.type === 'recurring' ? 'recurring' : 'one-time';
        const badgeText = goal.type === 'recurring' ? 'Daily' : 'One-Time';
        html += `<td><span class="goal-type-badge ${badgeClass}">${badgeText}</span></td>`;

        // Checkbox Columns
        days.forEach(day => {
          const dateStr = formatDateISO(day);

          if (goal.type === 'one-time') {
            if (goal.date === dateStr) {
              const isCompleted = dailyGoalsLog[dateStr] && dailyGoalsLog[dateStr][goal.id];
              html += `
                <td class="daily-checkbox-cell">
                  <input type="checkbox" class="daily-checkbox" data-date="${dateStr}" data-goal-id="${goal.id}" ${isCompleted ? 'checked' : ''}>
                </td>`;
            } else {
              html += `<td class="disabled-cell">-</td>`;
            }
          } else {
            const isCompleted = dailyGoalsLog[dateStr] && dailyGoalsLog[dateStr][goal.id];
            html += `
              <td class="daily-checkbox-cell">
                <input type="checkbox" class="daily-checkbox" data-date="${dateStr}" data-goal-id="${goal.id}" ${isCompleted ? 'checked' : ''}>
              </td>`;
          }
        });

        // Delete Button
        html += `
          <td style="text-align: center;">
            <button class="btn-delete-goal" data-goal-id="${goal.id}" title="Delete Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>`;

        html += `</tr>`;
      });
      return html;
    }

    dailyActiveTableBody.innerHTML = generateTableHTML(activeGoals);
    dailyBacklogTableBody.innerHTML = generateTableHTML(backlogGoals);

    // Attach Event Listeners to Dynamically Rendered Controls
    const allBodies = [dailyActiveTableBody, dailyBacklogTableBody];
    allBodies.forEach(body => {
      body.querySelectorAll('.daily-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const dateStr = e.target.getAttribute('data-date');
          const goalId = e.target.getAttribute('data-goal-id');
          const checked = e.target.checked;

          if (!dailyGoalsLog[dateStr]) {
            dailyGoalsLog[dateStr] = {};
          }
          dailyGoalsLog[dateStr][goalId] = checked;
          saveDailyGoalsLogData();
        });
      });

      body.querySelectorAll('.btn-delete-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const goalId = e.currentTarget.getAttribute('data-goal-id');
          deleteDailyGoal(goalId);
        });
      });
    });

    // Attach Event Listeners to Revision Note buttons in the table header
    dailyTableHeader.querySelectorAll('.btn-day-revision-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.getAttribute('data-date');
        const dateLabel = e.currentTarget.getAttribute('data-date-label');
        
        revisionNoteDate.value = dateStr;
        revisionNoteDateLabel.textContent = `What did you revise on ${dateLabel}?`;
        revisionNoteText.value = dailyRevisionNotes[dateStr] || '';
        
        revisionNoteDialog.showModal();
      });
    });

    // --- Drag and Drop Bindings ---
    const rows = document.querySelectorAll('.daily-goals-table tbody tr[draggable="true"]');
    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        row.classList.add('dragging');
        e.dataTransfer.setData('text/plain', row.getAttribute('data-goal-id'));
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
      });
    });

    const dropzones = [dailyActiveTableBody, dailyBacklogTableBody];
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const goalId = e.dataTransfer.getData('text/plain');
        const targetSection = zone.getAttribute('data-section'); // 'active' or 'backlog'
        
        const goalIndex = dailyGoals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1 && dailyGoals[goalIndex].section !== targetSection) {
          dailyGoals[goalIndex].section = targetSection;
          saveDailyGoalsData();
          renderDailyGoals();
        }
      });
    });

    // Auto-scroll today's column into view inside the horizontal table wrapper
    setTimeout(() => {
      const todayCell = dailyTableHeader.querySelector('.today-column');
      const tableWrapper = document.querySelector('.table-responsive');
      if (todayCell && tableWrapper) {
        const cellOffsetLeft = todayCell.offsetLeft;
        const wrapperHalfWidth = tableWrapper.offsetWidth / 2;
        tableWrapper.scrollLeft = cellOffsetLeft - wrapperHalfWidth;
      }
    }, 50);

    // Sync horizontal scroll between table body and header wrappers
    const headerWrapper = document.querySelector('.daily-table-header-wrapper');
    const bodyWrapper = document.querySelector('.daily-table-body-wrapper');
    if (headerWrapper && bodyWrapper) {
      bodyWrapper.addEventListener('scroll', () => {
        headerWrapper.scrollLeft = bodyWrapper.scrollLeft;
      });
    }
  }

  function deleteDailyGoal(goalId) {
    if (confirm("Are you sure you want to delete this task? All completion logs for this task will be permanently removed.")) {
      dailyGoals = dailyGoals.filter(goal => goal.id !== goalId);
      saveDailyGoalsData();

      // Clean up logs
      Object.keys(dailyGoalsLog).forEach(dateStr => {
        if (dailyGoalsLog[dateStr] && dailyGoalsLog[dateStr][goalId] !== undefined) {
          delete dailyGoalsLog[dateStr][goalId];
        }
        if (dailyGoalsLog[dateStr] && Object.keys(dailyGoalsLog[dateStr]).length === 0) {
          delete dailyGoalsLog[dateStr];
        }
      });
      saveDailyGoalsLogData();
      renderDailyGoals();
    }
  }

  // --- AUTHENTICATION & BOOTSTRAP ---
  let currentUser = null;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      document.getElementById('auth-overlay').style.display = 'none';
      document.getElementById('auth-user-email').textContent = `Logged in as: ${user.email}`;
      document.getElementById('btn-logout').style.display = 'flex';
      init();
    } else {
      currentUser = null;
      document.getElementById('auth-overlay').style.display = 'flex';
      document.getElementById('auth-user-email').textContent = '';
      document.getElementById('btn-logout').style.display = 'none';
      syllabus = null;
      expandedNodes = new Set();
      treeContainer.innerHTML = '';
    }
  });

  document.getElementById('btn-login-google').addEventListener('click', () => {
    signInWithPopup(auth, googleProvider).catch(e => console.error("Login failed", e));
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
  });
});
