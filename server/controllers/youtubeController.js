const { Innertube, UniversalCache } = require('youtubei.js');

let yt;
let ytClient;

// Initialize YouTube client
async function getYouTubeClient() {
  if (!yt) {
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
  }
  return yt;
}

exports.searchSongs = async (req, res) => {
  try {
    const { query, offset = 0 } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const youtube = await getYouTubeClient();
    
    // Search for music videos
    const search = await youtube.search(query, {
      type: 'video',
      duration: 'any',
    });

    const results = search.results.slice(0, limit).map((item) => ({
      id: item.id,
      title: item.title.text,
      artist: item.author?.name || 'Unknown Artist',
      duration: item.duration?.seconds || 0,
      thumbnail: item.thumbnails?.[0]?.url,
      type: 'youtube',
    }));

    res.json({
      songs: results,
      total: results.length,
      offset: parseInt(offset),
      limit,
    });
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
    
    // Get the best audio stream
    const audioStream = info.streaming_data?.adaptive_formats.find(
      (format) => format.mime_type.includes('audio')
    );

    if (!audioStream) {
      return res.status(404).json({ error: 'No audio stream found' });
    }

    // Get the deciphered URL
    const streamUrl = audioStream.decipher(yt.session.player);

    res.json({ 
      url: streamUrl,
      title: info.basic_info.title,
      artist: info.basic_info.author,
      duration: info.basic_info.duration,
      thumbnail: info.basic_info.thumbnail?.[0]?.url,
    });
  } catch (err) {
    console.error('YouTube stream error:', err);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const youtube = await getYouTubeClient();
    
    // Get trending music
    const feed = await youtube.getTrending();
    const musicVideos = feed.videos?.slice(0, 20) || [];

    const results = musicVideos.map((item) => ({
      id: item.id,
      title: item.title.text,
      artist: item.author?.name || 'Unknown Artist',
      duration: item.duration?.seconds || 0,
      thumbnail: item.thumbnails?.[0]?.url,
      type: 'youtube',
    }));

    res.json({
      songs: results,
      total: results.length,
    });
  } catch (err) {
    console.error('YouTube trending error:', err);
    res.status(500).json({ error: 'Failed to get trending music' });
  }
};