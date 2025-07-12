// Data storage functions - Fixed initial data loading
function getProfiles() {
  const data = localStorage.getItem("profiles");
  return data ? JSON.parse(data) : [];
}

function saveProfiles(profiles) {
  localStorage.setItem("profiles", JSON.stringify(profiles));
}

function getSwaps() {
  const data = localStorage.getItem("swaps");
  return data ? JSON.parse(data) : [];
}

function saveSwaps(swaps) {
  localStorage.setItem("swaps", JSON.stringify(swaps));
}

function getFeedbacks() {
  const data = localStorage.getItem("feedbacks");
  return data ? JSON.parse(data) : [];
}

function saveFeedbacks(feedbacks) {
  localStorage.setItem("feedbacks", JSON.stringify(feedbacks));
}

// Utility functions
function generateId() {
  return 'id-' + Math.random().toString(36).substr(2, 9);
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

function getAvailability(w, e) {
  if (w && e) return "Available throughout the week";
  if (w && !e) return "Available in the mornings all week";
  if (!w && e) return "Available on weekdays in the evenings";
  return "Available on weekdays in the mornings";
}

function getStatusBadge(status) {
  switch(status) {
      case 'pending': return '<span class="pending-badge">Pending</span>';
      case 'accepted': return '<span class="accepted-badge">Accepted</span>';
      case 'rejected': return '<span class="rejected-badge">Rejected</span>';
      case 'completed': return '<span class="completed-badge">Completed</span>';
      default: return '';
  }
}

// DOM manipulation functions
function showSection(sectionId) {
  document.querySelectorAll('main > section').forEach(section => {
      section.style.display = 'none';
  });
  const section = document.getElementById(sectionId);
  section.style.display = 'block';
  
  // Trigger animation
  section.classList.remove('section-animate');
  void section.offsetWidth; // Trigger reflow
  section.classList.add('section-animate');
}

function updateNavForLogin(isLoggedIn) {
  document.getElementById('homeLink').style.display = 'inline';
  document.getElementById('loginLink').style.display = isLoggedIn ? 'none' : 'inline';
  document.getElementById('profileLink').style.display = isLoggedIn ? 'inline' : 'none';
  document.getElementById('searchLink').style.display = isLoggedIn ? 'inline' : 'none';
  document.getElementById('swapRequestsLink').style.display = isLoggedIn ? 'inline' : 'none';
  document.getElementById('logoutLink').style.display = isLoggedIn ? 'inline' : 'none';
}

function renderProfileView() {
  const user = getCurrentUser();
  if (!user) return;
  
  const profile = getProfiles().find(p => p.id === user.profileId);
  if (!profile) return;
  
  const privateBadge = !profile.isPublic ? '<span class="private-badge">Private</span>' : '';
  
  document.getElementById('profileView').innerHTML = `
      <div class="profile-card">
          <h3>${profile.name} ${privateBadge}</h3>
          <p><strong>Location:</strong> ${profile.location || 'Not specified'}</p>
          <p><strong>Offers:</strong> ${profile.skillsOffered.join(", ") || 'None'}</p>
          <p><strong>Wants:</strong> ${profile.skillsWanted.join(", ") || 'None'}</p>
          <p><strong>Availability:</strong> ${getAvailability(profile.weekends, profile.evenings)}</p>
          <button id="editProfileBtn">Edit Profile</button>
      </div>
  `;
  
  // Reattach event listener for edit button with animation
  document.getElementById('editProfileBtn').addEventListener('click', () => {
      animateButtonClick('editProfileBtn');
      setTimeout(() => {
          const currentUser = getCurrentUser();
          if (!currentUser) return;
          
          const profile = getProfiles().find(p => p.id === currentUser.profileId);
          if (!profile) return;
          
          document.getElementById('name').value = profile.name;
          document.getElementById('location').value = profile.location || '';
          document.getElementById('password').value = '';
          document.getElementById('skillsOffered').value = profile.skillsOffered.join(', ');
          document.getElementById('skillsWanted').value = profile.skillsWanted.join(', ');
          document.getElementById('weekends').checked = profile.weekends;
          document.getElementById('evenings').checked = profile.evenings;
          document.getElementById('isPublic').checked = profile.isPublic;
          
          showSection('editProfileSection');
      }, 300);
  });
}

function renderAllProfiles() {
  const profiles = getProfiles();
  const currentUser = getCurrentUser();
  const list = document.getElementById("profileList");
  list.innerHTML = "";

  if (profiles.length === 0) {
      list.innerHTML = "<p>No profiles found.</p>";
      return;
  }

  profiles.forEach(profile => {
      if (currentUser && profile.id === currentUser.profileId) return;
      if (!profile.isPublic && (!currentUser || profile.userId !== currentUser.userId)) return;

      const privateBadge = !profile.isPublic ? '<span class="private-badge">Private</span>' : '';
      const card = document.createElement("div");
      card.className = "profile-card";
      
      card.innerHTML = `
          <h3>${profile.name} ${privateBadge}</h3>
          <p><strong>Location:</strong> ${profile.location || 'Not specified'}</p>
          <p><strong>Offers:</strong> ${profile.skillsOffered.join(", ") || 'None'}</p>
          <p><strong>Wants:</strong> ${profile.skillsWanted.join(", ") || 'None'}</p>
          <p><strong>Availability:</strong> ${getAvailability(profile.weekends, profile.evenings)}</p>
      `;

      if (currentUser) {
          const sendRequestBtn = document.createElement('button');
          sendRequestBtn.textContent = 'Send Swap Request';
          sendRequestBtn.className = 'btn-pulse';
          sendRequestBtn.onclick = () => {
              animateButtonClick(sendRequestBtn);
              setTimeout(() => sendSwapRequest(profile.id), 300);
          };
          card.appendChild(sendRequestBtn);
      }

      list.appendChild(card);
  });
  
  // Observe cards for scroll animations
  observeCards();
}

function renderSwapRequests() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const swaps = getSwaps();
  const profiles = getProfiles();
  
  // Sent requests
  const sentRequests = swaps.filter(swap => 
      swap.senderProfileId === currentUser.profileId
  );
  
  const sentRequestsList = document.getElementById('sentRequestsList');
  sentRequestsList.innerHTML = sentRequests.length === 0 ? 
      '<p>No sent requests</p>' : '';
  
  sentRequests.forEach(swap => {
      const receiverProfile = profiles.find(p => p.id === swap.receiverProfileId);
      if (!receiverProfile) return;
      
      const div = document.createElement('div');
      div.className = 'request-card';
      div.innerHTML = `
          <div>
              <strong>To:</strong> ${receiverProfile.name}
              <br>
              <strong>Status:</strong> ${getStatusBadge(swap.status)}
              ${swap.status === 'accepted' ? '<button class="complete-btn btn-pulse" data-swap-id="' + swap.id + '">Mark as Completed</button>' : ''}
              ${swap.status === 'pending' ? '<button class="cancel-btn btn-pulse" data-swap-id="' + swap.id + '">Cancel Request</button>' : ''}
          </div>
      `;
      sentRequestsList.appendChild(div);
  });
  
  // Received requests
  const receivedRequests = swaps.filter(swap => 
      swap.receiverProfileId === currentUser.profileId
  );
  
  const receivedRequestsList = document.getElementById('receivedRequestsList');
  receivedRequestsList.innerHTML = receivedRequests.length === 0 ? 
      '<p>No received requests</p>' : '';
  
  receivedRequests.forEach(swap => {
      const senderProfile = profiles.find(p => p.id === swap.senderProfileId);
      if (!senderProfile) return;
      
      const div = document.createElement('div');
      div.className = 'request-card';
      div.innerHTML = `
          <div>
              <strong>From:</strong> ${senderProfile.name}
              <br>
              <strong>Status:</strong> ${getStatusBadge(swap.status)}
          </div>
          ${swap.status === 'pending' ? `
          <div class="request-actions">
              <button class="accept-btn btn-pulse" data-swap-id="${swap.id}">Accept</button>
              <button class="reject-btn btn-pulse" data-swap-id="${swap.id}">Reject</button>
          </div>
          ` : ''}
      `;
      receivedRequestsList.appendChild(div);
  });

  // Add event listeners to all buttons with animations
  document.querySelectorAll('.complete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          animateButtonClick(e.target);
          setTimeout(() => completeSwap(e.target.dataset.swapId), 300);
      });
  });

  document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          animateButtonClick(e.target);
          setTimeout(() => cancelSwapRequest(e.target.dataset.swapId), 300);
      });
  });

  document.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          animateButtonClick(e.target);
          setTimeout(() => respondToSwapRequest(e.target.dataset.swapId, 'accepted'), 300);
      });
  });

  document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          animateButtonClick(e.target);
          setTimeout(() => respondToSwapRequest(e.target.dataset.swapId, 'rejected'), 300);
      });
  });
  
  // Observe cards for scroll animations
  observeCards();
}

