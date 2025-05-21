import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuoq02wVr0d93hXnLJar4DgJ_Rt1BjZMI",
  authDomain: "gateway-to-vibrant-residences.firebaseapp.com",
  projectId: "gateway-to-vibrant-residences",
  storageBucket: "gateway-to-vibrant-residences.appspot.com",
  messagingSenderId: "989578450972",
  appId: "1:989578450972:web:2cbfb0bfa0dd01c26c67d9",
  measurementId: "G-RP061WSZGN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allListings = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("Client page loaded");

  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  const navLinkItems = document.querySelectorAll(".nav-links a");
  const modal = document.getElementById("listingModal");
  const modalTitle = modal?.querySelector(".modal-title");
  const modalDescription = modal?.querySelector(".modal-description");
  const modalLocation = modal?.querySelector(".modal-location");
  const modalSize = modal?.querySelector(".modal-size");
  const modalPrice = modal?.querySelector(".modal-price");
  const carousel = modal?.querySelector(".carousel");
  const closeButton = modal?.querySelector(".close-button");
  const listingGrid = document.querySelector(".listing-grid");
  const searchInput = document.getElementById("searchInput");
  const locationFilter = document.getElementById("locationFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sizeFilter = document.getElementById("sizeFilter");

  if (!modal || !modalTitle || !modalDescription || !modalLocation || !modalSize || !modalPrice || !carousel || !closeButton) {
    console.error("Modal elements missing! Ensure all required modal elements are in the HTML.");
    return;
  }

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
  navLinkItems.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });

  function renderListings(listings) {
    listingGrid.innerHTML = ""; // Clear all cards, including static ones
    listings.forEach(listing => {
      console.log("Listing:", listing.title, "Images:", listing.images);
      const card = document.createElement("div");
      card.className = "listing-card";
      card.dataset.title = listing.title || "";
      card.dataset.description = listing.description || "";
      card.dataset.location = listing.location || "";
      card.dataset.price = listing.price || "";
      card.dataset.size = listing.size || "";
      card.dataset.images = JSON.stringify(listing.images || []);
      card.innerHTML = `
        <img src="${listing.images?.[0] || "https://placehold.co/300x200?text=No+Image"}" alt="${listing.title || 'Untitled'}" />
        <h3>${listing.title || 'Untitled'}</h3>
        <p>₱${listing.price ? parseInt(listing.price).toLocaleString() : "N/A"} • ${listing.size || "N/A"} sqm</p>
        <a href="#" class="cta-button">View Details</a>
      `;
      listingGrid.appendChild(card);
    });
    console.log("Rendered", listings.length, "listings");
    updateLocationFilterOptions(listings);
    applyFilters();
    addCardEventListeners();
  }

  async function loadListings() {
    try {
      const querySnapshot = await getDocs(collection(db, "listings"));
      const listings = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Fetched listing:", doc.id, data);
        listings.push({ id: doc.id, ...data });
      });
      allListings = listings;
      renderListings(allListings);
    } catch (err) {
      console.error("Error loading listings:", err.message);
    }
  }

  function addCardEventListeners() {
    const listingCards = document.querySelectorAll(".listing-card");
    console.log("Found", listingCards.length, "listing cards for event listeners");
    listingCards.forEach(card => {
      const ctaButton = card.querySelector(".cta-button");
      if (!ctaButton) {
        console.error("CTA button missing in card:", card.outerHTML);
        return;
      }
      ctaButton.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("View Details clicked for:", card.dataset.title);
        modal.style.display = "flex";
        modalTitle.textContent = card.dataset.title || "Untitled";
        modalDescription.textContent = card.dataset.description || "No description available";
        modalLocation.textContent = card.dataset.location || "N/A";
        modalSize.textContent = card.dataset.size || "N/A";
        modalPrice.textContent = card.dataset.price ? parseInt(card.dataset.price).toLocaleString() : "N/A";

        carousel.innerHTML = "";
        let images = [];
        try {
          images = JSON.parse(card.dataset.images) || [];
          if (!Array.isArray(images) || images.length === 0) {
            images = ["https://placehold.co/600x400?text=No+Image"];
          }
        } catch (error) {
          console.error("Error parsing images:", error);
          images = ["https://placehold.co/600x400?text=Image+Error"];
        }

        images.forEach((src, index) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = `${card.dataset.title} - Image ${index + 1}`;
          img.classList.add("carousel-image");
          if (index === 0) img.classList.add("active");
          carousel.appendChild(img);
        });

        console.log("Modal opened with", images.length, "images");
        modal.querySelector(".modal-content").focus();

        const prevButton = modal.querySelector(".carousel-prev");
        const nextButton = modal.querySelector(".carousel-next");
        let currentIndex = 0;

        function updateCarousel() {
          const imgs = carousel.querySelectorAll(".carousel-image");
          imgs.forEach((img, i) => {
            img.style.display = i === currentIndex ? "block" : "none";
          });
          console.log("Carousel at image:", currentIndex);
        }

        prevButton.addEventListener("click", () => {
          currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
          updateCarousel();
        });

        nextButton.addEventListener("click", () => {
          currentIndex = (currentIndex + 1) % images.length;
          updateCarousel();
        });
      });
    });
  }

  onSnapshot(collection(db, "listings"), (querySnapshot) => {
    const listings = [];
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() });
    });
    allListings = listings;
    console.log("Real-time update: Loaded", listings.length, "listings");
    renderListings(listings);
  });

  function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const location = locationFilter.value;
    const price = priceFilter.value;
    const size = sizeFilter.value;

    const listingCards = document.querySelectorAll(".listing-card");
    let results = 0;

    listingCards.forEach(card => {
      const title = (card.dataset.title || "").toLowerCase();
      const description = (card.dataset.description || "").toLowerCase();
      const cardLocation = card.dataset.location || "";
      const cardPrice = parseInt(card.dataset.price) || 0;
      const cardSize = parseInt(card.dataset.size) || 0;

      const textMatch = title.includes(query) || description.includes(query);
      const locationMatch = !location || cardLocation === location;
      let priceMatch = true;
      if (price === "lt5m") priceMatch = cardPrice < 5000000;
      else if (price === "5mto10m") priceMatch = cardPrice >= 5000000 && cardPrice <= 10000000;
      else if (price === "gt10m") priceMatch = cardPrice > 10000000;
      let sizeMatch = true;
      if (size === "small") sizeMatch = cardSize < 30;
      else if (size === "medium") sizeMatch = cardSize >= 30 && cardSize <= 60;
      else if (size === "large") sizeMatch = cardSize > 60;

      const show = textMatch && locationMatch && priceMatch && sizeMatch;
      card.style.display = show ? "block" : "none";
      if (show) results++;
    });

    document.getElementById("resultsCount").textContent = `${results} listing(s) found`;
  }

  function updateLocationFilterOptions(listings) {
    const locations = [...new Set(listings.map(l => (l.location || "").trim()))].sort();
    locationFilter.innerHTML = `<option value="">All Locations</option>`;
    locations.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      locationFilter.appendChild(opt);
    });
  }

  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
    console.log("Modal closed");
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      console.log("Modal closed by clicking outside");
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
      console.log("Modal closed with Escape key");
    }
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    locationFilter.value = "";
    priceFilter.value = "";
    sizeFilter.value = "";
    applyFilters();
  });

  [locationFilter, priceFilter, sizeFilter].forEach(el => {
    el.addEventListener("input", applyFilters);
  });
  searchInput.addEventListener("input", () => {
    setTimeout(applyFilters, 300);
  });

  const hiddenLink = document.querySelector(".hidden-admin-link");
  hiddenLink.addEventListener("click", (e) => {
    if (!confirm("Go to admin section?")) {
      e.preventDefault();
    }
  });

  loadListings();
});
