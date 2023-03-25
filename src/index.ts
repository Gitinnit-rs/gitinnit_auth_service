import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import session from "express-session";
import bodyParser from "body-parser";
import passport from "passport";
import { Strategy as GithubStrategy } from "passport-github2";
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
      profile.refreshToken = refreshToken;
      return done(null, profile);
    },
  ),
);

// // Defining the routes for the application
// app.get("/login", (req, res) => {
//   // expected return url format: "http://localhost:3000/login?returnUrl=" + encodeURIComponent(returnUrl with the endpoint where expecting post call)
//   let returnUrl = req.query.returnUrl as string;
//   // TODO: Create a webpage to render options for auth
//   res.send(
//     `<a href='/auth/github?returnUrl=${returnUrl}' target=_blank onclick='return window.close();'>AUTH WITH GITHUB </a>`,
//   );
// });

app.get("/auth/github", function (req, res) {
  let returnUrl = req.query.returnUrl as string;
  const auth = passport.authenticate("github", {
    scope: ["user:email", "repo", "repo:invite", "user:follow", "project"],
    state: JSON.stringify({ returnUrl }),
  });
  auth(req, res);
});

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    if (req.user) {
      res.redirect(
        `/auth/result?returnUrl=${
          JSON.parse(req.query.state as string).returnUrl
        }`,
      );
    }
  },
);

app.get("/auth/result", async (req, res) => {
  // Successful authentication, redirect home.
  let returnUrl = req.query.returnUrl as string;
  if (returnUrl === "") {
    res.send("<h1>SOMETHING WENT WRONG</h1>");
    return;
  } else if (req.user) {
    returnUrl +=
      "?access_token=" +
      req.user.accessToken +
      "&&refresh_token" +
      req.user.refreshToken;
    res.redirect(returnUrl);
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
