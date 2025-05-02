document.addEventListener("DOMContentLoaded", () => {
    const checkBtn = document.getElementById("checkBtn")
    const resultDiv = document.getElementById("result")
    const errorDiv = document.getElementById("error")
    errorDiv.hidden = true;
    console.log("Popup loaded, hiding error card");
    const verdictIcon = document.getElementById("verdictIcon")
    const verdictLabel = document.getElementById("verdictLabel")
    const summaryEl = document.getElementById("summary")
    const copyBtn = document.getElementById("copyBtn")
    const darkToggle = document.getElementById("darkModeToggle")
    const loadingSpin = document.getElementById("loadingSpinner")
    const skeletonLoader = document.getElementById("skeletonLoader")
    const highlightBox = document.getElementById("highlightBox")
    const highlightText = document.getElementById("highlightText")
    const tabs = document.querySelectorAll(".tab")
    const tabContents = document.querySelectorAll(".tab-content")
    const DARK_KEY = "factchecker_darkmode"
    const marked = window.marked // Declare the marked variable
    const chrome = window.chrome // Declare the chrome variable
    const readMoreBtn = document.getElementById('readMoreBtn')
  
    // Dark mode functionality
    function setDarkMode(on) {
      document.body.classList.toggle("dark", on)
      darkToggle.checked = on
      localStorage.setItem(DARK_KEY, on ? "1" : "0")
    }
  
    // FIX 1: Actually toggle dark mode
    darkToggle.addEventListener("change", () => {
      setDarkMode(darkToggle.checked);
      document.body.classList.add('theme-animating');
      setTimeout(() => document.body.classList.remove('theme-animating'), 400);
    })
    setDarkMode(localStorage.getItem(DARK_KEY) === "1")
  
    // Tab functionality with improved animations
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")
        tabContents.forEach((c) => (c.hidden = true))
        document.getElementById(tab.dataset.tab).hidden = false
        moveTabIndicator();
        tab.focus();
        // Extra defensive: always hide error card on tab switch
        errorDiv.hidden = true;
      })
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const idx = Array.from(tabs).indexOf(tab);
          const nextIdx = e.key === 'ArrowRight' ? (idx+1)%tabs.length : (idx-1+tabs.length)%tabs.length;
          tabs[nextIdx].click();
          tabs[nextIdx].focus();
        }
      });
    })
    moveTabIndicator();
    tabs[0].click()
  
    // Enhanced copy functionality
    copyBtn.addEventListener("click", async () => {
        const verdictText = document.getElementById('verdict-text').textContent;
        const summaryText = summaryEl.textContent;
        const fullText = `Verdict: ${verdictText}\n\nExplanation:\n${summaryText}`;

        try {
            await navigator.clipboard.writeText(fullText);
            copyBtn.innerHTML = `<span class="material-icons">check</span>`;
            setTimeout(() => {
                copyBtn.innerHTML = `<span class="material-icons">content_copy</span>`;
            }, 1500);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    });
  
    // Enhanced error display
    function showError(message) {
      hideLoading();
      const errorCard = document.getElementById("error")
      const errorMessage = errorCard.querySelector(".error-message")
      errorMessage.textContent = message
      errorCard.hidden = false
      resultDiv.hidden = true
    }
  
    // Enhanced loading state
    function showLoading() {
      resultDiv.hidden = true;
      errorDiv.hidden = true;
      document.getElementById('sourcesTabList').innerHTML = "";
      summaryEl.innerHTML = "";
      
      // Show loading spinner only
      loadingSpin.hidden = false;
      requestAnimationFrame(() => {
        loadingSpin.classList.add('fade-in');
      });
      
      tabs[0].click(); // Switch to results tab
    }
  
    function hideLoading() {
      loadingSpin.classList.remove('fade-in');
      loadingSpin.hidden = true;
    }
  
    // Enhanced result display
    function showResult(data, selectedText) {
      hideLoading();
      errorDiv.hidden = true;
  
      if (!data || !data.summary) {
        showError("No valid response received from the server.");
        return;
      }
  
      const verdictSection = document.getElementById('verdict-section');
      const verdictIcon = document.getElementById('verdict-icon');
      const verdictText = document.getElementById('verdict-text');
      const summaryEl = document.getElementById('summary');
  
      let rawSummary = data.summary;
      let finalVerdict = "UNKNOWN";
  
      // Prioritize verdict found in the summary text, as it seems more reliable.
      const verdictMatch = rawSummary.match(/VERDICT:\s*(TRUE|FALSE|MOSTLY TRUE|MOSTLY FALSE|MISLEADING|MIXED)/i);
      if (verdictMatch && verdictMatch[1]) {
        finalVerdict = verdictMatch[1].toUpperCase();
      } else if (data.verdict) { // Fallback to the dedicated verdict field
        finalVerdict = data.verdict.toUpperCase();
      }
  
      // Aggressively clean the summary text to remove all redundant headers and lists.
      let cleanSummary = rawSummary
        .replace(/(\d+\.\s*)?VERDICT:.*?\n/ig, '')
        .replace(/(\d+\.\s*)?EXPLANATION: ?/ig, '')
        .replace(/Here's an analysis of the statement:/i, '')
        .replace(/Summary and Sources:/i, '')
        .replace(/^[*]{1,2}\s*/gm, '') // Remove leading * or **
        .replace(/^\s*(Summary|SUMMARY):\s*/gm, '') // Remove lines starting with 'Summary:' or 'SUMMARY:'
        .replace(/^\s*[*]{1,2}\s*$/gm, '') // Remove lines that are only * or **
        .trim();
  
      // Set the verdict icon, text, and color-coded style
      verdictSection.className = 'verdict-section';
      let icon = 'help_outline';
      let text = 'Unknown';
      let verdictClass = 'unknown';
  
      if (finalVerdict.includes("TRUE")) {
        icon = 'check_circle';
        text = finalVerdict;
        verdictClass = 'true';
      } else if (finalVerdict.includes("FALSE")) {
        icon = 'cancel';
        text = finalVerdict;
        verdictClass = 'false';
      } else if (/MIXED|WARN|PARTIAL|MISLEADING/.test(finalVerdict)) {
        icon = 'error';
        text = finalVerdict;
        verdictClass = 'mixed';
      }
  
      verdictIcon.textContent = icon;
      verdictText.textContent = text;
      verdictSection.classList.add(verdictClass);
  
      summaryEl.innerHTML = marked.parse(cleanSummary);
      
      // Reset "Read more" state
      summaryEl.classList.remove('expanded');
      readMoreBtn.textContent = 'Read more';
      readMoreBtn.hidden = true;
  
      // Defer the check to allow the DOM to render
      requestAnimationFrame(() => {
        if (summaryEl.scrollHeight > summaryEl.clientHeight) {
          readMoreBtn.hidden = false;
        }
      });
  
      resultDiv.hidden = false;
  
      // --- Sources Logic (remains the same) ---
      const sourcesTabList = document.getElementById('sourcesTabList');
      const list = data.sources && Array.isArray(data.sources) ? data.sources : [];
      
      const uniqueSources = list.reduce((acc, src) => {
        if (src && src.url && !acc.some(existing => existing.url === src.url)) {
          acc.push(src);
        }
        return acc;
      }, []);
  
      const sourceHTML = uniqueSources.length > 0 
        ? uniqueSources.map((src, index) => {
            const favicon = getFavicon(src.url || '');
            const displayUrl = src.url ? new URL(src.url).hostname : '';
            return `<div class='source-pill'>
              <div style='display:flex;align-items:center;gap:8px;width:100%;min-width:0;'>
                <img src='${favicon}' alt='' style='width:16px;height:16px;border-radius:3px;flex-shrink:0;'/>
                <div style='display:flex;flex-direction:column;min-width:0;flex:1;'>
                  <span style='font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>${src.title || `Source ${index + 1}`}</span>
                  <a href='${src.url}' 
                     target='_blank' 
                     rel='noopener noreferrer'
                     style='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--link-color);font-size:0.9em;'
                     title='${src.url}'>${displayUrl}</a>
                </div>
              </div>
            </div>`;
          }).join("")
        : `<div class='source-pill' style='color:var(--text-muted);'>No sources available</div>`;
  
      sourcesTabList.innerHTML = sourceHTML;
    }
  
    // --- Confetti animation utility ---
    function launchConfetti() {
      const confettiContainer = document.getElementById('confetti-container');
      if (!confettiContainer) return;
      for (let i = 0; i < 32; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        const size = Math.random() * 8 + 8;
        conf.style.width = `${size}px`;
        conf.style.height = `${size * 0.4}px`;
        conf.style.background = `hsl(${Math.random()*360},90%,60%)`;
        conf.style.position = 'absolute';
        conf.style.left = `${Math.random()*100}vw`;
        conf.style.top = '-40px';
        conf.style.opacity = Math.random()*0.5+0.5;
        conf.style.borderRadius = '4px';
        conf.style.transform = `rotate(${Math.random()*360}deg)`;
        conf.style.animation = `confetti-fall ${1.5+Math.random()}s cubic-bezier(.4,1.4,.6,1) forwards`;
        confettiContainer.appendChild(conf);
        setTimeout(() => conf.remove(), 2000);
      }
    }
  
    // --- Animate tab indicator ---
    function moveTabIndicator() {
      const tabs = document.querySelectorAll('.tab');
      const indicator = document.querySelector('.tab-indicator');
      if (!indicator) return;
      const activeTab = document.querySelector('.tab.active');
      if (!activeTab) return;
      const parent = activeTab.parentElement;
      const idx = Array.from(parent.children).filter(el => el.classList.contains('tab')).indexOf(activeTab);
      indicator.style.transform = `translateX(${idx*100}%)`;
    }
  
    // --- Favicon preview for sources ---
    function getFavicon(url) {
      try {
        const u = new URL(url);
        return `${u.origin}/favicon.ico`;
      } catch {
        return '';
      }
    }
  
    // Main fact-checking functionality
    checkBtn.addEventListener("click", async () => {
      // Reset UI state
      showLoading()
  
      let text = ""
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection().toString(),
        })
        text = (result || "").trim()
      } catch (e) {
        console.error("Script injection failed", e)
        showError("Unable to access the current page. Please try refreshing the page and try again.")
        return
      }
  
      if (!text) {
        showError("Please highlight some text on the webpage first, then click the check button.")
        return
      }
  
      // Truncate very long text
      if (text.length > 1000) {
        text = text.substring(0, 1000) + "..."
      }
  
      let data
      try {
        const res = await fetch("http://127.0.0.1:5000/factcheck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
  
        if (!res.ok) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`)
        }
  
        data = await res.json()
      } catch (e) {
        console.error("API request failed", e)
        if (e.message.includes("Failed to fetch")) {
          showError(
            "Unable to connect to the fact-checking service. Please ensure the server is running on localhost:5000.",
          )
        } else {
          showError(`Connection error: ${e.message}`)
        }
        return
      }
  
      showResult(data, text)
    })
  
    // Add button ripple effect
    checkBtn.addEventListener("click", function (e) {
      const ripple = this.querySelector(".btn-ripple")
      const rect = this.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
  
      ripple.style.width = ripple.style.height = size + "px"
      ripple.style.left = x + "px"
      ripple.style.top = y + "px"
      ripple.classList.add("active")
  
      setTimeout(() => ripple.classList.remove("active"), 600)
    })
  
    // FIX 3: Remove unnecessary auto-focus on checkBtn
    // setTimeout(() => {
    //   checkBtn.focus();
    // }, 300);
  
    // Read more button functionality
    readMoreBtn.addEventListener('click', () => {
        summaryEl.classList.toggle('expanded');
        const isExpanded = summaryEl.classList.contains('expanded');
        readMoreBtn.textContent = isExpanded ? 'Read less' : 'Read more';
    });
  })
  