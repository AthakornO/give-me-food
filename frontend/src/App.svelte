<script>
  import { afterUpdate } from 'svelte';

  // --- 1. Application State ---
  let currentScreen = 'chat'; // 'chat' | 'map'
  let authStep = 'phone';     
  let mapStep = 'matching';   // 'matching' -> 'transit' -> 'delivered'
  
  let chatContainer;
  let fileInput;

  // --- 3. Chat Data ---
  let messages = [
    { 
      role: 'assistant', 
      text: 'Hello! Welcome to Give Me Food 🌍\n\nTo verify your identity, please enter your phone number to start.' 
    }
  ];
  let message = '';
  let selectedFile = null;
  let isLoading = false;

  // --- 4. Chat Functions ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) selectedFile = file;
  };

  afterUpdate(() => {
    if (chatContainer) {
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  });

  const sendMessage = () => {
    if (!message.trim() && !selectedFile) return;

    const userText = message.trim();
    const userImgUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;
    messages = [...messages, { role: 'user', text: userText, image: userImgUrl }];
    
    message = ''; 
    selectedFile = null; 
    isLoading = true;

    if (authStep === 'phone') {
      setTimeout(() => {
        authStep = 'verify';
        messages = [...messages, { 
          role: 'assistant', 
          text: 'Got it! We\'ve sent an OTP to your phone 📲\n\nYou can enter the 4-digit code, or tap below to use your device\'s native security.',
          showAuthButton: true
        }];
        isLoading = false;
      }, 1000);
    } else if (authStep === 'verify') {
      verifySuccess();
    } else if (authStep === 'authenticated') {
      setTimeout(() => {
        messages = [...messages, { 
          role: 'assistant', 
          text: 'Data received! We are now coordinating with a local rider. 🎉\n\nTap the top header to track your delivery.',
          details: { item: 'Analyzed Surplus Food', quantity: '1 Unit', expiry: 'Within 3 days', microFee: '$0.01', carbon: '1.2 kg' }
        }];
        isLoading = false;
      }, 1500);
    }
  };

  const verifySuccess = () => {
    isLoading = true;
    setTimeout(() => {
      authStep = 'authenticated';
      messages = [...messages, { 
        role: 'assistant', 
        text: 'Verification successful! ✅\n\nWhat surplus food would you like to share today? Snap a photo!' 
      }];
      isLoading = false;
    }, 800);
  };

  // --- 5. Map Simulation Logic ---
  const toggleScreen = () => {
    currentScreen = currentScreen === 'chat' ? 'map' : 'chat';
    
    if (currentScreen === 'map') {
      mapStep = 'matching';
      
      setTimeout(() => {
        if(currentScreen === 'map') mapStep = 'transit';
      }, 2000);

      setTimeout(() => {
        if(currentScreen === 'map') mapStep = 'delivered';
      }, 5000);
    }
  };
</script>

<main class="app-container {currentScreen === 'map' ? 'dark-mode' : ''}">
  
  <header class="base-header" on:click={toggleScreen} style="cursor: pointer;" title="Toggle Map Screen">
    <div class="brand">
      <h1>Give Me Food</h1>
      <span class="status-dot"></span>
    </div>
  </header>

  {#if currentScreen === 'chat'}
    <div class="chat-window" bind:this={chatContainer}>
      {#each messages as msg}
        <div class="message-wrapper {msg.role}">
          <div class="message-bubble">
            {#if msg.image}
              <img src={msg.image} alt="Uploaded food" class="chat-image" />
            {/if}
            {#if msg.text}<p>{msg.text}</p>{/if}
            
            {#if msg.showAuthButton && authStep === 'verify'}
              <button class="native-auth-btn" on:click={verifySuccess}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                </svg>
                Verify with Device (PIN / FaceID)
              </button>
            {/if}

            {#if msg.details}
              <div class="insight-card">
                <div class="insight-row"><span>Item:</span> <strong>{msg.details.item}</strong></div>
                <div class="insight-row highlight"><span>Micro-fee:</span> <strong>{msg.details.microFee}</strong></div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if isLoading}
        <div class="message-wrapper assistant">
          <div class="message-bubble typing-indicator"><span></span><span></span><span></span></div>
        </div>
      {/if}
    </div>

    <div class="input-area">
      <div class="input-pill">
        {#if authStep === 'authenticated'}
          <input type="file" accept="image/*" bind:this={fileInput} on:change={handleFileChange} hidden />
          <button class="icon-btn" on:click={() => fileInput.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>
        {/if}
        <input type="text" class="text-input" placeholder={authStep === 'phone' ? "Enter phone number..." : authStep === 'verify' ? "4-digit OTP..." : "Type a message..."} bind:value={message} on:keypress={(e) => e.key === 'Enter' && sendMessage()} />
        <button class="send-btn" on:click={sendMessage} disabled={!message.trim() && !selectedFile}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  {/if}

  {#if currentScreen === 'map'}
    <div class="map-screen">
      <div class="map-overlay-card">
        {#if mapStep === 'matching'}
          <h3 class="pulsing-text">Matching Rider...</h3>
          <p>Looking for a nearby rider.</p>
        {:else if mapStep === 'transit'}
          <h3 class="highlight-text">In Transit</h3>
          <p>Alex is picking up your donation.</p>
        {:else if mapStep === 'delivered'}
          <h3 class="success-text">Food Delivered!</h3>
          <p>Donation reached the local shelter.</p>
        {/if}
      </div>

      <div class="map-graphic">
        <svg viewBox="0 0 300 400" fill="none">
          <path d="M 50 350 Q 150 200 250 50" stroke="rgba(255,255,255,0.1)" stroke-width="4" stroke-dasharray="6,6"></path>
          {#if mapStep === 'transit' || mapStep === 'delivered'}
            <path d="M 50 350 Q 150 200 250 50" class="route-line-active"></path>
          {/if}
          <circle cx="50" cy="350" r="8" fill="#34C759"></circle>
          <text x="30" y="380" fill="#86868B" font-size="12">You</text>
          <circle cx="250" cy="50" r="8" fill="#FF9500"></circle>
          <text x="190" y="30" fill="#86868B" font-size="12">Shelter</text>
          {#if mapStep === 'matching'}
            <circle cx="150" cy="200" r="10" fill="#007AFF" class="node-rider-search"></circle>
          {:else if mapStep === 'transit'}
            <circle cx="150" cy="200" r="10" fill="#007AFF" class="node-rider-moving"></circle>
          {:else if mapStep === 'delivered'}
            <circle cx="250" cy="50" r="12" fill="#007AFF"></circle> 
          {/if}
        </svg>
      </div>

      {#if mapStep === 'delivered'}
        <div class="impact-card">
          <div class="impact-row"><span>Rider Earnings</span><strong class="highlight-text">+$0.01</strong></div>
          <div class="impact-row mt-2"><span>Carbon Saved</span><strong class="success-text">1.2 kg</strong></div>
        </div>
      {/if}
    </div>
  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #E5E5EA; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .app-container { width: 100%; max-width: 400px; height: 800px; max-height: 100vh; background-color: #FFFFFF; border-radius: 40px; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; }
  .app-container.dark-mode { background-color: #121212; color: #FFFFFF; }
  
  .base-header { background: #FFFFFF; border-bottom: 1px solid #E5E5EA; padding: 16px 20px; display: flex; justify-content: center; z-index: 10; transition: background 0.3s; }
  .dark-mode .base-header { background: #121212; border-color: #333; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .brand h1 { font-size: 1.1rem; font-weight: 600; margin: 0; }
  .status-dot { width: 8px; height: 8px; background-color: #34C759; border-radius: 50%; }
  
  .chat-window { flex: 1; overflow-y: auto; padding: 24px 20px; display: flex; flex-direction: column; gap: 16px; }
  .message-wrapper { display: flex; width: 100%; }
  .message-wrapper.user { justify-content: flex-end; }
  .message-wrapper.assistant { justify-content: flex-start; }
  .message-bubble { max-width: 85%; padding: 12px 16px; border-radius: 20px; font-size: 0.95rem; line-height: 1.5; white-space: pre-line; }
  .user .message-bubble { background-color: #1D1D1F; color: #FFFFFF; border-bottom-right-radius: 4px; }
  .assistant .message-bubble { background-color: #F2F2F7; color: #1D1D1F; border-bottom-left-radius: 4px; }
  .chat-image { width: 100%; max-width: 240px; border-radius: 12px; margin-bottom: 8px; object-fit: cover; }
  
  /* 🛠️ OPTIMIZED CSS: Reduced SVG size to 16px and adjusted button styling for minimalism */
  .native-auth-btn { display: flex; align-items: center; gap: 6px; background-color: #FFFFFF; border: 1px solid #D1D1D6; color: #1D1D1F; padding: 10px 16px; border-radius: 12px; margin-top: 12px; cursor: pointer; font-weight: 600; font-size: 0.85rem; width: 100%; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .native-auth-btn:active { background-color: #F2F2F7; }
  .native-auth-btn svg { width: 16px; height: 16px; color: #007AFF; }
  
  .insight-card { background: #FFFFFF; border: 1px solid #D1D1D6; border-radius: 12px; padding: 12px; margin-top: 12px; font-size: 0.85rem; }
  .insight-row { display: flex; justify-content: space-between; padding: 4px 0; }
  
  .input-area { background: #FFFFFF; border-top: 1px solid #E5E5EA; padding: 16px 20px 24px 20px; z-index: 10; }
  .input-pill { display: flex; align-items: center; background: #F2F2F7; border-radius: 30px; padding: 6px 6px 6px 12px; gap: 8px; }
  .text-input { flex: 1; background: transparent; border: none; outline: none; font-size: 0.95rem; }
  .icon-btn { background: none; border: none; padding: 8px; color: #86868B; cursor: pointer; display: flex; align-items: center; }
  .icon-btn svg { width: 20px; height: 20px; }
  .send-btn { background-color: #1D1D1F; color: #FFF; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; }
  .send-btn svg { width: 16px; height: 16px; }
  .send-btn:disabled { background-color: #D1D1D6; cursor: not-allowed; }
  
  .typing-indicator { display: flex; gap: 4px; padding: 8px; }
  .typing-indicator span { width: 6px; height: 6px; background-color: #86868B; border-radius: 50%; animation: bounce 1.4s infinite; }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  
  .map-screen { flex: 1; display: flex; flex-direction: column; position: relative; }
  .map-overlay-card { background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 24px; text-align: center; }
  .map-overlay-card h3 { margin: 0 0 4px 0; font-size: 1.2rem; }
  .map-overlay-card p { margin: 0; font-size: 0.9rem; color: #86868B; }
  .highlight-text { color: #007AFF; }
  .success-text { color: #34C759; }
  .pulsing-text { animation: pulseText 2s infinite; }
  @keyframes pulseText { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .map-graphic { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
  .route-line-active { stroke: rgba(0, 122, 255, 0.8); stroke-width: 4; stroke-dasharray: 400; stroke-dashoffset: 400; animation: drawLine 2s ease-out forwards; }
  @keyframes drawLine { to { stroke-dashoffset: 0; } }
  .node-rider-search { animation: ping 1.5s infinite; }
  @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
  .node-rider-moving { animation: float 2s infinite ease-in-out; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .impact-card { position: absolute; bottom: 40px; left: 24px; right: 24px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 16px; animation: slideUp 0.5s ease-out; }
  .impact-row { display: flex; justify-content: space-between; font-size: 1rem; color: #FFF; }
  .mt-2 { margin-top: 8px; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
