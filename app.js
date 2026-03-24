console.log("App started");

// Capacity limit (can change later)
const capacity = 20;

// Add Task
function addTask() {
  const task = document.getElementById("taskInput").value;
  const effort = document.getElementById("effortInput").value;

  if (!task || !effort) {
    alert("Enter task and effort");
    return;
  }

  db.collection("tasks").add({
    title: task,
    effort: Number(effort),
    createdAt: Date.now()
  })
  .then(() => {
    console.log("Task added");
    loadTasks();
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}

// Load Tasks + Calculate EU
function loadTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  let totalEU = 0;

  db.collection("tasks").get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {
        const data = doc.data();

        totalEU += data.effort;

        const li = document.createElement("li");
        li.textContent = `${data.title} (EU: ${data.effort})`;

        taskList.appendChild(li);
      });

      // Update UI
      document.getElementById("totalEU").innerText = totalEU;

      if (totalEU < capacity) {
        document.getElementById("status").innerText = "Safe";
      } else if (totalEU >= capacity && totalEU < capacity + 5) {
        document.getElementById("status").innerText = "Warning";
      } else {
        document.getElementById("status").innerText = "Overloaded";
      }

    })
    .catch((error) => {
      console.error("Error loading tasks:", error);
    });
}

// Load tasks on page start
loadTasks();
