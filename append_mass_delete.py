with open('app.js', 'r') as f:
    content = f.read()

# Insert DOM element references
dom_ref_marker = "const btnMassAdd = document.getElementById('btn-mass-add');"
# Let's just find "const btnResetData" and insert there
new_dom_refs = """
  const btnMassDelete = document.getElementById('btn-mass-delete');
  const massDeleteDialog = document.getElementById('mass-delete-dialog');
  const massDeleteForm = document.getElementById('mass-delete-form');
  const massDeleteList = document.getElementById('mass-delete-list');
  const massDeleteSearch = document.getElementById('mass-delete-search');
  const btnMassDeleteToggleAll = document.getElementById('btn-mass-delete-toggle-all');
  const btnMassDeleteCancel = document.getElementById('btn-mass-delete-cancel');
"""
content = content.replace("  const btnResetData", new_dom_refs + "\n  const btnResetData")

new_logic = """
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
"""

content = content.replace("  // --- BOOTSTRAP ---", new_logic + "\n  // --- BOOTSTRAP ---")

with open('app.js', 'w') as f:
    f.write(content)

print("Injected mass delete logic successfully.")
