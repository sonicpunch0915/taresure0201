// 買い物リストデータ
let shoppingList = [];
let savedData = null;

// 初期化時にデータを読み込み
try {
    savedData = JSON.parse(localStorage.getItem('shoppingList_v5'));
    if (savedData) {
        if (Array.isArray(savedData)) {
            shoppingList = savedData;
        } else if (savedData.shoppingList) {
            shoppingList = savedData.shoppingList || [];
        }
    }
} catch (error) {
    console.error('Error loading saved data:', error);
    shoppingList = [];
}

// DOM要素
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addItemForm = document.getElementById('add-item-form');
const shoppingItemsContainer = document.getElementById('shopping-items');
const totalAmountElement = document.getElementById('total-amount');
const itemCountElement = document.getElementById('item-count');
const spaceCountElement = document.getElementById('space-count');
const imagePreview = document.getElementById('image-preview');
const itemImageInput = document.getElementById('item-image');
const mapUpload = document.getElementById('map-upload');
const mapDisplay = document.getElementById('map-display');
const spaceInfoPanel = document.getElementById('space-info-panel');
const spaceInfoContent = document.getElementById('space-info-content');
const spaceInfoTitle = document.getElementById('space-info-title');

// 地図関連
let currentMap = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    renderShoppingList();
    updateStats();
    
    // 保存された地図を復元
    if (savedData && savedData.mapContent && savedData.currentMap) {
        mapDisplay.innerHTML = savedData.mapContent;
        mapDisplay.classList.add('has-map');
        currentMap = savedData.currentMap;
        setupMapInteraction();
        updateMapColors();
    }
});

// イベントリスナー設定
function setupEventListeners() {
    // タブ切り替え
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // フォーム送信
    addItemForm.addEventListener('submit', handleAddItem);

    // 画像プレビュー
    itemImageInput.addEventListener('change', handleImagePreview);

    // 地図関連
    mapUpload.addEventListener('change', handleMapUpload);
    document.getElementById('create-sample-map').addEventListener('click', createSampleMap);
    document.getElementById('update-map-colors').addEventListener('click', updateMapColors);
    document.getElementById('clear-map').addEventListener('click', clearMap);
    document.getElementById('close-space-info').addEventListener('click', closeSpaceInfo);

    // 編集機能
    document.getElementById('edit-item-form').addEventListener('submit', handleEditItem);
    document.getElementById('edit-item-image').addEventListener('change', handleEditImagePreview);

    // 展開・折りたたみ
    document.getElementById('expand-all').addEventListener('click', expandAllSpaces);
    document.getElementById('collapse-all').addEventListener('click', collapseAllSpaces);

    // バックアップ・復元
    document.getElementById('backup-btn').addEventListener('click', exportData);
    document.getElementById('restore-btn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = handleImportData;
        input.click();
    });
}

// タブ切り替え
function switchTab(tabName) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // 地図タブに切り替えた時に色を更新
    if (tabName === 'map') {
        setTimeout(updateMapColors, 100);
    }
}

// アイテム追加
function handleAddItem(e) {
    e.preventDefault();
    
    const item = {
        id: Date.now(),
        spaceNo: document.getElementById('space-no').value.trim(),
        name: document.getElementById('item-name').value.trim(),
        price: parseInt(document.getElementById('item-price').value) || 0,
        quantity: parseInt(document.getElementById('item-quantity').value) || 1,
        notes: document.getElementById('item-notes').value.trim(),
        image: null,
        purchased: false,
        createdAt: new Date().toISOString()
    };

    const imageFile = itemImageInput.files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.image = e.target.result;
            addItemToList(item);
        };
        reader.readAsDataURL(imageFile);
    } else {
        addItemToList(item);
    }
}

// リストにアイテム追加
function addItemToList(item) {
    shoppingList.push(item);
    saveData();
    renderShoppingList();
    updateStats();
    updateMapColors();
    addItemForm.reset();
    imagePreview.innerHTML = '';
}

