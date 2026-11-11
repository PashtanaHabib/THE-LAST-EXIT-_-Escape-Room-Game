// inventory.js — collected items

// Public API:
// addItem(itemId)     add an item (returns true if it is new)
// removeItem(itemId)  remove an item
// hasItem(itemId)     true / false
// renderInventory()   draw the inventory panel
// Item definitions live in puzzles.js (ITEMS).

function hasItem(itemId) {
  return !!gameState && gameState.inventory.indexOf(itemId) !== -1;
}

function addItem(itemId) {
  if (!gameState || !getItemDef(itemId) || hasItem(itemId)) return false;
  gameState.inventory.push(itemId);
  saveGame();
  renderInventory(itemId);
  var def = getItemDef(itemId);
  showToast(def.icon + '  ' + def.name + ' added to inventory');
  return true;
}

function removeItem(itemId) {
  if (!gameState) return false;
  var i = gameState.inventory.indexOf(itemId);
  if (i === -1) return false;
  gameState.inventory.splice(i, 1);
  saveGame();
  renderInventory();
  return true;
}

function renderInventory(newItemId) {
  var list = document.getElementById('inventory-list');
  if (!list || !gameState) return;
  var count = document.getElementById('inventory-count');
  if (count) count.textContent = gameState.inventory.length;
  list.innerHTML = '';
  if (!gameState.inventory.length) {
    list.innerHTML = '<p class="inv-empty">Nothing yet. Click on objects in the room to investigate.</p>';
    return;
  }
  gameState.inventory.forEach(function (id) {
    var def = getItemDef(id);
    if (!def) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'inv-item' + (id === newItemId ? ' new' : '');
    b.innerHTML = '<span class="inv-icon">' + def.icon + '</span><span class="inv-name">' + escapeHtml(def.name) + '</span>';
    b.addEventListener('click', function () {
      playSound('click');
      showInfo(def.name, def.desc, null, def.icon);
    });
    list.appendChild(b);
  });
}