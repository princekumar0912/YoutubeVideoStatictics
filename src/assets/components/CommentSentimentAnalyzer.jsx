import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CommentSentimentAnalyzer = ({ comments }) => {
  const [analyzedComments, setAnalyzedComments] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [sentimentStats, setSentimentStats] = useState({
    agree: 0,
    disagree: 0,
    neutral: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COLORS = {
    agree: '#4CAF50',
    disagree: '#F44336',
    neutral: '#9E9E9E'
  };

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI('GEMINI_API_KEY'); // Make sure to replace with actual API key
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const analyzeSentiment = async (comment) => {
    try {
      const prompt = `Analyze this YouTube comment and determine if the commenter agrees, disagrees, or is neutral about the video content. Return ONLY a JSON object in this exact format: {"sentiment": "agree"|"disagree"|"neutral", "analysis": "brief explanation"}. Comment: "${comment}"`;

      console.log('Analyzing comment:', comment); // Debug log

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = await response.text();

      console.log('Gemini response:', responseText); // Debug log

      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(responseText);

        // Validate the response format
        if (!parsedResponse.sentiment || !parsedResponse.analysis) {
          console.error('Invalid response format:', parsedResponse);
          return { sentiment: 'neutral', analysis: 'Invalid response format' };
        }

        // Normalize sentiment value
        const sentiment = parsedResponse.sentiment.toLowerCase();
        if (!['agree', 'disagree', 'neutral'].includes(sentiment)) {
          return { sentiment: 'neutral', analysis: parsedResponse.analysis };
        }

        return parsedResponse;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError, 'Response:', responseText);
        return { sentiment: 'neutral', analysis: 'Error parsing response' };
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return { sentiment: 'neutral', analysis: 'Error in analysis' };
    }
  };

  useEffect(() => {
    const analyzeComments = async () => {
      if (!comments || comments.length === 0) {
        console.log('No comments to analyze');
        return;
      }

      console.log('Starting analysis of', comments.length, 'comments'); // Debug log
      setLoading(true);
      setError(null);

      try {
        const analyzedResults = [];
        for (const comment of comments) {
          // Make sure we have the required comment properties
          if (!comment.text) {
            console.error('Comment missing text property:', comment);
            continue;
          }

          const analysis = await analyzeSentiment(comment.text);
          analyzedResults.push({
            ...comment,
            sentiment: analysis.sentiment,
            analysis: analysis.analysis
          });
        }

        console.log('Analysis complete:', analyzedResults); // Debug log
        setAnalyzedComments(analyzedResults);

        // Calculate statistics
        if (analyzedResults.length > 0) {
          const total = analyzedResults.length;
          const stats = analyzedResults.reduce((acc, comment) => {
            acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1;
            return acc;
          }, { agree: 0, disagree: 0, neutral: 0 });

          const newSentimentStats = {
            agree: Math.round((stats.agree / total) * 100) || 0,
            disagree: Math.round((stats.disagree / total) * 100) || 0,
            neutral: Math.round((stats.neutral / total) * 100) || 0
          };

          console.log('Calculated stats:', newSentimentStats); // Debug log
          setSentimentStats(newSentimentStats);

          // Calculate monthly stats
          const monthlyData = analyzedResults.reduce((acc, comment) => {
            const month = new Date(comment.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!acc[month]) {
              acc[month] = { month, agree: 0, disagree: 0, neutral: 0 };
            }
            acc[month][comment.sentiment]++;
            return acc;
          }, {});

          const newMonthlyStats = Object.values(monthlyData);
          console.log('Monthly stats:', newMonthlyStats); // Debug log
          setMonthlyStats(newMonthlyStats);
        }
      } catch (error) {
        console.error('Error in analysis:', error);
        setError('Error analyzing comments: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    analyzeComments();
  }, [comments]);

  // Rest of the component remains the same...
  // (Keep the loading, error, and return JSX sections as they were)

  return (
    <div className="space-y-8">
      {/* Debug information */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <p>Total Comments: {comments?.length || 0}</p>
        <p>Analyzed Comments: {analyzedComments.length}</p>
        <p>Sentiment Stats: {JSON.stringify(sentimentStats)}</p>
      </div>

      {/* Original visualization components... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Overall Sentiment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Agree', value: sentimentStats.agree },
                    { name: 'Disagree', value: sentimentStats.disagree },
                    { name: 'Neutral', value: sentimentStats.neutral }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  <Cell fill={COLORS.agree} />
                  <Cell fill={COLORS.disagree} />
                  <Cell fill={COLORS.neutral} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Comment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="agree" fill={COLORS.agree} stackId="a" name="Agree" />
                <Bar dataKey="disagree" fill={COLORS.disagree} stackId="a" name="Disagree" />
                <Bar dataKey="neutral" fill={COLORS.neutral} stackId="a" name="Neutral" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analyzed Comments List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Analyzed Comments</h3>
        <div className="space-y-4">
          {analyzedComments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4">
              <div className="flex items-start space-x-4">
                <img
                  src={comment.authorProfileImage || '/placeholder-avatar.png'}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{comment.author}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{comment.text}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${comment.sentiment === 'agree' ? 'bg-green-100 text-green-800' :
                      comment.sentiment === 'disagree' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {comment.sentiment}
                    </span>
                    <span className="text-sm text-gray-500">{comment.analysis}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommentSentimentAnalyzer;