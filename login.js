const SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";
const adminLoginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");

adminLoginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    loginMessage.className = "";
    loginMessage.textContent = "Logging in...";

    try {
        const response = await fetch(
            `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            loginMessage.className = "login-error";
            loginMessage.textContent =
                data.error_description ||
                data.msg ||
                "Invalid email or password.";
            return;
        }

        localStorage.setItem("fh_admin_access_token", data.access_token);
        localStorage.setItem("fh_admin_refresh_token", data.refresh_token);

        loginMessage.className = "login-success";
        loginMessage.textContent = "Login successful!";

        setTimeout(function () {
            window.location.href = "admin.html";
        }, 500);

    } catch (error) {
        console.error("Login error:", error);

        loginMessage.className = "login-error";
        loginMessage.textContent =
            "Unable to connect. Please try again.";
    }
});