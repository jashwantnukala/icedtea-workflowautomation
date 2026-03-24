console.log("App started");

// ---------------- GLOBAL ----------------
let currentUserRole = "user";

// ---------------- AUTH ----------------

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      db.collection("users").doc(user.uid).set({
        email: user.email,
        capacity: 20,
        role: "user"
      });

      document.getElementById("message").innerText = "Account created!";
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ---------------- AUTH STATE ----------------

auth.onAuthStateChanged((user) => {
  const page = window.location.pathname;

  if (!user) {
    if (!page.includes("login.html") && !page.includes("index.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  db.collection("users").doc(user.uid).get().then((doc) => {
    currentUserRole = doc.data().role;

    // Redirect
    if (page.includes("login.html") || page.includes("index.html")) {
      window.location.href =
        currentUserRole === "admin" ? "admin.html" : "user.html";
      return;
    }

    // Admin page
    if (page.includes("admin.html")) {
      loadUsers();
    }

    // User page
    if (page.includes("user.html")) {
      loadTasks(user.uid);
    }
  });
});

// ---------------- ADMIN ----------------

// Load users
function loadUsers() {
  const userSelect = document.getElementById("userSelect");
  if (!userSelect) return;

  userSelect.innerHTML = "";

  db.collection("users").get().then((snapshot) => {
    snapshot.forEach((doc) => {
      const user = doc.data();

      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = user.email;

      userSelect.appendChild(option);
    });
  });
}

// Show capacity when user selected
document.addEventListener("change", function (e) {
  if (e.target.id === "userSelect") {
    const userId = e.target.value;

    db.collection("users").doc(userId).get().then((doc) => {
      const capacity = doc.data().capacity;

      document.getElementById("userCapacityInfo").innerText =
        "User Capacity: " + capacity + " EU";
    });
  }
});

// Smart Assign Task
function assignTask() {
  if (currentUserRole !== "admin") {
    alert("Only admin can assign tasks");
    return;
  }

  const userId = document.getElementById("userSelect").value;
  const task = document.getElementById("adminTaskInput").value;
  const effort = Number(document.getElementById("adminEffortInput").value);

  if (!task || !effort) {
    alert("Enter task and effort");
    return;
  }

  db.collection("users").doc(userId).get().then((userDoc) => {
    const capacity = userDoc.data().capacity;

    db.collection("tasks")
      .where("userId", "==", userId)
      .get()
      .then((snapshot) => {

        let currentEU = 0;
        snapshot.forEach((doc) => {
          currentEU += doc.data().effort;
        });

        const newTotal = currentEU + effort;

        if (newTotal > capacity + 5) {
          alert("❌ Assignment blocked: User will be OVERLOADED");
          return;
        }

        if (newTotal > capacity) {
          const confirmAssign = confirm("⚠️ Warning: Overload risk. Continue?");
          if (!confirmAssign) return;
        }

        db.collection("tasks").add({
          title: task,
          effort: effort,
          status: "assigned",
          userId: userId,
          createdAt: Date.now()
        })
        .then(() => {
          alert("✅ Task assigned");

          document.getElementById("adminTaskInput").value = "";
          document.getElementById("adminEffortInput").value = "";
        });

      });
  });
}

// ---------------- USER ----------------

// Load tasks into board
function loadTasks(userId) {
  let totalEU = 0;

  const assigned = document.getElementById("assigned");
  const inprogress = document.getElementById("inprogress");
  const completed = document.getElementById("completed");

  if (!assigned || !inprogress || !completed) return;

  assigned.innerHTML = "";
  inprogress.innerHTML = "";
  completed.innerHTML = "";

  db.collection("tasks")
    .where("userId", "==", userId)
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;

        totalEU += data.effort;

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <b>${data.title}</b><br>
          EU: ${data.effort}<br>
          <button onclick="updateStatus('${id}', '${data.status}')">Next</button>
        `;

        if (data.status === "assigned") assigned.appendChild(card);
        else if (data.status === "in-progress") inprogress.appendChild(card);
        else completed.appendChild(card);
      });

      updateWorkload(totalEU);
    });
}

// Update status
function updateStatus(id, currentStatus) {
  let newStatus =
    currentStatus === "assigned" ? "in-progress" :
    currentStatus === "in-progress" ? "completed" :
    "assigned";

  db.collection("tasks").doc(id).update({ status: newStatus })
    .then(() => loadTasks(auth.currentUser.uid));
}

// ---------------- EU ----------------

function updateWorkload(totalEU) {
  const capacity = 20;

  const totalEl = document.getElementById("totalEU");
  const statusEl = document.getElementById("status");

  if (!totalEl || !statusEl) return;

  totalEl.innerText = totalEU;

  let statusText, color;

  if (totalEU < capacity) {
    statusText = "Safe";
    color = "green";
  } else if (totalEU < capacity + 5) {
    statusText = "Warning";
    color = "orange";
  } else {
    statusText = "Overloaded";
    color = "red";
  }

  statusEl.innerText = statusText;
  statusEl.style.color = color;
}
