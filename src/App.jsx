import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import CommentSentimentAnalyzer from './assets/components/CommentSentimentAnalyzer';

// import SentimentAnalyzer from './SentimentAnalyzer';

// Helper function to extract video ID (keeping the existing function)
// In your main App.jsx or in your highest-level component
useEffect(() => {
  document.title = "SentiTube";
}, []);
const extractVideoId = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    } else if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
};

// Reusable StatCard component (keeping the existing component)
const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-full bg-blue-500 text-white">
        {Icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold">{value?.toLocaleString() || '0'}</h3>
      </div>
    </div>
  </div>
);

const App = () => {
  const [stats, setStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoDetails, setVideoDetails] = useState(null);

  // Replace with your actual API key
  const API_KEY = 'AIzaSyCk_lsDnFZedOi6ZkNuIIFdsDZ9hHZyEA8';

  const fetchComments = async (videoId) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/commentThreads`,
        {
          params: {
            part: 'snippet',
            videoId: videoId,
            maxResults: 15,
            order: 'relevance',
            key: API_KEY
          }
        }
      );

      const formattedComments = response.data.items.map(item => ({
        id: item.id,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: new Date(item.snippet.topLevelComment.snippet.publishedAt),
        authorProfileImg: item.snippet.topLevelComment.snippet.authorProfileImageUrl
      }));

      setComments(formattedComments);
      console.log(response.data.items);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Error fetching comments. ' + (err.message || 'Unknown error'));
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    const extractedId = extractVideoId(videoUrl);
    if (extractedId) {
      setVideoId(extractedId);
      setError(null);
    } else {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
    }
  };

  useEffect(() => {
    if (!videoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch video statistics
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos`, {
          params: {
            part: 'statistics,snippet',
            id: videoId,
            key: API_KEY
          }
        }
        );

        if (response.data.items.length === 0) {
          throw new Error('Video not found');
        }

        const videoData = response.data.items[0];
        console.log(videoData);

        // Extract relevant statistics
        setStats({
          viewCount: parseInt(videoData.statistics.viewCount),
          likeCount: parseInt(videoData.statistics.likeCount),
          // YouTube API no longer provides dislike counts, using estimated value
          dislikeCount: Math.floor(parseInt(videoData.statistics.likeCount) * 0.05), // Estimated 5% of likes
          commentCount: parseInt(videoData.statistics.commentCount)
        });

        await fetchComments(videoId);

        setError(null);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('API Key error. Please check your YouTube API key.');
        } else if (err.response?.status === 404) {
          setError('Video not found. Please check the URL.');
        } else {
          setError('Error fetching video data: ' + (err.message || 'Unknown error'));
        }
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId, API_KEY]);

  const chartData = [
    { name: 'Likes', value: stats?.likeCount || 0, color: '#22c55e' },
    { name: 'Dislikes', value: stats?.dislikeCount || 0, color: '#ef4444' }
  ];

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Existing JSX structure remains the same */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">YouTube Video Statistics</h1>

        {/* URL Input Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Enter YouTube Video URL</h2>
            <form onSubmit={handleUrlSubmit} className="flex flex-col md:flex-row gap-4">
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Fetch Stats
              </button>
            </form>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Rest of the existing JSX structure remains the same */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Existing StatCard components remain the same */}
              <StatCard
                title="Views"
                value={stats.viewCount}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>}
              />
              <StatCard
                title="Likes"
                value={stats.likeCount}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>}
              />
              <StatCard
                title="Dislikes"
                value={stats.dislikeCount}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5 10v-4.5a2.5 2.5 0 00-5 0v4.5" />
                </svg>}
              />
              <StatCard
                title="Comments"
                value={stats.commentCount}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>}
              />
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Comments</h2>
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className="border-b border-gray-100 pb-4">
                        <div className="flex items-start space-x-3">
                          <img
                            src={comment.authorProfileImg}
                            alt={comment.author}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900">{comment.author}</h3>
                              <span className="text-sm text-gray-500">
                                {comment.publishedAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-600">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No comments found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Chart and Engagement Rate sections remain the same */}
            <div className="bg-white rounded-lg shadow-md mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Likes vs Dislikes</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={(entry) => entry.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Engagement Rate</h2>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {((((stats.likeCount || 0) + (stats.dislikeCount || 0)) / (stats.viewCount || 1)) * 100).toFixed(2)}%
                  </p>
                  <p className="text-gray-500">Total engagement rate based on likes and dislikes</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
      {/* Pass the comments to CommentSentimentAnalyzer */}
      {comments.length > 0 && (
        <CommentSentimentAnalyzer comments={comments} />
      )}


    </div>
  );
};

export default App;