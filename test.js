const isValidUrl = (url) => {
  if (!url || url.includes('YOUR_DATABASE_URL')) return false;
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};
console.log(isValidUrl("https://lifestyle-9abea-default-rtdb.firebaseio.com"));
