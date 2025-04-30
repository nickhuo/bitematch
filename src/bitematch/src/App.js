// src/App.js

import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import RecipeDetail from "./RecipeDetail";
import { getRecipeImage } from "./getRecipeImage";
import SignInForm from "./SignInForm";
import "./App.css";
import { HomeContext } from "./HomeContext";


const getRecipeEmoji = (title) => {
  const lowerTitle = title.toLowerCase();
    
  if (lowerTitle.includes('burger') || lowerTitle.includes('hamburg')) return '🍔';
  if (lowerTitle.includes('pizza')) return '🍕';
  if (lowerTitle.includes('pasta') || lowerTitle.includes('spaghetti') || lowerTitle.includes('noodle')) return '🍝';
  if (lowerTitle.includes('taco') || lowerTitle.includes('burrito')) return '🌮';
  if (lowerTitle.includes('sushi') || lowerTitle.includes('roll')) return '🍣';
  if (lowerTitle.includes('soup') || lowerTitle.includes('stew')) return '🍲';
  if (lowerTitle.includes('salad')) return '🥗';
  if (lowerTitle.includes('chicken')) return '🍗';
  if (lowerTitle.includes('meat') || lowerTitle.includes('steak') || lowerTitle.includes('beef')) return '🥩';
  if (lowerTitle.includes('fish') || lowerTitle.includes('salmon')) return '🐟';
  if (lowerTitle.includes('cake')) return '🍰';
  if (lowerTitle.includes('chocolate')) return '🍫';
  if (lowerTitle.includes('ice cream')) return '🍦';
  if (lowerTitle.includes('cookie')) return '🍪';
  if (lowerTitle.includes('bread') || lowerTitle.includes('toast')) return '🍞';
  if (lowerTitle.includes('rice')) return '🍚';
  if (lowerTitle.includes('egg')) return '🥚';
  if (lowerTitle.includes('cheese')) return '🧀';
  if (lowerTitle.includes('lemon')) return '🍋';
  if (lowerTitle.includes('apple')) return '🍎';
  if (lowerTitle.includes('banana')) return '🍌';
  if (lowerTitle.includes('orange')) return '🍊';
  if (lowerTitle.includes('potato')) return '🥔';
  if (lowerTitle.includes('tomato')) return '🍅';
  if (lowerTitle.includes('carrot')) return '🥕';
  if (lowerTitle.includes('corn')) return '🌽';
  if (lowerTitle.includes('breakfast')) return '🍳';
  if (lowerTitle.includes('lunch') || lowerTitle.includes('dinner')) return '🍽️';
  if (lowerTitle.includes('fruit')) return '🍑';
  if (lowerTitle.includes('veggie') || lowerTitle.includes('vegetable')) return '🥦';
  if (lowerTitle.includes('pie')) return '🥧';
  if (lowerTitle.includes('sandwich')) return '🥪';
  if (lowerTitle.includes('hot dog')) return '🌭';
  if (lowerTitle.includes('pea')) return '🫛';
  if (lowerTitle.includes('casserole')) return '🥘';
  if (lowerTitle.includes('lentil')) return '🫘';
  if (lowerTitle.includes('herb')) return '🌿';
  if (lowerTitle.includes('spice')) return '🧂';
  if (lowerTitle.includes('coconut')) return '🥥';
  
  return '🍴';
};

