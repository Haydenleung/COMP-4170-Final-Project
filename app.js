import express from "express";
import pg from "pg"

const app = express();
const port = 3000;

let savedUsername = "";
let savedOption = "";
let savedCoffee = [];

function getPeriod() {
  var monday = new Date();
  monday.setDate(monday.getDate() + (((1 + 7 - monday.getDay()) % 7) || 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const outputText = `${monthNames[monday.getMonth()]} ${monday.getDate()} - ${monthNames[sunday.getMonth()]} ${sunday.getDate()}`;
  return outputText;
}

const dateText = getPeriod();

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "sevensips",
  password: "123456",
  port: 5432,
});
db.connect();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/main", (req, res) => {
  res.render("main.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/getData", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  if (email !== "" && email !== null && username !== "" && username !== null && password !== "" && password !== null) {

    try {
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      const checkResultTwo = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);

      if (checkResult.rows.length > 0) {
        res.render("register.ejs", { errorMessage: "Email already exists" });
      } else if (checkResultTwo.rows.length > 0) {
        res.render("register.ejs", { errorMessage: "Username already exists" });
      } else {
        const result = await db.query(
          "INSERT INTO users (email, username, password) VALUES ($1, $2, $3)",
          [email, username, password]
        );
        const resultTwo = await db.query(
          "INSERT INTO subscription (username, option) VALUES ($1, $2)",
          [username, "1"]
        );
        const resultThree = await db.query(
          "INSERT INTO coffee (username, dateperiod) VALUES ($1, $2)",
          [username, dateText]
        );
        console.log(result);
        console.log(resultTwo);
        res.render("index.ejs", { successMessage: "Thanks for signing up. You can login now." });
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    res.render("register.ejs", { errorMessage: "Missing Information" });
  }
});

app.post("/", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username !== "" && username !== null && password !== "" && password !== null) {

    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedPassword = user.password;

        if (password === storedPassword) {
          savedUsername = username;
          const resultTwo = await db.query("SELECT * FROM subscription WHERE username = $1", [
            savedUsername
          ]);
          const userTwo = resultTwo.rows[0];
          const useroption = userTwo.option;
          savedOption = useroption;

          const resultThree = await db.query("SELECT * FROM coffee WHERE username = $1 AND dateperiod = $2", [
            savedUsername, dateText
          ]);
          if (resultThree.rows.length > 0) {
            const userThree = resultThree.rows[0];
            savedCoffee = userThree.selection;
            console.log(savedCoffee);
            savedCoffee = JSON.parse(savedCoffee);
            res.render('main.ejs', { username: savedUsername, defaultoption: savedOption, datePeriod: dateText, coffeeoption: savedCoffee });
          } else {
            res.render('main.ejs', { username: savedUsername, defaultoption: savedOption, datePeriod: dateText });
          }
        } else {
          savedUsername = "";
          res.render("index.ejs", { errorMessage: "Incorrect Password" });
        }
      } else {
        savedUsername = "";
        res.render("index.ejs", { errorMessage: "User not found" });
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    res.render("index.ejs", { errorMessage: "Missing Information" });
  }
});

app.post("/main", async (req, res) => {
  const username = savedUsername;
  const useroption = req.body.useroption;
  const coffeeoption = req.body.coffeecheckbox;

  try {
    const result = await db.query("SELECT * FROM coffee WHERE username = $1 AND dateperiod = $2", [username, dateText]);

    if (result.rows.length > 0) {
      await db.query("UPDATE coffee SET selection = $1 WHERE username = $2 AND dateperiod = $3", [JSON.stringify(coffeeoption), username, dateText]);
      savedCoffee = coffeeoption;
    } else {
      const resultTwo = await db.query(
        "INSERT INTO coffee (username, dateperiod, selection) VALUES ($1, $2, $3)",
        [username, dateText, JSON.stringify(coffeeoption)]
      );
      savedCoffee = coffeeoption;
    }

    await db.query("UPDATE subscription SET option = $1 WHERE username = $2", [useroption, username]);
    savedOption = useroption;

    res.render('main.ejs', { username: savedUsername, defaultoption: savedOption, datePeriod: dateText, coffeeoption: savedCoffee, updateMessage: "Saved Successfully!" });
  } catch (err) {
    console.log(err);
  }

});

app.get("/edit", (req, res) => {
  if (!savedUsername) {
    return res.redirect("/main");
  }
  res.render("edit.ejs", { username: savedUsername });
});

app.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const username = savedUsername;

  if (!username) {
    return res.status(403).send("Not logged in");
  }

  if (newPassword !== confirmNewPassword) {
    return res.render("edit.ejs", { username: savedUsername, errorMessage: "New passwords DID NOT match!" });
  }

  try {
    const userResult = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.render("edit.ejs", { username: savedUsername, errorMessage: "User not found." });
    }

    const user = userResult.rows[0];
    if (user.password !== oldPassword) {
      return res.render("edit.ejs", { username: savedUsername, errorMessage: "Old password is INCORRECT!" });
    }

    await db.query("UPDATE users SET password = $1 WHERE username = $2", [newPassword, username]);
    res.render("edit.ejs", { username: savedUsername, successMessage: "Password changed successfully :)" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
  res.render('main.ejs')
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});