// Error handler to prevent share-modal.js from crashing the app
window.addEventListener('error', function(e) {
  if (e.message && e.message.includes('addEventListener') && e.message.includes('null')) {
    console.warn('Prevented share-modal.js error from crashing the app:', e.message);
    e.preventDefault();
    return false;
  }
});

// Also catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  if (e.reason && e.reason.message && e.reason.message.includes('addEventListener')) {
    console.warn('Prevented share-modal.js promise rejection:', e.reason.message);
    e.preventDefault();
    return false;
  }
}); 