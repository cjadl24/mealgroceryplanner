// Store meals in localStorage
let meals = JSON.parse(localStorage.getItem('nexusMeals')) || {};
// Store custom grocery items with purchase status
let customGroceryItems = JSON.parse(localStorage.getItem('customGroceryItems')) || [];
// Store purchased status for custom items
let purchasedItems = new Set(JSON.parse(localStorage.getItem('purchasedItems') || '[]'));

// DOM Elements
const mealSlots = document.querySelectorAll('.meal-slot');
const groceryList = document.getElementById('grocery-list');
const clearAllBtn = document.getElementById('clear-all');
const modal = document.getElementById('meal-modal');
const closeModal = document.querySelectorAll('.close');
const mealOptionsContainer = document.getElementById('meal-options');
// Grocery input elements
const groceryItemInput = document.getElementById('grocery-item');
const addGroceryBtn = document.getElementById('add-grocery-btn');

// Initialize app
function init() {
    loadMeals();
    setupEventListeners();
}

// Load meals from localStorage into UI
function loadMeals() {
    mealSlots.forEach(slot => {
        const key = `${slot.dataset.day}-${slot.dataset.meal}`;
        const mealName = meals[key] || '';
        
        slot.textContent = mealName || '+';
        slot.classList.toggle('selected', !!mealName);
    });
    updateGroceryList();
}

// Setup event listeners
function setupEventListeners() {
    // Open modal on click (for both adding and editing)
    mealSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            const day = slot.dataset.day;
            const mealType = slot.dataset.meal;
            openMealModal(day, mealType);
        });
    });

    // Close modal
    closeModal.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Clear all meals and groceries
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Clear all meals, groceries, and purchase history? This cannot be undone.')) {
            meals = {};
            customGroceryItems = [];
            purchasedItems.clear();
            localStorage.removeItem('nexusMeals');
            localStorage.removeItem('customGroceryItems');
            localStorage.removeItem('purchasedItems');
            loadMeals();
        }
    });

    // Add grocery item
    addGroceryBtn.addEventListener('click', addCustomGroceryItem);
    groceryItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCustomGroceryItem();
    });
}

// Add custom grocery item
function addCustomGroceryItem() {
    const input = document.getElementById('grocery-item');
    const value = input.value.trim();
    
    if (value) {
        // Avoid duplicates
        if (!customGroceryItems.includes(value)) {
            customGroceryItems.push(value);
            saveCustomItems();
            updateGroceryList(); // Refresh list
        }
        input.value = ''; // Clear input
        input.blur(); // Remove focus on mobile
    }
}

// Save custom items
function saveCustomItems() {
    localStorage.setItem('customGroceryItems', JSON.stringify(customGroceryItems));
}

// Open meal selection modal
function openMealModal(day, mealType) {
    modal.style.display = 'flex';
    mealOptionsContainer.innerHTML = '';

    const currentMeal = meals[`${day}-${mealType}`];

    // Create modal title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'modal-title';
    titleDiv.innerHTML = '<i class="fas fa-utensils"></i> Add/Edit Meal';
    mealOptionsContainer.appendChild(titleDiv);

    // Create meal name input
    const mealNameInput = document.createElement('input');
    mealNameInput.type = 'text';
    mealNameInput.className = 'modal-input';
    mealNameInput.id = 'meal-name';
    mealNameInput.placeholder = 'Enter meal name (e.g., Lumpia Recipe, Tita\'s Adobo)';
    mealNameInput.value = currentMeal || '';
    mealNameInput.autofocus = true;
    mealOptionsContainer.appendChild(mealNameInput);

    // Create ingredients textarea
    const ingredientsTextarea = document.createElement('textarea');
    ingredientsTextarea.className = 'modal-input';
    ingredientsTextarea.id = 'ingredients';
    ingredientsTextarea.placeholder = 'Enter ingredients (one per line)\nExample:\n- Soy sauce\n- Vinegar\n- Garlic';
    ingredientsTextarea.rows = 6;
    
    // Get saved ingredients for current meal if exists
    if (currentMeal && meals[`${day}-${mealType}-ingredients`]) {
        ingredientsTextarea.value = meals[`${day}-${mealType}-ingredients`];
    }
    
    mealOptionsContainer.appendChild(ingredientsTextarea);

    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Meal';
    saveBtn.addEventListener('click', () => {
        const mealName = mealNameInput.value.trim();
        if (!mealName) {
            alert('Please enter a meal name!');
            return;
        }
        
        const ingredientsText = ingredientsTextarea.value.trim();
        const ingredients = ingredientsText.split('\n').map(ing => ing.trim()).filter(ing => ing);
        
        // Save meal and ingredients
        const key = `${day}-${mealType}`;
        meals[key] = mealName;
        if (ingredients.length > 0) {
            meals[`${key}-ingredients`] = ingredientsText;
        } else {
            delete meals[`${key}-ingredients`];
        }
        
        localStorage.setItem('nexusMeals', JSON.stringify(meals));
        loadMeals();
        modal.style.display = 'none';
    });
    mealOptionsContainer.appendChild(saveBtn);

    // Add "Remove This Meal" button if a meal is already selected
    if (currentMeal) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove This Meal';
        removeBtn.style.backgroundColor = 'rgba(255, 0, 85, 0.1)';
        removeBtn.style.borderColor = '#ff0055';
        removeBtn.style.marginTop = '15px';
        removeBtn.addEventListener('click', () => {
            const key = `${day}-${mealType}`;
            delete meals[key];
            delete meals[`${key}-ingredients`];
            localStorage.setItem('nexusMeals', JSON.stringify(meals));
            loadMeals();
            modal.style.display = 'none';
        });
        mealOptionsContainer.appendChild(removeBtn);
    }

    // Focus on the meal input for better mobile experience
    setTimeout(() => {
        mealNameInput.focus();
    }, 300);
}

