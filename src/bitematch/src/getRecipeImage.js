
export async function getRecipeImage(query) {
  const apiKey = 'AIzaSyBDOpbz9O4zHPnvT2IQowgfJqtz2TGHrEc';
  const cx     = '5068a74cc508a4fee';

  const q = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?` +
              `key=${apiKey}&cx=${cx}` +
              `&searchType=image&num=1&q=${q}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google API ${res.status}`);
    const data = await res.json();
    const first = data.items && data.items[0];
    return first?.link || "https://via.placeholder.com/400";
  } catch (err) {
    console.error("getRecipeImage error:", err);
    return "https://via.placeholder.com/400";
  }
}
