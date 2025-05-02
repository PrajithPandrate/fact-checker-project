chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "factCheck",
      title: "Fact Check This",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "factCheck") {
      const selectedText = info.selectionText;
  
      const response = await fetch("http://127.0.0.1:5000/factcheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: selectedText })
      });
  
      if (!response.ok) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (msg) => alert(msg),
          args: ["❗️ Backend error: " + response.statusText]
        });
        return;
      }      
      
      const text = await response.text();
      
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        alert("Could not parse JSON response from the server.");
        return;
      }
        
      const verdict = result.verdict || "Unknown";
      const summary = result.summary || "No summary provided";
      const source = result.source || "Unknown";
      const url = result.url || "No link available";
      
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (result) => {
          const verdict = result.verdict || "Unknown";
          const summary = result.summary || "No summary provided";
          const source = result.source || "Unknown";
          const url = result.url || "No link available";
      
          alert(`✅ Verdict: ${verdict}\n📰 Summary: ${summary}\n🏢 Source: ${source}\n🔗 Link: ${url}`);
        },
        args: [result]
      });
      

    }
  });
  