// 買い物リスト表示（スペースグループ化）
function renderShoppingList() {
    shoppingItemsContainer.innerHTML = '';
    
    if (shoppingList.length === 0) {
        shoppingItemsContainer.innerHTML = '<p>買い物リストが空です</p>';
        return;
    }

    // スペースごとにグループ化
    const groupedBySpace = {};
    shoppingList.forEach(item => {
        if (!groupedBySpace[item.spaceNo]) {
            groupedBySpace[item.spaceNo] = [];
        }
        groupedBySpace[item.spaceNo].push(item);
    });

    // ソート方法を取得
    const sortOption = document.getElementById('sort-option')?.value || 'spaceNo';
    
    // スペースをソート
    const sortedSpaces = Object.keys(groupedBySpace).sort((a, b) => {
        switch (sortOption) {
            case 'spaceNo':
                return a.localeCompare(b, 'ja', { 
                    numeric: true, 
                    sensitivity: 'base' 
                });
            case 'name':
                const firstItemA = groupedBySpace[a][0];
                const firstItemB = groupedBySpace[b][0];
                return firstItemA.name.localeCompare(firstItemB.name, 'ja');
            case 'price':
                const totalA = groupedBySpace[a].reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const totalB = groupedBySpace[b].reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return totalB - totalA;
            case 'created':
                const oldestA = Math.min(...groupedBySpace[a].map(item => new Date(item.createdAt)));
                const oldestB = Math.min(...groupedBySpace[b].map(item => new Date(item.createdAt)));
                return oldestA - oldestB;
            default:
                return 0;
        }
    });

    // 各スペース内のアイテムもソート
    sortedSpaces.forEach(spaceNo => {
        groupedBySpace[spaceNo].sort((a, b) => {
            switch (sortOption) {
                case 'name':
                    return a.name.localeCompare(b.name, 'ja');
                case 'price':
                    return (b.price * b.quantity) - (a.price * a.quantity);
                case 'created':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                default:
                    return new Date(a.createdAt) - new Date(b.createdAt);
            }
        });
    });

    // スペースグループを表示
    sortedSpaces.forEach(spaceNo => {
        const spaceGroup = createSpaceGroupElement(spaceNo, groupedBySpace[spaceNo]);
        shoppingItemsContainer.appendChild(spaceGroup);
    });
}

// スペースグループ要素作成
function createSpaceGroupElement(spaceNo, items) {
    const div = document.createElement('div');
    div.className = 'space-group-container';
    
    // スペース内の購入状況を計算
    const totalItems = items.length;
    const purchasedItems = items.filter(item => item.purchased).length;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let statusClass = '';
    let statusText = '';
    if (purchasedItems === totalItems) {
        statusClass = 'all-purchased';
        statusText = '完了';
    } else if (purchasedItems > 0) {
        statusClass = 'partial-purchased';
        statusText = `${purchasedItems}/${totalItems}`;
    } else {
        statusClass = 'not-purchased';
        statusText = '未購入';
    }
    
    // スペースIDを安全な文字列に変換
    const safeSpaceId = spaceNo.replace(/[^a-zA-Z0-9]/g, '_');
    
    div.innerHTML = `
        <div class="space-header ${statusClass}" onclick="toggleSpaceGroup('${spaceNo}')">
            <div class="space-info">
                <h3 class="space-title">スペース: ${spaceNo}</h3>
                <div class="space-summary">
                    <span class="item-count">${totalItems}アイテム</span>
                    <span class="space-total">¥${totalAmount.toLocaleString()}</span>
                    <span class="purchase-status">${statusText}</span>
                </div>
            </div>
            <button class="space-toggle" onclick="event.stopPropagation(); toggleSpaceGroup('${spaceNo}')">
                <span class="toggle-icon">▼</span>
            </button>
        </div>
        <div class="space-items" id="space-${safeSpaceId}">
            ${items.map(item => createItemElementHTML(item)).join('')}
        </div>
    `;
    
    return div;
}

// アイテム要素HTML作成
function createItemElementHTML(item) {
    const total = item.price * item.quantity;
    
    return `
        <div class="shopping-item ${item.purchased ? 'purchased' : ''}">
            <div class="item-image-container">
                ${item.image ? 
                    `<img src="${item.image}" alt="${item.name}" class="item-image">` : 
                    '<div class="item-image item-no-image"><span>画像なし</span></div>'
                }
            </div>
            <div class="item-details">
                <h4 class="item-name" onclick="openEditModal(${item.id})" title="クリックで編集">${item.name}</h4>
                <div class="item-meta">
                    <div class="item-price">¥${item.price.toLocaleString()} × ${item.quantity} = ¥${total.toLocaleString()}</div>
                    ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-small btn-edit" onclick="openEditModal(${item.id})">編集</button>
                <button class="btn-small btn-check" onclick="togglePurchased(${item.id})">
                    ${item.purchased ? '未購入' : '購入済み'}
                </button>
                <button class="btn-small btn-delete" onclick="deleteItem(${item.id})">削除</button>
            </div>
        </div>
    `;
}

