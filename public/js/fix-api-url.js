document.addEventListener("DOMContentLoaded", () => {
  if (!window.CONFIG) {
    console.error("Global configuration not loaded. Unable to fix API_BASE_URL.");
    return;
  }

  if (typeof API_BASE_URL !== "undefined") {
    console.warn(
      "Global API_BASE_URL variable detected. Resolving potential conflict."
    );
    try {
      window.API_BASE_URL = undefined;
      delete window.API_BASE_URL;
    } catch (error) {
      console.warn("Unable to delete global API_BASE_URL variable:", error);
    }
    console.info(
      "Ensure all code uses window.CONFIG.API_BASE_URL instead of the global API_BASE_URL."
    );
  }

  console.log("API URL fix script executed.");
});
