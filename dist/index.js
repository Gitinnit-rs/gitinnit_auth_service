"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
// TODO: Find a better way to do this
const CALLBACK_URL = (_a = process.env.CALLBACK_URL) !== null && _a !== void 0 ? _a : "NoCallbackURLFound";
const SESSION_SECRET = (_b = process.env.SESSION_SECRET) !== null && _b !== void 0 ? _b : "NoSecretsFound";
const CLIENT_ID = (_c = process.env.CLIENT_ID) !== null && _c !== void 0 ? _c : "NoClientIdFound";
const CLIENT_SECRET = (_d = process.env.CLIENT_SECRET) !== null && _d !== void 0 ? _d : "NoClientSecretFound";
const SESSION_NAME = (_e = process.env.SESSION_NAME) !== null && _e !== void 0 ? _e : "NoSessionNameFound";
// MIDDLEWARE for the application
app.use((0, express_session_1.default)({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { path: "/", secure: false },
    name: SESSION_NAME,
}));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// User obj mapping
passport_1.default.serializeUser(function (user, done) {
    done(null, user);
});
passport_1.default.deserializeUser(function (obj, done) {
    done(null, obj);
});
// Defining the Strategies
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
    if (!accessToken) {
        let err = new Error("No accessToken Found");
        return done(err, profile);
    }
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    return done(null, profile);
}));
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
    let returnUrl = req.query.returnUrl;
    const auth = passport_1.default.authenticate("github", {
        scope: ["user:email", "repo", "repo:invite", "user:follow", "project"],
        state: JSON.stringify({ returnUrl }),
    });
    auth(req, res);
});
app.get("/auth/github/callback", passport_1.default.authenticate("github", { failureRedirect: "/login" }), function (req, res) {
    if (req.user) {
        res.redirect(`/auth/result?returnUrl=${JSON.parse(req.query.state).returnUrl}`);
    }
});
app.get("/auth/result", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Successful authentication, redirect home.
    let returnUrl = req.query.returnUrl;
    if (returnUrl === "") {
        res.send("<h1>SOMETHING WENT WRONG</h1>");
        return;
    }
    else if (req.user) {
        returnUrl +=
            "?access_token=" +
                req.user.accessToken +
                "&&refresh_token=" +
                req.user.refreshToken;
        res.redirect(returnUrl);
    }
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