// スペースグループの開閉
function toggleSpaceGroup(spaceNo) {
    const safeSpaceId = spaceNo.replace(/[^a-zA-Z0-9]/g, '_');
    const spaceItems = document.getElementById(`space-${safeSpaceId}`);
    const toggleIcon = document.querySelector(`[onclick*="toggleSpaceGroup('${spaceNo}')"] .toggle-icon`);
    const toggleButton = document.querySelector(`[onclick*="toggleSpaceGroup('${spaceNo}')"].space-toggle`);
    
    if (spaceItems && toggleIcon) {
        if (spaceItems.classList.contains('collapsed')) {
            spaceItems.classList.remove('collapsed');
            spaceItems.style.maxHeight = spaceItems.scrollHeight + 'px';
            toggleIcon.textContent = '▼';
            if (toggleButton) toggleButton.classList.remove('collapsed');
        } else {
            spaceItems.classList.add('collapsed');
            spaceItems.style.maxHeight = '0';
            toggleIcon.textContent = '▶';
            if (toggleButton) toggleButton.classList.add('collapsed');
        }
    }
}

// 全て展開
function expandAllSpaces() {
    const spaceItems = document.querySelectorAll('.space-items');
    const toggleIcons = document.querySelectorAll('.toggle-icon');
    const toggleButtons = document.querySelectorAll('.space-toggle');
    
    spaceItems.forEach(item => {
        item.classList.remove('collapsed');
        item.style.maxHeight = item.scrollHeight + 'px';
    });
    
    toggleIcons.forEach(icon => {
        icon.textContent = '▼';
    });
    
    toggleButtons.forEach(button => {
        button.classList.remove('collapsed');
    });
}

// 全て折りたたみ
function collapseAllSpaces() {
    const spaceItems = document.querySelectorAll('.space-items');
    const toggleIcons = document.querySelectorAll('.toggle-icon');
    const toggleButtons = document.querySelectorAll('.space-toggle');
    
    spaceItems.forEach(item => {
        item.classList.add('collapsed');
        item.style.maxHeight = '0';
    });
    
    toggleIcons.forEach(icon => {
        icon.textContent = '▶';
    });
    
    toggleButtons.forEach(button => {
        button.classList.add('collapsed');
    });
}

// 購入状態切り替え
function togglePurchased(itemId) {
    const item = shoppingList.find(item => item.id === itemId);
    if (item) {
        item.purchased = !item.purchased;
        saveData();
        renderShoppingList();
        updateStats();
        updateMapColors();
    }
}

// アイテム削除
function deleteItem(itemId) {
    if (confirm('このアイテムを削除しますか？')) {
        shoppingList = shoppingList.filter(item => item.id !== itemId);
        saveData();
        renderShoppingList();
        updateStats();
        updateMapColors();
    }
}

// 統計更新
function updateStats() {
    const totalAmount = shoppingList.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    // ユニークなスペース数を計算
    const uniqueSpaces = [...new Set(shoppingList.map(item => item.spaceNo))];
    
    totalAmountElement.textContent = `¥${totalAmount.toLocaleString()}`;
    itemCountElement.textContent = shoppingList.length;
    spaceCountElement.textContent = uniqueSpaces.length;
}

