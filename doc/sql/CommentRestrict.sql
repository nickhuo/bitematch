DELIMITER $$

CREATE TRIGGER validate_review_length
BEFORE INSERT ON Review
FOR EACH ROW
BEGIN
  IF CHAR_LENGTH(NEW.Comments) < 5 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Comment must be at least 5 characters long';
  END IF;
END$$

DELIMITER ;