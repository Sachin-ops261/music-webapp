const { Innertube } = require('youtubei.js');

// Module-level singleton — survives warm Vercel invocations
let yt = null;
let initializingPromise = null;

async function getYouTubeClient() {
  // Return cached instance immediately if available
  if (yt) return yt;
  
  // If already initializing, wait for that promise
  if (initializingPromise) return initializingPromise;
  
  initializingPromise = Innertube.create({
    generate_session_locally: true,
    fetch: (input, init) => {
      // Add a timeout to prevent hanging on Vercel
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
    },
  }).then((instance) => {
    yt = instance;
    initializingPromise = null;
    return yt;
  }).catch((err) => {
    initializingPromise = null;
    yt = null;
    throw err;
  });

  return initializingPromise;
}

function mapVideo(item) {
  return {
    id: item.id || item.video_id,
    title: item.title?.text || item.title || 'Unknown Title',
    artist: item.author?.name || item.channel?.name || 'Unknown Artist',
    duration: item.duration?.seconds || 0,
    thumbnail: item.thumbnails?.[0]?.url || '',
    type: 'youtube',
  };
}

exports.searchSongs = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    const youtube = await getYouTubeClient();
    const search = await youtube.search(query, { type: 'video' });
    const results = (search.results || [])
      .filter(item => item.type === 'Video')
      .slice(0, 20)
      .map(mapVideo);

    res.json({ songs: results });
  } catch (err) {
    console.error('YouTube search error:', err.message);
    res.status(500).json({ error: 'Search failed: ' + err.message });
  }
};

exports.getStreamUrl = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Video ID is required' });

    const youtube = await getYouTubeClient();
    const info = await youtube.getInfo(id);

    // Try multiple strategies to get audio format
    let format = null;
    const adaptive = info.streaming_data?.adaptive_formats || [];
    const audioFormats = adaptive
      .filter(f => f.has_audio && !f.has_video)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (audioFormats.length > 0) {
      format = audioFormats[0];
    } else {
      try {
        format = info.chooseFormat({ type: 'audio', quality: 'best' });
      } catch (e) {
        const allFormats = info.streaming_data?.formats || [];
        format = allFormats[0] || null;
      }
    }

    if (!format) {
      return res.status(404).json({ error: 'No audio stream found' });
    }

    // Try all decipher strategies
    let streamUrl = null;
    const strategies = [
      () => format.decipher(youtube.session.player),
      () => format.decipher(),
      () => format.url,
    ];

    for (const strategy of strategies) {
      try {
        streamUrl = strategy();
        if (streamUrl) break;
      } catch (e) {
        continue;
      }
    }

    if (!streamUrl) {
      return res.status(500).json({ error: 'Could not decipher stream URL' });
    }

    res.json({
      url: streamUrl,
      title: info.basic_info?.title || 'Unknown Title',
      artist: info.basic_info?.author || 'Unknown Artist',
      duration: info.basic_info?.duration || 0,
      thumbnail: info.basic_info?.thumbnail?.[0]?.url || '',
    });
  } catch (err) {
    console.error('YouTube stream error:', err.message);
    res.status(500).json({ error: 'Stream failed: ' + err.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const youtube = await getYouTubeClient();
    const search = await youtube.search('top music 2025', { type: 'video' });
    const results = (search.results || [])
      .filter(item => item.type === 'Video')
      .slice(0, 20)
      .map(mapVideo);

    res.json({ songs: results });
  } catch (err) {
    console.error('YouTube trending error:', err.message);
    res.status(500).json({ error: 'Trending failed: ' + err.message });
  }
};