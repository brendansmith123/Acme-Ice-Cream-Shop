const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_32"
);

app.use(express.json());
app.use(require("morgan")("dev"));

//READ
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * from flavors`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//CREATE
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1, $2)
      RETURNING *
      `;
    const response = client.query(SQL, [req.body.name, req.body.is_favorite]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//UPDATE
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
         UPDATE flavors
         SET name=$1, is_favorite=$2, updated_at=now()
         WHERE id=$3
         RETURNING *
         `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
            DELETE from flavors
            WHERE id=$1
            `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//init function
const init = async () => {
  await client.connect();
  console.log("connected to the database");
  let SQL = `
  DROP TABLE IF EXISTS flavors;
  CREATE TABLE flavors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      is_favorite BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now()
  )
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
    INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Strawberry', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Cookies and Cream', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', true);
    `;
  await client.query(SQL);
  console.log("data seeded");
  //DATABASE SYNC
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
