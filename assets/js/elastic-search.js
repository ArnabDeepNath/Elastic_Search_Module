let currentPage = 1;
let currentQuery = '';
let totalPages = 1;

// API Configuration
const API_BASE_URL = 'https://sewasetu.assam.statedatacenter.in/site/elasticsearch/API/search';

// Flag to track if event listeners are initialized
let listenersInitialized = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize listeners once
    if (listenersInitialized) return;
    listenersInitialized = true;
    
    const searchInput = document.getElementById('searchInput');
    
    // Enter key search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Auto-search on input (debounced)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (this.value.trim().length > 2) {
                performSearch();
            } else {
                hideResults();
            }
        }, 500);
    });
    
    // Click inside the search container shouldn't close dropdown
    const searchContainer = document.querySelector('.search-container');
    searchContainer.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Setup close button functionality
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            hideResults();
        });
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && resultsSection && resultsSection.style.display === 'block') {
            hideResults();
        }
    });
    
    // Close when clicking outside the search component
    document.addEventListener('click', function(e) {
        const resultsSection = document.getElementById('resultsSection');
        const searchContainer = document.querySelector('.search-container');
        
        if (!searchContainer.contains(e.target) && !resultsSection.contains(e.target)) {
            hideResults();
        }
    });
});

async function performSearch(page = 1) {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        hideResults();
        return;
    }

    currentQuery = query;
    currentPage = page;
    
    showLoading();
    // Don't hide results when searching for a new page in pagination
    if (page === 1) {
        hideResults();
    }

    try {
        const response = await fetch(`${API_BASE_URL}?query=${encodeURIComponent(query)}&page=${page}`);
        const data = await response.json();
        
        hideLoading();

        if (data.status && data.res && data.res.length > 0) {
            displayResults(data);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        showError();
    }
}

function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsCount = document.getElementById('resultsCount');
    const resultsContainer = document.getElementById('resultsContainer');
    const pagination = data.pagination;

    // Update results count
    resultsCount.textContent = `Found ${pagination.total_records} services`;

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Display each service
    data.res.forEach(service => {
        const serviceCard = createServiceCard(service);
        resultsContainer.appendChild(serviceCard);
    });

    // Update pagination
    updatePagination(pagination);

    // Show results as dropdown
    resultsSection.style.display = 'block';
}

function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    // Prevent card clicks from closing the modal
    card.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    const serviceTitle = service.fields.service.en;
    const serviceLink = service.fields.link;
        
    card.innerHTML = `
        <div class="service-title">${serviceTitle}</div>
        
        <div class="service-languages">
            <span class="language-tab active" onclick="switchLanguage(this, 'en', ${JSON.stringify(service.fields.service).replace(/"/g, '&quot;')})">English</span>
            <span class="language-tab" onclick="switchLanguage(this, 'as', ${JSON.stringify(service.fields.service).replace(/"/g, '&quot;')})">অসমীয়া</span>
            <span class="language-tab" onclick="switchLanguage(this, 'bn', ${JSON.stringify(service.fields.service).replace(/"/g, '&quot;')})">বাংলা</span>
        </div>

        <a href="https://sewasetu.assam.statedatacenter.in/${serviceLink}" target="_blank" class="service-link">
            <i class="fas fa-external-link-alt"></i>
            Apply for Service
        </a>
    `;

    return card;
}

function switchLanguage(element, lang, serviceData) {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Remove active class from siblings
    element.parentNode.querySelectorAll('.language-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    element.classList.add('active');
    
    // Update service title
    const serviceTitle = element.closest('.service-card').querySelector('.service-title');
    serviceTitle.textContent = serviceData[lang];
}

function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    if (pagination.total_pages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevBtn.disabled = !pagination.has_previous;
    prevBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling up
        performSearch(currentPage - 1);
    });
    paginationContainer.appendChild(prevBtn);

    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
    paginationContainer.appendChild(pageInfo);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = !pagination.has_next;
    nextBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling up
        performSearch(currentPage + 1);
    });
    paginationContainer.appendChild(nextBtn);
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'none';
}

function showNoResults() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = 'No services found';
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-search"></i>
            <h3>No services found</h3>
            <p>Try searching with different keywords or check your spelling</p>
        </div>
    `;
    
    document.getElementById('pagination').innerHTML = '';
    
    // Show results section
    resultsSection.style.display = 'block';
}

function showError() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = 'Search Error';
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Something went wrong</h3>
            <p>Please try again later or contact support</p>
        </div>
    `;
    
    document.getElementById('pagination').innerHTML = '';
    
    // Show results section
    resultsSection.style.display = 'block';
}