function HomePage() {
  const { state, setState } = useContext(HomeContext);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const navigate = useNavigate();
  const {
    randomRecipe,
    recipeIngredients,
    recipeImage,
    loading,
    imageSearchOn,
    ingredientInput,
    ingredientList,
    searchResults,
    searchPerformed,
    selectedRecipe,
    selectedRecipeIngredients,
    searchIndex,
    calories
  } = state;

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredientList.includes(trimmed)) {
      setState(prev => ({
        ...prev,
        ingredientList: [...prev.ingredientList, trimmed],
        ingredientInput: ""
      }));
    }
  };

  const loadMore = () => {
    // Show a different set of 10 recipes
    const currentEndIndex = displayCount;
    const totalResults = searchResults.length;
    
    if (currentEndIndex + 10 <= totalResults) {
      setDisplayCount(currentEndIndex + 10);
    } else {
      setDisplayCount(10);
    }
  };

  const removeIngredient = (index) => {
    setState(prev => {
      const updated = [...prev.ingredientList];
      updated.splice(index, 1);
      return { ...prev, ingredientList: updated };
    });
  };

  const handleSearch = async () => {
    setState(prev => ({ ...prev, searchPerformed: true }));
    setDisplayCount(10);
    try {
      const response = await fetch("http://localhost:3001/api/search/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientList })
      });
      const data = await response.json();
      setState(prev => ({
        ...prev,
        searchResults: data,
        searchIndex: 0
      }));

      if (data.length > 0) {
        handleSelectRecipe(data[0].RecipeID, data[0].RecipeTitle);
      } else {
        setState(prev => ({
          ...prev,
          selectedRecipe: null,
          selectedRecipeIngredients: []
        }));
      }
    } catch (err) {
      console.error("Search failed:", err);
      setState(prev => ({ ...prev, searchResults: [] }));
    }
  };

  const handleSelectRecipe = async (recipeId, titleOverride = null) => {
    try {
      const [recipeRes, ingredientsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/recipes/${recipeId}`),
        fetch(`http://localhost:3001/api/ingredients/${recipeId}`)
      ]);
      const recipeData = await recipeRes.json();
      const ingredientsData = await ingredientsRes.json();
      const calRes = await fetch(`http://localhost:3001/api/recipes/${recipeId}/calories`);
      const calData = await calRes.json();
  
      const imageTitle = titleOverride || recipeData.RecipeTitle;
      let imageUrl = state.recipeImage;  // Default: reuse existing
      if (state.imageSearchOn) {
        imageUrl = await getRecipeImage(imageTitle);
      }
  
      setState(prev => ({
        ...prev,
        selectedRecipe: recipeData,
        selectedRecipeIngredients: ingredientsData,
        recipeImage: imageUrl,
        calories: calData.calories,
        closestRecipeId: calData.closestRecipeId,
        closestRecipeTitle: calData.closestRecipeTitle
      }));
    } catch (err) {
      console.error("Failed to load recipe details:", err);
    }
  };
  

  const handleNext = () => {
    if (selectedRecipe && searchResults.length > 0) {
      const nextIndex = (searchIndex + 1) % searchResults.length;
      setState(prev => ({ ...prev, searchIndex: nextIndex }));
      const nextRecipe = searchResults[nextIndex];
      handleSelectRecipe(nextRecipe.RecipeID, nextRecipe.RecipeTitle);
    } else {
      fetchRandomRecipe();
    }
  };

  const fetchRandomRecipe = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const recipeResponse = await fetch("http://localhost:3001/api/recipes/random");
      const recipeData = await recipeResponse.json();
      const calRes = await fetch(`http://localhost:3001/api/recipes/${recipeData.RecipeID}/calories`);
      const calData = await calRes.json();
  
      let imageUrl = state.recipeImage; // Reuse
      if (state.imageSearchOn) {
        imageUrl = await getRecipeImage(recipeData.RecipeTitle);
      }
  
      const ingResponse = await fetch(`http://localhost:3001/api/ingredients/${recipeData.RecipeID}`);
      const ingredientsData = await ingResponse.json();
  
      setState(prev => ({
        ...prev,
        randomRecipe: recipeData,
        recipeIngredients: ingredientsData,
        recipeImage: imageUrl,
        loading: false,
        calories: calData.calories,
        closestRecipeId: calData.closestRecipeId,
        closestRecipeTitle: calData.closestRecipeTitle
      }));
    } catch (error) {
      console.error("Error fetching recipe data:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };
  

  useEffect(() => {
    if (!randomRecipe) {
      fetchRandomRecipe();
    }
  }, []);

  // Check if the current recipe is saved
  const checkIfSaved = async (recipeId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !recipeId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/actions/check-saved?userId=${user.UserID}&recipeId=${recipeId}`
      );
      const data = await response.json();
      setIsSaved(data.isSaved);
    } catch (err) {
      console.error("Error checking saved status:", err);
    }
  };

  useEffect(() => {
    const recipeToCheck = selectedRecipe || randomRecipe;
    if (recipeToCheck) {
      checkIfSaved(recipeToCheck.RecipeID);
    }
  }, [selectedRecipe, randomRecipe]);


  const fetchSavedRecipes = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      try {
        const response = await fetch(`http://localhost:3001/api/actions/saved/${user.UserID}`);
        const data = await response.json();
        setSavedRecipes(data);
      } catch (err) {
        console.error("Error fetching saved recipes:", err);
      }
    }
  };

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  // Handle save/unsave toggle
  const handleSaveToggle = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const recipeToSave = selectedRecipe || randomRecipe;
    
    if (!user || !recipeToSave) return;

    try {
      if (isSaved) {
        const response = await fetch(
          `http://localhost:3001/api/actions/save?userId=${user.UserID}&recipeId=${recipeToSave.RecipeID}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setIsSaved(false);
          setSavedRecipes(prev => prev.filter(recipe => recipe.RecipeID !== recipeToSave.RecipeID));
        }
      } else {
        const response = await fetch('http://localhost:3001/api/actions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.UserID,
            recipeId: recipeToSave.RecipeID
          })
        });

        if (response.ok) {
          setIsSaved(true);
          setSavedRecipes(prev => [{
            ...recipeToSave,
            SavedTime: new Date().toISOString()
          }, ...prev]);
        }
      }
    } catch (err) {
      console.error("Error toggling save status:", err);
    }
  };

  const renderDirections = (directions) => {
    const steps = Array.isArray(directions) ? directions : JSON.parse(directions || "[]");
    if (steps.length === 0) return <p className="text-gray-500">No directions provided.</p>;

    const firstSteps = steps.slice(0, 2);
    const lastSteps = steps.slice(-2);
    const hasMiddleSteps = steps.length > 4;

    return (
      <div className="space-y-4">
        {firstSteps.map((step, index) => (
          <div key={`first-${index}`} className="flex group">
            <div className="mr-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold border-2 border-orange-200 group-hover:border-orange-500 transition-colors duration-200">
                {index + 1}
              </div>
              {(index < 1 || hasMiddleSteps) && (
                <div className="w-0.5 h-full bg-orange-100 my-1"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-orange-200 transition-colors duration-200">
                <p className="text-gray-700">{step}</p>
                {step.toLowerCase().includes("minutes") && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {step.match(/\d+\s*minutes/)[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {hasMiddleSteps && (
          <div className="flex items-center py-4">
            <div className="mr-4 flex flex-col items-center">
              <div className="w-8 flex justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mx-0.5"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mx-0.5"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mx-0.5"></div>
              </div>
              <div className="w-0.5 h-full bg-orange-100 my-1"></div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 italic px-4">{steps.length - 4} more steps...</div>
            </div>
          </div>
        )}

        {lastSteps.map((step, index) => (
          <div key={`last-${index}`} className="flex group">
            <div className="mr-4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold border-2 border-orange-200 group-hover:border-orange-500 transition-colors duration-200">
                {steps.length - 2 + index + 1}
              </div>
              {index < 1 && <div className="w-0.5 h-full bg-orange-100 my-1"></div>}
            </div>
            <div className="flex-1">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-orange-200 transition-colors duration-200">
                <p className="text-gray-700">{step}</p>
                {step.toLowerCase().includes("minutes") && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {step.match(/\d+\s*minutes/)[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );

  if (!randomRecipe)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">No recipe found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">BiteMatch</h1>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/", { replace: true });
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          Logout
        </button>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Search by Ingredients</h2>

              <div className="mb-4">
                <div className="relative flex">
                  <input
                    type="text"
                    placeholder="Enter ingredient..."
                    value={ingredientInput}
                    onChange={(e) => setState(prev => ({ ...prev, ingredientInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addIngredient();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={addIngredient}
                    className="absolute right-0 h-full px-3 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 flex items-center justify-center"
                    aria-label="Add ingredient"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {ingredientList.length > 0 && (
                <div className="mb-4 space-y-2">
                  {ingredientList.map((ing, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-gray-700 flex items-center justify-between bg-orange-50 px-3 py-1 rounded-md"
                    >
                      <span className="flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-2 flex-shrink-0"></span>
                        {ing}
                      </span>
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="text-orange-500 hover:text-orange-700 text-sm ml-2"
                        aria-label={`Remove ${ing}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSearch}
                className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 transition-colors"
                disabled={ingredientList.length === 0}
              >
                Search
              </button>

              {searchPerformed && (
                <div className="mt-4">
                  {searchResults.length > 0 ? (
                    <>
                      <ul className="space-y-2">
                        {searchResults.slice(displayCount - 10, displayCount).map((recipe) => (
                          <li key={recipe.RecipeID}>
                            <button
                              onClick={() => handleSelectRecipe(recipe.RecipeID)}
                              className="text-left text-orange-600 hover:underline w-full"
                            >
                              {recipe.RecipeTitle}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {searchResults.length > 10 && (
                        <button
                          onClick={loadMore}
                          className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm"
                        >
                          Show Different Recipes
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No recipes found for these ingredients.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-5">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                <img
                  src={recipeImage}
                  alt={(selectedRecipe || randomRecipe)?.RecipeTitle}
                  className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  <Link
                    to={`/recipe/${(selectedRecipe || randomRecipe)?.RecipeID}`}
                    state={{ imageUrl: recipeImage }}
                    className="hover:text-orange-600 transition-colors duration-200"
                  >
                    {(selectedRecipe || randomRecipe)?.RecipeTitle}
                  </Link>
                </h2>
                <div className="flex items-center text-gray-600 mb-2">
                  <div className="inline-flex items-center bg-orange-50 px-3 py-1 rounded-md border border-orange-100">
                    <svg className="w-4 h-4 text-orange-500 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V20M18 8L6 16M6 8L18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-medium">
                      {calories != null
                        ? `${calories} Calories`
                        : "Loading calories..."}
                    </span>
                  </div>
                </div>

                <div className="text-left text-gray-600 text-lg mb-2">
                  Recipe With Similar Ingredients:{" "}
                  <button
                    onClick={() => handleSelectRecipe(state.closestRecipeId)}
                    className="text-orange-500 hover:underline"
                  >
                    {state.closestRecipeTitle}
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-2">Ingredients</h3>
                {(selectedRecipe ? selectedRecipeIngredients : recipeIngredients).length === 0 ? (
                  <p className="text-gray-500">No ingredients found.</p>
                ) : (
                  <ul className="space-y-2 mb-6">
                    {(selectedRecipe ? selectedRecipeIngredients : recipeIngredients).slice(0, 6).map(
                      (ingredient, index) => (
                        <li
                          key={ingredient.IngredientID || index}
                          className="text-gray-700 flex items-start"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 mr-2 flex-shrink-0"></span>
                          <span>
                            {ingredient.Quantity && `${ingredient.Quantity} `}
                            {ingredient.IngredientName_Recipe}
                          </span>
                        </li>
                      )
                    )}
                    {(selectedRecipe ? selectedRecipeIngredients : recipeIngredients).length > 6 && (
                      <li className="text-gray-500 italic text-sm">
                        + {(selectedRecipe ? selectedRecipeIngredients : recipeIngredients).length - 6} more
                      </li>
                    )}
                  </ul>
                )}

                <div className="flex space-x-4 mt-4">
                  <button 
                    onClick={handleSaveToggle}
                    className={`flex-1 px-4 py-2 ${
                      isSaved 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200`}
                  >
                    {isSaved ? 'Unsave' : 'Save'}
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved</h2>
              <div className="space-y-4">
                {savedRecipes.map(recipe => (
                  <div 
                    key={recipe.RecipeID}
                    className="flex items-center justify-between space-x-3 p-3 hover:bg-orange-50 rounded-md transition-colors duration-200 border border-gray-100 group"
                  >
                    <div 
                      className="flex items-center space-x-4 flex-grow cursor-pointer"
                      onClick={() => {
                        navigate(`/recipe/${recipe.RecipeID}`);
                      }}
                      title="View recipe details"
                    >
                      <div 
                        className="w-16 h-16 rounded-md bg-orange-50 flex items-center justify-center border border-orange-100 overflow-hidden p-1 shadow-sm group-hover:border-orange-300 transition-colors"
                      >
                        <span className="text-3xl flex items-center justify-center text-center leading-tight group-hover:scale-110 transition-transform">{getRecipeEmoji(recipe.RecipeTitle)}</span>
                      </div>
                      <span className="text-sm font-medium group-hover:text-orange-600 transition-colors">
                        {recipe.RecipeTitle}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        const user = JSON.parse(localStorage.getItem('user'));
                        if (!user) return;
                        
                        try {
                          const response = await fetch(
                            `http://localhost:3001/api/actions/save?userId=${user.UserID}&recipeId=${recipe.RecipeID}`,
                            { method: 'DELETE' }
                          );
                          
                          if (response.ok) {
                            setSavedRecipes(prev => 
                              prev.filter(r => r.RecipeID !== recipe.RecipeID)
                            );
                            if ((selectedRecipe?.RecipeID || randomRecipe?.RecipeID) === recipe.RecipeID) {
                              setIsSaved(false);
                            }
                          }
                        } catch (err) {
                          console.error("Error removing saved recipe:", err);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {savedRecipes.length === 0 && (
                  <p className="text-gray-500 text-sm">No saved recipes yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("user") !== null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInForm />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipe/:id"
        element={
          <ProtectedRoute>
            <RecipeDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
