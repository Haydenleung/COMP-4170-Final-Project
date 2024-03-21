import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/main", (req, res) => {
    res.render("main.ejs");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
