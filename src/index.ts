import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import session from "express-session";
import bodyParser from "body-parser";
import passport from "passport";
import { Strategy as GithubStrategy } from "passport-github2";
import axios from "axios";
dotenv.config();

const app: Express = express();
const port = process.env.PORT;

// TODO: Find a better way to do this
const CALLBACK_URL = process.env.CALLBACK_URL ?? "NoCallbackURLFound";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "NoSecretsFound";
const CLIENT_ID = process.env.CLIENT_ID ?? "NoClientIdFound";
const CLIENT_SECRET = process.env.CLIENT_SECRET ?? "NoClientSecretFound";
const SESSION_NAME = process.env.SESSION_NAME ?? "NoSessionNameFound";

// MIDDLEWARE for the application
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { path: "/", secure: false },
    name: SESSION_NAME,
  }),
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

// User obj mapping
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj: any, done) {
  done(null, obj);
});

// Defining the Strategies
passport.use(
  new GithubStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: Record<string, string>,
      done: any,
    ) => {
      if (!accessToken) {
        let err = new Error("No accessToken Found");
        return done(err, profile);
      }
      profile.accessToken = accessToken;
      return done(null, profile);
    },
  ),
);

let returnUrl = "http://localhost:8000/user";

// Defining the routes for the application
app.get("/login", (req, res) => {
  console.log(req.query);
  returnUrl = req.query.returnUrl as string;
  res.send(
    "<a href='/auth/github' target=_blank onclick='return window.close();'>AUTH WITH GITHUB </a>",
  );
});
app.get(
  "/auth/github",
  passport.authenticate("github", {
    scope: ["user:email", "repo", "repo:invite", "user:follow", "project"],
  }),
  function (req, res) {
    // functions is not called ever
  },
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    if (req.user) {
      res.redirect("/auth/result");
    }
  },
);

app.get("/auth/result", async (req, res) => {
  // Successful authentication, redirect home.
  console.log("SENDING USER");
  await axios.post(returnUrl, {
    user: req.user,
  });
  console.log("SENT USER");
  res.send("<script>window.close();</script>");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
