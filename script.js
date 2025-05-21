let allListings = []; // Global variable to store loaded listings

document.addEventListener("DOMContentLoaded", function () {
  console.log("Client page loaded");

  // Menu and modal elements
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  const navLinkItems = document.querySelectorAll(".nav-links a");
  const modal = document.getElementById("listingModal");
  const modalTitle = modal.querySelector(".modal-title");
  const modalDescription = modal.querySelector(".modal-description");
  const carousel = modal.querySelector(".carousel");
  const closeButton = modal.querySelector(".close-button");
  const listingGrid = document.querySelector(".listing-grid");
  const searchInput = document.getElementById("searchInput");
  const locationFilter = document.getElementById("locationFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sizeFilter = document.getElementById("sizeFilter");

  // Check if modal elements exist
  if (!modal || !modalTitle || !modalDescription || !carousel || !closeButton) {
    console.error("Modal elements missing!");
    return;
  }

  // Hamburger menu
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
  navLinkItems.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });

  // Load listings from localStorage
  function loadListings() {
  const listings = JSON.parse(localStorage.getItem("listings") || "[]");
  allListings = listings; // Store to global for reuse
    listingGrid.innerHTML = ""; // Clear existing cards
    listings.forEach(listing => {
      const card = document.createElement("div");
      card.className = "listing-card";
      card.dataset.title = listing.title;
      card.dataset.description = listing.description;
      card.dataset.location = listing.location;
      card.dataset.price = listing.price;
      card.dataset.size = listing.size;
      card.dataset.images = JSON.stringify(listing.images || []);
      card.innerHTML = `
        <img src="${listing.images[0] || "https://via.placeholder.com/300x200?text=No+Image"}" alt="${listing.title}" />
        <h3>${listing.title}</h3>
        <p>₱${listing.price.toLocaleString()} • ${listing.size} sqm</p>
        <a href="#" class="cta-button">View Details</a>
      `;
      listingGrid.appendChild(card);
        updateLocationFilterOptions(allListings); // Move this here
    });

    // Add click events to "View Details" buttons
    const listingCards = document.querySelectorAll(".listing-card");
    console.log("Loaded", listingCards.length, "listings");

    listingCards.forEach(card => {
      const ctaButton = card.querySelector(".cta-button");
      if (!ctaButton) {
        console.error("CTA button missing in card:", card);
        return;
      }
      ctaButton.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("View Details clicked for:", card.dataset.title);
        modal.style.display = "flex";
        modalTitle.textContent = card.dataset.title || "Untitled";
        modalDescription.textContent = card.dataset.description || "No description available";
        // Step 3: Set location, size, and price in modal
        const modalLocation = modal.querySelector(".modal-location");
        const modalSize = modal.querySelector(".modal-size");
        const modalPrice = modal.querySelector(".modal-price");

        if (modalLocation) modalLocation.textContent = card.dataset.location || "N/A";
        if (modalSize) modalSize.textContent = card.dataset.size || "N/A";
        if (modalPrice) modalPrice.textContent = parseInt(card.dataset.price).toLocaleString() || "N/A";

        carousel.innerHTML = "";

        let images = [];
        try {
          images = JSON.parse(card.dataset.images) || [];
          if (!Array.isArray(images) || images.length === 0) {
            images = ["https://via.placeholder.com/600x400?text=No+Image"];
          }
        } catch (error) {
          console.error("Error loading images:", error);
          images = ["https://via.placeholder.com/600x400?text=Image+Error"];
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

        // Carousel navigation
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

    // Update filters
    applyFilters();
  }

  // Watch for localStorage changes (e.g., admin updates)
  window.addEventListener("storage", (e) => {
    if (e.key === "listings") {
      console.log("Listings updated, refreshing...");
      loadListings();
    }
  });

  // Close modal
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

  // Filter listings
  function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const location = locationFilter.value;
    const price = priceFilter.value;
    const size = sizeFilter.value;

    const listingCards = document.querySelectorAll(".listing-card");
    let results = 0;

    listingCards.forEach(card => {
      const title = card.dataset.title.toLowerCase();
      const description = card.dataset.description.toLowerCase();
      const cardLocation = card.dataset.location;
      const cardPrice = parseInt(card.dataset.price);
      const cardSize = parseInt(card.dataset.size);

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

  // Clear filters
  document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    locationFilter.value = "";
    priceFilter.value = "";
    sizeFilter.value = "";
    applyFilters();
  });

  // Filter inputs
  [locationFilter, priceFilter, sizeFilter].forEach(el => {
    el.addEventListener("input", applyFilters);
  });
  searchInput.addEventListener("input", () => {
    setTimeout(applyFilters, 300); // Simple delay for typing
  });

  // Admin link
  const hiddenLink = document.querySelector(".hidden-admin-link");
  hiddenLink.addEventListener("click", (e) => {
    if (!confirm("Go to admin section?")) {
      e.preventDefault();
    }
  });

  function updateLocationFilterOptions(listings) {
  const locations = [...new Set(listings.map(l => l.location.trim()))].sort();
  locationFilter.innerHTML = `<option value="">All Locations</option>`;
  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });
 }

  // Load listings on start
  loadListings();
});