// 画像プレビュー
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="プレビュー">`;
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
}

// 地図アップロード
function handleMapUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.includes('svg')) {
                mapDisplay.innerHTML = e.target.result;
                mapDisplay.classList.add('has-map');
                setupMapInteraction();
            } else {
                mapDisplay.innerHTML = `<img src="${e.target.result}" alt="会場地図">`;
                mapDisplay.classList.add('has-map');
            }
            currentMap = 'uploaded';
            saveData();
            updateMapColors();
        };
        
        if (file.type.includes('svg')) {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    }
}

// サンプル地図作成
function createSampleMap() {
    const sampleSvg = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <style>
                .space-text { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; fill: #333; }
                .space-border { fill: #fff; stroke: #333; stroke-width: 1; }
                .space-clickable { cursor: pointer; }
            </style>
        </defs>
        
        <rect width="800" height="600" fill="#f8f8f8"/>
        
        <text x="750" y="50" class="space-text" font-size="24" fill="#2196F3">て</text>
        
        ${generateSpaceRow('て', [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 50, 80, 40, 30)}
        
        ${generateSpaceRow('て', [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], 90, 120, 40, 30)}
        
        ${generateSpaceRow('て', [38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25], 50, 200, 40, 30)}
        
        ${generateSpaceRow('て', [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], 90, 240, 40, 30)}
        
        ${generateSpaceRow('て', [63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51], 50, 320, 40, 30)}
        
        ${generateSpaceRow('て', [64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75], 90, 360, 40, 30)}
    </svg>`;
    
    mapDisplay.innerHTML = sampleSvg;
    mapDisplay.classList.add('has-map');
    currentMap = 'sample';
    saveData();
    setupMapInteraction();
    updateMapColors();
}

// スペース行生成
function generateSpaceRow(block, numbers, startX, y, width, height) {
    return numbers.map((num, index) => {
        const x = startX + (index * width);
        const spaceId = block + num.toString().padStart(2, '0');
        
        return `
            <g class="space-group">
                <rect class="space-border space-clickable" 
                      data-space="${spaceId}" 
                      x="${x}" y="${y}" width="${width}" height="${height}"/>
                
                <text x="${x + width/2}" y="${y + height/2 + 4}" class="space-text">${num}</text>
            </g>
        `;
    }).join('');
}

// 地図インタラクション設定
function setupMapInteraction() {
    const svg = mapDisplay.querySelector('svg');
    if (!svg) return;
    
    const spaceElements = svg.querySelectorAll('.space-clickable');
    spaceElements.forEach(element => {
        element.addEventListener('click', handleSpaceClick);
    });
}

// スペースクリック処理
function handleSpaceClick(e) {
    const spaceId = e.target.dataset.space;
    if (spaceId) {
        showSpaceInfo(spaceId);
    }
}

// スペース情報表示
function showSpaceInfo(spaceId) {
    const spaceItems = shoppingList.filter(item => {
        const itemSpace = item.spaceNo.toLowerCase();
        const targetSpace = spaceId.toLowerCase();
        return itemSpace === targetSpace || 
               itemSpace === targetSpace + 'a' || 
               itemSpace === targetSpace + 'b' ||
               itemSpace.startsWith(targetSpace);
    });
    
    spaceInfoTitle.textContent = `スペース: ${spaceId}`;
    
    if (spaceItems.length === 0) {
        spaceInfoContent.innerHTML = '<p>このスペースには買い物予定がありません</p>';
    } else {
        let content = '<div class="space-items">';
        spaceItems.forEach(item => {
            content += `
                <div class="space-item ${item.purchased ? 'purchased' : ''}">
                    <div class="space-item-info">
                        <div class="space-item-name">${item.name}</div>
                        <div class="space-item-price">¥${item.price.toLocaleString()} × ${item.quantity} (${item.spaceNo})</div>
                        ${item.notes ? `<div class="space-item-notes">${item.notes}</div>` : ''}
                    </div>
                    <button class="btn-small ${item.purchased ? 'btn-secondary' : 'btn-check'}" 
                            onclick="togglePurchased(${item.id}); updateMapColors();">
                        ${item.purchased ? '未購入' : '購入済み'}
                    </button>
                </div>
            `;
        });
        content += '</div>';
        spaceInfoContent.innerHTML = content;
    }
    
    spaceInfoPanel.classList.add('active');
}

// スペース情報パネルを閉じる
function closeSpaceInfo() {
    spaceInfoPanel.classList.remove('active');
}

