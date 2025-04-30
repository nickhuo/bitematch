Comments:
Grade 16/20

-1 no arrows should be linking attributes to entities;

-1 incomplete ER. If reviewers have FK to Recipes, then why are there no relationships between Recipesand Review?

-1 if Recipe uniquely determines RestuarantPrice, assuming 3NF, they should be in the same table no?

-1 the ER does not fully comply with the project proposal. There are no Calendar; meal planning; video components inside the ER.

Change:
1. Removed arrows linking attributes and entities (address comment 1)
2. New relationship between Recipes and Reviews (address comment 2)
3. Added Video Entity and we decides not to implement Calendar which approved by TA. (address comment 4)
4. Video Entity connect to Recipe in a many to one relationship, Guides, removing the RestaurantPrice causing issue in comment 3 (address comment 3)