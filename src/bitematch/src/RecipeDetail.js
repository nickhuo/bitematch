// src/RecipeDetail.js

import React, { useEffect, useState, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import { HomeContext } from "./HomeContext";

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

const StarRating = ({ rating, onChange, disabled = false, size = "md" }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleMouseEnter = (index) => {
    if (!disabled) {
      setHoverRating(index);
    }
  };
  
  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };
  
  const handleClick = (index) => {
    if (!disabled) {
      onChange(index);
    }
  };
  
  const starSize = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }[size] || "w-6 h-6";
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          className={`${starSize} text-gray-300 focus:outline-none ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
          aria-label={`Rate ${index} of 5`}
          disabled={disabled}
        >
          <svg
            className={`w-full h-full ${
              (hoverRating || rating) >= index
                ? 'text-yellow-400'
                : 'text-gray-300'
            } transition-colors`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

const DisplayStars = ({ rating, size = "sm" }) => {
  const starSize = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }[size] || "w-4 h-4";
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((index) => (
        <svg
          key={index}
          className={`${starSize} ${
            rating >= index
              ? 'text-yellow-400'
              : 'text-gray-200'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      ))}
    </div>
  );
};

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { state } = useContext(HomeContext);

  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [video, setVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const passedImage = location.state?.imageUrl || state.recipeImage || "https://via.placeholder.com/400";

  const toggleIngredient = (idx) => {
    setCheckedIngredients((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Extract YouTube video ID from YouTube URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Search YouTube for video if not in database
  const searchYouTubeVideo = async (recipeId, recipeTitle) => {
    if (!recipeId || !recipeTitle || videoLoading) return;

    setVideoLoading(true);
    console.log(`Searching YouTube for "${recipeTitle}" recipe...`);

    try {
      const response = await fetch('http://localhost:3001/api/videos/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId, recipeTitle }),
      });

      if (!response.ok) {
        // Handle case when YouTube API is disabled
        const errorData = await response.json();
        
        if (response.status === 503 && errorData.disabled) {
          console.log('YouTube API is currently disabled');
          // Set videoLoading to false but don't throw an error
          return;
        }
        
        throw new Error(`Error searching YouTube: ${response.statusText}`);
      }

      const videoData = await response.json();
      console.log('Found video from YouTube:', videoData);
      setVideo(videoData);
    } catch (error) {
      console.error('Failed to search YouTube:', error);
    } finally {
      setVideoLoading(false);
    }
  };

  const calculateAverageRating = (reviewsArray) => {
    if (!reviewsArray || reviewsArray.length === 0) return 0;
    
    const reviewsWithRating = reviewsArray.filter(review => review.Stars);
    if (reviewsWithRating.length === 0) return 0;
    
    const sum = reviewsWithRating.reduce((acc, review) => acc + review.Stars, 0);
    return Math.round((sum / reviewsWithRating.length) * 10) / 10; // 保留一位小数
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the main recipe data and ingredients first
        const [recipeRes, ingRes, reviewRes] = await Promise.all([
          fetch(`http://localhost:3001/api/recipes/${id}`),
          fetch(`http://localhost:3001/api/ingredients/${id}`),
          fetch(`http://localhost:3001/api/reviews/${id}`)
        ]);
        
        if (!recipeRes.ok) {
          throw new Error(`Error fetching recipe: ${recipeRes.statusText}`);
        }
        
        const recipeData = await recipeRes.json();
        const ingData = await ingRes.json();
        const reviewData = await reviewRes.json();
        
        // Set the recipe and ingredients data
        setRecipe(recipeData);
        setIngredients(ingData);
        
        // Try to fetch calories, but don't fail if this endpoint has issues
        try {
          const calRes = await fetch(`http://localhost:3001/api/recipes/${id}/calories`);
          if (calRes.ok) {
            const calData = await calRes.json();
            // If calories data exists, update recipe with it
            if (calData && calData.calories) {
              setRecipe(prev => ({...prev, Calories: calData.calories}));
            }
          }
        } catch (calErr) {
          console.error("Error fetching calories:", calErr);
          // Continue with other data even if calories fetch fails
        }

        const reviewArray = Array.isArray(reviewData) ? reviewData : [];
        console.log('Processed review array:', reviewArray);
        setReviews(reviewArray);
        
        const avgRating = calculateAverageRating(reviewArray);
        setAverageRating(avgRating);

        // Fetch video data
        try {
          setVideoLoading(true);
          const videoRes = await fetch(`http://localhost:3001/api/videos/${id}`);
          
          if (!videoRes.ok && videoRes.status === 404) {
            console.log('No video found in database, will search YouTube after recipe data loads');
            // We'll search YouTube after we have recipe data
          } else {
            const videoData = await videoRes.json();
            console.log('Received video data from database:', videoData);
            setVideo(videoData);
          }
        } catch (videoErr) {
          console.error("Error fetching video:", videoErr);
        } finally {
          setVideoLoading(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setReviews([]);
      }
    };

    fetchData();
  }, [id]);

  // Search YouTube if we have recipe data but no video
  useEffect(() => {
    if (recipe && !video && !videoLoading) {
      searchYouTubeVideo(id, recipe.RecipeTitle);
    }
  }, [recipe, video, videoLoading, id]);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Get YouTube video ID if video exists
  const videoId = video ? getYouTubeVideoId(video.Link) : null;

  const submitReview = async () => {
    if (newReview.trim().length < 5) {
      return; // Button is already disabled, this is just a safeguard
    }
    
    if (newReview.length > 500) {
      alert("Your review is too long. Please keep it under 500 characters.");
      return;
    }
    
    if (newRating === 0) {
      alert("Please select a rating (1-5 stars).");
      return;
    }
    
    setSubmittingReview(true);
    
    try {
      const response = await fetch("http://localhost:3001/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeId: recipe.RecipeID,
          comments: newReview.trim(),
          stars: newRating
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      // Add the new review to the list with the current timestamp and rating
      const newReviewObj = { 
        Comments: newReview.trim(),
        Stars: newRating
      };
      
      setReviews((prevReviews) => [newReviewObj, ...prevReviews]);
      setAverageRating(calculateAverageRating([newReviewObj, ...reviews]));
  
      setNewReview("");
      setNewRating(0);
      setReviewSubmitted(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setReviewSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort reviews to show newest first
  const sortedReviews = [...reviews].sort((a, b) => {
    if (!a.ReviewTime && !b.ReviewTime) return 0;
    if (!a.ReviewTime) return -1;
    if (!b.ReviewTime) return 1;
    return new Date(b.ReviewTime) - new Date(a.ReviewTime);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Recipe Details</h1>
          <div className="w-24" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 max-w-7xl mx-auto px-4 grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-5">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            {videoLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading video...</p>
                </div>
              </div>
            ) : videoId ? (
              <div className="relative pt-[56.25%]">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={video.Title || recipe.RecipeTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <img
                src={passedImage}
                alt={recipe.RecipeTitle}
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingredients</h2>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleIngredient(idx)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    checkedIngredients.includes(idx)
                      ? "bg-orange-100 border-orange-200"
                      : "hover:bg-gray-50 border-transparent"
                  } border`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      checkedIngredients.includes(idx)
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300"
                    }`}
                  >
                    {checkedIngredients.includes(idx) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-700">
                    {ing.Quantity} {ing.IngredientName_Recipe}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-7">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.RecipeTitle}</h1>
            
            <div className="flex items-center mb-3">
              <DisplayStars rating={averageRating} size="md" />
              <span className="ml-2 text-lg text-gray-700 font-medium">
                {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                {reviews.length > 0 && averageRating > 0 && (
                  <span className="text-sm text-gray-500 ml-1">
                    ({reviews.filter(r => r.Stars).length} {reviews.filter(r => r.Stars).length === 1 ? 'rating' : 'ratings'})
                  </span>
                )}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{recipe.Calories ? `${recipe.Calories} Calories` : "Calories not available"}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preparation Steps</h2>
            <div className="space-y-4">
              {(Array.isArray(recipe.Directions)
                ? recipe.Directions
                : JSON.parse(recipe.Directions || "[]"))
                .map((step, idx) => (
                <div key={idx} className="flex group">
                  <div className="mr-4 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold border-2 border-gray-200">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-orange-200">
                    <p className="text-gray-700">{step}</p>
                    {step.toLowerCase().includes("minutes") && (
                      <div className="mt-2 text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {step.match(/\d+\s*minutes/)?.[0]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reviews</h2>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                sortedReviews.map((review, idx) => (
                  <div key={idx} className="border-l-4 border-orange-400 bg-white p-4 rounded-r-lg shadow-sm">
                    {review.Stars > 0 && (
                      <div className="mb-2">
                        <DisplayStars rating={review.Stars} size="sm" />
                      </div>
                    )}
                    <div className="text-gray-700 mb-2">{review.Comments}</div>
                    <div className="text-xs text-gray-500">
                      {formatRelativeTime(review.ReviewTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Leave a Review</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rating</label>
              <div className="flex items-center mb-1">
                <StarRating 
                  rating={newRating} 
                  onChange={setNewRating} 
                  disabled={submittingReview}
                  size="lg"
                />
                <span className="ml-2 text-sm text-gray-500">
                  {newRating > 0 ? `${newRating} star${newRating !== 1 ? 's' : ''}` : 'Select a rating'}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Your Review</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                rows="4"
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Share your experience with this recipe..."
                disabled={submittingReview}
              ></textarea>
              <div className="text-right text-xs text-gray-500 mt-1">
                {newReview.length} / 500 characters (minimum 5)
              </div>
            </div>

            {reviewSubmitted && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Your review was submitted successfully!
              </div>
            )}

            <button
              onClick={submitReview}
              disabled={newReview.trim().length < 5 || newRating === 0 || submittingReview}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-colors ${
                newReview.trim().length < 5 || newRating === 0 || submittingReview
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg'
              }`}
            >
              {submittingReview ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
