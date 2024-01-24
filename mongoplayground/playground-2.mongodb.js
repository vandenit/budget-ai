/* global use, db */
use("budgetDG");

db.getCollection("localtransactions").find({ date: { $exists: true } });
db.getCollection("localtransactions").count({
  budgetId: "7812a588-8c0d-40fe-b6d9-6da6d7025056",
});

const month = "2024-01";
const budgetId = "658590a320511d33897ae7b7";

const dateFilter = { $regex: `^${month}` };
db.getCollection("localtransactions").find({
  budgetId,
  date: dateFilter,
});

db.getCollection("localtransactions").find({
  budgetId: "1b443ebf-ea07-4ab7-8fd5-9330bf80608c",
  date: { $regex: "^2024-01" },
});
db.getCollection("localtransactions").find({
  budgetId: "b84f2a66-8d15-42ba-ae09-9163e01125b9",
  date: { $exists: true },
});

db.getCollection("usertransactions").find({
  budgetId: "b84f2a66-8d15-42ba-ae09-9163e01125b9",
});

//db.getCollection("usertransactions").drop({});
db.getCollection("usertransactions").remove({});
db.getCollection("localtransactions").remove({});

db.getCollection("localtransactions").find({
  id: "73879cc3-a21c-4c5f-b31d-6e7f4acbe22d",
});
db.getCollection("localtransactions").remove({
  id: "ec7454c7-25fd-42e7-9988-0ee26b1de254",
});

db.getCollection("user").find();