function renderSearchResults(skill) {
  const profiles = getProfiles();
  const currentUser = getCurrentUser();
  const results = profiles.filter(p => 
      p.skillsOffered.some(s => s.toLowerCase().includes(skill.toLowerCase())) && 
      (p.isPublic || (currentUser && p.userId === currentUser.userId))
  );
  
  const resultsDiv = document.getElementById("searchResults");
  resultsDiv.innerHTML = "";

  if (results.length === 0) {
      resultsDiv.innerHTML = `<p>No profiles found offering: <strong>${skill}</strong></p>`;
      return;
  }

  results.forEach(profile => {
      const privateBadge = !profile.isPublic ? '<span class="private-badge">Private</span>' : '';
      const card = document.createElement("div");
      card.className = "profile-card";
      
      card.innerHTML = `
          <h3>${profile.name} ${privateBadge}</h3>
          <p><strong>Location:</strong> ${profile.location || 'Not specified'}</p>
          <p><strong>Offers:</strong> ${profile.skillsOffered.join(", ") || 'None'}</p>
          <p><strong>Wants:</strong> ${profile.skillsWanted.join(", ") || 'None'}</p>
          <p><strong>Availability:</strong> ${getAvailability(profile.weekends, profile.evenings)}</p>
      `;

      if (currentUser && currentUser.profileId !== profile.id) {
          const sendRequestBtn = document.createElement('button');
          sendRequestBtn.textContent = 'Send Swap Request';
          sendRequestBtn.className = 'btn-pulse';
          sendRequestBtn.onclick = () => {
              animateButtonClick(sendRequestBtn);
              setTimeout(() => sendSwapRequest(profile.id), 300);
          };
          card.appendChild(sendRequestBtn);
      }

      resultsDiv.appendChild(card);
  });
  
  // Observe cards for scroll animations
  observeCards();
}

