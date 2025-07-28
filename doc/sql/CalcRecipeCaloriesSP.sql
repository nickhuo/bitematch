DELIMITER $$

DROP FUNCTION IF EXISTS ConvertQtyToGrams$$
DROP PROCEDURE IF EXISTS CalcRecipeCalories$$

CREATE FUNCTION ConvertQtyToGrams(qty VARCHAR(255))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  DECLARE num DECIMAL(10,4);
  DECLARE unit VARCHAR(64);
  DECLARE num_str VARCHAR(64);

  SET num_str = REGEXP_SUBSTR(qty, '^[0-9]+(\\.[0-9]+)?');
  IF num_str IS NULL OR num_str = '' THEN
    SET num_str = '1';
  END IF;
  SET num = CAST(num_str AS DECIMAL(10,4));

  SET unit = LOWER(
    TRIM(
      REPLACE(
        REPLACE(
          SUBSTRING_INDEX(qty, ' ', -1),
        ',', ''),
      '.', '')
    )
  );

  RETURN CASE
    WHEN unit IN ('cup','cups','c') 
      THEN num * 236.588
    WHEN unit IN ('tbsp','tablespoon','tablespoons') 
      THEN num * 14.7868
    WHEN unit IN ('tsp','teaspoon','teaspoons') 
      THEN num * 4.92892
    WHEN unit IN ('quart','quarts') 
      THEN num * 946.353
    WHEN unit IN ('ounce','ounces','oz') 
      THEN num * 28.3495
    WHEN unit IN ('pound','pounds','lb','lbs') 
      THEN num * 453.592
    WHEN unit IN ('liter','litre','liters','litres') 
      THEN num * 1000
    WHEN unit IN ('milliliter','millilitre','milliliters','millilitres','ml') 
      THEN num * 1
    WHEN unit IN ('gram','grams','g') 
      THEN num * 1
    ELSE 
      num * 300
  END;
END$$

CREATE PROCEDURE CalcRecipeCalories(IN in_recipe_id INT)
BEGIN
  DECLARE v_total_calories  DECIMAL(10,2);
  DECLARE v_closest_id      INT;
  DECLARE v_closest_title   VARCHAR(255);
  DECLARE v_shared_count    INT;

  -- Calculate calories
  SELECT
    ROUND(
      SUM(
        i.CaloriesPerUnit * (ConvertQtyToGrams(co.Quantity) / 100)
      ), 2
    ) 
  INTO v_total_calories
  FROM Recipe AS r
  JOIN ComposedOf AS co ON co.RecipeID = r.RecipeID
  JOIN Ingredients AS i ON i.IngredientID = co.IngredientID
  WHERE co.IngredientID IS NOT NULL
    AND r.RecipeID = in_recipe_id
  GROUP BY r.RecipeID;

  -- Find tied closest recipes and pick one randomly
  SELECT
    x.RecipeID,
    x.RecipeTitle,
    x.SharedIngredientCount
  INTO
    v_closest_id,
    v_closest_title,
    v_shared_count
  FROM (
    SELECT
      r2.RecipeID,
      r2.RecipeTitle,
      COUNT(*) AS SharedIngredientCount
    FROM ComposedOf AS co1
    JOIN ComposedOf AS co2 ON co1.IngredientID = co2.IngredientID
    JOIN Recipe AS r2 ON co2.RecipeID = r2.RecipeID
    WHERE co1.RecipeID = in_recipe_id
      AND co2.RecipeID <> in_recipe_id
    GROUP BY r2.RecipeID, r2.RecipeTitle
    HAVING SharedIngredientCount = (
      SELECT MAX(shared_count) FROM (
        SELECT COUNT(*) AS shared_count
        FROM ComposedOf AS co1
        JOIN ComposedOf AS co2 ON co1.IngredientID = co2.IngredientID
        WHERE co1.RecipeID = in_recipe_id
          AND co2.RecipeID <> in_recipe_id
        GROUP BY co2.RecipeID
      ) AS temp
    )
    ORDER BY RAND()  -- Randomize among the tied recipes
    LIMIT 1
  ) AS x;

  -- Return everything
  SELECT
    v_total_calories  AS TotalCalories,
    v_closest_id      AS ClosestRecipeID,
    v_closest_title   AS ClosestRecipeTitle,
    v_shared_count    AS SharedIngredientCount;
END$$

DELIMITER ;
