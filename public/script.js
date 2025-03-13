let username = "";
let messages = [];
let blogs = [];
let currentBlogId = null;
let replyingTo = null;

// Event listenerlar
document.getElementById("submitButton").addEventListener("click", saveUsername);
document.getElementById("passwordSubmit").addEventListener("click", checkBlogPassword);
document.getElementById("closeBlogModal").addEventListener("click", closeBlogModal);
document.getElementById("sendButton").addEventListener("click", sendMessage);

window.onload = function () {
  const savedData = JSON.parse(localStorage.getItem("authData"));
  if (savedData && savedData.expiry > Date.now()) {
    username = savedData.username;
    document.getElementById("login-modal").style.display = "none";
    fetchBlogs();
  }
};

function saveUsername() {
  const inputUsername = document.getElementById("username").value;
  if (inputUsername.trim()) {
    username = inputUsername;
    const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000;
    localStorage.setItem("authData", JSON.stringify({ username, expiry }));
    document.getElementById("login-modal").style.display = "none";
    fetchBlogs();
  } else {
    alert("Iltimos, ismingizni kiriting!");
    
  }
}


function fetchBlogs() {
  const blogList = document.getElementById("blog-list");
  const skeleton = document.getElementById("skeleton");

  blogList.style.display = "block";
  skeleton.style.display = "block";

  fetch("https://script.google.com/macros/s/AKfycbxaNOYqh4KMrw8-LaPwvwEbRi95zHoTYF-ydEdI6K-wqpj5lKVCIUcsumDgRFO4bVEG8w/exec?sheet=blogs")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch blogs");
      return response.json();
    })
    .then((data) => {
      blogs = data;
      displayBlogList();
    })
    .catch((error) => {
      console.error("Error fetching blogs:", error);
      skeleton.style.display = "none";
      blogList.innerHTML = "<p>Bloglarni yuklashda xatolik yuz berdi.</p>";
    });
}

function displayBlogList() {
  const blogList = document.getElementById("blog-list");
  const skeleton = document.getElementById("skeleton");

  skeleton.style.display = "none";
  blogList.innerHTML = "";

  if (!Array.isArray(blogs)) {
    console.error("Blogs is not an array:", blogs);
    blogList.innerHTML = "<p>No blogs available.</p>";
    return;
  }

  blogs.forEach((blog) => {
    const blogElement = document.createElement("div");
    blogElement.className = "blog-item";
    blogElement.innerHTML = `
      <h3>${blog.title}</h3>
      <p>${blog.preview}</p>
      <button onclick="promptBlogPassword('${blog.id}')">Read More</button>
    `;
    blogList.appendChild(blogElement);
  });
}

function promptBlogPassword(blogId) {
  currentBlogId = blogId;
  const blog = blogs.find((b) => b.id === blogId);
  document.getElementById("blog-password-prompt").textContent = `${blog.title} uchun parolni kiriting:`;
  document.getElementById("blog-password").value = "";
  document.getElementById("password-modal").style.display = "flex";
}

function checkBlogPassword() {
  const enteredPassword = document.getElementById("blog-password").value;
  const blog = blogs.find((b) => b.id === currentBlogId);

  if (enteredPassword === blog.password) {
    document.getElementById("password-modal").style.display = "none";
    openBlogModal(currentBlogId);
  } else {
    alert("Noto‘g‘ri parol!");
  }
}

function openBlogModal(blogId) {
  currentBlogId = blogId;
  const blog = blogs.find((b) => b.id === blogId);
  document.getElementById("blog-title").textContent = blog.title;
  document.getElementById("blog-content").innerHTML = blog.content;
  document.getElementById("blog-modal").style.display = "flex";

  messages = [];
  const chatElement = document.getElementById("chat");
  chatElement.innerHTML = "<p class='no-messages'>Xabarlar yuklanmoqda...</p>";
  fetchMessages(blogId);
}

function closeBlogModal() {
  document.getElementById("blog-modal").style.display = "none";
  currentBlogId = null;
  replyingTo = null;
  document.getElementById("messageInput").placeholder = "Xabar yozing...";
}