// 地図の色を更新
function updateMapColors() {
    const svg = mapDisplay.querySelector('svg');
    if (!svg) return;
    
    const spaceElements = svg.querySelectorAll('.space-clickable');
    spaceElements.forEach(element => {
        const spaceId = element.dataset.space;
        if (!spaceId) return;
        
        const relatedItems = shoppingList.filter(item => {
            const itemSpace = item.spaceNo.toLowerCase();
            const targetSpace = spaceId.toLowerCase();
            return itemSpace === targetSpace || 
                   itemSpace === targetSpace + 'a' || 
                   itemSpace === targetSpace + 'b' ||
                   itemSpace.startsWith(targetSpace);
        });
        
        element.classList.remove('space-has-items', 'space-purchased', 'space-partial');
        
        if (relatedItems.length > 0) {
            const purchasedCount = relatedItems.filter(item => item.purchased).length;
            
            if (purchasedCount === relatedItems.length) {
                element.classList.add('space-purchased');
            } else if (purchasedCount > 0) {
                element.classList.add('space-partial');
            } else {
                element.classList.add('space-has-items');
            }
        }
    });
}

// 地図削除機能
function clearMap() {
    if (confirm('地図を削除しますか？')) {
        mapDisplay.innerHTML = '<p>地図をアップロードするか、サンプル地図を作成してください</p>';
        mapDisplay.classList.remove('has-map');
        currentMap = null;
        closeSpaceInfo();
        saveData();
    }
}

// 編集機能
function openEditModal(itemId) {
    const item = shoppingList.find(item => item.id === itemId);
    if (!item) return;
    
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-space-no').value = item.spaceNo;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-price').value = item.price;
    document.getElementById('edit-item-quantity').value = item.quantity;
    document.getElementById('edit-item-notes').value = item.notes || '';
    
    const editImagePreview = document.getElementById('edit-image-preview');
    if (item.image) {
        editImagePreview.innerHTML = `<img src="${item.image}" alt="現在の画像">`;
    } else {
        editImagePreview.innerHTML = '<p>現在画像なし</p>';
    }
    
    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('edit-item-form').reset();
    document.getElementById('edit-image-preview').innerHTML = '';
}

function handleEditItem(e) {
    e.preventDefault();
    
    const itemId = parseInt(document.getElementById('edit-item-id').value);
    const item = shoppingList.find(item => item.id === itemId);
    if (!item) return;
    
    item.spaceNo = document.getElementById('edit-space-no').value.trim();
    item.name = document.getElementById('edit-item-name').value.trim();
    item.price = parseInt(document.getElementById('edit-item-price').value) || 0;
    item.quantity = parseInt(document.getElementById('edit-item-quantity').value) || 1;
    item.notes = document.getElementById('edit-item-notes').value.trim();
    
    const imageFile = document.getElementById('edit-item-image').files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.image = e.target.result;
            saveAndUpdate();
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveAndUpdate();
    }
    
    function saveAndUpdate() {
        saveData();
        renderShoppingList();
        updateStats();
        updateMapColors();
        closeEditModal();
    }
}

function handleEditImagePreview(e) {
    const file = e.target.files[0];
    const editImagePreview = document.getElementById('edit-image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            editImagePreview.innerHTML = `<img src="${e.target.result}" alt="新しい画像">`;
        };
        reader.readAsDataURL(file);
    }
}

// データ保存
function saveData() {
    const data = {
        shoppingList: shoppingList,
        currentMap: currentMap,
        mapContent: currentMap ? mapDisplay.innerHTML : null
    };
    localStorage.setItem('shoppingList_v5', JSON.stringify(data));
}

// データエクスポート
function exportData() {
    const data = {
        shoppingList: shoppingList,
        exportDate: new Date().toISOString(),
        version: '5.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-v5-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// データインポート
function handleImportData(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.shoppingList && Array.isArray(data.shoppingList)) {
                    if (confirm('現在のデータを上書きしますか？')) {
                        shoppingList = data.shoppingList;
                        saveData();
                        renderShoppingList();
                        updateStats();
                        updateMapColors();
                        alert('データを復元しました');
                    }
                } else {
                    alert('無効なファイル形式です');
                }
            } catch (error) {
                alert('ファイルの読み込みに失敗しました');
            }
        };
        reader.readAsText(file);
    }
}

// モーダル外クリックで閉じる
document.addEventListener('click', function(e) {
    const modal = document.getElementById('edit-modal');
    if (e.target === modal) {
        closeEditModal();
    }
});