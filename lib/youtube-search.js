const ytsr = require('ytsr');
async function searchYoutube(input) {
  if (input && typeof input === 'object' && input.videoId) {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(input.videoId)) throw new Error('Invalid video ID');
    const url = `https://www.youtube.com/watch?v=${input.videoId}`;
    const result = await ytsr(url, { limit: 5 });
    const video = result.items.find(item => item.type === 'video' && item.id === input.videoId);
    if (!video) throw new Error('Video unavailable');
    return { ...video, videoId: video.id, image: video.thumbnail, timestamp: video.duration };
  }
  const result = await ytsr(String(input), { limit: 10, requestOptions: { headers: { 'Accept-Language': 'ar' } } });
  return { videos: result.items.filter(item => item.type === 'video').map(item => ({ ...item, image: item.thumbnail, timestamp: item.duration })) };
}
searchYoutube.search = async ({ query }) => searchYoutube(query);
module.exports = searchYoutube;
