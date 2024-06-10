/* global use, db */
use("budgetDG");

db.getCollection("user").insertMany({
  name: "John Doe",
  email: "",
});
