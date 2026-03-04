document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Activity title
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;
        activityCard.appendChild(titleEl);

        // Activity description
        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = details.description;
        activityCard.appendChild(descriptionEl);

        // Activity schedule
        const scheduleEl = document.createElement("p");
        const scheduleStrong = document.createElement("strong");
        scheduleStrong.textContent = "Schedule:";
        scheduleEl.appendChild(scheduleStrong);
        scheduleEl.append(" " + details.schedule);
        activityCard.appendChild(scheduleEl);

        // Availability
        const availabilityEl = document.createElement("p");
        const availabilityStrong = document.createElement("strong");
        availabilityStrong.textContent = "Availability:";
        availabilityEl.appendChild(availabilityStrong);
        availabilityEl.append(` ${spotsLeft} spots left`);
        activityCard.appendChild(availabilityEl);

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        const participantsTitleStrong = document.createElement("strong");
        participantsTitleStrong.textContent = "Participants";
        participantsTitle.appendChild(participantsTitleStrong);
        participantsSection.appendChild(participantsTitle);

        if (details.participants.length > 0) {
          const participantsListEl = document.createElement("ul");
          participantsListEl.className = "participants-list";

          details.participants.forEach((participant) => {
            const itemEl = document.createElement("li");
            itemEl.className = "participant-item";

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = participant;
            itemEl.appendChild(emailSpan);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove-btn";
            removeButton.dataset.activity = name;
            removeButton.dataset.email = participant;
            removeButton.setAttribute(
              "aria-label",
              `Unregister ${participant} from ${name}`
            );
            removeButton.title = "Unregister participant";
            removeButton.textContent = "🗑️";

            itemEl.appendChild(removeButton);
            participantsListEl.appendChild(itemEl);
          });

          participantsSection.appendChild(participantsListEl);
        } else {
          const noParticipantsEl = document.createElement("p");
          noParticipantsEl.className = "no-participants";
          noParticipantsEl.textContent = "No one has signed up yet.";
          participantsSection.appendChild(noParticipantsEl);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const removeButton = target.closest(".participant-remove-btn");
    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    if (!activity || !email) {
      return;
    }

    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    } finally {
      removeButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