function fetchMessages(blogId) {
  fetch("https://script.google.com/macros/s/AKfycbxaNOYqh4KMrw8-LaPwvwEbRi95zHoTYF-ydEdI6K-wqpj5lKVCIUcsumDgRFO4bVEG8w/exec?sheet=messages")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    })
    .then((data) => {
      console.log("Fetched messages from server:", data);
      messages = data.filter((msg) => msg.blogId === blogId).map((msg) => {
        // Agar `id` bo‘lmasa, generatsiya qilamiz
        if (!msg.id) {
          msg.id = Date.now().toString() + Math.random().toString(36).substr(2, 9); // Unikal ID
          console.warn("Generated ID for message:", msg);
        }
        return msg;
      });
      console.log("Filtered and processed messages:", messages);
      displayMessages();
    })
    .catch((error) => {
      console.error("Error fetching messages:", error);
      document.getElementById("chat").innerHTML = "<p class='no-messages'>Xabarlar yuklanmadi</p>";
    });
}

function sendMessage() {
  const messageText = document.getElementById("messageInput").value;
  if (messageText.trim() && currentBlogId) {
    const timestamp = new Date().toLocaleString().slice(0, 16);
    const message = {
      username: username,
      text: messageText,
      timestamp: timestamp,
      blogId: currentBlogId,
      replyTo: replyingTo ? replyingTo.id : null,
      id: Date.now().toString(),
    };
    messages.push(message);
    displayMessages();
    sendToGoogleSheets(message);
    document.getElementById("messageInput").value = "";
    replyingTo = null;
    document.getElementById("messageInput").placeholder = "Xabar yozing...";
  } else {
    alert("Xabar yozing yoki blog tanlanmagan!");
  }
}

function sendToGoogleSheets(message) {
  fetch("https://script.google.com/macros/s/AKfycbxaNOYqh4KMrw8-LaPwvwEbRi95zHoTYF-ydEdI6K-wqpj5lKVCIUcsumDgRFO4bVEG8w/exec?sheet=messages", {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [message] }),
  })
    .then(() => console.log("Message sent to Google Sheets:", message))
    .catch((error) => console.error("Error sending message:", error));
}

function displayMessages() {
  const chatElement = document.getElementById("chat");
  chatElement.innerHTML = "";

  if (messages.length === 0) {
    chatElement.innerHTML = "<p class='no-messages'>Hozircha xabarlar yo‘q</p>";
    return;
  }

  messages.forEach((message) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(message.username === username ? "user" : "other");

    let replyPreview = "";
    if (message.replyTo) {
      const repliedMessage = messages.find((msg) => msg.id === message.replyTo);
      if (repliedMessage) {
        replyPreview = `
          <div class="reply-preview" onclick="highlightMessage('${repliedMessage.id}')">
            <span>${repliedMessage.username}: </span>${repliedMessage.text.substring(0, 30)}...
          </div>
        `;
      } else {
        replyPreview = `<div class="reply-preview">javob  berilgan xabar o'chirilgan</div>`;
      }
    }

    messageElement.innerHTML = `
      ${replyPreview}
      <div class="username">${message.username}</div>
      <div class="text">${message.text}</div>
      <div class="timestamp">${message.timestamp}</div>
      <button class="reply-btn" onclick="setReplyingTo('${message.id}')">Reply</button>
    `;
    messageElement.dataset.id = message.id;
    chatElement.appendChild(messageElement);
  });
  chatElement.scrollTop = chatElement.scrollHeight;
}

function setReplyingTo(messageId) {
  console.log('we should', messageId, messages)
  replyingTo = messages.find((msg) => msg.id == messageId);
  if (replyingTo) {
    console.log("Replying to message:", replyingTo);
    document.getElementById("messageInput").placeholder = `Replying to ${replyingTo.username}...`;
    document.getElementById("messageInput").focus();
  } else {
    console.error("Message not found for reply, ID:", messageId);
    console.log("Current messages array:", messages);
    alert("Reply qilinadigan xabar topilmadi!");
  }
}

function highlightMessage(messageId) {
  const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
  if (messageElement) {
    messageElement.classList.add("highlighted");
    setTimeout(() => messageElement.classList.remove("highlighted"), 2000);
  } else {
    console.error("Message element not found for highlighting, ID:", messageId);
  }
}

setInterval(() => {
  const savedData = JSON.parse(localStorage.getItem("authData"));
  if (savedData && savedData.expiry <= Date.now()) {
    localStorage.removeItem("authData");
    document.getElementById("login-modal").style.display = "flex";
    document.getElementById("blog-list").style.display = "none";
    document.getElementById("blog-modal").style.display = "none";
    document.getElementById("password-modal").style.display = "none";
  }
}, 60000);