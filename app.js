console.log("App started");

// ---------------- AUTH ----------------

// SIGN UP
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Save user in Firestore
      db.collection("users").doc(user.uid).set({
        email: user.email,
        capacity: 20
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
      window.location.href = "dashboard.html";
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


// ---------------- AUTH STATE HANDLER ----------------

auth.onAuthStateChanged((user) => {
  const currentPage = window.location.pathname;

  // NOT logged in → redirect to login
  if (!user && currentPage.includes("dashboard.html")) {
    window.location.href = "login.html";
  }

  // Logged in → redirect to dashboard
  if (user && currentPage.includes("login.html")) {
    window.location.href = "dashboard.html";
  }

  // If logged in on dashboard → load data
  if (user && currentPage.includes("dashboard.html")) {
    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      userInfo.innerText = "Logged in as: " + user.email;
    }

    loadTasks(user.uid);
  }
});


// ---------------- TASK SYSTEM ----------------

// ADD TASK
function addTask() {
  const user = auth.currentUser;

  if (!user) {
    alert("Login first");
    return;
  }

  const task = document.getElementById("taskInput").value;
  const effort = document.getElementById("effortInput").value;

  if (!task || !effort) {
    alert("Enter task and effort");
    return;
  }

  db.collection("tasks").add({
    title: task,
    effort: Number(effort),
    status: "assigned",
    userId: user.uid,
    createdAt: Date.now()
  })
  .then(() => {
    console.log("Task added");

    document.getElementById("taskInput").value = "";
    document.getElementById("effortInput").value = "";

    loadTasks(user.uid);
  });
}


// LOAD TASKS (ONLY USER'S TASKS)
function loadTasks(userId) {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = "";

  let totalEU = 0;

  db.collection("tasks")
    .where("userId", "==", userId)
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;

        totalEU += data.effort;

        const li = document.createElement("li");

        li.innerHTML = `
          ${data.title} (EU: ${data.effort}) [${data.status}]
          <button onclick="updateStatus('${id}', '${data.status}')">Next</button>
          <button onclick="deleteTask('${id}')">Delete</button>
        `;

        taskList.appendChild(li);
      });

      updateWorkload(totalEU);
    });
}


// DELETE TASK
function deleteTask(id) {
  db.collection("tasks").doc(id).delete()
    .then(() => {
      loadTasks(auth.currentUser.uid);
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
