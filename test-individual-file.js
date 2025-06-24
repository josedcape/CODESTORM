// Test JavaScript file for individual file upload functionality
// This file demonstrates the enhanced CodeCorrector capabilities

/**
 * Sample JavaScript application with various code patterns
 * to test the individual file upload and analysis features
 */

// ES6 Class example
class UserManager {
  constructor() {
    this.users = [];
    this.currentUser = null;
  }

  // Method to add a new user
  addUser(userData) {
    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required');
    }
    
    const user = {
      id: this.generateId(),
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
      isActive: true
    };
    
    this.users.push(user);
    return user;
  }

  // Method to find user by ID
  findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  // Method to update user
  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  // Method to delete user
  deleteUser(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }
    
    this.users.splice(userIndex, 1);
    return true;
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Get all active users
  getActiveUsers() {
    return this.users.filter(user => user.isActive);
  }
}

// Async function example
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

// Promise-based function
function validateEmail(email) {
  return new Promise((resolve, reject) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    setTimeout(() => {
      if (emailRegex.test(email)) {
        resolve(true);
      } else {
        reject(new Error('Invalid email format'));
      }
    }, 100);
  });
}

// Arrow functions and modern JavaScript features
const userUtils = {
  formatUserName: (user) => `${user.name} (${user.email})`,
  
  getUserAge: (user) => {
    const today = new Date();
    const birthDate = new Date(user.birthDate);
    return today.getFullYear() - birthDate.getFullYear();
  },
  
  isUserAdult: (user) => userUtils.getUserAge(user) >= 18,
  
  // Destructuring example
  extractUserInfo: ({ name, email, createdAt }) => ({
    displayName: name,
    contactEmail: email,
    memberSince: createdAt.getFullYear()
  })
};

// Event handling example
function setupEventListeners() {
  document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('user-form');
    const userList = document.getElementById('user-list');
    
    if (userForm) {
      userForm.addEventListener('submit', handleUserSubmit);
    }
    
    if (userList) {
      userList.addEventListener('click', handleUserListClick);
    }
  });
}

// Form handling
function handleUserSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const userData = {
    name: formData.get('name'),
    email: formData.get('email'),
    birthDate: formData.get('birthDate')
  };
  
  try {
    const userManager = new UserManager();
    const newUser = userManager.addUser(userData);
    
    displaySuccessMessage(`User ${newUser.name} added successfully!`);
    event.target.reset();
  } catch (error) {
    displayErrorMessage(error.message);
  }
}

// Event delegation example
function handleUserListClick(event) {
  const target = event.target;
  
  if (target.classList.contains('delete-btn')) {
    const userId = target.dataset.userId;
    deleteUserWithConfirmation(userId);
  } else if (target.classList.contains('edit-btn')) {
    const userId = target.dataset.userId;
    openEditUserModal(userId);
  }
}

// Utility functions
function displaySuccessMessage(message) {
  showNotification(message, 'success');
}

function displayErrorMessage(message) {
  showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Local storage utilities
const storageUtils = {
  saveUsers: (users) => {
    localStorage.setItem('users', JSON.stringify(users));
  },
  
  loadUsers: () => {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  },
  
  clearUsers: () => {
    localStorage.removeItem('users');
  }
};

// Module pattern example
const AppModule = (function() {
  let userManager;
  let isInitialized = false;
  
  function init() {
    if (isInitialized) return;
    
    userManager = new UserManager();
    setupEventListeners();
    loadStoredUsers();
    
    isInitialized = true;
    console.log('Application initialized successfully');
  }
  
  function loadStoredUsers() {
    const storedUsers = storageUtils.loadUsers();
    storedUsers.forEach(userData => {
      try {
        userManager.addUser(userData);
      } catch (error) {
        console.warn('Failed to load user:', userData, error);
      }
    });
  }
  
  // Public API
  return {
    init,
    getUserManager: () => userManager,
    isReady: () => isInitialized
  };
})();

// Initialize the application
AppModule.init();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UserManager, userUtils, AppModule };
}

// This file demonstrates:
// - ES6 classes and methods
// - Async/await patterns
// - Promise handling
// - Arrow functions
// - Destructuring
// - Event handling
// - Local storage
// - Module patterns
// - Error handling
// - Modern JavaScript features
//
// Perfect for testing individual file upload,
// AI chat modifications, and multi-agent analysis!
