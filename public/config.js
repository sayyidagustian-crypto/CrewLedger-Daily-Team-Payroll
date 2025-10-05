
// ================================================================
// APPLICATION CONTROL PANEL - EDITABLE FROM GOOGLE AI STUDIO
// ================================================================
// This file serves as the central settings hub for your application.
// You can change the values below to enable or disable certain
// features without needing to re-release the app on the Play Store.

window.appConfig = {
  // --- ADVERTISEMENT SETTINGS (ADMOB) ---
  // Change 'showAds' to 'true' to display ads in the Android app.
  // Change to 'false' to hide them.
  ads: {
    showAds: false, // Values: true or false
    // Note: The actual Ad IDs will be configured on the Android side
    // for better security.
  },

  // --- FEATURE FLAGS ---
  // Example: You can add a toggle to enable a new feature
  // that is currently in a testing phase.
  features: {
    enableExperimentalFeature: false, // Values: true or false
  },

  // --- GLOBAL NOTICE ---
  // You can display an important message at the top of the app
  // by filling in the text below. Leave it empty if there's no message.
  // Example: "Maintenance will occur on Saturday at 10 PM."
  globalNotice: {
    show: false,
    message: "",
  }
};