// Business logic functions
function createProfile() {
  const name = document.getElementById('name').value.trim();
  const location = document.getElementById('location').value.trim();
  const password = document.getElementById('password').value.trim();
  const skillsOffered = document.getElementById('skillsOffered').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
  const skillsWanted = document.getElementById('skillsWanted').value.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
  const weekends = document.getElementById('weekends').checked;
  const evenings = document.getElementById('evenings').checked;
  const isPublic = document.getElementById('isPublic').checked;

  if (!name || skillsOffered.length === 0) {
      alert('Name and at least one skill offered are required');
      return;
  }

  const profiles = getProfiles();
  const currentUser = getCurrentUser();
  
  const profileData = {
      id: generateId(),
      userId: currentUser ? currentUser.userId : generateId(),
      name,
      location,
      password: password || (currentUser ? profiles.find(p => p.id === currentUser.profileId)?.password : ''),
      skillsOffered,
      skillsWanted,
      weekends,
      evenings,
      isPublic,
      createdAt: new Date().toISOString()
  };

  if (currentUser) {
      // Editing existing profile
      const index = profiles.findIndex(p => p.id === currentUser.profileId);
      if (index !== -1) {
          profiles[index] = { ...profiles[index], ...profileData };
      }
  } else {
      // Creating new profile
      profiles.push(profileData);
      setCurrentUser({
          userId: profileData.userId,
          profileId: profileData.id
      });
  }

  saveProfiles(profiles);
  renderProfileView();
  showSection('profileSection');
  updateNavForLogin(true);
}

