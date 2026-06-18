const { Innertube } = require('youtubei.js');

// Global cache for serverless - persists across invocations
let yt;
let ytPromise;

async function getYouTubeClient() {
  // Return existing instance if available
  if (yt) {
    return yt;
  }
  
  // Prevent race conditions - only create one promise
  if (!ytPromise) {
    ytPromise = Innertube.create({
      generate_session_locally: true,
    }).then(instance => {
      yt = instance;
      ytPromise = null; // Clear promise after creation
      return yt;
    });
  }
  
  return ytPromise;
}

exports.searchSongs = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const youtube = await getYouTubeClient();
    const search = await youtube.search(query, { type: 'video' });

    const results = (search.results || [])
      .filter(item => item.type === 'Video')
      .map((item) => ({
        id: item.id,
        title: item.title?.text || 'Unknown Title',
        artist: item.author?.name || 'Unknown Artist',
        duration: item.duration?.seconds || 0,
        thumbnail: item.thumbnails?.[0]?.url,
        type: 'youtube',
      }));

    res.json({ songs: results });
  } catch (err) {
    console.error('YouTube search error:', err);
    res.status(500).json({ error: 'Failed to search YouTube Music' });
  }
};

exports.getStreamUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const youtube = await getYouTubeClient();
    const info = await youtube.getInfo(id);
    
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });

    if (!format) {
      return res.status(404).json({ error: 'No audio stream found' });
    }

    const streamUrl = format.decipher ? format.decipher(youtube.session.player) : format.url;

    res.json({ 
      url: streamUrl,
      title: info.basic_info.title,
      artist: info.basic_info.author,
      duration: info.basic_info.duration,
      thumbnail: info.basic_info.thumbnail?.[0]?.url || info.basic_info.thumbnail?.[1]?.url,
    });
  } catch (err) {
    console.error('YouTube stream error:', err);
    res.status(500).json({ error: 'Failed to get stream URL: ' + err.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const youtube = await getYouTubeClient();
    const search = await youtube.search('popular music 2024', { type: 'video' });
    
    const results = (search.results || [])
      .filter(item => item.type === 'Video')
      .slice(0, 20)
      .map((item) => ({
        id: item.id,
        title: item.title?.text || 'Unknown Title',
        artist: item.author?.name || 'Unknown Artist',
        duration: item.duration?.seconds || 0,
        thumbnail: item.thumbnails?.[0]?.url,
        type: 'youtube',
      }));

    res.json({ songs: results });
  } catch (err) {
    console.error('YouTube trending error:', err);
    res.status(500).json({ error: 'Failed to get trending music' });
  }
};