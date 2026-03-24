console.log("App started");

// ---------------- GLOBAL ----------------
let currentUserRole = "user";

// ---------------- AUTH ----------------

// SIGNUP
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

// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      // Redirect handled automatically
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}

// LOGOUT
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ---------------- AUTH STATE (CORE LOGIC) ----------------

auth.onAuthStateChanged((user) => {
  const page = window.location.pathname;

  // NOT logged in → redirect
  if (!user) {
    if (!page.includes("login.html") && !page.includes("index.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  // Get role
  db.collection("users").doc(user.uid).get().then((doc) => {
    currentUserRole = doc.data().role;

    // Redirect based on role
    if (page.includes("login.html") || page.includes("index.html")) {
      if (currentUserRole === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "user.html";
      }
      return;
    }

    // ADMIN PAGE
    if (page.includes("admin.html")) {
      loadUsers();
    }

    // USER PAGE
    if (page.includes("user.html")) {
      loadTasks(user.uid);
    }
  });
});


// ---------------- ADMIN FUNCTIONS ----------------

// LOAD USERS INTO DROPDOWN
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


// ASSIGN TASK
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

  // STEP 1: Get user capacity
  db.collection("users").doc(userId).get().then((userDoc) => {
    const capacity = userDoc.data().capacity;

    // STEP 2: Get current workload
    db.collection("tasks")
      .where("userId", "==", userId)
      .get()
      .then((snapshot) => {

        let currentEU = 0;

        snapshot.forEach((doc) => {
          currentEU += doc.data().effort;
        });

        const newTotal = currentEU + effort;

        // STEP 3: DECISION LOGIC
        if (newTotal > capacity + 5) {
          alert("❌ Assignment blocked: User will be OVERLOADED");
          return;
        }

        if (newTotal > capacity) {
          const confirmAssign = confirm("⚠️ Warning: User may be overloaded. Continue?");
          if (!confirmAssign) return;
        }

        // STEP 4: Assign task
        db.collection("tasks").add({
          title: task,
          effort: effort,
          status: "assigned",
          userId: userId,
          createdAt: Date.now()
        })
        .then(() => {
          alert("✅ Task assigned successfully");

          document.getElementById("adminTaskInput").value = "";
          document.getElementById("adminEffortInput").value = "";
        });

      });
  });
}

// ---------------- USER FUNCTIONS ----------------

// LOAD TASKS INTO COLUMNS
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

        if (data.status === "assigned") {
          assigned.appendChild(card);
        } else if (data.status === "in-progress") {
          inprogress.appendChild(card);
        } else {
          completed.appendChild(card);
        }
      });

      updateWorkload(totalEU);
    });
}


// UPDATE STATUS
function updateStatus(id, currentStatus) {
  let newStatus =
    currentStatus === "assigned" ? "in-progress" :
    currentStatus === "in-progress" ? "completed" :
    "assigned";

  db.collection("tasks").doc(id).update({
    status: newStatus
  })
  .then(() => {
    loadTasks(auth.currentUser.uid);
  });
}


// ---------------- EU CALCULATION ----------------

function updateWorkload(totalEU) {
  const capacity = 20;

  const totalEl = document.getElementById("totalEU");
  const statusEl = document.getElementById("status");

  if (!totalEl || !statusEl) return;

  totalEl.innerText = totalEU;

  let statusText;

  if (totalEU < capacity) statusText = "Safe";
  else if (totalEU < capacity + 5) statusText = "Warning";
  else statusText = "Overloaded";

  statusEl.innerText = statusText;
}
