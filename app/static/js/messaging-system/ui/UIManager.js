/**
 * UI Manager
 * Handles UI state and interactions
 */
export class UIManager {
    constructor(messageSystem) {
        this.messageSystem = messageSystem;
        this.typingIndicatorVisible = false;
        this.typingTimer = null;
        this.isCurrentlyTyping = false;
    }

    /**
     * Setup message input event listeners
     */
    setupMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (!input || !sendButton) return;

        input.addEventListener("input", (e) => {
            sendButton.disabled =
                !e.target.value.trim() || !this.messageSystem.currentChatUserId;
            this.autoResizeTextarea(e.target);

            // Handle typing indicators
            if (this.messageSystem.currentChatUserId && e.target.value.trim()) {
                this.handleTypingStart();
            } else {
                this.handleTypingStop();
            }
        });

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!sendButton.disabled) {
                    // Stop typing indicator before sending
                    this.handleTypingStop();
                    this.messageSystem.sendMessage();
                }
            }
        });

        // Clear typing on blur (when user clicks away)
        input.addEventListener("blur", () => {
            this.handleTypingStop();
        });

        // Initially disable input
        input.disabled = true;
        input.placeholder = "Select a conversation to start messaging...";
        sendButton.disabled = true;
    }

    /**
     * Auto-resize textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }

    /**
     * Update chat selection in sidebar
     */
    updateChatSelection(userId) {
        document.querySelectorAll("#chatItems > div").forEach((item) => {
            item.classList.remove("bg-blue-50", "dark:bg-blue-900/20");
        });

        // Find and highlight the selected chat
        const chatItems = document.querySelectorAll("#chatItems > div");
        chatItems.forEach((item) => {
            if (item.querySelector("div").textContent.includes(userId)) {
                item.classList.add("bg-blue-50", "dark:bg-blue-900/20");
            }
        });
    }

    /**
     * Show chat view
     */
    showChatView() {
        const welcome = document.getElementById("chatWelcome");
        const chatView = document.getElementById("chatView");

        welcome?.classList.add("hidden");
        chatView?.classList.remove("hidden");
    }

    /**
     * Enable message input
     */
    enableMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (input && sendButton) {
            input.disabled = false;
            input.placeholder = "Type a message...";
            sendButton.disabled = !input.value.trim();
        }
    }

    /**
     * Disable message input while sending
     */
    disableMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (input && sendButton) {
            // Stop typing indicator when sending
            this.handleTypingStop();

            input.disabled = true;
            sendButton.disabled = true;
        }
    }

    /**
     * Show new message toast notification
     */
    showNewMessageToast(data) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm opacity-0 transform translate-x-full transition-all duration-300 cursor-pointer';
        toast.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="bi bi-chat-dots text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${data.notification.title}</p>
                    <p class="text-xs opacity-90">${data.notification.body}</p>
                    <p class="text-xs opacity-75 mt-1">Click to view conversation</p>
                </div>
                <button onclick="event.stopPropagation(); this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <i class="bi bi-x text-lg"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-full');
        }, 100);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', 'translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);

        // Click to open conversation
        toast.addEventListener('click', () => {
            if (data.message && data.message.sender_id) {
                this.messageSystem.openChat(data.message.sender_id);
            }
        });
    }

    /**
     * Handle typing start
     */
    handleTypingStart() {
        if (this.messageSystem.currentChatUserId && !this.isCurrentlyTyping) {
            this.isCurrentlyTyping = true;
            this.messageSystem.socketManager.startTyping(
                this.messageSystem.currentChatUserId
            );
        }

        // Reset the typing timer
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.handleTypingStop();
        }, 3000); // Stop typing after 3 seconds of inactivity
    }

    /**
     * Handle typing stop
     */
    handleTypingStop() {
        if (this.messageSystem.currentChatUserId && this.isCurrentlyTyping) {
            this.isCurrentlyTyping = false;
            this.messageSystem.socketManager.stopTyping(
                this.messageSystem.currentChatUserId
            );
        }
        clearTimeout(this.typingTimer);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator(userName, isTyping) {
        const messagesArea = document.getElementById("messagesArea");
        if (!messagesArea) return;

        // Remove existing typing indicator
        const existingIndicator = document.getElementById("typing-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (isTyping) {
            // Create typing indicator
            const indicator = document.createElement("div");
            indicator.id = "typing-indicator";
            indicator.className = "flex items-center space-x-2 p-3 text-gray-500 dark:text-gray-400 text-sm italic";
            indicator.innerHTML = `
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                </div>
                <span>${userName} is typing...</span>
            `;
            
            messagesArea.appendChild(indicator);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    /**
     * Clear typing indicator for conversation switch
     */
    clearTypingForConversationSwitch() {
        const existingIndicator = document.getElementById("typing-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const chatListLoading = document.getElementById("chatListLoading");
        const chatItems = document.getElementById("chatItems");
        const chatListEmpty = document.getElementById("chatListEmpty");

        if (chatListLoading) chatListLoading.classList.add("hidden");
        if (chatItems) chatItems.classList.add("hidden");
        if (chatListEmpty) chatListEmpty.classList.remove("hidden");
    }

    /**
     * Show chat items
     */
    showChatItems() {
        const chatListLoading = document.getElementById("chatListLoading");
        const chatItems = document.getElementById("chatItems");
        const chatListEmpty = document.getElementById("chatListEmpty");

        if (chatListLoading) chatListLoading.classList.add("hidden");
        if (chatItems) chatItems.classList.remove("hidden");
        if (chatListEmpty) chatListEmpty.classList.add("hidden");
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const chatListLoading = document.getElementById("chatListLoading");
        if (chatListLoading) {
            chatListLoading.classList.add("hidden");
        }
    }

    /**
     * Show chat view
     */
    showChatView() {
        const chatWelcome = document.getElementById("chatWelcome");
        const chatView = document.getElementById("chatView");

        if (chatWelcome) chatWelcome.classList.add("hidden");
        if (chatView) chatView.classList.remove("hidden");
    }

    /**
     * Update chat selection
     */
    updateChatSelection(userId) {
        // Update visual selection in chat list
        const chatItems = document.querySelectorAll("#chatItems > div");
        chatItems.forEach(item => {
            item.classList.remove("bg-blue-50", "dark:bg-blue-900/20");
        });

        const selectedChat = document.querySelector(`[data-user-id="${userId}"]`);
        if (selectedChat) {
            selectedChat.classList.add("bg-blue-50", "dark:bg-blue-900/20");
        }
    }

    /**
     * Enable message input
     */
    enableMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (input) {
            input.disabled = false;
            input.placeholder = "Type a message...";
        }
        if (sendButton) {
            sendButton.disabled = !input?.value.trim();
        }
    }

    /**
     * Disable message input
     */
    disableMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (input) {
            input.disabled = true;
            input.placeholder = "Sending...";
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
    }

    /**
     * Show new message toast notification
     */
    showNewMessageToast(data) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm opacity-0 transform translate-x-full transition-all duration-300 cursor-pointer';
        toast.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="bi bi-chat-dots text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${data.notification.title}</p>
                    <p class="text-xs opacity-90">${data.notification.body}</p>
                    <p class="text-xs opacity-75 mt-1">Click to view conversation</p>
                </div>
                <button onclick="event.stopPropagation(); this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <i class="bi bi-x text-lg"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-full');
        }, 100);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', 'translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);

        // Click to open conversation
        toast.addEventListener('click', () => {
            if (data.message && data.message.sender_id) {
                this.messageSystem.openChat(data.message.sender_id);
            }
        });
    }

    /**
     * Handle typing start
     */
    handleTypingStart() {
        if (this.messageSystem.currentChatUserId && !this.isCurrentlyTyping) {
            this.isCurrentlyTyping = true;
            this.messageSystem.socketManager.startTyping(
                this.messageSystem.currentChatUserId
            );
        }

        // Reset the typing timer
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.handleTypingStop();
        }, 3000); // Stop typing after 3 seconds of inactivity
    }

    /**
     * Handle typing stop
     */
    handleTypingStop() {
        if (this.messageSystem.currentChatUserId && this.isCurrentlyTyping) {
            this.isCurrentlyTyping = false;
            this.messageSystem.socketManager.stopTyping(
                this.messageSystem.currentChatUserId
            );
        }
        clearTimeout(this.typingTimer);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator(userName, isTyping) {
        const messagesArea = document.getElementById("messagesArea");
        if (!messagesArea) return;

        // Remove existing typing indicator
        const existingIndicator = document.getElementById("typing-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (isTyping) {
            // Create typing indicator
            const indicator = document.createElement("div");
            indicator.id = "typing-indicator";
            indicator.className = "flex items-center space-x-2 p-3 text-gray-500 dark:text-gray-400 text-sm italic";
            indicator.innerHTML = `
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                </div>
                <span>${userName} is typing...</span>
            `;
            
            messagesArea.appendChild(indicator);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    /**
     * Clear typing indicator for conversation switch
     */
    clearTypingForConversationSwitch() {
        const existingIndicator = document.getElementById("typing-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const chatListLoading = document.getElementById("chatListLoading");
        const chatItems = document.getElementById("chatItems");
        const chatListEmpty = document.getElementById("chatListEmpty");

        if (chatListLoading) chatListLoading.classList.add("hidden");
        if (chatItems) chatItems.classList.add("hidden");
        if (chatListEmpty) chatListEmpty.classList.remove("hidden");
    }

    /**
     * Show chat items
     */
    showChatItems() {
        const chatListLoading = document.getElementById("chatListLoading");
        const chatItems = document.getElementById("chatItems");
        const chatListEmpty = document.getElementById("chatListEmpty");

        if (chatListLoading) chatListLoading.classList.add("hidden");
        if (chatItems) chatItems.classList.remove("hidden");
        if (chatListEmpty) chatListEmpty.classList.add("hidden");
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const chatListLoading = document.getElementById("chatListLoading");
        if (chatListLoading) {
            chatListLoading.classList.add("hidden");
        }
    }

    /**
     * Show chat view
     */
    showChatView() {
        const chatWelcome = document.getElementById("chatWelcome");
        const chatView = document.getElementById("chatView");

        if (chatWelcome) chatWelcome.classList.add("hidden");
        if (chatView) chatView.classList.remove("hidden");
    }

    /**
     * Update chat selection
     */
    updateChatSelection(userId) {
        // Update visual selection in chat list
        const chatItems = document.querySelectorAll("#chatItems > div");
        chatItems.forEach(item => {
            item.classList.remove("bg-blue-50", "dark:bg-blue-900/20");
        });

        const selectedChat = document.querySelector(`[data-user-id="${userId}"]`);
        if (selectedChat) {
            selectedChat.classList.add("bg-blue-50", "dark:bg-blue-900/20");
        }
    }

    /**
     * Enable message input
     */
    enableMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (input) {
            input.disabled = false;
            input.placeholder = "Type a message...";
        }
        if (sendButton) {
            sendButton.disabled = !input?.value.trim();
        }
    }

    /**
     * Disable message input
     */
    disableMessageInput() {
        const input = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        if (input) {
            input.disabled = true;
            input.placeholder = "Sending...";
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
    }

    /**
     * Show new message toast notification
     */
    showNewMessageToast(data) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm opacity-0 transform translate-x-full transition-all duration-300 cursor-pointer';
        toast.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="bi bi-chat-dots text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${data.notification.title}</p>
                    <p class="text-xs opacity-90">${data.notification.body}</p>
                    <p class="text-xs opacity-75 mt-1">Click to view conversation</p>
                </div>
                <button onclick="event.stopPropagation(); this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <i class="bi bi-x text-lg"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-full');
        }, 100);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', 'translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);

        // Click to open conversation
        toast.addEventListener('click', () => {
            if (data.message && data.message.sender_id) {
                this.messageSystem.openChat(data.message.sender_id);
            }
        });
    }

    /**
     * Handle typing start
     */
    handleTypingStart() {
        if (this.messageSystem.currentChatUserId && !this.isCurrentlyTyping) {
            this.isCurrentlyTyping = true;
            this.messageSystem.socketManager.startTyping(
                this.messageSystem.currentChatUserId
            );
        }

        // Reset the typing timer
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.handleTypingStop();
        }, 3000); // Stop typing after 3 seconds of inactivity
    }

    /**
     * Handle typing stop
     */
    handleTypingStop() {
        if (this.messageSystem.currentChatUserId && this.isCurrentlyTyping) {
            this.isCurrentlyTyping = false;
            this.messageSystem.socketManager.stopTyping(
                this.messageSystem.currentChatUserId
            );
        }
        clearTimeout(this.typingTimer);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator(userName, isTyping) {
        const messagesArea = document.getElementById("messagesArea");
        if (!messagesArea) return;

        // Remove existing typing indicator
        const existingIndicator = document.getElementById("typing-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (isTyping) {
            // Create typing indicator
            const indicator = document.createElement("div");
            indicator.id = "typing-indicator";
            indicator.className = "flex items-center space-x-2 p-3 text-gray-500 dark:text-gray-400 text-sm italic";
            indicator.innerHTML = `
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                </div>
                <span>${userName} is typing...</span>
            `;
            
            messagesArea.appendChild(indicator);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    /**
     * Clear typing indicator for conversation switch
     */
    clearTypingForConversationSwitch() {
        const existingIndicator = document.getElementById("typing-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}
