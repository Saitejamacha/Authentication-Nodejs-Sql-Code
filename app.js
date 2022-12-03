const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http:localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error ${e.message}`);
    process.exit(1);
  }
};

initializeDb();

//API1 Register User
// If the username already exists it returns (User already exists)
// If the registrant provides a password with less than 5 characters it returns (Password is too short)
// Successful registration of the registrant it return (User created successfully)

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const isUsernameAvailable = `SELECT * FROM user WHERE username = '${username}'`;

  const dbUser = await db.get(isUsernameAvailable);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const createUserId = `INSERT INTO
            user (username, name, password, gender, location)
            values(
                  '${username}',
                  '${name}',
                  '${hashedPassword}',
                  '${gender}',
                  '${location}')`;
      const dbResponse = await db.run(createUserId);
      const newUserId = dbResponse.lastID;
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

// API 2 Loging

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const isUsernameAvailable = `SELECT * FROM user WHERE username = '${username}'`;

  const dbUser = await db.get(isUsernameAvailable);

  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const ispasswordMatch = await bcrypt.compare(password, dbUser.password);

    if (ispasswordMatch === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

//API 3 Password Updating

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const updatePassword = `UPDATE user 
                SET  
                     "password" =  "${newPassword}"
                WHERE 
                      "username" =  "${username}"`;
  const isUserDetails = `SELECT * FROM user WHERE username = '${username}'`;

  const dbUser = await db.get(isUserDetails);

  const ispasswordMatc = oldPassword === dbUser.password;

  //   console.log(ispasswordMatc);
  //   console.log(oldPassword);
  //   console.log(dbUser);

  if (ispasswordMatc === true) {
    if (newPassword.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      await db.run(updatePassword);
      response.status = 200;
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});
