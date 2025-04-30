// src/HomeContext.js
import React, { createContext, useState } from "react";

export const HomeContext = createContext();

export function HomeProvider({ children }) {
  const [state, setState] = useState({
    randomRecipe: null,
    recipeIngredients: [],
    recipeImage: "https://via.placeholder.com/400",
    loading: true,
    imageSearchOn: true,
    ingredientInput: "",
    ingredientList: [],
    searchResults: [],
    searchPerformed: false,
    selectedRecipe: null,
    selectedRecipeIngredients: [],
    searchIndex: 0,
    calories: null,
    closestRecipeId:    null,
    closestRecipeTitle: null,
  });

  return (
    <HomeContext.Provider value={{ state, setState }}>
      {children}
    </HomeContext.Provider>
  );
}
