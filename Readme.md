--bcrypt is designed to be computationally expensive to slow down brute-force attacks. It uses a key stretching technique to make the hashing process slower, which makes it more secure against attacks.

--bcrypt automatically generates a salt for each password, which is combined with the password before hashing. This means that even if two users have the same password, their hashed passwords will be different.

--In Mongoose, pre middleware functions are executed before certain operations, such as saving a document. The pre('save', ...) middleware is specifically run before a document is saved to the database.

--By using validator, you can easily perform checks like validating email addresses, URLs, credit card numbers, and more, as well as sanitizing inputs to prevent malicious content like SQL injection or XSS attacks.

--v is the value of the email field being validated.The function uses a regular expression (/^.+@lnmiit\.ac\.in$/) to test if the email ends with @lnmiit.ac.in. 
return /^.+@lnmiit\.ac\.in$/.test(v); returns true if the email matches the pattern, otherwise false.

--When you define a field with the enum property, Mongoose will ensure that the value of that field must be one of the values listed in the array you provide. If an attempt is made to save a value that is not included in the array, Mongoose will throw a validation error.