function login() {
  const name = document.getElementById('loginName').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  const profiles = getProfiles();
  const profile = profiles.find(p => 
      p.name.toLowerCase() === name.toLowerCase() && 
      p.password === password
  );
  
  if (profile) {
      setCurrentUser({
          userId: profile.userId,
          profileId: profile.id
      });
      document.getElementById('loginError').style.display = 'none';
      renderProfileView();
      showSection('profileSection');
      updateNavForLogin(true);
  } else {
      document.getElementById('loginError').style.display = 'block';
      // Trigger shake animation
      const errorElement = document.getElementById('loginError');
      errorElement.classList.remove('error-animate');
      void errorElement.offsetWidth; // Trigger reflow
      errorElement.classList.add('error-animate');
  }
}

function logout() {
  clearCurrentUser();
  showSection('homeSection');
  updateNavForLogin(false);
}

function sendSwapRequest(receiverProfileId) {
  try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
          alert('You must be logged in to send requests');
          return;
      }
      
      // Verify the receiver profile exists
      const profiles = getProfiles();
      const receiverProfile = profiles.find(p => p.id === receiverProfileId);
      if (!receiverProfile) {
          alert('The requested profile does not exist');
          return;
      }
      
      const swaps = getSwaps();
      
      // Check if request already exists
      const existingRequest = swaps.find(swap => 
          swap.senderProfileId === currentUser.profileId && 
          swap.receiverProfileId === receiverProfileId &&
          (swap.status === 'pending' || swap.status === 'accepted')
      );
      
      if (existingRequest) {
          alert(`You already have a ${existingRequest.status} request with this user`);
          return;
      }
      
      const newSwap = {
          id: generateId(),
          senderProfileId: currentUser.profileId,
          receiverProfileId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          completedAt: null,
          feedbackGiven: false
      };
      
      swaps.push(newSwap);
      saveSwaps(swaps);
      alert(`Swap request sent successfully to ${receiverProfile.name}!`);
      renderSwapRequests();
  } catch (error) {
      console.error('Error sending swap request:', error);
      alert('An error occurred while sending the request');
  }
}

function respondToSwapRequest(swapId, response) {
  const swaps = getSwaps();
  const swapIndex = swaps.findIndex(s => s.id === swapId);
  
  if (swapIndex !== -1) {
      swaps[swapIndex].status = response;
      saveSwaps(swaps);
      renderSwapRequests();
      alert(`Request ${response}`);
  }
}

function cancelSwapRequest(swapId) {
  if (!confirm('Are you sure you want to cancel this swap request?')) return;
  
  const swaps = getSwaps();
  const updatedSwaps = swaps.filter(s => s.id !== swapId);
  saveSwaps(updatedSwaps);
  renderSwapRequests();
  alert('Request cancelled');
}

function completeSwap(swapId) {
  const swaps = getSwaps();
  const swapIndex = swaps.findIndex(s => s.id === swapId);
  
  if (swapIndex !== -1) {
      swaps[swapIndex].status = 'completed';
      swaps[swapIndex].completedAt = new Date().toISOString();
      saveSwaps(swaps);
      
      // Show feedback form
      showSection('swapFeedbackSection');
      document.getElementById('feedbackSwapId').value = swapId;
      
      const currentUser = getCurrentUser();
      const profiles = getProfiles();
      const swap = swaps[swapIndex];
      const otherProfileId = swap.senderProfileId === currentUser.profileId ? 
          swap.receiverProfileId : swap.senderProfileId;
      const otherProfile = profiles.find(p => p.id === otherProfileId);
      
      if (otherProfile) {
          document.getElementById('feedbackTarget').innerHTML = `
              <p>Please provide feedback for your skill swap with <strong>${otherProfile.name}</strong></p>
          `;
      }
  }
}