// Updated Grocery List Function with custom ingredients
function updateGroceryList() {
    groceryList.innerHTML = '';
    
    const groceryItems = {};

    // 1. Add ingredients from meals
    Object.keys(meals).forEach(key => {
        if (key.endsWith('-ingredients')) {
            const mealKey = key.replace('-ingredients', '');
            const mealName = meals[mealKey];
            if (mealName) { // Only add if the meal still exists
                const ingredientsText = meals[key];
                const ingredients = ingredientsText.split('\n').map(ing => ing.trim()).filter(ing => ing);
                ingredients.forEach(item => {
                    if (!groceryItems[item]) groceryItems[item] = 0;
                    groceryItems[item]++;
                });
            }
        }
    });

    // 2. Add custom grocery items
    customGroceryItems.forEach(item => {
        if (!groceryItems[item]) groceryItems[item] = 0;
        groceryItems[item]++;
    });

    // 3. Sort items: Unbought first, then purchased
    if (Object.keys(groceryItems).length === 0) {
        groceryList.innerHTML = '<p class="empty-message">No items yet.</p>';
        return;
    }

    // Split into unbought and purchased
    const unbought = [];
    const purchased = [];

    Object.entries(groceryItems).forEach(([item, count]) => {
        if (purchasedItems.has(item)) {
            purchased.push([item, count]);
        } else {
            unbought.push([item, count]);
        }
    });

    // Sort each group alphabetically
    const sortAlphabetically = (a, b) => a[0].localeCompare(b[0]);

    const sortedUnbought = unbought.sort(sortAlphabetically);
    const sortedPurchased = purchased.sort(sortAlphabetically);

    // Render all items
    [...sortedUnbought, ...sortedPurchased].forEach(([item, count]) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'grocery-item';
        itemEl.dataset.item = item;
        
        const isChecked = purchasedItems.has(item);
        
        itemEl.innerHTML = `
            <label class="grocery-label">
                <input type="checkbox" class="grocery-check" ${isChecked ? 'checked' : ''} data-item="${item}">
                <span class="item-text">${count > 1 ? `${count}x ` : ''}${item}</span>
            </label>
            <button class="remove-item" data-item="${item}">✕</button>
        `;
        groceryList.appendChild(itemEl);
    });

    // Add animation classes after rendering
    setTimeout(() => {
        document.querySelectorAll('.grocery-item').forEach(itemEl => {
            const item = itemEl.dataset.item;
            if (purchasedItems.has(item)) {
                itemEl.classList.add('moving-down');
            }
        });
    }, 10);

    // Handle checkbox toggle with animation
    document.querySelectorAll('.grocery-check').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const item = checkbox.dataset.item;
            const itemEl = document.querySelector(`[data-item="${item}"]`);
            
            if (checkbox.checked) {
                purchasedItems.add(item);
                if (itemEl) {
                    itemEl.classList.remove('moving-up');
                    itemEl.classList.add('moving-down');
                }
            } else {
                purchasedItems.delete(item);
                if (itemEl) {
                    itemEl.classList.remove('moving-down');
                    itemEl.classList.add('moving-up');
                }
            }
            
            localStorage.setItem('purchasedItems', JSON.stringify([...purchasedItems]));
            
            // Re-render after animation completes
            setTimeout(() => {
                updateGroceryList();
            }, 400); // Match the animation duration
        });
    });

    // Remove item functionality
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.dataset.item;
            
            // Remove from custom list
            const index = customGroceryItems.indexOf(item);
            if (index > -1) {
                customGroceryItems.splice(index, 1);
                saveCustomItems();
            }
            
            // Remove from purchased set
            purchasedItems.delete(item);
            localStorage.setItem('purchasedItems', JSON.stringify([...purchasedItems]));
            
            // Refresh list
            updateGroceryList();
        });
    });
}

// Initialize
init();

// Prevent zoom on iOS devices when focusing inputs
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    if (Date.now() - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = Date.now();
}, { passive: false });
