import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAuoq02wVr0d93hXnLJar4DgJ_Rt1BjZMI",
  authDomain: "gateway-to-vibrant-residences.firebaseapp.com",
  projectId: "gateway-to-vibrant-residences",
  storageBucket: "gateway-to-vibrant-residences.appspot.com",
  messagingSenderId: "989578450972",
  appId: "1:989578450972:web:2cbfb0bfa0dd01c26c67d9",
  measurementId: "G-RP061WSZGN"
};

const ADMIN_EMAIL = "reymarcascara@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signOut(auth).catch(() => {});
setPersistence(auth, browserSessionPersistence);

const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const listingForm = document.getElementById("listingForm");
const listingsTable = document.getElementById("listingsTable");
const clearFormBtn = document.getElementById("clear-form");
const loginError = document.getElementById("login-error");
const formMessage = document.getElementById("form-message");

// Cloudinary config
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ditpuxta0/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "residences";

loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  loginError.style.display = "none";

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginForm.classList.add("fade-out-up");
      setTimeout(() => {
        document.body.classList.remove("login-mode");
        loginForm.style.display = "none";
        adminPanel.style.display = "block";
      }, 400);
    })
    .catch(err => {
      loginError.textContent = "Login failed: " + err.message;
      loginError.style.display = "block";
    });
});

onAuthStateChanged(auth, user => {
  if (user && user.email === ADMIN_EMAIL) {
    document.body.classList.remove("login-mode");
    loginForm.style.display = "none";
    adminPanel.style.display = "block";
    loadListings();
  } else {
    document.body.classList.add("login-mode");
    loginForm.style.display = "flex";
    adminPanel.style.display = "none";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.reload();
  });
});

function loadListings() {
  const listings = JSON.parse(localStorage.getItem("listings") || "[]");
  listingsTable.innerHTML = "";

  listings.forEach(listing => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${listing.title}</td>
      <td>${listing.location}</td>
      <td>₱${listing.price.toLocaleString()}</td>
      <td>${listing.size} sqm</td>
      <td>
        <button class="action-btn edit-btn" data-id="${listing.id}">Edit</button>
        <button class="action-btn delete-btn" data-id="${listing.id}">Delete</button>
      </td>
    `;
    listingsTable.appendChild(row);
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => editListing(btn.dataset.id));
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteListing(btn.dataset.id));
  });
}

async function uploadImages(files, listingId) {
  const urls = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("public_id", `listing_${listingId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        urls.push(data.secure_url);
      } else {
        throw new Error("Cloudinary upload failed");
      }
    } catch (err) {
      throw new Error("Image upload failed: " + err.message);
    }
  }
  return urls;
}

async function saveListing(e) {
  e.preventDefault();
  formMessage.style.display = "none";

  const listingId = document.getElementById("listingId").value || Date.now().toString();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const price = parseInt(document.getElementById("price").value);
  const size = parseInt(document.getElementById("size").value);
  const location = document.getElementById("listingLocation").value; // Updated to match HTML
  const imageFiles = document.getElementById("images").files;

  try {
    let imageUrls = [];
    if (imageFiles.length > 0) {
      imageUrls = await uploadImages(imageFiles, listingId);
    }

    const listings = JSON.parse(localStorage.getItem("listings") || "[]");
    const existingListing = listings.find(l => l.id === listingId);
    const newListing = {
      id: listingId,
      title,
      description,
      price,
      size,
      location,
      images: imageFiles.length > 0 ? imageUrls : existingListing ? existingListing.images : []
    };

    if (listingId && existingListing) {
      const index = listings.findIndex(l => l.id === listingId);
      listings[index] = newListing;
      formMessage.textContent = "Listing updated successfully!";
    } else {
      listings.push(newListing);
      formMessage.textContent = "Listing added successfully!";
    }

    localStorage.setItem("listings", JSON.stringify(listings));
    listingForm.reset();
    document.getElementById("listingId").value = "";
    formMessage.classList.remove("error");
    formMessage.classList.add("success");
    formMessage.style.display = "block";
    console.log("Calling loadListings after save"); // Debug log
    loadListings();
  } catch (err) {
    formMessage.textContent = "Error: " + err.message;
    formMessage.classList.remove("success");
    formMessage.classList.add("error");
    formMessage.style.display = "block";
  }
}

function editListing(id) {
  const listings = JSON.parse(localStorage.getItem("listings") || "[]");
  const listing = listings.find(l => l.id === id);
  if (!listing) return;

  document.getElementById("listingId").value = listing.id;
  document.getElementById("title").value = listing.title;
  document.getElementById("description").value = listing.description;
  document.getElementById("price").value = listing.price;
  document.getElementById("size").value = listing.size;
  document.getElementById("location").value = listing.location;
  document.getElementById("images").value = ""; // Reset file input
  formMessage.style.display = "none";
}

function deleteListing(id) {
  if (!confirm("Are you sure you want to delete this listing?")) return;

  const listings = JSON.parse(localStorage.getItem("listings") || "[]");
  const updatedListings = listings.filter(l => l.id !== id);
  localStorage.setItem("listings", JSON.stringify(updatedListings));
  formMessage.textContent = "Listing deleted successfully!";
  formMessage.classList.remove("error");
  formMessage.classList.add("success");
  formMessage.style.display = "block";
  loadListings();
}

listingForm.addEventListener("submit", saveListing);
clearFormBtn.addEventListener("click", () => {
  listingForm.reset();
  document.getElementById("listingId").value = "";
  formMessage.style.display = "none";
});

if (auth.currentUser) {
  loadListings();
}