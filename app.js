console.log("App started");

// ---------------- AUTH ----------------

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

      console.log("User created");
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      console.log("Logged in");
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function logout() {
  auth.signOut();
}

// Detect logged-in user
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("userInfo").innerText = "Logged in as: " + user.email;
    loadTasks(user.uid);
  } else {
    document.getElementById("userInfo").innerText = "Not logged in";
  }
});


// ---------------- TASK SYSTEM ----------------

// Add Task (assigned to current user)
function addTask() {
  const user = auth.currentUser;

  if (!user) {
    alert("Login first");
    return;
  }

  const task = document.getElementById("taskInput").value;
  const effort = document.getElementById("effortInput").value;

  db.collection("tasks").add({
    title: task,
    effort: Number(effort),
    status: "assigned",
    userId: user.uid,
    createdAt: Date.now()
  })
  .then(() => {
    console.log("Task added");
    loadTasks(user.uid);
  });
}


// Load ONLY current user’s tasks
function loadTasks(userId) {
  const taskList = document.getElementById("taskList");
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


// Delete
function deleteTask(id) {
  db.collection("tasks").doc(id).delete()
    .then(() => {
      loadTasks(auth.currentUser.uid);
    });
}


// Status update
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

  document.getElementById("totalEU").innerText = totalEU;

  let statusText;

  if (totalEU < capacity) statusText = "Safe";
  else if (totalEU < capacity + 5) statusText = "Warning";
  else statusText = "Overloaded";

  document.getElementById("status").innerText = statusText;
}