function submitFeedback() {
  const swapId = document.getElementById('feedbackSwapId').value;
  const comment = document.getElementById('feedbackComment').value.trim();
  const rating = document.getElementById('feedbackRating').value;
  
  if (!comment) {
      alert('Please enter your feedback comments');
      return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const swaps = getSwaps();
  const swapIndex = swaps.findIndex(s => s.id === swapId);
  
  if (swapIndex !== -1) {
      const swap = swaps[swapIndex];
      const otherProfileId = swap.senderProfileId === currentUser.profileId ? 
          swap.receiverProfileId : swap.senderProfileId;
      
      const feedbacks = getFeedbacks();
      feedbacks.push({
          id: generateId(),
          swapId,
          giverProfileId: currentUser.profileId,
          receiverProfileId: otherProfileId,
          rating: parseInt(rating),
          comment,
          createdAt: new Date().toISOString()
      });
      
      saveFeedbacks(feedbacks);
      
      // Mark swap as feedback given
      swaps[swapIndex].feedbackGiven = true;
      saveSwaps(swaps);
      
      alert('Thank you for your feedback!');
      showSection('swapRequestsSection');
      renderSwapRequests();
  }
}

// Animation helper functions
function animateButtonClick(button) {
  if (typeof button === 'string') {
      button = document.getElementById(button);
  }
  button.classList.add('clicked');
  setTimeout(() => {
      button.classList.remove('clicked');
  }, 300);
}

function observeCards() {
  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('animate-card');
          }
      });
  }, { threshold: 0.1 });

  document.querySelectorAll('.profile-card, .request-card').forEach(card => {
      observer.observe(card);
  });
}

// Debug functions
function debugShowAllSwaps() {
  console.log("All swaps in system:", getSwaps());
}

function debugShowAllProfiles() {
  console.log("All profiles in system:", getProfiles());
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Navigation links
  document.getElementById('homeLink').addEventListener('click', (e) => {
      e.preventDefault();
      showSection('homeSection');
  });
  
  document.getElementById('loginLink').addEventListener('click', (e) => {
      e.preventDefault();
      showSection('loginSection');
  });
  
  document.getElementById('profileLink').addEventListener('click', (e) => {
      e.preventDefault();
      renderProfileView();
      showSection('profileSection');
  });
  
  document.getElementById('searchLink').addEventListener('click', (e) => {
      e.preventDefault();
      renderAllProfiles();
      showSection('allProfilesSection');
  });
  
  document.getElementById('swapRequestsLink').addEventListener('click', (e) => {
      e.preventDefault();
      renderSwapRequests();
      showSection('swapRequestsSection');
  });
  
  document.getElementById('logoutLink').addEventListener('click', (e) => {
      e.preventDefault();
      logout();
  });
  
  // Home page buttons
  document.getElementById('createProfileBtn').addEventListener('click', () => {
      animateButtonClick('createProfileBtn');
      setTimeout(() => {
          document.getElementById('profileForm').reset();
          showSection('editProfileSection');
      }, 300);
  });
  
  document.getElementById('loginBtn').addEventListener('click', () => {
      animateButtonClick('loginBtn');
      setTimeout(() => {
          document.getElementById('loginForm').reset();
          document.getElementById('loginError').style.display = 'none';
          showSection('loginSection');
      }, 300);
  });
  
  // Forms
  document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      login();
  });
  
  document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      createProfile();
  });
  
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
      animateButtonClick('cancelEditBtn');
      setTimeout(() => {
          const currentUser = getCurrentUser();
          if (currentUser) {
              showSection('profileSection');
          } else {
              showSection('homeSection');
          }
      }, 300);
  });
  
  document.getElementById('searchBtn').addEventListener('click', () => {
      animateButtonClick('searchBtn');
      setTimeout(() => {
          const skill = document.getElementById('skillInput').value.trim();
          if (skill) {
              renderSearchResults(skill);
          }
      }, 300);
  });
  
  document.getElementById('feedbackForm').addEventListener('submit', (e) => {
      e.preventDefault();
      submitFeedback();
  });
  
  // Initialize
  const currentUser = getCurrentUser();
  if (currentUser) {
      renderProfileView();
      showSection('profileSection');
      updateNavForLogin(true);
  } else {
      showSection('homeSection');
      updateNavForLogin(false);
  }
  
  // Initialize Intersection Observer for animations
  observeCards();
  
  // Add click animations to all buttons
  document.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', function() {
          this.classList.add('clicked');
          setTimeout(() => {
              this.classList.remove('clicked');
          }, 300);
      });
  });
});

// Make debug functions available globally
window.debugShowAllSwaps = debugShowAllSwaps;
window.debugShowAllProfiles = debugShowAllProfiles;
